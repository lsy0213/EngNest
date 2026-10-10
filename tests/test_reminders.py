"""学习提醒：服务器推送按每个人当地的时间、当天只检查一次、学过就不推；失效的订阅删掉。电脑通知的文字要转义。"""

import datetime

from engnest import notify, push

SUB = {"endpoint": "https://push.example/abc", "keys": {"p256dh": "x", "auth": "y"}}


def test_subscribe_validates_and_normalizes():
    assert not push.subscribe("u1", {"endpoint": "http://insecure"}, "21:00", 0)["ok"]
    assert push.subscribe("u1", SUB, "7:5", -480)["ok"]
    assert push.status("u1")["on"] and push.status("u1")["remind"] == "07:05"
    push.unsubscribe("u1")
    assert not push.status("u1")["on"]


def test_check_uses_local_time_once_per_day_and_skips_studied():
    push.subscribe(None, SUB, "21:00", -480)          # 管理员，北京时间（UTC+8 → getTimezoneOffset = -480）
    push.subscribe("u2", SUB, "21:00", -480)
    push.subscribe("u3", SUB, "21:00", 0)             # UTC
    sent = []
    days = {None: {"2026-10-10": {"xp": 0}, "2026-10-09": {"xp": 5}, "2026-10-08": {"xp": 5}}, "u2": {"2026-10-10": {"xp": 30}}, "u3": {}}
    utc = datetime.datetime(2026, 10, 10, 13, 30)   # 北京 21:30，UTC 13:30
    n = push.check(lambda uid: days[uid], now_utc=utc, send=lambda sub, p: sent.append(p))
    assert n == 1 and "连续学了 2 天" in sent[0]["body"]  # 只推给今天没学的管理员；u2 学过了，u3 当地还没到点
    assert push.check(lambda uid: days[uid], now_utc=utc + datetime.timedelta(minutes=10), send=lambda s, p: sent.append(p)) == 0  # 当天不再推
    n = push.check(lambda uid: days[uid], now_utc=datetime.datetime(2026, 10, 10, 21, 5), send=lambda s, p: sent.append(p))
    assert n == 1 and sent[-1]["body"].startswith("今天还没学")  # u3 当地 21:05


def test_gone_subscription_is_removed():
    push.subscribe("u4", SUB, "00:00", 0)

    class Gone(Exception):
        response = type("R", (), {"status_code": 410})()

    def boom(sub, payload):
        raise Gone("expired")

    push.check(lambda uid: {}, now_utc=datetime.datetime(2026, 10, 10, 1, 0), send=boom)
    assert not push.status("u4")["on"]


def test_toast_xml_is_escaped():
    x = notify.toast_xml('A & B <x>', '"hi"')
    assert "A &amp; B &lt;x&gt;" in x and "&quot;hi&quot;" in x
