// 长篇阅读器：原著全文、我的读物（导入的）、VOA 慢速英语、维基百科都用它，按章节阅读
// 路由：#/book/<id> 介绍和目录（只有一篇的直接打开正文）· #/book/<id>/<章> 读某一章（从 1 开始）
// id：原著用书的 id（oz）· 导入的 imp-123 · VOA 的 voa-123 · 内置维基 wiki-<slug> · 在线打开的维基 wikilive-<标题>
// 书目都在启动时加载的小文件里；正文在打开时才加载（data/books/<id>.js、data/voa_text.js、data/wiki_text.js，导入的从 Python 端取）
const BOOK_LEVEL_BADGE = { 较易: "good", 中等: "info", 较难: "warn" };
const READ_WPM = 150; // 估算阅读时间用的阅读速度（词 / 分钟）
const DOC_KIND = {
  book: { badge: "原著全文", cat: "books" },
  import: { badge: "我的读物", cat: "mine" },
  voa: { badge: "VOA 慢速英语", cat: "voa" },
  wiki: { badge: "维基百科", cat: "wiki" },
};

const loadedScripts = {};
function loadScript(src) {
  return (loadedScripts[src] ||= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => { delete loadedScripts[src]; reject(new Error("没有找到正文文件")); };
    document.head.appendChild(s);
  }));
}
async function loadBook(id) {
  if (!window.BOOK_TEXT?.[id]) await loadScript(`data/books/${id}.js`);
  return window.BOOK_TEXT[id];
}

const Docs = {
  lib: null,       // 我的读物的书目（从 Python 端取）
  live: new Map(), // 在线打开的维基文章 { id: {meta, paras} }

  async library(force) {
    if (this.lib && !force) return this.lib;
    if (!Store.bridge) return (this.lib = []);
    try { this.lib = (await pywebview.api.library_list()) || []; } catch { this.lib = []; }
    return this.lib;
  },

  voaMeta(a) {
    return { id: `voa-${a.id}`, kind: "voa", title: a.title, author: "VOA Learning English", year: a.date, level: a.level, words: a.words,
      chapters: [[a.title, a.words]], intro: `${a.section} · ${a.date}`, audio: a.audio, url: a.url, section: a.section, glossary: a.glossary,
      license: "公有领域（美国政府作品）", source: "VOA Learning English" };
  },
  wikiMeta(a, id = `wiki-${a.id}`) {
    return { id, kind: "wiki", title: a.title, author: "Simple English Wikipedia", level: a.level || "", words: a.words,
      chapters: [[a.title, a.words]], intro: a.topic || "", url: a.url, license: a.license, source: "Simple English Wikipedia" };
  },

  // 同步取书目（导入的需要先 await library()）
  metaSync(id) {
    if (id.startsWith("voa-")) { const a = VOA_INDEX.find((x) => `voa-${x.id}` === id); return a && this.voaMeta(a); }
    if (id.startsWith("wikilive-")) return this.live.get(id)?.meta;
    if (id.startsWith("wiki-")) { const a = WIKI_INDEX.find((x) => `wiki-${x.id}` === id); return a && this.wikiMeta(a); }
    if (id.startsWith("imp-")) { const m = (this.lib || []).find((x) => x.id === id); return m && { ...m, kind: "import", level: "" }; }
    const b = BOOK_SHELF.find((x) => x.id === id);
    return b && { ...b, kind: "book" };
  },
  async meta(id) {
    if (id.startsWith("imp-") && !this.metaSync(id)) await this.library(true);
    return this.metaSync(id);
  },

  // 正文：[[章节标题, [段落, ...]], ...]
  async text(meta) {
    const id = meta.id;
    if (meta.kind === "book") return loadBook(id);
    if (meta.kind === "voa") { await loadScript("data/voa_text.js"); return [[meta.title, VOA_TEXT[id.slice(4)].paras]]; }
    if (id.startsWith("wikilive-")) return [[meta.title, this.live.get(id).paras]];
    if (meta.kind === "wiki") { await loadScript("data/wiki_text.js"); return [[meta.title, WIKI_TEXT[id.slice(5)]]]; }
    const t = await pywebview.api.library_load(id);
    if (!t?.length) throw new Error("没有找到这份读物的内容，可能已经被删除了");
    return t;
  },
  // VOA 文章的「Words in This Story」词汇表
  async glossary(meta) {
    if (meta.kind !== "voa") return [];
    await loadScript("data/voa_text.js");
    return VOA_TEXT[meta.id.slice(4)].glossary || [];
  },
};

