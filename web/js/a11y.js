// 无障碍（读屏软件、键盘操作）：
// - 只有图标的按钮（🔊 ★ ✕ …）自动用 title 当读屏名字；图标本身对读屏隐藏
// - 当前页面的导航项标上 aria-current
// - 弹窗是对话框：打开时焦点移进去，关闭后回到原来的位置
// - 提示消息（toast）会被读屏念出来
const A11y = {
  // 文字里没有字母、数字、汉字的，就当作「只有图标」
  iconOnly: (el) => !/[\p{L}\p{N}]/u.test((el.textContent || "").replace(/\s+/g, "")),
  label(root = document) {
    root.querySelectorAll("button:not([aria-label]), a.btn:not([aria-label]), [role=button]:not([aria-label])").forEach((b) => {
      if (b.title && this.iconOnly(b)) b.setAttribute("aria-label", b.title);
    });
    root.querySelectorAll(".ico:not([aria-hidden]), .task-ico:not([aria-hidden])").forEach((i) => i.setAttribute("aria-hidden", "true"));
  },
  nav() {
    document.querySelectorAll("#nav .nav-item, #nav-foot .nav-item").forEach((a) => {
      if (a.classList.contains("active")) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  },
  dialog(mask) {
    const box = mask.querySelector(".modal");
    if (!box) return;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    const h = box.querySelector("h2, h3");
    if (h) { h.id ||= "dlg-" + Math.random().toString(36).slice(2, 8); box.setAttribute("aria-labelledby", h.id); }
    const back = document.activeElement;
    const first = box.querySelector("input, textarea, select, button:not([data-close]), [data-close]");
    setTimeout(() => first?.focus(), 0);
    // 弹窗关掉后焦点回到打开它的按钮
    new MutationObserver((_, obs) => { if (!mask.isConnected) { obs.disconnect(); if (back?.isConnected) back.focus(); } })
      .observe(document.body, { childList: true });
  },
  init() {
    const toastRoot = document.getElementById("toast-root");
    if (toastRoot) { toastRoot.setAttribute("role", "status"); toastRoot.setAttribute("aria-live", "polite"); }
    document.getElementById("nav")?.setAttribute("aria-label", "主导航");
    let pending = false;
    const run = () => { pending = false; this.label(); this.nav(); };
    new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) if (n.classList?.contains("modal-mask")) this.dialog(n);
      if (!pending) { pending = true; setTimeout(run, 30); } // 不用 requestAnimationFrame：窗口在后台时它不触发
    }).observe(document.body, { childList: true, subtree: true });
    run();
  },
};
A11y.init();
