"""音素级发音评测：听出你每个音读成了什么（比如 think 的 /θ/ 读成了 /s/）。

- 音素识别：wav2vec2（XLS-R 300M，在 TIMIT 上微调的音素识别模型，Apache-2.0）的 ONNX 量化版 robg/speako-phoneme-recognizer，
  用 onnxruntime 在本机 CPU 上跑（faster-whisper 已经带了 onnxruntime，不用另装）。模型约 355 MB，在设置里下载，固定版本、核对 SHA256。
- 标准发音：CMU 发音词典（cmusphinx/cmudict，BSD 风格协议，美式发音），和模型的音素集一一对应。和模型一起下载，不放进安装包。
- 对齐：识别出的音素串和标准音素串做加权编辑距离（发音相近的音替换代价小），得到每个音读对了没有、读成了什么。
  美音里 t / d 在元音之间读成闪音 /ɾ/（water、better）算对；非重读元音读得含糊（/ə/、/ɪ/ 互换）只算半个错。
返回给前端的音素用模型的 IPA 写法（ɑ æ ə ɝ i ɪ u ʊ …）。
"""

import base64
import json
import logging
import threading

from . import net
from .paths import cache_dir

log = logging.getLogger(__name__)

REPO = "robg/speako-phoneme-recognizer"
REVISION = "ad0f63cd58fc1bb1e9c261a3b4135997a31c2e58"
HF = ["https://huggingface.co", "https://hf-mirror.com"]
CMU_URL = "https://raw.githubusercontent.com/cmusphinx/cmudict/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict"
# 本地文件名 → (下载地址列表, 大小, SHA256)
FILES = {
    "model_quantized.onnx": ([f"{h}/{REPO}/resolve/{REVISION}/onnx/model_quantized.onnx" for h in HF], 355216594,
                             "1e03fc69aa5be1f365a94ffa17c060feafdadb626b8a662b7ba6b36cb9f0577e"),
    "vocab.json": ([f"{h}/{REPO}/resolve/{REVISION}/vocab.json" for h in HF], 489,
                   "27effdfa8cbdf80db5405d8d4385d20addff5f63d5dee91e58347972b9b6d76d"),
    "cmudict.dict": (net.github_mirrors(CMU_URL), 3618488, "81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22"),
}
TOTAL = sum(size for _, size, _ in FILES.values())

# CMU 的 ARPAbet → 模型的音素（TIMIT 39 个音：AO 并进 ɑ，ZH 并进 ʃ，AH 不分重读都是 ə）
ARPA = {
    "AA": "ɑ", "AE": "æ", "AH": "ə", "AO": "ɑ", "AW": "aʊ", "AY": "aɪ", "B": "b", "CH": "ʧ", "D": "d", "DH": "ð", "EH": "ɛ", "ER": "ɝ",
    "EY": "eɪ", "F": "f", "G": "g", "HH": "h", "IH": "ɪ", "IY": "i", "JH": "ʤ", "K": "k", "L": "l", "M": "m", "N": "n", "NG": "ŋ",
    "OW": "oʊ", "OY": "ɔɪ", "P": "p", "R": "ɹ", "S": "s", "SH": "ʃ", "T": "t", "TH": "θ", "UH": "ʊ", "UW": "u", "V": "v", "W": "w",
    "Y": "j", "Z": "z", "ZH": "ʃ",
}
VOWELS = set("ɑ æ ə aʊ aɪ ɛ ɝ eɪ ɪ i oʊ ɔɪ ʊ u".split())
# 发音相近的音：互相替换的代价小一些（对齐更合理），但仍然算读错
NEAR = [
    {"i", "ɪ"}, {"u", "ʊ"}, {"ɛ", "æ"}, {"ɛ", "eɪ"}, {"æ", "ɑ"}, {"ɑ", "ə"}, {"ə", "ɪ"}, {"ə", "ʊ"}, {"oʊ", "ɑ"}, {"ɝ", "ə"},
    {"θ", "s"}, {"θ", "f"}, {"θ", "t"}, {"ð", "d"}, {"ð", "z"}, {"s", "z"}, {"s", "ʃ"}, {"ʧ", "ʃ"}, {"ʤ", "ʒ"}, {"ʧ", "ʤ"},
    {"v", "w"}, {"v", "f"}, {"v", "b"}, {"l", "ɹ"}, {"l", "n"}, {"n", "ŋ"}, {"p", "b"}, {"t", "d"}, {"k", "g"}, {"w", "ʊ"},
]
NEAR_SET = {frozenset(x) for x in NEAR}


def model_dir():
    return cache_dir("phoneme")


def sub_cost(a: str, b: str) -> float:
    if a == b:
        return 0.0
    if b == "ɾ" and a in ("t", "d"):
        return 0.0  # 美音闪音
    return 0.6 if frozenset((a, b)) in NEAR_SET else 1.0