const bookRec = (id) => ((Store.data.books ||= {})[id] ||= { last: 0, done: {}, pos: {} });
const readTime = (words) => (words < READ_WPM * 60 ? `约 ${Math.max(1, Math.round(words / READ_WPM))} 分钟` : `约 ${Math.round(words / READ_WPM / 6) / 10} 小时`);

// 难度：统一换算成大致的欧框等级 1=A2 2=B1 3=B2 4=C1（导入的读物没有难度，返回 null）
// 短文按「初级 / 中级」，名著按「较易 / 中等 / 较难」（名著整体偏难，往上算一级），VOA 和维基按句长估的「较易 / 中等 / 较难」
const CEFR = ["", "A2", "B1", "B2", "C1"];
function levelOf(x) {
  if (x.kind === "import") return null;
  if (x.kind === "book") return { 较易: 2, 中等: 3, 较难: 4 }[x.level] || 3;
  if (x.kind === "voa" || x.kind === "wiki") return { 较易: 1, 中等: 2, 较难: 3 }[x.level] || 2;
  return { 初级: 1, 中级: 2 }[x.level] || 2;
}
const levelBadge = (x) => {
  const n = levelOf(x);
  return n ? `<span class="badge lv-${n}" title="大致相当于欧框 ${CEFR[n]} 水平">${CEFR[n]}</span>` : "";
};

// 插图（data/doc_images.js）：{读物 id: [{src, cap, credit, ch, p}]}，p 是插在第几段之前
const docImages = (id, ch) => ((window.DOC_IMAGES || {})[id] || []).filter((x) => ch === undefined || x.ch === ch);
function figureHtml(x) {
  return `<figure class="doc-fig" data-zoom="${esc(x.src)}"><img src="${esc(x.src)}" alt="" loading="lazy">
    <figcaption>${x.cap ? `<span class="en">${esc(x.cap)}</span>` : ""}<span class="faint">📷 ${esc(x.credit)}</span></figcaption></figure>`;
}
document.addEventListener("click", (e) => {
  const f = e.target.closest?.("[data-zoom]");
  if (!f || e.target.closest("button")) return;
  const m = modal(`<img class="zoom-img" src="${esc(f.dataset.zoom)}" alt=""><div class="small faint mt-s">${$("figcaption", f)?.innerHTML || ""}</div>`);
  $(".modal", m.root).classList.add("zoom-modal");
  $(".zoom-img", m.root).onclick = m.close;
});

// 卡片：阅读页的原著全文 / 我的读物 / VOA / 维基分类里用
function bookCardHtml(b) {
  const r = (Store.data.books || {})[b.id], done = r ? Object.keys(r.done).length : 0;
  const img = b.kind === "book" || !b.kind ? (window.READING_IMAGES || {})[b.id] : null;
  const many = b.chapters.length > 1;
  const sub = b.kind === "voa" ? `${esc(b.section)} · ${b.year}${b.audio ? " · 🔊 有音频" : ""}`
    : b.kind === "wiki" ? esc(b.intro || "Simple English Wikipedia")
    : b.kind === "import" ? `${b.author ? esc(b.author) + " · " : ""}${esc(b.source)} · ${b.added} 导入`
    : `${esc(b.zh)} · ${esc(b.author)} · ${b.year}`;
  const thumb = b.kind && b.kind !== "book" ? docImages(b.id)[0] : null;
  return `<a class="card book-card ${b.kind && b.kind !== "book" ? "slim" : ""}" href="#/book/${encodeURIComponent(b.id)}">
    ${thumb ? `<div class="doc-thumb"><img src="${esc(thumb.src)}" alt="" loading="lazy"></div>` : b.kind && b.kind !== "book" ? "" : img ? `<div class="book-cover"><img src="${img.src}" alt="" loading="lazy"></div>` : `<div class="book-cover plain"><span>${esc(b.title)}</span></div>`}
    <div class="book-info">
      <div class="row">${levelBadge({ ...b, kind: b.kind || "book" })}
        <span class="small faint">${many ? `${b.chapters.length} 章 · ` : ""}${b.words.toLocaleString()} 词 · ${readTime(b.words)}</span>
        <span class="spacer"></span>${!many && done ? `<span class="badge good">✓ 读过</span>` : ""}
        ${b.kind === "import" ? `<button class="btn sm ghost" data-del-doc="${b.id}" title="删除">✕</button>` : ""}</div>
      <h3 class="mt-s" style="font-family:var(--font-en)">${esc(b.title)}</h3>
      <div class="small muted">${sub}</div>
      ${many && done ? `<div class="bar mt-s" style="height:4px"><i style="width:${(done / b.chapters.length) * 100}%"></i></div><div class="small faint mt-s">已读 ${done} / ${b.chapters.length} 章</div>` : ""}
    </div></a>`;
}

