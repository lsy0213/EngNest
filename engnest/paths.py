"""路径工具：兼容源码运行和 PyInstaller 打包后的运行。

用户数据目录按下面的顺序决定（找到第一个就用）：
1. 环境变量 ENGNEST_DATA_DIR
2. 程序旁边的 data_location.txt（源码运行时是项目根目录，打包后是 exe 所在目录），第一行写目录
3. %APPDATA%/EngNest/data_location.txt（程序目录不能写时，设置页把指向写在这里，只有这一个小文件）
4. 默认：%APPDATA%/EngNest

目录结构：
    progress.db  settings.json  ai_cache.db  library/  backups/  packs/  logs/
    webview/     WebView2 的本地存储
    cache/       可以重新下载的大文件：tts/  whisper/  videos/  ext/  dict/
"""

import logging
import os
import shutil
import sys
from pathlib import Path

from . import APP_NAME

LOCATION_FILE = "data_location.txt"
log = logging.getLogger(__name__)


def resource_dir() -> Path:
    """静态资源根目录（web/ 所在目录）。打包后位于 PyInstaller 的资源目录。"""
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent.parent


def app_dir() -> Path:
    """程序所在目录：打包后是 exe 旁边，源码运行时是项目根目录。"""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def web_index() -> Path:
    return resource_dir() / "web" / "index.html"


def default_data_dir() -> Path:
    return Path(os.environ.get("APPDATA") or str(Path.home())) / APP_NAME


def _read_location(path: Path):
    try:
        line = path.read_text(encoding="utf-8-sig").strip().splitlines()[0].strip()
    except (OSError, IndexError):
        return None
    return Path(os.path.expandvars(line)) if line else None


def configured_data_dir():
    """用户指定的数据目录（没指定返回 None）"""
    env = os.environ.get("ENGNEST_DATA_DIR", "").strip()
    if env:
        return Path(env)
    for f in (app_dir() / LOCATION_FILE, default_data_dir() / LOCATION_FILE):
        p = _read_location(f)
        if p:
            return p
    return None


_data_dir = None


def data_dir() -> Path:
    """用户数据目录：学习进度、设置、导入的读物等。"""
    global _data_dir
    if _data_dir is None:
        _data_dir = configured_data_dir() or default_data_dir()
    _data_dir.mkdir(parents=True, exist_ok=True)
    return _data_dir


def sub_dir(*parts) -> Path:
    path = data_dir().joinpath(*parts)
    path.mkdir(parents=True, exist_ok=True)
    return path


def cache_dir(*parts) -> Path:
    """可以重新下载的大文件（语音缓存、识别模型、视频、完整词典……）"""
    return sub_dir("cache", *parts)


def set_data_location(target: str) -> Path:
    """设置页「更改数据位置」：写 data_location.txt，下次启动生效（启动时自动把数据搬过去）。"""
    path = Path(os.path.expandvars(target.strip())).resolve()
    path.mkdir(parents=True, exist_ok=True)
    text = str(path) + "\n"
    try:
        (app_dir() / LOCATION_FILE).write_text(text, encoding="utf-8")
    except OSError:
        # 程序装在不能写的目录（比如 Program Files）：把指向写到默认目录里
        default_data_dir().mkdir(parents=True, exist_ok=True)
        (default_data_dir() / LOCATION_FILE).write_text(text, encoding="utf-8")
    return path


# ---------- 旧版本数据的搬迁 ----------
# 旧版本把所有东西都放在数据目录根下；新版本把能重新下载的大文件放进 cache/
_LEGACY = {
    "progress.json": "progress.json",
    "settings.json": "settings.json",
    "library": "library",
    "tts_cache": "cache/tts",
    "whisper": "cache/whisper",
    "videos": "cache/videos",
    "ext": "cache/ext",
    "ecdict_full.db": "cache/dict/ecdict_full.db",
}


def _move(src: Path, dst: Path) -> bool:
    if not src.exists() or dst.exists():
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dst))
    return True


def migrate_legacy() -> list:
    """把旧位置 / 旧结构里的数据搬到当前的数据目录。返回搬过的条目，目标已存在的不覆盖。"""
    target = data_dir()
    moved = []
    # 设置页「更改数据位置」：把原来的数据目录整个搬过来
    marker = target / "migrate_from.txt"
    prev = _read_location(marker)
    if prev and prev.exists() and prev.resolve() != target.resolve():
        for item in list(prev.iterdir()):
            if item.name == LOCATION_FILE:
                continue
            try:
                if _move(item, target / item.name):
                    moved.append(f"{item} -> {target / item.name}")
            except OSError as e:
                log.warning("搬迁 %s 失败：%s", item, e)
    marker.unlink(missing_ok=True)
    sources = [target]
    old = default_data_dir()
    if old.resolve() != target.resolve():
        sources.append(old)
    for root in sources:
        for old_rel, new_rel in _LEGACY.items():
            src, dst = root / old_rel, target / new_rel
            if src.resolve() == dst.resolve():
                continue
            try:
                if _move(src, dst):
                    moved.append(f"{src} -> {dst}")
            except OSError as e:
                log.warning("搬迁 %s 失败：%s", src, e)
    if old.resolve() != target.resolve() and old.exists():
        # 旧目录里只剩数据位置的指向文件（或者什么都没有）时，旧目录就不需要了
        rest = [p for p in old.iterdir() if p.name != LOCATION_FILE]
        if not rest and not (old / LOCATION_FILE).exists():
            try:
                old.rmdir()
            except OSError:
                pass
    for m in moved:
        log.info("搬迁数据：%s", m)
    return moved
