"""桌面版冒烟测试：打开窗口 → 检查 JS 与 Python 的通信、各页面渲染、语音生成 → 自动关闭。

    python tools/smoke_test.py
"""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import webview  # noqa: E402

from engnest import log, paths  # noqa: E402
from engnest.api import Api  # noqa: E402
from engnest.paths import web_index  # noqa: E402

PAGES = ["home", "course", "course/hello/0", "course/patterns", "course/daily", "builder", "builder/daily", "builder/emergency", "builder/modals", "builder/long", "builder/conditional", "words/new", "words/review", "words/quiz", "words/list", "topics", "topics/fruits", "notebook/sentences", "typing/sentence/phrase",
         "words/practice", "course/typing", "typing/words", "typing/sentence", "grammar", "grammar/inversion", "listening", "speaking",
         "reading", "reading/alice", "reading/signal-1", "reading/moonlanding", "book/oz", "book/pride/13", "video", "writing/translate", "tutor", "tutor/scenes", "tutor/partner", "listening/voa", "listening/gen", "listening/dictation", "notebook", "settings", "about", "level", "stats"]
results = {}


def run(window):
    def js(code):
        return window.evaluate_js(code)

    deadline = time.time() + 20
    while time.time() < deadline and not js("typeof Store !== 'undefined' && !!Store.data"):
        time.sleep(0.3)
    results["bridge"] = js("Store.bridge")
    results["ai_enabled"] = js("AI.enabled")

    errors = []
    for page in PAGES:
        js(f"location.hash = '#/{page}'")
        time.sleep(0.8)
        text = js("document.querySelector('.page') ? document.querySelector('.page').innerText : ''") or ""
        if "页面出错了" in text or not text.strip():
            errors.append(f"{page}: {text[:200]}")
    results["page_errors"] = errors
    results["content"] = js("`词书 ${BOOKS.map(b => b.title + b.count).join(' ')} | 去重 ${WORDS.length} 词 | 语法 ${GRAMMAR_ORDER.length} 课 | "
                            "阅读 ${App.pages.reading.all().length} 篇 | 短语 ${ALL_PHRASES.length} 个 | 主题 ${TOPICS.length} 个 | 连词成句 ${BUILDER_LESSONS.length} 课`")
    # 外部来源的读物：VOA、维基百科，以及导入（测完删除，不留在用户的「我的读物」里）
    js("location.hash = '#/book/voa-' + VOA_INDEX[0].id"); time.sleep(1.5)
    results["voa_paras"] = js("document.querySelectorAll('#reader .para').length")
    js("location.hash = '#/book/wiki-' + WIKI_INDEX[0].id"); time.sleep(1.5)
    results["wiki_paras"] = js("document.querySelectorAll('#reader .para').length")
    imp = window._js_api.library_import_text("Smoke Test", "Chapter 1\n\n" + "This is a smoke test. " * 30 + "\n\nChapter 2\n\n" + "Another short part. " * 30)
    js(f"Docs.library(true).then(() => location.hash = '#/book/{imp['id']}/2')"); time.sleep(1.5)
    results["import_chapter2_paras"] = js("document.querySelectorAll('#reader .para').length")
    window._js_api.library_delete(imp["id"])
    js("location.hash = '#/reading/alice'")
    time.sleep(1.5)
    results["image_ok"] = js("(() => { const i = document.querySelector('.hero-img img'); return !!(i && i.complete && i.naturalWidth > 0); })()")
    # 插图：打开《绿野仙踪》第一张插图所在的章节；场景口语卡片
    js("location.hash = '#/book/oz/' + DOC_IMAGES.oz[0].ch"); time.sleep(2)
    results["doc_figs"] = js("(() => { const i = document.querySelector('.doc-fig img'); return i ? (i.complete && i.naturalWidth > 0) : 'none'; })()")
    js("location.hash = '#/tutor/scenes'"); time.sleep(1.5)
    results["scene_cards"] = js("`${document.querySelectorAll('.scene-card').length} 张卡片，${document.querySelectorAll('.scene-pic img').length} 张图`")
    results["stt"] = window._js_api.stt_status()

    # 局域网访问：开启 → 用 HTTP 验证访问码 → 设置页显示 → 关闭
    api = window._js_api
    before = api.lan_status()  # 测完恢复原来的局域网设置
    st = api.lan_set(True, 8798)
    results["lan_running"] = st["running"]
    results["lan_url"] = st["urls"][:1]
    results["lan_qr"] = bool(st["qr"])
    if st["running"]:
        import urllib.request
        req = urllib.request.Request("http://127.0.0.1:8798/api/ping", data=b"{}", method="POST",
                                     headers={"X-EngNest-Key": st["code"], "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            results["lan_ping"] = r.status
    js("location.hash = '#/settings'")
    time.sleep(2)
    results["lan_card"] = js("(document.querySelector('#lan-card') || {}).innerText?.slice(0, 30)")
    results["dict_card"] = js("(document.querySelector('#dict-card') || {}).innerText?.slice(0, 40)")
    # 内置词典：变形词找原形、中文反查
    # evaluate_js 不会等 Promise，先把结果存到全局变量里再读
    js("Dict.lookup('went').then(d => window.__went = d ? d.word : null); Dict.search('苹果').then(r => window.__apple = r.slice(0, 3).map(x => x.word).join(','))")
    time.sleep(1)
    results["dict_went"] = js("window.__went")
    results["dict_search"] = js("window.__apple")
    api.lan_set(before["enabled"], before["port"])

    audio = window._js_api.tts("Hello from EngNest.", "en-US-AriaNeural", 0.9)
    results["tts"] = audio["ok"] and audio["audio"].startswith("data:audio/mpeg;base64,")
    results["tts_error"] = audio.get("error")
    # 进度：改一个字段 → 保存 → 后端读出来是改过的；AI 缓存能写能读
    js("Store.data.smoke_test = Date.now(); Store.save()")
    time.sleep(1)
    saved = window._js_api.progress_load()["data"]
    results["progress_saved"] = bool(saved.get("smoke_test"))
    js("Store.drop('smoke_test')")
    time.sleep(1)
    results["progress_dropped"] = "smoke_test" not in window._js_api.progress_load()["data"]
    js("KV.set('smoke', 'k', {v: 1})")
    time.sleep(0.5)
    results["kv"] = window._js_api.kv_get("smoke", ["k"]).get("k") == {"v": 1}
    results["data_dir"] = str(paths.data_dir())
    # 新功能：FSRS 已加载、生词本有导入导出入口、AI 提示词随水平变化
    js("location.hash = '#/notebook'")
    time.sleep(1)
    results["fsrs_loaded"] = js("typeof FSRS === 'object' && typeof Fsrs.schedule === 'function'")
    results["notebook_io"] = js("!!document.querySelector('#nb-io')")
    results["learner_profile"] = js("LEARNER_PROFILE.slice(0, 40)")
    results["local_storage_persisted"] = js("(() => { try { localStorage.setItem('engnest-smoke', '1'); return true; } catch { return false; } })()")
    window.destroy()


if __name__ == "__main__":
    for stream in (sys.stdout, sys.stderr):
        if stream and hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")  # 中文 Windows 控制台默认 GBK，打印 emoji 会报错
    log.setup()
    paths.migrate_legacy()
    api = Api()
    win = webview.create_window("EngNest smoke test", url=web_index().as_uri(), js_api=api, width=1100, height=750)
    win._js_api = api
    api._window = win
    webview.start(run, win, private_mode=False, storage_path=str(paths.sub_dir("webview")))
    print(json.dumps(results, ensure_ascii=False, indent=2))
    ok = (results.get("bridge") and not results.get("page_errors") and results.get("tts") and results.get("dict_went") == "go"
          and results.get("progress_saved") and results.get("progress_dropped") and results.get("kv"))
    sys.exit(0 if ok else 1)
