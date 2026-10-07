"""扩展资料：GitHub 上别人整理的学习系统，下载到本机（数据目录的 cache/ext/），用系统浏览器打开。只供自己学习用。

现在有一个：
- IELTS-practice（sallowayma-git/IELTS-practice，代码 GPL-3.0）：雅思阅读练习系统（题库浏览、套题练习、成绩记录、错题分析）。
  纯前端网页，支持直接用 file:// 打开；题源版权归原权利人，作者要求只用于个人学习，不要再公开分发。
下载用 GitHub 的 zip 包（不需要装 git），固定到某个提交并核对 SHA256（对方仓库以后改了或被篡改都不影响），
GitHub 连不上时换镜像。解压时跳过开发者文件夹，并检查每个文件都落在目标文件夹里（防止 zip 里的 ../ 路径写到别处）。
一次只下载一个，前端轮询进度。
"""

import os
import shutil
import threading
import zipfile
from pathlib import Path, PurePosixPath

from . import net
from .paths import cache_dir

EXTS = {
    "ielts-practice": {
        "name": "IELTS-practice 雅思阅读练习系统",
        "zip": "https://codeload.github.com/sallowayma-git/IELTS-practice/zip/a69d55a201723eb7758c2f8f11b4ad933bae48d1",
        "size": 12392321,
        "sha256": "c5b602775a77af7433900f7c846d98bf25eacb9336518cf6e65520d7b538c285",
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
        zpath = cache_dir("ext") / f"{eid}.zip"
        try:
            net.download(net.github_mirrors(e["zip"]), zpath, sha256=e["sha256"], size=e["size"],
                         progress=lambda got, total: self.task.update(progress=min(0.95, got / (total or e["size"]))))
            self.task.update(stage="extract")
            target = ext_dir(eid)
            tmp = target.with_name(target.name + ".tmp")
            shutil.rmtree(tmp, ignore_errors=True)
            safe_extract(zpath, tmp, skip=e["skip"], strip_top=True)
            shutil.rmtree(target, ignore_errors=True)
            tmp.rename(target)
            zpath.unlink(missing_ok=True)
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
        if os.path.isabs(rel) or rel.startswith("..") or ":" in rel:
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


MAX_UNZIPPED = 500 * 1024 * 1024  # 解压后最大 500 MB，防止「压缩炸弹」


def safe_extract(zpath, dest: Path, skip=(), strip_top=False) -> int:
    """解压 zip 到 dest：拒绝绝对路径和 ../，跳过 skip 开头的路径；strip_top 去掉最外层的「仓库名-提交/」。返回文件数。"""
    dest = Path(dest)
    root = dest.resolve()
    n = total = 0
    with zipfile.ZipFile(zpath) as z:
        for info in z.infolist():
            name = info.filename.replace("\\", "/")
            if strip_top:
                name = name.split("/", 1)[1] if "/" in name else ""
            if not name or info.is_dir() or (skip and name.startswith(tuple(skip))):
                continue
            pp = PurePosixPath(name)
            if pp.is_absolute() or ".." in pp.parts or ":" in pp.parts[0]:
                raise ValueError(f"压缩包里有不安全的路径：{info.filename}")
            out = (dest / Path(*pp.parts)).resolve()
            if root not in out.parents:
                raise ValueError(f"压缩包里有不安全的路径：{info.filename}")
            total += info.file_size
            if total > MAX_UNZIPPED:
                raise ValueError("压缩包解压后太大")
            out.parent.mkdir(parents=True, exist_ok=True)
            with z.open(info) as src, open(out, "wb") as f:
                shutil.copyfileobj(src, f)
            n += 1
    return n
