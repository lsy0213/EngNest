"""从 VOA Learning English（美国之音慢速英语）的存档里抓一批文章，做成阅读页「VOA 慢速英语」的离线数据。

VOA 自己制作的文字属于美国政府作品，是公有领域（https://learningenglish.voanews.com）。
只取正文文字和文末的「Words in This Story」词汇表，不下载图片（图片常来自通讯社，不是公有领域）；
音频只保存 VOA 的链接，联网时可以在线播放。VOA Learning English 在 2025 年 3 月前后停止更新，这里抓的是存档。
和音乐有关的文章跳过，因为可能引用受版权保护的歌词。

    python tools/fetch_voa.py

输出：web/data/voa_index.js（文章列表）、web/data/voa_text.js（正文，第一次打开 VOA 文章时才加载）
原始网页缓存在 tools/raw/voa/。
"""

import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "tools" / "raw" / "voa"
OUT = ROOT / "web" / "data"
SITE = "https://learningenglish.voanews.com"
UA = "EngNest/0.3 (personal English-learning desktop app; educational use)"
PAGES = 4  # 每个栏目抓几页（每页 12 篇）
SECTIONS = [  # (栏目 id, 中文名)
    (3521, "新闻 As It Is"),
    (1579, "科技"),
    (955, "健康与生活"),
    (986, "文化艺术"),
    (1581, "美国故事"),
    (987, "词汇故事"),
    (7468, "学习方法"),
]
MUSIC = re.compile(r"\b(lyrics?|songs?|album|singer|sings|sang|rapper|band)\b", re.I)
STOP_PARAS = ("We want to hear from you", "_____")
END_MARKS = ("Share", "See comments", "Follow us", "Print", "")


def get(url: str, cache: Path) -> str:
    if cache.exists():
        return cache.read_text(encoding="utf-8")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for wait in (3, 10, 30, None):  # 网络偶尔会断，重试几次
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                text = r.read().decode("utf-8", "replace")
            break
        except OSError as e:
            if wait is None:
                print("  放弃", url, e)
                return ""
            time.sleep(wait)
    cache.write_text(text, encoding="utf-8")
    time.sleep(0.5)  # 别给对方服务器太大压力
    return text


def text_of(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def parse(page: str) -> dict:
    title = text_of((re.search(r"<h1[^>]*>(.*?)</h1>", page, re.S) or re.search(r"<title>(.*?)</title>", page, re.S)).group(1))
    date = (re.search(r'<time[^>]*datetime="([0-9-]{10})', page) or [None, ""])[1]
    audio = (re.search(r'(https://[^"\s]+\.mp3)', page) or [None, ""])[1]
    start = page.find('id="article-content"')
    if start < 0:
        return {}
    region = page[start:]
    paras, glossary, state = [], [], "body"
    for tag, inner in re.findall(r"<(h2|h3|p)[^>]*>(.*?)</\1>", region, re.S):
        t = text_of(inner)
        if tag in ("h2", "h3"):
            if t.startswith("Words in This Story"):
                state = "glossary"
            elif state == "body" and not t.startswith("Quiz") and t not in ("Related", "Forum") and len(t) < 80:
                paras.append(t)  # 正文里的小标题
            else:
                state = "done" if state != "body" or t in ("Related", "Forum") else "skip"
            if t in ("Related", "Forum"):
                break
            continue
        if state == "body":
            if t.startswith(STOP_PARAS):
                state = "skip"
            elif t and t not in END_MARKS and not t.startswith("No media source"):
                paras.append(t)
        elif state == "glossary":
            if t in END_MARKS:
                state = "done"
                continue
            m = re.match(r"^(.+?)\s+[–—-]\s+(.+)$", t)
            if m:
                glossary.append([m.group(1).strip(), m.group(2).strip()])
    return {"title": title, "date": date, "audio": audio, "paras": paras, "glossary": glossary}


def level(paras: list) -> str:
    """按平均句长粗略分难度"""
    text = " ".join(paras)
    sents = [s for s in re.split(r"(?<=[.!?])\s+", text) if s]
    avg = len(text.split()) / max(1, len(sents))
    return "较易" if avg < 14 else "中等" if avg < 20 else "较难"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    RAW.mkdir(parents=True, exist_ok=True)
    index, texts, seen, skipped = [], {}, set(), {"short": 0, "music": 0}
    for zid, zname in SECTIONS:
        links = []
        for p in range(PAGES):
            page = get(f"{SITE}/z/{zid}" + (f"?p={p}" if p else ""), RAW / f"z{zid}-{p}.html")
            for href in re.findall(r'href="(/a/[^"]+/(\d+)\.html)"', page):
                if href[1] not in seen and href not in links:
                    links.append(href)
        n = 0
        for href, aid in links:
            if aid in seen:
                continue
            seen.add(aid)
            a = parse(get(SITE + href, RAW / f"a{aid}.html"))
            words = sum(len(p.split()) for p in a.get("paras", []))
            if words < 250 or len(a["paras"]) < 5:
                skipped["short"] += 1
                continue
            if len(MUSIC.findall(a["title"] + " " + " ".join(a["paras"]))) >= 2:
                skipped["music"] += 1
                continue
            index.append({"id": aid, "title": a["title"], "date": a["date"], "section": zname, "level": level(a["paras"]),
                          "words": words, "audio": a["audio"], "url": SITE + href, "glossary": len(a["glossary"])})
            texts[aid] = {"paras": a["paras"], "glossary": a["glossary"]}
            n += 1
        print(f"{zname:12} {n:3} 篇（候选 {len(links)}）")
    index.sort(key=lambda x: x["date"], reverse=True)
    (OUT / "voa_index.js").write_text(
        "// 自动生成，请勿手改：VOA Learning English 存档文章列表（公有领域），由 tools/fetch_voa.py 生成\n"
        "window.VOA_INDEX = " + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    (OUT / "voa_text.js").write_text(
        "// 自动生成，请勿手改：VOA Learning English 正文（公有领域），由 tools/fetch_voa.py 生成\n"
        "window.VOA_TEXT = " + json.dumps(texts, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    size = (OUT / "voa_text.js").stat().st_size / 1e6
    print(f"\n共 {len(index)} 篇，正文 {size:.1f} MB；跳过：太短或只有视频 {skipped['short']} 篇，和音乐有关 {skipped['music']} 篇")


if __name__ == "__main__":
    main()
