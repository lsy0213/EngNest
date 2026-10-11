"""服务器模式：账号（注册要邀请码、登录、凭证、改密码、重置码）、按账号分开的数据、管理员和普通账号的权限、Linux 上的密钥加密。"""

import pytest

from engnest import accounts, lan, secret, server
from engnest.api import Api


@pytest.fixture
def acc(data_dir):
    return accounts.Accounts()


@pytest.fixture
def srv(monkeypatch, data_dir):
    monkeypatch.setattr(lan, "local_ips", lambda: ["127.0.0.1"])
    return server.AccountServer(Api())


def call(srv, name, args=(), token="", ip="1.2.3.4"):
    return srv.dispatch(name, list(args), {"X-EngNest-Session": token}, ip)


def register(srv, username, admin=False, pw="password123"):
    code = srv.accounts.new_invite(admin=admin)
    st, d = call(srv, "account_register", [code, username, pw])
    assert st == 200 and d["result"]["ok"], d
    return d["result"]["token"]


# ---------- 账号 ----------
def test_password_is_hashed(acc):
    h = accounts.hash_password("secret-pass")
    assert "secret-pass" not in h and accounts.check_password("secret-pass", h) and not accounts.check_password("wrong", h)


def test_register_needs_unused_invite(acc):
    assert not acc.register("NOPE1234", "alice", "password123")["ok"]
    code = acc.new_invite()
    assert acc.register(code, "alice", "password123")["ok"]
    assert "用过" in acc.register(code, "bob", "password123")["error"]  # 一个码只能用一次
    assert "已经有人用了" in acc.register(acc.new_invite(), "ALICE", "password123")["error"]  # 用户名不分大小写
    assert "至少 8 位" in acc.register(acc.new_invite(), "bob", "short")["error"]
    assert "用户名" in acc.register(acc.new_invite(), "b", "password123")["error"]
    assert acc.register(acc.new_invite(), "小明", "password123")["ok"]  # 中文用户名可以


def test_admin_invites_do_not_pile_up(acc):
    first = acc.admin_invite()
    assert acc.admin_invite() == first  # 重启服务沿用同一个码
    acc.new_invite(admin=True)
    tok = acc.register(first, "boss", "password123")["token"]
    assert acc.session_user(tok)["admin"]
    assert not [i for i in acc.invites() if i["admin"] and not i["used_by"]]  # 管理员注册后，其他管理员码全部作废


def test_login_session_logout(acc):
    tok = acc.register(acc.new_invite(admin=True), "alice", "password123")["token"]
    assert acc.session_user(tok)["admin"] is True
    assert not acc.login("alice", "wrong-password")["ok"]
    assert not acc.login("nobody", "password123")["ok"]
    tok2 = acc.login("alice", "password123")["token"]
    acc.logout(tok2)
    assert acc.session_user(tok2) is None and acc.session_user(tok)  # 退出只影响这一台
    assert acc.session_user("forged-token") is None


def test_change_password_logs_out_other_devices(acc):
    tok = acc.register(acc.new_invite(), "alice", "password123")["token"]
    other = acc.login("alice", "password123")["token"]
    uid = acc.session_user(tok)["id"]
    assert not acc.change_password(uid, "wrong", "newpassword1")["ok"]
    assert acc.change_password(uid, "password123", "newpassword1", keep_token=tok)["ok"]
    assert acc.session_user(tok) and acc.session_user(other) is None
    assert acc.login("alice", "newpassword1")["ok"] and not acc.login("alice", "password123")["ok"]


def test_reset_code(acc):
    tok = acc.register(acc.new_invite(), "alice", "password123")["token"]
    uid = acc.session_user(tok)["id"]
    code = acc.new_reset(uid)
    assert not acc.reset_password(code, "bob", "newpassword1")["ok"]  # 用户名对不上
    r = acc.reset_password(code, "alice", "newpassword1")
    assert r["ok"] and acc.session_user(tok) is None  # 重置后旧的登录作废
    assert not acc.reset_password(code, "alice", "another123")["ok"]  # 重置码只能用一次


# ---------- 服务器 ----------
def test_needs_login(srv):
    st, d = call(srv, "ping")
    assert st == 401 and d["auth"] == "account"
    assert call(srv, "progress_load")[0] == 401
    tok = register(srv, "alice", admin=True)
    st, d = call(srv, "ping", token=tok)
    assert st == 200 and d["name"] == "alice" and d["admin"]


def test_data_separate_per_account(srv):
    boss = register(srv, "boss", admin=True)
    a, b = register(srv, "alice"), register(srv, "bob")
    call(srv, "progress_save", [{"xp": 100}], token=boss)
    call(srv, "progress_save", [{"xp": 7, "notebook": [{"w": "apple"}]}], token=a)
    call(srv, "progress_save", [{"xp": 3}], token=b)
    load = lambda t: call(srv, "progress_load", token=t)[1]["result"]  # noqa: E731
    assert load(boss)["data"]["xp"] == 100 and load(boss)["who"] == {"name": "boss", "admin": True}
    assert load(a)["data"]["xp"] == 7 and [x["w"] for x in load(a)["data"]["notebook"]] == ["apple"]
    assert load(b)["data"]["xp"] == 3 and not load(b)["data"].get("notebook")
    assert srv.api.progress_load()["data"]["xp"] == 100  # 管理员用的就是主人那一份


