"""从网址导入：只许公网地址（服务器上不能拿它探内网）、取正文去掉导航评论广告、导入后在书库里。不连网。"""

import socket
import urllib.request

import pytest

from engnest import lan, net, webimport
from engnest.api import Api

BODY = " ".join(["Scientists say the small island has become a home for rare birds that travel thousands of miles."] * 3)
PAGE = f"""<!doctype html><html><head><meta charset="utf-8"><title>Birds return | The Daily Paper</title>
<meta property="og:title" content="Rare birds return to a quiet island"><meta name="author" content="Jane Writer"></head>
<body class="has-sidebar">
<header><nav><a href="/">Home</a> <a href="/world">World news section link text here</a></nav></header>
<div class="layout"><main><article>
  <h1>Rare birds return to a quiet island</h1>
  <p>No media source currently available</p>
  <p>{BODY}</p>
  <h2>A long journey</h2>
  <p>{BODY} They rest here every spring before flying north again.</p>
  <div class="share-tools"><p>Share this story on social media with all of your friends and family today.</p></div>
  <figure><img src="x.jpg"><figcaption>A photo caption that should not appear in the text at all.</figcaption></figure>
  <ul><li>The island is about two kilometres long.</li><li>Ok</li></ul>
  <p>Advertisement</p>
  <p>{BODY} Local people now help to protect the nests.</p>
  <h3>Related</h3>
  <ul><li><a href="/1">Another story about birds that live on small islands</a></li><li><a href="/2">Why some birds fly so far every year</a></li></ul>
</article>
<section id="comments"><p>This is a reader comment that is long enough to look like a paragraph of text.</p></section>
</main><aside><p>Related: another story that is long enough to look like a real paragraph here.</p></aside></div>
<footer><p>Copyright 2026 The Daily Paper. All rights reserved by the company and its owners.</p></footer>
<script>var x = "<p>not text</p>";</script></body></html>"""


def fake_dns(mapping):
    def getaddrinfo(host, port, *a, **k):
        if host not in mapping:
            raise socket.gaierror("not found")
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, port)) for ip in mapping[host]]
    return getaddrinfo


@pytest.fixture
def dns(monkeypatch):
    monkeypatch.setattr(net, "proxy", lambda: "")  # 不管这台电脑有没有设系统代理
    monkeypatch.setattr(webimport.socket, "getaddrinfo", fake_dns({
        "news.example.com": ["93.184.216.34"], "localhost": ["127.0.0.1"], "intranet.example.com": ["10.1.2.3"],
        "sneaky.example.com": ["93.184.216.34", "192.168.1.5"], "v6.example.com": ["::ffff:127.0.0.1"],
        "clash.example.com": ["198.18.0.62"],
    }))


def test_extract_keeps_article_and_drops_noise():
    a = webimport.extract(PAGE)
    assert a["title"] == "Rare birds return to a quiet island" and a["author"] == "Jane Writer"
    text = "\n".join(a["paras"])
    assert a["paras"][0].startswith("Scientists say") and "A long journey" in a["paras"]
    assert "protect the nests" in text and "two kilometres" in text
    for junk in ("World news", "Share this story", "photo caption", "reader comment", "Related", "Copyright", "not text", "Advertisement",
                 "No media source", "Another story", "fly so far"):
        assert junk not in text, junk
    assert "Ok" not in a["paras"]                       # 太短的列表项
    assert a["paras"].count(a["title"]) == 0           # 和标题一样的 h1 不重复


def test_extract_without_article_finds_main_block():
    doc = f"""<html><body><div id="top"><p>Menu text that is just long enough to be counted here.</p></div>
      <div class="content"><div class="post"><p>{BODY} One.</p><p>{BODY} Two.</p><p>{BODY} Three.</p></div></div></body></html>"""
    a = webimport.extract(doc)
    assert len(a["paras"]) == 3 and "Menu text" not in " ".join(a["paras"])


def test_title_from_title_tag_drops_site_name():
    assert webimport._clean_title("How volcanoes work and why they erupt | Science Weekly") == "How volcanoes work and why they erupt"
    assert webimport._clean_title("Short - Site") == "Short - Site"
    assert webimport._clean_title("Volcano - Simple English Wikipedia, the free encyclopedia", "Volcano") == "Volcano"


@pytest.mark.parametrize("url", ["ftp://news.example.com/a", "file:///etc/passwd", "http://localhost:8766/api", "http://127.0.0.1/",
                                 "http://10.0.0.1/", "http://169.254.169.254/latest/meta-data", "http://[::1]/", "http://intranet.example.com/",
                                 "http://sneaky.example.com/", "http://v6.example.com/", "http://nowhere.invalid/", "not a url",
                                 "http://198.18.0.62/"])
def test_check_url_rejects_private_and_odd_addresses(dns, url):
    with pytest.raises(webimport.BadUrl):
        webimport.check_url(url)


def test_check_url_allows_public(dns):
    assert webimport.check_url("https://news.example.com/story?id=1")
    assert webimport.check_url("https://clash.example.com/a")  # 代理工具 fake-ip 模式下域名解析出来的假地址


def test_unresolvable_host_allowed_only_through_proxy(dns, monkeypatch):
    monkeypatch.setattr(net, "proxy", lambda: "http://127.0.0.1:7890")
    assert webimport.check_url("https://blocked-here.example.org/a")
    for url in ("http://printer.local/", "http://10.0.0.1/", "http://nas.lan/"):
        with pytest.raises(webimport.BadUrl):
            webimport.check_url(url)


def test_redirect_to_private_address_is_refused(dns):
    req = urllib.request.Request("https://news.example.com/a")
    h = webimport._SafeRedirect()
    with pytest.raises(webimport.BadUrl):
        h.redirect_request(req, None, 302, "Found", {}, "http://169.254.169.254/latest")
    assert h.redirect_request(req, None, 302, "Found", {}, "https://news.example.com/b").full_url == "https://news.example.com/b"


def test_import_url_saves_article_with_source(monkeypatch):
    monkeypatch.setattr(lan, "local_ips", lambda: ["127.0.0.1"])
    monkeypatch.setattr(webimport, "download", lambda url: ("https://www.news.example.com/birds", "text/html", PAGE))
    api = Api()
    m = api.library_import_url("https://news.example.com/birds")
    assert m["title"] == "Rare birds return to a quiet island" and m["author"] == "Jane Writer"
    assert m["source"] == "news.example.com" and m["url"] == "https://www.news.example.com/birds"
    assert api.library_list()[0]["url"] == m["url"]
    text = " ".join(" ".join(ps) for _, ps in api.library_load(m["id"]))
    assert "protect the nests" in text and "reader comment" not in text


def test_import_url_reports_clear_errors(monkeypatch):
    monkeypatch.setattr(lan, "local_ips", lambda: ["127.0.0.1"])
    api = Api()
    assert api.library_import_url("http://127.0.0.1/admin")["error"] == "不能导入本机或局域网里的网址"
    monkeypatch.setattr(webimport, "download", lambda url: (url, "text/html", "<html><body><p>Log in to read.</p></body></html>"))
    assert "没读到正文" in api.library_import_url("https://news.example.com/x")["error"]
    assert api.library_list() == []
