// ============================================================
// 找功能：Ctrl+K 里输入「听写」「雅思口语」「合租」直接跳过去（命令面板）；
// 首页每天推一个「你还没试过」的功能；手机底部导航栏
// ============================================================

// [图标, 名称, 关键词（空格分开，含英文和常见叫法）, 地址]
const COMMANDS = [
  ["🏠", "首页", "home 主页 今日 计划", "#/home"],
  ["🔁", "复习单词", "review 复习 卡片 记忆", "#/words/review"],
  ["🆕", "学新词", "new 背单词 新词", "#/words/new"],
  ["📝", "单词测验", "quiz 测验 选择题 拼写", "#/words/quiz"],
  ["🔗", "搭配练习", "collocation 搭配 make do take 中式英语", "#/words/colloc"],
  ["💬", "用学过的词造句", "use sentence 造句 写句子 产出", "#/words/use"],
  ["📚", "词库", "list 词书 单元", "#/words/list"],
  ["🧬", "词根词缀", "roots morphology 前缀 后缀 词根 构词", "#/words/roots"],
  ["🌍", "主题词汇", "topics 主题 分类", "#/topics"],
  ["🩹", "薄弱点本", "weak mistakes 错题 错题本 薄弱 错误", "#/weak"],
  ["⭐", "生词本", "notebook 生词 收藏", "#/notebook"],
  ["💬", "生词本里的句子", "sentences 句子 短语 收藏", "#/notebook/sentences"],
  ["🧭", "场景短语路径", "course phrases 短语 场景 闯关", "#/course"],
  ["☀️", "每日一课", "daily 每日 一课", "#/course/daily"],
  ["🔁", "复习短语句子", "review sentences 短语复习 句子复习", "#/course/review"],
  ["🧱", "连词成句 · 句型专项", "builder patterns 连词成句 句型 仿句", "#/course/patterns"],
  ["⌨️", "跟打听写", "typing 打字 跟打 wpm", "#/course/typing"],
  ["🧩", "语法课", "grammar 语法 时态 从句", "#/grammar"],
  ["🎧", "听写句子", "dictation 听写 听力", "#/listening/dictation"],
  ["👂", "听音选义", "listening choose 听力 选意思", "#/listening/choose"],
  ["🎙️", "发音课 · 音标", "pronunciation phonics 音标 发音 ipa", "#/speaking"],
  ["🔉", "辨音训练", "minimal pairs 辨音 ship sheep think sink", "#/speaking/pairs"],
  ["🌊", "连读与语调", "linking intonation 连读 语调 弱读 重音", "#/speaking/linking"],
  ["🗣️", "跟读句子", "shadowing shadow 跟读 录音", "#/speaking/shadow"],
  ["⏱️", "流利度训练（4/3/2）", "fluency 流利 复述 432", "#/speaking/fluency"],
  ["📖", "阅读", "reading 文章 短文", "#/reading"],
  ["📚", "我的书架", "shelf bookshelf 书架 继续阅读", "#/reading/cat/mine"],
  ["📕", "原著全文", "books novels 名著 原著 小说 福尔摩斯", "#/reading/cat/books"],
  ["📰", "VOA 慢速英语", "voa news 新闻 慢速", "#/reading/cat/voa"],
  ["📜", "今日故事", "story 故事 今日 ai", "#/story"],
  ["🎬", "影视精听", "video film ted 电影 美剧 字幕", "#/video"],
  ["🎞️", "打开本地视频", "local video srt 字幕 本地", "#/video/local"],
  ["✍️", "中译英", "translate 翻译 写作", "#/writing"],
  ["📔", "英语日记", "diary journal 日记", "#/writing/diary"],
  ["📝", "作文批改", "essay 作文 批改", "#/writing/essay"],
  ["🎓", "雅思", "ielts 雅思", "#/ielts"],
  ["📖", "雅思阅读", "ielts reading 雅思阅读 真题", "#/ireading"],
  ["🎧", "雅思听力", "ielts listening 雅思听力", "#/ilisten"],
  ["🎙️", "雅思口语模考", "ielts speaking 雅思口语 模考 part2", "#/ispeak"],
  ["✍️", "雅思写作", "ielts writing 雅思写作 task", "#/iwrite"],
  ["🤖", "AI 语伴 · 自由聊天", "tutor chat ai 聊天 语伴 口语", "#/tutor"],
  ["🎭", "AI 场景口语", "scenes roleplay 场景 角色扮演 面试", "#/tutor/scenes"],
  ["🎭", "人生剧场", "life story game 剧场 剧情 选择", "#/life"],
  ["🛋️", "合租日记", "sitcom 合租 纽约 情景喜剧", "#/sitcom"],
  ["🎲", "单词游戏", "games 游戏", "#/games"],
  ["🟩", "每日猜词", "wordle 猜词", "#/games/wordle"],
  ["🪜", "单词阶梯", "word ladder 阶梯", "#/games/ladder"],
  ["🧬", "拆拼单词", "roots game 拆词 拼词", "#/games/roots"],
  ["⚡", "限时快答", "speed quiz 限时 快答 60秒", "#/games/speed"],
  ["🔠", "填字格", "crossword 填字", "#/games/cross"],
  ["👾", "单元 Boss 战", "boss 打怪 单元", "#/games/boss"],
  ["🕵️", "听力侦探", "detective case mystery 侦探 破案 推理", "#/games/case"],
  ["🏆", "成就", "achievements badges 成就 徽章", "#/achv"],
  ["📊", "学习统计", "stats 统计 记住率 周报 词汇量", "#/stats"],
  ["📏", "水平测试", "level test placement 水平 测试 词汇量 cefr", "#/level"],
  ["⚙️", "设置", "settings 设置 ai key 主题 皮肤 备份 同步", "#/settings"],
];

