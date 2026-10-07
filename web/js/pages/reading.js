// 阅读：文章列表 → 点词查义、逐段翻译、全文朗读、阅读理解；可让 AI 生成新文章
// 长篇和外部来源（原著全文、我的读物、VOA、维基百科）用 book.js 的阅读器打开
// 路由：#/reading 列表 · #/reading/cat/<分类> 打开某个分类 · #/reading/<文章 id> 短文
const READING_CATS = [
  ["all", "全部"], ["books", "📖 原著全文"], ["mine", "📥 我的读物"], ["voa", "📰 VOA 慢速英语"], ["wiki", "🌐 维基百科"],
  ["classics", "📚 名著简读"], ["romance", "💕 言情小说"], ["scifi", "🚀 科幻小说"],
  ["knowledge", "💡 常识"], ["pro", "🔬 专业知识"], ["news", "📰 新闻回顾"], ["culture", "🎎 文化风俗"],
  ["geography", "🌋 地理"], ["animals", "🐾 动物"], ["history", "🏛️ 历史"], ["life", "🏡 生活"], ["ai", "🤖 AI 文章"],
];

// 文章多的分类再细分：topic 形如「地理 · 亚洲」「风俗 · 日本」「常识 · 健康」「计算机」
const topicPart = (p, i) => { const t = (p.topic || "").split("·").map((s) => s.trim()); return t[i] || t[0] || "其他"; };
// 文化风俗按地区分组（topic 第二段是国家名）
const CULTURE_REGION = Object.fromEntries(Object.entries({
  中国: "中国", 日韩: "日本 韩国", 亚洲与中东: "印度 泰国 越南 印度尼西亚 菲律宾 新加坡 蒙古 土耳其 伊朗 伊斯兰世界 阿拉伯",
  欧洲: "英国 法国 意大利 西班牙 德国 俄罗斯 丹麦 希腊 爱尔兰 苏格兰 瑞典 芬兰 荷兰 瑞士 葡萄牙",
  美洲: "美国 爱尔兰和美国 墨西哥 巴西 阿根廷 加拿大", 非洲与大洋洲: "埃塞俄比亚 摩洛哥 肯尼亚 新西兰 澳大利亚", 世界礼仪: "世界",
}).flatMap(([region, list]) => list.split(" ").map((c) => [c, region])));
const READING_SUB = {
  geography: (p) => { const t = topicPart(p, 1); return t === "南极洲" ? "极地与海洋" : t; },
  culture: (p) => CULTURE_REGION[topicPart(p, 1)] || "其他",
  animals: (p) => topicPart(p, 1),
  // 生活：新文章 topic 形如「生活 · 日常与家居」；最早 6 篇只写了「学习」「工作」这类单词
  life: (p) => (p.topic || "").includes("·") ? topicPart(p, 1)
    : ({ 学习: "学习与校园", 工作: "工作与职场", 环境: "环保生活", 科技: "数字生活" }[p.topic] || "日常与家居"),
  // 早期的几篇历史文章 topic 写的是年份或大区，归到新分组里
  history: (p) => { const t = topicPart(p, 1); return { 中国: "中国古代", 亚欧: "古代文明", 世界: "科技发明", 1912: "世界近现代", 1969: "探险与发现" }[t] || t; },
  knowledge: (p) => (p.topic || "").includes("·") ? topicPart(p, 1) : "综合",
  pro: (p) => topicPart(p, 0),
};

