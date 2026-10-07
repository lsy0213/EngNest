"""学习进度：存在数据目录的 progress.db（SQLite），每个顶层字段一行。

- 前端只把改动过的字段发过来（patch），不用每次重写整份进度；
- 电脑和局域网里的其他设备共用一份进度：写入时按记录合并（见 merge_value），不是谁后写就整份覆盖；
- 删除的记录在 deleted 里留一个「墓碑」{字段: {记录键: 删除时间}}，合并时不会被另一台设备的旧数据带回来；
- 每天自动备份一份 JSON 到 backups/（保留最近 7 天），数据库损坏时自动用最近的备份恢复；
- 旧版本的 progress.json 第一次启动时导入，原文件改名为 progress.json.migrated 留作备份。
"""

import json
import logging
import sqlite3
import threading
import time
from pathlib import Path

from . import APP_NAME, VERSION
from .paths import data_dir, sub_dir

log = logging.getLogger(__name__)

KEEP_BACKUPS = 7
TOMBSTONE_DAYS = 180
REVLOG_MAX = 30000

# 只增不减的计数：合并时取较大的
MAX_KEYS = {"xp"}
MAX_DICT_KEYS = {"stats"}  # 字段 → 数字，逐项取大
DAY_KEYS = {"days"}        # 日期 → {xp, new, review}，逐项取大


def _norm(s) -> str:
    return " ".join(str(s or "").lower().split())


# 列表字段：怎么认出「同一条记录」（前端 core.js 里的 RECORD_ID 必须和这里一致）
LIST_ID = {
    "notebook": lambda x: _norm(x.get("w")),
    "sentence_nb": lambda x: _norm(x.get("en")),
    "clips": lambda x: f"{x.get('video', '')}|{_norm(x.get('en'))}",
}


def _list_id(key, item):
    if not isinstance(item, dict):
        return None
    if key in LIST_ID:
        return LIST_ID[key](item)
    if "id" in item:
        return str(item["id"])
    return None


def _stamp(rec) -> float:
    return float(rec.get("t") or 0) if isinstance(rec, dict) else 0.0


def _pick(old, new):
    """同一条记录两边都有：修改时间新的赢；没有时间的，复习次数多的赢；再分不出来用新传来的。"""
    if not (isinstance(old, dict) and isinstance(new, dict)):
        return new
    to, tn = _stamp(old), _stamp(new)
    if to != tn:
        return old if to > tn else new
    for f in ("seen", "n", "reps"):
        a, b = old.get(f), new.get(f)
        if isinstance(a, (int, float)) and isinstance(b, (int, float)) and a != b:
            return old if a > b else new
    return new


def _max_merge(old: dict, new: dict) -> dict:
    out = dict(old)
    for k, v in new.items():
        a = out.get(k)
        out[k] = max(a, v) if isinstance(a, (int, float)) and isinstance(v, (int, float)) else v
    return out


def merge_value(key, old, new, deleted=None):
    """把同一个字段的两份数据合并成一份。old 是已保存的，new 是刚传来的。"""
    tomb = (deleted or {}).get(key) or {}
    if old is None:
        merged = new
    elif key in MAX_KEYS and isinstance(old, (int, float)) and isinstance(new, (int, float)):
        merged = max(old, new)
    elif key in MAX_DICT_KEYS and isinstance(old, dict) and isinstance(new, dict):
        merged = _max_merge(old, new)
    elif key in DAY_KEYS and isinstance(old, dict) and isinstance(new, dict):
        merged = dict(old)
        for d, rec in new.items():
            merged[d] = _max_merge(merged[d], rec) if isinstance(merged.get(d), dict) and isinstance(rec, dict) else rec
    elif key == "deleted" and isinstance(old, dict) and isinstance(new, dict):
        merged = {k: dict(v) for k, v in old.items() if isinstance(v, dict)}
        for kind, ids in new.items():
            if isinstance(ids, dict):
                merged.setdefault(kind, {}).update({i: max(t, merged.get(kind, {}).get(i, 0)) for i, t in ids.items()})
    elif key == "revlog" and isinstance(old, list) and isinstance(new, list):
        seen, merged = set(), []
        for e in sorted(old + new, key=lambda e: e[1] if isinstance(e, list) and len(e) > 1 else 0):
            ident = f"{e[0]}|{e[1]}" if isinstance(e, list) and len(e) > 1 else json.dumps(e)
            if ident not in seen:
                seen.add(ident)
                merged.append(e)
        merged = merged[-REVLOG_MAX:]
    elif key == "prefs" and isinstance(old, dict) and isinstance(new, dict):
        merged = {**old, **new}
    elif isinstance(old, dict) and isinstance(new, dict):
        merged = dict(old)
        for k, v in new.items():
            merged[k] = _pick(merged[k], v) if k in merged else v
    elif isinstance(old, list) and isinstance(new, list) and all(_list_id(key, x) is not None for x in old + new):
        # 新传来的顺序在前（最近加的在最前面），旧数据里另一台设备加的接在后面
        ids = {_list_id(key, x): x for x in old}
        merged, seen = [], set()
        for x in new:
            i = _list_id(key, x)
            if i in seen:
                continue
            seen.add(i)
            merged.append(_pick(ids[i], x) if i in ids else x)
        merged += [x for x in old if _list_id(key, x) not in seen and not seen.add(_list_id(key, x))]
    else:
        merged = new
    if tomb:
        if isinstance(merged, dict) and key not in ("deleted", "prefs"):
            merged = {k: v for k, v in merged.items() if not (k in tomb and _stamp(v) < tomb[k])}
        elif isinstance(merged, list):
            merged = [x for x in merged if not ((i := _list_id(key, x)) in tomb and _stamp(x) < tomb[i])]
    return merged


