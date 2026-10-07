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


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture
def server():
    srv = lan.LanServer(FakeApi())
    port = free_port()
    assert srv.start(port, "ABCD2345")
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
    assert call(port, "save_ai_settings", "ABCD2345")[0] == 403  # 不在白名单里


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
