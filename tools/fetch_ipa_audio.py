"""发音课：下载单个音标的录音（Wikimedia Commons 上国际音标表的标准录音，CC BY-SA 3.0 / 公有领域）。

单元音和辅音用 Commons 的录音；双元音没有合适的录音，前端用只包含这个音的单词让神经语音读（eye /aɪ/、owe /əʊ/……）。
辅音的录音一般是把这个音放在音节里读（比如 [pa] [apa]），单独一个辅音很难听清。

    python tools/fetch_ipa_audio.py

输出：web/audio/ipa/*.ogg 和 web/data/ipa_audio.js（音标 → 文件、作者、授权）
"""

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "audio" / "ipa"
UA = "EngNest/0.3 (personal English-learning desktop app; educational use)"

FILES = {
    "iː": "Close front unrounded vowel.ogg", "ɪ": "Near-close near-front unrounded vowel.ogg",
    "e": "Close-mid front unrounded vowel.ogg", "æ": "Near-open front unrounded vowel.ogg",
    "ʌ": "Open-mid back unrounded vowel.ogg", "ɑː": "Open back unrounded vowel.ogg", "ɒ": "Open back rounded vowel.ogg",
    "ɔː": "Open-mid back rounded vowel.ogg", "ʊ": "Near-close near-back rounded vowel.ogg", "uː": "Close back rounded vowel.ogg",
    "ɜː": "Open-mid central unrounded vowel.ogg", "ə": "Mid-central vowel.ogg",
    "p": "Voiceless bilabial plosive.ogg", "b": "Voiced bilabial plosive.ogg", "t": "Voiceless alveolar plosive.ogg",
    "d": "Voiced alveolar plosive.ogg", "k": "Voiceless velar plosive.ogg", "g": "Voiced velar plosive.ogg",
    "f": "Voiceless labiodental fricative.ogg", "v": "Voiced labiodental fricative.ogg", "θ": "Voiceless dental fricative.ogg",
    "ð": "Voiced dental fricative.ogg", "s": "Voiceless alveolar sibilant.ogg", "z": "Voiced alveolar sibilant.ogg",
    "ʃ": "Voiceless palato-alveolar sibilant.ogg", "ʒ": "Voiced palato-alveolar sibilant.ogg", "h": "Voiceless glottal fricative.ogg",
    "tʃ": "Voiceless palato-alveolar affricate.ogg", "dʒ": "Voiced palato-alveolar affricate.ogg",
    "ts": "Voiceless alveolar sibilant affricate.oga", "dz": "Voiced alveolar sibilant affricate.oga",
    "m": "Bilabial nasal.ogg", "n": "Alveolar nasal.ogg", "ŋ": "Velar nasal.ogg", "l": "Alveolar lateral approximant.ogg",
    "r": "Alveolar approximant.ogg", "j": "Palatal approximant.ogg", "w": "Voiced labio-velar approximant.ogg",
}


def api(titles):
    q = urllib.parse.urlencode({"action": "query", "titles": "|".join(titles), "prop": "imageinfo",
                                "iiprop": "url|extmetadata", "format": "json"})
    req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + q, headers={"User-Agent": UA})
    return json.load(urllib.request.urlopen(req, timeout=60))["query"]["pages"].values()


def clean(html_text):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html_text or "")).strip()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    info = {}
    titles = ["File:" + f for f in FILES.values()]
    for i in range(0, len(titles), 40):
        for p in api(titles[i:i + 40]):
            ii = p["imageinfo"][0]
            m = ii["extmetadata"]
            info[p["title"][5:]] = {"url": ii["url"], "page": ii["descriptionurl"],
                                    "license": clean(m.get("LicenseShortName", {}).get("value")),
                                    "artist": clean(m.get("Artist", {}).get("value"))}
    out = {}
    for sym, name in FILES.items():
        it = info[name]
        fname = re.sub(r"[^a-z0-9]+", "-", name.lower().rsplit(".", 1)[0]).strip("-") + "." + name.rsplit(".", 1)[1]
        path = OUT / fname
        if not path.exists():
            req = urllib.request.Request(it["url"], headers={"User-Agent": UA})
            for attempt in range(4):  # 网络偶尔会断；请求太快会被限流（429），按服务器给的 Retry-After 等待
                try:
                    path.write_bytes(urllib.request.urlopen(req, timeout=60).read())
                    break
                except urllib.error.HTTPError as e:
                    if e.code != 429 or attempt == 3:
                        raise
                    wait = int(e.headers.get("Retry-After") or 600) + 30
                    print(f"  被限流，等 {wait} 秒", flush=True)
                    time.sleep(wait)
                except OSError:
                    if attempt == 3:
                        raise
                    time.sleep(30)
            time.sleep(20)  # Wikimedia 对下载频率有限制，慢慢下
        artist = it["artist"] if it["artist"] and "No machine-readable" not in it["artist"] else "Wikimedia Commons contributors"
        out[sym] = {"f": f"audio/ipa/{fname}", "by": artist[:80], "lic": it["license"], "src": it["page"]}
        print(sym, fname, it["license"], artist[:40])
    (ROOT / "web" / "data" / "ipa_audio.js").write_text(
        "// 由 tools/fetch_ipa_audio.py 生成：单个音标的录音（Wikimedia Commons）\nwindow.IPA_AUDIO = "
        + json.dumps(out, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")


if __name__ == "__main__":
    main()
