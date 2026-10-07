"""影视精听片库：把在线视频下载到本机，断网也能看。

视频来自 VOA（公有领域）和 Blender 开放电影（CC BY），片单和字幕在 web/data/films_index.js 里。
下载的视频放在 %APPDATA%/EngNest/videos/<id>.mp4，一次只下载一个，前端轮询进度。
"""

import re
import threading
import urllib.request

from .paths import data_dir

UA = "EngNest/0.3 (personal English-learning desktop app)"


def video_dir():
    return data_dir() / "videos"


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

    def download(self, fid: str, url: str) -> bool:
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
        path = _path(fid)
        path.parent.mkdir(parents=True, exist_ok=True)
        part = path.with_suffix(".part")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r, open(part, "wb") as out:
                size = int(r.headers.get("Content-Length") or 0)
                got = 0
                while chunk := r.read(1 << 20):
                    if self._cancel:
                        raise InterruptedError("已取消")
                    out.write(chunk)
                    got += len(chunk)
                    if size:
                        self.task["progress"] = got / size
            part.replace(path)
            self.task.update(running=False, progress=1.0)
        except Exception as e:  # noqa: BLE001 — 断网、取消等直接告诉用户
            part.unlink(missing_ok=True)
            self.task.update(running=False, error=str(e))

    def remove(self, fid: str) -> bool:
        _path(fid).unlink(missing_ok=True)
        return True
