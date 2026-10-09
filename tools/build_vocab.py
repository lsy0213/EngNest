"""把 KyleBing/english-vocabulary 的四六级、雅思、托福词库转换成 EngNest 的词书文件。

数据来源：https://github.com/KyleBing/english-vocabulary （BSD-3-Clause）
    full_line_jsonl/full/正序/四级.jsonl、六级.jsonl、雅思.jsonl、托福.jsonl
    → 放到 tools/raw/cet4.jsonl、cet6.jsonl、ielts.jsonl、toefl.jsonl

    pip install wordfreq      # 雅思、托福按词频排序要用
    python tools/build_vocab.py

输出：web/data/vocab_cet4.js、vocab_cet6.js、vocab_ielts.js、vocab_toefl.js
每个词：[单词, 音标, 释义, [[例句, 翻译], ...], [[短语, 释义], ...], 记忆方法, [真题原句, 出处]]
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "tools" / "raw"
OUT = ROOT / "web" / "data"
UNIT_SIZE = 50

BOOKS = {
    "cet4": {"title": "四级词汇", "desc": "大学英语四级考纲词汇，按真题出现频率排序"},
    "cet6": {"title": "六级词汇", "desc": "大学英语六级考纲词汇，按真题出现频率排序"},
    "ielts": {"title": "雅思词汇", "desc": "雅思核心词汇，按英语语料中的使用频率排序，常用词在前；最基础的词放在最后", "by_wordfreq": True},
    "toefl": {"title": "托福词汇", "desc": "托福核心词汇，按英语语料中的使用频率排序，常用词在前；最基础的词放在最后", "by_wordfreq": True},
}
STATS_BOOKS = ("cet4", "cet6")  # 用来识别粘连例句的词频统计只用四六级，保证它们的输出不变
BASIC_ZIPF = 5.0  # 雅思托福里 you、get、time 这类最基础的词，放到词书最后


COMMON: set = set()  # 在所有例句里出现很多次的词
KNOWN: set = set()   # 出现过好几次的词 + 所有词头


def load_word_stats(all_rows: list) -> None:
    """统计例句词频，用来识别源数据里「单词粘连」的例句（如 foras = for as）。"""
    from collections import Counter

    cnt = Counter()
    for r in all_rows:
        KNOWN.add(r["headWord"].strip().lower())
        for s in (r["content"]["word"]["content"].get("sentence") or {}).get("sentences", []):
            cnt.update(re.findall(r"[a-z]+", (s.get("sContent") or "").lower()))
    COMMON.update(w for w, n in cnt.items() if n >= 20 and (len(w) > 1 or w in ("a", "i")))
    KNOWN.update(w for w, n in cnt.items() if n >= 3)


def _splittable(tok: str, parts: int = 3) -> bool:
    if parts == 0:
        return False
    for i in range(1, len(tok)):
        head, tail = tok[:i], tok[i:]
        if head in COMMON and (tail in COMMON or _splittable(tail, parts - 1)):
            return True
    return False


def glued(sentence: str) -> bool:
    return any(t not in KNOWN and _splittable(t) for t in re.findall(r"[a-z]+", sentence.lower()))


def merge_trans(trans_list: list) -> str:
    """按词性合并释义并去重：[v. 渴望, v. 渴望，极想念] → v. 渴望；极想念"""
    by_pos: dict = {}
    for pos, cn in trans_list:
        items = by_pos.setdefault(pos, [])
        for m in re.split(r"[；;，,]", cn):
            m = m.strip()
            if m and m not in items:
                items.append(m)
    parts = [f"{pos}. " * bool(pos) + "；".join(ms[:5]) for pos, ms in by_pos.items()]
    return "  ".join(parts[:4])


def clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s or "")
    return re.sub(r"\s+", " ", s).strip()


def phonetic(c: dict) -> str:
    ph = c.get("ukphone") or c.get("phone") or c.get("usphone") or ""
    ph = ph.split(";")[0].split(",")[0].strip()
    if not ph:
        return ""
    ph = ph.replace("'", "ˈ").replace(":", "ː")
    return f"/{ph}/"


def merge(records: list) -> dict:
    """同一个词在多本子词书里都出现过，把例句、短语等合并起来。"""
    word = records[0]["headWord"].strip()
    ph, trans, exs, phrases, mem, exam, exam_count = "", [], [], [], "", None, 0
    seen_ex, seen_ph, seen_tr = set(), set(), set()
    for r in records:
        c = r["content"]["word"]["content"]
        ph = ph or phonetic(c)
        for t in c.get("trans", []):
            pos = (t.get("pos") or "").strip().rstrip(".")
            cn = clean(t.get("tranCn")).strip("；; ")
            if cn and (pos, cn) not in seen_tr:
                seen_tr.add((pos, cn))
                trans.append((pos, cn))
        for s in (c.get("sentence") or {}).get("sentences", []):
            en, zh = clean(s.get("sContent")), clean(s.get("sCn"))
            if en and zh and en.lower() not in seen_ex and not glued(en):
                seen_ex.add(en.lower())
                exs.append([en, zh])
        for p in (c.get("phrase") or {}).get("phrases", []):
            pc, pcn = clean(p.get("pContent")), clean(p.get("pCn"))
            if pc and pc.lower() not in seen_ph:
                seen_ph.add(pc.lower())
                phrases.append([pc, pcn])
        if not mem and c.get("remMethod"):
            mem = clean(c["remMethod"].get("val"))
        real = (c.get("realExamSentence") or {}).get("sentences", [])
        exam_count = max(exam_count, len(real))
        for s in real:
            text = clean(s.get("sContent")).strip(". …")
            info = s.get("sourceInfo") or {}
            if 30 <= len(text) <= 160 and not glued(text) and (exam is None or len(text) < len(exam[0])):
                exam = [text, f"{info.get('year', '')} {info.get('level', '')} {info.get('type', '')}".strip()]

    exs.sort(key=lambda x: len(x[0]))  # 短例句更适合初学
    return {
        "w": word,
        "data": [word, ph, merge_trans(trans), exs[:3], phrases[:4], mem[:80], exam or []],
        "freq": exam_count,
    }


def build(book: str) -> int:
    groups: dict = {}
    order: list = []
    with open(RAW / f"{book}.jsonl", encoding="utf-8") as f:
        for line in f:
            r = json.loads(line)
            key = r["headWord"].strip().lower()
            if key not in groups:
                groups[key] = []
                order.append(key)
            groups[key].append(r)

    words = [merge(groups[k]) for k in order]
    words = [w for w in words if w["data"][2]]  # 没有释义的丢掉
    meta = BOOKS[book]
    basic = []
    if meta.get("by_wordfreq"):
        # 雅思托福没有真题例句可统计，改用 wordfreq 的语料词频（Zipf 值）：常用的在前
        from wordfreq import zipf_frequency

        for w in words:
            w["freq"] = zipf_frequency(w["w"], "en")
        words = [w for w in words if w["freq"] > 0]  # 语料里查不到的多是拼写错误或生僻合成词
        basic = [w for w in words if w["freq"] >= BASIC_ZIPF]
        words = [w for w in words if w["freq"] < BASIC_ZIPF]
        basic.sort(key=lambda w: -w["freq"])
    # 真题里出现越多（或语料词频越高）越靠前；同频率保持原字母顺序
    words.sort(key=lambda w: -w["freq"])

    units = []
    for part, title in ((words, "Unit {n}"), (basic, "基础词 {n}")):
        for i in range(0, len(part), UNIT_SIZE):
            chunk = part[i:i + UNIT_SIZE]
            units.append({"title": title.format(n=i // UNIT_SIZE + 1) if part is basic else f"Unit {len(units) + 1}",
                          "words": [w["data"] for w in chunk]})
    words += basic

    payload = {"id": book, "title": meta["title"], "desc": meta["desc"], "rich": True, "units": units}
    js = ("// 自动生成，请勿手改。来源：KyleBing/english-vocabulary（BSD-3-Clause），由 tools/build_vocab.py 转换\n"
          "(window.WORD_BOOKS = window.WORD_BOOKS || []).push("
          + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ");\n")
    out = OUT / f"vocab_{book}.js"
    out.write_text(js, encoding="utf-8")
    print(f"{book}: {len(words)} 词, {len(units)} 单元, {out.stat().st_size / 1024 / 1024:.1f} MB")
    return len(words)


if __name__ == "__main__":
    all_rows = []
    for b in STATS_BOOKS:
        with open(RAW / f"{b}.jsonl", encoding="utf-8") as f:
            all_rows += [json.loads(line) for line in f]
    load_word_stats(all_rows)
    for b in BOOKS:
        build(b)
    import build_vocab_index  # 词书内容变了，启动时加载的目录也要跟着更新
    build_vocab_index.main()
