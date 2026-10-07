"""AI 接入：支持 OpenAI 兼容接口（DeepSeek / 通义千问 / Kimi / 智谱 / OpenAI 等）和 Claude。

- OpenAI 兼容接口直接用标准库 urllib 调用（走 net 里的代理）；Claude 走官方 anthropic SDK。
- chat() 可以传 on_delta 回调，边生成边把文字交给前端（流式输出）。
- json_mode=True：OpenAI 兼容接口加 response_format=json_object（服务商不支持时自动去掉再试），
  回复用 extract_json() 从文字里稳妥地抠出 JSON。
- 返回 (文字, 用量)，用量 {input, output, cache_read} 用于统计（ai_usage.py）。
"""

import json
import logging
import re
import urllib.error
import urllib.request

from . import net

log = logging.getLogger(__name__)

# type: "openai" 表示 OpenAI 兼容的 /chat/completions 接口；"anthropic" 表示 Claude。
# 各家的模型名会更新：设置页可以「获取模型列表」从服务商那里拉最新的。
PRESETS = {
    "none": {"name": "不使用 AI", "type": "none", "base_url": "", "model": ""},
    "deepseek": {
        "name": "DeepSeek",
        "type": "openai",
        "base_url": "https://api.deepseek.com",
        "model": "deepseek-flash",
    },
    "qwen": {
        "name": "通义千问",
        "type": "openai",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen-plus",
    },
    "kimi": {
        "name": "Kimi（月之暗面）",
        "type": "openai",
        "base_url": "https://api.moonshot.cn/v1",
        "model": "kimi-k2.6",
    },
    "zhipu": {
        "name": "智谱 GLM",
        "type": "openai",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "model": "glm-4.7-flash",
    },
    "openai": {
        "name": "OpenAI",
        "type": "openai",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-5-mini",
    },
    "claude": {
        "name": "Claude（Anthropic）",
        "type": "anthropic",
        "base_url": "",
        "model": "claude-opus-5-5",
    },
    "custom": {
        "name": "自定义（OpenAI 兼容）",
        "type": "openai",
        "base_url": "",
        "model": "",
    },
}

TIMEOUT = 120
MAX_HISTORY = 24  # 多轮对话最多带最近这么多条消息，越聊越长时控制费用


class AIError(Exception):
    """给用户看的错误信息，尽量是中文、说人话。"""


def provider_type(provider: str) -> str:
    return PRESETS.get(provider, PRESETS["custom"])["type"]


def trim_history(messages: list, limit: int = MAX_HISTORY) -> list:
    """只保留最近 limit 条，并保证第一条是用户说的（Claude 要求对话从用户开始）"""
    msgs = [m for m in messages if m.get("role") in ("user", "assistant") and str(m.get("content", "")).strip()]
    if len(msgs) > limit:
        msgs = msgs[-limit:]
    if msgs and msgs[0]["role"] != "user":
        msgs = [{"role": "user", "content": "(The conversation starts. Please say your opening line.)"}] + msgs
    # 连续两条同一个角色的合并成一条
    out = []
    for m in msgs:
        if out and out[-1]["role"] == m["role"]:
            out[-1] = {"role": m["role"], "content": f"{out[-1]['content']}\n\n{m['content']}"}
        else:
            out.append({"role": m["role"], "content": str(m["content"])})
    return out


def chat(cfg: dict, system: str, messages: list, json_mode: bool = False, on_delta=None):
    """发送一轮对话，返回 (模型的文本回复, 用量)。messages 形如 [{"role": "user", "content": "..."}]。"""
    ptype = provider_type(cfg.get("provider", "none"))
    if ptype == "none":
        raise AIError("还没有配置 AI，请先到「设置」里填写。")
    if not cfg.get("api_key"):
        raise AIError("还没有填写 API Key。")
    if not cfg.get("model"):
        raise AIError("还没有填写模型名称。")
    messages = trim_history(messages)
    if not messages:
        raise AIError("没有要发送的内容。")
    if ptype == "anthropic":
        return _chat_anthropic(cfg, system, messages, on_delta)
    return _chat_openai(cfg, system, messages, json_mode, on_delta)


# ---------- OpenAI 兼容接口 ----------
def _base(cfg) -> str:
    base_url = (cfg.get("base_url") or "").strip().rstrip("/")
    if not base_url:
        raise AIError("还没有填写接口地址（Base URL）。")
    return base_url


