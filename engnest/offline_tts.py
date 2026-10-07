"""离线神经语音（Piper）：微软在线语音连不上时的备用，音质比 Windows 系统语音自然得多，完全不联网。

- 引擎用 rhasspy/piper 2023.11.14-2 的 Windows 独立版（MIT 协议），用户在设置里点下载时才从官方地址下到本机
  （里面带的 espeak-ng 是 GPL 协议，所以不打包进 EngNest，只按需下载原版）。
- 声音模型来自 rhasspy/piper-voices（Hugging Face，下载失败换 hf-mirror），固定版本并核对 SHA256。
- 每个声音 + 语速开一个常驻的 piper.exe 进程（--json-input），一句话 0.2 秒左右；生成的 wav 缓存在 cache/tts。
"""

import base64
import hashlib
import json
import logging
import os
import shutil
import subprocess
import threading

from . import net
from .ext import safe_extract
from .paths import cache_dir

log = logging.getLogger(__name__)

ENGINE = {
    "url": "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip",
    "size": 22477236,
    "sha256": "f3c58906402b24f3a96d92145f58acba6d86c9b5db896d207f78dc80811efcea",
}
HF_REV = "c10ece1aade47bb51c153c893d14e5bf8e5b7117"
VOICES = {
    "en_US-lessac-medium": {"name": "Lessac（美式 · 女）", "path": "en/en_US/lessac/medium",
                            "onnx": (63201294, "5efe09e69902187827af646e1a6e9d269dee769f9877d17b16b1b46eeaaf019f"),
                            "json": (4885, "efe19c417bed055f2d69908248c6ba650fa135bc868b0e6abb3da181dab690a0")},
    "en_US-ryan-medium": {"name": "Ryan（美式 · 男）", "path": "en/en_US/ryan/medium",
                          "onnx": (63201294, "abf4c274862564ed647ba0d2c47f8ee7c9b717d27bdad9219100eb310db4047a"),
                          "json": (4883, "44034c056cb15681b2ad494307c7f3f2e4499d1253c700c711fa0a4607ffe78d")},
    "en_GB-alba-medium": {"name": "Alba（英式 · 女）", "path": "en/en_GB/alba/medium",
                          "onnx": (63201294, "401369c4a81d09fdd86c32c5c864440811dbdcc66466cde2d64f7133a66ad03b"),
                          "json": (4888, "aa965a2f02ecced632c2694e1fc72bbff6d65f265fab567ca945918c73dd89f4")},
}
DEFAULT_VOICE = "en_US-lessac-medium"
HF = ["https://huggingface.co", "https://hf-mirror.com"]
MAX_CHARS = 1500


def base_dir():
    return cache_dir("piper")


def exe_path():
    return base_dir() / "engine" / "piper.exe"


def voice_file(vid, ext="onnx"):
    return base_dir() / "voices" / f"{vid}.{ext}"


def installed_voices() -> list:
    return [v for v in VOICES if voice_file(v).exists() and voice_file(v, "onnx.json").exists()]


class OfflineTTS:
    def __init__(self):
        self.task = {"running": False, "progress": 0.0, "stage": "", "error": ""}
        self._procs = {}  # (voice, scale) → Popen
        self._lock = threading.Lock()

    def status(self) -> dict:
        return {"available": os.name == "nt", "engine": exe_path().exists(), "voices": installed_voices(),
                "all_voices": {k: v["name"] for k, v in VOICES.items()}, **self.task}

    def ready(self) -> bool:
        return exe_path().exists() and bool(installed_voices())

    # ---------- 下载 ----------
    def install(self, voice: str = DEFAULT_VOICE) -> bool:
        if self.task["running"] or voice not in VOICES:
            return False
        self.task = {"running": True, "progress": 0.0, "stage": "download", "error": ""}
        threading.Thread(target=self._install, args=(voice,), daemon=True).start()
        return True

    def _install(self, voice):
        v = VOICES[voice]
        total = (0 if exe_path().exists() else ENGINE["size"]) + v["onnx"][0]
        done = 0

        def prog(got, _t):
            self.task["progress"] = min(0.99, (done + got) / total)

        try:
            if not exe_path().exists():
                z = base_dir() / "piper_windows_amd64.zip"
                net.download(net.github_mirrors(ENGINE["url"]), z, sha256=ENGINE["sha256"], size=ENGINE["size"], progress=prog)
                done += ENGINE["size"]
                tmp = base_dir() / "engine.tmp"
                shutil.rmtree(tmp, ignore_errors=True)
                safe_extract(z, tmp, strip_top=True)  # zip 里最外层是 piper/
                shutil.rmtree(base_dir() / "engine", ignore_errors=True)
                tmp.rename(base_dir() / "engine")
                z.unlink(missing_ok=True)
            for ext, key in (("onnx.json", "json"), ("onnx", "onnx")):
                size, sha = v[key]
                urls = [f"{h}/rhasspy/piper-voices/resolve/{HF_REV}/{v['path']}/{voice}.{ext}" for h in HF]
                net.download(urls, voice_file(voice, ext), sha256=sha, size=size, progress=prog if ext == "onnx" else None)
            self.task.update(running=False, progress=1.0, stage="done")
        except Exception as e:  # noqa: BLE001 — 网络问题直接告诉用户（没下完的部分留着，下次接着下）
            self.task.update(running=False, stage="error", error=str(e))

    def remove(self) -> bool:
        self.stop()
        shutil.rmtree(base_dir(), ignore_errors=True)
        return True

    # ---------- 合成 ----------
    def _proc(self, voice, scale):
        key = (voice, scale)
        p = self._procs.get(key)
        if p and p.poll() is None:
            return p
        args = [str(exe_path()), "--model", str(voice_file(voice)), "--json-input", "--length_scale", f"{scale:.2f}",
                "--output_dir", str(cache_dir("tts"))]
        p = subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True,
                             encoding="utf-8", creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0), cwd=str(exe_path().parent))
        self._procs[key] = p
        return p

    def synthesize(self, text: str, voice: str = "", rate: float = 1.0) -> str:
        """返回 data:audio/wav;base64,...；没装好时抛 RuntimeError"""
        text = " ".join((text or "").split())[:MAX_CHARS]
        if not text:
            raise ValueError("empty text")
        voices = installed_voices()
        if not exe_path().exists() or not voices:
            raise RuntimeError("还没有下载离线语音")
        voice = voice if voice in voices else voices[0]
        scale = round(min(2.0, max(0.5, 1.0 / max(0.3, float(rate or 1.0)))), 2)  # 语速 0.8 → 每个音长 1.25 倍
        out = cache_dir("tts") / (hashlib.sha1(f"piper|{voice}|{scale}|{text}".encode("utf-8")).hexdigest() + ".wav")
        if not out.exists() or out.stat().st_size == 0:
            with self._lock:
                for attempt in range(2):  # 进程意外退出时重启一次
                    p = self._proc(voice, scale)
                    try:
                        p.stdin.write(json.dumps({"text": text, "output_file": str(out)}) + "\n")
                        p.stdin.flush()
                        line = p.stdout.readline().strip()
                        if line:
                            break
                    except OSError:
                        pass
                    self._procs.pop((voice, scale), None)
                else:
                    raise RuntimeError("离线语音引擎出错了")
        return "data:audio/wav;base64," + base64.b64encode(out.read_bytes()).decode("ascii")

    def stop(self):
        with self._lock:
            for p in self._procs.values():
                try:
                    p.stdin.close()
                    p.terminate()
                except OSError:
                    pass
            self._procs.clear()
