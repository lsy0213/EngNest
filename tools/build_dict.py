"""生成内置的精简版英汉词典 assets/ecdict.db（查词、搜索用）。

数据来源：https://github.com/skywind3000/ECDICT （MIT License）
    ecdict.csv → 放到 tools/raw/ecdict.csv（没有的话脚本会自动下载，约 66 MB）

    python tools/build_dict.py

    pip install wordfreq   # 用来判断不常用的单词在真实语料里有没有出现过

筛选规则和表结构见 engnest/dictionary.py。完整版（77 万条）由用户在设置里下载、在本机生成。
"""

import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engnest.dictionary import CORE_DB, URL, build  # noqa: E402

RAW = Path(__file__).resolve().parent / "raw" / "ecdict.csv"
MIN_ZIPF = 2.5  # 大约每 300 万词出现一次；生僻的化学、医学术语基本都低于这个值

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if not RAW.exists():
        print("下载 ECDICT（约 66 MB）…")
        RAW.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, RAW)
    from wordfreq import zipf_frequency

    n = build(RAW, CORE_DB, keep_word=lambda w: zipf_frequency(w, "en") >= MIN_ZIPF)
    print(f"{n} 条，{CORE_DB.stat().st_size / 1e6:.1f} MB → {CORE_DB}")