def _post(url, cfg, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), method="POST", headers={
        "Content-Type": "application/json", "Authorization": f"Bearer {cfg['api_key']}"})
    return net.urlopen(req, timeout=TIMEOUT)


def _http_error(e: urllib.error.HTTPError) -> AIError:
    detail = e.read().decode("utf-8", errors="ignore")[:300]
    return AIError(_http_hint(e.code) + f"\n（HTTP {e.code}）{detail}")


def _chat_openai(cfg, system, messages, json_mode, on_delta):
    base_url = _base(cfg)
    url = base_url if base_url.endswith("/chat/completions") else base_url + "/chat/completions"
    body = {"model": cfg["model"], "messages": [{"role": "system", "content": system}] + messages, "max_tokens": 4096}
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    if on_delta:
        body["stream"] = True
        body["stream_options"] = {"include_usage": True}
    # 有的服务商不支持 response_format / stream_options：报 400 时去掉这些再试一次
    optional = [k for k in ("stream_options", "response_format") if k in body]
    while True:
        try:
            resp = _post(url, cfg, body)
            break
        except urllib.error.HTTPError as e:
            if e.code in (400, 422) and optional:
                log.info("接口不支持 %s，去掉后重试", optional[0])
                body.pop(optional.pop(0))
                continue
            raise _http_error(e) from e
        except urllib.error.URLError as e:
            raise AIError(f"网络连接失败，请检查网络、代理或接口地址：{e.reason}") from e
        except TimeoutError as e:
            raise AIError("请求超时，请稍后再试。") from e
    with resp:
        if on_delta:
            return _read_sse(resp, on_delta)
        try:
            data = json.loads(resp.read().decode("utf-8"))
        except json.JSONDecodeError as e:
            raise AIError("接口返回的不是有效的 JSON，请检查接口地址是否正确。") from e
    try:
        text = data["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError) as e:
        raise AIError(f"接口返回格式不符合预期：{str(data)[:300]}") from e
    return text, _usage_openai(data.get("usage"))


def _read_sse(resp, on_delta):
    parts, usage = [], {}
    for raw in resp:
        line = raw.decode("utf-8", errors="ignore").strip()
        if not line.startswith("data:"):
            continue
        payload = line[5:].strip()
        if payload == "[DONE]":
            break
        try:
            ev = json.loads(payload)
        except json.JSONDecodeError:
            continue
        if ev.get("error"):
            raise AIError(f"接口返回错误：{str(ev['error'])[:300]}")
        if ev.get("usage"):
            usage = _usage_openai(ev["usage"])
        for ch in ev.get("choices") or []:
            piece = (ch.get("delta") or {}).get("content")
            if piece:
                parts.append(piece)
                on_delta(piece)
    return "".join(parts), usage


def _usage_openai(u) -> dict:
    u = u or {}
    cached = (u.get("prompt_tokens_details") or {}).get("cached_tokens") or u.get("prompt_cache_hit_tokens") or 0
    return {"input": u.get("prompt_tokens") or 0, "output": u.get("completion_tokens") or 0, "cache_read": cached}


def list_models(cfg: dict) -> list:
    """从服务商拉可用的模型名"""
    ptype = provider_type(cfg.get("provider", "none"))
    if ptype == "anthropic":
        client = _anthropic_client(cfg)
        return sorted((m.id for m in client.models.list(limit=100)), reverse=True)
    req = urllib.request.Request(_base(cfg) + "/models", headers={"Authorization": f"Bearer {cfg.get('api_key', '')}"})
    try:
        with net.urlopen(req, timeout=20) as r:
            data = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise _http_error(e) from e
    except urllib.error.URLError as e:
        raise AIError(f"网络连接失败：{e.reason}") from e
    return sorted({m.get("id") for m in data.get("data", []) if m.get("id")})


# ---------- Claude ----------
# 只有这些情况才去掉高级参数重试：中转服务或旧模型不认识 beta、fallbacks、effort、缓存
_UNSUPPORTED = re.compile(r"fallback|beta|output_config|effort|cache_control|extra (inputs|fields)|not permitted|unexpected|unknown|unsupported|unrecognized",
                          re.I)


def _anthropic_client(cfg):
    try:
        import anthropic
    except ImportError as e:
        raise AIError("缺少 anthropic 库，请运行 pip install anthropic。") from e
    kwargs = {"api_key": cfg["api_key"], "timeout": float(TIMEOUT), "max_retries": 2}
    base_url = (cfg.get("base_url") or "").strip()
    if base_url:
        kwargs["base_url"] = base_url
    proxy = net.proxy()
    if proxy:
        kwargs["http_client"] = anthropic.DefaultHttpxClient(proxy=proxy)
    return anthropic.Anthropic(**kwargs)


def _chat_anthropic(cfg, system, messages, on_delta):
    import anthropic

    client = _anthropic_client(cfg)
    params = {"model": cfg["model"], "max_tokens": 16000, "system": system, "messages": messages}
    advanced = {
        # 对话类场景用 low effort 就够了，响应更快也更省钱；fallbacks="default"：模型拒答时由服务端自动换模型重试；
        # cache_control：系统提示和前面的对话自动缓存，多轮对话便宜很多
        "betas": ["server-side-fallback-2026-07-01"],
        "fallbacks": "default",
        "output_config": {"effort": "low"},
        "cache_control": {"type": "ephemeral"},
    }
    try:
        try:
            resp = _anthropic_call(client.beta.messages, {**params, **advanced}, on_delta)
        except anthropic.BadRequestError as e:
            if not _UNSUPPORTED.search(str(e.message)):
                raise
            log.info("Claude 接口不支持高级参数，退回基础请求：%s", e.message)
            resp = _anthropic_call(client.messages, params, on_delta)
    except anthropic.BadRequestError as e:
        raise AIError(f"请求参数有误：{e.message}") from e
    except anthropic.AuthenticationError as e:
        raise AIError("API Key 无效，请检查后重新填写。") from e
    except anthropic.PermissionDeniedError as e:
        raise AIError("没有权限访问该模型，请检查账号或模型名称。") from e
    except anthropic.NotFoundError as e:
        raise AIError("找不到该模型或接口，请检查模型名称和接口地址。") from e
    except anthropic.RateLimitError as e:
        raise AIError("请求太频繁或额度不足，请稍后再试。") from e
    except anthropic.APIStatusError as e:
        raise AIError(f"接口返回错误（HTTP {e.status_code}）：{e.message}") from e
    except anthropic.APIConnectionError as e:
        raise AIError("网络连接失败，请检查网络、代理或接口地址。") from e

    if resp.stop_reason == "refusal":
        raise AIError("模型拒绝回答这个请求，换个说法试试。")
    u = resp.usage
    usage = {"input": (u.input_tokens or 0) + (getattr(u, "cache_creation_input_tokens", 0) or 0),
             "output": u.output_tokens or 0, "cache_read": getattr(u, "cache_read_input_tokens", 0) or 0}
    return "".join(block.text for block in resp.content if block.type == "text"), usage


def _anthropic_call(api, params, on_delta):
    if not on_delta:
        return api.create(**params)
    with api.stream(**params) as stream:
        for text in stream.text_stream:
            on_delta(text)
        return stream.get_final_message()


# ---------- 从回复里抠 JSON ----------
def extract_json(text: str):
    """模型偶尔会在 JSON 前后加说明文字或 ``` 代码块：找出第一个能完整解析的 JSON 对象。找不到抛 ValueError。"""
    text = (text or "").strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    candidates = [fenced.group(1).strip()] if fenced else []
    candidates.append(text)
    dec = json.JSONDecoder()
    for cand in candidates:
        for i, ch in enumerate(cand):
            if ch != "{":
                continue
            try:
                obj, _ = dec.raw_decode(cand[i:])
            except json.JSONDecodeError:
                continue
            if isinstance(obj, dict):
                return obj
    raise ValueError("回复里没有有效的 JSON")


def _http_hint(code: int) -> str:
    return {
        400: "请求参数有误，请检查模型名称（各家的模型名会更新，可以在设置里「获取模型列表」）。",
        401: "API Key 无效，请检查后重新填写。",
        402: "账户余额不足。",
        403: "没有权限访问该模型。",
        404: "找不到接口或模型，请检查接口地址和模型名称。",
        429: "请求太频繁或额度不足，请稍后再试。",
    }.get(code, "接口返回错误。" if code < 500 else "AI 服务暂时不可用，请稍后再试。")
