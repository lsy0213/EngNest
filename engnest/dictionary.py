"""英汉词典：ECDICT（https://github.com/skywind3000/ECDICT ，MIT License）转成的 SQLite，用来查词和搜索。

- 内置精简版 assets/ecdict.db：常用词（有词频排名 / 考试标签 / 柯林斯星级 / 牛津 3000）全部保留并带英文释义，
  再加上真实语料里出现过的其他单词（selfie、vlog……，用 wordfreq 判断）和由常用词组成的 3 词以内短语（give up、take after……）。
  由 tools/build_dict.py 生成。
- 完整版：在设置里一键下载 ECDICT 全部 77 万条，在本机生成到数据目录的 cache/dict/ecdict_full.db，有它时优先用它。

表 dict：word 词头、lower 小写词头、phonetic 音标、trans 中文释义（按词性分行）、defn 英文释义、
        tag 考试标签（zk 中考 gk 高考 cet4 cet6 ky 考研 ielts toefl gre）、collins 柯林斯星级、oxford 是否牛津 3000、
        rank 词频排名（BNC 和当代语料库取较小的，0 表示没有）、exchange 词形变化（p 过去式 d 过去分词 i 现在分词 3 三单 s 复数 r 比较级 t 最高级）
表 forms：form 变形（小写）→ lemma 原形（小写）、kind 变形类型（p d i 3 s r t），查 went 能找到 go
"""

import csv
import re
import sqlite3
import threading
from pathlib import Path

from . import net
from .paths import cache_dir, resource_dir

# 固定到某个提交，并核对 SHA256：GitHub 连不上时会换镜像下载，镜像的内容也要和原文件一模一样
ECDICT_COMMIT = "82c9872576b23118d7c42e920c11beb77f510ae2"
URL = f"https://raw.githubusercontent.com/skywind3000/ECDICT/{ECDICT_COMMIT}/ecdict.csv"
CSV_SIZE = 65933428
CSV_SHA256 = "1a6947e04785db63613a92e14903cdae7954f7e84860b10e68e5c7cbb3f9c3cf"
CORE_DB = resource_dir() / "assets" / "ecdict.db"
MAX_PHRASE_WORDS = 3  # 精简版里的短语最多几个词，更长的多半是专业术语
FORM_KEYS = {"p", "d", "i", "3", "s", "r", "t"}
csv.field_size_limit(10_000_000)


def full_db() -> Path:
    return cache_dir("dict") / "ecdict_full.db"


# ---------- 生成数据库 ----------
def _is_common(r: dict) -> bool:
    """有词频排名、考试标签、柯林斯星级或属于牛津 3000 的词"""
    return bool(r["bnc"] not in ("", "0") or r["frq"] not in ("", "0") or r["tag"] or r["collins"] or r["oxford"] == "1")


def _keep_core(r: dict, common_words: set, keep_word) -> bool:
    """精简版：常用词全部保留；其余单词由 keep_word 决定（比如语料里出现过）；
    短语只留 3 个词以内、每个词都是常用词的小写短语（专业术语、人名地名丢掉）"""
    w = r["word"]
    if _is_common(r):
        return True
    if " " not in w:
        return bool(keep_word and w.islower() and keep_word(w))
    if w[:1].isupper() or len(w) > 40 or len(w.split()) > MAX_PHRASE_WORDS:
        return False
    return all(x in common_words for x in re.split(r"[\s-]+", w.lower()) if x)


def _clean_trans(t: str) -> str:
    # 去掉「[网络]」来源的释义行，除非整条只有它
    lines = [x.strip() for x in t.replace("\\n", "\n").split("\n") if x.strip()]
    main = [x for x in lines if not x.startswith("[网络]")]
    return "\n".join(main or lines)


def _rank(r: dict) -> int:
    vals = [int(v) for v in (r["bnc"], r["frq"]) if v and v != "0"]
    return min(vals) if vals else 0


