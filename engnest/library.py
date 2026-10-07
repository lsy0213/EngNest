"""「我的读物」：用户自己导入的文章和书（txt / epub / html 文件，或者粘贴的文字）。

导入后按章节切好，保存在 数据目录的 library/：
    index.json      书目 [{id, title, author, words, chapters: [[章节标题, 词数], ...], added, source}]
    <id>.json       正文 [[章节标题, [段落, ...]], ...]
内容只保存在本机，阅读页用和原著全文一样的阅读器打开。
"""

import html
import json
import re
import time
import zipfile
from pathlib import Path, PurePosixPath

from .paths import data_dir
from .storage import load_json, save_json

CHUNK_WORDS = 1500  # 没有章节标题的长文，按大约这么多词分成几部分
HEADING = re.compile(r"^\s*(?:(?:CHAPTER|Chapter|PART|Part)\s+(?:[IVXLC]+|\d+|[A-Z][a-z]+)\b.{0,60}|第[0-9一二三四五六七八九十百零]+[章节回篇].{0,30})\s*$")


def _dir() -> Path:
    d = data_dir() / "library"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _words(paras: list) -> int:
    return sum(len(p.split()) for p in paras)


# ---------- 把纯文本切成段落和章节 ----------
def _paragraphs(text: str) -> list:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    blocks = re.split(r"\n\s*\n", text)
    # 没有空行分段的文本（每行就是一段）：按行分
    if len(blocks) <= 2 and text.count("\n") > 10:
        blocks = text.split("\n")
    out = []
    for b in blocks:
        p = re.sub(r"\s+", " ", b).strip()
        if p:
            out.append(p)
    return out


def _chunk(paras: list, label: str = "Part") -> list:
    """按词数把段落分成几部分"""
    chapters, cur = [], []
    for p in paras:
        cur.append(p)
        if _words(cur) >= CHUNK_WORDS:
            chapters.append(cur)
            cur = []
    if cur:
        if chapters and _words(cur) < CHUNK_WORDS / 3:
            chapters[-1] += cur  # 最后一小段并到前一部分
        else:
            chapters.append(cur)
    if len(chapters) == 1:
        return [["", chapters[0]]]
    return [[f"{label} {i + 1}", ps] for i, ps in enumerate(chapters)]


def split_text(text: str) -> list:
    """纯文本 → [[章节标题, 段落], ...]：能认出章节标题就按章分，否则按长度分"""
    paras = _paragraphs(text)
    heads = [i for i, p in enumerate(paras) if HEADING.match(p)]
    if len(heads) >= 2:
        chapters = []
        if heads[0] > 0 and _words(paras[:heads[0]]) > 100:
            chapters.append(["Opening", paras[:heads[0]]])  # 第一章前面的序言之类
        for k, i in enumerate(heads):
            body = paras[i + 1:heads[k + 1] if k + 1 < len(heads) else len(paras)]
            if body:
                chapters.append([paras[i], body])
        return chapters
    return _chunk(paras)


# ---------- html / epub ----------
def _html_paragraphs(doc: str) -> list:
    doc = re.sub(r"(?is)<(script|style|head)\b.*?</\1>", "", doc)
    parts = re.findall(r"(?is)<(p|h[1-6]|li|blockquote|div)\b[^>]*>(.*?)</\1>", doc)
    out = []
    for _, inner in parts:
        if re.search(r"(?i)<(p|div)\b", inner):
            continue  # 嵌套的块：里面的 <p> 会单独匹配到
        t = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", inner))).strip()
        if t:
            out.append(t)
    if not out:  # 没有块级标签的简单网页
        out = _paragraphs(html.unescape(re.sub(r"<[^>]+>", "\n", doc)))
    return out


def _html_title(doc: str) -> str:
    m = re.search(r"(?is)<h[12]\b[^>]*>(.*?)</h[12]>", doc) or re.search(r"(?is)<title>(.*?)</title>", doc)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", m.group(1)))).strip() if m else ""


