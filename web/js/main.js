// 启动：读取进度 → 初始化发音和 AI → 渲染页面
(async function boot() {
  await Store.init();
  await KV.migrate();
  TTS.init();
  await AI.refresh();
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
})();