def merge_all(old: dict, new: dict) -> dict:
    """两份完整的进度合并（导入备份、WebDAV 同步用）"""
    out = dict(old)
    deleted = merge_value("deleted", old.get("deleted"), new.get("deleted") or {}) if "deleted" in new or "deleted" in old else {}
    if deleted:
        out["deleted"] = deleted
    for k, v in new.items():
        if k != "deleted":
            out[k] = merge_value(k, old.get(k), v, deleted)
    return prune_tombstones(out)


def prune_tombstones(data: dict) -> dict:
    cutoff = (time.time() - TOMBSTONE_DAYS * 86400) * 1000
    d = data.get("deleted")
    if isinstance(d, dict):
        data["deleted"] = {k: {i: t for i, t in v.items() if t > cutoff} for k, v in d.items() if isinstance(v, dict)}
    return data


class Progress:
    def __init__(self, path: Path = None):
        self.path = path or (data_dir() / "progress.db")
        self._lock = threading.Lock()
        self.notice = ""  # 启动时发生的事（比如从备份恢复），前端显示一次
        self._db = self._open()
        self._import_legacy_json()

    # ---------- 打开 / 损坏恢复 ----------
    def _connect(self):
        db = sqlite3.connect(self.path, check_same_thread=False, isolation_level=None)
        try:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("PRAGMA synchronous=NORMAL")
            db.execute("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated REAL NOT NULL)")
            db.execute("CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)")
            if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                raise sqlite3.DatabaseError("quick_check failed")
        except sqlite3.DatabaseError:
            db.close()  # Windows 上不关掉连接，损坏的文件就没法改名
            raise
        return db

    def _open(self):
        try:
            return self._connect()
        except sqlite3.DatabaseError as e:
            log.error("进度数据库损坏：%s", e)
            broken = self.path.with_name(f"{self.path.name}.broken-{time.strftime('%Y%m%d-%H%M%S')}")
            for suffix in ("", "-wal", "-shm"):
                p = Path(str(self.path) + suffix)
                if p.exists():
                    p.replace(Path(str(broken) + suffix))
            db = self._connect()
            latest = self.backups()[:1]
            if latest:
                data = json.loads((self.backup_dir() / latest[0]["name"]).read_text(encoding="utf-8")).get("data", {})
                self._db = db
                self._write_all(data)
                self.notice = f"学习进度文件损坏，已经用 {latest[0]['date']} 的自动备份恢复（损坏的文件保留为 {broken.name}）。"
            else:
                self.notice = f"学习进度文件损坏，而且没有找到备份，只能从头开始（损坏的文件保留为 {broken.name}）。"
            return db

    def _import_legacy_json(self):
        old = self.path.with_name("progress.json")
        if not old.exists() or self.rev() > 0 or self._db.execute("SELECT count(*) FROM kv").fetchone()[0]:
            return
        try:
            data = json.loads(old.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as e:
            log.error("旧版 progress.json 读不出来：%s", e)
            return
        if isinstance(data, dict):
            data.pop("updated", None)
            self._write_all(data)
            old.replace(old.with_name("progress.json.migrated"))
            log.info("已从 progress.json 导入学习进度（%d 个字段）", len(data))

    # ---------- 读写 ----------
    def rev(self) -> int:
        r = self._db.execute("SELECT v FROM meta WHERE k='rev'").fetchone()
        return int(r[0]) if r else 0

    def _bump(self):
        self._db.execute("INSERT INTO meta(k, v) VALUES('rev', ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v", (str(self.rev() + 1),))

    def load(self) -> dict:
        with self._lock:
            rows = self._db.execute("SELECT key, value FROM kv").fetchall()
        data = {}
        for k, v in rows:
            try:
                data[k] = json.loads(v)
            except json.JSONDecodeError:
                log.error("进度字段 %s 损坏，已跳过", k)
        return data

    def _get(self, key):
        r = self._db.execute("SELECT value FROM kv WHERE key=?", (key,)).fetchone()
        return json.loads(r[0]) if r else None

    def _put(self, key, value):
        self._db.execute("INSERT INTO kv(key, value, updated) VALUES(?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated=excluded.updated",
                         (key, json.dumps(value, ensure_ascii=False, separators=(",", ":")), time.time()))

    def _write_all(self, data: dict):
        self._db.execute("BEGIN")
        try:
            self._db.execute("DELETE FROM kv")
            for k, v in data.items():
                self._put(k, v)
            self._bump()
            self._db.execute("COMMIT")
        except Exception:
            self._db.execute("ROLLBACK")
            raise

    def save_patch(self, patch: dict) -> dict:
        """合并写入改动的字段。返回 {rev, prev, changed}：changed 是合并后和传来的不一样的字段（前端要换成合并后的）。"""
        if not isinstance(patch, dict):
            raise ValueError("patch 必须是对象")
        changed = {}
        with self._lock:
            prev = self.rev()
            self._db.execute("BEGIN IMMEDIATE")
            try:
                deleted = self._get("deleted")
                if "deleted" in patch:
                    deleted = prune_tombstones({"deleted": merge_value("deleted", deleted, patch["deleted"])})["deleted"]
                    self._put("deleted", deleted)
                    if deleted != patch["deleted"]:
                        changed["deleted"] = deleted
                for k in patch.get("__drop") or []:  # 不再放在进度里的字段（比如搬到 AI 缓存里的）
                    self._db.execute("DELETE FROM kv WHERE key=?", (str(k),))
                for k, v in patch.items():
                    if k in ("deleted", "__drop"):
                        continue
                    merged = merge_value(k, self._get(k), v, deleted)
                    self._put(k, merged)
                    if merged != v:
                        changed[k] = merged
                self._bump()
                self._db.execute("COMMIT")
            except Exception:
                self._db.execute("ROLLBACK")
                raise
            # prev：这次写入之前的版本号。前端发现 prev 和自己记的不一样，说明中间有别的设备写过
            return {"rev": self.rev(), "prev": prev, "changed": changed}

    def replace_all(self, data: dict):
        with self._lock:
            self._write_all(data)

    def merge_in(self, data: dict) -> dict:
        """把另一份完整进度合并进来（导入、WebDAV 同步）"""
        with self._lock:
            merged = merge_all(self.load_unlocked(), data)
            self._write_all(merged)
            return merged

    def load_unlocked(self) -> dict:
        return {k: json.loads(v) for k, v in self._db.execute("SELECT key, value FROM kv").fetchall()}

    def reset(self, keep_prefs=True):
        self.backup(tag="before-reset")
        prefs = self._get("prefs") if keep_prefs else None
        with self._lock:
            self._write_all({"prefs": prefs} if prefs else {})

    # ---------- 备份 ----------
    def backup_dir(self) -> Path:
        return sub_dir("backups")

    def export_doc(self) -> dict:
        return {"app": APP_NAME, "version": VERSION, "exported": time.strftime("%Y-%m-%d %H:%M:%S"), "data": self.load()}

    def backup(self, tag: str = "") -> Path:
        """写一份备份。不带 tag 的是每日自动备份（同一天覆盖），只保留最近 KEEP_BACKUPS 天。"""
        name = f"progress-{time.strftime('%Y-%m-%d')}{'-' + tag + time.strftime('-%H%M%S') if tag else ''}.json"
        path = self.backup_dir() / name
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.export_doc(), ensure_ascii=False), encoding="utf-8")
        tmp.replace(path)
        daily = sorted(p for p in self.backup_dir().glob("progress-????-??-??.json"))
        for old in daily[:-KEEP_BACKUPS]:
            old.unlink(missing_ok=True)
        tagged = sorted(p for p in self.backup_dir().glob("progress-*-*-*-*.json") if p not in daily)
        for old in tagged[:-KEEP_BACKUPS]:
            old.unlink(missing_ok=True)
        return path

    def backups(self) -> list:
        out = []
        for p in sorted(self.backup_dir().glob("progress-*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
            out.append({"name": p.name, "date": time.strftime("%Y-%m-%d %H:%M", time.localtime(p.stat().st_mtime)),
                        "kb": round(p.stat().st_size / 1024)})
        return out

    def restore(self, name: str) -> bool:
        p = self.backup_dir() / Path(name).name
        if not p.is_file():
            return False
        doc = json.loads(p.read_text(encoding="utf-8"))
        self.backup(tag="before-restore")
        self.replace_all(doc.get("data", doc))
        return True

    def close(self):
        with self._lock:
            try:
                self._db.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            finally:
                self._db.close()


def read_export(path: Path) -> dict:
    """读导出 / 备份文件，兼容直接是进度对象的旧格式。"""
    doc = json.loads(Path(path).read_text(encoding="utf-8-sig"))
    data = doc.get("data") if isinstance(doc, dict) and isinstance(doc.get("data"), dict) and "app" in doc else doc
    if not isinstance(data, dict) or not any(k in data for k in ("words", "prefs", "days", "xp")):
        raise ValueError("这不是 EngNest 的进度文件")
    data.pop("updated", None)
    return data
