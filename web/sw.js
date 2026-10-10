// EngNest 的 Service Worker：只在通过网址打开（局域网、服务器）时注册；桌面版是本地文件，用不到
// - 页面：先联网，连不上用上次缓存的（服务器更新了代码也能马上拿到新版本）
// - 脚本、样式、学习内容、图片：先用缓存，同时在后台更新（服务器上的文件带版本号，变了就是新地址）
// - 接口（/api/）、资料包、音频视频不缓存
// - 学习提醒的推送（服务器模式）：收到就弹通知，点通知打开小窝
const CACHE = "engnest-v1";
const MAX_ENTRIES = 600;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

const cacheable = (url) => url.origin === location.origin && !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/packs/")
  && /\.(js|css|png|jpe?g|webp|svg|gif|ico|woff2?|webmanifest|json)$/i.test(url.pathname);

// 缓存太多时删掉最早放进去的（旧版本的文件）
async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_ENTRIES; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const url = new URL(req.url);
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put("/", res.clone());
        return res;
      } catch {
        return (await caches.match("/")) || new Response("<meta charset=utf-8><p style='font:16px sans-serif;padding:24px'>连不上 EngNest，检查一下网络或者电脑上的 EngNest 有没有打开。</p>", { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
    })());
    return;
  }
  if (!cacheable(url)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // 没带版本号的文件（局域网访问时）：先联网，连不上才用缓存，免得电脑上更新了软件、手机还在用旧文件
    if (!/[?&]v=/.test(url.search)) {
      try {
        const res = await fetch(req);
        if (res.ok && res.type === "basic") { await cache.put(req, res.clone()); trim(cache); }
        return res;
      } catch { return (await cache.match(req)) || new Response("", { status: 504 }); }
    }
    const hit = await cache.match(req);
    const fresh = fetch(req).then(async (res) => {
      if (res.ok && res.type === "basic") { await cache.put(req, res.clone()); trim(cache); }
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    return (await fresh) || new Response("", { status: 504 });
  })());
});

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "EngNest · 英语小窝", {
    body: d.body || "今天还没学英语，来几分钟吧！", icon: "img/icon-192.png", badge: "img/icon-192.png", tag: d.tag || "engnest-remind", data: { url: d.url || "./#/home" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./#/home";
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) if ("focus" in c) { c.navigate?.(url); return c.focus(); }
    return self.clients.openWindow(url);
  })());
});
