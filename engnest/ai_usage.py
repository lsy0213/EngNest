"""AI 用量统计：每个月、每个模型调用了几次、用了多少 token，存在数据目录的 ai_usage.json。

设置里可以填单价（元 / 百万 token）估算费用，也可以设每月 token 上限：到了上限就不再调用，免得一不小心花太多。
"""

import threading
import time

from .paths import data_dir
from .storage import load_json, save_json

_lock = threading.Lock()


def _file():
    return data_dir() / "ai_usage.json"


def month() -> str:
    return time.strftime("%Y-%m")


def record(model: str, usage: dict) -> None:
    with _lock:
        data = load_json(_file(), {})
        m = data.setdefault(month(), {}).setdefault(model or "?", {"calls": 0, "input": 0, "output": 0, "cache_read": 0})
        m["calls"] += 1
        for k in ("input", "output", "cache_read"):
            m[k] += int((usage or {}).get(k) or 0)
        # 只留最近 24 个月
        for old in sorted(data)[:-24]:
            data.pop(old, None)
        save_json(_file(), data)


def month_total(m: str = None) -> int:
    data = load_json(_file(), {}).get(m or month(), {})
    return sum(v.get("input", 0) + v.get("output", 0) for v in data.values())


def summary(limit_cfg: dict) -> dict:
    data = load_json(_file(), {})
    price_in = float(limit_cfg.get("price_in") or 0)
    price_out = float(limit_cfg.get("price_out") or 0)
    months = []
    for m in sorted(data, reverse=True)[:6]:
        models = [{"model": k, **v} for k, v in sorted(data[m].items(), key=lambda kv: -kv[1].get("calls", 0))]
        tin = sum(x["input"] for x in models)
        tout = sum(x["output"] for x in models)
        months.append({"month": m, "models": models, "input": tin, "output": tout, "calls": sum(x["calls"] for x in models),
                       "cost": round((tin * price_in + tout * price_out) / 1e6, 2) if (price_in or price_out) else None})
    return {"months": months, "limit": limit_cfg, "this_month": month_total()}


def check_limit(limit_cfg: dict) -> str:
    """超过每月上限时返回给用户看的提示，没超返回空字符串"""
    cap = int(limit_cfg.get("monthly_tokens") or 0)
    if cap and month_total() >= cap:
        return f"本月 AI 用量已经达到你设置的上限（{cap:,} token）。可以到「设置 → AI 用量」调高或取消上限。"
    return ""
