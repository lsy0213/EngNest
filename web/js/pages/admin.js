// 使用情况：服务器上的管理员看每个账号、电脑主人看局域网里每个人的学习情况。
// 只有数字（经验值、活跃天数、词汇量、各项练习做了多少），作文、聊天、笔记的内容不会发过来。
const USAGE_MODS = [
  ["new", "学新词", "个"], ["review", "复习单词", "次"], ["c_sent", "短语句子", "条"], ["c_weak", "薄弱点", "条"], ["c_game", "单词游戏", "局"],
  ["c_gram", "语法", "课"], ["c_build", "连词成句", "句"], ["rs", "阅读", "分钟"], ["c_story", "今日故事", "篇"], ["c_dict", "听写", "句"],
  ["c_video", "影视精听", "句"], ["c_shadow", "跟读评测", "次"], ["c_chat", "AI 语伴", "句"], ["c_course", "场景短语", "课"],
  ["c_diary", "英语日记", "篇"], ["c_use", "造句", "句"], ["c_type", "跟打", "个"], ["c_write", "写作", "篇"], ["c_colloc", "搭配", "题"],
];
const USAGE_SORTS = [
  ["recent", "最近学习", (u) => [u.last_day || "", u.last_seen || 0]],
  ["xp7", "本周经验", (u) => u.xp7 || 0],
  ["xp", "累计经验", (u) => u.xp || 0],
  ["words", "词汇量", (u) => u.words || 0],
  ["streak", "连续天数", (u) => u.streak || 0],
  ["created", "注册时间", (u) => u.created || ""],
];

