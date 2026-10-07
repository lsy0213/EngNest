"""影视精听片库：把在线视频下载到本机，断网也能看。

视频来自 VOA（公有领域）、TED（CC BY-NC-ND）和 Blender 开放电影（CC BY），片单和字幕在 web/data/films_index.js 里。
下载的视频放在数据目录的 cache/videos/<id>.mp4，一次只下载一个，前端轮询进度，支持断点续传。
只能下载片单里登记过的视频：前端只传片子的 id，地址由这里从片单里查。
"""

import json
import logging
import re
import threading

from . import net
from .paths import cache_dir, resource_dir

log = logging.getLogger(__name__)
_catalog = None


def catalog() -> dict:
    """片单里的 {id: 视频地址}"""
    global _catalog
    if _catalog is None:
        try:
            text = (resource_dir() / "web" / "data" / "films_index.js").read_text(encoding="utf-8")
            m = re.search(r"window\.FILM_SERIES = (\[.*?\n\]);", text, re.S)
            _catalog = {it["id"]: it["url"] for sr in json.loads(m.group(1)) for it in sr["items"] if it.get("url")}
        except (OSError, AttributeError, ValueError, KeyError) as e:
            log.error("读不出片单：%s", e)
            _catalog = {}
    return _catalog


def video_dir():
    return cache_dir("videos")


def _path(fid: str):
    return video_dir() / (re.sub(r"[^A-Za-z0-9_-]", "", fid) + ".mp4")


class Films:
    def __init__(self):
        self.task = {"id": "", "running": False, "progress": 0.0, "error": ""}
        self._cancel = False

    def status(self) -> dict:
        d = video_dir()
        have = {p.stem: round(p.stat().st_size / 1e6, 1) for p in d.glob("*.mp4")} if d.exists() else {}
        return {"downloaded": have, **self.task}

    def local_url(self, fid: str) -> str:
        p = _path(fid)
        return p.as_uri() if p.exists() else ""

    def download(self, fid: str, url: str = "") -> bool:
        """url 参数只为兼容旧前端，不使用：地址一律从片单里查"""
        url = catalog().get(fid, "")
        if self.task["running"] or not url.startswith("https://"):
            return False
        self._cancel = False
        self.task = {"id": fid, "running": True, "progress": 0.0, "error": ""}
        threading.Thread(target=self._download, args=(fid, url), daemon=True).start()
        return True

    def cancel(self) -> bool:
        self._cancel = True
        return True

    def _download(self, fid, url):
        try:
            net.download(url, _path(fid), progress=lambda got, total: self.task.update(progress=got / total if total else 0),
                         cancel=lambda: self._cancel)
            self.task.update(running=False, progress=1.0)
        except net.Cancelled:
            self.task.update(running=False, error="已取消（下次接着下）")
        except Exception as e:  # noqa: BLE001 — 断网等直接告诉用户
            self.task.update(running=False, error=str(e))

    def remove(self, fid: str) -> bool:
        _path(fid).unlink(missing_ok=True)
        _path(fid).with_name(_path(fid).name + ".part").unlink(missing_ok=True)
        return True
