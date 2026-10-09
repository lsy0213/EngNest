// 单词：记住单个的词。学新词 / 复习 / 练习（测验、填空、打字）/ 词库
const BOOK_GROUPS = [["基础", ["core", "topic"]], ["考试", ["cet4", "cet6", "ielts", "ielts_topic", "ielts_zj", "ielts_l179", "ielts_r538", "toefl"]], ["行业", ["med", "tech", "law", "fin"]]];
const EXAM_OF = { ielts: "ielts", ielts_topic: "ielts", ielts_zj: "ielts", ielts_l179: "ielts", ielts_r538: "ielts", toefl: "toefl", cet4: "cet4", cet6: "cet6" };
const EXAM_NAME = { ielts: "雅思", toefl: "托福", cet4: "大学英语四级", cet6: "大学英语六级" };
// 路由：#/words/<tab>[/<单元>]；旧的 #/words/quiz 当作「练习 → 测验」
App.pages.words = {
  render(root, params, signal) {
    let tab = ["new", "review", "practice", "list", "roots"].includes(params[0]) ? params[0] : params[0] === "quiz" ? "practice" : "new";
    if (params[0] === "quiz") Store.prefs.word_practice = "quiz";
    const unit = params[1] !== undefined ? (tab === "roots" ? params[1] : +params[1]) : undefined;
    const due = dueWords().length;
    root.innerHTML = pageHead("单词", "",
      tabsHtml([["new", "学新词"], ["review", `复习${due ? ` (${due})` : ""}`], ["practice", "练习"], ["list", "词库"], ["roots", "词根词缀"]], tab))
      // 手机上「开始学习」放在词书列表上面（words-main 里用 CSS 调换顺序），不用先翻过十几本词书
      + `<div class="words-main">${tab === "roots" ? "" : `<div class="book-picker"><div class="book-picker-title">📚 选择词书</div>${this.bookBar()}</div>`}<div id="words-body"></div></div>`;
    $$(".tab", root).forEach((b) => (b.onclick = () => Router.go("words/" + b.dataset.tab)));
    $$("[data-book]", root).forEach((c) => (c.onclick = () => {
      Store.prefs.book = c.dataset.book;
      Store.save();
      // 切换词书后去掉 URL 里的单元号；hash 没变时手动重新渲染
      const target = `#/words/${tab}`;
      if (location.hash === target) Router.render();
      else location.hash = target;
    }));
    $$("[data-exam]", root).forEach((b) => (b.onclick = () => this.setExam(b.dataset.exam)));
    // 手机上每组词书是一行左右滑：把当前词书滑到看得见的地方
    $$(".book-bar", root).forEach((bar) => {
      const c = $(".book-chip.active", bar);
      if (c && bar.scrollWidth > bar.clientWidth) bar.scrollLeft = c.offsetLeft - bar.offsetLeft - (bar.clientWidth - c.offsetWidth) / 2;
    });
    const body = $("#words-body", root);
    ({ new: this.learnNew, review: this.review, practice: this.practice, list: this.list, roots: this.roots })[tab].call(this, body, signal, unit);
  },

  // 练习：不影响复习安排的自由练习（测验答错的词会重新加入复习）。测验 = 选择题 + 拼写；打字 = 打单词或例句，计速度和正确率
  practice(body, signal) {
    const m = ["typing", "cloze", "fillin"].includes(Store.prefs.word_practice) ? Store.prefs.word_practice : "quiz";
    body.innerHTML = this.modeBar("word_practice", [["quiz", "📝 测验"], ["cloze", "✏️ 选词填空"], ["fillin", "🧩 挖词填空"], ["typing", "⌨️ 打字"]], m, "练习方式") + `<div id="pr-body"></div>`;
    this.bindModeBar(body);
    const box = $("#pr-body", body);
    if (m === "typing") App.pages.typing.embed(box, signal, "words");
    else if (m === "cloze") this.cloze(box, signal);
    else if (m === "fillin") this.fillin(box, signal);
    else this.quiz(box, signal);
  },

  // 词汇填空：例句里挖掉一个词，从四个词里选。优先用当前词书里学过的词，不够就用当前词书第一个例句够多的单元
  cloze(box, pageSignal) {
    const signal = freshSignal(this, pageSignal);
    // 只用完整的句子当填空题（有些例句只是词组，比如 Montego Bay）
    const withEx = (x) => x.ex && x.ex.split(/\s+/).length >= 6 && maskWord(x.ex, x.w);
    const learned = bookItems().filter((x) => Store.data.words[x.w] && withEx(x));
    const unit = (curBook().units.find((u) => u.items.filter(withEx).length >= 6) || curBook().units[0]).items.filter(withEx);
    const pool = learned.length >= 6 ? learned : unit;
    if (pool.length < 4) { box.innerHTML = `<div class="card empty"><div class="big">✏️</div>这本词书的例句太少，换一本词书试试</div>`; return; }
    const qs = sample(pool, Math.min(10, pool.length));
    const pos = (x) => (x.m.match(/^[a-z]+\./) || [""])[0];
    let i = 0, right = 0;
    const wrongs = [];
    const show = () => {
      if (i >= qs.length) {
        box.innerHTML = `<div class="flash-wrap"><div class="card center" style="padding:36px"><div class="result-big">${Math.round((right / qs.length) * 100)}</div>
          <div class="muted">分 · 答对 ${right} / ${qs.length}</div>
          ${wrongs.length ? `<div class="mt" style="text-align:left"><div class="card-title">需要加强的词</div>${wrongs.map((w) => `<div class="row" style="padding:5px 0;border-top:1px solid var(--line)"><b class="en">${esc(w.w)}</b><span class="muted small">${esc(shortMeaning(w))}</span><span class="spacer"></span>${speakBtn(w.w, "sm")}</div>`).join("")}</div>` : ""}
          <div class="row mt" style="justify-content:center"><button class="btn primary" id="again">再来一组</button></div></div></div>`;
        $("#again", box).onclick = () => this.cloze(box, pageSignal);
        renderNav();
        return;
      }
      const it = qs[i];
      const same = pool.filter((x) => x.w !== it.w && pos(x) === pos(it));
      const others = sample(same.length >= 3 ? same : pool.filter((x) => x.w !== it.w), 3);
      const opts = shuffle([it, ...others]);
      box.innerHTML = `<div class="flash-wrap">
        <div class="flash-progress"><span>${i + 1} / ${qs.length}</span><div class="bar"><i style="width:${(i / qs.length) * 100}%"></i></div><span>答对 ${right}</span></div>
        <div class="card"><div class="small muted">选出填进空格的词</div>
          <div class="cloze-sent">${esc(maskWord(it.ex, it.w))}</div>${it.zh ? `<div class="small muted center">${esc(it.zh)}</div>` : ""}
          <div class="options two mt">${opts.map((o, k) => `<button class="option" data-w="${esc(o.w)}"><span class="letter">${k + 1}</span><span class="en">${esc(o.w)}</span></button>`).join("")}</div>
          <div class="explain-slot"></div></div>
        <div class="row mt hidden" id="next-row" style="justify-content:flex-end"><button class="btn primary" id="next">下一题 <span class="kbd">Enter</span></button></div></div>`;
      $$(".option", box).forEach((b) => (b.onclick = (e) => {
        if ($(".option[disabled]", box)) return;
        const ok = b.dataset.w === it.w;
        $$(".option", box).forEach((x) => { x.disabled = true; if (x.dataset.w === it.w) x.classList.add("right"); });
        if (ok) { right++; addXP(1, null, e); } else { b.classList.add("wrong"); wrongs.push(it); if (Store.data.words[it.w]) gradeWord(it.w, 0); }
        $(".explain-slot", box).innerHTML = `<div class="explain ${ok ? "good" : "bad"}"><span class="en">${esc(it.ex)}</span> ${speakBtn(it.ex, "sm")}<br><b>${esc(it.w)}</b> ${esc(it.ph || "")} ${esc(shortMeaning(it))}</div>`;
        $("#next-row", box).classList.remove("hidden");
        if (document.activeElement) document.activeElement.blur();
        TTS.speak(it.ex);
      }));
      $("#next", box).onclick = () => { i++; show(); };
    };
    onKey(signal, (e) => {
      if (e.key === "Enter" && !$("#next-row", box)?.classList.contains("hidden")) $("#next", box)?.click();
      else if (["1", "2", "3", "4"].includes(e.key)) $$(".option", box)[+e.key - 1]?.click();
    });
    show();
  },

  // 词书分三组：基础 / 考试 / 行业；考试词书下方显示考试倒计时
  bookBar() {
    const cur = curBook();
    const icon = { core: "🌱", cet4: "📘", cet6: "📕", ielts: "🎓", ielts_topic: "🧭", toefl: "🌐", topic: "🗂️", med: "🩺", tech: "💻", law: "⚖️", fin: "💹" };
    const chip = (b) => {
      const learned = bookItems(b).filter((x) => Store.data.words[x.w]).length;
      return `<button class="book-chip ${b === cur ? "active" : ""}" data-book="${b.id}" title="${esc(b.desc)}">
        <span class="book-name">${icon[b.id] || "📗"} ${b.title}</span>
        <span class="book-count">${learned} / ${b.count}</span>
        <span class="bar"><i style="width:${(learned / b.count) * 100}%"></i></span></button>`;
    };
    return BOOK_GROUPS.map(([name, ids]) => {
      const books = ids.map((id) => BOOK_MAP[id]).filter(Boolean);
      return books.length ? `<div class="book-group"><span class="book-group-name">${name}</span><div class="book-bar">${books.map(chip).join("")}</div></div>` : "";
    }).join("") + this.examCard(cur);
  },

  // 考试倒计时和目标分（雅思、托福、四六级）
  examCard(book) {
    const exam = EXAM_OF[book.id];
    if (!exam) return "";
    const e = (Store.prefs.exams ||= {})[exam] || {};
    const left = bookItems(book).filter((x) => !Store.data.words[x.w]).length;
    if (!e.date) return `<div class="exam-card"><span class="small muted" style="flex:1">📅 在准备${EXAM_NAME[exam]}吗？设置考试日期和目标分，帮你算每天要学多少词。</span><button class="btn sm soft" data-exam="${exam}">设置</button></div>`;
    const days = Math.round((new Date(e.date) - new Date(today())) / 86400000);
    return `<div class="exam-card">
      <div class="exam-days"><b>${days >= 0 ? days : 0}</b><span>天后考试</span></div>
      ${e.target ? `<div class="exam-target">${esc(e.target)}<span>目标</span></div>` : ""}
      <div class="small muted" style="flex:1">${EXAM_NAME[exam]} · ${e.date}<br>${days > 0 ? `这本词书还剩 ${left} 个词没学，每天学 <b>${Math.ceil(left / days)}</b> 个就能在考试前学完。` : "考试加油！"}</div>
      <button class="btn sm ghost" data-exam="${exam}">修改</button></div>`;
  },

  setExam(exam) {
    const e = (Store.prefs.exams ||= {})[exam] || {};
    const ph = { ielts: "比如 7.5", toefl: "比如 100", cet4: "比如 550", cet6: "比如 500" }[exam];
    const m = modal(`<h3>📅 ${EXAM_NAME[exam]}考试</h3>
      <div class="field"><label>考试日期</label><input class="input" type="date" id="ex-date" value="${e.date || ""}"></div>
      <div class="field mt-s"><label>目标分数</label><input class="input" id="ex-target" value="${esc(e.target || "")}" placeholder="${ph}"></div>
      <div class="modal-actions">${e.date ? `<button class="btn ghost" id="ex-clear">清除</button>` : ""}<button class="btn" data-close>取消</button><button class="btn primary" id="ex-save">保存</button></div>`);
    $("#ex-save", m.root).onclick = () => {
      if (!$("#ex-date", m.root).value) { toast("先选一个考试日期"); return; }
      Store.prefs.exams[exam] = { date: $("#ex-date", m.root).value, target: $("#ex-target", m.root).value.trim() };
      Store.save();
      m.close();
      Router.render();
    };
    const c = $("#ex-clear", m.root);
    if (c) c.onclick = () => { delete Store.prefs.exams[exam]; Store.save(); m.close(); Router.render(); };
  },

  learnNew(body, signal, unit) {
    const left = newWordsLeftToday();
    const pool = unlearnedWords(unit);
    if (!pool.length) {
      body.innerHTML = `<div class="card empty"><div class="big">🏆</div><h3>${unit !== undefined ? "这个单元" : "词库里"}的词都学过了！</h3>
        <p>去复习巩固一下，或者在阅读中收集新词吧。</p><a class="btn primary" href="#/words/review">去复习</a></div>`;
      return;
    }
    // 指定了单元就不受每日数量限制（用户主动选的）
    const n = unit !== undefined ? Math.min(pool.length, 20) : left;
    if (n === 0) {
      body.innerHTML = `<div class="card empty"><div class="big">✅</div><h3>今天的 ${Store.prefs.daily_new} 个新词已经学完了</h3>
        <p>贪多嚼不烂，建议先去复习。如果还想学，可以在词库里选一个单元继续。</p>
        <div class="row" style="justify-content:center"><a class="btn primary" href="#/words/review">去复习</a><a class="btn" href="#/words/list">选单元继续学</a></div></div>`;
      return;
    }
    const queue = pool.slice(0, n);
    body.innerHTML = `<div class="card" style="max-width:620px;margin:0 auto">
      <div class="card-title">🆕 准备学习 ${queue.length} 个新词</div>
      <p class="muted">从「${esc(unitLabel(queue[0]))}」开始。每个词先看单词、听发音，试着回忆意思，再翻开看释义和例句。</p>
      <div class="row mt"><button class="btn primary lg" data-start>开始学习</button><a class="btn" href="#/words/list">换个单元</a>
        <span class="spacer"></span><label class="small row" style="gap:4px;cursor:pointer" title="打乱顺序，避免按顺序背靠位置记住"><input type="checkbox" id="shuffle-new" ${Store.prefs.shuffle_new ? "checked" : ""}> 乱序</label></div></div>`;
    $("#shuffle-new", body).onchange = (e) => { Store.prefs.shuffle_new = e.target.checked; Store.save(); };
    $("[data-start]", body).onclick = () =>
      runFlashcards(body, Store.prefs.shuffle_new ? shuffle(queue) : queue, "new", signal, (actions) => {
        actions.innerHTML = `<a class="btn primary" href="#/words/quiz">小测一下</a><a class="btn" href="#/home">回首页</a>`;
      });
  },

  // 顶部的方式切换条：[[值, 文字], ...]，选中后存到 Store.prefs[key] 并重新渲染
  modeBar(key, items, cur, label) {
    return `<div class="row mode-bar"><span class="small muted">${label}</span>${items.map(([v, l]) =>
      `<button class="chip ${v === cur ? "active" : ""}" data-mode-key="${key}" data-mode="${v}">${l}</button>`).join("")}</div>`;
  },
  bindModeBar(root) {
    $$("[data-mode-key]", root).forEach((b) => (b.onclick = () => {
      Store.prefs[b.dataset.modeKey] = b.dataset.mode;
      Store.save();
      Router.render();
    }));
  },

  review(body, signal) {
    const mode = Store.prefs.review_mode || "card";
    const spell = mode === "spell";
    body.innerHTML = this.modeBar("review_mode", [["card", "🃏 看词回忆"], ["spell", "⌨️ 看中文拼写"]], mode, "复习方式")
      + `<div id="rv-body"></div>`;
    this.bindModeBar(body);
    const box = $("#rv-body", body);
    const due = dueWords();
    if (!due.length) {
      const next = Object.values(Store.data.words).map((s) => s.due).filter((d) => d > today()).sort()[0];
      const learned = WORDS.filter((x) => Store.data.words[x.w]);
      box.innerHTML = `<div class="card empty"><div class="big">☕</div><h3>现在没有需要复习的词</h3>
        <p>${next ? `下一批复习在 ${next}。` : "先去学几个新词吧。"}</p>
        <div class="row" style="justify-content:center">
          ${learned.length ? `<button class="btn primary" data-practice>⌨️ 练练拼写（${Math.min(20, learned.length)} 个学过的词，不影响复习安排）</button>` : ""}
          <a class="btn ${learned.length ? "" : "primary"}" href="#/words/new">学新词</a></div></div>`;
      const pb = $("[data-practice]", box);
      // 挑记得最不牢的词来练
      if (pb) pb.onclick = () => runSpelling(box, shuffle([...learned].sort((a, b) => Store.data.words[a.w].box - Store.data.words[b.w].box).slice(0, 20)), signal,
        (actions) => { actions.innerHTML = `<button class="btn primary" data-again>再练一组</button><a class="btn" href="#/words/new">学新词</a>`; $("[data-again]", actions).onclick = () => Router.render(); },
        { grade: false });
      return;
    }
    const queue = due.slice(0, spell ? 20 : 30);
    const onFinish = (actions) => {
      const more = dueWords().length;
      actions.innerHTML = (more
        ? `<button class="btn primary" data-more>再复习一组 (${more})</button>`
        : `<a class="btn primary" href="#/words/new">学新词</a>`) + `<a class="btn" href="#/home">回首页</a>`;
      const btn = $("[data-more]", actions);
      if (btn) btn.onclick = () => Router.render();
    };
    // 先显示开始卡片（和学新词一样），点了才进入卡片；卡片上的 ← 回到这里
    box.innerHTML = `<div class="card" style="max-width:620px;margin:0 auto">
      <div class="card-title">📅 有 ${due.length} 个词到了复习时间</div>
      <p class="muted">${spell ? `这一组 ${queue.length} 个：看中文和例句，拼出单词。` : `这一组 ${queue.length} 个：先看单词回忆意思，再翻开对答案。记住了往${knownDir() < 0 ? "左" : "右"}滑，没记住往另一边。`}</p>
      <div class="row mt"><button class="btn primary lg" data-start>开始复习</button></div></div>`;
    $("[data-start]", box).onclick = () => {
      if (spell) runSpelling(box, queue, signal, onFinish);
      else runFlashcards(box, queue, "review", signal, onFinish);
    };
  },

  quiz(root, pageSignal) {
    const signal = freshSignal(this, pageSignal);
    const mode = Store.prefs.quiz_mode || "mix";
    root.innerHTML = this.modeBar("quiz_mode", [["mix", "混合"], ["choice", "选择题"], ["spell", "⌨️ 拼写"]], mode, "题型") + `<div id="qz-body"></div>`;
    this.bindModeBar(root);
    const body = $("#qz-body", root);
    // 优先考当前词书里学过的词，其次所有学过的词，都不够就用当前词书第一个单元
    const bookLearned = bookItems().filter((x) => Store.data.words[x.w]);
    const allLearned = WORDS.filter((x) => Store.data.words[x.w]);
    const learned = bookLearned.length >= 4 ? bookLearned : allLearned;
    const pool = learned.length >= 4 ? learned : curBook().units[0].items;
    const items = sample(pool, Math.min(10, pool.length));
    const types = { mix: ["en2zh", "zh2en", "spell"], choice: ["en2zh", "zh2en"], spell: ["spell"] }[mode] || ["en2zh", "zh2en", "spell"];
    const qs = items.map((it, i) => ({ it, type: types[i % types.length] }));
    let idx = 0, right = 0;
    const wrongs = [];

    const distract = (it, key) => {
      const val = (x) => (key === "m" ? shortMeaning(x) : x.w);
      const others = sample(WORDS.filter((x) => x.w !== it.w && val(x) !== val(it)), 3).map(val);
      const opts = shuffle([val(it), ...others]);
      return { o: opts, a: opts.indexOf(val(it)) };
    };

    const show = () => {
      if (idx >= qs.length) return finish();
      const { it, type } = qs[idx];
      body.innerHTML = `<div class="flash-wrap">
        <div class="flash-progress"><span>${idx + 1} / ${qs.length}</span><div class="bar"><i style="width:${(idx / qs.length) * 100}%"></i></div><span>答对 ${right}</span></div>
        <div class="card" id="qcard"></div>
        <div class="row mt hidden" id="next-row" style="justify-content:flex-end"><button class="btn primary" id="next">下一题 <span class="kbd">Enter</span></button></div></div>`;
      const card = $("#qcard", body);
      const after = (ok, evt) => {
        if (ok) { right++; addXP(1, null, evt); }
        else { wrongs.push(it); if (Store.data.words[it.w]) gradeWord(it.w, 0); }
        $("#next-row", body).classList.remove("hidden");
        // 不把焦点放到按钮上，否则按 Enter 会同时触发按钮点击和快捷键，连跳两题
        if (document.activeElement) document.activeElement.blur();
      };
      $("#next", body).onclick = () => { idx++; show(); };

      if (type === "spell") {
        card.innerHTML = `<div class="small muted">听发音，写出单词</div>
          <div class="player"><button class="play-big" data-say="${esc(it.w)}">🔊</button></div>
          <div class="center muted">${esc(it.m)}</div>
          <div class="row mt" style="max-width:420px;margin-left:auto;margin-right:auto">
            <input class="input en" id="spell" placeholder="输入单词…" autocomplete="off" spellcheck="false" style="flex:1">
            <button class="btn primary" id="check">确定</button></div>
          <div class="explain-slot"></div>`;
        TTS.speak(it.w);
        const inp = $("#spell", card);
        inp.focus();
        let done = false;
        const check = (evt) => {
          if (done) return;
          done = true;
          const ok = spellNorm(inp.value) === spellNorm(it.w);
          inp.disabled = true;
          $(".explain-slot", card).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? "✅ 拼写正确！"
            : `❌ ${inp.value.trim() ? `你的拼写：<span class="sp-diff">${spellDiffHtml(inp.value, it.w)}</span><br>` : ""}正确拼写：<b class="sp-answer">${esc(it.w)}</b> ${esc(it.ph)}`}</div>`;
          after(ok, evt);
        };
        $("#check", card).onclick = check;
        inp.addEventListener("keydown", (e) => {
          if (e.key !== "Enter") return;
          e.stopPropagation();
          if (!done) check();
          else { idx++; show(); }
        });
      } else {
        const en2zh = type === "en2zh";
        const { o, a } = distract(it, en2zh ? "m" : "w");
        renderChoice(card, {
          qHtml: en2zh ? `<span class="fc-word" style="font-size:32px">${esc(it.w)}</span> ${speakBtn(it.w, "sm")}<div class="small muted">选出正确的中文意思</div>`
            : `${esc(it.m)}<div class="small muted">选出对应的英文单词</div>`,
          o, a, e: `${it.w} ${it.ph}  ${it.m}`,
        }, { onAnswer: after });
        if (en2zh) TTS.speak(it.w);
      }
    };

    const finish = () => {
      const score = Math.round((right / qs.length) * 100);
      body.innerHTML = `<div class="flash-wrap"><div class="card center" style="padding:36px">
        <div class="result-big">${score}</div><div class="muted">分 · 答对 ${right} / ${qs.length}</div>
        ${wrongs.length ? `<div class="mt" style="text-align:left"><div class="card-title">需要加强的词</div>
          ${wrongs.map((w) => `<div class="row" style="padding:6px 0;border-top:1px solid var(--line)"><b class="w" style="font-family:var(--font-en)">${esc(w.w)}</b><span class="faint small">${esc(w.ph)}</span><span class="muted">${esc(w.m)}</span><span class="spacer"></span>${speakBtn(w.w, "sm")}</div>`).join("")}
          <p class="small faint">这些词已重新加入复习队列。</p></div>` : `<p class="mt">全对！太棒了 🎉</p>`}
        <div class="row mt" style="justify-content:center"><button class="btn primary" id="again">再测一次</button><a class="btn" href="#/words/review">去复习</a></div></div></div>`;
      $("#again", body).onclick = () => this.quiz(root, pageSignal);
      renderNav();
    };

    onKey(signal, (e) => {
      const nb = $("#next", body);
      if (e.key === "Enter" && nb && !$("#next-row", body).classList.contains("hidden")) nb.click();
      else if (["1", "2", "3", "4"].includes(e.key)) { const opt = $$(".option", body)[+e.key - 1]; if (opt && !opt.disabled) opt.click(); }
    });

    if (learned.length < 4) toast("你学过的词还不够，先用当前词书 Unit 1 的词来测验");
    show();
  },

  list(body) {
    const book = curBook();
    body.innerHTML = `<div class="row" style="margin-bottom:14px"><input class="input" id="search" placeholder="🔍 在${Books.stubs().length ? "已载入的" : "全部"} ${WORDS.length} 个词里搜索单词或中文…" style="max-width:380px"><span class="spacer"></span>
      <span class="small muted"><span class="dot"></span> 未学 <span class="dot learning" style="margin-left:10px"></span> 学习中 <span class="dot mastered" style="margin-left:10px"></span> 已掌握</span></div>
      <div id="list-body"></div>`;
    const lb = $("#list-body", body);
    const row = (x) => `<tr><td style="width:18px"><span class="dot ${wordStatus(x.w)}"></span></td><td class="w">${esc(x.w)}</td><td class="ipa">${esc(x.ph)}</td>
      <td>${esc(shortMeaning(x))}</td><td style="width:70px;text-align:right">${speakBtn(x.w, "sm")}<button class="star ${inNotebook(x.w) ? "on" : ""}" data-star="${esc(x.w)}">★</button></td></tr>`;
    let openUnit = -1;

    const drawUnits = () => {
      // 主题词汇按主题卡片展示，点进去是分组词表
      if (book.topic) { lb.innerHTML = App.pages.topics.gridHtml(); return; }
      lb.innerHTML = `<div class="unit-grid">${book.units.map((u, i) => {
        const n = u.items.length;
        const learned = u.items.filter((x) => Store.data.words[x.w]).length;
        const mastered = u.items.filter((x) => wordStatus(x.w) === "mastered").length;
        return `<button class="unit-tile ${i === openUnit ? "open" : ""} ${learned === n ? "done" : ""}" data-unit="${i}">
          <b>${esc(u.title)}</b><span class="small muted">${book.id === "core" ? esc(u.en) : `${esc(u.items[0].w)} …`}</span>
          <span class="bar ${mastered === n ? "good" : ""}"><i style="width:${(learned / n) * 100}%"></i></span>
          <span class="small faint">已学 ${learned}/${n} · 掌握 ${mastered}</span></button>`;
      }).join("")}</div><div id="unit-detail"></div>`;
      if (openUnit >= 0) drawDetail();
    };
    const drawDetail = () => {
      const u = book.units[openUnit];
      const left = u.items.filter((x) => !Store.data.words[x.w]).length;
      const det = $("#unit-detail", lb);
      det.innerHTML = `<div class="card mt"><div class="row"><b>${esc(book.title)} · ${esc(u.title)}</b><span class="spacer"></span>
        ${left ? `<button class="btn primary sm" data-learn="${openUnit}">学这个单元（剩 ${left} 词）</button>` : `<span class="badge good">已学完</span>`}
        <a class="btn sm soft" href="#/typing/words/${book.id}/${openUnit}">⌨️ 打字练习</a></div>
        <table class="word-table">${u.items.map(row).join("")}</table></div>`;
      det.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    drawUnits();

    lb.addEventListener("click", (e) => {
      const star = e.target.closest("[data-star]");
      if (star) { star.classList.toggle("on", toggleNotebook(WORD_MAP[star.dataset.star.toLowerCase()])); return; }
      const learn = e.target.closest("[data-learn]");
      if (learn) { Router.go(`words/new/${learn.dataset.learn}`); return; }
      const tile = e.target.closest("[data-unit]");
      if (!tile) return;
      openUnit = +tile.dataset.unit === openUnit ? -1 : +tile.dataset.unit;
      $$(".unit-tile", lb).forEach((t) => t.classList.toggle("open", +t.dataset.unit === openUnit));
      if (openUnit < 0) $("#unit-detail", lb).innerHTML = "";
      else drawDetail();
    });

    $("#search", body).addEventListener("input", (e) => {
      const kw = e.target.value.trim().toLowerCase();
      if (!kw) return drawUnits();
      const hits = WORDS.filter((x) => x.w.toLowerCase().includes(kw) || x.m.includes(kw))
        .sort((a, b) => (b.w.toLowerCase().startsWith(kw) - a.w.toLowerCase().startsWith(kw)) || a.w.length - b.w.length);
      // 还有词书没载入时可以一键全部载入再搜（第一次要下载十几 MB）
      const more = Books.stubs().length
        ? `<div class="small muted mt-s">还有 ${Books.stubs().map((b) => b.title).join("、")} 没载入 <button class="btn sm soft" id="load-all">全部载入后再搜</button></div>` : "";
      lb.innerHTML = (hits.length
        ? `<div class="card"><div class="small muted">找到 ${hits.length} 个${hits.length > 100 ? "，显示前 100 个" : ""}</div><table class="word-table">${hits.slice(0, 100).map(row).join("")}</table>${more}</div>`
        : `<div class="card empty">没有找到「${esc(kw)}」${more}</div>`);
      const all = $("#load-all", lb);
      if (all) all.onclick = async () => {
        all.replaceWith("正在载入…");
        try { await Books.ensure(Books.stubs().map((b) => b.id)); } catch (err) { toast(err.message || String(err), "bad", 5000); }
        const box = $("#search", body);
        if (!box) return;
        box.placeholder = `🔍 在全部 ${WORDS.length} 个词里搜索单词或中文…`;
        box.dispatchEvent(new Event("input")); // 用全部词书重新搜一遍
      };
    });
  },
};
