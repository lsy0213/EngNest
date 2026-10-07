import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

from engnest import ai_client, ai_usage

SEEN = []


class FakeOpenAI(BaseHTTPRequestHandler):
    """模拟 OpenAI 兼容接口：不支持 response_format（返回 400），支持流式"""

    def log_message(self, *a):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        SEEN.append(body)
        if "response_format" in body:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'{"error": "response_format not supported"}')
            return
        if body.get("stream"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.end_headers()
            for piece in ["Hel", "lo", "!"]:
                self.wfile.write(f'data: {json.dumps({"choices": [{"delta": {"content": piece}}]})}\n\n'.encode())
            self.wfile.write(b'data: {"choices": [], "usage": {"prompt_tokens": 7, "completion_tokens": 3}}\n\n')
            self.wfile.write(b"data: [DONE]\n\n")
            return
        out = {"choices": [{"message": {"content": 'Sure: ```json\n{"a": 1}\n```'}}], "usage": {"prompt_tokens": 5, "completion_tokens": 2}}
        raw = json.dumps(out).encode()
        self.send_response(200)
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        raw = json.dumps({"data": [{"id": "m-b"}, {"id": "m-a"}]}).encode()
        self.send_response(200)
        self.end_headers()
        self.wfile.write(raw)


@pytest.fixture
def cfg():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), FakeOpenAI)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    SEEN.clear()
    yield {"provider": "custom", "base_url": f"http://127.0.0.1:{srv.server_address[1]}/v1", "model": "m", "api_key": "k"}
    srv.shutdown()


def test_json_mode_falls_back_and_extracts(cfg):
    text, usage = ai_client.chat(cfg, "sys", [{"role": "user", "content": "hi"}], json_mode=True)
    assert "response_format" in SEEN[0] and "response_format" not in SEEN[1]  # 不支持就去掉重试
    assert ai_client.extract_json(text) == {"a": 1}
    assert usage == {"input": 5, "output": 2, "cache_read": 0}


def test_streaming(cfg):
    got = []
    text, usage = ai_client.chat(cfg, "sys", [{"role": "user", "content": "hi"}], on_delta=got.append)
    assert got == ["Hel", "lo", "!"] and text == "Hello!"
    assert usage["input"] == 7 and usage["output"] == 3


def test_list_models(cfg):
    assert ai_client.list_models(cfg) == ["m-a", "m-b"]


def test_trim_history_starts_with_user_and_merges():
    msgs = [{"role": "assistant", "content": "Hi!"}] + [{"role": "user" if i % 2 else "assistant", "content": str(i)} for i in range(1, 40)]
    out = ai_client.trim_history(msgs, limit=10)
    assert out[0]["role"] == "user"
    assert all(a["role"] != b["role"] for a, b in zip(out, out[1:]))
    assert out[-1]["content"] == "39"


def test_extract_json_variants():
    assert ai_client.extract_json('{"x": [1, 2]}') == {"x": [1, 2]}
    assert ai_client.extract_json('Here you go {"ok": true} hope it helps {"no": 1}') == {"ok": True}
    with pytest.raises(ValueError):
        ai_client.extract_json("no json here {oops")


def test_usage_limit():
    ai_usage.record("m", {"input": 600, "output": 500})
    assert ai_usage.month_total() == 1100
    assert ai_usage.check_limit({"monthly_tokens": 1000})
    assert not ai_usage.check_limit({"monthly_tokens": 0})
    s = ai_usage.summary({"price_in": 2, "price_out": 8})
    assert s["months"][0]["cost"] == round((600 * 2 + 500 * 8) / 1e6, 2)
