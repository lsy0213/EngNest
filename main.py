"""EngNest 启动入口。

    python main.py          # 正常启动
    python main.py --debug  # 开启开发者工具（右键 → 检查）
"""

import sys

import webview

from engnest import APP_TITLE
from engnest.api import Api
from engnest.paths import web_index


def main():
    debug = "--debug" in sys.argv
    api = Api()
    api._autostart_lan()
    api._window = webview.create_window(
        APP_TITLE,
        # 用 file:// 直接加载本地文件：pywebview 内置的 HTTP 服务器扛不住几十个脚本同时请求
        url=web_index().as_uri(),
        js_api=api,
        width=1200,
        height=800,
        min_size=(960, 640),
        background_color="#FBF7F0",
        text_select=True,
    )
    webview.start(debug=debug)


if __name__ == "__main__":
    main()
