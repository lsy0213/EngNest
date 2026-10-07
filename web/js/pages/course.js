// 短语与句子：把词用起来（场景短语闯关参考 Mondly 的学习路径）。场景短语每课混合多种题型，每个单元最后是一课「连词成句」；
// 另有「句型专项」（按语法点的连词成句）和「跟打听写」（打字引擎，见 typing.js）
// 路由：#/course 路径图 · #/course/patterns 句型专项 · #/course/typing 跟打听写 · #/course/<单元 id>/<课> 上课 · #/course/daily 每日一课 · #/course/weekly 每周测验
const ALL_PHRASES = PHRASE_UNITS.flatMap((u, ui) => u.lessons.flatMap((l, li) => l.phrases.map(([en, zh, tip]) => ({ en, zh, tip, ui, li }))));
// 不属于任何单元的连词成句课放进「句型专项」，按 PATTERN_CATS（data/builder_patterns.js）分类、分组排序；
// 目录里没列到的课放在语法分类最后。另有「考纲例句」分类，由词书例句自动生成（见 builder.js 的 ExamBuilder）
const UNIT_BUILDERS = new Set(PHRASE_UNITS.map((u) => u.builder));
const PATTERN_CATS = (window.PATTERN_CATS || [{ id: "grammar", title: "语法句型", icon: "📐", groups: [] }]).map((c) => ({
  ...c, groups: c.groups.map((g) => ({ ...g, lessons: g.ids.map((id) => BUILDER_LESSONS.find((l) => l.id === id)).filter(Boolean) })),
}));
(() => {
  const listed = new Set(PATTERN_CATS.flatMap((c) => c.groups.flatMap((g) => g.ids)));
  const extra = BUILDER_LESSONS.filter((l) => !UNIT_BUILDERS.has(l.id) && !listed.has(l.id));
  if (extra.length) PATTERN_CATS[0].groups.push({ title: "更多", lessons: extra });
})();
const PATTERN_LESSONS = PATTERN_CATS.flatMap((c) => c.groups.flatMap((g) => g.lessons.map((l) => ((l.cat = c.id), l))));
// 旧版进度按「单元序号-课序号」记录，这是当时的单元顺序，用来迁移成「单元 id-课序号」
const COURSE_OLD_ORDER = ["hello", "me", "cafe", "restaurant", "shopping", "directions", "hotel", "airport", "health", "work", "phone", "chat"];

