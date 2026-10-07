"""简明英文维基百科（Simple English Wikipedia）：用简单英语写的百科文章。

文字使用 CC BY-SA 4.0 协议：使用时注明来源（文章标题和链接，作者见页面历史）并以同样协议共享。
tools/fetch_wiki.py 用它生成内置的精选文章；应用里联网时也可以搜索、阅读任意文章。
"""

import json
import re
import urllib.parse
import urllib.request

API = "https://simple.wikipedia.org/w/api.php"
UA = "EngNest/0.3 (personal English-learning desktop app; educational use)"
LICENSE = "CC BY-SA 4.0"
DROP_SECTIONS = {"references", "related pages", "other websites", "notes", "sources", "further reading", "external links",
                 "gallery", "footnotes", "bibliography"}
MAX_WORDS = 4000


def _api(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json", "formatversion": "2"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def page_url(title: str) -> str:
    return "https://simple.wikipedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"))


def search(q: str, limit: int = 20) -> list:
    res = _api({"action": "query", "list": "search", "srsearch": q, "srlimit": limit, "srprop": "snippet|wordcount"})
    return [{"title": r["title"], "words": r.get("wordcount", 0),
             "snippet": re.sub(r"<[^>]+>", "", r.get("snippet", "")).replace("&quot;", '"').replace("&amp;", "&")}
            for r in res.get("query", {}).get("search", [])]


def article(title: str) -> dict:
    """返回 {title, url, license, paras}；段落里的小标题单独成段。查不到返回 None"""
    res = _api({"action": "query", "prop": "extracts", "explaintext": 1, "exsectionformat": "wiki",
                "redirects": 1, "titles": title})
    pages = res.get("query", {}).get("pages", [])
    if not pages or pages[0].get("missing") or not pages[0].get("extract"):
        return None
    page = pages[0]
    paras, skip, words = [], False, 0
    for block in page["extract"].split("\n"):
        line = block.strip()
        if not line:
            continue
        m = re.match(r"^(=+)\s*(.*?)\s*=+$", line)
        if m:
            skip = m.group(2).lower() in DROP_SECTIONS or (skip and len(m.group(1)) > 2)
            if not skip:
                paras.append(m.group(2))
            continue
        if skip:
            continue
        paras.append(line)
        words += len(line.split())
        if words > MAX_WORDS:
            break
    # 结尾如果是小标题（下面的内容被删了），去掉
    while paras and len(paras[-1].split()) <= 6 and not paras[-1].endswith((".", "!", "?")):
        paras.pop()
    return {"title": page["title"], "url": page_url(page["title"]), "license": LICENSE, "paras": paras}
