import json
import socket
import urllib.error
import urllib.request

import pytest

from engnest import lan


class FakeApi:
    def get_ai_settings(self):
        return {"provider": "qwen", "has_key": True, "key_hint": "sk-****1234", "enabled": True}

    def progress_rev(self):
        return 7

    def save_ai_settings(self, cfg):
        if self.last_user is None:
            raise PermissionError("AI 设置只能在电脑上修改")
        return {"ok": True}

    def lan_call(self, user, name, args):
        self.last_user = user
        return getattr(self, name)(*args)


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture
def server():
    srv = lan.LanServer(FakeApi())
    port = free_port()
    assert srv.start(port, "ABCD2345", https=False)
    yield srv, port
    srv.stop()


def call(port, name, key, body=b"{}"):
    req = urllib.request.Request(f"http://127.0.0.1:{port}/api/{name}", data=body, method="POST",
                                 headers={"X-EngNest-Key": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def test_code_format():
    c = lan.new_code()
    assert len(c) == 8 and all(ch in lan.CODE_CHARS for ch in c)
    assert lan.is_weak("123456") and not lan.is_weak(c)
    assert lan.norm_code("abcd-2345 ") == "ABCD2345"


def test_auth_and_key_hint_hidden(server):
    _, port = server
    assert call(port, "ping", "abcd 2345")[0] == 200  # 不分大小写、可以带空格
    st, d = call(port, "get_ai_settings", "ABCD2345")
    assert st == 200 and "key_hint" not in d["result"] and d["result"]["has_key"]
    assert call(port, "lan_status", "ABCD2345")[0] == 403  # 不在白名单里
    st, d = call(port, "save_ai_settings", "ABCD2345", b'{"args": [{}]}')  # 主人的 AI 设置只能在电脑上改
    assert st == 403 and "电脑" in d["error"]


def test_lockout_after_failures(server):
    _, port = server
    for _ in range(lan.MAX_FAIL_PER_IP):
        assert call(port, "ping", "WRONG000")[0] == 401
    st, d = call(port, "ping", "ABCD2345")  # 锁住以后对的也不行
    assert st == 429 and d["wait"] > 0


def test_body_too_large(server, monkeypatch):
    _, port = server
    monkeypatch.setattr(lan, "MAX_BODY", 100)
    st, _ = call(port, "ping", "ABCD2345", body=b"x" * 1000)
    assert st == 413


def test_packs_route_and_traversal(server, data_dir):
    _, port = server
    from engnest.packs import packs_dir

    (packs_dir() / "index.js").write_text("window.X = 1;", encoding="utf-8")
    (data_dir / "secret.txt").write_text("nope", encoding="utf-8")
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/packs/index.js", timeout=5) as r:
        assert r.read() == b"window.X = 1;"
    for bad in ("/packs/../secret.txt", "/packs/%2e%2e/secret.txt", "/packs/..%5csecret.txt"):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}{bad}", timeout=5) as r:
                assert b"nope" not in r.read()
        except urllib.error.HTTPError as e:
            assert e.code == 404


def test_https_mode(monkeypatch):
    pytest.importorskip("cryptography")
    import ssl

    monkeypatch.setattr(lan, "local_ips", lambda: ["127.0.0.1"])
    srv = lan.LanServer(FakeApi())
    port = free_port()
    assert srv.start(port, "ABCD2345", https=True) and srv.https
    assert srv.urls()[0].startswith("https://")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE  # 自签名证书
    req = urllib.request.Request(f"https://127.0.0.1:{port}/api/progress_rev", data=b"{}", method="POST", headers={"X-EngNest-Key": "ABCD2345"})
    with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
        assert json.loads(r.read())["result"] == 7
    # 用 http 连 https 端口不会把服务弄挂
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=5)
    except Exception:
        pass
    with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
        assert r.status == 200
    srv.stop()


def test_user_codes(server):
    """其他人用自己的访问码进来：接口收到 TA 是谁；主人的码收到 None；删掉以后码立即失效"""
    srv, port = server
    srv.users = [{"id": "u1", "name": "小明", "code": "WXYZ6789", "ai": False}]
    st, d = call(port, "ping", "wxyz-6789")
    assert st == 200 and d["name"] == "小明"
    assert call(port, "progress_rev", "WXYZ6789")[0] == 200 and srv.api.last_user == {"id": "u1", "name": "小明", "ai": False}
    assert call(port, "progress_rev", "ABCD2345")[0] == 200 and srv.api.last_user is None
    assert call(port, "ping", "ABCD2345")[1]["name"] is None
    srv.users = []
    assert call(port, "ping", "WXYZ6789")[0] == 401
