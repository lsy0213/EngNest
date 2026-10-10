// 我的书架：阅读页的「📚 我的书架」分类，也是有书时打开阅读页的第一屏
// 上面是「继续阅读」和最近读过的；下面是一层层木板，书脊立在上面：厚薄按词数，颜色可以自己换，
// 最近读的那本夹着丝带书签，书签垂下来的长度就是读到的进度。点一本把它抽出来看封面和进度，轻点封面继续读
// 书架上有：导入的读物（一直在）、读过的多章节的书（第一次打开时自动放上来）、在卡片上点了「＋ 书架」的任何读物
// 进度在 Store.data.books[id]（见 book.js 的 bookRec）：last 读到第几章 · done 读完的章 · pos 每章读到第几段
//   pf 当前这章读到的比例 · t 最近一次打开的时间 · shelf 放上书架的时间（0 = 拿下来了，不再自动放回）· color 书脊颜色
//   sec 累计读了多少秒 · lk 读的时候点过的词 {词: [第几章, 第几段, 点了几次]}
// 书可以拖动换位置（手机上长按再拖，键盘 Alt + ←/→）：顺序存在 prefs.shelf_order，排序方式变成「我自己摆的顺序」
// 每天读了多少秒记在 days[日期].rs，每天的阅读目标（分钟）是 prefs.read_goal
const SPINE_COLORS = [ // [布面颜色, 字和烫金线的颜色]
  ["#C88A9C", "#46202C"], ["#E6E3DD", "#3A3A3A"], ["#7B2230", "#E8C98A"], ["#9DCCAA", "#21412C"],
  ["#E8B9C0", "#5A2A33"], ["#6F8C76", "#F1E8CF"], ["#B6C98F", "#33421E"], ["#ECE3EA", "#4B3A4A"],
  ["#1F2B4E", "#E3CF95"], ["#8FC3CF", "#1F3E48"], ["#2E4A55", "#E6D7A6"], ["#E8D8A0", "#4A3B12"],
  ["#D9A47F", "#4A2A15"], ["#3B3E56", "#E7DDBF"],
];
const SHELF_TABS = [["all", "全部"], ["reading", "在读"], ["want", "想读"], ["done", "读完"], ["import", "导入的"]];
const SHELF_SORTS = [["custom", "我自己摆的顺序"], ["recent", "最近读的在前"], ["added", "最近放上的在前"], ["title", "按书名"], ["color", "按颜色"], ["thick", "厚的在前"]];
const SHELF_MAX_FILE = 14 * 1024 * 1024; // 网页上传的文件大小上限（转成 base64 后要能装进 20 MB 的请求）
const READ_GOALS = [5, 10, 15, 20, 30, 45, 60]; // 每天阅读目标可选的分钟数

const SHELF_DECO = {
  plant: `<svg viewBox="0 0 60 92" aria-hidden="true"><path d="M15 60h30l-4 30H19z" fill="#C7744E"/><rect x="12" y="56" width="36" height="7" rx="2" fill="#B5643F"/>
    <g fill="#6E9A6A"><ellipse cx="30" cy="30" rx="6" ry="21"/><ellipse cx="18" cy="40" rx="5" ry="15" transform="rotate(-38 18 40)"/><ellipse cx="42" cy="40" rx="5" ry="15" transform="rotate(38 42 40)"/></g>
    <g fill="#8DB585"><ellipse cx="22" cy="24" rx="4" ry="13" transform="rotate(-16 22 24)"/><ellipse cx="38" cy="26" rx="4" ry="13" transform="rotate(18 38 26)"/></g></svg>`,
  candle: `<svg viewBox="0 0 40 110" aria-hidden="true"><ellipse cx="20" cy="104" rx="14" ry="4" fill="#B08A3E"/><path d="M17 104 18 80h4l1 24z" fill="#C9A24E"/>
    <ellipse cx="20" cy="80" rx="9" ry="3" fill="#C9A24E"/><rect x="15" y="36" width="10" height="44" rx="1.5" fill="#F4EFE4"/>
    <path class="flame" d="M20 19c4 7 4 12 0 15-4-3-4-8 0-15z" fill="#F2B544"/><path d="M20 32v5" stroke="#3A2A1A" stroke-width="1"/></svg>`,
};

