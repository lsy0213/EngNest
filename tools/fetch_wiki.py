"""从简明英文维基百科（Simple English Wikipedia，CC BY-SA 4.0）抓一批精选文章，做成阅读页「维基百科」的离线数据。

    python tools/fetch_wiki.py

输出：web/data/wiki_index.js（文章列表，含标题、链接、协议）、web/data/wiki_text.js（正文，第一次打开时才加载）
每篇文章在阅读器里都会显示出处和协议。原始数据缓存在 tools/raw/wiki/。
"""

import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engnest import wiki  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "tools" / "raw" / "wiki"
OUT = ROOT / "web" / "data"
MIN_WORDS = 200

TOPICS = {
    "🐾 动物": ["Lion", "Elephant", "Giant panda", "Dolphin", "Penguin", "Honey bee", "Octopus", "Shark", "Eagle", "Wolf", "Tiger", "Whale", "Dog", "Cat"],
    "🌋 地球与自然": ["Volcano", "Earthquake", "Rain", "Cloud", "Rainforest", "Desert", "Ocean", "River", "Mountain", "Glacier", "Weather", "Climate change", "Tree", "Water"],
    "🪐 宇宙": ["Sun", "Moon", "Mars", "Jupiter", "Solar System", "Black hole", "Milky Way", "Star", "International Space Station", "Galaxy", "Comet", "Saturn"],
    "🫀 人体与健康": ["Heart", "Brain", "Sleep", "Blood", "Bone", "Vitamin", "Physical exercise", "Virus", "Bacteria", "Tooth", "Eye", "Skin"],
    "💻 科学技术": ["Computer", "Internet", "Smartphone", "Electricity", "Battery", "Robot", "Artificial intelligence", "Telephone", "Airplane", "Train", "Bicycle", "Camera"],
    "🏛️ 历史": ["Ancient Egypt", "Roman Empire", "Ancient Greece", "Industrial Revolution", "World War II", "Renaissance", "Vikings", "Olympic Games", "Great Wall of China", "Silk Road", "Titanic", "Middle Ages"],
    "🌍 国家和城市": ["China", "United Kingdom", "United States", "Japan", "Canada", "Australia", "France", "London", "New York City", "Paris", "India", "Egypt"],
    "👤 人物": ["Albert Einstein", "Isaac Newton", "Leonardo da Vinci", "William Shakespeare", "Marie Curie", "Charles Darwin", "Confucius",
               "Wolfgang Amadeus Mozart", "Abraham Lincoln", "Nelson Mandela", "Galileo Galilei", "Thomas Edison"],
    "🍞 饮食与生活": ["Bread", "Rice", "Coffee", "Tea", "Chocolate", "Pizza", "Cheese", "Football", "Basketball", "Chess", "Money", "Holiday"],
    "🎨 艺术与文化": ["Music", "Painting", "Theatre", "Movie", "Photography", "Dance", "Poetry", "Library", "Museum", "Language", "English language", "Christmas"],
}


def level(paras: list) -> str:
    text = " ".join(paras)
    sents = [s for s in re.split(r"(?<=[.!?])\s+", text) if s]
    avg = len(text.split()) / max(1, len(sents))
    return "较易" if avg < 14 else "中等" if avg < 20 else "较难"


def slug(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    RAW.mkdir(parents=True, exist_ok=True)
    index, texts, missing = [], {}, []
    for topic, titles in TOPICS.items():
        n = 0
        for t in titles:
            cache = RAW / f"{slug(t)}.json"
            if cache.exists():
                a = json.loads(cache.read_text(encoding="utf-8"))
            else:
                a = None
                for wait in (5, 20, 60, None):  # 维基百科会限流（429），等一会儿再试
                    try:
                        a = wiki.article(t)
                        cache.write_text(json.dumps(a, ensure_ascii=False), encoding="utf-8")  # 只缓存成功的结果
                        break
                    except OSError as e:
                        if wait is None:
                            print("  放弃", t, e)
                        else:
                            time.sleep(wait)
                time.sleep(1.5)
            words = sum(len(p.split()) for p in (a or {}).get("paras", []))
            if not a or words < MIN_WORDS:
                missing.append(t)
                continue
            sid = slug(a["title"])
            index.append({"id": sid, "title": a["title"], "topic": topic, "level": level(a["paras"]), "words": words,
                          "url": a["url"], "license": a["license"]})
            texts[sid] = a["paras"]
            n += 1
        print(f"{topic:10} {n:3} 篇")
    (OUT / "wiki_index.js").write_text(
        "// 自动生成，请勿手改：简明英文维基百科精选文章（CC BY-SA 4.0，出处见每篇的 url），由 tools/fetch_wiki.py 生成\n"
        "window.WIKI_INDEX = " + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    (OUT / "wiki_text.js").write_text(
        "// 自动生成，请勿手改：简明英文维基百科正文（CC BY-SA 4.0，作者见各页面的编辑历史），由 tools/fetch_wiki.py 生成\n"
        "window.WIKI_TEXT = " + json.dumps(texts, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"\n共 {len(index)} 篇，正文 {(OUT / 'wiki_text.js').stat().st_size / 1e6:.1f} MB" + (f"；太短或没找到：{missing}" if missing else ""))


if __name__ == "__main__":
    main()