App.pages.reading = {
  cat: "all",
  all() {
    return [
      ...READING_EXTRA,
      ...READING_PASSAGES.map((p) => ({ category: "life", ...p })),
      ...Store.data.custom_reading.map((p) => ({ category: "ai", ...p })),
    ];
  },
  img(p) { return (window.READING_IMAGES || {})[p.id]; },

  sub: { voa: "all", wiki: "all" }, // VOA 栏目 / 维基主题的筛选

  async render(root, params, signal) {
    if (params[0] === "cat" && READING_CATS.some(([c]) => c === params[1])) this.cat = params[1];
    const p = this.all().find((x) => x.id === params[0]);
    if (p) return this.reader(root, p, signal);
    await Docs.library(); // 「我的读物」的书目在 Python 端
    if (!signal.aborted) this.list(root, signal);
  },

  list(root, signal) {
    const done = Store.data.reading;
    const card = (p) => `
      <a class="card passage-card" href="#/reading/${p.id}" style="text-decoration:none;color:inherit;display:block">
        ${this.img(p) ? `<div class="cover"><img src="${this.img(p).src}" alt="" loading="lazy"></div>` : ""}
        <div class="row">${p.chapter ? `<span class="badge brand">第 ${p.chapter} 章</span>` : ""}${levelBadge(p)}<span class="badge">${esc(p.topic || "AI")}</span>
          ${p.ai ? `<span class="badge warn">AI 生成</span>` : ""}<span class="spacer"></span>${done[p.id] ? `<span class="badge good">✓ ${done[p.id].score}/${p.questions.length}</span>` : ""}</div>
        <h3 class="mt-s" style="font-family:var(--font-en)">${esc(p.title)}</h3>
        <p class="small muted" style="margin:6px 0 0">${esc(p.paragraphs[0][0].slice(0, 110))}…</p>
        <div class="small faint mt-s">约 ${p.paragraphs.reduce((n, [en]) => n + en.split(/\s+/).length, 0)} 词 · ${p.questions.length} 道题</div>
      </a>`;
    this._card = card;
    const all = this.all();
    const P = Store.prefs;
    P.read_level ||= 2;
    const total = all.length + BOOK_SHELF.length + VOA_INDEX.length + WIKI_INDEX.length + (Docs.lib || []).length;
    root.innerHTML = pageHead("阅读", "",
      AI.enabled ? `<button class="btn primary" id="gen">🤖 AI 生成新文章</button>` : "")
      + `<div class="row read-tools">
          <input class="input" id="read-q" placeholder="🔍 搜文章、书名或主题（英文或中文）" value="${esc(this.q || "")}" autocomplete="off">
          <label class="row fit-toggle"><input type="checkbox" id="read-fit" ${P.read_fit ? "checked" : ""}> 只看适合我的难度</label>
          <select class="select" id="read-lv" title="你现在的阅读水平">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${n === P.read_level ? "selected" : ""}>我的水平：${CEFR[n]}</option>`).join("")}</select>
        </div>
        <div id="read-body"></div>`;
    const gen = $("#gen", root);
    if (gen) gen.onclick = () => this.generate();
    let timer = 0;
    $("#read-q", root).oninput = (e) => { clearTimeout(timer); timer = setTimeout(() => { this.q = e.target.value.trim(); this.drawBody(root, signal); }, 200); };
    $("#read-fit", root).onchange = (e) => { P.read_fit = e.target.checked; Store.save(); this.drawBody(root, signal); };
    $("#read-lv", root).onchange = (e) => { P.read_level = +e.target.value; Store.save(); if (P.read_fit) this.drawBody(root, signal); };
    // 删除导入的读物（卡片上的 ✕，在分类页和搜索结果里都有）
    root.addEventListener("click", (e) => {
      const d = e.target.closest("[data-del-doc]");
      if (!d) return;
      e.preventDefault();
      e.stopPropagation();
      const meta = (Docs.lib || []).find((x) => x.id === d.dataset.delDoc);
      if (meta) App.pages.book.remove({ ...meta, kind: "import" });
    }, { signal });
    this.drawBody(root, signal);
  },

  // 「适合我的难度」：自己的水平和低一级的（导入的读物不分难度，总是显示）
  fits(x) {
    const P = Store.prefs, n = levelOf(x);
    return !P.read_fit || n == null || (n <= P.read_level && n >= P.read_level - 1);
  },

  drawBody(root, signal) {
    const body = $("#read-body", root), card = this._card, done = Store.data.reading;
    const all = this.all();
    const fit = (x) => this.fits(x);
    if (this.q) return this.searchResults(body, signal);
    const books = BOOK_SHELF.map((b) => ({ ...b, kind: "book" })).filter(fit);
    const ext = { books: books.length, mine: (Docs.lib || []).length, voa: VOA_INDEX.map((a) => Docs.voaMeta(a)).filter(fit).length,
      wiki: WIKI_INDEX.map((a) => Docs.wikiMeta(a)).filter(fit).length };
    const count = (c) => (c === "all" ? all.filter(fit).length : c in ext ? ext[c] : all.filter((p) => p.category === c && fit(p)).length);
    // 「我的读物」没有内容时也显示（要从这里导入）
    const cats = READING_CATS.filter(([c]) => count(c) > 0 || (c === "mine" && Store.bridge));
    if (!cats.some(([c]) => c === this.cat)) this.cat = "all";
    let shown = (this.cat === "all" ? all : all.filter((p) => p.category === this.cat)).filter(fit);
    // 地理、文化风俗、常识、专业知识文章多，再按地区 / 类别 / 学科细分
    const subOf = READING_SUB[this.cat];
    let subChips = "";
    if (subOf && shown.length > 12) {
      const groups = {};
      shown.forEach((p) => { const k = subOf(p); (groups[k] ||= []).push(p); });
      const keys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
      const cur = keys.includes(this.sub[this.cat]) ? this.sub[this.cat] : "all";
      subChips = `<div class="chips sub-chips" style="margin:-6px 0 14px">${[["all", "全部", shown.length], ...keys.map((k) => [k, k, groups[k].length])]
        .map(([v, l, n]) => `<button class="chip ${v === cur ? "active" : ""}" data-sub="${esc(v)}">${esc(l)} <span class="faint">${n}</span></button>`).join("")}</div>`;
      if (cur !== "all") shown = groups[cur];
    }
    body.innerHTML = `<div class="chips" style="margin-bottom:16px">${cats.map(([c, label]) => `<button class="chip ${c === this.cat ? "active" : ""}" data-cat="${c}">${label} <span class="faint">${count(c)}</span></button>`).join("")}</div>`
      + (this.cat === "books" ? this.shelfHtml(books)
        : this.cat === "mine" ? this.mineHtml()
        : this.cat === "voa" ? this.voaHtml()
        : this.cat === "wiki" ? this.wikiHtml()
        : (this.cat === "all" ? `<a class="card shelf-banner" href="javascript:void 0" data-cat="books"><span style="font-size:28px">📖</span>
             <div><b>原著全文书架</b><div class="small muted">${BOOK_SHELF.length} 本名著的完整原文：${BOOK_SHELF.slice(0, 6).map((b) => b.zh).join("、")}……</div></div><span class="spacer"></span><span class="btn soft sm">去看看 →</span></a>` : "")
          + subChips + `<div class="grid grid-2">${shown.map(card).join("")}</div>`)
      + (AI.enabled ? "" : `<p class="small faint mt">💡 开启 AI 后，可以按你感兴趣的话题生成新文章，读不完的。</p>`)
      + `<p class="small faint mt">配图来自 Wikimedia Commons 和名著的原版插画（公有领域或 CC 授权），作者和授权信息见每张图的说明。</p>`;
    $$("[data-cat]", body).forEach((b) => (b.onclick = () => { this.cat = b.dataset.cat; this.drawBody(root, signal); }));
    $$("[data-sub]", body).forEach((b) => (b.onclick = () => { this.sub[this.cat] = b.dataset.sub; this.drawBody(root, signal); }));
    if (this.cat === "mine") this.bindMine(body, signal);
    if (this.cat === "wiki") this.bindWiki(body);
  },

  // 原著书架：新手先读 / 按类别 / 现代名著书单（有版权、不内置全文，买了正版可以导入）
  shelfHtml(books) {
    const cur = this.sub.books || "pick";
    const cats = [["pick", "⭐ 新手先读"], ["all", "全部"], ...BOOK_CATS, ["modern", "📋 现代名著书单"]];
    const count = (c) => c === "all" ? books.length : c === "pick" ? books.filter((b) => b.pick).length
      : c === "modern" ? MODERN_BOOKS.length : books.filter((b) => b.cat === c).length;
    const chips = `<div class="chips sub-chips" style="margin:-6px 0 12px">${cats.filter(([c]) => count(c)).map(([c, l]) =>
      `<button class="chip ${c === cur ? "active" : ""}" data-sub="${c}">${l} <span class="faint">${count(c)}</span></button>`).join("")}</div>`;
    if (cur === "modern") {
      const lv = ["较易", "中等", "较难"];
      const catName = Object.fromEntries(BOOK_CATS);
      return chips + `<p class="small muted">这些是英语学习书单里推荐最多的现代名著，还在版权期内，软件里不能放全文。买正版电子书（epub）后，可以在「📥 我的读物」里导入，同样能点词查义、高亮、朗读、AI 翻译。</p>`
        + lv.map((l) => `<div class="card-title mt">${{ 较易: "🌱 入门（A2–B1）", 中等: "🌿 中级（B1–B2）", 较难: "🌳 进阶（B2–C1）" }[l]}</div>
          <div class="grid grid-2">${MODERN_BOOKS.filter((b) => b.level === l).map((b) => `<div class="card modern-book">
            <div class="row"><span class="badge">${esc(catName[b.cat] || "")}</span><span class="small faint">${b.author} · ${b.year}</span></div>
            <h3 class="mt-s" style="font-family:var(--font-en)">${esc(b.title)}</h3><div class="small"><b>${esc(b.zh)}</b></div>
            <div class="small muted mt-s">${esc(b.why)}</div></div>`).join("")}</div>`).join("");
    }
    const list = cur === "all" ? books : cur === "pick" ? books.filter((b) => b.pick) : books.filter((b) => b.cat === cur);
    return chips + `<p class="small muted">${cur === "pick"
      ? "第一次读英文原著，建议从这几本开始：篇幅不长、语言不难、故事好看。读完一本再往下挑。"
      : `${BOOK_SHELF.length} 本公有领域名著的完整原文，按章节阅读，会记住读到哪里。按难度从易到难排列。`}</p>
      <div class="grid grid-2">${list.map(bookCardHtml).join("")}</div>`;
  },

  // 搜索：标题、主题、作者、中文书名，跨所有来源
  searchResults(body, signal) {
    const q = this.q.toLowerCase(), hit = (...s) => s.some((x) => x && String(x).toLowerCase().includes(q));
    const fit = (x) => this.fits(x);
    const shorts = this.all().filter((p) => hit(p.title, p.topic, p.paragraphs[0]?.[1]) && fit(p));
    const longs = [
      ...BOOK_SHELF.filter((b) => hit(b.title, b.zh, b.author, b.intro)).map((b) => ({ ...b, kind: "book" })),
      ...(Docs.lib || []).filter((m) => hit(m.title, m.author)).map((m) => ({ ...m, kind: "import" })),
      ...VOA_INDEX.filter((a) => hit(a.title, a.section)).map((a) => Docs.voaMeta(a)),
      ...WIKI_INDEX.filter((a) => hit(a.title, a.topic)).map((a) => Docs.wikiMeta(a)),
    ].filter(fit);
    const n = shorts.length + longs.length;
    body.innerHTML = `<div class="small muted" style="margin-bottom:12px">搜索「${esc(this.q)}」：${n} 条结果${Store.prefs.read_fit ? "（只显示适合你难度的）" : ""}</div>`
      + (n ? `<div class="grid grid-2">${longs.slice(0, 60).map(bookCardHtml).join("")}${shorts.map(this._card).join("")}</div>`
        : `<div class="card empty"><div class="big">🔍</div>没有找到，换个词试试${WIKI_INDEX.length ? "，或者在「维基百科」里在线搜索" : ""}</div>`);
  },

  // ---------- 我的读物：导入自己的文章和书 ----------
  mineHtml() {
    const lib = Docs.lib || [];
    const canImport = Store.bridge && !Store.remote;
    return `<div class="card import-bar">
        <div><b>导入你自己的读物</b><div class="small muted">支持 txt、epub、html 文件，或者直接粘贴文字。会自动分章，用和原著全文一样的阅读器打开：查词、高亮、生词、朗读、AI 翻译。
          只保存在你的电脑上；PDF 请先复制里面的文字再粘贴。请导入你有权使用的内容（比如自己订阅的外刊文章、买的电子书）。</div></div>
        ${canImport ? `<div class="row"><button class="btn primary" id="imp-file">📂 打开文件</button><button class="btn soft" id="imp-paste">📋 粘贴文字</button></div>`
          : `<div class="small faint">${Store.remote ? "在电脑上导入后，这里就能看到。" : "导入需要在桌面版中使用。"}</div>`}
      </div>
      ${lib.length ? `<div class="grid grid-2 mt">${lib.map((m) => bookCardHtml({ ...m, kind: "import" })).join("")}</div>`
        : `<div class="card empty mt"><div class="big">📥</div>还没有导入任何读物</div>`}`;
  },

  bindMine(root, signal) {
    const done = (m) => {
      if (!m) return;
      if (m.error) { toast(m.error, "bad", 5000); return; }
      toast(`已导入《${m.title}》：${m.chapters.length} 章、${m.words.toLocaleString()} 词`, "good", 4000);
      Docs.library(true).then(() => Router.go(`book/${m.id}`));
    };
    const f = $("#imp-file", root);
    if (f) f.onclick = async () => {
      f.disabled = true;
      try { done(await pywebview.api.library_import_file()); } finally { f.disabled = false; }
    };
    const p = $("#imp-paste", root);
    if (p) p.onclick = () => {
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
        if (!r?.error) m.close();
        done(r);
      };
    };
  },

  // ---------- VOA 慢速英语（存档） ----------
  voaHtml() {
    const secs = [...new Set(VOA_INDEX.map((a) => a.section))];
    const cur = this.sub.voa;
    const shown = (cur === "all" ? VOA_INDEX : VOA_INDEX.filter((a) => a.section === cur)).filter((a) => this.fits(Docs.voaMeta(a)));
    return `<p class="small muted" style="margin-top:-6px">美国之音为英语学习者写的文章，用词简单、句子短，大多数配有原声朗读（播放需要联网）。
        VOA 于 2025 年 3 月停止更新，这里收录的是 2016–2025 年的存档；文字属于公有领域。</p>
      <div class="chips" style="margin-bottom:14px">${[["all", `全部 ${VOA_INDEX.length}`], ...secs.map((s) => [s, `${s} ${VOA_INDEX.filter((a) => a.section === s).length}`])]
        .map(([v, l]) => `<button class="chip ${v === cur ? "active" : ""}" data-sub="${esc(v)}">${esc(l)}</button>`).join("")}</div>
      <div class="grid grid-2">${shown.map((a) => bookCardHtml(Docs.voaMeta(a))).join("")}</div>`;
  },

  // ---------- 简明英文维基百科 ----------
  wikiHtml() {
    const topics = [...new Set(WIKI_INDEX.map((a) => a.topic))];
    const cur = this.sub.wiki;
    const shown = (cur === "all" ? WIKI_INDEX : WIKI_INDEX.filter((a) => a.topic === cur)).filter((a) => this.fits(Docs.wikiMeta(a)));
    return `<p class="small muted" style="margin-top:-6px">Simple English Wikipedia 是用简单英语写的维基百科。这里内置了 ${WIKI_INDEX.length} 篇精选文章，联网时还可以搜索任何话题。
        文字采用 CC BY-SA 4.0 协议，出处见每篇文章末尾。</p>
      ${Store.bridge ? `<div class="row wiki-search"><input class="input" id="wiki-q" placeholder="🔍 在线搜索维基百科，比如 volcano、Beijing、coffee（英文）"><button class="btn primary" id="wiki-go">搜索</button></div>
        <div id="wiki-results"></div>` : ""}
      <div class="chips" style="margin:14px 0">${[["all", `全部 ${WIKI_INDEX.length}`], ...topics.map((t) => [t, t])]
        .map(([v, l]) => `<button class="chip ${v === cur ? "active" : ""}" data-sub="${esc(v)}">${esc(l)}</button>`).join("")}</div>
      <div class="grid grid-2">${shown.map((a) => bookCardHtml(Docs.wikiMeta(a))).join("")}</div>`;
  },

  bindWiki(root) {
    const q = $("#wiki-q", root), box = $("#wiki-results", root);
    if (!q) return;
    const go = async () => {
      if (!q.value.trim()) return;
      box.innerHTML = `<div class="small muted mt-s">搜索中…</div>`;
      const r = await pywebview.api.wiki_search(q.value.trim());
      if (!r.ok) { box.innerHTML = `<div class="explain bad">${esc(r.error)}<br>维基百科在部分网络环境下无法访问，内置的文章不受影响。</div>`; return; }
      box.innerHTML = r.results.length ? `<div class="card wiki-hits">${r.results.map((x) => `
          <a class="wiki-hit" href="javascript:void 0" data-wt="${esc(x.title)}"><b>${esc(x.title)}</b><span class="small faint"> · ${x.words} 词</span>
            <div class="small muted">${esc(x.snippet)}…</div></a>`).join("")}</div>`
        : `<div class="small muted mt-s">没有找到相关文章，换个英文关键词试试。</div>`;
    };
    $("#wiki-go", root).onclick = go;
    q.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    box.addEventListener("click", async (e) => {
      const a = e.target.closest("[data-wt]");
      if (!a) return;
      a.classList.add("loading");
      const r = await pywebview.api.wiki_article(a.dataset.wt);
      a.classList.remove("loading");
      if (!r.ok) { toast(r.error, "bad", 4000); return; }
      const words = r.article.paras.reduce((n, p) => n + p.split(/\s+/).length, 0);
      const id = `wikilive-${r.article.title}`;
      Docs.live.set(id, { meta: Docs.wikiMeta({ ...r.article, words, topic: "在线搜索" }, id), paras: r.article.paras });
      Router.go(`book/${encodeURIComponent(id)}`);
    });
  },

  generate() {
    const m = modal(`<h3>🤖 生成一篇新文章</h3>
      <div class="field"><label>话题</label><input class="input" id="topic" placeholder="比如：咖啡、旅行、篮球、找工作、猫…"></div>
      <div class="field mt-s"><label>难度</label><select class="select" id="lv"><option>初级</option><option selected>中级</option></select></div>
      <div id="gen-status" class="mt-s"></div>
      <div class="modal-actions"><button class="btn" data-close>取消</button><button class="btn primary" id="go">生成</button></div>`);
    const go = $("#go", m.root);
    $("#topic", m.root).focus();
    go.onclick = async () => {
      const topic = $("#topic", m.root).value.trim() || "daily life";
      const lv = $("#lv", m.root).value;
      go.disabled = true;
      $("#gen-status", m.root).innerHTML = aiLoading("正在写文章，大约需要 10–30 秒…");
      const r = await AI.json(
        `You write graded English reading materials. ${LEARNER_PROFILE}`,
        `Write an original short article about "${topic}" for a ${lv === "初级" ? "beginner (CEFR A2, about 150 words, short simple sentences)" : "intermediate (CEFR B1, about 220 words)"} learner.
