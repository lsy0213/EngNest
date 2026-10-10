"""电脑上的系统通知（学习提醒）：用 Windows 自带的 PowerShell 弹一个 Toast，不需要装别的东西。
软件开着（比如最小化在任务栏）时，到了提醒时间还没学就弹一条。失败了（老系统、被组策略禁了）就算了，网页里还有提示。"""

import logging
import subprocess
import sys

log = logging.getLogger(__name__)

# 用 PowerShell 自己的 AppUserModelID 发通知：不用给 EngNest 单独注册（通知来源会显示成 Windows PowerShell）
_AUMID = r"{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe"
_SCRIPT = r"""
$ErrorActionPreference = 'Stop'
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($env:ENGNEST_TOAST)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($env:ENGNEST_AUMID).Show([Windows.UI.Notifications.ToastNotification]::new($xml))
"""


def _xml_escape(s: str) -> str:
    return str(s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def toast_xml(title: str, body: str) -> str:
    return (f'<toast><visual><binding template="ToastGeneric"><text>{_xml_escape(title)[:120]}</text>'
            f"<text>{_xml_escape(body)[:300]}</text></binding></visual></toast>")


def toast(title: str, body: str) -> bool:
    if sys.platform != "win32":
        return False
    import os

    env = {**os.environ, "ENGNEST_TOAST": toast_xml(title, body), "ENGNEST_AUMID": _AUMID}  # 文字走环境变量，不拼进命令行
    try:
        r = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", _SCRIPT],
                           env=env, capture_output=True, timeout=15, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        if r.returncode != 0:
            log.warning("系统通知没弹出来：%s", r.stderr.decode("utf-8", "replace")[-300:])
        return r.returncode == 0
    except (OSError, subprocess.SubprocessError) as e:
        log.warning("系统通知没弹出来：%s", e)
        return False
