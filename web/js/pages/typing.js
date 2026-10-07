// 打字练习引擎：不再是单独的页面，而是嵌在两个模块里
//   单词 → 练习 → 打字（scope "words"）：打单词（可默写），或打当前词书的例句
//   短语与句子 → 跟打听写（scope "sentences"）：情景口语、场景短语、连词成句、生词本里的句子，看着打或听着打
// 旧路由 #/typing/<mode>[/<来源或词书>/<单元>] 仍然可用，会跳到对应的位置
const SENT_ALL_N = 40; // 句子来源选「全部」时随机抽多少句
App.pages.typing = {
  scope: "words",    // words 单词模块里 / sentences 短语与句子模块里
  mode: "words",     // words 打单词 / sentence 看着打句子 / dictation 听着打句子
  src: "unit",       // 打单词的范围：unit 当前词书的单元 / learned 学过的词 / notebook 生词本
  sentSrc: "scene",  // 句子来源：scene 情景口语 / phrase 场景短语 / builder 连词成句 / saved 生词本里的短语和句子
  sentPick: {},      // 每个句子来源选的是哪一组（下标），没有就是「全部（随机抽）」
  hide: false,       // 单词默写模式：隐藏字母
  unit: 0,           // 当前词书的单元（打单词和打例句共用）

  // 旧链接：设置好状态后跳到新位置
  render(root, params) {
    const mode = ["words", "sentence", "dictation"].includes(params[0]) ? params[0] : "words";
    if (mode === "words") {
      this.mode = "words";
      if (params[1] === "notebook") this.src = "notebook";
      else if (params[1] && BOOK_MAP[params[1]]) { Store.prefs.book = params[1]; this.unit = +params[2] || 0; this.src = "unit"; this._book = params[1]; }
      Store.prefs.word_practice = "typing";
      Store.save();
      location.replace("#/words/practice");
    } else {
      this.mode = mode;
      if (params[1] && this.sentSources()[params[1]]) this.sentSrc = params[1];
      location.replace("#/course/typing");
    }
  },

  // 嵌入到某个容器里
  embed(container, signal, scope) {
    this.scope = scope;
    if (scope === "words" && this.mode === "dictation") this.mode = "words";
    if (scope === "sentences" && this.mode === "words") this.mode = "sentence";
    this._page = signal;
    container.innerHTML = `<div class="card type-opts" id="opts"></div><div id="ty-body"></div>`;
    this.root = container;
    this.drawOpts();
    this.start();
  },

  // ---------- 选项栏 ----------
  drawOpts() {
    const o = $("#opts", this.root);
    const book = curBook();
    if (this._book !== book.id) { this._book = book.id; this.unit = 0; } // 换了词书就从第一单元开始
    if (this.unit >= book.units.length) this.unit = 0;
    const chip = (attr, val, cur, label) => `<button class="chip ${val === cur ? "active" : ""}" data-${attr}="${val}">${label}</button>`;
    const unitSelect = `<select class="select" id="unit" style="width:auto">${book.units.map((u, i) => `<option value="${i}" ${i === this.unit ? "selected" : ""}>${esc(u.title)}${u.en ? ` · ${esc(u.en)}` : ` · ${esc(u.items[0].w)}…`}</option>`).join("")}</select>`;
    const tip = `<span class="spacer"></span><span class="small faint">请先把输入法切换到英文</span>`;
    if (this.scope === "words") {
      const modeRow = `<span class="small muted">打什么</span>${chip("mode", "words", this.mode, "⌨️ 单词")}${chip("mode", "sentence", this.mode, "📝 例句")}`;
      o.innerHTML = this.mode === "words"
        ? `<div class="row">${modeRow}<span class="spacer"></span>
             <label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="hide" ${this.hide ? "checked" : ""}> 默写模式（隐藏字母）</label></div>
           <div class="row mt-s"><span class="small muted">范围</span>
             ${chip("src", "unit", this.src, esc(book.title))}${chip("src", "learned", this.src, "学过的词")}${chip("src", "notebook", this.src, `生词本 (${Store.data.notebook.length})`)}
             ${this.src === "unit" ? unitSelect : ""}</div>`
        : `<div class="row">${modeRow}${tip}</div>
           <div class="row mt-s"><span class="small muted">范围</span><span class="small">${esc(book.title)}</span>${unitSelect}<span class="small faint">打这个单元里单词的例句</span></div>`;
    } else {
      const srcs = this.sentSources();
      if (!srcs[this.sentSrc]) this.sentSrc = "scene"; // 生词本清空后这个来源就没有了
      const cur = srcs[this.sentSrc], pick = this.sentPick[this.sentSrc];
      const total = (s) => s.groups.reduce((n, g) => n + g.items.length, 0);
      o.innerHTML = `<div class="row"><span class="small muted">方式</span>${chip("mode", "sentence", this.mode, "👀 跟打（看着中英文打）")}${chip("mode", "dictation", this.mode, "🎧 听写（只听声音打）")}${tip}</div>
        <div class="row mt-s"><span class="small muted">句子</span>
          ${Object.entries(srcs).map(([id, s]) => chip("sent", id, this.sentSrc, `${s.label} (${total(s)})`)).join("")}</div>
        <div class="row mt-s"><span class="small muted">范围</span>
          <select class="select" id="sent-pick" style="width:auto">
            <option value="all">全部 · 随机 ${Math.min(SENT_ALL_N, total(cur))} 句</option>
            ${cur.groups.map((g, i) => `<option value="${i}" ${i === pick ? "selected" : ""}>${esc(g.title)}（${g.items.length} 句）</option>`).join("")}</select></div>`;
    }
    o.onclick = (e) => {
      const s = e.target.closest("[data-src]"), t = e.target.closest("[data-sent]"), m = e.target.closest("[data-mode]");
      if (s) this.src = s.dataset.src;
      else if (t) this.sentSrc = t.dataset.sent;
      else if (m) this.mode = m.dataset.mode;
      else return;
      this.drawOpts();
      this.start();
    };
    o.onchange = (e) => {
      if (e.target.id === "hide") this.hide = e.target.checked;
      if (e.target.id === "unit") this.unit = +e.target.value;
      if (e.target.id === "sent-pick") this.sentPick[this.sentSrc] = e.target.value === "all" ? undefined : +e.target.value;
      e.target.blur(); // 让键盘输入回到练习区
      this.drawOpts();
      this.start();
    };
  },

  // ---------- 组织题目 ----------
  items() {
    if (this.mode === "words") {
      if (this.src === "learned") return sample(WORDS.filter((x) => Store.data.words[x.w]), 30);
      if (this.src === "notebook") return shuffle(Store.data.notebook.map((x) => WORD_MAP[x.w.toLowerCase()] || x));
      return curBook().units[this.unit].items;
    }
    if (this.scope === "words") return this.exampleItems(this.unit);
    const src = this.sentSources()[this.sentSrc] || this.sentSources().scene, g = src.groups[this.sentPick[this.sentSrc]];
    return g ? g.items : sample(src.groups.flatMap((x) => x.items), SENT_ALL_N);
  },

  // 当前词书某个单元里单词的例句
  exampleItems(unit) {
    return curBook().units[unit].items.filter((x) => x.ex && x.ex.length <= 120)
      // 词典例句里偶尔有「carefully .」这种标点前的空格，打字时去掉
      .map((x) => ({ text: x.ex.replace(/\s+([.,!?;:])/g, "$1").trim(), zh: x.zh, word: x.w }));
  },

  // 句子来源：每个来源分成若干组（场景 / 单元 / 课），可以练某一组，也可以从全部里随机抽
  sentSources() {
    const pair = ([text, zh]) => ({ text, zh });
    return {
      scene: { label: "情景口语", groups: SENTENCE_SCENES.map((s) => ({ title: `${s.icon} ${s.title}`, items: s.sentences.map(pair) })) },
      phrase: { label: "场景短语", groups: PHRASE_UNITS.map((u, ui) => ({ title: `${u.icon} ${u.title}`, items: ALL_PHRASES.filter((p) => p.ui === ui).map((p) => pair([p.en, p.zh])) })) },
      // 连词成句只练每句话的完整版
      builder: { label: "连词成句", groups: BUILDER_LESSONS.map((l) => ({ title: `${l.icon} ${l.title}`, items: l.sentences.map((s) => pair(s[s.length - 1])) })) },
      ...(sentNb().length ? { saved: { label: "生词本", groups: [{ title: "全部收藏", items: sentNb().map((x) => ({ text: x.en, zh: x.zh })) }] } } : {}),
    };
  },

  start() {
    const signal = freshSignal(this, this._page);
    const body = $("#ty-body", this.root);
    const list = this.items().filter((x) => (x.w || x.text));
    if (!list.length) {
      body.innerHTML = `<div class="card empty"><div class="big">⌨️</div>${this.src === "notebook" ? "生词本还是空的。" : this.src === "learned" ? "还没有学过的词，先去学几个吧。" : "这里没有可以练习的内容。"}</div>`;
      return;
    }
    const isWord = this.mode === "words";
    const dictation = this.mode === "dictation";
    const st = { i: 0, pos: 0, keys: 0, right: 0, chars: 0, t0: 0, errs: 0, missed: [], done: 0, combo: 0, maxCombo: 0 };
    let target = "", cur = null, locked = false, imeWarned = false;

    // 目标文本规范化：弯引号、破折号等换成键盘能打出来的字符
    const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’‘`]/g, "'").replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-").replace(/…/g, "...").replace(/\s+/g, " ").trim();
    const typeable = (c) => /[ -~]/.test(c); // 可打印 ASCII，其他字符自动跳过
    const same = (a, b) => a.toLowerCase() === b.toLowerCase();

    const load = () => {
      cur = list[st.i];
      target = norm(isWord ? cur.w : cur.text);
      st.pos = 0;
      st.errs = 0;
      locked = false;
      skipUntypeable();
      draw();
      if (isWord || dictation) TTS.speak(isWord ? cur.w : cur.text);
    };
    const skipUntypeable = () => { while (st.pos < target.length && !typeable(target[st.pos])) st.pos++; };

    const charsHtml = () => [...target].map((c, i) => {
      const cls = i < st.pos ? "done" : i === st.pos ? "cur" : "todo";
      let shown = c === " " ? "&nbsp;" : esc(c);
      if (i >= st.pos && c !== " " && ((isWord && this.hide) || (dictation && /[A-Za-z0-9]/.test(c)))) shown = "_";
      return `<span class="ch ${cls}">${shown}</span>`;
    }).join("");

    const statsHtml = () => {
      const min = st.t0 ? (Date.now() - st.t0) / 60000 : 0;
      const wpm = min > 0.05 ? Math.round(st.chars / 5 / min) : 0;
      const acc = st.keys ? Math.round((st.right / st.keys) * 100) : 100;
      return `<span>进度 <b>${st.i + 1}</b> / ${list.length}</span><span>速度 <b>${wpm}</b> WPM</span><span>正确率 <b>${acc}%</b></span>${st.combo >= 2 ? `<span class="combo">🔥 连击 <b>${st.combo}</b></span>` : ""}
        <span class="spacer"></span><span class="faint">Tab 重听 · Shift+Tab 慢速 · Esc 看答案 · ←/→ 切换</span>`;
    };

    const draw = () => {
      const pct = (st.i / list.length) * 100;
      body.innerHTML = `
        <div class="type-stats">${statsHtml()}</div>
        <div class="bar" style="margin:8px 0 16px"><i style="width:${pct}%"></i></div>
        <div class="card type-card" id="tcard">
          <div class="${isWord ? "type-word" : "type-sentence"}" id="chars">${charsHtml()}</div>
          ${isWord ? `
            <div class="fc-ipa">${esc(cur.ph || "")} ${speakBtn(cur.w)}</div>
            <div class="type-meaning">${esc(cur.m || "")}</div>`
          : `<div class="type-zh ${dictation ? "hidden" : ""}" id="zh">${esc(cur.zh || "")}</div>
             <div class="row mt" style="justify-content:center">${speakBtn(cur.text)}<button class="btn sm ghost" data-say="${esc(cur.text)}" data-rate="0.6">🐢 慢速</button>
             ${dictation ? `<button class="btn sm ghost" id="show-zh">看中文</button>` : ""}</div>`}
          <div class="type-hint" id="hint"></div>
        </div>
        <div class="row mt"><button class="btn ghost" id="prev">← 上一个</button><span class="spacer"></span><button class="btn ghost" id="skip">跳过 →</button></div>`;
      $("#prev", body).onclick = () => go(-1);
      $("#skip", body).onclick = () => go(1);
      const sz = $("#show-zh", body);
      if (sz) sz.onclick = () => $("#zh", body).classList.remove("hidden");
    };
    const refresh = () => {
      $("#chars", body).innerHTML = charsHtml();
      $(".type-stats", body).innerHTML = statsHtml();
    };

    const go = (d) => {
      const n = st.i + d;
      if (n < 0) return;
      if (n >= list.length) return finish();
      st.i = n;
      load();
    };

    const complete = () => {
      locked = true;
      st.done++;
      if (st.errs === 0) {
        st.combo++;
        st.maxCombo = Math.max(st.maxCombo, st.combo);
        addXP(isWord ? 1 : 2);
        if (st.combo % 10 === 0) { addXP(5); toast(`🔥 ${st.combo} 连击！额外 +5 XP`, "good"); }
      } else {
        st.combo = 0;
        if (isWord && !st.missed.includes(cur)) st.missed.push(cur);
      }
      $("#tcard", body).classList.add("ok");
      if (dictation) $("#zh", body).classList.remove("hidden");
      if (!isWord) Store.data.stats.typing_sent = (Store.data.stats.typing_sent || 0) + 1;
      else Store.data.stats.typing_words = (Store.data.stats.typing_words || 0) + 1;
      Store.save();
      setTimeout(() => { if (!signal.aborted) go(1); }, isWord ? 350 : 900);
    };

    const wrongFlash = () => {
      const card = $("#tcard", body);
      card.classList.remove("shake");
      void card.offsetWidth; // 重新触发动画
      card.classList.add("shake");
    };

    document.addEventListener("keydown", (e) => {
      if (e.target.closest?.("input, textarea, select") || $(".modal-mask")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Process" || e.isComposing) {
        if (!imeWarned) { imeWarned = true; toast("检测到中文输入法，请按 Shift 或 Ctrl+空格 切换到英文", "bad", 4000); }
        return;
      }
      if (e.key === "Tab") { e.preventDefault(); TTS.speak(isWord ? cur.w : cur.text, e.shiftKey ? 0.6 : undefined); return; }
      if (e.key === "ArrowLeft") { go(-1); return; }
      if (e.key === "ArrowRight") { go(1); return; }
      if (e.key === "Escape") {
        $("#hint", body).innerHTML = `答案：<b>${esc(target)}</b>`;
        st.errs++;
        return;
      }
      if (e.key.length !== 1 || locked) return;
      e.preventDefault();
      if (!st.t0) st.t0 = Date.now();
      st.keys++;
      if (same(e.key, target[st.pos])) {
        st.right++;
        st.chars++;
        st.pos++;
        skipUntypeable();
        refresh();
        if (st.pos >= target.length) complete();
      } else {
        st.errs++;
        wrongFlash();
        if (isWord) { st.pos = 0; refresh(); } // 单词打错就从头再来，加深记忆
        if (st.errs >= 3 && isWord) $("#hint", body).innerHTML = `提示：<b>${esc(target)}</b>`;
        else refresh();
      }
    }, { signal });

    const finish = () => {
      const min = st.t0 ? (Date.now() - st.t0) / 60000 : 0;
      const wpm = min > 0 ? Math.round(st.chars / 5 / min) : 0;
      const acc = st.keys ? Math.round((st.right / st.keys) * 100) : 100;
      const best = Store.data.stats.typing_best_wpm || 0;
      if (wpm > best) Store.data.stats.typing_best_wpm = wpm;
      Store.save();
      body.innerHTML = `<div class="card center" style="padding:36px;max-width:640px;margin:0 auto">
        <div style="font-size:44px">⌨️</div><h2 class="mt-s">这一组打完啦！</h2>
        <div class="grid grid-3 mt">
          <div class="stat"><b>${wpm}</b><span>速度 WPM${wpm > best ? " · 新纪录 🎉" : ""}</span></div>
          <div class="stat"><b>${acc}%</b><span>正确率</span></div>
          <div class="stat"><b>${st.done}</b><span>完成${isWord ? "单词" : "句子"} · 最高连击 ${st.maxCombo}</span></div></div>
        ${st.missed.length ? `<div class="mt" style="text-align:left"><div class="card-title">打错过的词</div>
          ${st.missed.map((w) => `<div class="row" style="padding:5px 0;border-top:1px solid var(--line)"><b style="font-family:var(--font-en)">${esc(w.w)}</b><span class="muted small">${esc(shortMeaning(w))}</span><span class="spacer"></span>${speakBtn(w.w, "sm")}</div>`).join("")}
          <button class="btn soft sm mt-s" id="to-nb">全部加入生词本</button></div>` : ""}
        <div class="row mt" style="justify-content:center"><button class="btn primary" id="again">再来一组</button>
          ${this.scope === "words" && (this.mode !== "words" || this.src === "unit") && this.unit + 1 < curBook().units.length ? `<button class="btn" id="next-unit">下一单元 →</button>` : ""}
          ${this.scope === "sentences" && this.sentPick[this.sentSrc] + 1 < (this.sentSources()[this.sentSrc]?.groups.length || 0) ? `<button class="btn" id="next-group">下一组 →</button>` : ""}</div></div>`;
      $("#again", body).onclick = () => this.start();
      const nu = $("#next-unit", body);
      if (nu) nu.onclick = () => { this.unit++; this.drawOpts(); this.start(); };
      const ng = $("#next-group", body);
      if (ng) ng.onclick = () => { this.sentPick[this.sentSrc]++; this.drawOpts(); this.start(); };
      const nb = $("#to-nb", body);
      if (nb) nb.onclick = () => {
        st.missed.forEach((w) => { if (!inNotebook(w.w)) toggleNotebook(w); });
        nb.disabled = true;
        nb.textContent = "已加入";
      };
    };

    load();
  },
};
