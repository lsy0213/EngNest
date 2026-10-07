"""从 Wikimedia Commons 给阅读文章配图（只用公有领域 / CC0 / CC BY / CC BY-SA 授权的图片）。

    python tools/fetch_images.py search     # 搜索候选图片，自动选出第一张合格的，写入 tools/image_choices.json
    python tools/fetch_images.py download   # 按 image_choices.json 下载并压缩图片，生成 web/data/reading_images.js

可以手动编辑 image_choices.json 里的 file（Commons 文件名）来换图，再运行 download。
"""

import io
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CHOICES = ROOT / "tools" / "image_choices.json"
IMG_DIR = ROOT / "web" / "img" / "reading"
OUT_JS = ROOT / "web" / "data" / "reading_images.js"
API = "https://commons.wikimedia.org/w/api.php"
UA = "EngNest/0.2 (personal English-learning desktop app; educational use)"
THUMB_W = 960  # 用 Wikimedia 的标准缩略图宽度，非标准宽度会被限流（HTTP 429）
OK_LICENSES = re.compile(r"^(public domain|pd|cc0|cc by(-sa)? ?\d|cc-by(-sa)?-\d)", re.I)

# 原有 6 篇文章没有 imgQuery 字段，在这里补上
BASE_QUERIES = {
    "morning": "breakfast eggs fruit coffee",
    "language": "library books reading room",
    "sleep": "sleeping cat bed",
    "wfh": "laptop home office desk",
    "plastic": "plastic bottles beach pollution",
    "ai": "robot hand humanoid",
    # 原著全文书架里新增的书（原来的 8 本和名著简读共用配图）
    "oz": "Wonderful Wizard of Oz Denslow",
    "happyprince": "Happy Prince Oscar Wilde illustration",
    "peterpan": "Peter Pan Bedford illustration",
    "callwild": "Call of the Wild Goodwin Bull 1903",
    "secretgarden": "Secret Garden 1911 illustration",
    "jekyll": "Jekyll and Hyde 1880s poster",
    "tomsawyer": "Tom Sawyer True Williams illustration",
    "treasure": "Treasure Island map Stevenson",
    "anne": "Anne of Green Gables 1908 cover",
    "littlewomen": "Little Women 1868 illustration",
    "eighty": "Around the World in Eighty Days illustration",
    "gatsby": "The Great Gatsby 1925 cover",
    # 第二批
    "aesop": "Aesop for Children Milo Winter",
    "justso": "Just So Stories Kipling illustration",
    "grimm": "Grimm fairy tales Walter Crane illustration",
    "andersen": "Andersen fairy tales illustration 19th century",
    "willows": "Wind in the Willows Paul Bransom",
    "blackbeauty": "Black Beauty Anna Sewell illustration",
    "princess": "A Little Princess Ethel Franklin Betts",
    "railway": "Railway Children 1906 Brock",
    "heidi": "Heidi Jessie Willcox Smith",
    "pollyanna": "Pollyanna 1913 book",
    "jungle": "Mowgli Jungle Book illustration",
    "whitefang": "White Fang 1906 illustration",
    "hound": "Hound of the Baskervilles Sidney Paget",
    "scarlet": "Study in Scarlet 1887 Beeton",
    "signfour": "Sign of the Four 1890 Lippincott",
    "memoirs": "Final Problem Reichenbach Paget",
    "fourmillion": "O. Henry portrait",
    "seas": "Twenty Thousand Leagues Under the Sea illustration",
    "journey": "Voyage au centre de la Terre Riou",
    "warworlds": "War of the Worlds Alvim Correa",
    "invisible": "Invisible Man Wells 1897",
    "avonlea": "Anne of Avonlea 1909",
    "dorian": "Oscar Wilde Sarony portrait",
    "dracula": "Dracula 1897 first edition",
    "kidnapped": "Kidnapped Stevenson Wyeth",
    "huckfinn": "Huckleberry Finn Kemble illustration",
    "persuasion": "Persuasion Austen Hugh Thomson",
    "sense": "Sense and Sensibility Hugh Thomson",
    "emma": "Jane Austen Emma",
    "wuthering": "Wuthering Heights 1847 title page",
    "twocities": "Tale of Two Cities Phiz illustration",
    "greatexp": "Great Expectations Dickens",
    "dolittle": "Doctor Dolittle Lofting",
    "earthmoon": "From the Earth to the Moon Verne",
    "awakening": "Kate Chopin",
    "prophet": "Kahlil Gibran",
}