const Palette = {
  // 名称或关键词里包含输入的所有片段就算命中；名称开头命中的排前面
  search(q, n = 5) {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const parts = s.split(/\s+/);
    return COMMANDS.map(([ico, name, kw, href]) => {
      const hay = (name + " " + kw).toLowerCase();
      if (!parts.every((p) => hay.includes(p))) return null;
      const nm = name.toLowerCase(), score = nm.startsWith(s) ? 0 : nm.includes(s) ? 1 : kw.toLowerCase().split(/\s+/).includes(s) ? 2 : 3;
      return { ico, name, href, score };
    }).filter(Boolean).sort((a, b) => a.score - b.score).slice(0, n);
  },
};

// ---------- 你还没试过 ----------
// tried()：用过这个功能没有（看学习记录里有没有痕迹）
const DISCOVER = [
  { ico: "🔉", name: "辨音训练", text: "ship / sheep、think / sink……先练耳朵分得清，再开口说得准。", href: "#/speaking/pairs", tried: () => Object.keys(Store.data.phon || {}).length > 0 },
  { ico: "🧱", name: "连词成句", text: "一个词块一个词块扩成完整句子，每一步都有中文，还会标出句子成分。", href: "#/course/patterns", tried: () => Object.keys(Store.data.builder || {}).length > 0 },
  { ico: "🎭", name: "人生剧场", text: "在英语世界里过一段人生：每个选择都用英文，走过的路会长成一棵人生树。", href: "#/life", tried: () => Object.keys(Store.data.life || {}).length > 0 },
  { ico: "🛋️", name: "合租日记", text: "搬进纽约布鲁克林的合租公寓，和室友邻居一起过日子，在对话里学地道口语。", href: "#/sitcom", tried: () => !!Store.data.sitcom },
  { ico: "🎬", name: "影视精听", text: "TED 和 VOA 情景剧，逐句精讲、单句循环、跟读评测。", href: "#/video", tried: () => Object.keys(Store.data.video_pos || {}).length > 0 },
  { ico: "⏱️", name: "流利度训练", text: "同一个话题连说三遍，每遍时间更短（4/3/2 复述法），说得越来越顺。", href: "#/speaking/fluency", tried: () => Object.keys(Store.data.fluency || {}).length > 0 },
  { ico: "🎲", name: "单词游戏", text: "每日猜词、单词阶梯、填字格、Boss 战……用你在学的词出题。", href: "#/games", tried: () => Object.keys(Store.data.games || {}).length > 0 },
  { ico: "🕵️", name: "听力侦探", text: "证词只放声音，听出细节里的破绽，找出真相。每周一个新案子。", href: "#/games/case", tried: () => !!Store.data.games?.case },
  { ico: "📔", name: "英语日记", text: "每天写 3 句，AI 帮你改，改过的句子会安排复习。", href: "#/writing/diary", tried: () => Object.keys(Store.data.diary || {}).length > 0 },
  { ico: "🔗", name: "搭配练习", text: "「大雨」不是 big rain，「吃药」不是 eat medicine：专练中文直译最容易错的搭配。", href: "#/words/colloc", tried: () => Object.values(Store.data.days).some((d) => d?.c_colloc) },
  { ico: "🌊", name: "连读与语调", text: "10 个单元 27 课：连读、弱读、失去爆破、美式闪音，听懂快语速的关键。", href: "#/speaking/linking", tried: () => Object.keys(Store.data.phon || {}).some((k) => /link|lk/.test(k)) },
  { ico: "📏", name: "水平测试", text: "8 分钟测出词汇量和欧框等级，词书、阅读难度和 AI 都会按你的水平调整。", href: "#/level", tried: () => !!Store.data.level },
  { ico: "📕", name: "原著全文", text: "52 本公有领域名著的完整原文，按难度排好，逐段朗读和翻译。", href: "#/reading/cat/books", tried: () => Object.keys(Store.data.books || {}).length > 0 },
  { ico: "🎧", name: "听写", text: "听一句写一句，写完逐词对照，最练耳朵也最练拼写。", href: "#/listening/dictation", tried: () => (Store.data.stats?.dictation || 0) > 0 },
  { ico: "🤖", name: "AI 语伴", text: "6 种性格的语伴陪你聊天，每句话都温柔纠错；不会说的直接打中文。", href: "#/tutor", tried: () => (Store.data.stats?.chat || 0) > 0, need: () => AI.enabled },
  { ico: "📜", name: "今日故事", text: "用今天要复习的词写成的小故事，在语境里再见一次。", href: "#/story", tried: () => Object.values(Store.data.days).some((d) => d?.c_story) },
];
function discoverHtml() {
  const skip = Store.prefs.discover_skip || [];
  if (Object.keys(Store.data.words).length < 5 && !Store.data.level) return ""; // 刚开始用，先别分散注意力
  const list = DISCOVER.filter((d) => !skip.includes(d.name) && (!d.need || d.need()) && !(() => { try { return d.tried(); } catch { return true; } })());
  if (!list.length) return "";
  const d = list[Math.floor(seededRandom("discover:" + today())() * list.length)];
  return `<div class="card discover-card"><span class="discover-ico">${d.ico}</span>
    <div style="flex:1;min-width:0"><div class="small muted">✨ 你还没试过</div><b>${esc(d.name)}</b><div class="small">${esc(d.text)}</div></div>
    <div class="discover-act"><a class="btn sm primary" href="${d.href}">去试试</a><button class="btn sm ghost" data-discover-skip="${esc(d.name)}" title="不再推荐这个">不感兴趣</button></div></div>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-discover-skip]");
  if (!b) return;
  (Store.prefs.discover_skip ||= []).push(b.dataset.discoverSkip);
  Store.save();
  b.closest(".discover-card")?.remove();
});

// ---------- 手机底部导航 ----------
// 底栏图标：自己画的细线图标（参考 SF Symbols 的粗细和圆角），不用彩色表情。.f 是选中时铺一层浅色的面
const NAV_ICONS = {
  home: `<path class="f" d="M4 10.4 12 4.2l8 6.2V19a1.4 1.4 0 0 1-1.4 1.4H15v-5.6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.6H5.4A1.4 1.4 0 0 1 4 19z"/>`,
  words: `<rect x="8.2" y="2.9" width="11" height="14.6" rx="2.4" transform="rotate(8 13.7 10.2)" opacity=".55"/><rect class="f" x="4.8" y="5.4" width="11" height="15.2" rx="2.4"/><path d="M8 16.2 10.3 9.6l2.3 6.6M8.8 14h3"/>`,
  reading: `<path class="f" d="M12 6.6C10 5 7.1 4.4 3.6 4.8v13.6c3.5-.4 6.4.2 8.4 1.8 2-1.6 4.9-2.2 8.4-1.8V4.8C16.9 4.4 14 5 12 6.6z"/><path d="M12 6.6v13.6"/>`,
  games: `<path class="f" d="M7.4 7.6h9.2a4.2 4.2 0 0 1 4.1 5.1l-.9 4.2a2.3 2.3 0 0 1-3.9 1.1L14 16h-4l-1.9 2a2.3 2.3 0 0 1-3.9-1.1l-.9-4.2a4.2 4.2 0 0 1 4.1-5.1z"/><path d="M8 10.6v3.2M6.4 12.2h3.2"/><circle cx="15.6" cy="11.2" r=".55" fill="currentColor"/><circle cx="17.4" cy="13" r=".55" fill="currentColor"/>`,
  more: `<circle cx="5.5" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.35" fill="currentColor" stroke="none"/>`,
  menu: `<path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h10"/>`,
  search: `<circle cx="10.6" cy="10.6" r="6.1"/><path d="m15.2 15.2 4.6 4.6"/>`,
};
const navIcon = (k) => `<svg class="ln-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${NAV_ICONS[k]}</svg>`;
const BOTTOM_NAV = [
  ["home", "首页", ["home", "stats", "achv", "level"]],
  ["words", "单词", ["words", "topics", "weak", "notebook"]],
  ["reading", "阅读", ["reading", "book", "story"]],
  ["games", "游戏", ["games"]],
];
// 左上角的 ☰ 和 🔍 也换成同一套细线图标
for (const [id, k] of [["nav-burger", "menu"], ["nav-fab-search", "search"]]) { const b = document.getElementById(id); if (b) b.innerHTML = navIcon(k); }
function renderBottomNav() {
  const bar = $("#bottom-nav");
  if (!bar || !Store.data) return;
  // 只在第一次建好里面的按钮，之后只改选中项和角标：整个重建会把液态玻璃的 canvas（在底栏里面）一起扔掉，
  // 快速切换页面时一直重建，iPhone 上会因为内存不够把网页关掉（「重复出现问题」）
  if (!$(".bn-item", bar)) {
    bar.insertAdjacentHTML("beforeend", `<span class="bn-lens" aria-hidden="true"></span>`
      + BOTTOM_NAV.map(([id, label]) => `<a class="bn-item" href="#/${id}" data-bn="${id}"><span class="bn-ico">${navIcon(id)}</span><span class="bn-label">${label}</span></a>`).join("")
      + `<button class="bn-item" id="bn-more" aria-label="更多功能"><span class="bn-ico">${navIcon("more")}</span><span class="bn-label">更多</span></button>`);
  }
  const page = Router.current().page;
  for (const [id, , pages] of BOTTOM_NAV) $(`[data-bn="${id}"]`, bar)?.classList.toggle("active", pages.includes(page));
  const due = dueWords().length + (typeof Weak !== "undefined" ? Weak.count() : 0);
  const ico = $('[data-bn="words"] .bn-ico', bar);
  let badge = $(".bn-badge", ico);
  if (due && !badge) badge = ico.appendChild(el(`<i class="bn-badge"></i>`));
  if (badge) { if (due) badge.textContent = due > 99 ? "99+" : due; else badge.remove(); }
  placeLens();
  RealGlass.start();
}
// 镜片移到选中的那一项下面（没有选中的就藏起来）
function placeLens() {
  const bar = $("#bottom-nav"), lens = $(".bn-lens", bar || document), act = bar && $(".bn-item.active", bar);
  if (!lens) return;
  if (!act || !act.offsetWidth) { lens.classList.remove("on"); return; }
  const w = Math.min(act.offsetWidth - 4, 76);
  lens.style.width = `${w}px`;
  lens.style.transform = `translateX(${act.offsetLeft + (act.offsetWidth - w) / 2}px)`;
  lens.classList.add("on");
}
window.addEventListener("resize", () => placeLens());

