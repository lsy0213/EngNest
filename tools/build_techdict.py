"""生成计算机英语词典 web/data/techdict.js（查词浮层和「查单词」面板里的「💻 计算机」释义）。

数据来源：
- tools/techdict/*.txt：EngNest 自己编写的分类术语表（网络、工控、编程、系统、安全、云、AI、硬件、文档常用词……），
  每行「术语 | 英文全称 | 中文 | 一句话解释 | 别名」，文件第一行注释是分类名。
- computerese-cross-references（https://github.com/EarsEyesMouth/computerese-cross-references ，MIT License）：
  约 1000 条软件工程术语的中英对照，只收上面没有的词，固定到某个提交并核对 SHA256。

    python tools/build_techdict.py

    pip install wordfreq   # 用来标出日常也很常见的词（set、frame、port……），读小说时不把它们当术语提示
"""

import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "techdict"
OUT = ROOT / "web" / "data" / "techdict.js"
RAW = ROOT / "tools" / "raw" / "computerese.md"
CC_COMMIT = "e92ca7dddf6b8122c7c0807f701fa9e237752506"
CC_URL = f"https://raw.githubusercontent.com/EarsEyesMouth/computerese-cross-references/{CC_COMMIT}/README.md"
CC_SHA256 = "c709a9c5ca3ea81a8b58f141fa91b2ed659cb015929c20420d92d95f2b824a40"
CC_CAT = "软件工程术语对照"
COMMON_ZIPF = 4.0  # 日常英语里也很常见的单词（大约每 10 万词出现一次以上）
_CJK = re.compile(r"[一-鿿]")


def load_own():
    """读 tools/techdict/*.txt，返回 (分类列表, 词条列表)"""
    cats, items = [], []
    for f in sorted(SRC.glob("*.txt")):
        lines = f.read_text(encoding="utf-8").splitlines()
        cat = lines[0].lstrip("#").strip().split("：")[0]
        cats.append(cat)
        for n, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            p = [x.strip() for x in line.split("|")]
            if not 4 <= len(p) <= 5 or not p[0] or not p[2]:
                sys.exit(f"{f.name}:{n} 格式不对（应为 术语 | 全称 | 中文 | 解释 | 别名）：{line}")
            if p[3] and not _CJK.search(p[3]):
                print(f"  注意 {f.name}:{n} 解释里没有中文，是不是别名写错了一栏：{line}")
            alias = [a.strip() for a in p[4].split(" / ")] if len(p) == 5 and p[4] else []
            items.append({"w": p[0], "full": p[1], "zh": p[2], "note": p[3], "alias": [a for a in alias if a], "cat": len(cats) - 1})
    return cats, items


def load_computerese():
    """computerese-cross-references 的 README 里的 | Word | Meaning | 表格"""
    if not RAW.exists():
        print("下载 computerese-cross-references…")
        RAW.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(CC_URL, RAW)
    data = RAW.read_bytes()
    if hashlib.sha256(data).hexdigest() != CC_SHA256:
        RAW.unlink()
        sys.exit("computerese.md 的 SHA256 不对，已删除，请重新运行")
    out = []
    for line in data.decode("utf-8").splitlines():
        m = re.match(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$", line)
        if not m or m.group(1) in ("Word",) or set(m.group(1)) <= set("-: "):
            continue
        zh = re.sub(r"\s*<sup>\d+</sup>", "", m.group(2)).strip()
        if zh:
            out.append((m.group(1), zh))
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    from wordfreq import zipf_frequency

    cats, items = load_own()
    own_keys = {k.lower() for it in items for k in [it["w"], *it["alias"]]}
    cats.append(CC_CAT)
    seen = set()
    added = 0
    for w, zh in load_computerese():
        k = w.lower()
        if k in own_keys or k in seen:
            continue
        seen.add(k)
        items.append({"w": w, "full": "", "zh": zh, "note": "", "alias": [], "cat": len(cats) - 1, "src": 1})
        added += 1

    # 日常常见词：单个小写单词、词频高。阅读普通文章时只有上下文里也出现了别的术语，才提示它的计算机释义
    for it in items:
        w = it["w"]
        it["common"] = int(w.islower() and re.fullmatch(r"[a-z]+(?:-[a-z]+)?", w) is not None and zipf_frequency(w, "en") >= COMMON_ZIPF)

    rows = [[it["w"], it["full"], it["zh"], it["note"], it["alias"], it["cat"], (it["common"] and 1) | (it.get("src") and 2 or 0)] for it in items]
    payload = {
        "cats": cats,
        "sources": ["EngNest 编写（MIT）", "computerese-cross-references（MIT，https://github.com/EarsEyesMouth/computerese-cross-references）"],
        "items": rows,
    }
    head = ("// 自动生成，请勿手改：计算机英语词典，由 tools/build_techdict.py 从 tools/techdict/*.txt 生成，\n"
            "// 另收 computerese-cross-references（MIT License，Copyright (c) 2017 EarsEyesMouth Team）的术语对照。\n"
            "// 每条：[术语, 英文全称, 中文, 解释, [别名], 分类下标, 标志位（1 = 日常常见词，2 = 来自 computerese）]\n")
    OUT.write_text(head + "window.TECH_DICT = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"自编 {len(items) - added} 条 + computerese {added} 条 = {len(items)} 条，{len(cats)} 个分类，"
          f"{OUT.stat().st_size / 1e3:.0f} KB → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
