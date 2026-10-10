"""从网址导入文章：打开网页，像浏览器的「阅读模式」那样取出正文，存进「我的读物」。

安全：服务器上任何账号都能用这个功能，不能让它变成探内网的工具——
只认 http / https；网址解析出来的地址必须是公网地址（本机、局域网、链路本地、云服务器的元数据地址都不行），
每次跳转都重新检查；只读 HTML 和纯文本，最多 5 MB，20 秒超时。

取正文：去掉脚本、导航、页眉页脚、侧栏、评论、分享、广告这些；优先用 <article> / <main>，
没有的话找包含了大部分正文段落的那一块（段落越长分越高），再按顺序取出里面的段落、小标题、列表项。
"""

import html
import ipaddress
import re
import socket
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

from . import VERSION, net
from .library import _chunk, _words, split_text

MAX_BYTES = 5 * 1024 * 1024
TIMEOUT = 20
UA = f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 EngNest/{VERSION}"

SKIP = {"script", "style", "noscript", "svg", "nav", "header", "footer", "aside", "form", "button", "select", "textarea",
        "iframe", "template", "figure", "canvas", "video", "audio", "object", "dialog", "menu"}
VOID = {"br", "hr", "img", "input", "meta", "link", "source", "wbr", "area", "base", "col", "embed", "param", "track"}
BLOCKS = {"p", "h1", "h2", "h3", "h4", "li", "blockquote", "pre", "dd"}
# class / id 里带这些词的整块跳过（评论、分享、相关推荐、订阅、广告……）
NOISE = re.compile(r"(?:^|[\s_-])(?:comments?|share|sharing|social|related|recommend\w*|promo\w*|newsletter|subscri\w*|sidebar|"
                   r"footer|nav\w*|menu|ads?|advert\w*|sponsor\w*|cookie\w*|banner|popup|modal|breadcrumbs?|byline-share|"
                   r"paywall|signup|login|toolbar|tags?|references?|reflist|citations?|footnotes?|editsection)(?:$|[\s_-])", re.I)


class BadUrl(ValueError):
    pass


# ---------- 网址检查 ----------
# Clash 这类代理工具的 fake-ip 模式：所有域名都解析成 198.18.0.0/15 里的假地址，真正的连接由代理转出去。
# 只对域名放行这一段（直接写 198.18.x.x 的网址不行）
FAKE_IP = ipaddress.ip_network("198.18.0.0/15")


def _public(ip: str, domain: bool = False) -> bool:
    a = ipaddress.ip_address(ip.split("%")[0])
    if a.version == 6 and a.ipv4_mapped:
        a = a.ipv4_mapped
    if domain and a in FAKE_IP:
        return True
    return a.is_global and not a.is_multicast


def check_url(url: str) -> str:
    u = urllib.parse.urlsplit((url or "").strip())
    if u.scheme not in ("http", "https") or not u.hostname:
        raise BadUrl("只能导入 http:// 或 https:// 开头的网址")
    host = u.hostname
    try:
        ipaddress.ip_address(host)
        literal = True
    except ValueError:
        literal = False
    try:
        infos = socket.getaddrinfo(host, u.port or (443 if u.scheme == "https" else 80), type=socket.SOCK_STREAM)
    except (socket.gaierror, UnicodeError):
        # 本机查不到域名、但设置了代理：交给代理去解析（明显是内网的名字除外）
        if net.proxy() and not literal and "." in host and not host.endswith((".local", ".localhost", ".internal", ".lan", ".home")):
            return url
        raise BadUrl(f"找不到网站 {host}，检查一下网址有没有写错")
    if not infos or not all(_public(i[4][0], not literal) for i in infos):
        raise BadUrl("不能导入本机或局域网里的网址")
    return url


class _SafeRedirect(urllib.request.HTTPRedirectHandler):
    max_redirections = 5

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        check_url(urllib.parse.urljoin(req.full_url, newurl))
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _decode(raw: bytes, charset: str) -> str:
    if not charset:
        m = re.search(rb"""<meta[^>]+charset=["']?([\w-]+)""", raw[:4096], re.I)
        charset = m.group(1).decode("ascii", "ignore") if m else ""
    for enc in filter(None, (charset, "utf-8", "gb18030")):
        try:
            return raw.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
    return raw.decode("latin-1")


