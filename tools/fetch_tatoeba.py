"""Tatoeba 英汉例句对（https://tatoeba.org，CC BY 2.0 FR）：查词时显示真实的例句和中文翻译，也给挖词填空当句子来源。

从 Tatoeba 官方导出下载中文句子、英文句子和两者之间的翻译关系，配成「英文 — 简体中文」的句子对：
- 只留 4–25 个词的英文句子；中文是繁体的跳过（GB2312 编码不了的、或者含常见繁体字的）
- 同一句英文只留一个中文翻译

    python tools/fetch_tatoeba.py

输出：web/data/tatoeba.js（打开时才加载），原始文件缓存在 tools/raw/tatoeba/
"""

import bz2
import csv
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "tools" / "raw" / "tatoeba"
OUT = ROOT / "web" / "data" / "tatoeba.js"
BASE = "https://downloads.tatoeba.org/exports/per_language"
FILES = {"cmn": f"{BASE}/cmn/cmn_sentences.tsv.bz2", "eng": f"{BASE}/eng/eng_sentences.tsv.bz2", "links": f"{BASE}/cmn/cmn-eng_links.tsv.bz2"}
# 常见的繁体字：出现这些就当成繁体句子
TRAD = set("們這個說來時會對為學沒東車馬門開關問題現點過還見聽話認識電話們嗎嗎讓買賣寫讀書館醫國們發長樣場後覺歡錢們經氣邊體愛裡變親們從幾應該啟動麼請謝陽陰兩萬與專業務義習貓鳥魚飯廳樓歲們媽爸雙條線網頁覽頭臉髮實際總結達進遠運動們團隊報紙張號碼頻雜誌導記憶")


def simplified(zh: str) -> bool:
    """简体中文都在 GB2312 里，飛、機、紐 这些繁体字不在，编码失败就是繁体（或者有生僻字）"""
    try:
        zh.strip().encode("gb2312")
        return True
    except UnicodeEncodeError:
        return False


def fetch(name):
    path = RAW / Path(FILES[name]).name
    if not path.exists():
        RAW.mkdir(parents=True, exist_ok=True)
        print("下载", FILES[name])
        req = urllib.request.Request(FILES[name], headers={"User-Agent": "EngNest/0.3 (personal English-learning app)"})
        path.write_bytes(urllib.request.urlopen(req, timeout=300).read())
    return bz2.open(path, "rt", encoding="utf-8")


def main():
    csv.field_size_limit(2**31 - 1)  # Windows 上 C long 是 32 位，不能用 sys.maxsize
    cmn = {}
    for row in csv.reader(fetch("cmn"), delimiter="\t", quoting=csv.QUOTE_NONE):
        if len(row) >= 3 and not (set(row[2]) & TRAD) and simplified(row[2]):
            cmn[row[0]] = row[2].strip()
    links = {}
    for row in csv.reader(fetch("links"), delimiter="\t", quoting=csv.QUOTE_NONE):
        if len(row) >= 2 and row[0] in cmn:
            links.setdefault(row[1], row[0])  # 英文句子 id → 一个中文句子 id
    pairs, seen = [], set()
    for row in csv.reader(fetch("eng"), delimiter="\t", quoting=csv.QUOTE_NONE):
        if len(row) < 3 or row[0] not in links:
            continue
        en = re.sub(r"\s+", " ", row[2]).strip()
        n = len(en.split())
        if not 4 <= n <= 25 or en.lower() in seen:
            continue
        seen.add(en.lower())
        pairs.append([en, cmn[links[row[0]]]])
    pairs.sort(key=lambda p: len(p[0]))  # 短句在前，查例句时先给简单的
    OUT.write_text("// 由 tools/fetch_tatoeba.py 生成：Tatoeba 英汉例句对（https://tatoeba.org，CC BY 2.0 FR）\nwindow.TATOEBA = "
                   + json.dumps(pairs, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"{len(pairs)} 对句子，{OUT.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