def build(csv_path: Path, out_path: Path, full: bool = False, progress=None, keep_word=None) -> int:
    """从 ecdict.csv 生成 SQLite 词典，返回条数。progress(0~1) 用来报告进度；keep_word(word) 决定精简版要不要收不常用的单词。"""
    with open(csv_path, encoding="utf-8") as f:
        common_words = set() if full else {r["word"].lower() for r in csv.DictReader(f) if _is_common(r)}
    rows, forms, total = [], [], 770_000
    with open(csv_path, encoding="utf-8") as f:
        for i, r in enumerate(csv.DictReader(f)):
            if progress and i % 20000 == 0:
                progress(min(i / total, 0.95))
            w = r["word"]
            if not r["translation"].strip() or not re.search(r"[A-Za-z]", w):
                continue
            if not full and not _keep_core(r, common_words, keep_word):
                continue
            common = _is_common(r)
            # 英文释义：精简版只给常用词，控制体积
            defn = r["definition"].replace("\\n", "\n").strip()[:600] if full or common else ""
            rows.append((w, w.lower(), r["phonetic"], _clean_trans(r["translation"]), defn,
                         r["tag"], int(r["collins"] or 0), int(r["oxford"] or 0), _rank(r), r["exchange"]))
            for part in r["exchange"].split("/"):
                k, _, v = part.partition(":")
                if k in FORM_KEYS and v and v.lower() != w.lower():
                    forms.append((v.lower(), w.lower(), k))
    tmp = out_path.with_suffix(".tmp")
    tmp.unlink(missing_ok=True)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(tmp)
    db.execute("""CREATE TABLE dict (word TEXT NOT NULL, lower TEXT NOT NULL, phonetic TEXT, trans TEXT, defn TEXT,
                  tag TEXT, collins INTEGER, oxford INTEGER, rank INTEGER, exchange TEXT)""")
    db.execute("CREATE TABLE forms (form TEXT NOT NULL, lemma TEXT NOT NULL, kind TEXT)")
    db.executemany("INSERT INTO dict VALUES (?,?,?,?,?,?,?,?,?,?)", rows)
    db.executemany("INSERT INTO forms VALUES (?,?,?)", sorted(set(forms)))
    db.execute("CREATE INDEX idx_lower ON dict(lower)")
    db.execute("CREATE INDEX idx_form ON forms(form)")
    db.commit()
    db.execute("VACUUM")
    db.close()
    out_path.unlink(missing_ok=True)
    tmp.rename(out_path)
    if progress:
        progress(1.0)
    return len(rows)


# ---------- 查询 ----------
COLS = ("word", "phonetic", "trans", "defn", "tag", "collins", "oxford", "rank", "exchange")
_CJK = re.compile(r"[㐀-鿿]")
# 释义只写着「be的过去式」这种的，从文字里认出原形
_FORM_TEXT = re.compile(r"^(?:[a-z]+\.\s*)?([a-z]+)的(过去式|过去分词|现在分词|复数|第三人称单数|比较级|最高级)")
_FORM_KIND = {"过去式": "p", "过去分词": "d", "现在分词": "i", "复数": "s", "第三人称单数": "3", "比较级": "r", "最高级": "t"}


