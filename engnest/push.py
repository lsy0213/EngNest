"""服务器模式的学习提醒推送（Web Push）：关掉网页也能在手机上收到「今天还没学」。

- 需要 pywebpush（requirements-server.txt 里有）；没装的话 push_key 返回不可用，网页上就不显示这个选项。
- VAPID 密钥第一次用时生成，存在 data_dir/push/vapid.pem；订阅存在 data_dir/push/subs.json：
  { 账号 id（管理员是 "_owner"）: {sub 浏览器给的订阅, remind "21:00", tz 时区偏移（分钟，同 JS getTimezoneOffset）, sent 上次推送的日期} }
- server.run 里每 5 分钟检查一次：到了这个人当地的提醒时间、今天还没学（当天经验值是 0）就推一条；不管推没推，当天都只检查这一次。
"""

import base64
import datetime
import json
import logging
import threading

from .paths import data_dir

log = logging.getLogger(__name__)
_lock = threading.Lock()
OWNER = "_owner"


def available() -> bool:
    try:
        import pywebpush  # noqa: F401
        import py_vapid  # noqa: F401

        return True
    except ImportError:
        return False


def _dir():
    d = data_dir() / "push"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _vapid():
    from py_vapid import Vapid

    pem = _dir() / "vapid.pem"
    if pem.exists():
        return Vapid.from_file(str(pem))
    v = Vapid()
    v.generate_keys()
    v.save_key(str(pem))
    return v


def public_key() -> str:
    """浏览器 pushManager.subscribe 要的 applicationServerKey（未压缩的公钥，base64url）"""
    from cryptography.hazmat.primitives import serialization

    raw = _vapid().public_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _load() -> dict:
    p = _dir() / "subs.json"
    try:
        return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    except (OSError, ValueError):
        log.exception("读取推送订阅失败")
        return {}


def _save(subs: dict):
    p = _dir() / "subs.json"
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(subs, ensure_ascii=False), encoding="utf-8")
    tmp.replace(p)


def subscribe(uid, sub: dict, remind: str, tz: int) -> dict:
    if not isinstance(sub, dict) or not sub.get("endpoint") or not str(sub["endpoint"]).startswith("https://"):
        return {"ok": False, "error": "订阅信息不对"}
    with _lock:
        subs = _load()
        subs[uid or OWNER] = {"sub": sub, "remind": _hhmm(remind), "tz": int(tz or 0), "sent": ""}
        _save(subs)
    return {"ok": True}


def unsubscribe(uid) -> dict:
    with _lock:
        subs = _load()
        subs.pop(uid or OWNER, None)
        _save(subs)
    return {"ok": True}


def status(uid) -> dict:
    s = _load().get(uid or OWNER)
    return {"available": available(), "on": bool(s), "remind": (s or {}).get("remind", "")}


def _hhmm(s) -> str:
    try:
        h, m = (int(x) for x in str(s or "21:00").split(":")[:2])
        return f"{max(0, min(23, h)):02d}:{max(0, min(59, m)):02d}"
    except ValueError:
        return "21:00"


def due(rec: dict, now_utc: datetime.datetime):
    """该不该检查这个人：到了 TA 当地的提醒时间、今天还没检查过。返回 TA 当地的日期（字符串）或 None"""
    local = now_utc - datetime.timedelta(minutes=int(rec.get("tz", 0)))
    if local.strftime("%H:%M") < rec.get("remind", "21:00") or rec.get("sent") == local.date().isoformat():
        return None
    return local.date().isoformat()


def message(days: dict, date: str) -> dict:
    """今天还没学：按连续天数写提醒的话"""
    d, streak = datetime.date.fromisoformat(date) - datetime.timedelta(days=1), 0
    while (days.get(d.isoformat()) or {}).get("xp", 0) > 0 or (days.get(d.isoformat()) or {}).get("frozen"):
        streak += 1
        d -= datetime.timedelta(days=1)
    body = f"已经连续学了 {streak} 天，今天学几分钟就能续上 🔥" if streak else "今天还没学英语，花 5 分钟复习几个单词吧"
    return {"title": "EngNest · 英语小窝", "body": body, "url": "./#/home", "tag": "engnest-remind"}


def check(read_days, now_utc=None, send=None) -> int:
    """read_days(uid) → 这个人的 days；send(sub, payload) 发推送（默认 pywebpush，测试时换掉）。返回推了几条"""
    now_utc = now_utc or datetime.datetime.utcnow()
    send = send or _send
    n = 0
    with _lock:
        subs = _load()
        changed = False
        for uid, rec in list(subs.items()):
            date = due(rec, now_utc)
            if not date:
                continue
            rec["sent"] = date
            changed = True
            try:
                days = read_days(None if uid == OWNER else uid) or {}
            except Exception:  # noqa: BLE001
                log.exception("读取 %s 的进度失败", uid)
                continue
            if (days.get(date) or {}).get("xp", 0) > 0:
                continue  # 今天学过了
            try:
                send(rec["sub"], message(days, date))
                n += 1
            except Exception as e:  # noqa: BLE001
                gone = getattr(getattr(e, "response", None), "status_code", 0) in (404, 410)
                log.warning("推送给 %s 失败%s：%s", uid, "（订阅已失效，删掉）" if gone else "", e)
                if gone:
                    subs.pop(uid, None)
        if changed:
            _save(subs)
    return n


def _send(sub: dict, payload: dict):
    from pywebpush import webpush

    webpush(subscription_info=sub, data=json.dumps(payload, ensure_ascii=False), vapid_private_key=str(_dir() / "vapid.pem"),
            vapid_claims={"sub": "https://github.com/lsy0213/EngNest"}, ttl=6 * 3600)
