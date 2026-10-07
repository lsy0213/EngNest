"""给长篇读物配插图（只用公有领域或自由授权的图片），每篇一张或几张。

- 原著全文：从插图版电子书（Project Gutenberg 的 HTML 版）里取原版插画，按插画在原书中的位置放进对应的章节和段落。
  只用 1929 年以前出版、插画家去世 50 年以上的版本（中国按作者去世后 50 年计算，美国按出版年份）。
- 维基百科：文章自己用到的图片，逐张检查授权（公有领域 / CC0 / CC BY / CC BY-SA）。
- VOA：VOA 自己的配图多来自通讯社，不能用；按标题在 Wikimedia Commons 搜一张授权合格的图片。

    python tools/fetch_illustrations.py [books|wiki|voa]   # 不带参数就全做

输出：web/img/docs/*.jpg，web/data/doc_images.js
    window.DOC_IMAGES = { 读物 id: [{src, cap 图片说明, credit 作者和授权, ch 第几章, p 放在第几段之前}] }
下载的网页和图片缓存在 tools/raw/illus/，可以反复运行。
"""

import html
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "tools" / "raw" / "illus"
IMG = ROOT / "web" / "img" / "docs"
OUT = ROOT / "web" / "data" / "doc_images.js"
UA = "EngNest/0.3 (personal English-learning desktop app; educational use)"
WIKI_API = "https://simple.wikipedia.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
OK_LICENSES = re.compile(r"^(public domain|pd|cc0|cc by(-sa)? ?\d|cc-by(-sa)?-\d)", re.I)
MAX_BOOK = 14     # 每本书最多几张插图（每章最多一张）
MAX_WIKI = 2      # 每篇维基文章最多几张
WIDTH = 640       # 图片最大宽度

# 书 id → 插图版电子书的编号和插画家。没列出的书只有封面（见 reading_images.js）
BOOK_SOURCES = {
    "alice": (19033, "John Tenniel"), "oz": (43936, "W. W. Denslow"), "peterpan": (26654, "F. D. Bedford"),
    "carol": (24022, "Arthur Rackham"), "justso": (32488, "Rudyard Kipling"), "heidi": (20781, "Maria L. Kirk"),
    "littlewomen": (37106, "Frank T. Merrill"), "happyprince": (902, "Walter Crane & Jacomb Hood"),
    "tomsawyer": (74, "True W. Williams"), "treasure": (120, "Louis Rhead"), "pride": (1342, "Hugh Thomson"),
    "janeeyre": (1260, "F. H. Townsend"), "aesop": (19994, "Milo Winter"), "jungle": (236, "J. L. Kipling & others"),
    "memoirs": (834, "Sidney Paget"), "seas": (164, "Alphonse de Neuville & Édouard Riou"), "journey": (18857, "Édouard Riou"),
    "dracula": (345, ""), "kidnapped": (421, "Louis Rhead"), "huckfinn": (76, "E. W. Kemble"),
    "twocities": (98, "Hablot K. Browne (Phiz)"), "greatexp": (1400, "Marcus Stone"),
}
STOP = set("a an the and or but of to in on at for with from by is are was were be how what why who when where which "
           "part one two three four new your you we our it its this that these those do does did can will".split())


def get(url: str, cache: Path, binary: bool = False):
    if cache.exists():
        return cache.read_bytes() if binary else cache.read_text(encoding="utf-8")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for wait in (5, 20, 60, None):  # 维基媒体会限流（429），等一会儿再试
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            break
        except OSError as e:
            if wait is None or (getattr(e, "code", 429) not in (429, 500, 502, 503, 504) and not isinstance(e, TimeoutError)):
                print("   下载失败", url[:90], e)
                return None
            time.sleep(wait)
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_bytes(data)
    time.sleep(0.6)
    return data if binary else data.decode("utf-8", "replace")


def api(base: str, params: dict, cache: Path) -> dict:
    url = base + "?" + urllib.parse.urlencode({**params, "format": "json", "formatversion": "2"})
    text = get(url, cache)
    return json.loads(text) if text else {}


