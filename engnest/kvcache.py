"""AI 结果缓存：段落翻译、字幕翻译、逐句精讲等，存在数据目录的 ai_cache.db（SQLite）。

这些结果花钱生成，但不是学习进度：放在进度里会让进度越来越大、每次保存都要重写，
放在 WebView 的 localStorage 里又有 5–10 MB 的上限。按命名空间（ns）+ 键存，每个命名空间有条数上限，超了删最旧的。
"""

import json
import sqlite3
import threading
import time

from .paths import data_dir

LIMITS = {"line_notes": 5000, "film_zh": 2000}
DEFAULT_LIMIT = 50000
MAX_VALUE = 2_000_000  # 单条最大 2 MB


class KVCache:
    def __init__(self, path=None):
        self._lock = threading.Lock()
        self._db = sqlite3.connect(path or (data_dir() / "ai_cache.db"), check_same_thread=False, isolation_level=None)
        self._db.execute("PRAGMA journal_mode=WAL")
        self._db.execute("""CREATE TABLE IF NOT EXISTS cache (ns TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
                            updated REAL NOT NULL, PRIMARY KEY (ns, key))""")
        self._db.execute("CREATE INDEX IF NOT EXISTS idx_cache_age ON cache(ns, updated)")

    def get_many(self, ns: str, keys: list) -> dict:
        keys = [str(k) for k in (keys or [])][:2000]
        if not keys:
            return {}
        out = {}
        with self._lock:
            for i in range(0, len(keys), 500):
                part = keys[i:i + 500]
                q = f"SELECT key, value FROM cache WHERE ns=? AND key IN ({','.join('?' * len(part))})"
                for k, v in self._db.execute(q, (ns, *part)):
                    out[k] = json.loads(v)
        return out

    def get_all(self, ns: str) -> dict:
        with self._lock:
            return {k: json.loads(v) for k, v in self._db.execute("SELECT key, value FROM cache WHERE ns=?", (ns,))}

    def set(self, ns: str, key: str, value) -> bool:
        raw = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        if len(raw) > MAX_VALUE:
            return False
        with self._lock:
            self._db.execute("INSERT INTO cache(ns, key, value, updated) VALUES(?,?,?,?) "
                             "ON CONFLICT(ns, key) DO UPDATE SET value=excluded.value, updated=excluded.updated",
                             (ns, str(key), raw, time.time()))
            limit = LIMITS.get(ns, DEFAULT_LIMIT)
            n = self._db.execute("SELECT count(*) FROM cache WHERE ns=?", (ns,)).fetchone()[0]
            if n > limit:
                self._db.execute("DELETE FROM cache WHERE rowid IN (SELECT rowid FROM cache WHERE ns=? ORDER BY updated LIMIT ?)",
                                 (ns, n - limit))
        return True

    def set_many(self, ns: str, items: dict) -> int:
        return sum(1 for k, v in (items or {}).items() if self.set(ns, k, v))

    def delete(self, ns: str, key: str) -> bool:
        with self._lock:
            self._db.execute("DELETE FROM cache WHERE ns=? AND key=?", (ns, str(key)))
        return True

    def clear_ns(self, ns: str):
        """删掉整个命名空间（局域网里删除一个人时，清掉 TA 的 AI 语伴聊天记录）"""
        with self._lock:
            self._db.execute("DELETE FROM cache WHERE ns=?", (ns,))

    def stats(self) -> dict:
        with self._lock:
            return {ns: n for ns, n in self._db.execute("SELECT ns, count(*) FROM cache GROUP BY ns")}
