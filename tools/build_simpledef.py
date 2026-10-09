"""生成学习者英英释义 web/data/simpledef.js（单词卡片、查单词面板、查词浮层里的「📘 英文释义」）。

数据来源：Simple English Wiktionary（https://simple.wiktionary.org ，CC BY-SA 3.0 / 4.0），
专门用简单英语写的词典，释义多是整句：If you abandon something, you go away from it with no plan to return.
固定用 2026-10-01 的数据包并核对 SHA1（文件 8.5 MB，下载到 tools/raw/）。

    python tools/build_simpledef.py

    pip install wordfreq   # 释义里每个词有多常见（判断这句释义对学习者难不难）

只收各词书里出现的词。每个词最多 3 个义项（每种词性最多 2 个），每个义项带一句例句；
另外记下释义里「不太常见」的词（词频排名 1000 以后）和它的排名，前端用学习者的词汇量和学过的词判断这句英文看不看得懂。
变形还原（happened → happen）用内置 ECDICT 的 forms 表（assets/ecdict.db）。
"""

import bz2
import hashlib
import json
import re
import sqlite3
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

from wordfreq import top_n_list

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web" / "data"
OUT = DATA / "simpledef.js"
RAW = ROOT / "tools" / "raw" / "simplewiktionary-20261001-pages-articles.xml.bz2"
URL = "https://dumps.wikimedia.org/simplewiktionary/20261001/simplewiktionary-20261001-pages-articles.xml.bz2"
SHA1 = "cac6a29526b2a825463a9adcd8f8c7b31f01a80e"
ECDICT = ROOT / "assets" / "ecdict.db"
NS = "{http://www.mediawiki.org/xml/export-0.11/}"
EASY_RANK = 1000      # 排名在这以内的词谁都认识，不用记
MAX_SENSES, MAX_PER_POS = 3, 2
POS = {
    "noun": "n.", "proper noun": "n.", "verb": "v.", "phrasal verb": "phr.", "adjective": "adj.", "adverb": "adv.",
    "preposition": "prep.", "conjunction": "conj.", "pronoun": "pron.", "interjection": "int.", "determiner": "det.",
    "article": "art.", "numeral": "num.", "number": "num.", "phrase": "phr.", "idiom": "phr.", "abbreviation": "abbr.",
    "contraction": "abbr.", "auxiliary verb": "v.", "modal verb": "v.", "cardinal number": "num.", "ordinal number": "num.",
}
# 粗俗、冒犯、性相关、过时的义项不收（标签在原文的模板里，清理之前先看）
SKIP_LABEL = re.compile(r"\{\{\s*(vulgar|offensive|derogatory|obscene|taboo|sexual|pejorative|slur|ethnic slur|archaic|obsolete|dated)\b", re.I)
# 模板没处理干净留下的半截话（"or obtain."、"ly, slowly"、"ed to."）
FRAGMENT = re.compile(r"^(or|and|ed|ly|ing|s|es)\b|^[,;.]")
# 只是在说「这是谁的变形」的义项，对学习者没用
SKIP_DEF = re.compile(r"^(the |an? )?(plural|past tense|past participle|present participle|simple past|third[- ]person|"
                      r"comparative|superlative|alternative (spelling|form)|misspelling|other spelling|obsolete)\b.*\bof\b", re.I)


def download():
    if not RAW.exists():
        print("下载 Simple English Wiktionary（约 8.5 MB）…")
        RAW.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, RAW)
    if hashlib.sha1(RAW.read_bytes()).hexdigest() != SHA1:
        RAW.unlink()
        sys.exit("数据包的 SHA1 不对，已删除，请重新运行")


def book_words() -> set:
    """各词书里的词（小写）"""
    out = set()
    for f in list(DATA.glob("vocab_*.js")) + [DATA / "words.js"]:
        out |= {m.lower() for m in re.findall(r'\[\s*"([A-Za-z][A-Za-z \'-]*)",\s*"/', f.read_text(encoding="utf-8"))}
    return out