App.pages.admin = {
  // 谁能看：服务器上的管理员；电脑上的主人（看局域网里的朋友）
  allowed: () => (Store.server ? !!Store.who?.admin : Store.bridge && !Store.remote),
  state: { q: "", sort: "recent", filter: "all", open: new Set() },

  async render(root, params, signal) {
    if (!this.allowed()) {
      root.innerHTML = pageHead("使用情况") + `<div class="card empty">只有管理员能看每个人的使用情况。</div>`;
      return;
    }
    root.innerHTML = pageHead("使用情况", Store.server ? "每个账号的学习情况" : "局域网里每个人的学习情况") + `<div class="loading">正在统计…</div>`;
    let users;
    try {
      if (Store.server) users = await pywebview.api.admin_usage();
      else {
        const r = await pywebview.api.lan_usage();
        if (!r.ok) throw new Error(r.error);
        users = r.users;
      }
    } catch (e) {
      if (!signal?.aborted) root.innerHTML = pageHead("使用情况") + `<div class="card empty">没读到：${esc(e.message || String(e))}</div>`;
      return;
    }
    if (signal?.aborted) return;
    this.users = users;
    this.draw(root);
  },

  draw(root) {
    const users = this.users, t = today(), wk = addDays(t, -6);
    const active = (u, from) => u.last_day && u.last_day >= from;
    const fresh = users.filter((u) => u.created && u.created >= addDays(t, -6)).length;
    const sumXp7 = users.reduce((s, u) => s + (u.xp7 || 0), 0);
    const right = Store.server ? `<a class="btn ghost sm" href="#/settings">👥 账号和邀请码</a>` : `<a class="btn ghost sm" href="#/settings">📶 局域网访问</a>`;
    root.innerHTML = pageHead("使用情况", `${Store.server ? "每个账号" : "局域网里每个人"}的学习情况。只统计数字，作文、聊天、笔记的内容不会显示在这里。`, right) + `
      <div class="grid grid-4 usage-tiles">
        <div class="card stat"><b>${users.length}</b><span>${Store.server ? "账号" : "人"}${fresh ? ` · 近 7 天新来 ${fresh}` : ""}</span></div>
        <div class="card stat"><b>${users.filter((u) => u.last_day === t).length}</b><span>今天学过</span></div>
        <div class="card stat"><b>${users.filter((u) => active(u, wk)).length}</b><span>近 7 天学过</span></div>
        <div class="card stat"><b>${sumXp7}</b><span>近 7 天经验值合计</span></div>
      </div>
      <div class="card mt">
        <div class="usage-bar">
          <input class="input" id="us-q" type="search" placeholder="搜名字" value="${esc(this.state.q)}" aria-label="搜名字">
          <div class="chips" id="us-filter">${[["all", "全部"], ["on", "近 7 天学过"], ["off", "超过 7 天没学"]].map(([k, l]) => `<button class="chip ${this.state.filter === k ? "active" : ""}" data-f="${k}">${l}</button>`).join("")}</div>
          <select class="select" id="us-sort" aria-label="排序">${USAGE_SORTS.map(([k, l]) => `<option value="${k}" ${this.state.sort === k ? "selected" : ""}>按${l}</option>`).join("")}</select>
        </div>
        <div class="usage-list" id="us-list"></div>
      </div>`;
    const list = $("#us-list", root);
    const paint = () => {
      const { q, sort, filter } = this.state;
      const key = USAGE_SORTS.find(([k]) => k === sort)[2];
      const cmp = (a, b) => { const x = key(a), y = key(b); return Array.isArray(x) ? (y[0] > x[0] ? 1 : y[0] < x[0] ? -1 : y[1] - x[1]) : y > x ? 1 : y < x ? -1 : 0; };
      const rows = users
        .filter((u) => !q || String(u.username).toLowerCase().includes(q.toLowerCase()))
        .filter((u) => filter === "all" || (filter === "on" ? active(u, wk) : !active(u, wk)))
        .sort(cmp);
      list.innerHTML = rows.length ? rows.map((u) => this.row(u)).join("") : `<div class="empty small muted">没有符合的</div>`;
    };
    paint();
    $("#us-q", root).oninput = (e) => { this.state.q = e.target.value.trim(); paint(); };
    $("#us-sort", root).onchange = (e) => { this.state.sort = e.target.value; paint(); };
    $("#us-filter", root).onclick = (e) => {
      const b = e.target.closest("[data-f]");
      if (!b) return;
      this.state.filter = b.dataset.f;
      $$("#us-filter .chip", root).forEach((c) => c.classList.toggle("active", c === b));
      paint();
    };
    list.addEventListener("toggle", (e) => {
      const d = e.target.closest?.(".usage-user");
      if (d) this.state.open[d.open ? "add" : "delete"](d.dataset.key);
    }, true);
  },

  // 最近一次学习是哪天：今天 / 昨天 / N 天前
  dayAgo(d) {
    if (!d) return "还没开始学";
    const n = Math.round((new Date(today()) - new Date(d)) / 86400000);
    return n <= 0 ? "今天学过" : n === 1 ? "昨天学过" : `${n} 天前学过`;
  },
  seenAgo(ts) {
    if (!ts) return "—";
    const m = Math.floor((Date.now() / 1000 - ts) / 60);
    return m < 2 ? "刚刚" : m < 60 ? `${m} 分钟前` : m < 1440 ? `${Math.floor(m / 60)} 小时前` : `${Math.floor(m / 1440)} 天前`;
  },
  size: (b) => (!b ? "—" : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`),

  spark(arr = []) {
    const max = Math.max(10, ...arr);
    return `<span class="usage-spark" aria-hidden="true">${arr.map((v) => `<i style="height:${v ? Math.max(12, Math.round((v / max) * 100)) : 4}%" class="${v ? "on" : ""}"></i>`).join("")}</span>`;
  },

  row(u) {
    const key = u.id || "owner:" + u.username;
    if (u.error) return `<div class="usage-user"><div class="usage-head"><b>${esc(u.username)}</b><span class="small bad-text">${esc(u.error)}</span></div></div>`;
    const t = today(), last = u.last_day;
    const state = !last ? "none" : last === t ? "today" : last >= addDays(t, -6) ? "week" : "away";
    const badges = [
      u.admin ? `<span class="badge brand">${Store.server ? "管理员" : "我"}</span>` : "",
      !u.admin && u.ai ? `<span class="badge">可用我的 AI</span>` : "",
      !u.admin && u.own_ai ? `<span class="badge">自己的 AI Key</span>` : "",
    ].join("");
    const book = BOOK_MAP[u.book]?.title || u.book || "—";
    const goal = (typeof GOALS !== "undefined" && GOALS.find((g) => g[0] === u.goal)?.[2]) || "—";
    const mods = USAGE_MODS.filter(([k]) => u.mods?.[k]).map(([k, l, unit]) => `<span class="usage-mod"><b>${k === "rs" ? Math.round(u.mods[k] / 60) : u.mods[k]}</b> ${unit} · ${l}</span>`).join("");
    const kv = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;
    return `<details class="usage-user" data-key="${esc(key)}" ${this.state.open.has(key) ? "open" : ""}>
      <summary class="usage-head">
        <span class="usage-dot ${state}" title="${this.dayAgo(last)}"></span>
        <span class="usage-name"><b>${esc(u.username)}</b>${badges}<small>${this.dayAgo(last)}${u.streak ? ` · 连续 ${u.streak} 天` : ""}</small></span>
        ${this.spark(u.spark)}
        <span class="usage-num"><b>${u.xp7 || 0}</b><small>近 7 天 XP</small></span>
        <span class="usage-num"><b>${u.words || 0}</b><small>词汇</small></span>
        <span class="usage-num hide-narrow"><b>${u.xp || 0}</b><small>累计 XP</small></span>
      </summary>
      <div class="usage-detail">
        <div class="usage-kv">
          ${Store.server ? kv("注册", esc(u.created || "—")) + kv("最近登录", this.seenAgo(u.last_seen)) : u.created ? kv("加入", esc(u.created)) : ""}
          ${kv("第一次学习", esc(u.first_day || "—"))}
          ${kv("累计学习", `${u.active_total || 0} 天`)}
          ${kv("近 30 天", `${u.active30 || 0} 天 · ${u.xp30 || 0} XP`)}
          ${kv("今天", `${u.today || 0}${u.daily_goal ? ` / ${u.daily_goal}` : ""} XP`)}
          ${kv("已掌握 / 学过", `${u.mastered || 0} / ${u.words || 0} 词`)}
          ${kv("待复习", `${u.due || 0} 词`)}
          ${kv("短语句子", `${u.sentences || 0} 条`)}
          ${kv("语法课", `${u.grammar || 0} 课`)}
          ${kv("读过的文章", `${u.reading || 0} 篇`)}
          ${kv("生词本", `${u.notebook || 0} 条`)}
          ${kv("没攻克的薄弱点", `${u.weak || 0} 条`)}
          ${kv("作文批改", `${u.essays || 0} 篇`)}
          ${kv("成就", `${u.achv || 0} 个`)}
          ${kv("词书", esc(book))}
          ${kv("学习目标", esc(goal))}
          ${kv("水平", esc(u.cefr || "没测过"))}
          ${kv("数据大小", this.size(u.size))}
        </div>
        <div class="small muted usage-sub">近 30 天做了什么</div>
        <div class="usage-mods">${mods || `<span class="small faint">近 30 天没有练习记录</span>`}</div>
      </div>
    </details>`;
  },
};
