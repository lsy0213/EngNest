"""日志：写到数据目录的 logs/engnest.log（按大小滚动，最多 5 份），未捕获的异常也记下来。

打包成无控制台的 exe 时 sys.stderr 是 None，所以只写文件；源码运行时同时打印到控制台。
"""

import logging
import logging.handlers
import platform
import sys
import threading

from . import APP_NAME, VERSION
from .paths import sub_dir

FMT = "%(asctime)s %(levelname)s [%(threadName)s] %(name)s: %(message)s"


def log_file():
    return sub_dir("logs") / "engnest.log"


def setup(debug: bool = False) -> None:
    root = logging.getLogger()
    if any(getattr(h, "_engnest", False) for h in root.handlers):
        return
    root.setLevel(logging.DEBUG if debug else logging.INFO)
    fh = logging.handlers.RotatingFileHandler(log_file(), maxBytes=1_000_000, backupCount=5, encoding="utf-8")
    fh.setFormatter(logging.Formatter(FMT))
    fh._engnest = True
    root.addHandler(fh)
    if sys.stderr is not None:
        sh = logging.StreamHandler()
        sh.setFormatter(logging.Formatter(FMT))
        sh._engnest = True
        root.addHandler(sh)
    # 第三方库太啰嗦，只记警告以上
    for noisy in ("urllib3", "httpx", "httpx2", "httpcore", "asyncio", "faster_whisper", "websockets", "aiohttp"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    def excepthook(tp, value, tb):
        logging.getLogger("crash").critical("未捕获的异常", exc_info=(tp, value, tb))

    def thread_excepthook(args):
        logging.getLogger("crash").critical("线程 %s 里未捕获的异常", args.thread.name if args.thread else "?",
                                            exc_info=(args.exc_type, args.exc_value, args.exc_traceback))

    sys.excepthook = excepthook
    threading.excepthook = thread_excepthook
    logging.getLogger(APP_NAME).info("启动 %s %s · Python %s · %s", APP_NAME, VERSION, platform.python_version(), platform.platform())
