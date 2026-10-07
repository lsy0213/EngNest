# -*- mode: python ; coding: utf-8 -*-
# EngNest 打包配置：onedir（一个文件夹），由 build.bat 调用：
#     python -m PyInstaller --noconfirm --clean EngNest.spec
#
# 为什么不用 onefile：web/ 有接近 200 MB，onefile 每次启动都要先解压到 C 盘的临时目录，
# 启动慢、占 C 盘，也更容易被杀毒软件误报。onedir 直接运行，再用 Inno Setup 做成安装包。

import os

from PyInstaller.utils.hooks import collect_all

# 不能打进安装包的文件：没有开源协议的 my-ielts 雅思资料（软件里在「雅思 → 资料包」下载到本机）
EXCLUDE = {
    "web/data/ielts_extra.js",
    "web/data/vocab_ielts_zj.js",
    "web/data/vocab_ielts_l179.js",
    "web/data/vocab_ielts_r538.js",
}
EXCLUDE_DIRS = ("web/ext/my-ielts",)


def web_files():
    out = []
    for root, _dirs, files in os.walk("web"):
        rel_root = root.replace("\\", "/")
        if rel_root.startswith(EXCLUDE_DIRS):
            continue
        for f in files:
            rel = f"{rel_root}/{f}"
            if rel in EXCLUDE or f.endswith((".md", ".pyc")):
                continue
            out.append((rel, rel_root))
    return out


datas = web_files() + [("assets/ecdict.db", "assets"), ("assets/icon.ico", "assets")]
binaries = []
hiddenimports = []
for pkg in ("faster_whisper", "ctranslate2"):
    d, b, h = collect_all(pkg)
    datas += d
    binaries += b
    hiddenimports += h

a = Analysis(
    ["main.py"],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "pytest", "PyInstaller", "wordfreq", "PIL"],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="EngNest",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # UPX 压缩过的 exe 更容易被杀毒软件误报
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=["assets/icon.ico"],
    version="version_info.txt",
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="EngNest",
)