def clean(t: str) -> str:
    """维基文本 → 纯文字：去掉引用、注释、模板，链接只留显示的字，去掉粗体斜体"""
    t = re.sub(r"<ref[^>]*/>|<ref[^>]*>.*?</ref>|<!--.*?-->", "", t, flags=re.S)
    t = re.sub(r"\{\{r\|([^{}]*)\}\}", lambda m: "".join(m.group(1).split("|")), t)  # {{r|suppl|ies}} → supplies
    # 显示一个词的模板：{{lc|Receive}} → Receive，{{l|en|word}} → word
    t = re.sub(r"\{\{(?:lc|l|w|link|term|m|mention)\|(?:en\|)?([^{}|]*)(?:\|[^{}]*)?\}\}", r"\1", t)
    while True:
        t2 = re.sub(r"\{\{[^{}]*\}\}", "", t)
        if t2 == t:
            break
        t = t2
    t = re.sub(r"\[\[(?:File|Image|Category):[^\]]*\]\]", "", t, flags=re.I)
    t = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", t)
    t = re.sub(r"\[https?://\S+\s*([^\]]*)\]", r"\1", t)
    t = re.sub(r"<[^>]+>", "", t).replace("'''", "").replace("''", "")
    t = re.sub(r"\s+", " ", t).strip()
    return re.sub(r"\s+([,.;:!?)])", r"\1", t).replace("( ", "(")


def parse(text: str) -> list:
    """一页 → [(词性, 释义, 例句), …]"""
    senses, pos, last = [], None, None
    for line in text.splitlines():
        h = re.match(r"^(={2,3})\s*([^=]+?)\s*\1\s*$", line)
        if h:
            pos = POS.get(h.group(2).strip().lower())
            last = None
            continue
        if not pos:
            continue
        if re.match(r"^#[^:*#]", line):
            d = clean(line[1:])
            last = None
            if len(d) >= 4 and not SKIP_DEF.match(d) and not SKIP_LABEL.search(line) and not FRAGMENT.match(d):
                d = d[0].upper() + d[1:]  # 「one time」这种短语式释义也按句子显示
                last = [pos, d[:220], ""]
                senses.append(last)
        elif line.startswith("#:") and last is not None and not last[2]:
            ex = clean(line[2:])
            if 8 <= len(ex) <= 140:
                last[2] = ex
    picked, per = [], {}
    for p, d, ex in senses:
        if per.get(p, 0) < MAX_PER_POS and len(picked) < MAX_SENSES:
            per[p] = per.get(p, 0) + 1
            picked.append((p, d, ex))
    return picked


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    download()
    want = book_words()
    rank = {}
    for i, w in enumerate(top_n_list("en", 40000), 1):
        rank.setdefault(w.lower(), i)
    db = sqlite3.connect(f"file:{ECDICT.as_posix()}?mode=ro", uri=True)
    lemma_of = dict(db.execute("SELECT form, lemma FROM forms"))
    lemma = lambda w: lemma_of.get(w, w)  # noqa: E731

    def hard_words(head: str, d: str) -> list:
        """释义里不太常见的词：[[原形, 词频排名], …]；人名地名（句中大写）、这个词自己都不算"""
        out, seen = [], set()
        for i, m in enumerate(re.finditer(r"[A-Za-z]+(?:'[a-z]+)?", d)):
            tok = re.sub(r"'s$", "", m.group(0))  # something's → something
            if len(tok) <= 2 or "'" in tok or (i and tok[0].isupper()):  # don't、it's 这种缩写不算
                continue
            lo = tok.lower()
            base = lemma(lo)
            if base == head or lo == head or base in seen:
                continue
            r = min(rank.get(lo, 40001), rank.get(base, 40001))
            if r > EASY_RANK:
                seen.add(base)
                out.append([base, r])
        return out

    words = {}
    for _, el in ET.iterparse(bz2.open(RAW), events=("end",)):
        if not el.tag.endswith("page"):
            continue
        title = el.findtext(f"{NS}title") or ""
        if el.findtext(f"{NS}ns") == "0" and title.lower() in want and title.lower() not in words:
            senses = parse(el.findtext(f"{NS}revision/{NS}text") or "")
            if senses:
                head = title.lower()
                words[head] = [[p, d, ex, hard_words(head, d)] for p, d, ex in senses]
        el.clear()

    payload = {
        "source": "Simple English Wiktionary（https://simple.wiktionary.org ，CC BY-SA）2026-10-01",
        "easy": EASY_RANK,
        "words": dict(sorted(words.items())),
    }
    head = ("// 自动生成，请勿手改：学习者英英释义，由 tools/build_simpledef.py 生成。\n"
            "// 释义和例句来自 Simple English Wiktionary（https://simple.wiktionary.org ），按 CC BY-SA 协议使用，\n"
            "// 作者见各词条的页面历史；本文件同样按 CC BY-SA 4.0 提供。\n"
            "// words[词] = [[词性, 释义, 例句, [[释义里不太常见的词的原形, 词频排名], …]], …]\n")
    OUT.write_text(head + "window.SIMPLE_DEF = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    cover = len(words) * 100 // max(1, len(want))
    print(f"词书里 {len(want)} 个词，有英文释义的 {len(words)} 个（{cover}%），{OUT.stat().st_size / 1e6:.1f} MB → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