const Shelf = {
  open: null, // 抽出来的那本的 id

  hash(s) { let h = 7; for (const c of String(s)) h = (h * 31 + c.codePointAt(0)) | 0; return Math.abs(h); },
  rec(id) { return (Store.data.books || {})[id]; },
  color(meta) {
    const r = this.rec(meta.id);
    return SPINE_COLORS[(r?.color ?? this.hash(meta.id)) % SPINE_COLORS.length];
  },

  // 在不在书架上：导入的一直在；手动放上 / 读过自动放上的在；以前版本读过、还没有 shelf 字段的多章节书也算
  on(meta) {
    if (meta.kind === "import") return true;
    const r = this.rec(meta.id);
    return !!r && (r.shelf > 0 || (r.shelf === undefined && r.last > 0 && meta.chapters.length > 1));
  },
  // 读到百分之几：读完的章按词数算，再加上当前这章读到的比例
  pct(meta) {
    const r = this.rec(meta.id);
    if (!r) return 0;
    const ch = meta.chapters, total = meta.words || ch.reduce((n, c) => n + c[1], 0) || 1;
    let w = 0;
    ch.forEach(([, n], i) => { if (r.done[i + 1]) w += n; });
    if (r.last && !r.done[r.last] && r.pf) w += (ch[r.last - 1]?.[1] || 0) * r.pf;
    return Math.min(1, w / total);
  },
  status(meta) {
    const r = this.rec(meta.id);
    if (r && Object.keys(r.done).length >= meta.chapters.length) return "done";
    return r && (r.t || r.last) ? "reading" : "want";
  },
  // 读物 → 列表里用的一项（书目查不到的，比如已经删掉的导入读物、关掉的在线维基文章，返回 null）
  item(id) {
    const meta = Docs.metaSync(id);
    return meta ? { meta, r: this.rec(id), st: this.status(meta), pct: this.pct(meta) } : null;
  },
  items() {
    const ids = new Set([...(Docs.lib || []).map((m) => m.id), ...Object.keys(Store.data.books || {})]);
    return [...ids].map((id) => this.item(id)).filter((x) => x && this.on(x.meta));
  },
  // 最近打开过的（书架上的和单篇的 VOA、维基都算）
  recent(n = 6) {
    return Object.entries(Store.data.books || {}).filter(([, r]) => r.t).sort((a, b) => b[1].t - a[1].t)
      .map(([id]) => this.item(id)).filter(Boolean).slice(0, n);
  },

  // 打开某一章时（book.js）：记下时间和这章读到的位置；第一次读多章节的书就放上书架
  touch(meta, n, frac) {
    const r = bookRec(meta.id);
    r.t = Date.now();
    r.pf = frac;
    if (r.shelf === undefined && meta.chapters.length > 1) r.shelf = r.t;
  },
  toggle(meta) {
    const r = bookRec(meta.id), on = !this.on(meta);
    r.shelf = on ? Date.now() : 0;
    Store.save();
    return on;
  },
  // 封面上的作者：没有作者的导入读物不写文件名
  byline(meta) { return meta.author || (meta.kind === "import" && /\.\w{2,5}$/.test(meta.source || "") ? "" : meta.source || ""); },
  href(meta) {
    const r = this.rec(meta.id);
    return meta.chapters.length > 1 && r?.last ? `#/book/${encodeURIComponent(meta.id)}/${r.last}` : `#/book/${encodeURIComponent(meta.id)}`;
  },
  ago(t) {
    const m = (Date.now() - t) / 6e4;
    if (m < 2) return "刚刚";
    if (m < 60) return `${Math.round(m)} 分钟前`;
    if (m < 60 * 24) return `${Math.round(m / 60)} 小时前`;
    const d = Math.round(m / 60 / 24);
    return d === 1 ? "昨天" : d < 30 ? `${d} 天前` : fmtDate(new Date(t));
  },
  where(x) {
    const { meta, r } = x, total = meta.chapters.length;
    if (x.st === "done") return "✓ 读完了";
    if (!r?.last) return total > 1 ? `${total} 章 · 还没开始读` : "还没开始读";
    return total > 1 ? `第 ${r.last} / ${total} 章 · 读到 ${Math.round(x.pct * 100)}%` : `读到 ${Math.round(x.pct * 100)}%`;
  },

  // ---------- 阅读时长 ----------
  goal() { return Store.prefs.read_goal || 15; },
  daySec(date = today()) { return Store.data.days[date]?.rs || 0; },
  // 连续几天读够了目标（今天还没读够的话从昨天算起）
  streak() {
    const ok = (d) => this.daySec(d) >= this.goal() * 60;
    let n = 0, d = today();
    if (!ok(d)) d = addDays(d, -1);
    while (ok(d)) { n++; d = addDays(d, -1); }
    return n;
  },
  dur(sec) {
    const m = Math.round((sec || 0) / 60);
    return m < 1 ? "不到 1 分钟" : m < 60 ? `${m} 分钟` : `${Math.floor(m / 60)} 小时${m % 60 ? ` ${m % 60} 分钟` : ""}`;
  },
  // 阅读器里计时：每 15 秒看一次，页面在前台、90 秒内滚动或点过、或者正在朗读，才算在读
  track(meta, signal) {
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    $("#view").addEventListener("scroll", bump, { passive: true, signal });
    ["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, bump, { signal }));
    const iv = setInterval(() => {
      if (document.hidden || (Date.now() - last > 90e3 && !$(".readbar:not(.hidden):not(.paused)"))) return;
      const r = bookRec(meta.id), d = dayRec(), goal = this.goal() * 60;
      r.sec = (r.sec || 0) + 15;
      d.rs = (d.rs || 0) + 15;
      if (d.rs >= goal && d.rs - 15 < goal) toast(`🎯 今天读够 ${this.goal()} 分钟了！`, "good", 3500);
      Store.save();
    }, 15000);
    signal.addEventListener("abort", () => clearInterval(iv));
  },
  // 读的时候点了哪个词：记下第一次出现的位置和点了几次，读书笔记里列出来
  noteWord(meta, n, p, text) {
    const w = (lookupWord(text)?.w || text).toLowerCase().replace(/[^a-z'-]/g, "");
    if (w.length < 2) return;
    const lk = (bookRec(meta.id).lk ||= {});
    if (lk[w]) lk[w][2]++;
    else if (Object.keys(lk).length < 600) lk[w] = [n, p, 1];
    Store.save();
  },
  hlCount(meta) {
    const HL = Store.data.highlights || {};
    return meta.chapters.reduce((s, _, i) => s + (HL[`book-${meta.id}-${i + 1}`] || []).length, 0);
  },

  // ---------- 读完推荐下一本 ----------
  // 看这本书里每千词查了几次词：查得多就推荐简单一点的，查得少就推荐难一点的；同类的、新手推荐的优先，读完的不推荐
  recommend(meta, k = 3) {
    const r = this.rec(meta.id) || {};
    const read = Math.max(1, (this.pct(meta) || 1) * meta.words / 1000);
    const per = Object.values(r.lk || {}).reduce((s, x) => s + x[2], 0) / read;
    const few = Object.keys(r.lk || {}).length < 3; // 几乎没点过词：可能只是不习惯点词，不据此调整难度
    const adj = few ? 0 : per > 12 ? -1 : per < 3 ? 1 : 0;
    const base = meta.kind === "book" ? levelOf(meta) : Math.min(4, (Store.prefs.read_level || 2) + 1);
    const want = Math.max(2, Math.min(4, base + adj));
    const score = (b) => (levelOf(b) === want ? 4 : Math.abs(levelOf(b) - want) === 1 ? 1 : -3) + (b.cat && b.cat === meta.cat ? 2 : 0)
      + (b.pick ? 0.5 : 0) + (this.rec(b.id)?.last ? -1 : 0) + (this.hash(b.id + today()) % 10) / 20;
    const list = BOOK_SHELF.filter((b) => b.id !== meta.id).map((b) => ({ ...b, kind: "book" }))
      .filter((b) => this.status(b) !== "done").sort((a, b) => score(b) - score(a)).slice(0, k);
    return { per, adj, few, want, list };
  },
  finished(meta) {
    const r = this.rec(meta.id) || {}, rec = this.recommend(meta), nLk = Object.keys(r.lk || {}).length;
    const per = rec.per.toFixed(1);
    const why = rec.few ? "下面几本难度和这本差不多。读的时候多点点不认识的词，下次推荐会更准。" : rec.adj < 0 ? `这本书平均每千词查了 ${per} 次词，读得有点吃力，下一本可以挑简单一点的。`
      : rec.adj > 0 ? `这本书平均每千词只查了 ${per} 次词，读得很轻松，可以挑战难一点的。` : `这本书平均每千词查了 ${per} 次词，难度正合适，下一本挑差不多难度的。`;
    const m = modal(`<h3>🎉 读完了《${esc(meta.zh || meta.title)}》</h3>
      <div class="fin-stats"><div><b>${r.sec ? this.dur(r.sec) : "—"}</b><span>阅读时间</span></div><div><b>${nLk}</b><span>查过的词</span></div><div><b>${this.hlCount(meta)}</b><span>高亮</span></div></div>
      <div class="card-title mt">下一本读什么</div><p class="small muted" style="margin-top:-6px">${why}</p>
      <div class="rec-list">${rec.list.map((b) => { const [bg, ink] = this.color(b); return `<div class="rec-item">
        <a class="desk-book sm" href="#/book/${b.id}" data-close style="--c:${bg};--ink:${ink}" aria-hidden="true" tabindex="-1"><span>${esc(b.title)}</span></a>
        <div class="rec-info"><div class="row">${levelBadge(b)}<b class="rec-title">${esc(b.title)}</b></div>
          <div class="small muted">${esc(b.zh)} · ${esc(b.author)} · ${readTime(b.words)}</div><div class="small faint rec-intro">${esc(b.intro || "")}</div>
          <div class="row mt-s"><a class="btn sm primary" href="#/book/${b.id}" data-close>开始读</a>${this.btnHtml(b)}</div></div></div>`; }).join("")}</div>
      <div class="modal-actions"><a class="btn ghost" href="#/book/${encodeURIComponent(meta.id)}/notes" data-close>📒 看读书笔记</a><span class="spacer"></span><button class="btn primary" data-close>好的</button></div>`);
    $(".modal", m.root).classList.add("fin-modal");
  },

  // 卡片和介绍页上的「＋ 书架」按钮（点击在下面的全局监听里处理）
  btnHtml(meta, cls = "btn sm ghost") {
    const on = this.on(meta);
    return `<button class="${cls} shelf-btn ${on ? "on" : ""}" data-shelf="${esc(meta.id)}" title="${on ? "从我的书架上拿下来" : "放到我的书架上，以后在「我的书架」里找"}">${on ? "✓ 在书架上" : "＋ 书架"}</button>`;
  },

  // 在线搜到的维基文章只在内存里：放上书架时存成一份导入的读物，以后还能打开
  async keepLive(meta) {
    const live = Docs.live.get(meta.id);
    if (!live) return;
    const m = await pywebview.api.library_import_text(meta.title, live.paras.join("\n\n"), "Simple English Wikipedia");
    if (m?.error) { toast(m.error, "bad", 4000); return; }
    await Docs.library(true);
    toast(`已放上书架：《${meta.title}》`, "good");
    Router.go(`book/${m.id}`);
  },

  // ---------- 书脊 ----------
  // 厚薄：大约按词数的对数，几百词的短文是一本薄册子（16px），一万词 40px 左右，十万词以上的长篇最厚（72px）
  width(meta) { return Math.round(Math.max(16, Math.min(72, 14 + 11 * Math.log2(Math.max(1, meta.words / 2000))))); },
  spineHtml(x, w, H, opt = {}) {
    const { meta } = x, [bg, ink] = this.color(meta);
    const h = Math.round(H * (0.8 + (this.hash(meta.id + "h") % 21) / 100));
    const fs = Math.max(9, Math.min(17, Math.round(w * 0.42)));
    const label = `${meta.title}${meta.zh ? `（${meta.zh}）` : ""}，${this.where(x)}`;
    return `<button class="spine ${opt.lean ? "lean" : ""} ${opt.ghost ? "ghost" : ""}" data-spine="${esc(meta.id)}" aria-label="${esc(label)}" title="${esc(meta.title)}${opt.ghost ? "" : "&#10;拖动可以换位置（键盘：Alt + ← / →）"}"
      style="--w:${w}px;--sh:${h}px;--c:${bg};--ink:${ink};--fs:${fs}px">
      <span class="spine-title">${esc(meta.title)}</span>${opt.ribbon ? `<i class="spine-ribbon" style="--p:${x.pct.toFixed(3)}"></i>` : ""}</button>`;
  },
  coverHtml(x, cw, ch, cx) {
    const { meta } = x, [bg, ink] = this.color(meta);
    const img = meta.kind === "book" ? (window.READING_IMAGES || {})[meta.id] : docImages(meta.id)[0];
    return `<button class="shelf-cover" data-cover="${esc(meta.id)}" style="--cw:${cw}px;--ch:${ch}px;--cx:${cx}px;--c:${bg};--ink:${ink}" aria-label="继续阅读《${esc(meta.title)}》">
      <span class="frame"><span class="cover-title">${esc(meta.title)}</span>
        ${img ? `<span class="cover-plate"><img src="${esc(img.src)}" alt=""></span>` : ""}
        <span class="cover-author">${esc(this.byline(meta))}</span></span></button>`;
  },
  detailHtml(x, ghost) {
    const { meta } = x;
    const sub = meta.kind === "book" ? `${meta.zh} · ${meta.author} · ${meta.year}` : [meta.author, meta.kind === "import" ? `${meta.added} 导入` : DOC_KIND[meta.kind].badge].filter(Boolean).join(" · ");
    return `<div class="shelf-detail">
      <div class="shd-main">
        <div class="shd-title">${esc(meta.title)}</div>
        <div class="shd-sub">${esc(sub)}</div>
        <div class="shd-prog">${esc(this.where(x))}${x.r?.t ? ` · ${this.ago(x.r.t)}读过` : ""}${x.r?.sec ? ` · 读了 ${this.dur(x.r.sec)}` : ""}</div>
        <div class="shd-hint">轻点封面，${x.r?.last ? "继续阅读" : "开始阅读"}</div>
      </div>
      <div class="shd-actions">
        <button class="shd-link" data-put-back>放回书架</button>
        ${ghost ? `<button class="shd-link" data-shelf-add="${esc(meta.id)}">＋ 放上我的书架</button>`
          : `${meta.chapters.length > 1 ? `<a class="shd-link" href="#/book/${encodeURIComponent(meta.id)}">目录</a>` : ""}
            <a class="shd-link" href="#/book/${encodeURIComponent(meta.id)}/notes">读书笔记</a>
            ${x.st === "done" ? `<button class="shd-link" data-recs="${esc(meta.id)}">下一本读什么</button>` : ""}
            <button class="shd-link" data-bind="${esc(meta.id)}">装帧与整理</button>`}
      </div></div>`;
  },

  // ---------- 页面 ----------
  mount(el, signal) {
    const P = Store.prefs;
    P.shelf_tab ||= "all";
    P.shelf_sort ||= "recent";
    this.el = el;
    this.signal = signal;
    el.innerHTML = `<div id="shelf-desk"></div>
      <div class="shelf-head">
        <div class="shelf-tabs" role="tablist"></div><span class="spacer"></span>
        <label class="shelf-sort" title="怎么排"><span aria-hidden="true">⇅</span><select class="select" id="shelf-sort" aria-label="书架排序">${SHELF_SORTS.map(([v, l]) => `<option value="${v}" ${v === P.shelf_sort ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <button class="shelf-add" id="shelf-add" title="导入或添加读物" aria-label="导入或添加读物">＋</button>
      </div>
      <div class="shelf-wall" id="shelf-wall"></div>
      <p class="shelf-tip">拖动书脊可以换位置（手机上长按一下再拖）</p>
      ${this.quoteHtml()}`;
    this.wall = $("#shelf-wall", el);
    $("#shelf-sort", el).onchange = (e) => { P.shelf_sort = e.target.value; Store.save(); this.draw(); };
    $("#shelf-add", el).onclick = () => this.addMenu();
    $(".shelf-tabs", el).onclick = (e) => {
      const t = e.target.closest("[data-stab]");
      if (t) { P.shelf_tab = t.dataset.stab; Store.save(); this.open = null; this.draw(); }
    };
    this.wall.addEventListener("click", (e) => this.onClick(e), { signal });
    el.addEventListener("click", (e) => { if (e.target.closest("[data-rgoal]")) this.goalPicker(); }, { signal });
    this.bindDrag(signal);
    onKey(signal, (e) => { if (e.key === "Escape" && this.open) this.close(); });
    let lastW = 0;
    const ro = new ResizeObserver(() => { const w = this.wall.clientWidth; if (w && w !== lastW) { lastW = w; this.layout(); } });
    ro.observe(this.wall);
    signal.addEventListener("abort", () => ro.disconnect());
    this.draw();
  },

  draw() {
    const all = this.items(), P = Store.prefs;
    const n = (t) => all.filter((x) => t === "all" || (t === "import" ? x.meta.kind === "import" : x.st === t)).length;
    $(".shelf-tabs", this.el).innerHTML = SHELF_TABS.filter(([t]) => t === "all" || t === P.shelf_tab || n(t))
      .map(([t, l]) => `<button class="stab ${t === P.shelf_tab ? "active" : ""}" data-stab="${t}" role="tab" aria-selected="${t === P.shelf_tab}">${l}<small>${n(t)}</small></button>`).join("");
    $("#shelf-desk", this.el).innerHTML = this.deskHtml();
    $("#shelf-sort", this.el).value = P.shelf_sort;
    const chip = $('.chip[data-cat="mine"] .faint'); // 阅读页分类上的数字（导入、拿下书架之后跟着变）
    if (chip) chip.textContent = all.length;
    this.layout();
  },

  // 当前标签下要摆的书，按选的方式排好
  list(t = Store.prefs.shelf_tab) {
    const P = Store.prefs;
    const xs = this.items().filter((x) => t === "all" || (t === "import" ? x.meta.kind === "import" : x.st === t));
    const added = (x) => x.r?.shelf || Date.parse(x.meta.added || 0) || 0;
    const at = new Map((P.shelf_order || []).map((id, i) => [id, i]));
    const by = {
      // 自己摆的顺序：还没摆过的（新放上来的）排在最前面，按放上来的时间
      custom: (a, b) => (at.get(a.meta.id) ?? -1) - (at.get(b.meta.id) ?? -1) || added(b) - added(a),
      recent: (a, b) => (b.r?.t || 0) - (a.r?.t || 0) || added(b) - added(a),
      added: (a, b) => added(b) - added(a),
      title: (a, b) => a.meta.title.replace(/^(the|a|an)\s+/i, "").localeCompare(b.meta.title.replace(/^(the|a|an)\s+/i, "")),
      color: (a, b) => SPINE_COLORS.indexOf(this.color(a.meta)) - SPINE_COLORS.indexOf(this.color(b.meta)),
      thick: (a, b) => b.meta.words - a.meta.words,
    }[P.shelf_sort] || (() => 0);
    return xs.sort(by);
  },

  // 按书架宽度把书一层层摆好；空书架摆「新手先读」的几本（半透明，抽出来可以放上书架）
  layout() {
    const wall = this.wall, W = wall.clientWidth;
    if (!W) return;
    const H = (this.H = W < 560 ? 168 : 216), k = H / 216, inner = W - 16, gap = 3;
    let xs = this.list(), ghost = false, note = "";
    if (!this.items().length) {
      ghost = true;
      xs = BOOK_SHELF.filter((b) => b.pick).map((b) => this.item(b.id));
      note = `书架还是空的。这几本适合第一次读英文原著，点一本抽出来看看；也可以点右上角的 ＋ 导入你自己的书，或者在阅读页任何一篇的卡片上点「＋ 书架」。`;
    } else if (!xs.length) note = { reading: "没有在读的书", want: "没有想读的书：在卡片上点「＋ 书架」就会放到这里", done: "还没有读完的书，加油 📖", import: "还没有导入的读物，点右上角的 ＋ 导入" }[Store.prefs.shelf_tab] || "";
    const latest = this.recent(1)[0]?.meta.id;
    const rows = [];
    let row = [], used = 0;
    for (const x of xs) {
      const w = Math.round(this.width(x.meta) * k);
      if (row.length && used + w > inner) { rows.push({ row, used }); row = []; used = 0; }
      row.push({ x, w });
      used += w + gap;
    }
    if (row.length) rows.push({ row, used });
    while (rows.length < 2) rows.push({ row: [], used: 0 }); // 至少两层，像个真书架
    const last = rows.reduce((i, r, j) => (r.row.length ? j : i), -1);
    wall.style.setProperty("--h", H + "px");
    wall.innerHTML = (note ? `<p class="shelf-note">${esc(note)}</p>` : "") + rows.map(({ row: r, used: u }, i) => {
      const free = inner - u;
      const lean = i === last && r.length > 1 && free > H * 0.22 + 20;
      const deco = free - (lean ? H * 0.2 : 0) > 90 * k ? (i % 2 ? "candle" : "plant") : "";
      return `<div class="shelf-row"><div class="shelf-books">
          ${r.map(({ x, w }, j) => this.spineHtml(x, w, H, { ghost, ribbon: x.meta.id === latest, lean: lean && j === r.length - 1 })).join("")}
          ${deco ? `<span class="shelf-deco deco-${deco}">${SHELF_DECO[deco]}</span>` : ""}
        </div><div class="shelf-plank"></div></div>`;
    }).join("");
    this.ghost = ghost;
    if (this.open && $(`[data-spine="${CSS.escape(this.open)}"]`, wall)) this.pull(this.open);
    else this.open = null;
  },

  // 抽出一本：书脊的位置换成一张封面，下面显示书名、进度和操作
  pull(id) {
    this.close();
    const sp = $(`[data-spine="${CSS.escape(id)}"]`, this.wall), x = this.item(id);
    if (!sp || !x) return;
    const books = sp.parentElement, W = books.clientWidth, H = this.H;
    const cw = Math.min(Math.round(H * 0.72), W - 16), ch = Math.round(H * 0.9);
    const cx = Math.max(4, Math.min(W - cw - 4, Math.round(sp.offsetLeft + sp.offsetWidth / 2 - cw / 2)));
    sp.classList.add("pulled");
    books.insertAdjacentHTML("beforeend", this.coverHtml(x, cw, ch, cx));
    books.parentElement.insertAdjacentHTML("afterend", this.detailHtml(x, this.ghost));
    this.open = id;
    $(".shelf-cover", books).focus({ preventScroll: true });
    const d = $(".shelf-detail", this.wall);
    if (d.getBoundingClientRect().bottom > innerHeight) d.scrollIntoView({ block: "nearest", behavior: "smooth" });
  },
  close() {
    $$(".shelf-cover, .shelf-detail", this.wall).forEach((n) => n.remove());
    $$(".spine.pulled", this.wall).forEach((n) => n.classList.remove("pulled"));
    const id = this.open;
    this.open = null;
    if (id) $(`[data-spine="${CSS.escape(id)}"]`, this.wall)?.focus({ preventScroll: true });
  },

  onClick(e) {
    if (Date.now() - (this.dragged || 0) < 350) return; // 刚拖完松手，不算点击
    const recs = e.target.closest("[data-recs]");
    if (recs) { this.finished(Docs.metaSync(recs.dataset.recs)); return; }
    const sp = e.target.closest("[data-spine]"), cover = e.target.closest("[data-cover]");
    if (cover) { location.hash = this.href(Docs.metaSync(cover.dataset.cover)); return; }
    if (sp) { this.open === sp.dataset.spine ? this.close() : this.pull(sp.dataset.spine); return; }
    if (e.target.closest("[data-put-back]")) { this.close(); return; }
    const add = e.target.closest("[data-shelf-add]");
    if (add) {
      const meta = Docs.metaSync(add.dataset.shelfAdd);
      this.toggle(meta);
      toast(`已放上书架：《${meta.title}》`, "good");
      this.open = meta.id;
      this.draw();
      return;
    }
    const bind = e.target.closest("[data-bind]");
    if (bind) this.binding(Docs.metaSync(bind.dataset.bind));
  },

  // ---------- 拖动换位置 ----------
  // 把 id 挪到 before 前面（before 为空就放到最后）。第一次挪的时候，按现在看到的顺序定下「自己摆的顺序」
  move(id, before) {
    const P = Store.prefs;
    const order = this.list("all").map((x) => x.meta.id).filter((x) => x !== id);
    const i = before ? order.indexOf(before) : -1;
    order.splice(i < 0 ? order.length : i, 0, id);
    const switched = P.shelf_sort !== "custom";
    P.shelf_order = order;
    P.shelf_sort = "custom";
    Store.save();
    if (switched) toast("排序换成了「我自己摆的顺序」，新放上来的书会排在最前面", "", 3500);
    this.draw();
  },
  // 指针在 (x, y) 时放下去会插到哪：离指针最近的那层里，第一本中线在指针右边的书前面
  dropAt(x, y, drag) {
    const rows = $$(".shelf-books", this.wall);
    let row = rows[0], best = Infinity;
    rows.forEach((r) => {
      const b = r.getBoundingClientRect(), d = y < b.top ? b.top - y : y > b.bottom ? y - b.bottom : 0;
      if (d < best) { best = d; row = r; }
    });
    const sps = $$(".spine", row).filter((s) => s.dataset.spine !== drag);
    const hit = sps.find((s) => { const b = s.getBoundingClientRect(); return x < b.left + b.width / 2; });
    if (hit) return { row, before: hit.dataset.spine, x: hit.offsetLeft - 3 };
    const last = sps[sps.length - 1];
    const next = rows.slice(rows.indexOf(row) + 1).map((r) => $$(".spine", r).find((s) => s.dataset.spine !== drag)).find(Boolean);
    return { row, before: next?.dataset.spine || null, x: last ? last.offsetLeft + last.offsetWidth + 1 : 8 };
  },
  bindDrag(signal) {
    const wall = this.wall;
    let st = null;
    const gap = (d) => {
      $(".shelf-gap", wall)?.remove();
      if (d) d.row.insertAdjacentHTML("beforeend", `<i class="shelf-gap" style="left:${d.x}px"></i>`);
    };
    const start = () => {
      st.on = true;
      this.close();
      try { st.el.setPointerCapture(st.pid); } catch { /* 指针已经没了 */ }
      st.el.classList.add("dragging");
      wall.classList.add("dragging");
      navigator.vibrate?.(12);
    };
    const stop = (drop) => {
      if (!st) return;
      clearTimeout(st.timer);
      const s = st;
      st = null;
      wall.classList.remove("dragging");
      if (!s.on) return;
      this.dragged = Date.now();
      gap(null);
      s.el.classList.remove("dragging");
      s.el.style.translate = "";
      if (drop && s.drop) this.move(s.id, s.drop.before);
    };
    wall.addEventListener("pointerdown", (e) => {
      const sp = e.target.closest(".spine");
      if (!sp || this.ghost || e.button !== 0) return;
      st = { id: sp.dataset.spine, el: sp, pid: e.pointerId, x0: e.clientX, y0: e.clientY, touch: e.pointerType !== "mouse", on: false };
      if (st.touch) st.timer = setTimeout(() => st && start(), 380); // 手机上长按再拖，不影响滑动页面
    }, { signal });
    wall.addEventListener("pointermove", (e) => {
      if (!st || e.pointerId !== st.pid) return;
      const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
      if (!st.on) {
        if (st.touch) { if (Math.hypot(dx, dy) > 8) stop(false); return; } // 手指先动了：是在滑动页面
        if (Math.hypot(dx, dy) < 6) return;
        start();
      }
      st.el.style.translate = `${dx}px ${dy - 14}px`;
      st.drop = this.dropAt(e.clientX, e.clientY, st.id);
      gap(st.drop);
    }, { signal });
    wall.addEventListener("pointerup", (e) => { if (st && e.pointerId === st.pid) stop(true); }, { signal });
    wall.addEventListener("pointercancel", () => stop(false), { signal });
    wall.addEventListener("touchmove", (e) => { if (st?.on) e.preventDefault(); }, { passive: false, signal });
    wall.addEventListener("contextmenu", (e) => { if (e.target.closest(".spine")) e.preventDefault(); }, { signal });
    // 键盘：Alt + ← / → 把当前这本往前、往后挪一格
    wall.addEventListener("keydown", (e) => {
      const sp = e.target.closest?.(".spine");
      if (!sp || this.ghost || !e.altKey || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      const ids = this.list().map((x) => x.meta.id), i = ids.indexOf(sp.dataset.spine);
      if (i < 0 || (e.key === "ArrowLeft" ? i === 0 : i === ids.length - 1)) return;
      this.move(sp.dataset.spine, e.key === "ArrowLeft" ? ids[i - 1] : ids[i + 2] ?? null);
      $(`[data-spine="${CSS.escape(sp.dataset.spine)}"]`, wall)?.focus();
    }, { signal });
  },

  // 装帧与整理：换书脊颜色、拿下书架（导入的是删除）
  binding(meta) {
    const cur = SPINE_COLORS.indexOf(this.color(meta));
    const m = modal(`<h3>装帧与整理</h3>
      <div class="small muted">《${esc(meta.title)}》的书脊颜色</div>
      <div class="swatches mt-s">${SPINE_COLORS.map(([bg, ink], i) => `<button class="swatch ${i === cur ? "on" : ""}" data-color="${i}" style="--c:${bg};--ink:${ink}" aria-label="颜色 ${i + 1}"><i></i></button>`).join("")}</div>
      <div class="modal-actions">
        ${meta.kind === "import" ? (Store.bridge ? `<button class="btn ghost" id="shd-del">🗑️ 删除这份读物</button>` : "") : `<button class="btn ghost" id="shd-off">从书架上拿下来</button>`}
        <span class="spacer"></span><button class="btn primary" data-close>好的</button></div>`);
    $(".modal", m.root).classList.add("bind-modal");
    m.root.addEventListener("click", (e) => {
      const s = e.target.closest("[data-color]");
      if (!s) return;
      bookRec(meta.id).color = +s.dataset.color;
      Store.save();
      $$(".swatch", m.root).forEach((b) => b.classList.toggle("on", b === s));
      this.open = meta.id;
      this.layout();
    });
    const off = $("#shd-off", m.root);
    if (off) off.onclick = () => { this.toggle(meta); m.close(); this.open = null; this.draw(); toast("已从书架上拿下来，阅读记录还在"); };
    const del = $("#shd-del", m.root);
    if (del) del.onclick = () => { m.close(); App.pages.book.remove(meta); };
  },

  // ---------- 继续阅读 ----------
  deskHtml() {
    const [cur, ...rest] = this.recent(6);
    if (!cur) return "";
    const { meta } = cur, [bg, ink] = this.color(meta), r = cur.r, total = meta.chapters.length;
    const chTitle = total > 1 && r.last ? meta.chapters[r.last - 1]?.[0] : "";
    return `<div class="shelf-desk">
      <a class="desk-book" href="${this.href(meta)}" style="--c:${bg};--ink:${ink}" aria-hidden="true" tabindex="-1"><span>${esc(meta.title)}</span></a>
      <div class="desk-info">
        <div class="small faint">继续阅读 · ${this.ago(r.t)}</div>
        <div class="desk-title">${esc(meta.title)}</div>
        <div class="small muted">${esc(this.where(cur))}${chTitle ? ` · ${esc(chTitle)}` : ""}</div>
        <div class="bar mt-s" style="height:4px"><i style="width:${cur.pct * 100}%"></i></div>
        <a class="btn primary mt" href="${this.href(meta)}">▶ ${cur.st === "done" ? "再读一遍" : total > 1 && r.last ? `继续读第 ${r.last} 章` : "继续读"}</a>
      </div>
      ${rest.length ? `<div class="desk-recent"><div class="small faint">最近读过</div>
        ${rest.map((x) => `<a class="desk-item" href="${this.href(x.meta)}"><i style="--c:${this.color(x.meta)[0]}"></i>
          <span class="desk-item-t">${esc(x.meta.title)}</span><span class="small faint">${x.st === "done" ? "✓" : `${Math.round(x.pct * 100)}%`}</span></a>`).join("")}</div>` : ""}
      ${this.goalHtml()}
    </div>`;
  },
  goalHtml() {
    const sec = this.daySec(), goal = this.goal(), st = this.streak();
    return `<div class="desk-goal">
      <span>今天读了 <b>${Math.floor(sec / 60)}</b> / ${goal} 分钟${sec >= goal * 60 ? " 🎯" : ""}</span>
      <span class="bar ${sec >= goal * 60 ? "good" : ""}"><i style="width:${Math.min(100, (sec / 60 / goal) * 100)}%"></i></span>
      ${st ? `<span class="small">🔥 连续 ${st} 天读够</span>` : ""}
      <button class="shd-link small" data-rgoal>改目标</button></div>`;
  },
  goalPicker() {
    const m = modal(`<h3>每天读多久</h3><p class="small muted">在阅读器里读的时间才算：页面开着、最近一分半钟里翻过页或点过，或者正在朗读。</p>
      <div class="chips">${READ_GOALS.map((n) => `<button class="chip ${n === this.goal() ? "active" : ""}" data-g="${n}">${n} 分钟</button>`).join("")}</div>
      <div class="modal-actions"><button class="btn" data-close>关闭</button></div>`);
    m.root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-g]");
      if (!b) return;
      Store.prefs.read_goal = +b.dataset.g;
      Store.save();
      m.close();
      if (this.el?.isConnected) this.draw();
    });
  },

  // 首页的「继续阅读」小卡片
  homeHtml() {
    const cur = this.recent(1)[0];
    if (!cur || cur.st === "done") return "";
    const { meta } = cur, [bg, ink] = this.color(meta);
    return `<a class="card home-shelf" href="${this.href(meta)}">
      <span class="desk-book sm" style="--c:${bg};--ink:${ink}" aria-hidden="true"><span>${esc(meta.title)}</span></span>
      <span class="home-shelf-info"><span class="small faint">📖 继续阅读 · ${this.ago(cur.r.t)}</span>
        <b class="desk-title">${esc(meta.title)}</b><span class="small muted">${esc(this.where(cur))} · 今天读了 ${Math.floor(this.daySec() / 60)} / ${this.goal()} 分钟</span>
        <span class="bar" style="height:4px"><i style="width:${cur.pct * 100}%"></i></span></span>
      <span class="btn soft sm">继续 ›</span></a>`;
  },

  // 书架底下的一句名著原文（每天换一句）
  quoteHtml() {
    const qs = READING_EXTRA.filter((p) => p.original && BOOK_SHELF.some((b) => b.id === p.id));
    if (!qs.length) return "";
    const p = qs[Math.floor(Date.parse(today()) / 864e5) % qs.length];
    return `<p class="shelf-quote">${esc(p.original.text)}<span>— ${esc(BOOK_SHELF.find((b) => b.id === p.id).title)}</span></p>`;
  },

  // ---------- 添加：导入文件、粘贴文字、去书库挑 ----------
  addMenu() {
    const can = Store.bridge;
    const m = modal(`<h3>往书架上放书</h3>
      <div class="add-opts">
        ${can ? `<button class="add-opt" data-add="file"><b>📂 导入文件</b><span class="small muted">txt、epub、html，可以一次选好几个</span></button>
        <button class="add-opt" data-add="url"><b>🔗 从网址导入</b><span class="small muted">新闻、博客、外刊文章的链接，自动取出正文</span></button>
        <button class="add-opt" data-add="paste"><b>📋 粘贴文字</b><span class="small muted">外刊文章、网页上复制的文字；PDF 先复制里面的文字</span></button>` : ""}
        <a class="add-opt" href="#/reading/cat/books" data-close><b>📖 去原著书架挑一本</b><span class="small muted">${BOOK_SHELF.length} 本公有领域名著，卡片上点「＋ 书架」</span></a>
      </div>
      <p class="small faint">${can ? "导入的内容只保存在你自己的小窝里（局域网和服务器上每人一份，别人看不到）。请导入你有权使用的内容，比如自己买的电子书、订阅的外刊文章。" : "导入需要在桌面版、局域网或服务器上使用。"}</p>
      <div class="modal-actions"><button class="btn" data-close>关闭</button></div>`);
    $(".modal", m.root).classList.add("add-modal");
    m.root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-add]");
      if (!b) return;
      m.close();
      if (b.dataset.add === "file") this.pickFiles();
      else if (b.dataset.add === "url") this.importUrl();
      else this.paste();
    });
  },

  pickFiles() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".txt,.epub,.html,.htm,.xhtml,text/plain,text/html,application/epub+zip";
    input.onchange = () => this.importFiles([...input.files]);
    input.click();
  },

  async importFiles(files) {
    if (!files.length) return;
    const ok = [], bad = [];
    for (const f of files) {
      if (f.size > SHELF_MAX_FILE) { bad.push(`${f.name}：文件太大了（超过 14 MB）`); continue; }
      toast(`正在导入 ${f.name}…`, "", 1500);
      const b64 = await new Promise((resolve, reject) => {
        const rd = new FileReader();
        rd.onload = () => resolve(String(rd.result).split(",")[1] || "");
        rd.onerror = () => reject(rd.error);
        rd.readAsDataURL(f);
      }).catch(() => null);
      if (b64 === null) { bad.push(`${f.name}：读不了这个文件`); continue; }
      let r;
      try { r = await pywebview.api.library_import_upload(f.name, b64); } catch (e) { r = { error: e.message || String(e) }; }
      if (!r || r.error) bad.push(`${f.name}：${r?.error || "导入失败"}`);
      else ok.push(r);
    }
    await this.imported(ok);
    if (bad.length) toast(bad.join("\n"), "bad", 6000);
  },

  importUrl() {
    const m = modal(`<h3>🔗 从网址导入</h3>
      <div class="field"><label>文章网址</label><input class="input" id="imp-url" type="url" inputmode="url" placeholder="https://…" autocomplete="off"></div>
      <p class="small muted">适合新闻、博客、外刊这类正文就在网页里的文章。要登录才能看的、用脚本加载的网页读不到，可以复制文字后用「粘贴文字」导入。</p>
      <div id="imp-url-st" class="small"></div>
      <div class="modal-actions"><button class="btn" data-close>取消</button><button class="btn primary" id="imp-url-go">导入</button></div>`);
    $(".modal", m.root).classList.add("paste-modal");
    const input = $("#imp-url", m.root), go = $("#imp-url-go", m.root), st = $("#imp-url-st", m.root);
    input.focus();
    const run = async () => {
      const url = input.value.trim();
      if (!/^https?:[/][/][^\s/]+[.][^\s]+/i.test(url)) { st.innerHTML = `<span class="bad">请填一个 http:// 或 https:// 开头的网址</span>`; return; }
      go.disabled = true;
      st.innerHTML = `<span class="muted">正在打开网页、取出正文…</span>`;
      let r;
      try { r = await pywebview.api.library_import_url(url); } catch (e) { r = { error: e.message || String(e) }; }
      if (!m.root.isConnected) return;
      go.disabled = false;
      if (!r || r.error) { st.innerHTML = `<span class="bad">${esc(r?.error || "导入失败")}</span>`; return; }
      m.close();
      this.imported([r]);
    };
    go.onclick = run;
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
  },

  paste() {
    const m = modal(`<h3>📋 粘贴文字</h3>
      <div class="field"><label>标题</label><input class="input" id="imp-title" placeholder="可以不填，默认用第一行"></div>
      <div class="field mt-s"><label>正文（英文）</label><textarea class="input" id="imp-text" rows="12" placeholder="把文章粘贴到这里。空行分段；有 Chapter 1、Chapter 2 这样的标题会自动分章。"></textarea></div>
      <div class="modal-actions"><button class="btn" data-close>取消</button><button class="btn primary" id="imp-go">导入</button></div>`);
    $(".modal", m.root).classList.add("paste-modal");
    $("#imp-text", m.root).focus();
    $("#imp-go", m.root).onclick = async () => {
      const text = $("#imp-text", m.root).value;
      if (!text.trim()) { toast("先粘贴一些文字"); return; }
      const r = await pywebview.api.library_import_text($("#imp-title", m.root).value.trim(), text);
      if (r?.error) { toast(r.error, "bad", 5000); return; }
      m.close();
      this.imported([r]);
    };
  },

  // 导入完：在书架上把新书抽出来给你看
  async imported(list) {
    if (!list.length) return;
    await Docs.library(true);
    toast(list.length === 1 ? `已导入《${list[0].title}》：${list[0].chapters.length} 章、${list[0].words.toLocaleString()} 词` : `已导入 ${list.length} 份读物`, "good", 4000);
    Store.prefs.shelf_tab = "all";
    this.open = list[0].id;
    if (this.el?.isConnected) this.draw();
    else Router.go("reading/cat/mine");
  },
};

// 「＋ 书架」按钮：阅读页卡片、书的介绍页、单篇读物的阅读页
document.addEventListener("click", (e) => {
  const b = e.target.closest?.("[data-shelf]");
  if (!b) return;
  e.preventDefault();
  e.stopPropagation();
  const meta = Docs.metaSync(b.dataset.shelf);
  if (!meta) return;
  if (meta.id.startsWith("wikilive-")) { Shelf.keepLive(meta); return; }
  const on = Shelf.toggle(meta);
  b.classList.toggle("on", on);
  b.textContent = on ? "✓ 在书架上" : "＋ 书架";
  toast(on ? `已放上书架：《${meta.title}》` : "已从书架上拿下来", on ? "good" : "");
  const chip = $('.chip[data-cat="mine"] .faint');
  if (chip) chip.textContent = Shelf.items().length;
}, true);
