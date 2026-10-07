"""资料包：不能随软件分发、需要用户自己下载到本机的学习资料。

现在有一个：
- my-ielts（hefengxian/my-ielts，一位考生的雅思备考笔记，未声明开源协议，仅供个人学习）：
  雅思词汇真经、听力 179 考点词、阅读 538 考点词、写作 100 句、英美拼写对照、语法思维导图和讲义。

下载固定提交的原始文件（GitHub 连不上换 jsDelivr 和镜像，核对 SHA256），在本机转换成软件的格式，
放在数据目录的 packs/<包名>/。packs/index.js 列出已经装好的包，页面启动时（core.js 之前）同步加载它。
"""

import json
import logging
import re
import shutil
import threading
import urllib.parse
from pathlib import Path

from . import net
from .paths import sub_dir

log = logging.getLogger(__name__)

MY_IELTS_COMMIT = "5cef573933663c4673c6e0093f1df04e68018b1a"
MY_IELTS_FILES = {
    "src/pages/vocabulary/vocabulary.js": (858988, "e21e604c16c30f1310dc025ccf6e58b93f2f525b231735f0b27e093d5e0eb1ce"),
    "src/pages/reading/reading538words.js": (27522, "a324d65bb16f5983f69b834aa299fe2fac8e61911120dab154e6c795fd1ca39f"),
    "src/pages/writing/100sentences.js": (39289, "b29c6520c351cf5e049d647c1d6a8723ed462bde5439510fa0fe8783b90ab9cd"),
    "src/pages/listening/spelling_convention.js": (4505, "c5606e4464c543744677cfac88c184edbb70689c737dd34aaf2ca9eb0ed1584b"),
    "src/pages/listening/listening179.json": (29569, "b0fec281c2e2668eedc04c61c89cb7f4169aa46517e6c0bb02c4d852e21eec1e"),
    "public/grammar/雅思基础语法配套课程讲义.pdf": (1142063, "5137463fd8e8b6995d20115e9f4688b4e245628acb20014a8f38551269d7bb2f"),
    "public/grammar/雅思语法.svg": (213517, "affb1eb266ab359be3cbe8cfe3446be1c983b8d99e51c753d83c0ed32092e131"),
}
NOTE = "整理自 GitHub 上的 hefengxian/my-ielts（个人备考笔记），仅供个人学习"
PACKS = {
    "my-ielts": {
        "name": "雅思资料包（my-ielts 备考笔记）",
        "desc": "雅思词汇真经（22 个话题、3674 词）、听力 179 考点词、阅读 538 考点词、写作 100 句、英美拼写对照、语法思维导图和讲义（PDF）",
        "size_mb": 2.3,
        "license": "原作者没有声明开源协议：只供你自己学习，请不要再分发",
        "home": "https://github.com/hefengxian/my-ielts",
        # 装好后页面要加载的脚本（顺序有关系）
        "scripts": ["vocab_ielts_zj.js", "vocab_ielts_l179.js", "vocab_ielts_r538.js", "ielts_extra.js"],
    },
}


def packs_dir() -> Path:
    return sub_dir("packs")


def pack_dir(pid: str) -> Path:
    return packs_dir() / pid


def installed(pid: str) -> bool:
    return (pack_dir(pid) / "pack.json").exists()


# ---------- 把 JS 对象字面量转成 JSON ----------
_IDENT = re.compile(r"[A-Za-z_$][\w$]*")


def js_literal_to_json(src: str) -> str:
    """把 `{ no: 1, title: '…', }` 这种 JS 写法（单引号、不带引号的键、尾逗号、注释）转成合法 JSON。
    只处理数据文件里会出现的写法，不是完整的 JS 解析器。"""
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in "\"'":
            j, buf = i + 1, []
            while j < n and src[j] != c:
                if src[j] == "\\" and j + 1 < n:
                    nxt = src[j + 1]
                    if nxt in "ux":  # \uXXXX、\xXX
                        width = 4 if nxt == "u" else 2
                        hexd = src[j + 2:j + 2 + width]
                        if re.fullmatch(r"[0-9a-fA-F]{%d}" % width, hexd):
                            buf.append(chr(int(hexd, 16)))
                            j += 2 + width
                            continue
                    buf.append({"n": "\n", "t": "\t", "r": "\r", "'": "'", '"': '"', "\\": "\\"}.get(nxt, nxt))
                    j += 2
                    continue
                buf.append(src[j])
                j += 1
            out.append(json.dumps("".join(buf), ensure_ascii=False))
            i = j + 1
        elif src.startswith("//", i):
            i = src.find("\n", i) if src.find("\n", i) != -1 else n
        elif src.startswith("/*", i):
            i = src.find("*/", i) + 2 if src.find("*/", i) != -1 else n
        elif c == "," and re.match(r",\s*[}\]]", src[i:i + 200], re.S):
            i += 1  # 尾逗号
        elif _IDENT.match(src, i) and (i == 0 or not (src[i - 1].isalnum() or src[i - 1] in "_$.")):
            m = _IDENT.match(src, i)
            word = m.group(0)
            rest = src[m.end():m.end() + 50].lstrip()
            if rest.startswith(":"):
                out.append(json.dumps(word))  # 对象的键
            elif word in ("true", "false", "null"):
                out.append(word)
            elif word == "undefined":
                out.append("null")
            else:
                raise ValueError(f"不认识的写法：{word}")
            i = m.end()
        else:
            out.append(c)
            i += 1
    return "".join(out)


