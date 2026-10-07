"""扩展资料：GitHub 上别人整理的学习系统，下载到本机（数据目录的 cache/ext/），用系统浏览器打开。只供自己学习用。

现在有一个：
- IELTS-practice（sallowayma-git/IELTS-practice，代码 GPL-3.0）：雅思阅读练习系统（题库浏览、套题练习、成绩记录、错题分析）。
  纯前端网页，支持直接用 file:// 打开；题源版权归原权利人，作者要求只用于个人学习，不要再公开分发。
下载用 GitHub 的 zip 包（不需要装 git），解压时跳过开发者文件夹。一次只下载一个，前端轮询进度。
"""

import io
import os
import shutil
import threading
import urllib.request
import zipfile

from .paths import cache_dir

UA = "EngNest/0.3 (personal English-learning desktop app)"
EXTS = {
    "ielts-practice": {
        "name": "IELTS-practice 雅思阅读练习系统",
        "zip": "https://codeload.github.com/sallowayma-git/IELTS-practice/zip/refs/heads/main",
        "skip": ("developer/", ".github/", "scripts/"),
        "entry": "index.html",
        "home": "https://github.com/sallowayma-git/IELTS-practice",
    },
}


def ext_dir(eid: str):
    return cache_dir("ext") / eid


class Ext:
    def __init__(self):
        self.task = {"id": "", "running": False, "progress": 0.0, "stage": "", "error": ""}

    def status(self) -> dict:
        out = {}
        for eid, e in EXTS.items():
            entry = ext_dir(eid) / e["entry"]
            out[eid] = {"name": e["name"], "installed": entry.exists(), "home": e["home"]}
        return {"exts": out, **self.task}

    def install(self, eid: str) -> bool:
        if eid not in EXTS or self.task["running"]:
            return False
        self.task = {"id": eid, "running": True, "progress": 0.0, "stage": "download", "error": ""}
        threading.Thread(target=self._install, args=(eid,), daemon=True).start()
        return True

    def _install(self, eid):
        e = EXTS[eid]
        try:
            req = urllib.request.Request(e["zip"], headers={"User-Agent": UA})
            buf = io.BytesIO()
            with urllib.request.urlopen(req, timeout=120) as r:
                size = int(r.headers.get("Content-Length") or 0)
                while chunk := r.read(1 << 20):
                    buf.write(chunk)
                    # GitHub 的 zip 常常不给总大小，这时按 50 MB 估一个进度
                    self.task["progress"] = min(0.95, buf.tell() / (size or 50e6))
            self.task.update(stage="extract")
            target = ext_dir(eid)
            tmp = target.with_name(target.name + ".tmp")
            shutil.rmtree(tmp, ignore_errors=True)
            with zipfile.ZipFile(buf) as z:
                for info in z.infolist():
                    rel = info.filename.split("/", 1)[1] if "/" in info.filename else ""  # 去掉 zip 里最外层的「仓库名-main/」
                    if not rel or rel.startswith(e["skip"]) or info.is_dir():
                        continue
                    dest = tmp / rel
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    with z.open(info) as src, open(dest, "wb") as out:
                        shutil.copyfileobj(src, out)
            shutil.rmtree(target, ignore_errors=True)
            tmp.rename(target)
            self.task.update(running=False, progress=1.0, stage="done")
        except Exception as ex:  # noqa: BLE001 — 网络问题等直接告诉用户
            self.task.update(running=False, stage="error", error=str(ex))

    def open(self, eid: str) -> bool:
        e = EXTS.get(eid)
        entry = ext_dir(eid) / e["entry"] if e else None
        if not entry or not entry.exists():
            return False
        os.startfile(entry)  # 用系统默认浏览器打开（这类网页需要弹出新窗口，在软件窗口里不好用）
        return True

    def read(self, eid: str, rel: str):
        """读扩展资料里的一个文本文件（题库数据），只允许读这个扩展自己的文件夹，最大 20 MB。"""
        if eid not in EXTS:
            return None
        # 只看相对路径本身：不能是绝对路径，也不能用 .. 跳出去（不用 resolve() 比较，AppData 可能被重定向）
        rel = os.path.normpath(str(rel))
        if os.path.isabs(rel) or rel.startswith(".."):
            return None
        path = ext_dir(eid) / rel
        if not path.is_file() or path.stat().st_size > 20e6:
            return None
        return path.read_text(encoding="utf-8", errors="replace")

    def base_uri(self, eid: str) -> str:
        """扩展文件夹的 file:// 地址（题目里的图片用）"""
        d = ext_dir(eid)
        return d.as_uri() + "/" if d.exists() else ""

    def remove(self, eid: str) -> bool:
        shutil.rmtree(ext_dir(eid), ignore_errors=True)
        return True