Return JSON exactly in this shape:
{"title": "English title",
 "paragraphs": [["English paragraph", "对应的中文翻译"], ...],   // 3-4 paragraphs
 "questions": [{"q": "English question", "o": ["option A", "option B", "option C", "option D"], "a": index_of_correct_option_0_to_3, "e": "中文解析，指出原文依据"}]  // exactly 3 questions
}`);
      if (!m.root.isConnected) return;
      if (!r.ok) { go.disabled = false; $("#gen-status", m.root).innerHTML = aiError(r.error); return; }
      const d = r.data;
      if (!Array.isArray(d.paragraphs) || !Array.isArray(d.questions) || !d.paragraphs.length) {
        go.disabled = false;
        $("#gen-status", m.root).innerHTML = aiError("AI 返回的文章格式不完整，请再试一次。");
        return;
      }
      const p = { id: "ai-" + Date.now(), ai: true, title: d.title || topic, level: lv, topic, paragraphs: d.paragraphs, questions: d.questions.filter((q) => Array.isArray(q.o) && q.o.length === 4) };
      Store.data.custom_reading.unshift(p);
      Store.save();
      m.close();
      Router.go("reading/" + p.id);
    };
  },

  // 连载小说给「下一章」，其他文章给同类的下一篇
  nextHtml(p) {
    const all = this.all();
    const same = all.filter((x) => x.category === p.category && (!p.series || x.series === p.series));
    const next = same[same.findIndex((x) => x.id === p.id) + 1];
    if (!next) return p.series ? `<div class="center muted mt">— 全文完 —</div>` : "";
    return `<div class="row mt" style="justify-content:flex-end"><a class="btn soft lg" href="#/reading/${next.id}">${p.series ? "下一章" : "下一篇"}：${esc(next.title.replace(/^.*?·\s*/, ""))} →</a></div>`;
  },

  // ---------- 高亮：选中文字后在浮层里挑颜色；按「段落序号 + 字符位置」保存，重新打开文章时还原 ----------
  highlights(root, reader, p) {
    const HL = (Store.data.highlights ||= {});
    const hls = () => (HL[p.id] ||= []);
    const card = $("#hl-card", root);
    const paraEn = (i) => $(`.para[data-i="${i}"] .para-en`, reader);
    const elOf = (n) => (n.nodeType === 1 ? n : n.parentElement);
    const offsetIn = (box, node, off) => { const r = document.createRange(); r.setStart(box, 0); r.setEnd(node, off); return r.toString().length; };
    const textOf = (h) => p.paragraphs[h.p][0].slice(h.s, h.e);

    // 把段落里 [s, e) 这段文字包进 <mark>；可能跨好几个单词 span，所以逐个文本节点切开
    const markRange = (box, h) => {
      const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT), nodes = [];
      let pos = 0;
      while (walker.nextNode()) { nodes.push([walker.currentNode, pos]); pos += walker.currentNode.length; }
      nodes.forEach(([n, at]) => {
        const s = Math.max(h.s, at), e = Math.min(h.e, at + n.length);
        if (s >= e) return;
        let t = n;
        if (s > at) t = t.splitText(s - at);
        if (e < at + n.length) t.splitText(e - s);
        const m = document.createElement("mark");
        m.className = `hl hl-${h.c}`;
        m.dataset.hl = h.id;
        t.parentNode.insertBefore(m, t);
        m.appendChild(t);
      });
    };
    const drawPara = (i) => {
      const box = paraEn(i);
      box.innerHTML = wrapWords(p.paragraphs[i][0]);
      hls().filter((h) => h.p === i).forEach((h) => markRange(box, h));
    };
    const save = (i) => { Store.save(); drawPara(i); drawList(); closePopups(); window.getSelection().removeAllRanges(); };

    // 收藏：单个词进「单词」，其余进「短语和句子」
    const starOf = (t) => (/^[A-Za-z'’-]+$/.test(t) && lookupWord(t) ? inNotebook(lookupWord(t).w) : inSentNb(t));
    const toggleStar = (t) => (/^[A-Za-z'’-]+$/.test(t) && lookupWord(t) ? toggleNotebook(lookupWord(t)) : toggleSentNb({ en: t, from: "阅读" }));

    const drawList = () => {
      const list = [...hls()].sort((a, b) => a.p - b.p || a.s - b.s);
      card.innerHTML = `<div class="card-title">🖍 我的高亮 ${list.length ? `<span class="badge">${list.length}</span>` : ""}</div>`
        + (list.length ? list.map((h) => `<div class="hl-item">
            <span class="hl-bar hl-${h.c}"></span><span class="hl-text" data-go="${h.id}" title="定位到原文">${esc(textOf(h))}</span>
            ${speakBtn(textOf(h), "sm")}<button class="star ${starOf(textOf(h)) ? "on" : ""}" data-hlstar="${h.id}" title="加入生词本">★</button>
            <button class="btn sm ghost" data-hldel="${h.id}" title="取消高亮">✕</button></div>`).join("")
          : `<div class="small faint">用鼠标选中文章里的单词或句子，就可以高亮、查释义或收进生词本。</div>`);
    };
    card.onclick = (e) => {
      const go = e.target.closest("[data-go]"), del = e.target.closest("[data-hldel]"), star = e.target.closest("[data-hlstar]");
      const h = hls().find((x) => x.id === (go || del || star)?.dataset[go ? "go" : del ? "hldel" : "hlstar"]);
      if (!h) return;
      if (go) {
        const m = $(`mark[data-hl="${h.id}"]`, reader);
        m.scrollIntoView({ block: "center", behavior: "smooth" });
        $$(`mark[data-hl="${h.id}"]`, reader).forEach((x) => { x.classList.remove("flash"); void x.offsetWidth; x.classList.add("flash"); });
      } else if (del) { HL[p.id] = hls().filter((x) => x !== h); save(h.p); }
      else star.classList.toggle("on", toggleStar(textOf(h)));
    };

    App.selectionExtra = (range) => {
      const a = elOf(range.startContainer)?.closest(".para-en"), b = elOf(range.endContainer)?.closest(".para-en");
      if (!a || a !== b) return null; // 只支持在同一段里高亮
      const i = +a.closest(".para").dataset.i, en = p.paragraphs[i][0];
      let s = offsetIn(a, range.startContainer, range.startOffset), e = offsetIn(a, range.endContainer, range.endOffset);
      while (s < e && /\s/.test(en[s])) s++;
      while (e > s && /\s/.test(en[e - 1])) e--;
      if (s >= e) return null;
      const over = hls().filter((h) => h.p === i && h.s < e && h.e > s);
      return {
        html: `<div class="row pop-hl"><span class="small muted">🖍 高亮</span>
          ${["y", "g", "b", "p"].map((c) => `<button class="hl-sw hl-${c}" data-hlc="${c}" title="用这个颜色高亮"></button>`).join("")}
          <span class="spacer"></span>${over.length ? `<button class="btn sm ghost" data-hlx>取消高亮</button>` : ""}</div>`,
        bind(pop) {
          $$("[data-hlc]", pop).forEach((btn) => (btn.onclick = () => {
            // 和已有高亮重叠时合并成一段，颜色用新选的
            const ns = Math.min(s, ...over.map((h) => h.s)), ne = Math.max(e, ...over.map((h) => h.e));
            HL[p.id] = hls().filter((h) => !over.includes(h));
            hls().push({ id: Date.now().toString(36), p: i, s: ns, e: ne, c: btn.dataset.hlc });
            save(i);
          }));
          const x = $("[data-hlx]", pop);
          if (x) x.onclick = () => { HL[p.id] = hls().filter((h) => !over.includes(h)); save(i); };
        },
      };
    };

    [...new Set(hls().map((h) => h.p))].forEach(drawPara);
    drawList();
  },

  reader(root, p, signal) {
    root.innerHTML = `
      <a class="back-link" href="#/reading">‹ 返回文章列表</a>
      <div class="page-head"><div>
        <div class="page-title" style="font-family:var(--font-en)">${esc(p.title)}</div>
        <div class="page-sub">${esc(p.level)} · ${esc(p.topic || "")} · 点击单词查释义 · 选中文字可以高亮、收进生词本</div>
        <div class="row small mark-row">${wordMarkHtml(textWordStats(p.paragraphs.map(([en]) => en)))}</div></div>
        <div class="row">
          ${switchHtml("zh-switch", "中文译文", Store.prefs.read_zh)}
          <button class="btn soft" id="read-all">🔊 朗读全文</button>
          ${p.ai ? `<button class="btn ghost" id="del" title="删除这篇 AI 文章">🗑️</button>` : ""}
        </div></div>
      ${this.img(p) ? `<figure class="hero-img"><img src="${this.img(p).src}" alt=""><figcaption>📷 ${esc(this.img(p).credit)}</figcaption></figure>` : ""}
      ${p.author ? `<div class="small muted" style="margin:-8px 0 12px">✍️ ${esc(p.author)}</div>` : ""}
      <div class="card reader" id="reader">${p.paragraphs.map(([en, zh], i) => `
        <div class="para" data-i="${i}" data-text="${esc(en)}">
          <span class="para-tools"><button class="btn sm ghost" data-say="${esc(en)}">🔊</button><button class="btn sm ghost" data-zh>译</button></span>
          <span class="para-en">${wrapWords(en)}</span>
          <div class="para-zh ${Store.prefs.read_zh ? "" : "hidden"}">${esc(zh)}</div>
        </div>`).join("")}
        ${AI.enabled ? `<div class="row mt small" style="font-family:var(--font)"><span class="faint">看不懂某句话？选中它，然后</span><button class="btn sm soft" id="explain">🤖 解释选中的句子</button></div><div id="explain-box" class="mt-s" style="font-family:var(--font)"></div>` : ""}
      </div>
      <div class="card" id="hl-card"></div>
      <div class="card"><div class="card-title">📝 阅读理解</div><div id="qs"></div>
        <div class="row mt"><button class="btn primary" id="submit">提交</button><span id="score" class="muted"></span></div></div>
      ${p.original ? `<div class="card original"><div class="card-title">📜 原著名句 ${speakBtn(p.original.text, "sm")}</div>
        <blockquote>${esc(p.original.text)}</blockquote><div class="small muted">${esc(p.original.note)}</div>
        ${BOOK_SHELF.some((b) => b.id === p.id) ? `<a class="btn soft mt" href="#/book/${p.id}">📖 读原著全文（${BOOK_SHELF.find((b) => b.id === p.id).chapters.length} 章）→</a>` : ""}</div>` : ""}
      ${this.nextHtml(p)}`;

    const reader = $("#reader", root);
    bindWordMark(root, reader);
    bindWordClicks(reader);
    this.highlights(root, reader, p);
    reader.addEventListener("click", (e) => {
      const b = e.target.closest("[data-zh]");
      if (b) $(".para-zh", b.closest(".para")).classList.toggle("hidden");
    });

    $("#zh-switch", root).onchange = (e) => {
      Store.prefs.read_zh = e.target.checked;
      Store.save();
      $$(".para-zh", root).forEach((z) => z.classList.toggle("hidden", !e.target.checked));
    };

    // 逐段朗读（整篇一次性朗读在部分系统上会被截断），可以暂停、跳段、调速、关闭
    readAloud(reader, $("#read-all", root), signal);

    const del = $("#del", root);
    if (del) del.onclick = async () => {
      if (!(await confirmBox("删除文章", "确定删除这篇 AI 生成的文章吗？", "删除", true))) return;
      Store.data.custom_reading = Store.data.custom_reading.filter((x) => x.id !== p.id);
      delete Store.data.reading[p.id];
      Store.save();
      Router.go("reading");
    };

    const exBtn = $("#explain", root);
    if (exBtn) {
      exBtn.onmousedown = (e) => e.preventDefault(); // 保留文本选区
      exBtn.onclick = async () => {
        const sel = window.getSelection().toString().trim();
        const box = $("#explain-box", root);
        if (!sel) { toast("请先用鼠标选中一句英文"); return; }
        await aiAnswer(box,
          `You are an English reading tutor. ${LEARNER_PROFILE} Explain in Chinese: give a natural Chinese translation, then break down the sentence structure and any difficult words or phrases. Be concise. Use simple markdown.`,
          `Article: "${p.title}"\nSentence: ${sel}`);
      };
    }

    // 阅读理解
    const letters = "ABCD";
    const picks = new Array(p.questions.length).fill(-1);
    const qs = $("#qs", root);
    qs.innerHTML = p.questions.map((q, qi) => `
      <div class="quiz-item" data-q="${qi}">
        <div class="quiz-q en" style="font-size:16px"><span class="qnum">${qi + 1}.</span>${esc(q.q)}</div>
        <div class="options">${q.o.map((o, i) => `<button class="option" data-i="${i}"><span class="letter">${letters[i]}</span><span style="font-family:var(--font-en)">${esc(o)}</span></button>`).join("")}</div>
        <div class="explain-slot"></div></div>`).join("");
    qs.addEventListener("click", (e) => {
      const b = e.target.closest(".option");
      if (!b || b.disabled) return;
      const item = b.closest("[data-q]");
      $$(".option", item).forEach((x) => x.classList.remove("picked"));
      b.classList.add("picked");
      picks[+item.dataset.q] = +b.dataset.i;
    });
    $("#submit", root).onclick = (evt) => {
      if (picks.includes(-1)) { toast("还有题没做完"); return; }
      let right = 0;
      p.questions.forEach((q, qi) => {
        const item = $(`[data-q="${qi}"]`, qs);
        const btns = $$(".option", item);
        btns.forEach((b) => { b.disabled = true; b.classList.remove("picked"); });
        btns[q.a]?.classList.add("right");
        const ok = picks[qi] === q.a;
        if (ok) right++;
        else btns[picks[qi]].classList.add("wrong");
        $(".explain-slot", item).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? "✅" : "❌"} ${esc(q.e || "")}</div>`;
      });
      const first = !Store.data.reading[p.id];
      Store.data.reading[p.id] = { score: right, n: p.questions.length, date: today() };
      addXP(first ? 10 + right * 2 : right, null, evt);
      $("#score", root).innerHTML = `答对 <b>${right} / ${p.questions.length}</b>`;
      evt.currentTarget.disabled = true;
    };
  },
};
