"""离线语音识别：faster-whisper + Whisper base.en 英语模型（MIT 协议），在本机 CPU 上运行，不联网、不花钱。

模型约 145 MB，第一次用时在设置里下载到 %APPDATA%/EngNest/whisper/（huggingface.co 连不上时自动改用 hf-mirror.com）。
前端录音后把 16 kHz 单声道的 16 位 PCM（base64）传过来，返回识别出的英文。
faster-whisper 只在第一次识别时才导入，不影响启动速度；没装这个依赖时语音识别不可用，其他功能照常。
"""

import base64
import threading
import urllib.request

from .paths import data_dir

MODEL = "Systran/faster-whisper-base.en"
FILES = ["config.json", "tokenizer.json", "vocabulary.txt", "model.bin"]
ENDPOINTS = ["https://huggingface.co", "https://hf-mirror.com"]


def model_dir():
    return data_dir() / "whisper" / "base.en"


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
        d.mkdir(parents=True, exist_ok=True)
        try:
            for i, name in enumerate(FILES):
                if (d / name).exists():
                    continue
                last_err = None
                for ep in ENDPOINTS:
                    try:
                        self._fetch(f"{ep}/{MODEL}/resolve/main/{name}", d / name, i)
                        last_err = None
                        break
                    except OSError as e:
                        last_err = e
                if last_err:
                    raise last_err
            self.task.update(running=False, progress=1.0, stage="done")
        except Exception as e:  # noqa: BLE001 — 网络问题直接告诉用户
            self.task.update(running=False, stage="error", error=str(e))

    def _fetch(self, url, path, index):
        part = path.with_suffix(path.suffix + ".part")
        req = urllib.request.Request(url, headers={"User-Agent": "EngNest"})
        with urllib.request.urlopen(req, timeout=60) as r, open(part, "wb") as out:
            size = int(r.headers.get("Content-Length") or 0)
            got = 0
            while chunk := r.read(512 * 1024):
                out.write(chunk)
                got += len(chunk)
                if size and path.name == "model.bin":  # 进度主要看最大的模型文件
                    self.task["progress"] = got / size
        part.replace(path)

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
