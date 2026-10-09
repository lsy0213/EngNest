"""局域网多人使用：每个人（按访问码区分）有自己的一份进度和 AI 语伴记录，不影响主人；AI 由主人逐个开关。"""

import time

import pytest

from engnest import ai_client, ai_usage, lan
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


def fake_chat(calls):
    def chat(cfg, system, messages, json_mode=False, on_delta=None):
        calls.append(cfg["api_key"])
        if on_delta:
            on_delta("hi")
        return "hi", {"prompt_tokens": 1, "completion_tokens": 1}
    return chat


HI = ["sys", [{"role": "user", "content": "hi"}]]


def test_ai_switch(api, monkeypatch):
    """没填自己的 Key：主人没开就不能用；主人开了就用主人的 Key，算主人的用量"""
    calls, recorded = [], []
    monkeypatch.setattr(ai_client, "chat", fake_chat(calls))
    monkeypatch.setattr(ai_usage, "record", lambda model, usage: recorded.append(model))
    api.save_ai_settings({"provider": "deepseek", "model": "deepseek-chat", "api_key": "sk-owner-000000"})
    friend, _ = add_user(api, "小明")
    assert api.lan_call(friend, "get_ai_settings", [])["lan_denied"] is True
    assert api.lan_call(friend, "ai_chat", HI) == {"ok": False, "error": NO_AI}
    sid = api.lan_call(friend, "ai_stream_start", HI)
    assert api.ai_stream_poll(sid)["result"] == {"ok": False, "error": NO_AI}
    assert calls == []
    allowed = {**friend, "ai": True}
    api.lan_user_update(friend["id"], {"ai": True})
    st = api.lan_call(allowed, "get_ai_settings", [])
    assert st["enabled"] and st["shared"] and not st["own"] and "lan_denied" not in st
    assert api.lan_call(allowed, "ai_chat", HI)["ok"] and calls == ["sk-owner-000000"] and recorded == ["deepseek-chat"]
    assert "lan_denied" not in api.get_ai_settings()  # 主人自己不受影响


def test_own_key(api, monkeypatch):
    """其他人填自己的 Key：存在 TA 自己的设置里（加密），调用用 TA 的 Key，不算主人的用量、不受主人上限限制"""
    calls, recorded = [], []
    monkeypatch.setattr(ai_client, "chat", fake_chat(calls))
    monkeypatch.setattr(ai_usage, "record", lambda model, usage: recorded.append(model))
    monkeypatch.setattr(ai_usage, "check_limit", lambda cfg: "本月用量已到上限")
    api.save_ai_settings({"provider": "deepseek", "model": "deepseek-chat", "api_key": "sk-owner-000000"})
    friend, _ = add_user(api, "小明")  # 主人没给 TA 开
    st = api.lan_call(friend, "save_ai_settings", [{"provider": "deepseek", "model": "deepseek-chat", "api_key": "sk-friend-11111"}])
    assert st["own"] and st["enabled"] and st["has_key"]
    assert api.get_ai_settings()["has_key"] and api._ai_cfg()["api_key"] == "sk-owner-000000"  # 主人的没被改
    assert api.lan_call(friend, "ai_chat", HI)["ok"]
    sid = api.lan_call(friend, "ai_stream_start", HI)  # 流式在后台线程里跑，也要用 TA 的 Key
    for _ in range(100):
        r = api.ai_stream_poll(sid)
        if r["done"]:
            break
        time.sleep(0.02)
    assert r["result"]["ok"]
    assert calls == ["sk-friend-11111", "sk-friend-11111"] and recorded == []
    assert api.ai_chat(*HI)["error"] == "本月用量已到上限"  # 主人自己仍受上限限制
    assert api.lan_status()["users"][0]["own_ai"] is True
    raw = (api._profile_dir(friend["id"]) / "settings.json").read_text(encoding="utf-8")
    assert "sk-friend-11111" not in raw or "plain:" in raw  # Windows 上是 DPAPI 加密的


def test_owner_settings_locked_over_lan(api):
    with pytest.raises(PermissionError):
        api.lan_call(None, "save_ai_settings", [{"api_key": "sk-hacked"}])
    assert not api.get_ai_settings()["has_key"]


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