def align(exp: list, rec: list):
    """加权编辑距离对齐。exp：[(音素, 第几个词, 是否非重读元音)]；rec：[音素]。
    返回 (总代价, ops)：ops 里每项是 ("ok"|"sub"|"del", 标准音索引, 识别音) 或 ("ins", 插在哪个标准音后面, 识别音)"""
    n, m = len(exp), len(rec)
    INF = float("inf")
    dp = [[INF] * (m + 1) for _ in range(n + 1)]
    bt = [[None] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = 0.0
    for i in range(n + 1):
        for j in range(m + 1):
            c = dp[i][j]
            if c == INF:
                continue
            if i < n and j < m:
                s = c + sub_cost(exp[i][0], rec[j])
                if s < dp[i + 1][j + 1]:
                    dp[i + 1][j + 1], bt[i + 1][j + 1] = s, "m"
            if i < n and c + 1 < dp[i + 1][j]:
                dp[i + 1][j], bt[i + 1][j] = c + 1, "d"
            if j < m and c + 1 < dp[i][j + 1]:
                dp[i][j + 1], bt[i][j + 1] = c + 1, "i"
    ops, i, j = [], n, m
    while i > 0 or j > 0:
        t = bt[i][j]
        if t == "m":
            i, j = i - 1, j - 1
            ops.append(("ok" if sub_cost(exp[i][0], rec[j]) == 0 else "sub", i, rec[j]))
        elif t == "d":
            i -= 1
            ops.append(("del", i, ""))
        else:
            j -= 1
            ops.append(("ins", i - 1, rec[j]))
    ops.reverse()
    return dp[n][m], ops


class Phoneme:
    def __init__(self):
        self._sess = None
        self._vocab = None
        self._cmu = None
        self._lock = threading.Lock()
        self.task = {"running": False, "progress": 0.0, "error": "", "stage": ""}

    def ready(self) -> bool:
        return all((model_dir() / f).exists() for f in FILES)

    def available(self) -> bool:
        try:
            import numpy  # noqa: F401
            import onnxruntime  # noqa: F401
            return True
        except Exception:  # noqa: BLE001
            return False

    def status(self) -> dict:
        return {"available": self.available(), "model": self.ready(), "size_mb": round(TOTAL / 1e6), **self.task}

    def download(self) -> bool:
        if self.task["running"]:
            return False
        self.task = {"running": True, "progress": 0.0, "error": "", "stage": "download"}
        threading.Thread(target=self._download, daemon=True, name="phoneme-download").start()
        return True

    def _download(self):
        done = 0
        try:
            for name, (urls, size, sha) in FILES.items():
                net.download(urls, model_dir() / name, sha256=sha, size=size,
                             progress=lambda got, _t, base=done: self.task.update(progress=(base + got) / TOTAL))
                done += size
            self.task.update(running=False, progress=1.0, stage="done")
        except Exception as e:  # noqa: BLE001
            self.task.update(running=False, stage="error", error=str(e))

    def remove(self) -> bool:
        with self._lock:
            self._sess = None
        for f in FILES:
            (model_dir() / f).unlink(missing_ok=True)
        return True

    # ---------- 词典 ----------
    def cmu(self) -> dict:
        if self._cmu is None:
            d = {}
            with open(model_dir() / "cmudict.dict", encoding="utf-8") as f:
                for line in f:
                    parts = line.split("#")[0].split()
                    if len(parts) < 2:
                        continue
                    w = parts[0].split("(")[0].lower()
                    phones = []
                    for p in parts[1:]:
                        base, stress = p.rstrip("012"), p[-1] if p[-1] in "012" else ""
                        if base in ARPA:
                            phones.append((ARPA[base], stress == "0"))
                    d.setdefault(w, []).append(phones)
            self._cmu = d
        return self._cmu

    def lookup(self, word: str) -> list:
        w = word.lower().strip("'’.,!?;:\"()")
        return self.cmu().get(w.replace("’", "'"), [])

    # ---------- 识别 ----------
    def _session(self):
        if self._sess is None:
            import onnxruntime as ort

            opts = ort.SessionOptions()
            opts.intra_op_num_threads = 4
            self._sess = ort.InferenceSession(str(model_dir() / "model_quantized.onnx"), opts, providers=["CPUExecutionProvider"])
            vocab = json.loads((model_dir() / "vocab.json").read_text(encoding="utf-8"))
            self._vocab = {i: p for p, i in vocab.items()}
        return self._sess

    def recognize(self, audio) -> list:
        """16 kHz 单声道 float32 → [(音素, 把握 0~1)]（贪心 CTC 解码，去掉空白和词边界）"""
        import numpy as np

        x = (audio - audio.mean()) / np.sqrt(audio.var() + 1e-7)
        sess = self._session()
        feeds = {}
        for inp in sess.get_inputs():
            feeds[inp.name] = x[None, :].astype(np.float32) if inp.name != "attention_mask" else np.ones((1, x.size), dtype=np.int64)
        logits = sess.run(None, feeds)[0][0]
        logits = logits - logits.max(axis=1, keepdims=True)
        probs = np.exp(logits)
        probs /= probs.sum(axis=1, keepdims=True)
        ids = probs.argmax(axis=1)
        out, prev = [], -1
        for t, k in enumerate(ids):
            k = int(k)
            if k != prev:
                p = self._vocab.get(k, "")
                if p and not p.startswith("[") and p not in ("|", " "):
                    out.append([p, float(probs[t, k]), 1])
            elif out and self._vocab.get(k) == out[-1][0]:
                out[-1][1] += float(probs[t, k])
                out[-1][2] += 1
            prev = k
        return [(p, round(s / n, 3)) for p, s, n in out]

    def assess(self, pcm_b64: str, text: str) -> dict:
        if not self.available():
            return {"ok": False, "error": "这个版本没有带音素评测需要的组件"}
        if not self.ready():
            return {"ok": False, "error": "还没有下载发音评测模型，请先到「设置」里下载"}
        import numpy as np

        audio = np.frombuffer(base64.b64decode(pcm_b64), dtype=np.int16).astype(np.float32) / 32768.0
        if audio.size < 16000 * 0.3:
            return {"ok": False, "error": "录音太短了"}
        with self._lock:
            rec = self.recognize(audio)
        return score(self, text, [p for p, _ in rec])


def score(ph, text: str, rec: list) -> dict:
    """标准发音和识别出的音素对齐打分。ph 要有 lookup(word)；词典里没有的词不打分"""
    import re

    words = re.findall(r"[A-Za-z][A-Za-z'’-]*", text or "")
    variants = [ph.lookup(w) for w in words]
    choice = [0] * len(words)

    def build():
        exp = []
        for wi, vs in enumerate(variants):
            if vs:
                exp += [(p, wi, unstressed and p in VOWELS) for p, unstressed in vs[choice[wi]]]
        return exp

    best, _ = align(build(), rec)
    # 一个词有几种读法（the 读 /ðə/ 或 /ði/）：挑和实际读的最接近的那种
    for wi, vs in enumerate(variants):
        for k in range(1, len(vs)):
            old = choice[wi]
            choice[wi] = k
            c, _ = align(build(), rec)
            if c < best:
                best = c
            else:
                choice[wi] = old
    exp = build()
    _, ops = align(exp, rec)
    res = [{"w": w, "known": bool(variants[i]), "phones": [], "inserted": []} for i, w in enumerate(words)]
    for op, i, r in ops:
        if op == "ins":
            if i >= 0:
                res[exp[i][1]]["inserted"].append(r)
            continue
        p, wi, weak = exp[i]
        res[wi]["phones"].append({"p": p, "ok": op == "ok", "heard": r if op == "sub" else "" if op == "del" else r, "weak": weak, "del": op == "del"})
    # 成音节辅音：people /ˈpiːpl/、button /ˈbʌtn/ 里非重读的 /ə/ 本来就几乎不发，没读出来不算错
    for w in res:
        ps = w["phones"]
        for k, x in enumerate(ps):
            if x["del"] and x["weak"] and x["p"] == "ə" and k + 1 < len(ps) and ps[k + 1]["p"] in ("l", "n", "m"):
                x["ok"], x["del"] = True, False
    total = got = 0.0
    for w in res:
        if not w["known"] or not w["phones"]:
            w["score"] = None
            continue
        wt = sum(0.5 if x["weak"] else 1.0 for x in w["phones"])
        ok = sum((0.5 if x["weak"] else 1.0) for x in w["phones"] if x["ok"])
        # 非重读元音读成相近的音只扣一半
        ok += sum(0.25 for x in w["phones"] if not x["ok"] and x["weak"] and x["heard"] and frozenset((x["p"], x["heard"])) in NEAR_SET)
        pen = 0.5 * len(w["inserted"])  # 多读出来的音（辅音后面加「呃」）
        w["score"] = max(0, round(100 * (ok - pen) / wt)) if wt else None
        total += wt
        got += max(0.0, ok - pen)
    # 错得最多的几种（标准音 → 读成了什么）
    issues = {}
    for w in res:
        for x in w["phones"]:
            if x["ok"] or x["weak"]:
                continue
            k = (x["p"], x["heard"] or "")
            issues.setdefault(k, []).append(w["w"])
        for r in w["inserted"]:
            issues.setdefault(("", r), []).append(w["w"])
    top = sorted(issues.items(), key=lambda kv: -len(kv[1]))[:4]
    return {
        "ok": True, "heard": " ".join(rec), "score": round(100 * got / total) if total else None, "words": res,
        "issues": [{"p": p, "heard": h, "words": sorted(set(ws))} for (p, h), ws in top],
    }
