"""把 hefengxian/my-ielts（个人雅思备考笔记，https://github.com/hefengxian/my-ielts）里的资料转成软件的格式，只供自己学习用。

需要先把仓库克隆到 tools/raw/ext/my-ielts（只要 src/pages，不要 500 MB 的单词音频，软件里有语音合成）：

    git clone --depth 1 --filter=blob:none --sparse https://github.com/hefengxian/my-ielts.git tools/raw/ext/my-ielts
    cd tools/raw/ext/my-ielts && git sparse-checkout set src/pages public/grammar

然后运行（需要 node 来读取 JS 数据文件）：

    python tools/import_my_ielts.py

输出：
- web/data/vocab_ielts_zj.js     词书「雅思词汇真经」（按章节）
- web/data/vocab_ielts_l179.js   词书「雅思听力 179 考点词」（带同义替换）
- web/data/vocab_ielts_r538.js   词书「雅思阅读 538 考点词」（按三类考点，带同义替换）
- web/data/ielts_extra.js        写作 100 句（中译英练习用）、英美拼写对照
音标从内置词典 assets/ecdict.db 补上；例句没有中文翻译。
"""

import json
import re
import sqlite3
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "raw" / "ext" / "my-ielts" / "src" / "pages"
OUT = ROOT / "web" / "data"
NOTE = "整理自 GitHub 上的 hefengxian/my-ielts（个人备考笔记），仅供个人学习"

# 用 node 执行 ES 模块写法的数据文件，导出成 JSON
NODE = r"""
const fs = require('fs');
const load = (p) => { const src = fs.readFileSync(p, 'utf8').replace(/export default/, 'module.exports ='); const m = { exports: {} }; new Function('module', 'exports', src)(m, m.exports); return m.exports; };
const base = process.argv[1];
process.stdout.write(JSON.stringify({
  vocab: load(base + '/vocabulary/vocabulary.js'),
  r538: load(base + '/reading/reading538words.js'),
  w100: load(base + '/writing/100sentences.js'),
  spell: load(base + '/listening/spelling_convention.js'),
}));
"""


def main():
    raw = subprocess.run(["node", "-e", NODE, str(SRC)], capture_output=True, check=True).stdout.decode("utf-8")
    data = json.loads(raw)
    l179 = json.loads((SRC / "listening" / "listening179.json").read_text(encoding="utf-8"))
    db = sqlite3.connect(ROOT / "assets" / "ecdict.db")

    def ph(word):
        r = db.execute("select phonetic from dict where lower=? and phonetic!='' limit 1", (word.lower(),)).fetchone()
        return f"/{r[0]}/" if r else ""

    # ---------- 词汇真经：每章一个单元 ----------
    units = []
    for key, ch in data["vocab"].items():
        words = []
        for group in ch["words"]:
            for w in group:
                spells = [s.strip() for s in w["word"] if s.strip()]
                if not spells:
                    continue
                main = spells[0]
                meaning = f'{w.get("pos", "").strip()} {w.get("meaning", "").strip()}'.strip()
                ex = (w.get("example") or "").strip()
                extra = (w.get("extra") or "").strip()
                mem = "；".join(x for x in [f"也写作 {', '.join(spells[1:])}" if len(spells) > 1 else "", extra if extra not in ("-", "") else ""] if x)
                words.append([main, ph(main), meaning, [[ex, ""]] if ex else [], [], mem, []])
        title = re.sub(r"^\d+_", "", ch["label"])
        units.append({"title": f"{len(units) + 1}. {title}", "words": words})
    write_book("vocab_ielts_zj.js", {"id": "ielts_zj", "title": "雅思词汇真经", "desc": f"按话题分章（自然地理、植物研究……）。{NOTE}", "units": units})

    # ---------- 听力 179 考点词：同义替换写在「记忆」里 ----------
    words = []
    for x in l179:
        words.append([x["word"], ph(x["word"]), f'{x.get("type", "")} {x.get("meaning", "")}'.strip(), [], [[r, "同义替换"] for r in (x.get("replace") or [])],
                      "", []])
    write_book("vocab_ielts_l179.js", {"id": "ielts_l179", "title": "雅思听力 179 考点词",
                                       "desc": f"听力里最常考的同义替换（题目说 book，录音里说 reserve）。{NOTE}",
                                       "units": [{"title": f"第 {i // 30 + 1} 组", "words": words[i:i + 30]} for i in range(0, len(words), 30)]})

    # ---------- 阅读 538 考点词：三类考点各一个单元 ----------
    units = []
    for cat in data["r538"]:
        ws = []
        for no, word, pos, mean, rep, extra in cat["words"]:
            ws.append([word, ph(word), f'{" ".join(pos)} {"；".join(mean)}'.strip(), [], [[r, "同义替换"] for r in rep], extra, []])
        units.append({"title": cat["title"], "en": f"{cat.get('define', '')}，要求{cat.get('require', '')}", "words": ws})
    write_book("vocab_ielts_r538.js", {"id": "ielts_r538", "title": "雅思阅读 538 考点词",
                                       "desc": f"阅读题目和原文之间最常见的同义替换，按考察概率分三类。{NOTE}", "units": units})

    # ---------- 写作 100 句、英美拼写对照 ----------
    w100, section = [], ""
    for s in data["w100"]:
        if s.get("no") is None:
            section = s.get("title", "")
            continue
        w100.append({"no": s["no"], "sec": section, "zh": s["sentence"], "en": s.get("translationFromBook", ""),
                     "alt": s.get("chatgpt", ""), "note": s.get("remark", "")})
    spell = [{"title": v.get("title", k), "desc": v.get("desc", ""), "columns": v.get("columns", []), "rows": v.get("rows", [])} for k, v in data["spell"].items()]
    (OUT / "ielts_extra.js").write_text(
        f"// 由 tools/import_my_ielts.py 生成：{NOTE}\n"
        "window.IELTS_W100 = " + json.dumps(w100, ensure_ascii=False) + ";\n"
        "window.IELTS_SPELLING = " + json.dumps(spell, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"写作 100 句：{len(w100)} 句；拼写对照：{sum(len(x['rows']) for x in spell)} 行")


def write_book(name, book):
    n = sum(len(u["words"]) for u in book["units"])
    no_ph = sum(1 for u in book["units"] for w in u["words"] if not w[1])
    (OUT / name).write_text(f"// 由 tools/import_my_ielts.py 生成\n(window.WORD_BOOKS = window.WORD_BOOKS || []).push("
                            + json.dumps(book, ensure_ascii=False, separators=(",", ":")) + ");\n", encoding="utf-8")
    print(f"{book['title']}：{len(book['units'])} 个单元、{n} 个词（{no_ph} 个没查到音标）")


if __name__ == "__main__":
    main()
