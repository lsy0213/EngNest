import json

from engnest import secret
from engnest.settings import Settings


def test_secret_roundtrip():
    enc = secret.protect("sk-test-123456")
    assert enc.startswith(("dpapi:", "plain:"))
    if enc.startswith("dpapi:"):
        assert "sk-test" not in enc
    assert secret.unprotect(enc) == "sk-test-123456"
    assert secret.unprotect("old-plain-key") == "old-plain-key"
    assert secret.unprotect("dpapi:not-base64!!") == ""


def test_plain_key_migrated(data_dir):
    data_dir.mkdir(parents=True, exist_ok=True)
    f = data_dir / "settings.json"
    f.write_text(json.dumps({"ai": {"provider": "qwen", "api_key": "sk-plain-999"}}), encoding="utf-8")
    s = Settings()
    raw = json.loads(f.read_text(encoding="utf-8"))
    assert "api_key" not in raw["ai"] and raw["ai"]["api_key_enc"]
    if raw["ai"]["api_key_enc"].startswith("dpapi:"):
        assert "sk-plain-999" not in f.read_text(encoding="utf-8")
    assert s.section("ai")["api_key"] == "sk-plain-999"


def test_clear_key():
    s = Settings()
    s.update("ai", {"provider": "x", "api_key": "k1"})
    assert s.section("ai")["api_key"] == "k1"
    s.update("ai", {"provider": "x", "api_key": ""})
    assert s.section("ai")["api_key"] == ""


def test_tts_trim(data_dir, monkeypatch):
    import os
    import time

    from engnest import tts

    d = tts._cache_dir()
    for i in range(10):
        f = d / f"{i}.mp3"
        f.write_bytes(b"x" * 200_000)
        os.utime(f, (time.time() - 1000 + i, time.time() - 1000 + i))
    n = tts.trim_cache(limit_mb=1)  # 2 MB → 删到 0.8 MB 以下
    left = sorted(p.name for p in d.glob("*.mp3"))
    assert n == 6 and left == ["6.mp3", "7.mp3", "8.mp3", "9.mp3"]  # 留下最近用过的