def api(params: dict) -> dict:
    params = {**params, "format": "json", "formatversion": "2"}
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers={"User-Agent": UA})
    for wait in (5, 15, 30, 60, 0):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # 限流 / 网络抖动都重试
            if not wait or (isinstance(e, urllib.error.HTTPError) and e.code not in (429, 500, 502, 503, 504)):
                raise
            print(f"  （{type(e).__name__}，{wait} 秒后重试）")
            time.sleep(wait)


def strip_html(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


def articles() -> dict:
    """用 node 读取 JS 数据文件，得到 {id: imgQuery}。"""
    js = """
      global.window = {};
      const fs = require('fs');
      for (const f of ['reading.js','reading_classics.js','reading_knowledge.js','reading_world.js','reading_stories.js',
                       'reading_more_world.js','reading_more_knowledge.js','reading_history.js']) require('./web/data/' + f);
      for (const f of fs.readdirSync('./web/data/more').sort()) require('./web/data/more/' + f);  // 后来补充的大批文章
      require('./web/data/books_index.js');
      const all = [...window.READING_PASSAGES, ...window.READING_EXTRA];
      const out = Object.fromEntries(all.map(p => [p.id, p.imgQuery || '']));
      // 原著书架的书没有 imgQuery：用「书名 + 作者姓」搜
      for (const b of window.BOOK_SHELF) if (!(b.id in out)) out[b.id] = b.title + ' ' + b.author.split(' ').pop();
      console.log(JSON.stringify(out));
    """
    out = subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True)
    data = json.loads(out.stdout)
    for k, q in BASE_QUERIES.items():
        data[k] = q  # 手工写的搜索词优先
    return data


def candidates(query: str, limit: int = 10) -> list:
    res = api({
        "action": "query", "generator": "search", "gsrsearch": f"{query} filetype:bitmap", "gsrnamespace": 6,
        "gsrlimit": limit, "prop": "imageinfo", "iiprop": "url|extmetadata|size|mime", "iiurlwidth": THUMB_W,
    })
    pages = sorted(res.get("query", {}).get("pages", []), key=lambda p: p.get("index", 0))
    out = []
    for p in pages:
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        lic = strip_html(meta.get("LicenseShortName", {}).get("value", ""))
        ok = (info.get("mime") in ("image/jpeg", "image/png") and info.get("width", 0) >= 600
              and OK_LICENSES.match(lic) is not None)
        out.append({
            "file": p["title"], "ok": ok, "license": lic,
            "artist": strip_html(meta.get("Artist", {}).get("value", ""))[:80],
            "size": f"{info.get('width')}x{info.get('height')}",
        })
    return out


def save_choice(aid: str, entry: dict, replace: bool = False):
    """每次只改一条记录再写回，避免两个进程（search / download）互相覆盖。
    replace=True 用于换图：丢掉旧的 credit，download 时才会重新下载。"""
    choices = json.loads(CHOICES.read_text(encoding="utf-8")) if CHOICES.exists() else {}
    choices[aid] = entry if replace else {**choices.get(aid, {}), **entry}
    CHOICES.write_text(json.dumps(choices, ensure_ascii=False, indent=2), encoding="utf-8")


def fallbacks(query: str) -> list:
    """搜不到合格图片时，依次去掉末尾的词再搜（至少保留一个词）。"""
    words = query.split()
    return [" ".join(words[:n]) for n in range(len(words), 0, -1)][:3]