def download(url: str) -> tuple:
    """返回 (最后的网址, 内容类型, 文字)"""
    check_url(url)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
                                               "Accept-Language": "en,zh-CN;q=0.8"})
    try:
        with net.opener(_SafeRedirect()).open(req, timeout=TIMEOUT) as r:
            ctype = r.headers.get_content_type()
            if ctype not in ("text/html", "application/xhtml+xml", "text/plain"):
                raise BadUrl(f"这个网址打开的不是网页（{ctype}）。电子书请下载下来用「导入文件」，PDF 请复制文字后粘贴")
            raw = r.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                raise BadUrl("网页太大了，复制正文后用「粘贴文字」导入吧")
            return r.geturl(), ctype, _decode(raw, r.headers.get_content_charset())
    except urllib.error.HTTPError as e:
        hint = "：可能要登录或者订阅才能看，可以复制文字后粘贴导入" if e.code in (401, 402, 403, 451) else ""
        raise BadUrl(f"网站返回了错误 {e.code}{hint}") from None
    except urllib.error.URLError as e:
        if isinstance(e.reason, BadUrl):
            raise e.reason from None
        raise BadUrl(f"打不开这个网址（{e.reason}）") from None
    except (TimeoutError, socket.timeout):
        raise BadUrl("网站太久没有响应，稍后再试") from None


# ---------- 取正文 ----------
class _Node:
    __slots__ = ("tag", "attrs", "parent", "kids")

    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent, self.kids = tag, attrs, parent, []


class _Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = self.cur = _Node("root", {}, None)
        self.skip = 0  # 在要跳过的块里面有几层
        self.meta = {}
        self.title = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        a = {k: v or "" for k, v in attrs}
        if tag == "meta":
            key = (a.get("property") or a.get("name") or "").lower()
            if key and a.get("content"):
                self.meta.setdefault(key, a["content"])
            return
        if tag == "title":
            self._in_title = True
        if tag in VOID:
            if tag == "br" and not self.skip:
                self.cur.kids.append("\n")
            return
        if self.skip:
            self.skip += 1
            return
        noisy = tag not in ("html", "body", "main", "article") and NOISE.search(f"{a.get('class', '')} {a.get('id', '')}")
        if tag in SKIP or noisy or a.get("hidden") is not None or a.get("aria-hidden") == "true":
            self.skip = 1
            return
        node = _Node(tag, a, self.cur)
        self.cur.kids.append(node)
        self.cur = node

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag in VOID:
            return
        if self.skip:
            self.skip -= 1
            return
        n = self.cur
        while n is not self.root and n.tag != tag:  # 没闭合的标签（比如 <p> 后面直接跟 <p>）一起关掉
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif not self.skip:
            self.cur.kids.append(data)


def _text(node) -> str:
    out = []

    def walk(n):
        for k in n.kids:
            if isinstance(k, str):
                out.append(k)
            else:
                walk(k)
    walk(node)
    return re.sub(r"\s+", " ", "".join(out)).strip()


def _nodes(node, tags):
    for k in node.kids:
        if not isinstance(k, str):
            if k.tag in tags:
                yield k
            yield from _nodes(k, tags)


def _has_block(node) -> bool:
    return any(True for _ in _nodes(node, BLOCKS))


def _blocks(node) -> list:
    """按顺序取出这一块里的段落、小标题、列表项 [(标签, 文字, 链接文字占比)]；块里还套着块的往里走"""
    out = []

    def walk(n):
        for k in n.kids:
            if isinstance(k, str):
                continue
            if k.tag in BLOCKS and not _has_block(k):
                t = _text(k)
                if t:
                    links = sum(len(_text(a)) for a in _nodes(k, {"a"}))
                    out.append((k.tag, t, links / len(t)))
            else:
                walk(k)
    walk(node)
    return out


