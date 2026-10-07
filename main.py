"""EngNest 启动入口。

    python main.py          # 正常启动
    python main.py --debug  # 开启开发者工具（右键 → 检查）
"""

import os
import sys

import webview

from engnest import APP_TITLE, log, paths
from engnest.api import Api


def main():
    debug = "--debug" in sys.argv
    log.setup(debug)
    paths.migrate_legacy()  # 旧版本的数据搬到当前的数据目录，必须在打开任何数据文件之前
    api = Api()
    proxy = api.net_get()["proxy"]
    if proxy:
        # 网页里直接加载的音频、视频、图片走 WebView2 自己的网络，也让它用设置里的代理（改了要重启才生效）
        os.environ["WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"] = f"--proxy-server={proxy}"
    api._autostart_lan()
    api._window = webview.create_window(
        APP_TITLE,
        # 用 file:// 直接加载本地文件：pywebview 内置的 HTTP 服务器扛不住几十个脚本同时请求
        url=paths.web_index().as_uri(),
        js_api=api,
        width=1200,
        height=800,
        min_size=(960, 640),
        background_color="#FBF7F0",
        text_select=True,
    )
    api._window.events.closing += api._on_closing
    # private_mode 默认是 True：WebView 的 localStorage 等每次关闭都会清空。
    # 关掉它，并把 WebView2 的数据放进 EngNest 自己的数据目录（不放 C 盘的默认位置）
    webview.start(debug=debug, private_mode=False, storage_path=str(paths.sub_dir("webview")))


if __name__ == "__main__":
    main()
