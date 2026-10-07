"""离线语音识别：faster-whisper + Whisper base.en 英语模型（MIT 协议），在本机 CPU 上运行，不联网、不花钱。

模型约 145 MB，第一次用时在设置里下载到数据目录的 cache/whisper/（huggingface.co 连不上时自动改用 hf-mirror.com）。
前端录音后把 16 kHz 单声道的 16 位 PCM（base64）传过来，返回识别出的英文。
faster-whisper 只在第一次识别时才导入，不影响启动速度；没装这个依赖时语音识别不可用，其他功能照常。
"""

import base64
import threading

from . import net
from .paths import cache_dir

MODEL = "Systran/faster-whisper-base.en"
REVISION = "3d3d5dee26484f91867d81cb899cfcf72b96be6c"  # 固定版本：模型仓库更新了也不受影响
# 文件 → (大小, SHA256)，下载后核对
FILES = {
    "config.json": (2227, "f3bc3821e9fc76a27bae538e11ae5b677dcdd352b4600429ce7951d398569aeb"),
    "tokenizer.json": (2128466, "929c5252409436dce1b38a75d1abbcb5e132d170d8e324e4e04ed915fa2d22df"),
    "vocabulary.txt": (422309, "ff77588746d3a2595d32ab5b69ffd7b95ce2441ac57533cb66fc3eb575a115cf"),
    "model.bin": (145216508, "2a166925539a16005f14ff328359f9b9adb9dc4fb631bb3b227526862e93e2ef"),
}
ENDPOINTS = ["https://huggingface.co", "https://hf-mirror.com"]
TOTAL = sum(size for size, _ in FILES.values())


def model_dir():
    return cache_dir("whisper") / "base.en"


class Stt:
    def __init__(self):
        self._model = None
        self._lock = threading.Lock()
        self.task = {"running": False, "progress": 0.0, "error": "", "stage": ""}

    def available(self) -> bool:
        try:
            import faster_whisper  # noqa: F401
            return True
        except Exception:  # noqa: BLE001 — 打包时没带上依赖等情况
            return False

    def status(self) -> dict:
        ready = all((model_dir() / f).exists() for f in FILES)
        return {"available": self.available(), "model": ready, **self.task}

    # ---------- 下载模型 ----------
    def download(self) -> bool:
        if self.task["running"]:
            return False
        self.task = {"running": True, "progress": 0.0, "error": "", "stage": "download"}
        threading.Thread(target=self._download, daemon=True).start()
        return True

    def _download(self):
        d = model_dir()
        done = 0
        try:
            for name, (size, sha) in FILES.items():
                urls = [f"{ep}/{MODEL}/resolve/{REVISION}/{name}" for ep in ENDPOINTS]
                net.download(urls, d / name, sha256=sha, size=size,
                             progress=lambda got, _t, base=done: self.task.update(progress=(base + got) / TOTAL))
                done += size
            self.task.update(running=False, progress=1.0, stage="done")
        except Exception as e:  # noqa: BLE001 — 网络问题直接告诉用户（没下完的部分留着，下次接着下）
            self.task.update(running=False, stage="error", error=str(e))

    def remove(self) -> bool:
        with self._lock:
            self._model = None
        for f in FILES:
            (model_dir() / f).unlink(missing_ok=True)
        return True

    # ---------- 识别 ----------
    def transcribe(self, pcm_b64: str, words: bool = False) -> dict:
        """words=True 用于跟读评测：多给每个词的识别把握（0~1）和起止时间，beam 也开大一点，识别更准。"""
        if not self.available():
            return {"ok": False, "error": "这个版本没有带语音识别组件"}
        if not all((model_dir() / f).exists() for f in FILES):
            return {"ok": False, "error": "还没有下载语音识别模型，请先到「设置」里下载"}
        import numpy as np

        audio = np.frombuffer(base64.b64decode(pcm_b64), dtype=np.int16).astype(np.float32) / 32768.0
        if audio.size < 16000 * 0.3:
            return {"ok": True, "text": "", "words": []}
        with self._lock:
            if self._model is None:
                from faster_whisper import WhisperModel

                self._model = WhisperModel(str(model_dir()), device="cpu", compute_type="int8")
            opts = {"language": "en", "condition_on_previous_text": False}
            if words:
                opts.update(beam_size=5, word_timestamps=True)
            else:
                opts.update(beam_size=1)
            segments = list(self._model.transcribe(audio, vad_filter=True, **opts)[0])
            # 只说一个短词时，静音检测偶尔会把整段当成静音切掉，这时不切再识别一次
            if words and not segments:
                segments = list(self._model.transcribe(audio, vad_filter=False, **opts)[0])
            text = " ".join(s.text.strip() for s in segments).strip()
            result = {"ok": True, "text": text}
            if words:
                result["words"] = [{"w": w.word.strip(), "p": round(float(w.probability), 3),
                                    "s": round(float(w.start), 2), "e": round(float(w.end), 2)}
                                   for s in segments for w in (s.words or []) if w.word.strip()]
        return result