def cmd_search(only: list):
    choices = json.loads(CHOICES.read_text(encoding="utf-8")) if CHOICES.exists() else {}
    missing = []
    for aid, query in articles().items():
        if only and aid not in only:
            continue
        if aid in choices and not only:
            continue
        for q in fallbacks(query):
            cands = candidates(q)
            good = [c for c in cands if c["ok"]]
            print(f"\n## {aid}  «{q}»")
            for c in cands[:8]:
                print(f"  {'✓' if c['ok'] else '✗'} {c['file']}  [{c['license']}] {c['size']}  {c['artist'][:40]}")
            time.sleep(2)
            if good:
                save_choice(aid, {"file": good[0]["file"], "query": q}, replace=True)
                break
        else:
            missing.append(aid)
    total = len(json.loads(CHOICES.read_text(encoding="utf-8")))
    print(f"\n已写入 {CHOICES}，共 {total} 篇" + (f"；仍没找到 {len(missing)} 篇：{' '.join(missing)}" if missing else ""))


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for wait in (10, 30, 60, 0):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except Exception as e:  # 网络抖动、SSL 断开、限流都重试
            if not wait:
                raise
            print(f"  （{type(e).__name__}，{wait} 秒后重试）")
            time.sleep(wait)


def download_one(aid: str, ch: dict):
    """下载一张图，返回 READING_IMAGES 里的一项；授权不符合时返回 None。"""
    res = api({"action": "query", "titles": ch["file"], "prop": "imageinfo",
               "iiprop": "url|extmetadata", "iiurlwidth": THUMB_W})
    info = res["query"]["pages"][0]["imageinfo"][0]
    meta = info.get("extmetadata", {})
    lic = strip_html(meta.get("LicenseShortName", {}).get("value", ""))
    if not OK_LICENSES.match(lic):
        print(f"✗ {aid}: 授权不符合（{lic}），跳过")
        return None
    img = Image.open(io.BytesIO(fetch_bytes(info["thumburl"]))).convert("RGB")
    img.thumbnail((800, 600))
    path = IMG_DIR / f"{aid}.jpg"
    img.save(path, "JPEG", quality=76, optimize=True)
    artist = strip_html(meta.get("Artist", {}).get("value", "")) or "Unknown"
    print(f"✓ {aid}: {path.stat().st_size // 1024} KB  [{lic}] {artist[:40]}")
    return {
        "src": f"img/reading/{aid}.jpg",
        "credit": f"{artist[:60]} · {lic} · Wikimedia Commons",
        "url": info.get("descriptionurl", ""),
    }


def write_js(result: dict):
    OUT_JS.write_text("// 自动生成：tools/fetch_images.py download\nwindow.READING_IMAGES = "
                      + json.dumps(result, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")


def cmd_download():
    choices = json.loads(CHOICES.read_text(encoding="utf-8"))
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    result, failed = {}, []
    for aid, ch in choices.items():
        if ch.get("credit") and (IMG_DIR / f"{aid}.jpg").exists():
            result[aid] = {"src": f"img/reading/{aid}.jpg", "credit": ch["credit"], "url": ch.get("url", "")}
            continue
        try:
            item = download_one(aid, ch)
        except Exception as e:  # 一张失败不影响其他的，下次运行会再试
            print(f"✗ {aid}: {type(e).__name__} {e}")
            failed.append(aid)
            continue
        if item:
            result[aid] = item
            save_choice(aid, {"credit": item["credit"], "url": item["url"]})
            if len(result) % 20 == 0:
                write_js(result)  # 中途也写一次，长时间运行时页面能先用上
        time.sleep(3)  # 放慢一点，少触发 Wikimedia 限流
    write_js(result)
    total = sum(f.stat().st_size for f in IMG_DIR.glob("*.jpg"))
    print(f"\n完成 {len(result)} 张，共 {total / 1024 / 1024:.1f} MB" + (f"；失败 {len(failed)} 张：{' '.join(failed)}" if failed else ""))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) > 1 and sys.argv[1] == "download":
        cmd_download()
    else:
        cmd_search(sys.argv[2:] if len(sys.argv) > 2 else [])