def read_epub(path: Path) -> tuple:
    """返回 (书名, 作者, [[章节标题, 段落], ...])，按 epub 的阅读顺序（spine）"""
    with zipfile.ZipFile(path) as z:
        container = z.read("META-INF/container.xml").decode("utf-8", "replace")
        opf_path = re.search(r'full-path="([^"]+)"', container).group(1)
        opf = z.read(opf_path).decode("utf-8", "replace")
        base = PurePosixPath(opf_path).parent
        title = re.search(r"(?is)<dc:title[^>]*>(.*?)</dc:title>", opf)
        author = re.search(r"(?is)<dc:creator[^>]*>(.*?)</dc:creator>", opf)
        manifest = {m.group(1): m.group(2) for m in re.finditer(r'<item\b[^>]*\bid="([^"]+)"[^>]*\bhref="([^"]+)"', opf)}
        manifest.update({m.group(2): m.group(1) for m in re.finditer(r'<item\b[^>]*\bhref="([^"]+)"[^>]*\bid="([^"]+)"', opf)})
        chapters = []
        for idref in re.findall(r'<itemref\b[^>]*\bidref="([^"]+)"', opf):
            href = manifest.get(idref)
            if not href or not re.search(r"\.x?html?$", href, re.I):
                continue
            name = str(base / href) if str(base) != "." else href
            try:
                doc = z.read(name.replace("%20", " ")).decode("utf-8", "replace")
            except KeyError:
                continue
            paras = _html_paragraphs(doc)
            if _words(paras) < 80:
                continue  # 封面、目录、版权页
            t = _html_title(doc)
            if paras and t and paras[0] == t:
                paras = paras[1:]
            chapters.append([t, paras])
    clean = lambda m: html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else ""
    # 太长的一章再按长度切开，方便阅读和记进度
    out = []
    for t, ps in chapters:
        parts = _chunk(ps) if _words(ps) > CHUNK_WORDS * 3 else [["", ps]]
        for k, (_, sub) in enumerate(parts):
            out.append([(t or f"Section {len(out) + 1}") + (f" ({k + 1})" if len(parts) > 1 else ""), sub])
    return clean(title), clean(author), out


def read_file(path: Path) -> tuple:
    suffix = path.suffix.lower()
    if suffix == ".epub":
        return read_epub(path)
    raw = path.read_bytes()
    for enc in ("utf-8-sig", "gb18030", "latin-1"):  # 中文 Windows 上的 txt 常常是 GBK
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if suffix in (".html", ".htm", ".xhtml"):
        return _html_title(text) or path.stem, "", _chunk(_html_paragraphs(text))
    return path.stem, "", split_text(text)


# ---------- 书目 ----------
class Library:
    def index(self) -> list:
        return load_json(_dir() / "index.json", [])

    def _save(self, title: str, author: str, chapters: list, source: str) -> dict:
        chapters = [[t or (f"Part {i + 1}" if len(chapters) > 1 else ""), ps] for i, (t, ps) in enumerate(chapters) if ps]
        if not chapters:
            raise ValueError("没有读到正文内容")
        if sum(_words(ps) for _, ps in chapters) < 20:
            raise ValueError("英文内容太少了")
        bid = f"imp-{int(time.time() * 1000)}"
        save_json(_dir() / f"{bid}.json", chapters)
        meta = {"id": bid, "title": title.strip()[:120] or "未命名", "author": author.strip()[:80], "source": source,
                "added": time.strftime("%Y-%m-%d"), "words": sum(_words(ps) for _, ps in chapters),
                "chapters": [[t, _words(ps)] for t, ps in chapters]}
        save_json(_dir() / "index.json", [meta] + self.index())
        return meta

    def import_path(self, path: str) -> dict:
        p = Path(path)
        title, author, chapters = read_file(p)
        return self._save(title or p.stem, author, chapters, p.name)

    def import_text(self, title: str, text: str) -> dict:
        return self._save(title or (text.strip().split("\n")[0][:60]), "", split_text(text), "粘贴")

    def load(self, bid: str) -> list:
        if not re.fullmatch(r"imp-\d+", bid or ""):
            return []
        return load_json(_dir() / f"{bid}.json", [])

    def delete(self, bid: str) -> bool:
        if not re.fullmatch(r"imp-\d+", bid or ""):
            return False
        (_dir() / f"{bid}.json").unlink(missing_ok=True)
        save_json(_dir() / "index.json", [m for m in self.index() if m["id"] != bid])
        return True
