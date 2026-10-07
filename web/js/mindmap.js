// ============================================================
// 思维导图：把树形数据画成可折叠、可缩放、可拖动的 SVG（不依赖第三方库）
// 节点：{ text, href?, done?, children?: [...], collapsed? }
// 用法：const mm = MindMap.mount(容器, 树, { layout: "both" | "right", expandDepth })
// ============================================================
const MindMap = (() => {
  // 每一层的字号、内边距、最大宽度（超出自动换行）
  const LEVELS = [
    { size: 18, weight: 700, padX: 20, padY: 11, maxW: 260, center: true },
    { size: 15, weight: 600, padX: 14, padY: 8, maxW: 220, center: true },
    { size: 14, weight: 500, padX: 11, padY: 6, maxW: 240 },
    { size: 13, weight: 400, padX: 9, padY: 4, maxW: 260 },
  ];
  const LINE_H = 1.4;
  const GAP_X = [56, 40, 30, 26]; // 父子之间的水平距离（按父节点层级）
  const GAP_Y = [0, 22, 10, 6];   // 兄弟之间的垂直距离（按子节点层级）
  const LINK_W = [3, 2.2, 1.6, 1.2];
  const MARGIN = 28;
  const BRANCHES = 6;
  const at = (arr, d) => arr[Math.min(d, arr.length - 1)];

  let ctx;
  function textW(s, font) {
    ctx = ctx || document.createElement("canvas").getContext("2d");
    ctx.font = font;
    return ctx.measureText(s).width;
  }

  // 英文按单词、中文按字切分后贪心换行；标点不放行首
  const NO_HEAD = "，。、；：！？）」』》,.;:!?)";
  function wrap(text, font, maxW) {
    const tokens = text.match(/[A-Za-z0-9'’.\-\/]+\s*|\s+|[^\sA-Za-z0-9'’.\-\/]/g) || [""];
    const lines = [];
    let cur = "";
    for (const t of tokens) {
      if (cur && textW(cur + t.trimEnd(), font) > maxW && !NO_HEAD.includes(t)) {
        lines.push(cur.trimEnd());
        cur = t.trimStart();
      } else cur += t;
    }
    lines.push(cur.trimEnd());
    return lines;
  }

  const kids = (n) => (n.collapsed ? [] : n.children || []);
  function walk(n, fn) { fn(n); (n.children || []).forEach((c) => walk(c, fn)); }

  // 分配层级、分支颜色、编号
  function prep(tree) {
    let id = 0;
    (function go(n, depth, branch) {
      n.id = id++;
      n.depth = depth;
      n.branch = branch;
      (n.children || []).forEach((c, i) => go(c, depth + 1, depth === 0 ? i % BRANCHES : branch));
    })(tree, 0, 0);
  }

  // ---------- 布局：先量尺寸，再算每棵子树的高度，最后从根往外摆 ----------
  function layout(tree, mode, family) {
    const nodes = [];
    (function measure(n) {
      const L = at(LEVELS, n.depth);
      const font = `${L.weight} ${L.size}px ${family}`;
      n.lines = wrap(n.text, font, L.maxW - 2 * L.padX);
      const badge = n.done ? textW(" ✓", font) : 0;
      const widths = n.lines.map((s, i) => textW(s, font) + (i === n.lines.length - 1 ? badge : 0));
      n.w = Math.ceil(Math.max(...widths)) + 2 * L.padX;
      n.h = Math.ceil(n.lines.length * L.size * LINE_H) + 2 * L.padY;
      nodes.push(n);
      kids(n).forEach(measure);
    })(tree);

    const sumH = (arr, gap) => arr.reduce((a, k) => a + k.bh, 0) + gap * Math.max(0, arr.length - 1);
    (function blockH(n) {
      const ks = kids(n);
      ks.forEach(blockH);
      n.bh = ks.length ? Math.max(n.h, sumH(ks, at(GAP_Y, n.depth + 1))) : n.h;
    })(tree);

    function place(n, edge, top, dir) {
      n.dir = dir;
      n.x = dir > 0 ? edge : edge - n.w;
      n.y = top + (n.bh - n.h) / 2;
      const ks = kids(n);
      const gap = at(GAP_Y, n.depth + 1);
      const gx = at(GAP_X, n.depth);
      let y = top + (n.bh - sumH(ks, gap)) / 2;
      ks.forEach((k) => {
        place(k, dir > 0 ? n.x + n.w + gx : n.x - gx, y, dir);
        y += k.bh + gap;
      });
    }

    // 根节点的一级分支分成左右两半，让两边高度尽量接近
    const top = kids(tree);
    let cut = top.length;
    if (mode === "both" && top.length > 2) {
      const total = top.reduce((a, k) => a + k.bh, 0);
      let acc = 0, best = Infinity;
      top.forEach((k, i) => {
        acc += k.bh;
        if (i < top.length - 1 && Math.abs(2 * acc - total) < best) { best = Math.abs(2 * acc - total); cut = i + 1; }
      });
    }
    const right = top.slice(0, cut), left = top.slice(cut);
    const gap = GAP_Y[1];
    const H = Math.max(tree.h, sumH(right, gap), sumH(left, gap));
    tree.x = 0;
    tree.y = (H - tree.h) / 2;
    tree.dir = 1;
    [[right, 1], [left, -1]].forEach(([arr, dir]) => {
      let y = (H - sumH(arr, gap)) / 2;
      arr.forEach((k) => {
        place(k, dir > 0 ? tree.w + GAP_X[0] : -GAP_X[0], y, dir);
        y += k.bh + gap;
      });
    });

    // 平移到正坐标（折叠按钮会伸出节点边缘，一并算进去）
    let minX = Infinity, maxX = -Infinity;
    nodes.forEach((n) => {
      const ext = n.children?.length && n.depth > 0 ? 22 : 0;
      minX = Math.min(minX, n.x - (n.dir < 0 ? ext : 0));
      maxX = Math.max(maxX, n.x + n.w + (n.dir > 0 ? ext : 0));
    });
    nodes.forEach((n) => { n.x += MARGIN - minX; n.y += MARGIN; });
    return { nodes, W: Math.ceil(maxX - minX + 2 * MARGIN), H: Math.ceil(H + 2 * MARGIN) };
  }

  // ---------- 画成 SVG 字符串 ----------
  function draw({ nodes, W, H }) {
    const links = [], items = [];
    for (const n of nodes) {
      for (const k of kids(n)) {
        const y1 = n.y + n.h / 2, y2 = k.y + k.h / 2;
        const x1 = k.dir > 0 ? n.x + n.w : n.x, x2 = k.dir > 0 ? k.x : k.x + k.w;
        const dx = (x2 - x1) / 2;
        links.push(`<path class="mm-link b${k.branch}" stroke-width="${at(LINK_W, n.depth)}" d="M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}"/>`);
      }
      const L = at(LEVELS, n.depth);
      const d = Math.min(n.depth, LEVELS.length - 1);
      const lh = L.size * LINE_H;
      const tx = L.center ? n.x + n.w / 2 : n.x + L.padX;
      const tspans = n.lines.map((s, i) =>
        `<tspan x="${tx}" y="${n.y + L.padY + (i + 0.5) * lh}">${esc(s)}${n.done && i === n.lines.length - 1 ? `<tspan class="mm-done"> ✓</tspan>` : ""}</tspan>`).join("");
      const rx = d === 0 ? n.h / 2 : [0, 10, 8, 6][d];
      let toggle = "";
      if (n.children?.length && n.depth > 0) {
        const cx = n.dir > 0 ? n.x + n.w + 11 : n.x - 11, cy = n.y + n.h / 2;
        toggle = `<g class="mm-toggle ${n.collapsed ? "shut" : ""}" data-toggle="${n.id}"><title>${n.collapsed ? "展开" : "收起"}</title>
          <circle cx="${cx}" cy="${cy}" r="9"/><text x="${cx}" y="${cy}">${n.collapsed ? n.children.length : "−"}</text></g>`;
      }
      items.push(`<g class="mm-node d${d} b${n.branch}${n.href ? " link" : ""}${n.done ? " done" : ""}" data-id="${n.id}">
        ${n.href ? `<title>点击进入：${esc(n.text)}</title>` : ""}
        <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${rx}"/>
        <text text-anchor="${L.center ? "middle" : "start"}">${tspans}</text>${toggle}</g>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${links.join("")}${items.join("")}</svg>`;
  }

  function mount(host, tree, opts = {}) {
    const o = { layout: "both", expandDepth: Infinity, maxHeight: "72vh", ...opts };
    prep(tree);
    walk(tree, (n) => { if (n.collapsed === undefined) n.collapsed = !!n.children?.length && n.depth > 0 && n.depth >= o.expandDepth; });
    const byId = {};
    walk(tree, (n) => (byId[n.id] = n));

    host.innerHTML = `<div class="mindmap">
      <div class="row mm-tools">
        <button class="btn sm" data-act="out" title="缩小">－</button>
        <button class="btn sm mm-zoom" data-act="reset" title="恢复原始大小">100%</button>
        <button class="btn sm" data-act="in" title="放大">＋</button>
        <button class="btn sm" data-act="fit" title="整张图放进窗口">适应窗口</button>
        <span class="spacer"></span>
        <span class="small faint mm-hint">拖动平移 · Ctrl + 滚轮缩放</span>
        <button class="btn sm" data-act="expand">全部展开</button>
        <button class="btn sm" data-act="collapse">全部收起</button>
      </div>
      <div class="mm-view" style="max-height:${o.maxHeight}"></div>
    </div>`;
    const view = $(".mm-view", host);
    const zoomLabel = $(".mm-zoom", host);
    let scale = 1, size = { W: 0, H: 0 };

    const svg = () => view.firstElementChild;
    // SVG 左上角在滚动区域里的坐标（svg 元素没有 offsetLeft/offsetTop）
    function origin() {
      const a = svg().getBoundingClientRect(), b = view.getBoundingClientRect();
      return { x: a.left - b.left - view.clientLeft + view.scrollLeft, y: a.top - b.top - view.clientTop + view.scrollTop };
    }
    function applyScale() {
      const s = svg();
      s.setAttribute("width", Math.round(size.W * scale));
      s.setAttribute("height", Math.round(size.H * scale));
      zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    }
    function render() {
      const res = layout(tree, o.layout, getComputedStyle(host).fontFamily);
      size = res;
      view.innerHTML = draw(res);
      applyScale();
    }
    // 缩放时让 (fx, fy) 这个点在屏幕上保持不动
    function zoom(next, fx = view.clientWidth / 2, fy = view.clientHeight / 2) {
      next = Math.min(2, Math.max(0.3, next));
      let o = origin();
      const cx = (view.scrollLeft + fx - o.x) / scale, cy = (view.scrollTop + fy - o.y) / scale;
      scale = next;
      applyScale();
      o = origin();
      view.scrollLeft = o.x + cx * scale - fx;
      view.scrollTop = o.y + cy * scale - fy;
    }
    function maxViewH() { return parseFloat(getComputedStyle(view).maxHeight) || innerHeight * 0.7; }
    // 把某个节点滚到视野中间
    function centerOn(n) {
      const o = origin();
      view.scrollLeft = o.x + (n.x + n.w / 2) * scale - view.clientWidth / 2;
      view.scrollTop = o.y + (n.y + n.h / 2) * scale - view.clientHeight / 2;
    }
    function fit(minScale = 0.3) {
      if (!view.clientWidth) return;
      scale = Math.max(minScale, Math.min(1, (view.clientWidth - 8) / size.W, (maxViewH() - 8) / size.H));
      applyScale();
      centerOn(tree);
    }
    // 展开/收起后让被点的节点留在原来的屏幕位置
    function toggle(n) {
      let o = origin();
      const px = o.x + n.x * scale - view.scrollLeft, py = o.y + n.y * scale - view.scrollTop;
      n.collapsed = !n.collapsed;
      render();
      o = origin();
      view.scrollLeft = o.x + n.x * scale - px;
      view.scrollTop = o.y + n.y * scale - py;
    }
    function setAll(collapsed) {
      walk(tree, (n) => { if (n.children?.length && n.depth > 0) n.collapsed = collapsed; });
      render();
      centerOn(tree);
    }

    $(".mm-tools", host).addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "in") zoom(scale * 1.2);
      else if (act === "out") zoom(scale / 1.2);
      else if (act === "reset") zoom(1);
      else if (act === "fit") fit();
      else if (act === "expand") setAll(false);
      else if (act === "collapse") setAll(true);
    });

    // 鼠标拖动平移（移动超过几像素才算拖动，不影响点击节点）
    let drag = null, dragged = false;
    view.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, sl: view.scrollLeft, st: view.scrollTop, moved: false };
    });
    view.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 4) {
        drag.moved = true;
        view.setPointerCapture(e.pointerId);
        view.classList.add("dragging");
      }
      if (drag.moved) { view.scrollLeft = drag.sl - dx; view.scrollTop = drag.st - dy; }
    });
    const endDrag = () => {
      if (drag?.moved) { dragged = true; setTimeout(() => (dragged = false)); }
      drag = null;
      view.classList.remove("dragging");
    };
    view.addEventListener("pointerup", endDrag);
    view.addEventListener("pointercancel", endDrag);
    view.addEventListener("wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const r = view.getBoundingClientRect();
      zoom(scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    view.addEventListener("click", (e) => {
      if (dragged) return;
      const t = e.target.closest("[data-toggle]");
      if (t) { toggle(byId[t.dataset.toggle]); return; }
      const g = e.target.closest(".mm-node");
      if (!g) return;
      const n = byId[g.dataset.id];
      if (n.href) location.hash = n.href;
      else if (n.children?.length && n.depth > 0) toggle(n);
    });

    // 初次显示：宽度放不下时适当缩小（不小于 75%，保证字看得清），再把根节点放到中间
    // 容器还看不见（比如在收起的 <details> 里）时宽度是 0，等显示出来再调 show()
    let shown = false;
    function show() {
      if (shown || !view.clientWidth) return;
      shown = true;
      scale = Math.max(0.75, Math.min(1, (view.clientWidth - 8) / size.W));
      applyScale();
      centerOn(tree);
    }
    render();
    show();
    return { fit, show };
  }

  return { mount };
})();
