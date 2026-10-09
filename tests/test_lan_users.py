"""局域网多人使用：每个人（按访问码区分）有自己的一份进度和 AI 语伴记录，不影响主人；AI 由主人逐个开关。"""

import pytest

from engnest import lan
from engnest.api import NO_AI, Api


@pytest.fixture
def api(monkeypatch):
    monkeypatch.setattr(lan, "local_ips", lambda: ["127.0.0.1"])
    return Api()


def add_user(api, name, ai=False):
    r = api.lan_user_add(name)
    assert r["ok"]
    u = next(u for u in r["status"]["users"] if u["name"] == name)
    if ai:
        api.lan_user_update(u["id"], {"ai": True})
    return {"id": u["id"], "name": name, "ai": ai}, u["code"]


def test_progress_is_separate(api, data_dir):
    friend, _ = add_user(api, "小明")
    api.progress_save({"xp": 10, "notebook": [{"w": "apple"}]})                      # 主人在电脑上
    api.lan_call(friend, "progress_save", [{"xp": 3, "notebook": [{"w": "banana"}]}])  # 朋友在手机上
    mine, theirs = api.progress_load(), api.lan_call(friend, "progress_load", [])
    assert mine["data"]["xp"] == 10 and [x["w"] for x in mine["data"]["notebook"]] == ["apple"]
    assert theirs["data"]["xp"] == 3 and [x["w"] for x in theirs["data"]["notebook"]] == ["banana"]
    assert mine["who"] is None and theirs["who"] == {"name": "小明"}
    assert api.lan_call(None, "progress_load", [])["data"]["xp"] == 10  # 用主人的码进来的，就是主人的进度
    assert (data_dir / "profiles" / friend["id"] / "progress.db").exists()
    assert (data_dir / "profiles" / friend["id"] / "backups").is_dir()


def test_tutor_history_separate_but_caches_shared(api):
    friend, _ = add_user(api, "小明")
    api.kv_set("tutor", "s1", {"history": ["mine"]})
    api.lan_call(friend, "kv_set", ["tutor", "s1", {"history": ["theirs"]}])
    api.lan_call(friend, "kv_set", ["tr_voa", "p1", "翻译"])
    assert api.kv_all("tutor") == {"s1": {"history": ["mine"]}}
    assert api.lan_call(friend, "kv_all", ["tutor"]) == {"s1": {"history": ["theirs"]}}
    assert api.kv_all("tr_voa") == {"p1": "翻译"}  # 翻译缓存大家共用


def test_ai_switch(api):
    friend, _ = add_user(api, "小明")
    assert api.lan_call(friend, "get_ai_settings", [])["lan_denied"] is True
    assert api.lan_call(friend, "ai_chat", ["sys", [{"role": "user", "content": "hi"}]]) == {"ok": False, "error": NO_AI}
    sid = api.lan_call(friend, "ai_stream_start", ["sys", [{"role": "user", "content": "hi"}]])
    assert api.ai_stream_poll(sid)["result"] == {"ok": False, "error": NO_AI}
    allowed = {**friend, "ai": True}
    api.lan_user_update(friend["id"], {"ai": True})
    assert "lan_denied" not in api.lan_call(allowed, "get_ai_settings", [])
    assert "lan_denied" not in api.get_ai_settings()  # 主人自己不受影响


def test_codes_unique_and_remove(api, data_dir):
    friend, code = add_user(api, "小明")
    assert not api.lan_user_add("小明")["ok"]  # 不能重名
    assert not api.lan_user_add("  ")["ok"]
    st = api.lan_status()
    assert lan.norm_code(code) != lan.norm_code(st["code"])
    assert api._lan.who(code) == {"id": friend["id"], "name": "小明", "ai": False}
    assert api._lan.who(st["code"]) is None
    api.lan_call(friend, "progress_save", [{"xp": 3}])
    api.lan_call(friend, "kv_set", ["tutor", "s1", {"history": ["theirs"]}])
    api.lan_user_remove(friend["id"])
    assert api._lan.who(code) is False
    assert not (data_dir / "profiles" / friend["id"]).exists()
    assert api._kv.get_all(f"tutor@{friend['id']}") == {}
    assert api.progress_load()["data"].get("xp") != 3  # 主人的进度从头到尾没被碰过
