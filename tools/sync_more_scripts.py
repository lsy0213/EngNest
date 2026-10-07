"""把 web/data/more/ 下的所有文章文件按文件名排序写进 index.html（替换原来那一段 <script>）。"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html_path = ROOT / "web" / "index.html"
html = html_path.read_text(encoding="utf-8")
files = sorted(p.name for p in (ROOT / "web" / "data" / "more").glob("*.js"))
block = "".join(f'  <script src="data/more/{f}"></script>\n' for f in files)
pat = re.compile(r'(?:  <script src="data/more/[^"]+"></script>\n)+')
assert pat.search(html), "index.html 里找不到 data/more 的 script 段"
html_path.write_text(pat.sub(lambda m: block, html, count=1), encoding="utf-8")
print(f"写入 {len(files)} 个文件")