App.pages.course = {
  key: (ui, li) => `${PHRASE_UNITS[ui].id}-${li}`,
  rec(ui, li) { return (Store.data.course ||= {})[this.key(ui, li)]; },
  migrate() {
    const c = (Store.data.course ||= {});
    const old = Object.keys(c).filter((k) => /^\d+-\d+$/.test(k));
    if (!old.length) return;
    old.forEach((k) => {
      const [ui, li] = k.split("-");
      const nk = `${COURSE_OLD_ORDER[+ui]}-${li}`;
      if (COURSE_OLD_ORDER[+ui] && !c[nk]) c[nk] = c[k];
      delete c[k];
    });
    Store.save();
  },
  // 按路径顺序，前一课完成就解锁。后面有课已经完成时也算解锁（老进度、后来新加的单元和课不会被锁住）
  order() { return (this._order ||= PHRASE_UNITS.flatMap((u, ui) => u.lessons.map((_, li) => [ui, li]))); },
  unlocked(ui, li) {
    const order = this.order();
    const i = order.findIndex(([a, b]) => a === ui && b === li);
    if (i <= 0) return i === 0;
    return order.slice(i - 1).some(([a, b]) => this.rec(a, b));
  },
  // 单元的连词成句课：学完本单元最后一课后开放
  builderOpen(ui) {
    const u = PHRASE_UNITS[ui];
    return !!(App.pages.builder.rec(u.builder) || this.rec(ui, u.lessons.length - 1));
  },
  seen() { return (Store.data.phrases ||= {}); },

  render(root, params, signal) {
    this._page = signal;
    this.migrate();
    if (params[0] === "daily") return this.play(root, this.dailyItems(), { title: "每日一课", kind: "daily" });
    if (params[0] === "weekly") return this.play(root, this.weeklyItems(), { title: "每周复习测验", kind: "weekly", noIntro: true });
    if (params[0] === "patterns" || params[0] === "typing") return this.path(root, params[0], signal, params.slice(1));
    if (params[0] === "review") return this.review(root, signal);
    const ui = PHRASE_UNITS.findIndex((u) => u.id === params[0]), li = +params[1];
    if (PHRASE_UNITS[ui]?.lessons[li]) {
      if (!this.unlocked(ui, li)) { toast("先完成前面的课程才能解锁哦"); Router.go("course"); return; }
      const items = ALL_PHRASES.filter((p) => p.ui === ui && p.li === li);
      return this.play(root, items, { title: `${PHRASE_UNITS[ui].icon} ${PHRASE_UNITS[ui].title} · ${PHRASE_UNITS[ui].lessons[li].title}`, kind: "lesson", ui, li });
    }
    this.path(root, "path");
  },

  // ---------- 短语和句子的间隔复习 ----------
  reviewBanner() {
    const n = SentSRS.count(), all = Object.keys(SentSRS.data()).length;
    if (!all) return "";
    return `<a class="card review-banner ${n ? "due" : ""}" href="#/course/review"><span style="font-size:26px">🔁</span>
      <div style="flex:1"><b>短语和句子复习</b><div class="small muted">${n ? `有 ${n} 条到了复习时间：看中文说英文，按记忆曲线安排` : `复习计划里有 ${all} 条，今天的都复习完了`}</div></div>
      ${n ? `<span class="btn primary">开始复习</span>` : `<span class="good-text">✓</span>`}</a>`;
  },
  review(root, signal) {
    const due = SentSRS.due();
    root.innerHTML = `<a class="back-link" href="#/course">‹ 返回短语与句子</a>`
      + pageHead("🔁 短语和句子复习", "短语课学过的短语和生词本里的句子，按记忆曲线安排复习。看中文，先把英文说出来，再看答案") + `<div id="rv"></div>`;
    const box = $("#rv", root);
    if (!due.length) {
      const next = Object.values(SentSRS.data()).map((x) => x.due).sort()[0];
      box.innerHTML = `<div class="card empty"><div class="big">🎉</div><h3>今天没有要复习的</h3>
        <p>${next ? `下一次复习在 ${esc(next)}。` : "学完短语课，或者在生词本里收藏句子，就会出现在这里。"}</p><a class="btn primary" href="#/course">去学新短语</a></div>`;
      return;
    }
    const batch = due.slice(0, 30);
    runSentenceCards(box, batch, signal, (actions) => {
      const left = SentSRS.count();
      actions.innerHTML = `<a class="btn primary" href="#/course">返回</a>${left ? `<button class="btn" id="rv-more">再来一组（还有 ${left} 条）</button>` : ""}`;
      const more = $("#rv-more", actions);
      if (more) more.onclick = () => Router.render();
    });
  },

  // ---------- 场景路径 / 句型专项 / 跟打听写 ----------
  path(root, tab, signal, sub = []) {
    root.innerHTML = pageHead("短语与句子", "",
      tabsHtml([["path", "🧭 场景路径"], ["patterns", "🧱 句型专项"], ["typing", "⌨️ 跟打听写"]], tab))
      + (tab === "path" ? this.reviewBanner() : "")
      + (tab === "patterns" ? this.patternsHtml(sub) : tab === "typing" ? `<div id="ty-box"></div>` : this.unitsHtml());
    $$(".tab", root).forEach((b) => (b.onclick = () => Router.go(b.dataset.tab === "path" ? "course" : `course/${b.dataset.tab}`)));
    if (tab === "typing") return App.pages.typing.embed($("#ty-box", root), signal, "sentences");
    const rnd = $("#bd-random", root);
    if (rnd) rnd.onclick = () => {
      const left = ExamBuilder.book(rnd.dataset.book).lessons.filter((l) => !App.pages.builder.rec(l.id));
      if (left.length) Router.go(`builder/${pick(left).id}`);
      else toast("这本书的例句都练完啦");
    };
    $$(".course-node.locked", root).forEach((n) => (n.onclick = () => toast(n.dataset.lock || "先完成前面的课程才能解锁哦")));
    // 路径很长，打开时滚到当前要学的那一课
    const cur = tab === "path" && $(".course-node.open", root);
    if (cur && cur.closest(".course-unit") !== $(".course-unit", root)) cur.scrollIntoView({ block: "center" });
  },

  unitsHtml() {
    const today_ = (Store.data.course_daily || {})[today()];
    const weekCount = this.weeklyItems().length;
    const stars = (r) => "★".repeat(r.stars) + "☆".repeat(3 - r.stars);
    return `<div class="grid grid-2" style="margin-bottom:20px">
          <a class="card course-hero" href="#/course/daily"><div class="task-ico">${today_ ? "✅" : "☀️"}</div>
            <div><b>每日一课</b><div class="small muted">${today_ ? `今天已完成 · ${"★".repeat(today_)}` : "复习旧短语 + 学几个新短语，约 5 分钟"}</div></div></a>
          <a class="card course-hero ${weekCount < 4 ? "disabled" : ""}" href="${weekCount < 4 ? "javascript:void 0" : "#/course/weekly"}"><div class="task-ico">🏆</div>
            <div><b>每周复习测验</b><div class="small muted">${weekCount < 4 ? "本周学满 4 个短语后开放" : `本周学过 ${weekCount} 个短语，来测一测`}</div></div></a>
        </div>`
      + PHRASE_UNITS.map((u, ui) => {
        const b = BUILDER_LESSONS.find((l) => l.id === u.builder);
        const br = App.pages.builder.rec(b.id), bOpen = this.builderOpen(ui);
        const n = u.lessons.filter((_, li) => this.rec(ui, li)).length + (br ? 1 : 0);
        return `
        <div class="course-unit">
          <div class="course-unit-head"><span class="unit-num">${u.icon}</span><div style="flex:1"><b>第 ${ui + 1} 单元 · ${u.title}</b>
            <div class="small muted">${u.lessons.map((l) => l.title).join(" · ")} · 连词成句</div></div>
            <span class="small ${n === u.lessons.length + 1 ? "good-text" : "faint"}">${n} / ${u.lessons.length + 1}</span></div>
          <div class="course-nodes">${u.lessons.map((l, li) => {
            const r = this.rec(ui, li), open = this.unlocked(ui, li);
            return `<a class="course-node ${r ? "done" : open ? "open" : "locked"}" href="${open ? `#/course/${u.id}/${li}` : "javascript:void 0"}" title="${esc(l.title)}">
              <span class="node-ico">${r ? "✓" : open ? "▶" : "🔒"}</span>
              <span class="node-title">${esc(l.title)}</span>
              <span class="node-stars">${r ? stars(r) : `${l.phrases.length} 个短语`}</span></a>`;
          }).join("")}
            <a class="course-node bd-node ${br ? "done" : bOpen ? "open" : "locked"}" href="${bOpen ? `#/builder/${b.id}` : "javascript:void 0"}"
              data-lock="学完本单元的 ${u.lessons.length} 课短语，就能挑战连词成句" title="看中文打英文，用本单元的场景一步步搭出完整句子">
              <span class="node-ico">${br ? "✓" : "🧱"}</span>
              <span class="node-title">连词成句</span>
              <span class="node-stars">${br ? stars(br) : `${b.sentences.length} 句 · 单元挑战`}</span></a>
          </div>
        </div>`;
      }).join("");
  },

  // 句型专项：顶部分类（语法 / 写作 / 口语 / 考纲例句），路由 #/course/patterns/<分类>[/<词书>]，上次看的分类会记住
  patternsHtml(sub) {
    const P = Store.prefs;
    const cats = [...PATTERN_CATS.map((c) => c.id), "exam"];
    const cat = cats.includes(sub[0]) ? sub[0] : cats.includes(P.bd_cat) ? P.bd_cat : cats[0];
    if (P.bd_cat !== cat) { P.bd_cat = cat; Store.save(); }
    const rec = (id) => App.pages.builder.rec(id);
    const stars = (r) => (r ? "★".repeat(r.stars) + "☆".repeat(3 - r.stars) : "");
    const count = (ls) => ls.reduce((n, l) => n + l.sentences.length, 0);
    const books = ExamBuilder.books();
    const examN = books.reduce((n, b) => n + b.sentences, 0);
    const demo = BUILDER_LESSONS.find((l) => l.id === "daily").sentences[0];
    const intro = `<div class="card bd-intro">
          <div class="bd-demo">${demo.map(([en, zh], k) => `<div class="bd-demo-row" style="animation-delay:${k * 0.15}s"><span class="zh">${esc(zh)}</span><span class="en">${esc(en)}</span></div>`).join("")}</div>
          <div class="small muted">看中文，打英文。每句话从一个词块开始，一步步搭成完整的句子；每步做完还会拆解句子成分。<br>
            场景类的连词成句放在「场景路径」每个单元的最后；这里按<b>语法</b>、<b>写作</b>、<b>口语</b>句型专项练习，「考纲例句」用四六级、雅思、托福词书里的例句练，随时都能打开。<br><br>
            <span class="kbd">空格</span> 下一个词 · <span class="kbd">Enter</span> 提交 · <span class="kbd">Ctrl</span>+<span class="kbd">'</span> 播放发音 · <span class="kbd">Ctrl</span>+<span class="kbd">;</span> 显示答案 · <span class="kbd">/</span> 提示字母<br>请先把输入法切换到英文。</div>
        </div>`;
    const chips = `<div class="chips bd-cats">${PATTERN_CATS.map((c) => {
        const ls = c.groups.flatMap((g) => g.lessons);
        return `<a class="chip ${c.id === cat ? "active" : ""}" href="#/course/patterns/${c.id}">${c.icon} ${esc(c.title)} <span class="bd-cat-n">${ls.length} 课 · ${count(ls)} 句</span></a>`;
      }).join("")}<a class="chip ${cat === "exam" ? "active" : ""}" href="#/course/patterns/exam">📚 考纲例句 <span class="bd-cat-n">${examN.toLocaleString()} 句</span></a></div>`;

    if (cat === "exam") {
      const book = books.find((b) => b.id === sub[1]) || books.find((b) => b.id === P.bd_exam_book) || books[0];
      if (!book) return intro + chips + `<div class="card empty mt">词书数据没有加载</div>`;
      if (P.bd_exam_book !== book.id) { P.bd_exam_book = book.id; Store.save(); }
      const done = book.lessons.filter((l) => rec(l.id)).length;
      const nextL = book.lessons.find((l) => !rec(l.id));
      return intro + chips + `<div class="card bd-exam-head mt">
          <div class="chips">${books.map((b) => `<a class="chip ${b === book ? "active" : ""}" href="#/course/patterns/exam/${b.id}">${b.name} <span class="bd-cat-n">${b.sentences.toLocaleString()} 句</span></a>`).join("")}</div>
          <div class="small muted mt-s">${esc(book.title)}：每个词挑一个词书里的例句，先打单词，再打句子里的固定搭配（有的话），最后打整句。每组 ${ExamBuilder.per} 个词，按词书单元排列。</div>
          <div class="row mt-s" style="gap:12px;flex-wrap:wrap">
            <div style="flex:1;min-width:200px"><div class="small">已完成 <b>${done}</b> / ${book.lessons.length} 组</div>
              <div class="bar mt-s"><i style="width:${(done / book.lessons.length) * 100}%"></i></div></div>
            ${nextL ? `<a class="btn primary" href="#/builder/${nextL.id}">${done ? "继续" : "开始"}：${esc(nextL.unit)} · 第 ${nextL.k + 1} 组 →</a>` : `<span class="good-text">✓ 全部完成</span>`}
            <button class="btn" id="bd-random" data-book="${book.id}">🎲 随机一组</button></div>
        </div>
        <div class="bd-units mt">${book.units.map((u) => {
          const n = u.lessons.filter((l) => rec(l.id)).length;
          return `<div class="card bd-unit"><div class="row"><b>${esc(u.title)}</b><span class="spacer"></span>
              <span class="small ${n === u.lessons.length ? "good-text" : "faint"}">${n} / ${u.lessons.length}</span></div>
            <div class="small faint">${u.words} 句</div>
            <div class="bd-groups">${u.lessons.map((l) => {
              const r = rec(l.id);
              return `<a class="bd-g ${r ? "done" : ""}" href="#/builder/${l.id}" title="${esc(l.desc)}">${l.k + 1}${r ? `<i>${stars(r)}</i>` : ""}</a>`;
            }).join("")}</div></div>`;
        }).join("")}</div>`;
    }

    const c = PATTERN_CATS.find((x) => x.id === cat);
    let i = 0;
    return intro + chips + (c.desc ? `<div class="small muted mt-s">${esc(c.desc)}</div>` : "") + c.groups.filter((g) => g.lessons.length).map((g) => {
      const n = g.lessons.filter((l) => rec(l.id)).length;
      return `<div class="bd-group-head"><b>${esc(g.title)}</b>${g.desc ? `<span class="small muted">${esc(g.desc)}</span>` : ""}<span class="spacer"></span>
          <span class="small ${n === g.lessons.length ? "good-text" : "faint"}">${n} / ${g.lessons.length}</span></div>
        <div class="grid grid-3">${g.lessons.map((l) => {
          const r = rec(l.id);
          const steps = l.sentences.reduce((m, s) => m + s.length, 0);
          return `<a class="card lesson-card" href="#/builder/${l.id}" style="text-decoration:none;color:inherit">
            <div class="row"><span class="num">第 ${++i} 课</span><span class="spacer"></span>
              <span class="node-stars" style="color:#E0A020">${stars(r)}</span></div>
            <h3>${l.icon} ${esc(l.title)}</h3><p>${esc(l.desc)}</p>
            <div class="small faint">${l.sentences.length} 句 · ${steps} 步</div></a>`;
        }).join("")}</div>`;
    }).join("");
  },

  dailyItems() {
    // 复习：学过但最久没练的 4 个；新学：路径上下一课里还没见过的 4 个
    const seen = this.seen();
    const old = ALL_PHRASES.filter((p) => seen[p.en]).sort((a, b) => (seen[a.en].last > seen[b.en].last ? 1 : -1)).slice(0, 4);
    const fresh = ALL_PHRASES.filter((p) => !seen[p.en]).slice(0, 8 - old.length);
    return shuffle([...old, ...fresh]);
  },
  weeklyItems() {
    const seen = this.seen(), since = addDays(today(), -6);
    return sample(ALL_PHRASES.filter((p) => seen[p.en] && seen[p.en].last >= since), 10);
  },

  // ---------- 课程播放器 ----------
  play(root, items, opt) {
    const signal = freshSignal(this, this._page);
    if (!items.length) { root.innerHTML = `<div class="card empty"><div class="big">🎉</div>所有短语都学完啦！<a class="btn primary mt" href="#/course">返回课程</a></div>`; return; }
    const seen = this.seen();
    const words = (s) => s.replace(/[.,!?;:"]/g, "").split(/\s+/).filter(Boolean);
    const norm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9'\s-]/g, " ").split(/\s+/).filter(Boolean).join(" ");

    // 组装步骤：新短语先「认识」再做题；第二轮换一种题型巩固
    const types = ["zh2en", "listen", "build", "fill", "type"];
    const steps = [];
    let t = 0;
    const qType = (p) => {
      let ty = types[t++ % types.length];
      if (ty === "fill" && words(p.en).length < 3) ty = "build";
      if (ty === "build" && words(p.en).length < 2) ty = "zh2en";
      return ty;
    };
    items.forEach((p, i) => {
      if (!opt.noIntro && !seen[p.en]) steps.push({ type: "intro", p });
      if (i > 0) steps.push({ type: qType(items[i - 1]), p: items[i - 1] });
    });
    steps.push({ type: qType(items[items.length - 1]), p: items[items.length - 1] });
    sample(items, Math.min(6, items.length)).forEach((p) => steps.push({ type: qType(p), p }));

    const st = { i: 0, right: 0, total: 0 };
    let answered = false, current = null;
    // Ctrl+M 跟读：新短语介绍页和答完题之后可以跟读（答题时会泄露答案，不行）
    App.shadowTarget = () => (answered && current?.p ? [{ en: current.p.en, zh: current.p.zh, label: "短语" }] : null);

    root.innerHTML = `<div class="lesson-wrap">
      <div class="lesson-top"><a class="btn ghost sm" href="#/course">✕</a><div class="bar" style="flex:1"><i id="lp" style="width:0"></i></div><span class="small muted" id="lc"></span></div>
      <div class="small muted center" style="margin:6px 0 16px">${esc(opt.title)}</div>
      <div class="card lesson-card-main" id="stage"></div>
      <div class="lesson-foot" id="foot"></div></div>`;
    const stage = $("#stage", root), foot = $("#foot", root);

    const others = (p, key, n = 3) => sample(ALL_PHRASES.filter((x) => x[key] !== p[key]), n).map((x) => x[key]);

    const show = () => {
      if (st.i >= steps.length) return finish();
      answered = false;
      current = steps[st.i];
      const { type, p } = current;
      $("#lp", root).style.width = `${(st.i / steps.length) * 100}%`;
      $("#lc", root).textContent = `${st.i + 1} / ${steps.length}`;
      foot.className = "lesson-foot";
      foot.innerHTML = "";

      if (type === "intro") {
        stage.innerHTML = `<div class="small muted">✨ 新短语</div>
          <div class="intro-en">${esc(p.en)}</div><div class="intro-zh">${esc(p.zh)}</div>
          ${p.tip ? `<div class="phrase-tip">💡 ${esc(p.tip)}</div>` : ""}
          <div class="row mt" style="justify-content:center">${speakBtn(p.en)}<button class="btn sm ghost" data-say="${esc(p.en)}" data-rate="0.6">🐢 慢速</button>${shadowBtn(p.en, { zh: p.zh }, false)}</div>
          <div class="kbd-hint">Ctrl+M 跟读评测</div>`;
        TTS.speak(p.en);
        foot.innerHTML = `<span class="spacer"></span><button class="btn primary lg" id="go">知道了 <span class="kbd">Enter</span></button>`;
        $("#go", foot).onclick = next;
        answered = true;
        return;
      }

      if (type === "zh2en" || type === "listen") {
        const isListen = type === "listen";
        const key = isListen ? "zh" : "en";
        const opts = shuffle([p[key], ...others(p, key)]);
        stage.innerHTML = `<div class="small muted">${isListen ? "🎧 听一听，选出意思" : "🔤 选出正确的英文"}</div>
          ${isListen ? `<div class="player"><button class="play-big" data-say="${esc(p.en)}">🔊</button></div>` : `<div class="q-zh">${esc(p.zh)}</div>`}
          <div class="options mt">${opts.map((o, i) => `<button class="option" data-v="${esc(o)}"><span class="letter">${i + 1}</span><span ${isListen ? "" : 'style="font-family:var(--font-en)"'}>${esc(o)}</span></button>`).join("")}</div>`;
        if (isListen) TTS.speak(p.en);
        $$(".option", stage).forEach((b) => (b.onclick = () => {
          if (answered) return;
          b.classList.add("picked");
          check(b.dataset.v === p[key], b);
        }));
        return;
      }

      if (type === "build") {
        const target = words(p.en);
        const pool = shuffle([...target, ...sample(ALL_PHRASES.flatMap((x) => words(x.en)).filter((w) => !target.map((t) => t.toLowerCase()).includes(w.toLowerCase())), 2)]);
        const picked = [];
        stage.innerHTML = `<div class="small muted">🧩 点击单词，拼出这句话</div><div class="q-zh">${esc(p.zh)}</div>
          <div class="build-line" id="line"></div><div class="tiles" id="tiles">${pool.map((w, i) => `<button class="tile" data-i="${i}">${esc(w)}</button>`).join("")}</div>`;
        const line = $("#line", stage);
        const redraw = () => {
          line.innerHTML = picked.map((i, k) => `<button class="tile in" data-k="${k}">${esc(pool[i])}</button>`).join("") || `<span class="faint small">在下面点选单词</span>`;
          $$("#tiles .tile", stage).forEach((b) => b.classList.toggle("used", picked.includes(+b.dataset.i)));
          foot.innerHTML = `<span class="spacer"></span><button class="btn primary lg" id="chk" ${picked.length ? "" : "disabled"}>检查 <span class="kbd">Enter</span></button>`;
          $("#chk", foot).onclick = () => check(norm(picked.map((i) => pool[i]).join(" ")) === norm(p.en));
        };
        $("#tiles", stage).onclick = (e) => { const b = e.target.closest(".tile"); if (b && !answered && !picked.includes(+b.dataset.i)) { picked.push(+b.dataset.i); redraw(); } };
        line.onclick = (e) => { const b = e.target.closest(".tile"); if (b && !answered) { picked.splice(+b.dataset.k, 1); redraw(); } };
        redraw();
        return;
      }

      if (type === "fill") {
        const ws = words(p.en);
        const cand = ws.map((w, i) => [w, i]).filter(([w]) => w.length >= 3);
        const [ans, idx] = cand.sort((a, b) => b[0].length - a[0].length)[Math.floor(Math.random() * Math.min(2, cand.length))];
        current.ans = ans;
        const opts = shuffle([ans, ...sample([...new Set(ALL_PHRASES.flatMap((x) => words(x.en)).filter((w) => w.length >= 3 && w.toLowerCase() !== ans.toLowerCase()))], 3)]);
        let k = 0;
        const shown = p.en.replace(/[A-Za-z'’-]+/g, (m) => (k++ === idx ? "_____" : m));
        stage.innerHTML = `<div class="small muted">✏️ 选词填空</div><div class="q-en">${esc(shown)}</div><div class="small muted center">${esc(p.zh)}</div>
          <div class="options two mt">${opts.map((o, i) => `<button class="option" data-v="${esc(o)}"><span class="letter">${i + 1}</span><span style="font-family:var(--font-en)">${esc(o)}</span></button>`).join("")}</div>`;
        $$(".option", stage).forEach((b) => (b.onclick = () => { if (!answered) { b.classList.add("picked"); check(b.dataset.v === ans, b); } }));
        return;
      }

      // type：打字翻译
      stage.innerHTML = `<div class="small muted">⌨️ 用英文写出来</div><div class="q-zh">${esc(p.zh)}</div>
        <div class="row" style="justify-content:center">${speakBtn(p.en, "sm")}<span class="small faint">不会可以先听一下</span></div>
        <input class="input en mt" id="ans" placeholder="Type in English…" autocomplete="off" spellcheck="false">`;
      const inp = $("#ans", stage);
      setTimeout(() => inp.focus(), 50);
      foot.innerHTML = `<span class="spacer"></span><button class="btn primary lg" id="chk">检查 <span class="kbd">Enter</span></button>`;
      const go = () => { if (!answered && inp.value.trim()) check(norm(inp.value) === norm(p.en)); };
      $("#chk", foot).onclick = go;
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.stopPropagation(); if (answered) next(); else go(); } });
    };

    const check = (ok, btn) => {
      answered = true;
      const { p } = current;
      st.total++;
      const rec = (seen[p.en] ||= { seen: 0, right: 0, last: today() });
      rec.seen++;
      rec.last = today();
      if (ok) { st.right++; rec.right++; addXP(1); }
      else if (!current.retry) steps.push({ ...current, retry: true }); // 答错的题最后再来一次（只重来一次）
      if (btn) {
        const answer = { listen: p.zh, zh2en: p.en, fill: current.ans }[current.type];
        $$(".option", stage).forEach((b) => {
          b.disabled = true;
          if (b.dataset.v === answer) b.classList.add("right");
        });
        if (!ok) btn.classList.add("wrong");
      }
      Store.save();
      foot.className = `lesson-foot ${ok ? "ok" : "bad"}`;
      foot.innerHTML = `<div><b>${ok ? pick(["太棒了！", "答对了！", "完美！", "Great job!"]) : "正确答案："}</b>
          <div class="foot-ans">${esc(p.en)} ${speakBtn(p.en, "sm")}${shadowBtn(p.en, { zh: p.zh })}</div><div class="small">${esc(p.zh)}</div>${p.tip ? `<div class="small muted">💡 ${esc(p.tip)}</div>` : ""}</div>
        <span class="spacer"></span><button class="btn ${ok ? "good" : "bad"} lg" id="go">继续 <span class="kbd">Enter</span></button>`;
      $("#go", foot).onclick = next;
      if (current.type !== "listen") TTS.speak(p.en);
    };

    const next = () => { st.i++; show(); };

    const finish = () => {
      const acc = st.total ? st.right / st.total : 1;
      const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
      addXP(5 + stars * 2);
      if (opt.kind === "lesson") {
        const old = this.rec(opt.ui, opt.li);
        Store.data.course[this.key(opt.ui, opt.li)] = { stars: Math.max(stars, old?.stars || 0), date: today(), count: (old?.count || 0) + 1 };
      } else if (opt.kind === "daily") {
        (Store.data.course_daily ||= {})[today()] = Math.max(stars, (Store.data.course_daily[today()] || 0));
      }
      Store.save();
      $("#lp", root).style.width = "100%";
      foot.className = "lesson-foot";
      foot.innerHTML = "";
      // 下一步：本单元下一课；单元最后一课学完后去做本单元的连词成句挑战
      const unit = opt.kind === "lesson" && PHRASE_UNITS[opt.ui];
      const nextBtn = !unit ? ""
        : unit.lessons[opt.li + 1] ? `<a class="btn primary lg" href="#/course/${unit.id}/${opt.li + 1}">下一课 →</a>`
        : `<a class="btn primary lg" href="#/builder/${unit.builder}">🧱 单元挑战：连词成句 →</a>`;
      stage.innerHTML = `<div class="center" style="padding:20px 0">
        <div class="stars-big">${"★".repeat(stars)}<span class="faint">${"☆".repeat(3 - stars)}</span></div>
        <h2 class="mt-s">${stars === 3 ? "完美通关！" : stars === 2 ? "做得不错！" : "完成了，再练一次会更好！"}</h2>
        <p class="muted">正确率 ${Math.round(acc * 100)}% · 学习了 ${items.length} 个短语</p>
        <div class="row mt" style="justify-content:center">
          ${nextBtn}
          <a class="btn lg" href="#/course">返回路径</a></div></div>`;
    };

    document.addEventListener("keydown", (e) => {
      if (e.target.closest?.("input, textarea") || $(".modal-mask")) return;
      if (e.key === "Enter") { e.preventDefault(); const b = $("#go", foot) || $("#chk", foot); if (b && !b.disabled) b.click(); }
      else if (!answered && /^[1-4]$/.test(e.key)) { const o = $$(".option", stage)[+e.key - 1]; if (o) o.click(); }
    }, { signal });

    show();
  },
};
