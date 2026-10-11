// 启动：读取进度 → 初始化发音和 AI → 渲染页面
(async function boot() {
  await Store.init();
  // 局域网 / 服务器：注册 Service Worker（打开更快、断网时有提示、服务器上的学习提醒推送）。自签名证书时浏览器会拒绝，没关系
  if (Store.remote && "serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch((e) => console.info("Service Worker 没注册上：", e.message));
  await KV.migrate();
  TTS.init();
  // 当前词书和复习要用的词书（已学的词在哪些词书里）先加载，其他词书用到时再加载
  const books = Books.ensure(Books.forLearned([curBook().id])).catch((e) => toast(e.message || String(e), "bad", 6000));
  await AI.refresh();
  await books;
  renderSidebarFoot();
  applySkin();
  applyNavCollapsed();
  if (!location.hash) history.replaceState(null, "", "#/home");
  Motivation.dayStart(); // 连胜保护、今天的每日任务、成就
  Icons.observe(); // 页面上的表情换成细线图标（icons.js）
  Router.render();
  FlowerCat.init();
  PartnerFigures.init();
  ThemeCharacter.init();
  // 跨过零点时刷新侧边栏的今日数据
  setInterval(() => { renderSidebarFoot(); Motivation.dayStart(); Reminder.tick(); }, 60 * 1000);
  // 每天检查一次更新（只在电脑上，有新版本才提示）
  if (Store.bridge && !Store.remote && Store.prefs.last_update_check !== today()) {
    setTimeout(async () => {
      try {
        const r = await pywebview.api.update_check();
        Store.prefs.last_update_check = today();
        Store.save();
        if (r.newer) toast(`EngNest 有新版本 v${r.latest}，可以到「设置 → 关于」查看`, "good", 8000);
      } catch { /* 没联网就算了 */ }
    }, 8000);
  }
})();
