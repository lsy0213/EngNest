// 听力广场：为我生成听力（AI）/ VOA 原声精听 / 听写句子 / 听音选义
// 路由：#/listening 首页 · #/listening/gen[/<id>] 生成的听力 · #/listening/voa[/<id>] VOA 精听 · #/listening/dictation · #/listening/choose
App.pages.listening = {
  scene: "all",
  render(root, params, signal) {
    this._page = signal;
    const mode = params[0];
    if (mode === "gen") return params[1] ? this.genPlayer(root, params[1], signal) : this.genForm(root);
    if (mode === "voa") return params[1] ? this.voaPlayer(root, params[1], signal) : this.voaList(root);
    if (mode === "dictation" || mode === "choose") return this.drill(root, mode, signal);
    this.hub(root);
  },

  drill(root, mode, signal) {
    root.innerHTML = `<a class="back-link" href="#/listening">‹ 听力广场</a>` + pageHead("听写和听音", "先听，再写。听不清就放慢速度多听几遍。",
      tabsHtml([["dictation", "听写句子"], ["choose", "听音选义"]], mode))
      + `<div class="chips" id="scenes" style="margin-bottom:16px"></div><div id="lis-body"></div>`;
    $$(".tab", root).forEach((b) => (b.onclick = () => Router.go("listening/" + b.dataset.tab)));

    const scenes = $("#scenes", root);
    const drawScenes = () => {
      scenes.innerHTML = [`<button class="chip ${this.scene === "all" ? "active" : ""}" data-sc="all">全部</button>`]
        .concat(SENTENCE_SCENES.map((s) => `<button class="chip ${this.scene === s.id ? "active" : ""}" data-sc="${s.id}">${s.icon} ${s.title}</button>`)).join("");
    };
    drawScenes();
    scenes.onclick = (e) => {
      const c = e.target.closest("[data-sc]");
      if (!c) return;
      this.scene = c.dataset.sc;
      drawScenes();
      start();
    };
    const body = $("#lis-body", root);
    const start = () => (mode === "choose" ? this.choose(body) : this.dictation(body));
    start();
  },

  pool() {
    const scenes = this.scene === "all" ? SENTENCE_SCENES : SENTENCE_SCENES.filter((s) => s.id === this.scene);
    return scenes.flatMap((s) => s.sentences);
  },

  dictation(body) {
    const signal = freshSignal(this, this._page);
    const st = Store.data.stats;
    const [en, zh] = pick(this.pool());
    let checked = false, hints = 0;
    body.innerHTML = `<div class="card" style="max-width:720px;margin:0 auto">
      <div class="row small muted"><span>已听写 ${st.dictation} 句 · 全对 ${st.dictation_ok} 句</span><span class="spacer"></span><span>Enter 检查 / 下一句 · Tab 重播 · Shift+Tab 慢速</span></div>
      <div class="player">
        <button class="btn ghost" data-slow title="慢速播放">🐢 慢速</button>
        <button class="play-big" id="play">▶</button>
        <button class="btn ghost" data-hint title="提示首字母">💡 提示</button>
      </div>
      <textarea class="textarea en mt" id="ans" rows="2" placeholder="把听到的句子写下来…" spellcheck="false"></textarea>
      <div id="hint" class="small muted mt-s"></div>
      <div id="result" class="mt"></div>
      <div class="row mt"><button class="btn" data-show>直接看答案</button><span class="spacer"></span><button class="btn primary" id="act">检查</button></div>
    </div>`;

    const play = async (rate) => {
      const b = $("#play", body);
      b.classList.add("playing");
      await TTS.speak(en, rate);
      b.classList.remove("playing");
    };
    const ans = $("#ans", body);
    const check = (evt, reveal = false) => {
      if (checked) return next();
      checked = true;
      const target = en.split(/\s+/);
      const tt = target.map((w) => tokens(w).join(" "));
      const input = tokens(ans.value);
      const { hitT } = lcsMatch(tt, input);
      const acc = reveal ? 0 : Math.round((hitT.filter(Boolean).length / target.length) * 100);
      const cls = acc >= 90 ? "high" : acc >= 60 ? "mid" : "low";
      st.dictation++;
      if (acc === 100) { st.dictation_ok++; addXP(3, null, evt); }
      else if (acc >= 60) addXP(1, null, evt);
      Store.save();
      $("#result", body).innerHTML = `
        <div class="row"><span class="score-pill ${cls}">${reveal ? "已查看答案" : `准确率 ${acc}%`}</span>
          <span class="muted small">${acc === 100 ? "完美！" : reveal ? "" : "红色波浪线是没听出来或写错的词"}</span></div>
        <div class="diff mt-s">${target.map((w, i) => `<span class="${hitT[i] ? "ok" : "miss"}">${esc(w)}</span>`).join(" ")} ${speakBtn(en, "sm")}</div>
        <div class="muted">${esc(zh)}</div>`;
      ans.readOnly = true;
      $("#act", body).textContent = "下一句 ›";
    };
    const next = () => this.dictation(body);

    $("#play", body).onclick = () => play();
    $("[data-slow]", body).onclick = () => play(0.6);
    $("[data-hint]", body).onclick = () => {
      hints++;
      $("#hint", body).textContent = "提示：" + en.split(/\s+/).map((w) => w[0] + "_".repeat(Math.max(0, w.replace(/[^A-Za-z']/g, "").length - 1))).join(" ");
    };
    $("[data-show]", body).onclick = (e) => check(e, true);
    $("#act", body).onclick = (e) => check(e);
    ans.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); check(e); }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") { e.preventDefault(); play(e.shiftKey ? 0.6 : undefined); }
      else if (e.key === "Enter" && checked && e.target !== ans && !e.target.closest("button")) next();
    }, { signal });

    setTimeout(() => { ans.focus(); play(); }, 200);
  },

  choose(body) {
    const signal = freshSignal(this, this._page);
    const pool = this.pool();
    const [en, zh] = pick(pool);
    const all = SENTENCE_SCENES.flatMap((s) => s.sentences);
    const others = sample(all.filter(([e]) => e !== en), 3).map(([, z]) => z);
    const o = shuffle([zh, ...others]);
    body.innerHTML = `<div class="card" style="max-width:720px;margin:0 auto">
      <div class="small muted">听句子，选出正确的中文意思（按 1–4 选择）</div>
      <div class="player"><button class="btn ghost" data-say="${esc(en)}" data-rate="0.6">🐢 慢速</button><button class="play-big" data-say="${esc(en)}">▶</button><span style="width:74px"></span></div>
      <div id="q" class="mt"></div>
      <div class="row mt hidden" id="after"><div class="diff" style="font-size:17px">${esc(en)}</div><span class="spacer"></span><button class="btn primary" id="next">下一句 ›</button></div>
    </div>`;
    renderChoice($("#q", body), { q: "", o, a: o.indexOf(zh) }, {
      onAnswer: (ok, evt) => {
        if (ok) addXP(1, null, evt);
        $("#after", body).classList.remove("hidden");
        if (document.activeElement) document.activeElement.blur();
      },
    });
    $("#next", body).onclick = () => this.choose(body);
    onKey(signal, (e) => {
      if (["1", "2", "3", "4"].includes(e.key)) { const b = $$(".option", body)[+e.key - 1]; if (b && !b.disabled) b.click(); }
      else if (e.key === "Enter" && !$("#after", body).classList.contains("hidden")) this.choose(body);
      else if (e.key === " ") { e.preventDefault(); TTS.speak(en); }
    });
    setTimeout(() => TTS.speak(en), 200);
  },

  // ---------- 听力广场首页 ----------
  hub(root) {
    const gens = Store.data.gen_listening || [];
    const voaAudio = VOA_INDEX.filter((a) => a.audio).length;
    const heard = Object.keys(Store.data.voa_heard || {}).length;
    root.innerHTML = pageHead("听力广场", "")
      + `<div class="listen-hub">
        <div class="card listen-card gen">
          <div class="listen-main"><h3>🎧 为我生成听力</h3><p class="small muted">用生词本里最近收藏的词，加上几个同难度的新词，生成一段对话或独白，用两种不同的声音读出来，听完做题。</p>
            <div class="row mt-s"><a class="btn primary" href="#/listening/gen">生成</a>${gens.length ? `<a class="btn soft" href="#/listening/gen/${gens[0].id}">上一段</a>` : ""}
              ${AI.enabled ? "" : `<span class="small faint">需要先在设置里接入 AI</span>`}</div></div>
          <div class="listen-art">🎧</div></div>
        <a class="card listen-card" href="#/listening/voa">
          <div class="listen-main"><h3>📻 VOA 原声精听</h3><p class="small muted">${voaAudio} 篇美国之音慢速英语原声，配原文和词汇表；可以调速、倒退、AB 句循环，原文可以先模糊再看。</p>
            <span class="small brand-text">已听 ${heard} 篇 ›</span></div>
          <div class="listen-art">📻</div></a>
        <a class="card listen-card" href="#/listening/dictation">
          <div class="listen-main"><h3>✍️ 听写句子</h3><p class="small muted">听一句，写一句，逐词比对。60 句情景口语，听不清可以放慢。</p><span class="small brand-text">开始 ›</span></div>
          <div class="listen-art">✍️</div></a>
        <a class="card listen-card" href="#/listening/choose">
          <div class="listen-main"><h3>👂 听音选义</h3><p class="small muted">听一句话，选出正确的意思。适合热身。</p><span class="small brand-text">开始 ›</span></div>
          <div class="listen-art">👂</div></a>
      </div>
      ${gens.length ? `<div class="card mt"><div class="card-title">🕘 生成过的听力</div>${gens.slice(0, 10).map((g) => `
        <a class="gen-row" href="#/listening/gen/${g.id}"><b class="en">${esc(g.title)}</b><span class="small muted">${esc(g.topic_zh || "")} · ${g.lines.length} 句 · ${g.date}</span>
          ${g.score != null ? `<span class="badge good">${g.score}/${g.questions.length}</span>` : ""}</a>`).join("")}</div>` : ""}`;
  },

  // ---------- 为我生成听力 ----------
  genForm(root) {
    root.innerHTML = `<a class="back-link" href="#/listening">‹ 听力广场</a>` + pageHead("为我生成听力", "AI 会把你要复习的词自然地放进一段听力里。");
    if (!AI.enabled) { root.innerHTML += aiLockHtml("生成听力"); return; }
    // 生词本里最近的单词，加上收藏的短语（整句不适合当「要用到的词」）
    const recent = [...Store.data.notebook.slice(0, 8).map((x) => x.w), ...sentNb().filter((x) => x.en.split(/\s+/).length <= 4).slice(0, 2).map((x) => x.en)];
    const fresh = sample(bookItems().filter((x) => !Store.data.words[x.w] && x.w.length > 3), 3).map((x) => x.w);
    const P = Store.prefs;
    root.innerHTML += `<div class="card gen-form">
      <div class="field"><label>要用到的词（可以改，逗号分隔）</label>
        <input class="input en" id="g-words" value="${esc([...recent, ...fresh].join(", "))}" placeholder="比如 schedule, budget, recommend">
        <span class="help">前面是生词本里最近收藏的，后面几个是当前词书里还没学的新词。</span></div>
      <div class="form-grid mt-s">
        <div class="field"><label>形式</label><select class="select" id="g-type"><option value="dialogue">两人对话</option><option value="monologue">一个人讲述</option></select></div>
        <div class="field"><label>长度</label><select class="select" id="g-len"><option value="short">30~60 秒（约 6 句）</option><option value="medium" selected>1~2 分钟（约 12 句）</option><option value="long">3~5 分钟（约 24 句）</option></select></div>
        <div class="field"><label>难度</label><select class="select" id="g-lv">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${n === (P.read_level || 2) ? "selected" : ""}>${CEFR[n]}</option>`).join("")}</select></div>
        <div class="field"><label>话题（可选）</label><input class="input" id="g-topic" placeholder="比如：找房子、周末计划、面试"></div>
      </div>
      <div id="g-status" class="mt-s"></div>
      <div class="row mt"><button class="btn primary lg" id="g-go">✨ 生成</button></div></div>`;
    $("#g-go", root).onclick = async () => {
      const words = $("#g-words", root).value.split(/[,，]/).map((s) => s.trim()).filter(Boolean).slice(0, 12);
      const type = $("#g-type", root).value, len = $("#g-len", root).value, lv = CEFR[+$("#g-lv", root).value];
      const topic = $("#g-topic", root).value.trim();
      const n = { short: 6, medium: 12, long: 24 }[len];
      $("#g-go", root).disabled = true;
      $("#g-status", root).innerHTML = aiLoading("正在写听力稿，大约需要 10–30 秒…");
      const r = await AI.json(`You write English listening materials for learners. ${LEARNER_PROFILE}`,
        `Write an original ${type === "dialogue" ? "conversation between two people, A and B (give them names)" : "short talk by one speaker"} at CEFR ${lv} level, about ${n} lines.
${topic ? `Topic: ${topic}.` : "Choose a realistic everyday topic that fits the words."}
Use these words or phrases naturally (each at least once): ${words.join(", ") || "(none, choose useful everyday words)"}.
Return JSON exactly in this shape:
{"title": "English title", "topic_zh": "中文话题", "names": {"A": "name", "B": "name"},
 "lines": [{"speaker": "A", "en": "one or two sentences", "zh": "中文翻译"}],
 "words": [{"w": "word or phrase used", "zh": "中文意思"}],
 "questions": [{"q": "English question", "o": ["option A", "option B", "option C", "option D"], "a": 0, "e": "中文解析"}]}
Use exactly 3 questions. For a talk, every line uses speaker "A".`);
      if (!root.isConnected) return;
      const d = r.ok ? r.data : null;
      if (!d || !Array.isArray(d.lines) || !d.lines.length) {
        $("#g-go", root).disabled = false;
        $("#g-status", root).innerHTML = aiError(r.ok ? "AI 返回的内容不完整，请再试一次。" : r.error);
        return;
      }
      const g = { id: "g" + Date.now(), date: today(), title: d.title || "Listening", topic_zh: d.topic_zh || topic, names: d.names || {},
        lines: d.lines.filter((x) => x.en), words: d.words || [], questions: (d.questions || []).filter((q) => Array.isArray(q.o) && q.o.length === 4) };
      (Store.data.gen_listening ||= []).unshift(g);
      Store.data.gen_listening.length = Math.min(Store.data.gen_listening.length, 30);
      Store.save();
      Router.go(`listening/gen/${g.id}`);
    };
  },

  genPlayer(root, id, signal) {
    const g = (Store.data.gen_listening || []).find((x) => x.id === id);
    if (!g) { Router.go("listening"); return; }
    // 两个说话人用一女一男两种声音
    const voices = { A: "en-US-AriaNeural", B: "en-US-GuyNeural" };
    const P = Store.prefs;
    P.listen_view ||= "blur";
    root.innerHTML = `<a class="back-link" href="#/listening">‹ 听力广场</a>
      <div class="page-head"><div><div class="page-title" style="font-family:var(--font-en)">${esc(g.title)}</div>
        <div class="page-sub">${esc(g.topic_zh || "")} · ${g.lines.length} 句 · 先听，再看原文</div></div>
        <div class="row"><button class="btn primary" id="play">▶ 播放全部</button>
          <select class="select" id="rate" style="width:auto">${[[0.75, "慢速"], [0.9, "稍慢"], [1, "正常"], [1.15, "稍快"]].map(([v, l]) => `<option value="${v}" ${v === (P.listen_rate || 0.9) ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
      ${this.modeTabs()}
      <div class="card dict-card hidden" id="mode-dict"></div>
      <div class="card" id="mode-text">
        <div class="row"><span class="small muted">原文</span><div class="tabs listen-view">${[["hide", "隐藏"], ["blur", "模糊"], ["show", "显示"]].map(([k, l]) => `<button class="tab ${P.listen_view === k ? "active" : ""}" data-view="${k}">${l}</button>`).join("")}</div>
          <span class="spacer"></span>${switchHtml("zh", "中文", false)}</div>
        <div class="script view-${P.listen_view}" id="script">${g.lines.map((l, i) => `
          <div class="script-line ${l.speaker === "B" ? "b" : "a"}" data-i="${i}">
            <span class="who">${esc((g.names || {})[l.speaker] || l.speaker)}</span>
            <div class="what"><span class="en">${wrapWords(l.en)}</span><div class="zh hidden">${esc(l.zh || "")}</div></div>
            <button class="btn sm ghost" data-line="${i}">🔊</button></div>`).join("")}</div>
      </div>
      ${g.words.length ? `<div class="card"><div class="card-title">📌 本段用到的词</div>${g.words.map((x) => `<span class="word-chip"><b class="en">${esc(x.w)}</b> ${esc(x.zh || "")} ${speakBtn(x.w, "sm")}</span>`).join("")}</div>` : ""}
      ${g.questions.length ? `<div class="card"><div class="card-title">📝 听力理解</div><div id="qs"></div><div class="row mt"><button class="btn primary" id="submit">提交</button><span id="score" class="muted"></span></div></div>` : ""}`;
    bindWordClicks($("#script", root));
    let playing = false;
    const rate = () => +$("#rate", root).value;
    const lines = $$(".script-line", root);
    const playLine = async (i) => {
      lines.forEach((x) => x.classList.toggle("now", +x.dataset.i === i));
      lines[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
      await TTS.speak(g.lines[i].en, rate(), voices[g.lines[i].speaker] || voices.A);
    };
    const stop = () => { playing = false; TTS.stop(); $("#play", root).textContent = "▶ 播放全部"; lines.forEach((x) => x.classList.remove("now")); };
    $("#play", root).onclick = async () => {
      if (playing) return stop();
      playing = true;
      $("#play", root).textContent = "⏹ 停止";
      for (let i = 0; i < g.lines.length && playing && !signal.aborted; i++) {
        await playLine(i);
        await new Promise((r) => setTimeout(r, 350));
      }
      if (!signal.aborted) stop();
    };
    $("#rate", root).onchange = (e) => { P.listen_rate = +e.target.value; Store.save(); };
    $("#script", root).addEventListener("click", (e) => { const b = e.target.closest("[data-line]"); if (b) { stop(); playLine(+b.dataset.line); } });
    $$("[data-view]", root).forEach((b) => (b.onclick = () => {
      P.listen_view = b.dataset.view;
      Store.save();
      $$("[data-view]", root).forEach((x) => x.classList.toggle("active", x === b));
      $("#script", root).className = `script view-${P.listen_view}`;
    }));
    $("#zh", root).onchange = (e) => $$(".script .zh", root).forEach((z) => z.classList.toggle("hidden", !e.target.checked));
    this.bindModeTabs(root, (box) => this.dictate(box, g.lines.map((l) => ({ en: l.en, zh: l.zh, voice: voices[l.speaker] || voices.A, who: (g.names || {})[l.speaker] || "" })),
      { key: `gen-${g.id}` }, signal), stop);
    if (g.questions.length) {
      const letters = "ABCD", qs = $("#qs", root), picked = {};
      qs.innerHTML = g.questions.map((q, qi) => `<div class="quiz-item" data-q="${qi}"><div class="quiz-q en" style="font-size:16px"><span class="qnum">${qi + 1}.</span>${esc(q.q)}</div>
        <div class="options">${q.o.map((o, i) => `<button class="option" data-i="${i}"><span class="letter">${letters[i]}</span><span class="en">${esc(o)}</span></button>`).join("")}</div><div class="explain-slot"></div></div>`).join("");
      qs.onclick = (e) => {
        const b = e.target.closest(".option");
        if (!b || b.disabled) return;
        const item = b.closest(".quiz-item");
        picked[item.dataset.q] = +b.dataset.i;
        $$(".option", item).forEach((x) => x.classList.toggle("picked", x === b));
      };
      $("#submit", root).onclick = () => {
        let right = 0;
        g.questions.forEach((q, qi) => {
          const item = $(`.quiz-item[data-q="${qi}"]`, qs), ok = picked[qi] === q.a;
          if (ok) right++;
          $$(".option", item).forEach((x, i) => { x.disabled = true; if (i === q.a) x.classList.add("right"); else if (i === picked[qi]) x.classList.add("wrong"); });
          $(".explain-slot", item).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? "✅" : "❌"} ${esc(q.e || "")}</div>`;
        });
        $("#submit", root).disabled = true;
        $("#score", root).textContent = `答对 ${right} / ${g.questions.length}`;
        if (g.score == null) addXP(5 + right * 2);
        g.score = right;
        Store.save();
      };
    }
  },

  // ---------- 逐句听写 ----------
  // 听一句（或一段）→ 随时暂停、重听 → 自己写下来 → 和原文逐词对照 → 看翻译
  // segs：[{en, zh?, voice?, who?}]；opts.key 记进度；opts.translate(i) 没有现成翻译时用 AI 翻译
  dictate(box, segs, opts, signal) {
    const P = Store.prefs, prog = ((Store.data.dict_progress ||= {})[opts.key] ||= { i: 0, s: {} });
    let i = Math.min(prog.i || 0, segs.length - 1), state = "idle", checked = false;
    const rate = () => P.dict_rate ?? 0.9;
    box.innerHTML = `
      <div class="row dict-top"><b id="d-pos"></b><div class="bar" style="flex:1;max-width:240px"><i id="d-bar"></i></div><span class="small faint" id="d-avg"></span>
        <span class="spacer"></span>${opts.unitTabs || ""}</div>
      <div class="dict-player">
        <button class="btn primary" id="d-play">▶ 播放</button>
        <button class="btn" id="d-replay" title="从头再听一遍">↺ 重听</button>
        <select class="select" id="d-rate" title="语速">${[[0.6, "很慢"], [0.75, "慢速"], [0.9, "稍慢"], [1, "正常"]].map(([v, l]) => `<option value="${v}" ${v === rate() ? "selected" : ""}>${l}</option>`).join("")}</select>
        <span class="small faint" id="d-who"></span>
        <span class="spacer"></span><span class="small faint">Ctrl+空格 播放 / 暂停 · Enter 核对 · 再按 Enter 下一句</span>
      </div>
      <textarea class="input en dict-input" id="d-input" rows="3" placeholder="听到什么就写什么，听不清的词可以先空着…" spellcheck="false"></textarea>
      <div class="row mt-s"><button class="btn primary" id="d-check">核对</button><button class="btn ghost" id="d-peek">直接看原文</button>
        <span class="spacer"></span><button class="btn ghost" id="d-prev">‹ 上一句</button><button class="btn soft" id="d-next">下一句 ›</button></div>
      <div id="d-result"></div>`;
    const $b = (s) => $(s, box), input = $b("#d-input"), playBtn = $b("#d-play");
    const setState = (s) => { state = s; playBtn.textContent = { idle: "▶ 播放", play: "⏸ 暂停", pause: "▶ 继续" }[s]; };
    const play = async () => {
      setState("play");
      const p = TTS.speak(segs[i].en, rate(), segs[i].voice);
      const seq = TTS.seq;
      await p;
      if (TTS.seq === seq && !signal.aborted) setState("idle"); // 被重听打断时不改状态
    };
    const toggle = () => {
      if (state === "idle") play();
      else if (state === "play") { TTS.pause(); setState("pause"); }
      else { TTS.resume(); setState("play"); }
    };
    const scores = () => Object.values(prog.s);
    const show = (autoplay) => {
      TTS.stop();
      setState("idle");
      checked = false;
      prog.i = i;
      Store.save();
      $b("#d-pos").textContent = `第 ${i + 1} / ${segs.length} ${opts.unitName || "句"}`;
      $b("#d-bar").style.width = `${(scores().length / segs.length) * 100}%`;
      $b("#d-avg").textContent = scores().length ? `已听写 ${scores().length} ${opts.unitName || "句"} · 平均正确率 ${Math.round((scores().reduce((a, b) => a + b, 0) / scores().length) * 100)}%` : "";
      $b("#d-who").textContent = segs[i].who ? `说话人：${segs[i].who}` : "";
      $b("#d-prev").disabled = i === 0;
      $b("#d-next").textContent = i === segs.length - 1 ? "完成 ✓" : "下一句 ›";
      input.value = "";
      $b("#d-result").innerHTML = "";
      input.focus();
      if (autoplay) play();
    };
    const zhHtml = async (slot) => {
      const s = segs[i];
      if (s.zh) { slot.textContent = s.zh; return; }
      if (!opts.translate) { slot.innerHTML = `<span class="faint">没有现成的翻译</span>`; return; }
      if (!AI.enabled) { slot.innerHTML = `<span class="faint">在「设置」里接入 AI 后可以显示翻译</span>`; return; }
      const my = i;
      slot.innerHTML = aiLoading("翻译中…");
      const t = await opts.translate(i);
      if (my === i && slot.isConnected) slot.textContent = t || "翻译失败，稍后再试";
    };
    const check = (peek = false) => {
      const s = segs[i], d = wordDiff(s.en, peek ? "" : input.value);
      checked = true;
      if (!peek && input.value.trim()) {
        const first = prog.s[i] == null;
        prog.s[i] = Math.max(prog.s[i] || 0, d.score);
        Store.data.stats.dictation++;
        if (d.score === 1) Store.data.stats.dictation_ok++;
        if (first && d.score >= 0.8) addXP(2);
        Store.save();
      }
      const op = (o) => o.t === "ok" ? `<span class="d-ok">${esc(o.w)}</span>`
        : o.t === "miss" ? `<span class="d-miss" title="漏写">${esc(o.w)}</span>`
        : o.t === "wrong" ? `<span class="d-wrong" title="写错了"><s>${esc(o.y)}</s> ${esc(o.w)}</span>`
        : `<s class="d-extra" title="多写的">${esc(o.y)}</s>`;
      const pct = Math.round(d.score * 100);
      $b("#d-result").innerHTML = `<div class="dict-result">
        ${peek ? "" : `<div class="row"><b class="${pct >= 90 ? "good-text" : pct >= 60 ? "" : "bad-text"}">正确率 ${pct}%</b><span class="spacer"></span>
          <span class="small d-legend"><span class="d-ok">写对</span><span class="d-wrong"><s>写错</s></span><span class="d-miss">漏写</span><s class="d-extra">多写</s></span></div>
          <div class="dict-diff en">${d.ops.map(op).join(" ")}</div>`}
        <div class="dict-row"><span class="dict-label">原文</span><div class="en dict-en">${wrapWords(s.en)} ${speakBtn(s.en, "sm")}</div></div>
        <div class="dict-row"><span class="dict-label">翻译</span><div class="dict-zh" id="d-zh"></div></div></div>`;
      bindWordClicks($b(".dict-en"));
      zhHtml($b("#d-zh"));
    };
    const next = () => { if (i < segs.length - 1) { i++; show(true); } else { toast(`🎉 这篇听写完了！平均正确率 ${Math.round((scores().reduce((a, b) => a + b, 0) / Math.max(1, scores().length)) * 100)}%`, "good", 4000); } };
    playBtn.onclick = toggle;
    $b("#d-replay").onclick = () => play();
    $b("#d-rate").onchange = (e) => { P.dict_rate = +e.target.value; Store.save(); if (state !== "idle") play(); };
    $b("#d-check").onclick = () => check();
    $b("#d-peek").onclick = () => check(true);
    $b("#d-prev").onclick = () => { if (i > 0) { i--; show(false); } };
    $b("#d-next").onclick = next;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (checked) next(); else check(); }
    });
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && e.ctrlKey && box.isConnected && !box.closest(".hidden")) { e.preventDefault(); toggle(); }
    }, { signal });
    show(false);
  },

  // 原文 / 逐句听写 两种模式的切换条
  modeTabs() {
    const m = Store.prefs.listen_mode === "dict" ? "dict" : "text";
    return `<div class="tabs listen-mode">${[["text", "📄 看原文"], ["dict", "✍️ 逐句听写"]].map(([k, l]) => `<button class="tab ${m === k ? "active" : ""}" data-lmode="${k}">${l}</button>`).join("")}</div>`;
  },
  bindModeTabs(root, initDict, onSwitch) {
    let inited = false;
    const apply = () => {
      const dict = Store.prefs.listen_mode === "dict";
      $$("[data-lmode]", root).forEach((b) => b.classList.toggle("active", (b.dataset.lmode === "dict") === dict));
      $("#mode-text", root).classList.toggle("hidden", dict);
      $("#mode-dict", root).classList.toggle("hidden", !dict);
      if (dict && !inited) { inited = true; initDict($("#mode-dict", root)); }
    };
    $$("[data-lmode]", root).forEach((b) => (b.onclick = () => {
      Store.prefs.listen_mode = b.dataset.lmode;
      Store.save();
      TTS.stop();
      onSwitch?.();
      apply();
    }));
    apply();
  },

  // ---------- VOA 原声精听 ----------
  voaList(root) {
    const heard = Store.data.voa_heard || {};
    const secs = [...new Set(VOA_INDEX.map((a) => a.section))];
    this.voaSec ||= "all";
    const list = VOA_INDEX.filter((a) => a.audio && (this.voaSec === "all" || a.section === this.voaSec)).map((a) => Docs.voaMeta(a));
    root.innerHTML = `<a class="back-link" href="#/listening">‹ 听力广场</a>` + pageHead("VOA 原声精听", "美国之音为学习者录制的慢速英语。先盲听，再看原文；听不清的句子可以 AB 循环。播放需要联网。")
      + `<div class="chips" style="margin-bottom:14px">${[["all", "全部"], ...secs.map((s) => [s, s])].map(([v, l]) => `<button class="chip ${v === this.voaSec ? "active" : ""}" data-sec="${esc(v)}">${esc(l)}</button>`).join("")}</div>
      <div class="grid grid-2">${list.map((m) => {
        const img = docImages(m.id)[0];
        return `<a class="card book-card slim" href="#/listening/voa/${m.id.slice(4)}">
          ${img ? `<div class="doc-thumb"><img src="${esc(img.src)}" alt="" loading="lazy"></div>` : ""}
          <div class="book-info"><div class="row">${levelBadge(m)}<span class="small faint">${m.words} 词 · 约 ${Math.max(2, Math.round(m.words / 110))} 分钟</span><span class="spacer"></span>${heard[m.id] ? `<span class="badge good">✓ 听过</span>` : ""}</div>
            <h3 class="mt-s" style="font-family:var(--font-en)">${esc(m.title)}</h3><div class="small muted">${esc(m.section)} · ${m.year}</div></div></a>`;
      }).join("")}</div>`;
    $$("[data-sec]", root).forEach((b) => (b.onclick = () => { this.voaSec = b.dataset.sec; this.voaList(root); }));
  },

  async voaPlayer(root, aid, signal) {
    const a = VOA_INDEX.find((x) => String(x.id) === aid);
    if (!a) { Router.go("listening/voa"); return; }
    await loadScript("data/voa_text.js");
    if (signal.aborted) return;
    const m = Docs.voaMeta(a), text = VOA_TEXT[a.id], P = Store.prefs;
    P.listen_view ||= "blur";
    const img = docImages(m.id)[0];
    root.innerHTML = `<a class="back-link" href="#/listening/voa">‹ VOA 原声精听</a>
      <div class="page-head"><div><div class="small muted">${esc(a.section)} · ${a.date}</div><div class="page-title" style="font-family:var(--font-en)">${esc(a.title)}</div>
        <div class="page-sub">${a.words} 词 · 先听一遍，说说大意，再看原文</div></div>
        <a class="btn ghost" href="#/book/voa-${a.id}">在阅读器里打开</a></div>
      <div class="card voa-player">
        ${img ? `<img class="voa-cover" src="${esc(img.src)}" alt="">` : ""}
        <audio id="au" controls preload="metadata" src="${esc(a.audio)}"></audio>
        <div class="row mt-s voa-ctrl">
          <button class="btn sm" id="back5">⏪ 5 秒</button>
          <select class="select" id="speed" style="width:auto">${[0.75, 0.85, 1, 1.15].map((v) => `<option value="${v}" ${v === (P.voa_speed || 1) ? "selected" : ""}>${v}×</option>`).join("")}</select>
          <button class="btn sm" id="ab">🔁 AB 循环</button><span class="small faint" id="ab-state"></span>
          <span class="spacer"></span><button class="btn sm soft" id="heard">${(Store.data.voa_heard || {})[m.id] ? "✓ 已听完" : "✓ 听完了"}</button>
        </div>
        <div class="small faint mt-s">音频来自美国之音（公有领域），需要联网播放。</div>
      </div>
      ${this.modeTabs()}
      <div class="card dict-card hidden" id="mode-dict"></div>
      <div class="card" id="mode-text">
        <div class="row"><span class="small muted">原文</span><div class="tabs listen-view">${[["hide", "隐藏"], ["blur", "模糊"], ["show", "显示"]].map(([k, l]) => `<button class="tab ${P.listen_view === k ? "active" : ""}" data-view="${k}">${l}</button>`).join("")}</div></div>
        <div class="script voa-text view-${P.listen_view}" id="script">${text.paras.map((p) => `<p class="en">${wrapWords(p)}</p>`).join("")}</div>
      </div>
      ${text.glossary.length ? `<div class="card"><div class="card-title">📝 Words in This Story</div>${text.glossary.map(([w, d]) => `<div class="row vocab-item"><b class="en">${esc(w)}</b><span class="muted small" style="flex:1">${esc(d)}</span>${speakBtn(w, "sm")}</div>`).join("")}</div>` : ""}`;
    bindWordClicks($("#script", root));
    const au = $("#au", root);
    au.playbackRate = P.voa_speed || 1;
    au.onerror = () => toast("VOA 原声加载失败：可能没联网，或者在中国大陆连不上 VOA（可以在「设置 → 网络」填代理后重启）。也可以切到「逐句听写」，用合成语音听。", "bad", 7000);
    $("#speed", root).onchange = (e) => { au.playbackRate = +e.target.value; P.voa_speed = +e.target.value; Store.save(); };
    $("#back5", root).onclick = () => { au.currentTime = Math.max(0, au.currentTime - 5); au.play(); };
    // AB 循环：第一次点记 A，第二次点记 B 并开始循环，第三次取消
    let A = null, B = null;
    const abState = $("#ab-state", root);
    $("#ab", root).onclick = () => {
      if (A == null) { A = au.currentTime; abState.textContent = `A = ${A.toFixed(1)} 秒，再点一下设 B`; }
      else if (B == null) { B = Math.max(au.currentTime, A + 1); abState.textContent = `循环 ${A.toFixed(1)}–${B.toFixed(1)} 秒，再点取消`; au.currentTime = A; au.play(); }
      else { A = B = null; abState.textContent = ""; }
    };
    au.addEventListener("timeupdate", () => { if (B != null && au.currentTime >= B) au.currentTime = A; }, { signal });
    signal.addEventListener("abort", () => au.pause());
    $$("[data-view]", root).forEach((b) => (b.onclick = () => {
      P.listen_view = b.dataset.view;
      Store.save();
      $$("[data-view]", root).forEach((x) => x.classList.toggle("active", x === b));
      $("#script", root).className = `script voa-text view-${P.listen_view}`;
    }));
    // 逐句听写：VOA 原声没有逐句的时间点，所以用合成语音一句一句读；可以按句或按段
    const initDict = (box) => {
      const unit = P.dict_unit === "para" ? "para" : "sent";
      const segs = (unit === "para" ? text.paras : text.paras.flatMap(splitSentences)).map((en) => ({ en }));
      const key = `voa-${a.id}-${unit}`;
      const translate = async (i) => {
        const k = `${key}:${i}`;
        const c = await KV.get("tr_voa", k);
        if (c) return c;
        const r = await AI.ask("You are an English-Chinese translator for Chinese learners. Reply with only a natural Chinese translation, nothing else.", segs[i].en);
        if (!r.ok) return null;
        KV.set("tr_voa", k, r.text.trim());
        return r.text.trim();
      };
      const unitTabs = `<div class="tabs sm">${[["sent", "按句"], ["para", "按段"]].map(([k, l]) => `<button class="tab ${unit === k ? "active" : ""}" data-unit="${k}">${l}</button>`).join("")}</div>`;
      this.dictate(box, segs, { key, translate, unitTabs, unitName: unit === "para" ? "段" : "句" }, signal);
      $$("[data-unit]", box).forEach((b) => (b.onclick = () => { P.dict_unit = b.dataset.unit; Store.save(); TTS.stop(); initDict(box); }));
      box.insertAdjacentHTML("beforeend", `<p class="small faint mt">逐句听写用的是合成语音（不是 VOA 原声），每句可以单独重听、暂停。想听原声请切回「看原文」用上面的播放器。</p>`);
    };
    this.bindModeTabs(root, initDict, () => au.pause());

    $("#heard", root).onclick = (e) => {
      const h = (Store.data.voa_heard ||= {});
      if (!h[m.id]) { h[m.id] = today(); addXP(Math.min(15, 4 + Math.round(a.words / 150))); }
      Store.save();
      e.currentTarget.textContent = "✓ 已听完";
    };
  },
};