def load_js_data(text: str):
    """数据文件：`export default …` 或 `const x = …;`（后面可能还有 export default x），取出等号或 export 后面的值"""
    text = re.sub(r"(?s)^\s*/\*.*?\*/", "", text).strip()
    m = re.search(r"(?:export\s+default|=)\s*([\[{])", text)
    if not m:
        raise ValueError("没找到数据")
    start = m.start(1)
    body = text[start:]
    # 截到和开头配对的括号（之后可能还有 export default xxx）
    depth, quote, k = 0, "", 0
    while k < len(body):
        ch = body[k]
        if quote:
            if ch == "\\":
                k += 1
            elif ch == quote:
                quote = ""
        elif ch in "\"'`":
            quote = ch
        elif ch in "[{":
            depth += 1
        elif ch in "]}":
            depth -= 1
            if depth == 0:
                break
        k += 1
    return json.loads(js_literal_to_json(body[:k + 1]))


# ---------- my-ielts 的转换（和以前的 tools/import_my_ielts.py 一样） ----------
def convert_my_ielts(raw: Path, out: Path, phonetic) -> dict:
    """raw：下载的原始文件（按仓库里的路径）；phonetic(word) 返回音标（不带斜线）或空。返回统计。"""
    read = lambda rel: (raw / rel).read_text(encoding="utf-8")  # noqa: E731
    ph = lambda w: f"/{p}/" if (p := phonetic(w)) else ""  # noqa: E731
    vocab = load_js_data(read("src/pages/vocabulary/vocabulary.js"))
    r538 = load_js_data(read("src/pages/reading/reading538words.js"))
    w100raw = load_js_data(read("src/pages/writing/100sentences.js"))
    spell = load_js_data(read("src/pages/listening/spelling_convention.js"))
    l179 = json.loads(read("src/pages/listening/listening179.json"))
    out.mkdir(parents=True, exist_ok=True)
    stats = {}

    def write_book(name, book):
        (out / name).write_text("// 由 EngNest 在本机从 my-ielts 转换，仅供个人学习\n(window.WORD_BOOKS = window.WORD_BOOKS || []).push("
                                + json.dumps(book, ensure_ascii=False, separators=(",", ":")) + ");\n", encoding="utf-8")
        stats[book["id"]] = sum(len(u["words"]) for u in book["units"])

    units = []
    for ch in vocab.values():
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

    words = [[x["word"], ph(x["word"]), f'{x.get("type", "")} {x.get("meaning", "")}'.strip(), [], [[r, "同义替换"] for r in (x.get("replace") or [])], "", []]
             for x in l179]
    write_book("vocab_ielts_l179.js", {"id": "ielts_l179", "title": "雅思听力 179 考点词", "desc": f"听力里最常考的同义替换（题目说 book，录音里说 reserve）。{NOTE}",
                                       "units": [{"title": f"第 {i // 30 + 1} 组", "words": words[i:i + 30]} for i in range(0, len(words), 30)]})

    units = []
    for cat in r538:
        ws = [[word, ph(word), f'{" ".join(pos)} {"；".join(mean)}'.strip(), [], [[r, "同义替换"] for r in rep], extra, []]
              for _no, word, pos, mean, rep, extra in cat["words"]]
        units.append({"title": cat["title"], "en": f"{cat.get('define', '')}，要求{cat.get('require', '')}", "words": ws})
    write_book("vocab_ielts_r538.js", {"id": "ielts_r538", "title": "雅思阅读 538 考点词", "desc": f"阅读题目和原文之间最常见的同义替换，按考察概率分三类。{NOTE}", "units": units})

    w100, section = [], ""
    for s in w100raw:
        if s.get("no") is None:
            section = s.get("title", "")
            continue
        w100.append({"no": s["no"], "sec": section, "zh": s["sentence"], "en": s.get("translationFromBook", ""), "alt": s.get("chatgpt", ""), "note": s.get("remark", "")})
    sp = [{"title": v.get("title", k), "desc": v.get("desc", ""), "columns": v.get("columns", []), "rows": v.get("rows", [])} for k, v in spell.items()]
    (out / "ielts_extra.js").write_text(f"// 由 EngNest 在本机从 my-ielts 转换：{NOTE}\nwindow.IELTS_W100 = " + json.dumps(w100, ensure_ascii=False)
                                        + ";\nwindow.IELTS_SPELLING = " + json.dumps(sp, ensure_ascii=False) + ";\n", encoding="utf-8")
    stats["w100"] = len(w100)
    shutil.copyfile(raw / "public/grammar/雅思语法.svg", out / "grammar-mindmap.svg")
    shutil.copyfile(raw / "public/grammar/雅思基础语法配套课程讲义.pdf", out / "grammar-notes.pdf")
    return stats