def save_jpg(data: bytes, name: str, min_side: int = 260):
    """缩小并存成 jpg；太小的（装饰花纹、首字母）返回 None"""
    try:
        im = Image.open(io.BytesIO(data))
        im.load()
    except Exception:  # noqa: BLE001 — 坏图直接跳过
        return None
    if min(im.size) < min_side or im.size[0] * im.size[1] < 90_000:
        return None
    if im.mode not in ("RGB", "L"):
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=im.convert("RGBA").split()[-1])
        im = bg
    if im.size[0] > WIDTH:
        im = im.resize((WIDTH, round(im.size[1] * WIDTH / im.size[0])), Image.LANCZOS)
    IMG.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(IMG / f"{name}.jpg", "JPEG", quality=72, optimize=True, progressive=True)
    return f"img/docs/{name}.jpg"


def text_of(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


# ---------- 原著全文 ----------
def book_paragraph_index(bid: str) -> list:
    """[(章, 段, 这一段开始时的累计词数), ...]"""
    t = (ROOT / "web" / "data" / "books" / f"{bid}.js").read_text(encoding="utf-8")
    chapters = json.loads(t[t.index("] = ") + 4:].strip().rstrip(";"))  # (window.BOOK_TEXT = …)["id"] = [...]
    out, total = [], 0
    for ci, (_, paras) in enumerate(chapters, 1):
        for pi, p in enumerate(paras):
            out.append((ci, pi, total))
            total += len(p.split())
    return out, total


def book_images(bid: str, pg: int, artist: str) -> list:
    page = get(f"https://www.gutenberg.org/cache/epub/{pg}/pg{pg}-images.html", RAW / "books" / f"{pg}.html")
    if not page:
        return []
    start = page.find("*** START OF")
    end = page.find("*** END OF")
    body = page[start if start > 0 else 0:end if end > 0 else len(page)]
    # 按原文顺序找出每张图，以及它前面有多少个词
    cands, words, last = [], 0, 0
    for m in re.finditer(r"<img\b[^>]*>", body, re.I):
        words += len(text_of(body[last:m.start()]).split())
        last = m.end()
        src = re.search(r'src="([^"]+)"', m.group(0))
        alt = re.search(r'alt="([^"]*)"', m.group(0))
        if not src or re.search(r"cover|title|dec|init|drop|orn|tail|head|logo", src.group(1), re.I):
            continue
        # 图片说明：alt，或者紧跟在图后面的 caption 段落
        cap = text_of(alt.group(1)) if alt else ""
        after = re.match(r"\s*(?:</a>)?\s*(?:</div>)?\s*<(?:p|div|span)[^>]*class=\"[^\"]*cap[^\"]*\"[^>]*>(.*?)</(?:p|div|span)>", body[m.end():m.end() + 800], re.S | re.I)
        if after and len(text_of(after.group(1))) > len(cap):
            cap = text_of(after.group(1))
        cands.append((words, src.group(1), cap[:90]))
    total_html = words + len(text_of(body[last:]).split())
    if not cands or total_html < 1000:
        return []
    index, total = book_paragraph_index(bid)
    # 按位置均匀挑候选，再按图片大小过滤；每章最多一张
    step = max(1, len(cands) // (MAX_BOOK * 3))
    picked, used_ch = [], set()
    for k, (pos, src, cap) in enumerate(cands[::step]):
        target = pos / total_html * total
        ch, p, _ = max((x for x in index if x[2] <= target), key=lambda x: x[2], default=index[0])
        if ch in used_ch or len(picked) >= MAX_BOOK:
            continue
        url = urllib.parse.urljoin(f"https://www.gutenberg.org/cache/epub/{pg}/", src)
        data = get(url, RAW / "books" / f"{pg}-{Path(src).name}", binary=True)
        path = data and save_jpg(data, f"{bid}-{len(picked) + 1:02d}")
        if not path:
            continue
        used_ch.add(ch)
        picked.append({"src": path, "cap": cap, "credit": f"原版插画{(' · ' + artist) if artist else ''} · 公有领域", "ch": ch, "p": p})
    return picked


# ---------- 维基百科 ----------
def file_info(titles: list, cache_key: str) -> dict:
    """{文件名: {url, ok, credit}}"""
    res = api(WIKI_API, {"action": "query", "titles": "|".join(titles), "prop": "imageinfo",
                         "iiprop": "url|extmetadata|size|mime", "iiurlwidth": WIDTH}, RAW / "wiki" / f"{cache_key}-info.json")
    out = {}
    for p in res.get("query", {}).get("pages", []):
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        lic = text_of(meta.get("LicenseShortName", {}).get("value", ""))
        artist = text_of(meta.get("Artist", {}).get("value", ""))[:60]
        out[p["title"]] = {
            "url": info.get("thumburl") or info.get("url"),
            "ok": info.get("mime") in ("image/jpeg", "image/png") and info.get("width", 0) >= 500 and bool(OK_LICENSES.match(lic)),
            "credit": f"{artist + ' · ' if artist else ''}{lic} · Wikimedia Commons",
        }
    return out


def wiki_images(art: dict, paras: list) -> list:
    slug = art["id"]
    res = api(WIKI_API, {"action": "query", "titles": art["title"], "prop": "images|pageimages", "imlimit": 30, "piprop": "name"},
              RAW / "wiki" / f"{slug}.json")
    page = (res.get("query", {}).get("pages") or [{}])[0]
    files = [i["title"] for i in page.get("images", []) if re.search(r"\.(jpe?g|png)$", i["title"], re.I)
             and not re.search(r"icon|logo|flag|symbol|map|locator|coat|seal|signature", i["title"], re.I)]
    lead = page.get("pageimage")
    if lead and f"File:{lead}" in files:
        files.remove(f"File:{lead}")
        files.insert(0, f"File:{lead}")
    if not files:
        return []
    info = file_info(files[:12], slug)
    out = []
    for f in files[:12]:
        i = info.get(f)
        if not i or not i["ok"] or len(out) >= MAX_WIKI:
            continue
        data = get(i["url"], RAW / "wiki" / "img" / re.sub(r"[^\w.-]", "_", f), binary=True)
        path = data and save_jpg(data, f"wiki-{slug}-{len(out) + 1}", 200)
        if path:
            # 第一张放在开头，第二张放在文章中间的小标题前后
            p = 0 if not out else max(1, len(paras) // 2)
            out.append({"src": path, "cap": re.sub(r"^File:|\.\w+$", "", f).replace("_", " ")[:80], "credit": i["credit"], "ch": 1, "p": p})
    return out


# ---------- VOA ----------
# 按标题搜 Commons 的图经常文不对题（比如成语类文章），只留和标题真正相关的：
# 文件名和标题至少有两个实词相同，或者有一个专有名词（正文里从来不小写的词）相同
GENERIC = set(("english learn learning words word using use make makes good better more most many first time people american america "
               "world study says said year years help helps ways way story thing things about have know five short another person human "
               "technology report stories show shows ever very after before").split())
OFF_TOPIC = re.compile(r"president|sworn|flag|military|army|navy|soldier|platoon|war\b|warfare|protest|police|cheerleader|dvids|afghan|"
                       r"airman|marine|nara|ddt|billboard|Blue Hotel, Taipei|Bellegarde|Mount Feathertop|Milkovich|Sayedur|Mina Miller|Rheinland", re.I)


def voa_relevant(title: str, body: str, file_title: str) -> bool:
    def kw(s):
        return {w.lower().rstrip("s") for w in re.findall(r"[A-Za-z]{4,}", s)} - STOP - GENERIC
    common = kw(title) & kw(file_title)
    proper = {w.lower().rstrip("s") for w in re.findall(r"[A-Za-z]+", title)
              if w[0].isupper() and len(w) >= 4 and w in body and not re.search(r"\b" + w.lower() + r"\b", body)} - GENERIC
    return (len(common) >= 2 or bool(common & proper)) and not OFF_TOPIC.search(file_title)


def voa_image(a: dict, body: str) -> list:
    words = [w for w in re.findall(r"[A-Za-z][A-Za-z'-]+", a["title"]) if w.lower() not in STOP and len(w) > 2]
    if not words:
        return []
    query = " ".join(words[:4])
    res = api(COMMONS_API, {"action": "query", "generator": "search", "gsrsearch": f"{query} filetype:bitmap", "gsrnamespace": 6,
                            "gsrlimit": 8, "prop": "imageinfo", "iiprop": "url|extmetadata|size|mime", "iiurlwidth": WIDTH},
              RAW / "voa" / f"{a['id']}.json")
    pages = sorted(res.get("query", {}).get("pages", []), key=lambda p: p.get("index", 0))
    for p in pages:
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        lic = text_of(meta.get("LicenseShortName", {}).get("value", ""))
        if not (info.get("mime") in ("image/jpeg", "image/png") and info.get("width", 0) >= 600 and OK_LICENSES.match(lic)):
            continue
        if not voa_relevant(a["title"], body, p["title"][5:]):
            return []
        data = get(info.get("thumburl") or info["url"], RAW / "voa" / "img" / f"{a['id']}.bin", binary=True)
        path = data and save_jpg(data, f"voa-{a['id']}")
        if path:
            artist = text_of(meta.get("Artist", {}).get("value", ""))[:60]
            return [{"src": path, "cap": "", "credit": f"{artist + ' · ' if artist else ''}{lic} · Wikimedia Commons", "ch": 1, "p": 0}]
    return []


# ---------- 场景口语卡片 ----------
SCENE_QUERIES = {
    "iv-intro": "job interview office", "iv-project": "business presentation meeting", "iv-salary": "handshake business office",
    "iv-phone": "woman talking on phone office", "iv-strength": "job interview candidate", "iv-questions": "interview conversation desk",
    "tr-ticket": "railway station ticket office", "tr-hotel": "hotel reception desk", "tr-delay": "airport departure board delayed",
    "tr-customs": "passport control airport", "tr-directions": "tourist map street London", "tr-carrental": "car rental counter",
    "fd-coffee": "barista coffee shop counter", "fd-return": "clothing store shirts", "fd-allergy": "restaurant waiter table",
    "fd-supermarket": "supermarket aisle", "fd-cake": "bakery birthday cake", "fd-refund": "call center headset",
    "wk-ask": "office colleagues computer", "wk-update": "team meeting office", "wk-leave": "manager office desk",
    "wk-meeting": "meeting room whiteboard", "wk-complaint": "customer service desk", "wk-firstday": "office reception lobby",
    "so-neighbor": "apartment building hallway", "so-party": "birthday party friends", "so-weekend": "friends walking park",
    "so-comfort": "friends talking cafe", "so-exchange": "language exchange meetup", "so-food": "chinese food dishes table",
    "he-cold": "doctor patient consultation", "he-pharmacy": "pharmacy counter", "he-dentist": "dental clinic",
    "he-gym": "gym fitness equipment", "he-allergy": "nurse clinic", "he-results": "doctor medical results",
    "ca-professor": "professor office university", "ca-library": "university library", "ca-advisor": "university campus students",
    "ca-group": "students group study table", "ca-visa": "embassy building", "ca-ielts": "exam room desks",
    "sv-bank": "bank counter", "sv-post": "post office counter", "sv-haircut": "hair salon",
    "sv-phone": "smartphone repair", "sv-sim": "mobile phone shop", "sv-laundry": "dry cleaner shop",
    "ho-viewing": "apartment living room interior", "ho-repair": "radiator heating", "ho-roommate": "shared kitchen apartment",
    "ho-noise": "apartment door hallway", "ho-moving": "moving boxes", "ho-deposit": "apartment keys",
    "em-wallet": "police station", "em-lost": "city street night", "em-room": "hotel room",
    "em-missed": "airport check-in counter", "em-breakdown": "car breakdown road", "em-child": "shopping mall interior",
}
SCENE_OUT = ROOT / "web" / "data" / "scene_images.js"


def scene_images():
    result = {}
    for sid, query in SCENE_QUERIES.items():
        res = api(COMMONS_API, {"action": "query", "generator": "search", "gsrsearch": f"{query} filetype:bitmap", "gsrnamespace": 6,
                                "gsrlimit": 10, "prop": "imageinfo", "iiprop": "url|extmetadata|size|mime", "iiurlwidth": 480},
                  RAW / "scenes" / f"{sid}.json")
        for p in sorted(res.get("query", {}).get("pages", []), key=lambda p: p.get("index", 0)):
            info = (p.get("imageinfo") or [{}])[0]
            meta = info.get("extmetadata", {})
            lic = text_of(meta.get("LicenseShortName", {}).get("value", ""))
            if not (info.get("mime") in ("image/jpeg", "image/png") and info.get("width", 0) >= 600 and OK_LICENSES.match(lic)):
                continue
            data = get(info.get("thumburl") or info["url"], RAW / "scenes" / "img" / f"{sid}.bin", binary=True)
            path = data and save_jpg(data, f"scene-{sid}")
            if path:
                artist = text_of(meta.get("Artist", {}).get("value", ""))[:60]
                result[sid] = {"src": path, "credit": f"{artist + ' · ' if artist else ''}{lic} · Wikimedia Commons"}
                break
    SCENE_OUT.write_text("// 自动生成，请勿手改：场景口语卡片图片（Wikimedia Commons，公有领域或 CC 授权），由 tools/fetch_illustrations.py scenes 生成\n"
                         "window.SCENE_IMAGES = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"场景口语：{len(result)} / {len(SCENE_QUERIES)} 个场景有图片")


def load_js(name: str, var: str):
    t = (ROOT / "web" / "data" / name).read_text(encoding="utf-8")
    return json.loads(t[t.index(f"window.{var} = ") + len(f"window.{var} = "):].strip().rstrip(";"))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    which = sys.argv[1:] or ["books", "wiki", "voa", "scenes"]
    if "scenes" in which:
        scene_images()
        which = [w for w in which if w != "scenes"]
        if not which:
            return
    result = load_js("doc_images.js", "DOC_IMAGES") if OUT.exists() else {}
    if "books" in which:
        for bid, (pg, artist) in BOOK_SOURCES.items():
            imgs = book_images(bid, pg, artist)
            if imgs:
                result[bid] = imgs
            print(f"书 {bid:12} {len(imgs):2} 张")
    if "wiki" in which:
        index, texts = load_js("wiki_index.js", "WIKI_INDEX"), load_js("wiki_text.js", "WIKI_TEXT")
        n = 0
        for a in index:
            imgs = wiki_images(a, texts[a["id"]])
            if imgs:
                result[f"wiki-{a['id']}"] = imgs
                n += 1
        print(f"维基百科：{n} / {len(index)} 篇有配图")
    if "voa" in which:
        index, texts = load_js("voa_index.js", "VOA_INDEX"), load_js("voa_text.js", "VOA_TEXT")
        n = 0
        for a in index:
            result.pop(f"voa-{a['id']}", None)
            imgs = voa_image(a, " ".join(texts.get(str(a["id"]), {}).get("paras", [])))
            if imgs:
                result[f"voa-{a['id']}"] = imgs
                n += 1
        print(f"VOA：{n} / {len(index)} 篇有配图")
    OUT.write_text("// 自动生成，请勿手改：长篇读物的插图（公有领域或自由授权，作者和授权见 credit），由 tools/fetch_illustrations.py 生成\n"
                   "window.DOC_IMAGES = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    total = sum(f.stat().st_size for f in IMG.glob("*.jpg")) / 1e6 if IMG.exists() else 0
    print(f"\n共 {sum(len(v) for v in result.values())} 张插图，{len(result)} 篇读物，图片 {total:.1f} MB")


if __name__ == "__main__":
    main()
