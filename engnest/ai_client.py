"""AI 接入：支持 OpenAI 兼容接口（DeepSeek / 通义千问 / Kimi / 智谱 / OpenAI 等）和 Claude。

OpenAI 兼容接口直接用标准库 urllib 调用；Claude 走官方 anthropic SDK。
"""

import json
import urllib.error
import urllib.request

# type: "openai" 表示 OpenAI 兼容的 /chat/completions 接口；"anthropic" 表示 Claude
PRESETS = {
    "none": {"name": "不使用 AI", "type": "none", "base_url": "", "model": ""},
    "deepseek": {
        "name": "DeepSeek",
        "type": "openai",
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
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
        "model": "moonshot-v1-8k",
    },
    "zhipu": {
        "name": "智谱 GLM",
        "type": "openai",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "model": "glm-4-flash",
    },
    "openai": {
        "name": "OpenAI",
        "type": "openai",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
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


class AIError(Exception):
    """给用户看的错误信息，尽量是中文、说人话。"""


def provider_type(provider: str) -> str:
    return PRESETS.get(provider, PRESETS["custom"])["type"]


def chat(cfg: dict, system: str, messages: list) -> str:
    """发送一轮对话，返回模型的文本回复。messages 形如 [{"role": "user", "content": "..."}]。"""
    ptype = provider_type(cfg.get("provider", "none"))
    if ptype == "none":
        raise AIError("还没有配置 AI，请先到「设置」里填写。")
    if not cfg.get("api_key"):
        raise AIError("还没有填写 API Key。")
    if not cfg.get("model"):
        raise AIError("还没有填写模型名称。")
    if ptype == "anthropic":
        return _chat_anthropic(cfg, system, messages)
    return _chat_openai(cfg, system, messages)


def _chat_openai(cfg: dict, system: str, messages: list) -> str:
    base_url = (cfg.get("base_url") or "").strip().rstrip("/")
    if not base_url:
        raise AIError("还没有填写接口地址（Base URL）。")
    url = base_url if base_url.endswith("/chat/completions") else base_url + "/chat/completions"
    body = {
        "model": cfg["model"],
        "messages": [{"role": "system", "content": system}] + messages,
        "max_tokens": 4096,
        "temperature": 0.7,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {cfg['api_key']}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")[:300]
        raise AIError(_http_hint(e.code) + f"\n（HTTP {e.code}）{detail}") from e
    except urllib.error.URLError as e:
        raise AIError(f"网络连接失败，请检查网络或接口地址：{e.reason}") from e
    except TimeoutError as e:
        raise AIError("请求超时，请稍后再试。") from e
    except json.JSONDecodeError as e:
        raise AIError("接口返回的不是有效的 JSON，请检查接口地址是否正确。") from e

    try:
        return data["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError) as e:
        raise AIError(f"接口返回格式不符合预期：{str(data)[:300]}") from e


def _chat_anthropic(cfg: dict, system: str, messages: list) -> str:
    try:
        import anthropic
    except ImportError as e:
        raise AIError("缺少 anthropic 库，请运行 pip install anthropic。") from e

    kwargs = {"api_key": cfg["api_key"], "timeout": float(TIMEOUT), "max_retries": 2}
    base_url = (cfg.get("base_url") or "").strip()
    if base_url:
        kwargs["base_url"] = base_url
    client = anthropic.Anthropic(**kwargs)

    params = {
        "model": cfg["model"],
        "max_tokens": 16000,
        "system": system,
        "messages": messages,
    }
    try:
        try:
            # 对话类场景用 low effort 就够了，响应更快也更省钱；
            # fallbacks="default"：模型拒答时由服务端自动换模型重试
            resp = client.beta.messages.create(
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
                output_config={"effort": "low"},
                **params,
            )
        except anthropic.BadRequestError:
            # 部分中转服务或旧模型不支持上面的参数，退回最基础的请求
            resp = client.messages.create(**params)
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
        raise AIError("网络连接失败，请检查网络或接口地址。") from e

    if resp.stop_reason == "refusal":
        raise AIError("模型拒绝回答这个请求，换个说法试试。")
    return "".join(block.text for block in resp.content if block.type == "text")


def _http_hint(code: int) -> str:
    return {
        400: "请求参数有误，请检查模型名称。",
        401: "API Key 无效，请检查后重新填写。",
        402: "账户余额不足。",
        403: "没有权限访问该模型。",
        404: "找不到接口或模型，请检查接口地址和模型名称。",
        429: "请求太频繁或额度不足，请稍后再试。",
    }.get(code, "接口返回错误。" if code < 500 else "AI 服务暂时不可用，请稍后再试。")
