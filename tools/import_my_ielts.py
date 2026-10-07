"""开发用：把本机已经克隆好的 hefengxian/my-ielts 转换成资料包，装进当前的数据目录（和软件里点「下载雅思资料包」的结果一样）。

my-ielts 没有声明开源协议，所以它的内容不放进 EngNest 的仓库和安装包：用户在「雅思」页里自己下载，
转换逻辑在 engnest/packs.py。这个脚本只在没网、但手上有一份克隆时用：

    git clone --depth 1 --filter=blob:none --sparse https://github.com/hefengxian/my-ielts.git tools/raw/ext/my-ielts
    cd tools/raw/ext/my-ielts && git sparse-checkout set src/pages public/grammar
    python tools/import_my_ielts.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from engnest import packs  # noqa: E402
from engnest.dictionary import Dictionary  # noqa: E402


def main():
    raw = ROOT / "tools" / "raw" / "ext" / "my-ielts"
    out = packs.pack_dir("my-ielts")
    stats = packs.convert_my_ielts(raw, out, Dictionary().phonetic)
    (out / "pack.json").write_text(json.dumps({"id": "my-ielts", "commit": "local", "stats": stats}, ensure_ascii=False), encoding="utf-8")
    packs.write_index()
    print(f"已装到 {out}：{stats}")


if __name__ == "__main__":
    main()
