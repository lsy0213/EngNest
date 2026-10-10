"""「我的读物」：网页上传 txt / epub / html、粘贴文字；局域网和服务器上每人一个自己的书库。"""

import base64
import io
import zipfile

import pytest

from engnest import lan, server
from engnest.api import Api

STORY = "\n\n".join(f"Chapter {i}\n\n" + " ".join(["The little fox ran over the quiet hill again."] * 30) for i in (1, 2, 3))


@pytest.fixture
def api(monkeypatch):
    monkeypatch.setattr(lan, "local_ips", lambda: ["127.0.0.1"])
    return Api()


def b64(data: bytes) -> str:
    return base64.b64encode(data).decode()


def make_epub() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("META-INF/container.xml", '<container><rootfiles><rootfile full-path="OEBPS/book.opf"/></rootfiles></container>')
        z.writestr("OEBPS/book.opf", """<package><metadata><dc:title>Fox Tales</dc:title><dc:creator>A. Writer</dc:creator></metadata>
            <manifest><item id="c1" href="c1.xhtml"/><item id="c2" href="c2.xhtml"/></manifest>
            <spine><itemref idref="c1"/><itemref idref="c2"/></spine></package>""")
        for i in (1, 2):
            body = "".join(f"<p>{'The fox looked at the moon and smiled. ' * 6}</p>" for _ in range(5))
            z.writestr(f"OEBPS/c{i}.xhtml", f"<html><body><h1>Part {i}</h1>{body}</body></html>")
    return buf.getvalue()


def test_upload_txt_splits_chapters(api):
    m = api.library_import_upload("fox.txt", b64(STORY.encode("utf-8")))
    assert m["title"] == "fox" and m["source"] == "fox.txt" and len(m["chapters"]) == 3
    assert api.library_list()[0]["id"] == m["id"]
    assert len(api.library_load(m["id"])) == 3


def test_upload_gbk_txt_and_html(api):
    assert "error" not in api.library_import_upload("gbk.txt", b64(STORY.encode("gb18030")))
    page = "<html><head><title>Page</title></head><body><h1>Foxes</h1>" + "<p>The fox ran over the hill.</p>" * 20 + "</body></html>"
    m = api.library_import_upload("page.html", b64(page.encode()))
    assert m["title"] == "Foxes"


def test_upload_epub(api):
    m = api.library_import_upload("fox.epub", b64(make_epub()))
    assert (m["title"], m["author"]) == ("Fox Tales", "A. Writer")
    assert [c[0] for c in m["chapters"]] == ["Part 1", "Part 2"]


def test_upload_rejects_bad_input(api):
    assert "error" in api.library_import_upload("x.txt", "不是 base64!!")
    assert "error" in api.library_import_upload("x.txt", b64(b"too short"))
    assert "error" in api.library_import_upload("x.epub", b64(b"not a zip"))
    big = b"a" * (Api.LIB_MAX_UPLOAD + 1)
    assert "太大" in api.library_import_upload("big.txt", b64(big))["error"]
    assert api.library_list() == []


def test_paste_keeps_source(api):
    m = api.library_import_text("Volcano", STORY, "Simple English Wikipedia")
    assert m["source"] == "Simple English Wikipedia"
    assert api.library_import_text("", STORY)["source"] == "粘贴"


def test_same_millisecond_imports_get_different_ids(api, monkeypatch):
    from engnest import library

    monkeypatch.setattr(library.time, "time", lambda: 1_700_000_000.0)
    a = api.library_import_text("A", STORY)
    b = api.library_import_text("B", STORY)
    assert a["id"] != b["id"] and len(api.library_list()) == 2


def test_lan_users_have_their_own_library(api, data_dir):
    r = api.lan_user_add("小明")
    friend = next({"id": u["id"], "name": u["name"], "ai": False} for u in r["status"]["users"] if u["name"] == "小明")
    mine = api.library_import_text("Mine", STORY)
    theirs = api.lan_call(friend, "library_import_upload", ["theirs.txt", b64(STORY.encode())])
    assert [m["id"] for m in api.library_list()] == [mine["id"]]
    assert [m["id"] for m in api.lan_call(friend, "library_list", [])] == [theirs["id"]]
    assert api.lan_call(friend, "library_load", [mine["id"]]) == []          # 看不到主人的
    assert api.lan_call(friend, "library_delete", [mine["id"]]) is True      # 删的是自己书库里的（没有这份，不影响主人）
    assert len(api.library_list()) == 1
    assert (data_dir / "profiles" / friend["id"] / "library" / "index.json").exists()
    assert api.lan_call(None, "library_list", [])[0]["id"] == mine["id"]     # 用主人的码进来的，就是主人的书库


def test_lan_user_quota(api, monkeypatch):
    monkeypatch.setattr(Api, "LIB_MAX_DOCS", 1)
    r = api.lan_user_add("小红")
    friend = next({"id": u["id"], "name": u["name"], "ai": False} for u in r["status"]["users"] if u["name"] == "小红")
    assert "error" not in api.lan_call(friend, "library_import_text", ["A", STORY])
    assert "error" in api.lan_call(friend, "library_import_text", ["B", STORY])
    api.library_import_text("A", STORY)
    assert "error" not in api.library_import_text("B", STORY)  # 主人不限


def test_server_accounts_can_import_into_own_library(monkeypatch, data_dir):
    monkeypatch.setattr(lan, "local_ips", lambda: ["127.0.0.1"])
    srv = server.AccountServer(Api())

    def call(name, args, token):
        return srv.dispatch(name, list(args), {"X-EngNest-Session": token}, "1.2.3.4")

    def register(username, admin=False):
        st, d = srv.dispatch("account_register", [srv.accounts.new_invite(admin=admin), username, "password123"], {}, "1.2.3.4")
        return d["result"]["token"]

    admin, alice, bob = register("admin", True), register("alice"), register("bob")
    st, d = call("library_import_upload", ["a.txt", b64(STORY.encode())], alice)
    assert st == 200 and d["result"]["title"] == "a"
    assert [m["title"] for m in call("library_list", [], alice)[1]["result"]] == ["a"]
    assert call("library_list", [], bob)[1]["result"] == []
    assert call("library_list", [], admin)[1]["result"] == []