def test_permissions(srv):
    boss = register(srv, "boss", admin=True)
    user = register(srv, "alice")
    assert call(srv, "net_set", ["http://x"], token=user)[0] == 403
    assert call(srv, "admin_users", token=user)[0] == 403
    assert call(srv, "open_data_dir", token=boss)[0] == 403  # 只有电脑上才有的操作，管理员也不行
    # 普通账号改的是自己的 AI 设置，管理员改的是主人的
    call(srv, "save_ai_settings", [{"provider": "deepseek", "model": "m", "api_key": "sk-alice-123456"}], token=user)
    assert not srv.api.get_ai_settings()["has_key"]
    st, _ = call(srv, "save_ai_settings", [{"provider": "deepseek", "model": "m", "api_key": "sk-boss-1234567"}], token=boss)
    assert st == 200 and srv.api.get_ai_settings()["has_key"]
    st, d = call(srv, "get_ai_settings", token=user)
    assert "key_hint" not in d["result"]  # Key 的任何部分都不发给浏览器


def test_admin_manages_accounts(srv, data_dir):
    boss = register(srv, "boss", admin=True)
    code = call(srv, "admin_invite_new", ["给小明"], token=boss)[1]["result"]
    st, d = call(srv, "account_register", [code, "小明", "password123"])
    tok = d["result"]["token"]
    users = call(srv, "admin_users", token=boss)[1]["result"]
    uid = next(u["id"] for u in users if u["username"] == "小明")
    call(srv, "admin_user_ai", [uid, True], token=boss)
    assert srv.accounts.get(uid)["ai"] is True
    call(srv, "progress_save", [{"xp": 5}], token=tok)
    assert (data_dir / "profiles" / uid / "progress.db").exists()
    assert call(srv, "admin_user_remove", [uid], token=boss)[0] == 200
    assert call(srv, "ping", token=tok)[0] == 401 and not (data_dir / "profiles" / uid).exists()
    boss_id = next(u["id"] for u in call(srv, "admin_users", token=boss)[1]["result"] if u["admin"])
    assert call(srv, "admin_user_remove", [boss_id], token=boss)[0] == 403


def test_admin_usage(srv):
    import datetime
    boss = register(srv, "boss", admin=True)
    alice = register(srv, "alice")
    register(srv, "bob")
    t = datetime.date.today()
    d = lambda n: (t - datetime.timedelta(days=n)).isoformat()  # noqa: E731
    call(srv, "progress_save", [{"xp": 90, "days": {d(0): {"xp": 30, "new": 5, "c_game": 2}, d(1): {"xp": 40, "review": 12}, d(10): {"xp": 20}},
                                 "words": {"apple": {"box": 5, "due": d(-3)}, "pear": {"box": 1, "due": d(1)}},
                                 "essays": [{"text": "我的秘密作文"}], "prefs": {"book": "cet4"}}], token=alice)
    assert call(srv, "admin_usage", token=alice)[0] == 403  # 普通账号看不了
    st, res = call(srv, "admin_usage", token=boss)
    assert st == 200
    rows = {r["username"]: r for r in res["result"]}
    a = rows["alice"]
    assert (a["today"], a["xp7"], a["xp30"], a["active7"], a["active30"], a["streak"]) == (30, 70, 90, 2, 3, 2)
    assert (a["words"], a["mastered"], a["due"], a["essays"], a["book"]) == (2, 1, 1, 1, "cet4")
    assert a["mods"]["c_game"] == 2 and a["mods"]["review"] == 12 and len(a["spark"]) == 14 and a["spark"][-1] == 30
    assert "秘密" not in repr(res)  # 只有数字，不带内容
    assert rows["boss"]["admin"] and rows["boss"]["id"] is None and rows["bob"]["words"] == 0
    assert res["result"][0]["username"] == "alice"  # 最近学过的排前面


def test_lan_usage_only_for_owner(srv):
    assert srv.api.lan_usage()["ok"]
    assert "lan_usage" not in lan.ALLOWED
    srv.api._ctx.lan = True
    try:
        assert not srv.api.lan_usage()["ok"]
    finally:
        srv.api._ctx.lan = False


def test_login_lockout(srv):
    register(srv, "alice")
    for _ in range(lan.MAX_FAIL_PER_IP):
        st, d = call(srv, "account_login", ["alice", "wrong-password"], ip="9.9.9.9")
        assert st == 200 and not d["result"]["ok"]
    assert call(srv, "account_login", ["alice", "password123"], ip="9.9.9.9")[0] == 429  # 锁住了，密码对也不行
    assert call(srv, "account_login", ["alice", "password123"], ip="8.8.8.8")[1]["result"]["ok"]  # 别的 IP 不受影响


def test_change_password_via_server(srv):
    tok = register(srv, "alice")
    st, d = call(srv, "account_change_password", ["password123", "newpassword9"], token=tok)
    assert d["result"]["ok"] and call(srv, "ping", token=tok)[0] == 200
    assert call(srv, "account_logout", token=tok)[1]["result"] is True
    assert call(srv, "ping", token=tok)[0] == 401


# ---------- Linux 上的密钥加密 ----------
def test_fernet_on_linux(monkeypatch, data_dir):
    pytest.importorskip("cryptography")
    monkeypatch.setattr(secret, "_WINDOWS", False)
    enc = secret.protect("sk-very-secret")
    assert enc.startswith("fernet:") and "sk-very-secret" not in enc
    assert secret.unprotect(enc) == "sk-very-secret"
    assert (data_dir / ".secret.key").exists()
