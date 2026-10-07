"""生成 PyInstaller 用的 Windows 版本信息（version_info.txt），版本号取 engnest/__init__.py 里的 VERSION。

带版本信息的 exe 在资源管理器里能看到产品名和版本，也更不容易被杀毒软件当成可疑程序。
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from engnest import APP_NAME, APP_TITLE, VERSION  # noqa: E402

nums = [int(x) for x in (VERSION.split(".") + ["0", "0", "0"])[:4]]
text = f"""VSVersionInfo(
  ffi=FixedFileInfo(filevers={tuple(nums)}, prodvers={tuple(nums)}, mask=0x3f, flags=0x0, OS=0x40004, fileType=0x1, subtype=0x0, date=(0, 0)),
  kids=[
    StringFileInfo([StringTable('080404b0', [
      StringStruct('CompanyName', '{APP_NAME}'),
      StringStruct('FileDescription', '{APP_TITLE}'),
      StringStruct('FileVersion', '{VERSION}'),
      StringStruct('InternalName', '{APP_NAME}'),
      StringStruct('OriginalFilename', '{APP_NAME}.exe'),
      StringStruct('ProductName', '{APP_TITLE}'),
      StringStruct('ProductVersion', '{VERSION}')])]),
    VarFileInfo([VarStruct('Translation', [2052, 1200])])
  ]
)
"""
(ROOT / "version_info.txt").write_text(text, encoding="utf-8")
print(VERSION)
