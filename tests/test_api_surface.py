"""前端调用的每个 pywebview.api.xxx、局域网白名单里的每个方法，都必须在 Api 上存在；
main.py 启动时用到的方法要能正常调用（以前删代码时误删过 net_get，启动就会崩）。"""

import re
from pathlib import Path

from engnest import lan
from engnest.api import Api

WEB = Path(__file__).resolve().parent.parent / "web" / "js"


def frontend_calls() -> set:
    names = set()
    for f in WEB.rglob("*.js"):
        if "vendor" in f.parts:
            continue
        names |= set(re.findall(r"pywebview\.api\.([A-Za-z_]\w*)", f.read_text(encoding="utf-8")))
    return names


def test_every_frontend_call_exists():
    from engnest import server

    # 账号和管理接口由服务器模式（engnest/server.py）自己处理，不在 Api 上
    by_server = server.PUBLIC | server.ACCOUNT | {n for n in server.ADMIN_ALLOWED if n.startswith("admin_")}
    missing = sorted(n for n in frontend_calls() - by_server if not callable(getattr(Api, n, None)))
    assert not missing, f"前端调用了不存在的接口：{missing}"


def test_lan_allowlist_exists():
    missing = sorted(n for n in lan.ALLOWED if not callable(getattr(Api, n, None)))
    assert not missing, f"局域网白名单里有不存在的接口：{missing}"


def test_startup_path(monkeypatch):
    monkeypatch.setattr(lan, "local_ips", lambda: ["127.0.0.1"])
    api = Api()
    assert "proxy" in api.net_get()
    assert api.progress_load()["rev"] == 0
    assert api.app_info()["version"]
    assert api.lan_status()["running"] is False
    assert "packs" in api.pack_status()
    assert api.webdav_get()["has_password"] is False
    api._autostart_lan()
