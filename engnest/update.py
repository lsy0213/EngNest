"""检查更新：读 GitHub Releases 的最新版本，比当前版本新就告诉前端（不自动下载安装，由用户去下载页）。"""

import json
import logging
import re

from . import VERSION, net

REPO = "lsy0213/EngNest"
API = f"https://api.github.com/repos/{REPO}/releases/latest"
PAGE = f"https://github.com/{REPO}/releases/latest"
log = logging.getLogger(__name__)


def parse(v: str) -> tuple:
    nums = [int(x) for x in re.findall(r"\d+", v or "")[:3]]
    return tuple(nums + [0] * (3 - len(nums)))


def check() -> dict:
    """{ok, current, latest, newer, url, notes, error}"""
    out = {"ok": False, "current": VERSION, "latest": "", "newer": False, "url": PAGE, "notes": "", "error": ""}
    try:
        with net.urlopen(API, timeout=10) as r:
            d = json.loads(r.read().decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        code = getattr(e, "code", None)
        out["error"] = "还没有发布过版本" if code == 404 else f"检查失败：{getattr(e, 'reason', e)}"
        return out
    latest = (d.get("tag_name") or "").lstrip("vV")
    out.update(ok=True, latest=latest, newer=parse(latest) > parse(VERSION), url=d.get("html_url") or PAGE,
               notes=(d.get("body") or "")[:2000])
    return out