def _content_root(root):
    """正文所在的那一块"""
    weight = {}  # 每个节点下面「像正文的段落」一共多少词

    for p in _nodes(root, {"p"}):
        w = len(_text(p).split())
        if w < 8:
            continue
        n = p.parent
        while n is not None:
            weight[id(n)] = weight.get(id(n), 0) + w
            n = n.parent
    total = weight.get(id(root), 0)
    if not total:
        return root
    for tag in ("article", "main"):
        best = max(_nodes(root, {tag}), key=lambda n: weight.get(id(n), 0), default=None)
        if best is not None and weight.get(id(best), 0) >= max(120, total * 0.4):
            return best
    # 包含了大部分正文的最深的那一块
    node = root
    while True:
        kids = [k for k in node.kids if not isinstance(k, str) and weight.get(id(k), 0) >= total * 0.75]
        if not kids:
            return node
        node = kids[0]


def _clean_title(t: str, h1: str = "") -> str:
    t = re.sub(r"\s+", " ", html.unescape(t or "")).strip()
    if h1 and h1 in t:  # 「Volcano - Simple English Wikipedia」：正文的大标题就是文章名
        return h1
    parts = re.split(r"\s+[|–—-]\s+", t)  # 「标题 | 网站名」
    return parts[0] if len(parts) > 1 and len(parts[0]) >= 12 else t


def extract(doc: str) -> dict:
    """网页 → {title, author, paras}"""
    tree = _Tree()
    tree.feed(doc)
    tree.close()
    m = tree.meta
    # 大标题常常在 <header> 里（取正文时跳过了），直接从网页里找第一个 <h1>
    found = re.search(r"(?is)<h1\b[^>]*>(.*?)</h1>", doc)
    h1 = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", found.group(1)))).strip() if found else ""
    title = _clean_title(m.get("og:title") or m.get("twitter:title") or h1 or tree.title, h1)
    author = m.get("author") or m.get("article:author") or m.get("parsely-author") or ""
    if author.startswith("http"):
        author = ""
    items, seen = [], set()
    for tag, t, links in _blocks(_content_root(tree.root)):
        words = len(t.split())
        heading = tag in ("h1", "h2", "h3", "h4")
        if (heading and words > 20) or (not heading and words < (4 if tag == "li" else 3)):
            continue
        # 几乎全是链接的列表项、短段落：相关文章、目录、标签
        if links > 0.6 and (tag == "li" or heading or words < 25):
            continue
        if t.lower() in seen or (heading and t == title) or re.fullmatch(r"(?i)advertisement|continue reading.*|read more.*", t):
            continue
        seen.add(t.lower())
        items.append((heading, t))
    # 小标题下面没有正文的（比如去掉链接后剩下的「Related」）不要
    items = [x for i, x in enumerate(items) if not x[0] or (i + 1 < len(items) and not items[i + 1][0])]
    # 第一段像样的正文之前的零碎短句（播放器提示、图片说明之类）不要
    first = next((i for i, (h, t) in enumerate(items) if not h and len(t.split()) >= 15), 0)
    items = [x for i, x in enumerate(items) if i >= first or x[0] or len(x[1].split()) >= 8]
    return {"title": title, "author": author.strip()[:80], "paras": [t for _, t in items]}


def fetch_article(url: str) -> dict:
    """网址 → {title, author, chapters, site, url}，读不到正文抛 BadUrl"""
    final, ctype, text = download(url)
    site = (urllib.parse.urlsplit(final).hostname or "").removeprefix("www.")
    if ctype == "text/plain":
        chapters = split_text(text)
        title = text.strip().split("\n")[0][:80]
        author = ""
    else:
        a = extract(text)
        chapters = _chunk(a["paras"]) if a["paras"] else []
        title, author = a["title"], a["author"]
    if sum(_words(ps) for _, ps in chapters) < 80:
        raise BadUrl("没读到正文：这个网页可能要登录才能看，或者内容是用脚本加载的。可以在浏览器里复制文字，用「粘贴文字」导入")
    return {"title": title or site, "author": author, "chapters": chapters, "site": site, "url": final}
