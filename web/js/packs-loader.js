// 资料包：用户在软件里下载到本机的学习资料（比如雅思资料包），在 core.js 之前同步加载
// 桌面版：资料包在数据目录里，main.py 用地址里的 #packs=<文件夹地址> 传进来（file:// 地址带 ? 参数 WebView 打不开，所以用 #），
//         记在 localStorage 里，软件里刷新页面后也找得到；局域网访问时由 EngNest 的服务在 /packs/ 提供
(function () {
  var base = "", KEY = "engnest-pack-base";
  if (location.protocol === "file:") {
    var m = /^#packs=([^&]+)/.exec(location.hash);
    if (m) {
      base = decodeURIComponent(m[1]);
      try { localStorage.setItem(KEY, base); } catch (e) { /* 存不了就只这一次 */ }
      history.replaceState(null, "", location.pathname + "#/home");
    } else {
      try { base = localStorage.getItem(KEY) || ""; } catch (e) { base = ""; }
    }
  } else {
    base = "/packs";
  }
  window.ENGNEST_PACK_BASE = base;
  window.ENGNEST_PACKS = [];
  if (base) document.write('<script src="' + base + '/index.js"><\/script>');
})();
