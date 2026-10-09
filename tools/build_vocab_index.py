"""生成词书目录 web/data/vocab_index.js：每本大词书的标题、简介、单元，以及每个单元里的单词（只有单词本身）。

启动时只加载这个目录（约 300 KB，压缩后一百多 KB），释义、例句、短语这些完整内容在用到那本词书时才加载
（见 web/js/core.js 的 Books）。改了任何一个 vocab_*.js（重新跑 build_vocab.py / build_domain_vocab.py）以后要重新跑：
    python tools/build_vocab_index.py
"""

import hashlib
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "web" / "data"
# 按词书列表里的顺序；入门精选（words.js）和主题词汇（topics_*.js）很小，还是启动时直接加载
LAZY = ["cet4", "cet6", "ielts", "toefl", "ielts_topic", "med", "tech", "law", "fin"]
PREFIX = "(window.WORD_BOOKS = window.WORD_BOOKS || []).push("


def read_book(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    start = text.index(PREFIX) + len(PREFIX)
    end = text.rindex(");")
    return json.loads(text[start:end])


def main():
    out = []
    for bid in LAZY:
        path = DATA / f"vocab_{bid}.js"
        book = read_book(path)
        assert book["id"] == bid, f"{path.name} 里的 id 是 {book['id']}"
        meta = {k: v for k, v in book.items() if k != "units"}
        meta["file"] = f"data/{path.name}"
        meta["v"] = hashlib.sha1(path.read_bytes()).hexdigest()[:10]  # 服务器上带版本号加载，浏览器可以长期缓存
        meta["stub"] = True
        units = []
        for u in book["units"]:
            words = [w[0] for w in u["words"]]
            assert not any("|" in w for w in words), f"{bid} 里有单词带 |"
            units.append({**{k: v for k, v in u.items() if k != "words"}, "w": "|".join(words)})
        meta["units"] = units
        out.append(meta)
    body = ",\n".join(json.dumps(b, ensure_ascii=False, separators=(",", ":")) for b in out)
    (DATA / "vocab_index.js").write_text(
        "// 自动生成，请勿手改：大词书的目录（标题、单元、每个单元的单词），由 tools/build_vocab_index.py 从 vocab_*.js 生成\n"
        "// 启动时只加载这个目录，词书的完整内容用到时才加载（见 core.js 的 Books）\n"
        + PREFIX + "\n" + body + "\n);\n", encoding="utf-8", newline="\n")
    print(f"vocab_index.js：{len(out)} 本词书，{sum(len(u['w'].split('|')) for b in out for u in b['units'])} 个词")


if __name__ == "__main__":
    main()
