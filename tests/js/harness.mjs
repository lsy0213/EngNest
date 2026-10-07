// 在 Node 里加载前端脚本（不需要浏览器、不需要装任何 npm 包），给纯函数写测试用
// 前端是普通 <script>，顶层的 const / function 在同一个 vm 上下文里共享；用 app.get("名字") 取出来
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export const WEB = path.resolve(import.meta.dirname, "../../web");

export function loadApp(files) {
  const noop = () => {};
  const el = () => ({
    classList: { toggle: noop, add: noop, remove: noop, contains: () => false }, style: {}, dataset: {},
    appendChild: noop, remove: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [],
    setAttribute: noop, innerHTML: "", textContent: "",
  });
  const mem = new Map();
  const ctx = {
    console, setTimeout, clearTimeout, setInterval: noop, URL, Blob: class {}, TextEncoder,
    localStorage: { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) },
    location: { hash: "", protocol: "file:", href: "file:///index.html", search: "", pathname: "/index.html" },
    history: { replaceState: noop }, navigator: {}, performance: { now: () => 0 },
    addEventListener: noop, removeEventListener: noop,
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.self = ctx;
  ctx.document = {
    addEventListener: noop, removeEventListener: noop, querySelector: () => null, querySelectorAll: () => [],
    createElement: el, documentElement: { dataset: {} }, body: el(), write: noop,
  };
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(WEB, f), "utf8"), ctx, { filename: f });
  ctx.get = (name) => vm.runInContext(name, ctx);
  ctx.run = (code) => vm.runInContext(code, ctx);
  return ctx;
}

// 常用的一套：入门词书 + FSRS + 核心 + 组件 + 导入导出 + 水平测试（LEARNER_PROFILE）
export function loadCore() {
  const app = loadApp(["data/words.js", "js/vendor/ts-fsrs.umd.js", "js/core.js", "js/components.js", "js/wordio.js", "js/pages/book.js", "js/pages/level.js"]);
  app.run("Store.data = fillDefaults({}, DEFAULT_PROGRESS()); Store.save = () => {};");
  return app;
}