class Dictionary:
    def __init__(self):
        self._lock = threading.Lock()
        self._db = None
        self._path = None
        self.task = {"running": False, "stage": "", "progress": 0.0, "error": ""}

    def _conn(self):
        # 有完整版就用完整版；只读打开，pywebview 会从不同线程调用，所以加锁共用一个连接
        path = full_db() if full_db().exists() else CORE_DB
        if self._path != path:
            if self._db:
                self._db.close()
            self._db = sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True, check_same_thread=False) if path.exists() else None
            self._path = path
        return self._db

    def _row(self, r) -> dict:
        return dict(zip(COLS, r))

    def lookup(self, word: str):
        """查一个词。变形词（went、children、was）返回原形的词条，并带上 lemma_of（查的词）和 form（变形类型）。
        ECDICT 里不少变形词自己也有一条，但只写着「go的过去式」，所以能找到原形就用原形的；
        本身就是常用词的（better、saw）还是返回它自己，另外用 also_form_of 标出它也是哪个词的变形。"""
        w = (word or "").strip().lower()
        if not w:
            return None
        with self._lock:
            db = self._conn()
            if not db:
                return None
            sel = f"SELECT {','.join(COLS)} FROM dict WHERE lower=? ORDER BY rank=0, rank LIMIT 1"
            own = db.execute(sel, (w,)).fetchone()
            # 原形：词条自己的 exchange 里的「0:原形/1:类型」，或者 forms 表
            lemma, kind = None, ""
            if own:
                ex = dict(p.split(":", 1) for p in (own[COLS.index("exchange")] or "").split("/") if ":" in p)
                lemma, kind = ex.get("0"), (ex.get("1") or "")[:1]
            if not lemma:
                f = db.execute("SELECT lemma, kind FROM forms WHERE form=? LIMIT 1", (w,)).fetchone()
                if f:
                    lemma, kind = f
            if not lemma and own:
                m = _FORM_TEXT.match(own[COLS.index("trans")])
                if m:
                    lemma, kind = m.group(1), _FORM_KIND[m.group(2)]
            if lemma and lemma.lower() != w:
                r = db.execute(sel, (lemma.lower(),)).fetchone()
                if r:
                    # 自己的释义只有一行「xx的过去式」的（was、men），也直接用原形
                    thin = own and "\n" not in own[COLS.index("trans")] and _FORM_TEXT.match(own[COLS.index("trans")])
                    if own and own[COLS.index("rank")] and not thin:
                        return {**self._row(own), "also_form_of": r[0], "form": kind}
                    return {**self._row(r), "lemma_of": word.strip(), "form": kind}
            return self._row(own) if own else None

    def search(self, q: str, limit: int = 40):
        """英文按前缀搜（常用词排前面），中文按释义搜"""
        q = (q or "").strip()
        if not q:
            return []
        cols = "word, phonetic, trans, tag, collins, rank"
        with self._lock:
            db = self._conn()
            if not db:
                return []
            if _CJK.search(q):
                rows = db.execute(f"""SELECT {cols} FROM dict WHERE trans LIKE ? AND instr(word, ' ') = 0
                                      ORDER BY rank = 0, rank, length(word) LIMIT ?""", (f"%{q}%", limit)).fetchall()
            else:
                lo = q.lower()
                # 前缀范围查询可以用上索引；完全匹配排第一，人名地名（大写开头）排在普通词后面
                rows = db.execute(f"""SELECT {cols} FROM dict WHERE lower >= ? AND lower < ?
                                      ORDER BY lower != ?, word != lower, rank = 0, rank, length(lower) LIMIT ?""",
                                  (lo, lo + "￿", lo, limit)).fetchall()
        return [dict(zip(("word", "phonetic", "trans", "tag", "collins", "rank"), r)) for r in rows]

    def status(self) -> dict:
        with self._lock:
            db = self._conn()
            count = db.execute("SELECT count(*) FROM dict").fetchone()[0] if db else 0
        return {"full": full_db().exists(), "count": count, **self.task}

    # ---------- 下载完整版 ----------
    def download_full(self) -> bool:
        if self.task["running"]:
            return False
        self.task = {"running": True, "stage": "download", "progress": 0.0, "error": ""}
        threading.Thread(target=self._download_full, daemon=True).start()
        return True

    def _download_full(self):
        csv_path = cache_dir("dict") / "ecdict.csv"
        try:
            net.download(net.github_mirrors(URL), csv_path, sha256=CSV_SHA256, size=CSV_SIZE,
                         progress=lambda got, total: self.task.update(progress=min(got / (total or CSV_SIZE), 1.0)))
            self.task.update(stage="build", progress=0.0)
            with self._lock:  # 生成期间先关掉连接，生成完 _conn() 会自动切到完整版
                if self._db:
                    self._db.close()
                self._db, self._path = None, None
            build(csv_path, full_db(), full=True, progress=lambda p: self.task.update(progress=p))
            csv_path.unlink(missing_ok=True)
            self.task.update(running=False, stage="done", progress=1.0)
        except Exception as e:  # noqa: BLE001 — 网络、磁盘各种错误都直接告诉用户（没下完的部分留着，下次接着下）
            self.task.update(running=False, stage="error", error=str(e))

    def remove_full(self) -> bool:
        with self._lock:
            if self._db:
                self._db.close()
            self._db, self._path = None, None
            full_db().unlink(missing_ok=True)
        return True
