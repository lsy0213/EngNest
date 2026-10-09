// 启动：读取进度 → 初始化发音和 AI → 渲染页面
(async function boot() {
  await Store.init();
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
  Router.render();
  FlowerCat.init();
  PartnerFigures.init();
  ThemeCharacter.init();
  // 跨过零点时刷新侧边栏的今日数据
  setInterval(renderSidebarFoot, 60 * 1000);
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