App.pages.book = {
  async render(root, params, signal) {
    const meta = await Docs.meta(params[0] || "");
    if (signal.aborted) return;
    if (!meta) { toast("没有找到这篇读物"); Router.go("reading"); return; }
    const n = +params[1];
    // 只有一篇（VOA、维基、没分章的导入文章）就直接打开正文
    if (meta.chapters.length === 1) return this.chapter(root, meta, 1, signal);
    if (n >= 1 && n <= meta.chapters.length) return this.chapter(root, meta, n, signal);
    this.overview(root, meta);
  },

  overview(root, b) {
    const r = bookRec(b.id), done = Object.keys(r.done).length;
    const img = b.kind === "book" ? (window.READING_IMAGES || {})[b.id] : null;
    const simple = b.kind === "book" && READING_EXTRA.find((p) => p.id === b.id);
    const next = r.last || 1;
    const back = `#/reading/cat/${DOC_KIND[b.kind].cat}`;
    root.innerHTML = `
      <a class="back-link" href="${back}">‹ 返回阅读</a>
      <div class="card book-head">
        ${img ? `<div class="book-cover big"><img src="${img.src}" alt=""></div>` : `<div class="book-cover plain big"><span>${esc(b.title)}</span></div>`}
        <div class="book-meta">
          <div class="row">${levelBadge({ ...b, kind: b.kind || "book" })}<span class="badge">${DOC_KIND[b.kind].badge}</span></div>
          <div class="page-title mt-s" style="font-family:var(--font-en)">${esc(b.title)}</div>
          <div class="muted">${b.kind === "book" ? `${esc(b.zh)} · ${esc(b.author)} · ${b.year}` : `${b.author ? esc(b.author) + " · " : ""}${esc(b.source || "")}${b.added ? ` · ${b.added} 导入` : ""}`}</div>
          ${b.intro ? `<p class="mt-s">${esc(b.intro)}</p>` : ""}
          <div class="small faint">${b.chapters.length} 章 · ${b.words.toLocaleString()} 词 · ${readTime(b.words)}${docImages(b.id).length ? ` · 🖼️ ${docImages(b.id).length} 幅原版插画` : ""}</div>
          <div class="row mt">
            <a class="btn primary lg" href="#/book/${b.id}/${next}">${r.last ? `继续阅读第 ${next} 章` : "开始阅读"}</a>
            ${simple ? `<a class="btn soft" href="#/reading/${simple.id}">先读中英对照的简读版</a>` : ""}
            ${b.kind === "import" && Store.bridge && !Store.remote ? `<span class="spacer"></span><button class="btn ghost" id="del-doc">🗑️ 删除</button>` : ""}
          </div>
          ${done ? `<div class="bar mt" style="height:6px"><i style="width:${(done / b.chapters.length) * 100}%"></i></div><div class="small faint mt-s">已读 ${done} / ${b.chapters.length} 章</div>` : ""}
        </div>
      </div>
      <div class="card"><div class="card-title">📑 目录</div>
        <div class="toc">${b.chapters.map(([t, w], i) => `
          <a class="toc-item ${r.done[i + 1] ? "done" : ""} ${r.last === i + 1 ? "current" : ""}" href="#/book/${b.id}/${i + 1}">
            <span class="toc-mark">${r.done[i + 1] ? "✓" : r.last === i + 1 ? "▶" : i + 1}</span><span class="toc-title">${esc(t)}</span><span class="small faint">${w.toLocaleString()} 词</span></a>`).join("")}</div>
      </div>
      <p class="small faint">${b.kind === "book" ? "原著均已进入公有领域。" : "只保存在你的电脑上。"}全文只有英文：点单词查释义，选中句子可以查看释义、收藏或高亮${AI.enabled ? "，每段的「译」可以让 AI 翻译" : "；开启 AI 后可以逐段翻译"}。</p>`;
    const del = $("#del-doc", root);
    if (del) del.onclick = () => this.remove(b);
  },

  async remove(b) {
    if (!(await confirmBox("删除读物", `确定从「我的读物」里删除《${b.title}》吗？`, "删除", true))) return;
    await pywebview.api.library_delete(b.id);
    delete (Store.data.books || {})[b.id];
    Store.save();
    await Docs.library(true);
    toast("已删除");
    Router.go("reading/cat/mine");
  },

  async chapter(root, b, n, signal) {
    root.innerHTML = `<div class="card empty"><div class="big">📖</div>正在打开《${esc(b.zh || b.title)}》…</div>`;
    let text, glossary;
    try { [text, glossary] = await Promise.all([Docs.text(b), Docs.glossary(b)]); }
    catch (e) { root.innerHTML = `<div class="card empty"><div class="big">😕</div>${esc(e.message)}</div>`; return; }
    if (signal.aborted) return;
    const [title, paras] = text[n - 1];
    const r = bookRec(b.id);
    r.last = n;
    Store.save();
    const P = Store.prefs;
    P.book_font ||= 18;
    const total = b.chapters.length, single = total === 1;
    const figs = docImages(b.id, n).map((x) => ({ ...x, p: Math.min(x.p, paras.length - 1) }));
    const listHref = `#/reading/cat/${DOC_KIND[b.kind].cat}`;

    root.innerHTML = `
      <a class="back-link" href="${single ? listHref : `#/book/${b.id}`}">‹ ${single ? `返回${DOC_KIND[b.kind].badge}` : `${esc(b.title)} · 目录`}</a>
      <div class="page-head"><div>
        <div class="small muted">${single ? `${b.level ? b.level + " · " : ""}${esc(b.intro || b.source || "")}` : `${esc(b.zh || b.title)} · 第 ${n} / ${total} 章`}</div>
        <div class="page-title" style="font-family:var(--font-en)">${esc(title || b.title)}</div>
        <div class="page-sub">${b.chapters[n - 1][1].toLocaleString()} 词 · ${readTime(b.chapters[n - 1][1])} · 点单词查释义，选中文字可以高亮、收藏</div></div>
        <div class="row">
          ${switchHtml("zh-switch", "中文译文", P.read_zh && AI.enabled, AI.enabled ? "滚到哪段翻译哪段，译过的会存在本机" : "需要先在设置里接入 AI")}
          <button class="btn soft" id="read-all">🔊 朗读${single ? "全文" : "本章"}</button>
          <button class="btn" id="vocab">📝 ${single ? "生词" : "本章生词"}</button>
          <span class="font-btns"><button class="btn sm ghost" data-font="-1" title="字小一点">A-</button><button class="btn sm ghost" data-font="1" title="字大一点">A+</button></span>
        </div></div>
      ${b.audio ? `<div class="card doc-audio"><span class="small muted">🎧 VOA 原声朗读（需要联网）</span><audio controls preload="none" src="${esc(b.audio)}"></audio></div>` : ""}
      <div class="card reader book-reader" id="reader" style="font-size:${P.book_font}px">${paras.map((en, i) => `
        ${figs.filter((x) => x.p === i).map(figureHtml).join("")}
        <div class="para" data-i="${i}" data-text="${esc(en)}">
          <span class="para-tools"><button class="btn sm ghost" data-say="${esc(en)}">🔊</button>${AI.enabled ? `<button class="btn sm ghost" data-tr="${i}">译</button>` : ""}</span>
          <span class="para-en">${wrapWords(en)}</span>
          <div class="para-zh hidden"></div>
        </div>`).join("")}
      </div>
      ${glossary.length ? `<div class="card"><div class="card-title">📝 Words in This Story <span class="small faint" style="font-weight:400">VOA 编辑整理的本文词汇</span></div>
        ${glossary.map(([w, d]) => `<div class="row vocab-item"><b class="en">${esc(w)}</b><span class="muted small" style="flex:1">${esc(d)}</span>${speakBtn(w, "sm")}
          <button class="star ${inNotebook(w) ? "on" : ""}" data-gw="${esc(w)}" data-gd="${esc(d)}" title="加入生词本">★</button></div>`).join("")}</div>` : ""}
      <div class="card" id="hl-card"></div>
      ${b.url ? `<p class="small faint doc-source">来源：${esc(b.source)}${b.kind === "wiki" ? `「${esc(b.title)}」，作者见页面编辑历史` : ""} · ${esc(b.license)} ·
        <a href="${esc(b.url)}" target="_blank" rel="noopener">查看原文</a>${b.kind === "voa" ? " · 文字为美国之音制作，图片未收录" : ""}</p>` : ""}
      <div class="row book-nav">
        ${n > 1 ? `<a class="btn ghost" href="#/book/${b.id}/${n - 1}">‹ 上一章</a>` : "<span></span>"}
        <span class="spacer"></span>
        <button class="btn primary lg" id="done">${r.done[n] ? "✓ 已读完" : "✓ 读完了"}${n < total ? "，下一章 →" : single ? "，返回列表" : ""}</button>
      </div>`;
    // 词汇表里的词收进生词本：词书里有的用词书的词条，没有的用 VOA 给的释义
    root.addEventListener("click", (e) => {
      const s = e.target.closest("[data-gw]");
      if (s) s.classList.toggle("on", toggleNotebook(lookupWord(s.dataset.gw) || { w: s.dataset.gw, ph: "", m: s.dataset.gd }));
    });

    const reader = $("#reader", root);
    bindWordClicks(reader);
    // 高亮沿用阅读页的实现：每章当成一篇「文章」存
    App.pages.reading.highlights(root, reader, { id: `book-${b.id}-${n}`, paragraphs: paras.map((p) => [p, ""]) });

    // 回到上次读到的位置（按段落记）
    const pos = r.pos[n];
    if (pos) $(`.para[data-i="${pos}"]`, reader)?.scrollIntoView({ block: "start" });
    const view = $("#view");
    let t = 0;
    view.addEventListener("scroll", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const top = view.getBoundingClientRect().top;
        const first = $$(".para", reader).find((p) => p.getBoundingClientRect().bottom > top + 60);
        if (first) { r.pos[n] = +first.dataset.i; Store.save(); }
      }, 400);
    }, { signal });

    $("#done", root).onclick = () => {
      if (!r.done[n]) { r.done[n] = today(); addXP(Math.min(20, 5 + Math.round(b.chapters[n - 1][1] / 400))); }
      delete r.pos[n];
      Store.save();
      if (single) { Router.go(listHref.slice(2)); return; }
      Router.go(n < total ? `book/${b.id}/${n + 1}` : `book/${b.id}`);
      if (n === total) toast(`🎉 读完了《${b.zh || b.title}》！`, "good", 4000);
    };

    $$("[data-font]", root).forEach((btn) => (btn.onclick = () => {
      P.book_font = Math.min(24, Math.max(14, P.book_font + +btn.dataset.font * 2));
      reader.style.fontSize = P.book_font + "px";
      Store.save();
    }));

    // AI 逐段翻译：译过的段落存在电脑上的 AI 缓存里，下次打开不用再译
    const trKey = (i) => `${b.id}:${n}:${i}`;
    const translate = async (i, zh) => {
      const c = await KV.get("tr_book", trKey(i));
      if (c) { zh.textContent = c; return; }
      zh.innerHTML = aiLoading("翻译中…");
      const res = await AI.ask(`You translate English into natural, faithful Chinese for learners. The text is from "${b.title}"${b.author ? ` by ${b.author}` : ""}. Reply with only the Chinese translation.`, paras[i]);
      if (!zh.isConnected) return;
      if (!res.ok) { zh.innerHTML = aiError(res.error); return; }
      const t = res.text.trim();
      KV.set("tr_book", trKey(i), t);
      zh.textContent = t;
    };
    reader.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tr]");
      if (!btn) return;
      const zh = $(".para-zh", btn.closest(".para"));
      if (!zh.classList.contains("hidden")) { zh.classList.add("hidden"); return; }
      zh.classList.remove("hidden");
      if (!zh.textContent.trim()) translate(+btn.dataset.tr, zh);
    });

    // 中文译文开关：打开后滚到哪段翻译哪段（同时最多译两段）
    let io = null, queue = [], busy = 0;
    const pump = () => {
      while (busy < 2 && queue.length) {
        const para = queue.shift();
        busy++;
        translate(+para.dataset.i, $(".para-zh", para)).finally(() => { busy--; pump(); });
      }
    };
    const applyZh = () => {
      io?.disconnect();
      queue = [];
      const on = !!P.read_zh && AI.enabled;
      $$(".para-zh", reader).forEach((z) => z.classList.toggle("hidden", !on));
      if (!on) return;
      io = new IntersectionObserver((es) => es.forEach((x) => {
        if (!x.isIntersecting) return;
        io.unobserve(x.target);
        if (!$(".para-zh", x.target).textContent.trim()) { queue.push(x.target); pump(); }
      }), { root: $("#view"), rootMargin: "400px 0px" });
      $$(".para", reader).forEach((p) => io.observe(p));
    };
    $("#zh-switch", root).onchange = (e) => {
      if (e.target.checked && !AI.enabled) {
        e.target.checked = false;
        toast("原著、VOA、维基和导入的读物没有现成的中文，要用 AI 翻译。请先在「设置」里接入 AI。", "", 4500);
        return;
      }
      P.read_zh = e.target.checked;
      Store.save();
      applyZh();
    };
    applyZh();
    signal.addEventListener("abort", () => io?.disconnect());

    // 逐段朗读：从上次读到的段落开始，可以暂停、跳段、调速、关闭
    readAloud(reader, $("#read-all", root), signal, () => r.pos[n] || 0);

    $("#vocab", root).onclick = () => this.vocab(paras, title);
  },

  // 本章生词：出现在四六级、雅思、托福词书里、还没学过的词，按在本章出现的次数排
  vocab(paras, title) {
    const count = new Map();
    paras.forEach((p) => tokens(p).forEach((w) => {
      const d = lookupWord(w);
      if (d && ["cet4", "cet6", "ielts", "toefl"].includes(d.book) && !Store.data.words[d.w] && d.w.length > 3) count.set(d, (count.get(d) || 0) + 1);
    }));
    const list = [...count].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([d]) => d);
    const m = modal(`<h3>📝 本章生词 <span class="small faint" style="font-weight:400">${esc(title)}</span></h3>
      <p class="small muted" style="margin-top:-4px">本章里出现的四六级、雅思、托福词汇中还没学过的，按出现次数排序。点 ★ 收进生词本。</p>
      <div class="vocab-list">${list.length ? list.map((d) => `<div class="row vocab-item"><b class="en">${esc(d.w)}</b><span class="faint small">${esc(d.ph || "")}</span>
        <span class="muted small" style="flex:1">${esc(shortMeaning(d))}</span>${speakBtn(d.w, "sm")}<button class="star ${inNotebook(d.w) ? "on" : ""}" data-w="${esc(d.w)}">★</button></div>`).join("")
        : `<div class="muted">这一章里的考试词你都学过了 👍</div>`}</div>
      <div class="modal-actions">${list.length ? `<button class="btn soft" id="star-all">全部加入生词本</button>` : ""}<button class="btn primary" data-close>好的</button></div>`);
    $(".modal", m.root).classList.add("vocab-modal");
    m.root.addEventListener("click", (e) => {
      const s = e.target.closest("[data-w]");
      if (s) s.classList.toggle("on", toggleNotebook(WORD_MAP[s.dataset.w.toLowerCase()]));
    });
    const all = $("#star-all", m.root);
    if (all) all.onclick = () => {
      const add = list.filter((d) => !inNotebook(d.w));
      add.forEach((d) => Store.data.notebook.unshift({ w: d.w, ph: d.ph || "", m: d.m || "", ex: d.ex || "", zh: d.zh || "", added: today() }));
      Store.save();
      $$("[data-w]", m.root).forEach((s) => s.classList.add("on"));
      toast(`已加入 ${add.length} 个词 ⭐`, "good");
      renderNav();
    };
  },
};
