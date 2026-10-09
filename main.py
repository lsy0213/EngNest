"""EngNest 启动入口。

    python main.py          # 正常启动
    python main.py --debug  # 开启开发者工具（右键 → 检查）

服务器模式（不开窗口，用账号登录，见 engnest/server.py）：

    python main.py --server [--port 8766] [--http] [--host 127.0.0.1] [--public-ip 1.2.3.4] [--domain en.example.cn]
    python main.py --invite [--admin] [--note 备注]   # 生成邀请码（服务器开着也能用）
    python main.py --users                             # 列出账号
"""

import os
import sys
import urllib.parse

from engnest import APP_TITLE, log, paths


def _arg(name, default=""):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv and sys.argv.index(name) + 1 < len(sys.argv) else default


def server_main():
    """服务器模式的几个命令"""
    from engnest import accounts, lan, server

    log.setup("--debug" in sys.argv)
    if "--invite" in sys.argv:
        code = accounts.Accounts().new_invite(admin="--admin" in sys.argv, note=_arg("--note"))
        print(f"{'管理员' if '--admin' in sys.argv else ''}邀请码：{code}")
        return
    if "--users" in sys.argv:
        for u in accounts.Accounts().users():
            print(f"{u['username']:<20} {'管理员' if u['admin'] else '':<6} {'可用主人 AI' if u['ai'] else '':<10} 注册于 {u['created']}")
        return
    server.run(int(_arg("--port", lan.DEFAULT_PORT)), https="--http" not in sys.argv,
               extra_hosts=[_arg("--public-ip"), _arg("--domain")], host=_arg("--host", "0.0.0.0"))


def main():
    if any(f in sys.argv for f in ("--server", "--invite", "--users")):
        return server_main()
    import webview  # 服务器上没有图形界面，只在桌面版导入

    from engnest.api import Api

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
        # #packs=：用户下载的资料包所在的文件夹（在数据目录里），页面启动时从那里加载（file:// 带 ? 参数会打不开）
        url=paths.web_index().as_uri() + "#packs=" + urllib.parse.quote(paths.sub_dir("packs").as_uri(), safe=""),
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