// 真正的液态玻璃（会折射后面的内容）：apple-liquid-glass-webgl 用 WebGL2 把底栏后面的页面重画一遍再弯折
// 只在手机宽度、通过网址打开（局域网 / 服务器）时加载：桌面版是本地文件，WebGL 读不了本地图片；底栏也只在手机上出现
// 加载失败或不支持 WebGL2 时，CSS 的毛玻璃照样在（.liquid-glass）
const RealGlass = {
  started: false,
  // 玻璃后面画什么：页面的底色和一层柔光（不去扫描整个页面的内容）。
  // 库默认会把底栏后面的页面元素一个个重新画出来，滚动和换页面时都要重画，手机上会卡、内存也吃紧
  backdrop(ctx, r) {
    const css = getComputedStyle(document.documentElement);
    const bg = css.getPropertyValue("--bg").trim() || "#eee", surf = css.getPropertyValue("--surface").trim() || bg;
    ctx.fillStyle = bg;
    ctx.fillRect(r.x, r.y, r.width, r.height);
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.height);
    g.addColorStop(0, surf);
    g.addColorStop(1, bg);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.width, r.height);
    ctx.globalAlpha = 1;
  },
  start() {
    if (this.started || !/^https?:$/.test(location.protocol) || !NARROW?.matches || matchMedia("(prefers-reduced-transparency: reduce)").matches) return;
    this.started = true;
    loadScript("js/vendor/liquid-glass.min.js").then(() => {
      const LG = window.LiquidGlass;
      if (!LG?.isSupported?.()) return;
      for (const sel of ["#bottom-nav", ".nav-fab"]) {
        try {
          new LG(sel, { backdrop: (ctx, r) => this.backdrop(ctx, r), tintTone: "auto", maxDpr: 2, fallback: "none",
            material: { backdropBlur: 4, tint: 0.3, dispersion: 1.2 } });
        } catch (e) { console.info("液态玻璃没开成：", e.message); }
      }
    }).catch(() => { /* 没加载到就用 CSS 的毛玻璃 */ });
  },
};
document.addEventListener("click", (e) => { if (e.target.closest("#bn-more")) setNavOpen(true); });
// 手机上左上角的搜索按钮：往下滚就收起来（不压在内容上），往上滚一点或回到顶部再出来
(() => {
  let last = 0;
  const onScroll = (e) => {
    const y = e.target === document ? window.scrollY : e.target.scrollTop;
    if (Math.abs(y - last) < 6) return;
    document.body.classList.toggle("fab-away", y > 40 && y > last);
    last = y;
  };
  document.getElementById("view")?.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("hashchange", () => { last = 0; document.body.classList.remove("fab-away"); });
})();
