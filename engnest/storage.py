"""本地 JSON 存储：原子写入，避免断电或崩溃时把文件写坏。"""

import json
import os
import threading
from pathlib import Path

_lock = threading.Lock()


def load_json(path: Path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default
    except (json.JSONDecodeError, OSError):
        # 文件损坏时先备份，再用默认值继续运行
        try:
            path.replace(path.with_suffix(path.suffix + ".broken"))
        except OSError:
            pass
        return default


def save_json(path: Path, data) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with _lock:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, path)