def write_index():
    """packs/index.js：页面启动时加载，里面再按顺序加载各个包的脚本"""
    base = packs_dir()
    scripts = [f"{pid}/{s}" for pid, p in PACKS.items() if installed(pid) for s in p["scripts"]]
    lines = ["// EngNest 生成：已经安装的资料包（不要手改）",
             f"window.ENGNEST_PACKS = {json.dumps([pid for pid in PACKS if installed(pid)])};"]
    lines += [f'document.write(\'<script src="\' + window.ENGNEST_PACK_BASE + \'/{s}"><\\/script>\');' for s in scripts]
    (base / "index.js").write_text("\n".join(lines) + "\n", encoding="utf-8")


class Packs:
    def __init__(self, phonetic):
        self.phonetic = phonetic
        self.task = {"id": "", "running": False, "progress": 0.0, "stage": "", "error": ""}
        try:
            write_index()
        except OSError as e:
            log.error("写资料包索引失败：%s", e)

    def status(self) -> dict:
        return {"packs": {pid: {**{k: v for k, v in p.items() if k != "scripts"}, "installed": installed(pid)} for pid, p in PACKS.items()},
                "base": packs_dir().as_uri(), **self.task}

    def install(self, pid: str) -> bool:
        if pid not in PACKS or self.task["running"]:
            return False
        self.task = {"id": pid, "running": True, "progress": 0.0, "stage": "download", "error": ""}
        threading.Thread(target=self._install, args=(pid,), daemon=True).start()
        return True

    def _install(self, pid):
        raw = pack_dir(pid) / "raw"
        try:
            total = sum(s for s, _ in MY_IELTS_FILES.values())
            done = 0
            for rel, (size, sha) in MY_IELTS_FILES.items():
                q = urllib.parse.quote(rel)
                urls = (net.github_mirrors(f"https://raw.githubusercontent.com/hefengxian/my-ielts/{MY_IELTS_COMMIT}/{q}")[:1]
                        + [f"https://cdn.jsdelivr.net/gh/hefengxian/my-ielts@{MY_IELTS_COMMIT}/{q}"]
                        + net.github_mirrors(f"https://raw.githubusercontent.com/hefengxian/my-ielts/{MY_IELTS_COMMIT}/{q}")[1:])
                net.download(urls, raw / rel, sha256=sha, size=size,
                             progress=lambda got, _t, base=done: self.task.update(progress=0.9 * (base + got) / total))
                done += size
            self.task.update(stage="convert", progress=0.92)
            stats = convert_my_ielts(raw, pack_dir(pid), self.phonetic)
            (pack_dir(pid) / "pack.json").write_text(json.dumps({"id": pid, "commit": MY_IELTS_COMMIT, "stats": stats}, ensure_ascii=False), encoding="utf-8")
            shutil.rmtree(raw, ignore_errors=True)
            write_index()
            self.task.update(running=False, progress=1.0, stage="done")
            log.info("资料包 %s 已安装：%s", pid, stats)
        except Exception as e:  # noqa: BLE001 — 网络、转换出错都告诉用户
            log.exception("安装资料包 %s 失败", pid)
            self.task.update(running=False, stage="error", error=str(e))

    def remove(self, pid: str) -> bool:
        if pid not in PACKS:
            return False
        shutil.rmtree(pack_dir(pid), ignore_errors=True)
        write_index()
        return True

    def file_path(self, pid: str, name: str):
        """包里的一个文件（语法讲义 PDF 等），只允许包自己文件夹里的普通文件名"""
        if pid not in PACKS or not re.fullmatch(r"[\w.-]+", name or ""):
            return None
        p = pack_dir(pid) / name
        return p if p.is_file() else None
