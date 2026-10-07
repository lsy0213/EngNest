import base64
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

from engnest import webdav
from engnest.progress import Progress
from engnest.settings import Settings

FILES = {}
DIRS = set()


class FakeDav(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _auth(self):
        ok = self.headers.get("Authorization") == "Basic " + base64.b64encode(b"me:app-pass").decode()
        if not ok:
            self.send_response(401)
            self.end_headers()
        return ok

    def do_MKCOL(self):
        if not self._auth():
            return
        exists = self.path in DIRS
        DIRS.add(self.path)
        self.send_response(405 if exists else 201)
        self.end_headers()

    def do_GET(self):
        if not self._auth():
            return
        if self.path not in FILES:
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.end_headers()
        self.wfile.write(FILES[self.path])

    def do_PUT(self):
        if not self._auth():
            return
        FILES[self.path] = self.rfile.read(int(self.headers["Content-Length"]))
        self.send_response(201)
        self.end_headers()


@pytest.fixture
def dav():
    FILES.clear()
    DIRS.clear()
    srv = ThreadingHTTPServer(("127.0.0.1", 0), FakeDav)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}/dav"
    srv.shutdown()


def make(dav_url, password="app-pass"):
    s = Settings()
    s.update("webdav", {"url": dav_url, "user": "me", "password": password, "folder": "EngNest", "auto": False})
    return webdav.Sync(s, Progress())


def test_two_computers_merge(dav, data_dir, monkeypatch):
    a = make(dav)
    a.progress.save_patch({"words": {"apple": {"seen": 2, "t": 10}}, "xp": 30})
    assert a.sync()["ok"]
    remote = json.loads(FILES["/dav/EngNest/progress.json"])
    assert remote["data"]["words"]["apple"]["seen"] == 2

    # 另一台电脑：本地学了别的词，同步后两边的词都在
    other = data_dir.parent / "other"
    monkeypatch.setenv("ENGNEST_DATA_DIR", str(other))
    from engnest import paths

    monkeypatch.setattr(paths, "_data_dir", None)
    b = make(dav)
    b.progress.save_patch({"words": {"pear": {"seen": 1, "t": 20}}, "xp": 5})
    r = b.sync()
    assert r["ok"] and r["changed_local"]
    assert set(b.progress.load()["words"]) == {"apple", "pear"}
    assert b.progress.load()["xp"] == 30
    assert set(json.loads(FILES["/dav/EngNest/progress.json"])["data"]["words"]) == {"apple", "pear"}


def test_wrong_password(dav):
    r = make(dav, password="wrong").sync()
    assert not r["ok"] and "密码" in r["error"]


def test_requires_https():
    with pytest.raises(webdav.WebDavError):
        webdav.Client("http://example.com/dav", "u", "p")
