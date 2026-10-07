"""在线神经网络语音（edge-tts，Edge 浏览器「大声朗读」同款），生成的音频缓存到本地。

Windows 自带的英文语音比较机械，而且很多中文版系统只有中文语音，
所以联网时优先用这里的神经语音，断网或失败时前端会自动退回系统语音。
"""

import asyncio
import base64
import hashlib

from .paths import cache_dir

VOICES = {
    "en-US-AriaNeural": "Aria（美式 · 女）",
    "en-US-JennyNeural": "Jenny（美式 · 女）",
    "en-US-EmmaNeural": "Emma（美式 · 女）",
    "en-US-AvaNeural": "Ava（美式 · 女）",
    "en-US-GuyNeural": "Guy（美式 · 男）",
    "en-US-AndrewNeural": "Andrew（美式 · 男）",
    "en-US-BrianNeural": "Brian（美式 · 男）",
    "en-GB-SoniaNeural": "Sonia（英式 · 女）",
    "en-GB-LibbyNeural": "Libby（英式 · 女）",
    "en-GB-RyanNeural": "Ryan（英式 · 男）",
    "en-GB-ThomasNeural": "Thomas（英式 · 男）",
    "en-IE-ConnorNeural": "Connor（爱尔兰 · 男）",
    "en-IN-NeerjaNeural": "Neerja（印度 · 女）",
    "en-AU-NatashaNeural": "Natasha（澳式 · 女）",
}
DEFAULT_VOICE = "en-US-AriaNeural"
MAX_CHARS = 1500


def _cache_dir():
    return cache_dir("tts")


def _rate_str(rate: float) -> str:
    # 前端语速 1.0 = 正常；edge-tts 用百分比表示，如 "-10%"
    pct = round((float(rate) - 1.0) * 100)
    return f"{pct:+d}%"


def synthesize(text: str, voice: str = DEFAULT_VOICE, rate: float = 1.0) -> str:
    """返回 data:audio/mpeg;base64,... 形式的音频，前端可以直接播放。"""
    import edge_tts

    text = (text or "").strip()[:MAX_CHARS]
    if not text:
        raise ValueError("empty text")
    if voice not in VOICES:
        voice = DEFAULT_VOICE
    rate_s = _rate_str(rate)

    key = hashlib.sha1(f"{voice}|{rate_s}|{text}".encode("utf-8")).hexdigest()
    path = _cache_dir() / f"{key}.mp3"
    if not path.exists() or path.stat().st_size == 0:
        tmp = path.with_suffix(".part")
        asyncio.run(edge_tts.Communicate(text, voice, rate=rate_s).save(str(tmp)))
        tmp.replace(path)
    return "data:audio/mpeg;base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def cache_size_mb() -> float:
    return round(sum(f.stat().st_size for f in _cache_dir().glob("*.mp3")) / 1024 / 1024, 1)


def clear_cache() -> None:
    for f in _cache_dir().glob("*"):
        try:
            f.unlink()
        except OSError:
            pass
