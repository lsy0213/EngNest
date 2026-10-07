"""路径工具：兼容源码运行和 PyInstaller 打包后的运行。"""

import os
import sys
from pathlib import Path

from . import APP_NAME


def resource_dir() -> Path:
    """静态资源根目录（web/ 所在目录）。打包后位于 PyInstaller 的临时解压目录。"""
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent.parent


def web_index() -> Path:
    return resource_dir() / "web" / "index.html"


def data_dir() -> Path:
    """用户数据目录：%APPDATA%/EngNest，保存学习进度和设置。"""
    base = os.environ.get("APPDATA") or str(Path.home())
    path = Path(base) / APP_NAME
    path.mkdir(parents=True, exist_ok=True)
    return path
