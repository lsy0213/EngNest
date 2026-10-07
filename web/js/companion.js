// 三视角 2D 陪伴角色。视角资源同高，动画只作用于整张立绘。
const FlowerCat = {
  views: ["front", "side", "back"],
  labels: { front: "正面", side: "侧面", back: "背面" },
  file(view) { return `img/companions/flower-cat-${this.views.includes(view) ? view : "front"}.png`; },
  view() { return this.views.includes(Store.prefs.companion_view) ? Store.prefs.companion_view : "front"; },
  actor() {
    return `<div class="flower-cat-stage">
      <button class="flower-cat-stage-figure" type="button" data-flower-turn title="点击转身" aria-label="陪伴角色，点击切换视角">
        <img class="flower-cat-image" src="${this.file(this.view())}" alt="猫耳陪伴角色全身立绘">
      </button>
      <div class="flower-cat-views" aria-label="角色视角">
        ${this.views.map((v) => `<button type="button" data-flower-view="${v}" class="${v === this.view() ? "on" : ""}">${this.labels[v]}</button>`).join("")}
      </div>
    </div>`;
  },
  setView(view) {
    if (!this.views.includes(view)) return;
    Store.prefs.companion_view = view;
    Store.save();
    document.querySelectorAll(".flower-cat-image").forEach((img) => { img.src = this.file(view); });
    document.querySelectorAll("[data-flower-view]").forEach((b) => b.classList.toggle("on", b.dataset.flowerView === view));
  },
  turn() { this.setView(this.views[(this.views.indexOf(this.view()) + 1) % this.views.length]); },
  init() {
    document.addEventListener("click", (e) => {
      const choice = e.target.closest("[data-flower-view]");
      if (choice) this.setView(choice.dataset.flowerView);
      else if (e.target.closest("[data-flower-turn]")) this.turn();
    });
    window.addEventListener("hashchange", () => this.refresh());
    window.addEventListener("resize", () => this.place());
    this.refresh();
  },
  refresh() {
    const selected = Store.prefs.partner?.avatar === "flower-cat";
    const onTalkPage = location.hash.startsWith("#/tutor");
    const show = selected && Store.prefs.companion_visible && !onTalkPage;
    let root = document.querySelector("#flower-cat-float");
    if (!show) { root?.remove(); return; }
    if (root) { this.place(); return; }
    root = document.createElement("div");
    root.id = "flower-cat-float";
    root.className = "flower-cat-float";
    root.innerHTML = `<button class="flower-cat-float-close" type="button" title="隐藏陪伴角色，可在伙伴设置里重新显示" aria-label="隐藏陪伴角色">×</button>
      <button class="flower-cat-float-figure" type="button" title="点击转身，拖动移动" aria-label="陪伴角色，点击转身或拖动移动">
        <img class="flower-cat-image" src="${this.file(this.view())}" alt="猫耳陪伴角色">
      </button>`;
    document.body.append(root);
    root.querySelector(".flower-cat-float-close").onclick = () => {
      Store.prefs.companion_visible = false;
      Store.save();
      this.refresh();
    };
    const figure = root.querySelector(".flower-cat-float-figure");
    let drag = null;
    figure.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const box = root.getBoundingClientRect();
      drag = { x: e.clientX, y: e.clientY, left: box.left, top: box.top, moved: false };
      figure.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    figure.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 5) drag.moved = true;
      if (!drag.moved) return;
      root.style.left = `${Math.max(0, Math.min(innerWidth - root.offsetWidth, drag.left + dx))}px`;
      root.style.top = `${Math.max(0, Math.min(innerHeight - root.offsetHeight, drag.top + dy))}px`;
      root.style.right = "auto";
      root.style.bottom = "auto";
    });
    figure.addEventListener("pointerup", () => {
      if (!drag) return;
      if (drag.moved) {
        Store.prefs.companion_position = { x: parseInt(root.style.left, 10), y: parseInt(root.style.top, 10) };
        Store.save();
      } else this.turn();
      drag = null;
    });
    figure.addEventListener("pointercancel", () => { drag = null; });
    figure.addEventListener("click", (e) => { if (e.detail === 0) this.turn(); });
    this.place();
  },
  place() {
    const root = document.querySelector("#flower-cat-float");
    const pos = Store.prefs.companion_position;
    if (!root || !pos) return;
    root.style.left = `${Math.max(0, Math.min(innerWidth - root.offsetWidth, pos.x))}px`;
    root.style.top = `${Math.max(0, Math.min(innerHeight - root.offsetHeight, pos.y))}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
  },
};

// 单视角 AI 伙伴。角色素材和主题独立：聊天时说话轻动，其他页面可拖动、点击进入聊天。
const PartnerFigures = {
  figures: {
    mintchoco: { file: "img/skin/mintchoco-companion.png", name: "薄荷可可猫耳伙伴" },
    greenapple: { file: "img/skin/greenapple-companion.png", name: "青苹果伙伴" },
  },
  has(id) { return Object.prototype.hasOwnProperty.call(this.figures, id); },
  file(id) { return this.figures[id]?.file || ""; },
  name(id) { return this.figures[id]?.name || ""; },
  selected() {
    const id = Store.prefs.partner?.avatar;
    return this.has(id) ? id : null;
  },
  actor(id) {
    return `<div class="partner-figure-stage"><div class="partner-figure-stage-figure" aria-label="${this.name(id)}正在陪你练习英语">
      <img src="${this.file(id)}" alt="${this.name(id)}全身立绘"></div></div>`;
  },
  init() {
    window.addEventListener("hashchange", () => this.refresh());
    window.addEventListener("resize", () => this.place());
    this.refresh();
  },
  refresh() {
    const id = this.selected();
    const show = id && Store.prefs.companion_visible && !location.hash.startsWith("#/tutor");
    let root = document.querySelector("#partner-figure-float");
    if (!show) { root?.remove(); return; }
    if (root?.dataset.figure === id) { this.place(); return; }
    root?.remove();
    root = document.createElement("div");
    root.id = "partner-figure-float";
    root.className = "partner-figure-float";
    root.dataset.figure = id;
    root.innerHTML = `<button class="partner-figure-float-close" type="button" title="隐藏伙伴，可在伙伴设置重新显示" aria-label="隐藏伙伴">×</button>
      <button class="partner-figure-float-figure" type="button" title="拖动移动；点击打开 AI 语伴" aria-label="${this.name(id)}，拖动移动，点击打开 AI 语伴">
        <img src="${this.file(id)}" alt="${this.name(id)}"></button>`;
    document.body.append(root);
    root.querySelector(".partner-figure-float-close").onclick = () => {
      Store.prefs.companion_visible = false;
      Store.save();
      this.refresh();
      ThemeCharacter.refresh();
    };
    const figure = root.querySelector(".partner-figure-float-figure");
    let drag = null, moved = false;
    figure.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const box = root.getBoundingClientRect();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: box.left, top: box.top };
      moved = false;
      figure.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    figure.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 5) moved = true;
      if (!moved) return;
      root.style.left = `${Math.max(0, Math.min(innerWidth - root.offsetWidth, drag.left + dx))}px`;
      root.style.top = `${Math.max(0, Math.min(innerHeight - root.offsetHeight, drag.top + dy))}px`;
    });
    figure.addEventListener("pointerup", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (moved) {
        Store.prefs.partner_figure_positions ||= {};
        Store.prefs.partner_figure_positions[id] = { x: parseInt(root.style.left, 10), y: parseInt(root.style.top, 10) };
        Store.save();
      }
      drag = null;
    });
    figure.addEventListener("pointercancel", () => { drag = null; });
    figure.addEventListener("click", (e) => {
      if (moved) { moved = false; return; }
      if (e.detail >= 0) Router.go("tutor");
    });
    this.place();
  },
  place() {
    const root = document.querySelector("#partner-figure-float");
    if (!root) return;
    const pos = Store.prefs.partner_figure_positions?.[root.dataset.figure];
    root.style.left = `${Math.max(0, Math.min(innerWidth - root.offsetWidth, pos?.x ?? innerWidth - root.offsetWidth - 18))}px`;
    root.style.top = `${Math.max(0, Math.min(innerHeight - root.offsetHeight, pos?.y ?? 12))}px`;
  },
};

// 角色主题的立绘独立于页面内容，切换页面时仍可拖动。
const ThemeCharacter = {
  figures: {
    garden: ["img/skin/garden-ribbon.jpg", "月桂蔷薇主题角色：缎带少女"],
    glass: ["img/skin/glass-character.png", "银雾流光主题角色"],
    starry: ["img/skin/star-character.png", "星河晚歌主题角色"],
    mintchoco: ["img/skin/mintchoco-character.jpg", "薄荷可可主题角色：猫耳洛丽塔少女"],
  },
  init() {
    window.addEventListener("resize", () => this.place());
    this.refresh();
  },
  position() {
    return Store.prefs.theme_character_positions?.[Store.prefs.skin];
  },
  place() {
    const root = document.querySelector("#theme-character-float");
    if (!root) return;
    const pos = this.position();
    const x = pos?.x ?? innerWidth - root.offsetWidth - 18;
    const y = pos?.y ?? 12;
    root.style.left = `${Math.max(0, Math.min(innerWidth - root.offsetWidth, x))}px`;
    root.style.top = `${Math.max(0, Math.min(innerHeight - root.offsetHeight, y))}px`;
  },
  save() {
    const root = document.querySelector("#theme-character-float");
    if (!root) return;
    Store.prefs.theme_character_positions ||= {};
    Store.prefs.theme_character_positions[Store.prefs.skin] = {
      x: parseInt(root.style.left, 10), y: parseInt(root.style.top, 10),
    };
    Store.save();
  },
  refresh() {
    const skin = Store.prefs.skin;
    const figure = this.figures[skin];
    let root = document.querySelector("#theme-character-float");
    if (PartnerFigures.has(skin) && PartnerFigures.selected() === skin && Store.prefs.companion_visible) { root?.remove(); return; }
    if (!figure) { root?.remove(); return; }
    if (!root) {
      root = document.createElement("div");
      root.id = "theme-character-float";
      root.innerHTML = `<button class="theme-character-figure" type="button" title="拖动角色移动位置；方向键也可以移动" aria-label="主题陪伴角色，可拖动，或用方向键移动">
        <img src="" alt="">
      </button>`;
      document.body.append(root);
      const handle = root.querySelector(".theme-character-figure");
      let drag = null;
      handle.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        const box = root.getBoundingClientRect();
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: box.left, top: box.top, moved: false };
        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      handle.addEventListener("pointermove", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) > 4) drag.moved = true;
        if (!drag.moved) return;
        root.style.left = `${Math.max(0, Math.min(innerWidth - root.offsetWidth, drag.left + dx))}px`;
        root.style.top = `${Math.max(0, Math.min(innerHeight - root.offsetHeight, drag.top + dy))}px`;
      });
      handle.addEventListener("pointerup", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (drag.moved) this.save();
        drag = null;
      });
      handle.addEventListener("pointercancel", () => { drag = null; });
      handle.addEventListener("keydown", (e) => {
        const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (!delta) return;
        e.preventDefault();
        const step = e.shiftKey ? 20 : 8;
        root.style.left = `${Math.max(0, Math.min(innerWidth - root.offsetWidth, parseInt(root.style.left, 10) + delta[0] * step))}px`;
        root.style.top = `${Math.max(0, Math.min(innerHeight - root.offsetHeight, parseInt(root.style.top, 10) + delta[1] * step))}px`;
        this.save();
      });
    }
    root.dataset.figure = skin;
    const img = root.querySelector("img");
    img.src = figure[0];
    img.alt = figure[1];
    this.place();
  },
};
