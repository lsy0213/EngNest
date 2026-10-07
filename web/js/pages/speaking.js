// 口语：发音课（音标与自然拼读、辨音训练、连读与语调）+ 跟读句子 + 流利度训练（4/3/2 复述）
// 路由：#/speaking · #/speaking/sounds · #/speaking/pairs[/<id>] · #/speaking/linking[/<id>] · #/speaking/shadow · #/speaking/fluency[/<id>]
// 内容在 data/phonics.js、data/speak_topics.js
const HV_VOICES = ["en-US-AriaNeural", "en-US-JennyNeural", "en-US-EmmaNeural", "en-US-AvaNeural", "en-US-GuyNeural", "en-US-AndrewNeural",
  "en-US-BrianNeural", "en-GB-SoniaNeural", "en-GB-LibbyNeural", "en-GB-RyanNeural", "en-AU-NatashaNeural"];

// 双元音等没有单独录音的音：用一个基本只有这个音的词来听（英音读，和英式音标一致）
const PHONE_WORD = {
  "eɪ": ["A", "字母 A 的读音就是 /eɪ/"], "aɪ": ["eye", "eye 只有一个音 /aɪ/"], "ɔɪ": ["oy", "感叹词 oy /ɔɪ/"],
  "əʊ": ["owe", "owe（欠）只有一个音 /əʊ/"], "aʊ": ["ow", "感叹词 ow（哎哟）/aʊ/"], "ɪə": ["ear", "ear 英音读 /ɪə/"],
  "eə": ["air", "air 英音读 /eə/"], "ʊə": ["tour", "tour 英音读 /tʊə/"], "tr": ["tree", "tree 开头的 /tr/"], "dr": ["dream", "dream 开头的 /dr/"],
};

App.pages.speaking = {
  scene: "greet",
  recordings: {}, // 本次打开期间的录音（不落盘）

  render(root, params, signal) {
    const [tab, sub] = params;
    if (tab === "sounds") return this.sounds(root);
    if (tab === "pairs") return sub ? this.pairDrill(root, sub, signal) : this.pairList(root);
    if (tab === "linking") return sub ? this.linkLesson(root, sub, signal) : this.linkList(root);
    if (tab === "fluency") return sub ? this.fluency(root, sub, signal) : this.topicList(root);
    if (tab === "shadow") return this.shadowList(root, signal);
    if (tab === "spell") return this.spellDrill(root, sub ? decodeURIComponent(sub) : "", signal);
    this.home(root);
  },

  head(root, title, sub, back = "#/speaking") {
    return `<a class="back-link" href="${back}">‹ 返回</a>` + pageHead(title, sub);
  },
  tabs(active) {
    return tabsHtml([["home", "🎓 发音课"], ["shadow", "🗣️ 跟读句子"], ["fluency", "⏱️ 流利度训练"]], active);
  },
  bindTabs(root) {
    $$(".tab[data-tab]", root).forEach((b) => (b.onclick = () => Router.go(b.dataset.tab === "home" ? "speaking" : "speaking/" + b.dataset.tab)));
  },

  // ---------- 首页 ----------
  home(root) {
    const P = Store.data.phon ||= { sounds: {}, pairs: {}, links: {} };
    const pairDone = PAIRS.filter((p) => (P.pairs[p.id]?.best || 0) >= 0.8).length;
    root.innerHTML = pageHead("口语", "先把音发对，再把话说顺：发音课练准确，跟读练语感，流利度训练练开口",
      `<a class="btn soft" href="#/tutor">🤖 和 AI 情景对话</a>`) + this.tabs("home") + `
      <div class="grid grid-2 mt">
        <a class="card sp-course" href="#/speaking/sounds"><div class="sp-ico">🔤</div><b>音标与自然拼读</b>
          <div class="small muted">48 个音标：口型舌位怎么摆、中国人最容易错在哪、字母组合怎么读</div>
          <div class="small faint mt-s">练过 ${Object.keys(P.sounds).length} / ${SOUNDS.length} 个音</div></a>
        <a class="card sp-course" href="#/speaking/pairs"><div class="sp-ico">👂</div><b>辨音训练</b>
          <div class="small muted">ship 还是 sheep？think 还是 sink？${PAIRS.length} 组最容易混的音，11 种不同的声音轮流读，先把耳朵练准</div>
          <div class="small faint mt-s">正确率 80% 以上的 ${pairDone} / ${PAIRS.length} 组</div></a>
        <a class="card sp-course" href="#/speaking/linking"><div class="sp-ico">🔗</div><b>连读与语调</b>
          <div class="small muted">音节和重音、连读、省音、弱读、同化、美音特点、缩读、节奏、语调……听懂正常语速的关键</div>
          <div class="small faint mt-s">学过 ${Object.keys(P.links).length} / ${LINK_UNITS.reduce((n, u) => n + u.lessons.length, 0)} 课 · 从零开始的系统课程</div></a>
        <a class="card sp-course" href="#/speaking/spell"><div class="sp-ico">✍️</div><b>听音拼写</b>
          <div class="small muted">听一个词、看音标，写出拼写。同一个音有好几种拼法（/eɪ/：cake、rain、day、great、eight），练熟了看到生词就能读、听到生词就能写</div>
          <div class="small faint mt-s">按音练习，或者所有元音混在一起练</div></a>
      </div>
      <div class="card mt">
        <div class="card-title">📌 怎么练效果最好</div>
        <div class="grid grid-3 small muted">
          <div><b style="color:var(--ink)">1. 先听准，再说准</b><br>研究发现，专门练「听辨」相近的音（尤其是听很多不同的人读），发音也会跟着变准。所以先做辨音训练。</div>
          <div><b style="color:var(--ink)">2. 跟读要有反馈</b><br>只跟读不检查，错的地方会一直错。任何地方按 <span class="kbd">Ctrl M</span> 跟读评测，看看哪个词没读清楚。</div>
          <div><b style="color:var(--ink)">3. 同一件事说三遍</b><br>流利度训练用 4/3/2 法：同一个话题说三遍、每遍时间更短，逼自己说得越来越顺。</div>
        </div>
      </div>`;
    this.bindTabs(root);
  },

  // ---------- 音标与自然拼读 ----------
  sounds(root) {
    const P = Store.data.phon ||= { sounds: {}, pairs: {}, links: {} };
    const groups = [["单元音", ["长元音", "短元音", "弱读元音"]], ["双元音", ["双元音"]], ["辅音", ["清辅音", "浊辅音", "鼻音", "边音", "近音", "半元音"]]];
    root.innerHTML = this.head(root, "🔤 音标与自然拼读", "点一个音标看怎么发、怎么拼；绿色的是练过的") + groups.map(([g, kinds]) => `
      <div class="card"><div class="card-title">${g}</div>
        <div class="ipa-grid">${SOUNDS.filter((s) => kinds.includes(s[1])).map((s) => `<button class="ipa-cell ${P.sounds[s[0]] ? "done" : ""}" data-ipa="${esc(s[0])}"><span class="ipa-sym">/${esc(s[0])}/</span><span class="small faint">${esc(s[5].split(" ")[0])}</span></button>`).join("")}</div>
      </div>`).join("") + `<p class="small faint">音标用国内教材常用的英式写法（48 个），美音不同的地方在每个音的说明里。</p>`;
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-ipa]"); if (b) this.soundModal(b.dataset.ipa, () => b.classList.add("done")); });
  },
  soundModal(ipa, onDone) {
    const s = SOUNDS.find((x) => x[0] === ipa);
    const [sym, kind, how, tip, spell, words, pair] = s;
    const pr = PAIRS.find((p) => p.id === pair);
    const ws = words.split(" ");
    const rec = (window.IPA_AUDIO || {})[sym], word = PHONE_WORD[sym];
    const m = modal(`<div class="row"><span class="ipa-big">/${esc(sym)}/</span><button class="btn primary" id="snd-play" title="听这个音">🔊 听这个音</button><span class="badge">${esc(kind)}</span><span class="spacer"></span><button class="btn sm ghost" data-close>✕</button></div>
      <div class="small faint">${rec ? `标准录音${/辅音|鼻音|边音|近音|半元音/.test(kind) ? "（辅音单独很难听清，录音一般是放在 a 前后读，比如 [pa] [apa]）" : ""} · 来自 Wikimedia Commons，${esc(rec.lic)}` : word ? `这个音没有单独的录音，听 <b>${esc(word[0])}</b>：${esc(word[1])}` : ""}</div>
      <div class="mt-s"><b>👄 怎么发</b><div class="muted">${esc(how)}</div></div>
      ${tip ? `<div class="explain bad small" style="margin-top:10px">⚠️ ${esc(tip)}</div>` : ""}
      <div class="mt"><b>🔤 常见拼写（自然拼读）</b><div class="small muted">${esc(spell)}</div></div>
      <div class="mt"><b>🗣️ 例词</b><span class="small faint">（点词听发音，🎙️ 跟读评测）</span>
        <div class="ipa-words">${ws.map((w) => `<span class="ipa-word"><button class="chip" data-say="${esc(w)}">${esc(w)} <span class="faint small">${esc(lookupWord(w)?.ph || "")}</span></button>${shadowBtn(w, { ph: lookupWord(w)?.ph || "" })}</span>`).join("")}</div></div>
      <div class="modal-actions">${pr ? `<a class="btn soft" href="#/speaking/pairs/${pr.id}" data-close>👂 辨音训练：${esc(pr.title)}</a>` : ""}<button class="btn primary" id="snd-all">🔊 全部听一遍</button></div>`);
    m.root.querySelector(".modal").style.maxWidth = "560px";
    const playSound = () => {
      if (rec) { TTS.stop(); new Audio(rec.f).play().catch(() => toast("录音播放失败", "bad")); }
      else if (word) TTS.speak(word[0], 0.8, "en-GB-SoniaNeural");
      else TTS.speak(ws[0], 0.85);
    };
    $("#snd-play", m.root).onclick = playSound;
    playSound();
    $("#snd-all", m.root).onclick = async () => { for (const w of ws) { if (!m.root.isConnected) return; await TTS.speak(w, 0.85); await new Promise((r) => setTimeout(r, 250)); } };
    const P = Store.data.phon;
    if (!P.sounds[sym]) { P.sounds[sym] = today(); Store.save(); addXP(1); onDone?.(); }
  },

  // ---------- 听音拼写（自然拼读）：听一个词、看音标，写出拼写，再看这个音是怎么拼出来的 ----------
  // 每个音的常见拼法写在 SOUNDS 的第 5 项里，比如 "a_e (cake) · ai (rain) · ay (day)"
  spellPatterns(sym) {
    const s = SOUNDS.find((x) => x[0] === sym);
    return s ? s[4].split("·").map((t) => t.trim().split(/\s+/)[0]).filter((p) => /^[a-z_]+$/.test(p)) : [];
  },
  // 找出单词里是哪个拼法发了这个音，返回 [开始, 结束, 拼法]（a_e 这种返回两段）
  spellMatch(word, pats) {
    const w = word.toLowerCase();
    for (const p of [...pats].sort((a, b) => b.replace("_", "").length - a.replace("_", "").length)) {
      if (p.includes("_")) {
        const [a, e] = p.split("_");
        const m = w.match(new RegExp(`${a}([^aeiou]{1,2})${e}$`));
        if (m) return { p, spans: [[m.index, m.index + a.length], [w.length - e.length, w.length]] };
      } else {
        const i = w.indexOf(p);
        if (i >= 0) return { p, spans: [[i, i + p.length]] };
      }
    }
    return null;
  },
  spellDrill(root, sym, signal) {
    const vowels = SOUNDS.filter((s) => /元音/.test(s[1]) && s[0] !== "ə");
    const pool = (sym ? SOUNDS.filter((s) => s[0] === sym) : vowels).flatMap((s) => s[5].split(" ").map((w) => ({ w, sym: s[0] })));
    if (!pool.length) return Router.go("speaking/spell");
    const N = Math.min(10, pool.length);
    const items = shuffle(pool).slice(0, N);
    let i = 0, right = 0, tries = 0, done = false;
    root.innerHTML = this.head(root, "✍️ 听音拼写", "听一个词，看音标，写出它的拼写。练的是「听到这个音 → 想到这几种拼法」，这就是自然拼读", "#/speaking")
      + `<div class="chips" style="margin-bottom:12px"><a class="chip ${sym ? "" : "active"}" href="#/speaking/spell">全部元音</a>${vowels.map((s) => `<a class="chip ${sym === s[0] ? "active" : ""}" href="#/speaking/spell/${encodeURIComponent(s[0])}">/${esc(s[0])}/</a>`).join("")}</div>
        <div class="card pair-stage" id="sp"></div><div class="kbd-hint">Tab 再听一遍（Shift+Tab 慢速）· Enter 检查 / 下一题</div>`;
    const box = $("#sp", root);
    const draw = () => {
      if (i >= N) {
        addXP(2 + right);
        box.innerHTML = `<div class="center" style="padding:16px"><div style="font-size:44px">✍️</div><h3>拼对 ${right} / ${N}</h3>
          <p class="muted">${right >= N - 1 ? "太棒了！" : "拼错的词多看看它的拼法规律：同一个音常常有好几种拼法，多见几次就有感觉了。"}</p>
          <button class="btn primary" id="again">再来一组</button></div>`;
        $("#again", box).onclick = () => Router.render();
        return;
      }
      const it = items[i];
      tries = 0; done = false;
      box.innerHTML = `<div class="small muted center">第 ${i + 1} / ${N} 个</div>
        <div class="center mt"><button class="play-big" id="pl">🔊</button></div>
        <div class="center mt-s"><span class="ipa-sym">${esc(lookupWord(it.w)?.ph || `/${it.sym}/`)}</span></div>
        <input class="input en center mt" id="in" autocomplete="off" spellcheck="false" placeholder="写出这个词">
        <div id="res"></div>`;
      const inp = $("#in", box);
      $("#pl", box).onclick = () => TTS.speak(it.w, 0.85);
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Tab") { e.preventDefault(); TTS.speak(it.w, e.shiftKey ? 0.6 : 0.85); }
        else if (e.key === "Enter") { e.preventDefault(); done ? (i++, draw()) : check(); }
      });
      setTimeout(() => inp.focus(), 50);
      TTS.speak(it.w, 0.85);
    };
    const check = () => {
      const it = items[i], inp = $("#in", box), typed = inp.value.trim();
      if (!typed) return;
      tries++;
      const ok = typed.toLowerCase() === it.w.toLowerCase();
      if (!ok && tries < 2) {
        $("#res", box).innerHTML = `<div class="explain bad">${spellDiffHtml(typed, it.w)} · 再试一次（Tab 再听）</div>`;
        inp.select();
        return;
      }
      done = true;
      if (ok && tries === 1) right++;
      const pats = this.spellPatterns(it.sym), m = this.spellMatch(it.w, pats);
      let marked = esc(it.w);
      if (m) {
        const chars = [...it.w];
        marked = chars.map((c, k) => (m.spans.some(([a, b]) => k >= a && k < b) ? `<b class="sp-hl">${esc(c)}</b>` : esc(c))).join("");
      }
      $("#res", box).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? (tries === 1 ? "✅ 拼对了！" : "✅ 第二次拼对了") : `❌ 正确拼写是 <b class="en">${esc(it.w)}</b>`}
        <div class="mt-s"><span class="en sp-word">${marked}</span> ${speakBtn(it.w, "sm")} ${esc(lookupWord(it.w)?.m ? shortMeaning(lookupWord(it.w)) : "")}</div>
        ${m ? `<div class="small mt-s">这里的 /${esc(it.sym)}/ 拼成了 <b>${esc(m.p)}</b>。</div>` : ""}
        <div class="small muted">/${esc(it.sym)}/ 的常见拼法：${esc(SOUNDS.find((s) => s[0] === it.sym)[4])}</div>
        <div class="row mt-s" style="justify-content:flex-end"><button class="btn primary sm" id="nx">${i + 1 < N ? "下一个" : "看结果"} <span class="kbd">Enter</span></button></div></div>`;
      $("#nx", box).onclick = () => { i++; draw(); };
    };
    draw();
  },

  // ---------- 辨音训练（高变异语音训练：同一组词由很多不同的声音读） ----------
  pairList(root) {
    const P = Store.data.phon ||= { sounds: {}, pairs: {}, links: {} };
    root.innerHTML = this.head(root, "👂 辨音训练", "听一个词，选出你听到的是哪一个。每次换一个人读（美音、英音、澳音，男声女声），练出能听懂不同人的耳朵") + `
      <div class="grid grid-3">${PAIRS.map((p) => {
        const r = P.pairs[p.id];
        return `<a class="card sp-pair" href="#/speaking/pairs/${p.id}"><div class="row" style="gap:8px"><span class="ipa-sym">/${esc(p.a)}/</span><span class="faint">vs</span><span class="ipa-sym">/${esc(p.b)}/</span></div>
          <b class="mt-s">${esc(p.title)}</b><div class="small muted">${esc(p.pairs.slice(0, 3).map((x) => x.join("/")).join(" · "))}</div>
          ${r ? `<div class="small mt-s ${r.best >= 0.8 ? "good-text" : "faint"}">最好成绩 ${Math.round(r.best * 100)}% · 练过 ${r.n} 次</div>` : `<div class="small faint mt-s">还没练过</div>`}</a>`;
      }).join("")}</div>`;
  },
  pairDrill(root, id, signal) {
    const pr = PAIRS.find((p) => p.id === id);
    if (!pr) return Router.go("speaking/pairs");
    const N = 12;
    let i = 0, right = 0, cur = null, answered = false;
    const wrongs = [];
    root.innerHTML = this.head(root, `👂 ${esc(pr.title)}`, `/${esc(pr.a)}/ 和 /${esc(pr.b)}/ · ${esc(pr.tip)}`, "#/speaking/pairs") + `
      <div class="card pair-stage" id="stage"></div>
      <div class="kbd-hint">空格 再听一遍 · ← / → 或 1 / 2 选择 · Enter 下一题</div>`;
    const stage = $("#stage", root);
    const play = () => TTS.speak(cur.word, 0.9, cur.voice);
    const next = () => {
      if (i >= N) return finish();
      const pair = pick(pr.pairs), k = Math.random() < 0.5 ? 0 : 1;
      cur = { pair: Math.random() < 0.5 ? pair : [pair[1], pair[0]], word: pair[k], voice: pick(HV_VOICES) };
      answered = false;
      const vName = cur.voice.replace(/^en-(\w+)-(\w+)Neural$/, "$2 · $1").replace("· US", "· 美音").replace("· GB", "· 英音").replace("· AU", "· 澳音");
      stage.innerHTML = `<div class="small muted center">第 ${i + 1} / ${N} 题 · 这次是 ${esc(vName)} 在读</div>
        <div class="center mt"><button class="play-big" id="pl">🔊</button></div>
        <div class="pair-opts">${cur.pair.map((w, j) => `<button class="pair-opt" data-j="${j}"><span class="kbd">${j ? "→" : "←"}</span><b>${esc(w)}</b><span class="small faint">${esc(lookupWord(w)?.ph || "")}</span></button>`).join("")}</div>
        <div id="after"></div>`;
      $("#pl", stage).onclick = play;
      $$(".pair-opt", stage).forEach((b) => (b.onclick = () => choose(+b.dataset.j)));
      play();
    };
    const choose = (j) => {
      if (answered) return;
      answered = true;
      const ok = cur.pair[j] === cur.word;
      if (ok) right++; else wrongs.push(cur.word);
      $$(".pair-opt", stage).forEach((b, k) => { b.disabled = true; b.classList.add(cur.pair[k] === cur.word ? "right" : k === j ? "wrong" : "dim"); });
      if (typeof Sfx !== "undefined") ok ? Sfx.ok() : Sfx.play([[300, 0.15, "sine", 0.05]]);
      $("#after", stage).innerHTML = `<div class="explain ${ok ? "good" : "bad"} center">${ok ? "✅ 听对了" : `❌ 读的是 <b>${esc(cur.word)}</b>`}
          <div class="row mt-s" style="justify-content:center">${cur.pair.map((w) => `<button class="btn sm soft" data-cmp="${esc(w)}">🔊 ${esc(w)}</button>${shadowBtn(w)}`).join("")}</div>
          <div class="small faint mt-s">点按钮对比两个词（同一个声音）</div></div>
        <div class="row mt" style="justify-content:flex-end"><button class="btn primary" id="nx">${i + 1 < N ? "下一题" : "看结果"} <span class="kbd">Enter</span></button></div>`;
      $$("[data-cmp]", stage).forEach((b) => (b.onclick = () => TTS.speak(b.dataset.cmp, 0.85, cur.voice)));
      $("#nx", stage).onclick = () => { i++; next(); };
    };
    const finish = () => {
      const acc = right / N;
      const P = Store.data.phon, r = (P.pairs[pr.id] ||= { best: 0, n: 0 });
      r.best = Math.max(r.best, acc);
      r.n++;
      r.last = acc;
      Store.save();
      addXP(2 + Math.round(acc * 4));
      i = N + 1;
      stage.innerHTML = `<div class="center" style="padding:16px"><div style="font-size:44px">${acc >= 0.9 ? "🎉" : acc >= 0.7 ? "👍" : "💪"}</div>
          <h3>听对 ${right} / ${N}</h3><p class="muted">${acc >= 0.9 ? "耳朵很准！下面开口说一说。" : acc >= 0.7 ? "不错！错的词多对比着听几遍。" : "这组音对你来说还比较难，多练几轮，每次都会换不同的人读。"}</p></div>
        ${wrongs.length ? `<div class="small muted">听错的：${[...new Set(wrongs)].map((w) => `<button class="chip" data-say="${esc(w)}">${esc(w)}</button>`).join(" ")}</div>` : ""}
        <div class="card-title mt">🗣️ 开口说：每一对都读一读（🎙️ 跟读评测会告诉你识别成了哪个词）</div>
        <div class="pair-say">${pr.pairs.map(([a, b]) => `<div class="row"><span class="en">${esc(a)}</span>${speakBtn(a, "sm")}${shadowBtn(a)}<span class="faint">/</span><span class="en">${esc(b)}</span>${speakBtn(b, "sm")}${shadowBtn(b)}</div>`).join("")}</div>
        <div class="row mt" style="justify-content:center"><button class="btn primary" id="again">再练一轮</button><a class="btn" href="#/speaking/pairs">换一组</a></div>`;
      $("#again", stage).onclick = () => { i = 0; right = 0; wrongs.length = 0; next(); };
    };
    onKey(signal, (e) => {
      if (i >= N) return;
      if (e.key === " ") { e.preventDefault(); play(); }
      else if (!answered && (e.key === "ArrowLeft" || e.key === "1")) { e.preventDefault(); choose(0); }
      else if (!answered && (e.key === "ArrowRight" || e.key === "2")) { e.preventDefault(); choose(1); }
      else if (answered && e.key === "Enter") { e.preventDefault(); i++; next(); }
    });
    next();
  },

  // ---------- 连读与语调课程 ----------
  allLinks() { return LINK_UNITS.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u }))); },
  linkList(root) {
    const P = Store.data.phon ||= { sounds: {}, pairs: {}, links: {} };
    const all = this.allLinks();
    const next = all.find((l) => !P.links[l.id]) || all[0];
    root.innerHTML = this.head(root, "🔗 连读与语调", `从零开始的系统课程：${LINK_UNITS.length} 个单元、${all.length} 课。单个词都会读，连成句子却听不懂、说不顺？问题都在这里`)
      + `<div class="card row" style="gap:12px;margin-bottom:16px"><div style="flex:1"><b>📍 学到第 ${Object.keys(P.links).filter((id) => all.some((l) => l.id === id)).length} / ${all.length} 课</b>
          <div class="small muted">建议按顺序学，每课 10–15 分钟：先看讲解，再听例句、跟读，最后做练习。</div></div>
          <a class="btn primary" href="#/speaking/linking/${next.id}">${P.links[next.id] ? "从头复习" : "继续学"}：${esc(next.title)} →</a></div>`
      + LINK_UNITS.map((u) => `<div class="card"><div class="card-title">${esc(u.title)}</div>
        <div class="link-lessons">${u.lessons.map((l) => {
          const r = P.links[l.id];
          return `<a class="link-lesson ${r ? "done" : ""}" href="#/speaking/linking/${l.id}"><span class="link-ico">${l.icon}</span>
            <span style="flex:1;min-width:0"><b>${esc(l.title)}</b><span class="small muted">${l.examples.length} 个例句 · ${l.drills.reduce((n, d) => n + d.items.length, 0)} 道练习${r?.score !== undefined ? ` · 练习正确率 ${Math.round(r.score * 100)}%` : ""}</span></span>
            ${r ? `<span class="good-text">✓</span>` : ""}</a>`;
        }).join("")}</div></div>`).join("");
  },

  linkLesson(root, id, signal) {
    const all = this.allLinks(), k = all.findIndex((l) => l.id === id), l = all[k];
    if (!l) return Router.go("speaking/linking");
    const next = all[k + 1], prev = all[k - 1];
    const md = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    const markHtml = (m) => esc(m).replace(/‿/g, '<span class="lk">‿</span>').replace(/(↘↗|↗|↘)/g, '<span class="lk">$1</span>')
      .replace(/\[([^\]]+)\]/g, '<span class="lk-snd">$1</span>').replace(/\(([a-z]+)\)/gi, '<span class="lk-drop">$1</span>');
    root.innerHTML = this.head(root, `${l.icon} ${esc(l.title)}`, `${esc(l.unit.title)} · 第 ${k + 1} / ${all.length} 课`, "#/speaking/linking") + `
      ${l.sections.map((s, j) => `<div class="card link-sec"><div class="card-title">${j + 1}. ${esc(s.h)}</div>
        ${s.p ? `<div class="link-intro">${md(s.p)}</div>` : ""}
        ${s.table ? `<div class="link-table-wrap"><table class="link-table"><thead><tr>${s.table[0].map((c) => `<th>${md(c)}</th>`).join("")}</tr></thead>
          <tbody>${s.table.slice(1).map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
      </div>`).join("")}
      <div class="card"><div class="card-title">🎧 例句：听一听，读一读 <span class="small muted" style="font-weight:400">先正常速度、再 🐢 慢速对照下面的标注听，然后点 🎙️ 跟读评测</span></div>
        <div class="small faint" style="margin-bottom:6px">标注：<span class="lk">‿</span> 连读 · <span class="lk-drop">x</span> 灰色删除线 = 不发音 · 大写 = 重读 · / 停顿 · <span class="lk">↗ ↘</span> 升降调 · <span class="lk-snd">tʃ</span> 实际读出的音</div>
        ${l.examples.map(([en, mark, zh]) => `<div class="link-row" data-shadow-host>
          <div style="flex:1;min-width:0"><div class="en link-en">${esc(en)}</div><div class="link-mark">${markHtml(mark)}</div><div class="small muted">${esc(zh)}</div></div>
          <div class="row" style="gap:4px">${speakBtn(en.replace(/\s*\((n|v)\.\)/, ""), "sm")}<button class="speak sm" data-say="${esc(en.replace(/\s*\((n|v)\.\)/, ""))}" data-rate="0.6" title="慢速">🐢</button>${shadowBtn(en, { zh })}</div></div>`).join("")}
        <div class="row mt-s" style="justify-content:flex-end"><button class="btn sm soft" id="play-all">🔊 全部连续听一遍</button></div>
      </div>
      ${l.drills.map((d, j) => `<div class="card" id="drill-${j}"></div>`).join("")}
      <div class="row mt" style="justify-content:space-between">
        ${prev ? `<a class="btn ghost" href="#/speaking/linking/${prev.id}">‹ ${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a class="btn primary" href="#/speaking/linking/${next.id}">下一课：${esc(next.title)} →</a>` : `<a class="btn primary" href="#/speaking/fluency">学完了！去流利度训练 →</a>`}</div>`;
    const P = Store.data.phon ||= { sounds: {}, pairs: {}, links: {} };
    const rec = (P.links[l.id] = typeof P.links[l.id] === "object" ? P.links[l.id] : { date: today() });
    if (!rec.seen) { rec.seen = true; Store.save(); addXP(2); }
    App.shadowTarget = () => l.examples.map(([en, , zh], j) => ({ en, zh, label: `第 ${j + 1} 句` }));
    let playing = false;
    $("#play-all", root).onclick = async (e) => {
      if (playing) { playing = false; TTS.stop(); e.target.textContent = "🔊 全部连续听一遍"; return; }
      playing = true;
      e.target.textContent = "⏹ 停止";
      for (const [en] of l.examples) {
        if (!playing || signal.aborted) break;
        await TTS.speak(en.replace(/\s*\((n|v)\.\)/, ""));
        await new Promise((r) => setTimeout(r, 500));
      }
      playing = false;
      if (e.target.isConnected) e.target.textContent = "🔊 全部连续听一遍";
    };
    // 各个练习的得分汇总成这一课的正确率
    const scores = [];
    const onDone = (j, right, total) => {
      scores[j] = [right, total];
      const done = scores.filter(Boolean);
      if (done.length === l.drills.length) {
        rec.score = done.reduce((n, [r]) => n + r, 0) / done.reduce((n, [, t]) => n + t, 0);
        Store.save();
        addXP(3);
      }
    };
    l.drills.forEach((d, j) => this.linkDrill($(`#drill-${j}`, root), d, signal, (r, t) => onDone(j, r, t)));
  },

  // 一组练习：listen 听辨 / choose 选择 / link 点连读位置 / stress 点重读词
  linkDrill(box, d, signal, onDone) {
    const items = d.type === "listen" ? shuffle(d.items).slice(0, 8) : d.items;
    let i = 0, right = 0, voice;
    const title = { listen: "👂 听辨练习", choose: "✏️ 练一练", link: "🔗 找连读", stress: "🥁 找重读" }[d.type];
    const head = () => `<div class="card-title">${title} <span class="small muted" style="font-weight:400">${esc(d.q)} · ${Math.min(i + 1, items.length)} / ${items.length}</span></div>`;
    const finish = () => {
      box.innerHTML = `<div class="card-title">${title}</div><div class="center"><b>答对 ${right} / ${items.length}</b>
        <div class="small muted">${right === items.length ? "全对！🎉" : "错了的地方回到上面再看看讲解和例句。"}</div>
        <button class="btn sm mt-s" data-again>再做一次</button></div>`;
      $("[data-again]", box).onclick = () => { i = 0; right = 0; draw(); };
      onDone(right, items.length);
    };
    const after = (ok, html) => {
      if (ok) right++;
      if (typeof Sfx !== "undefined") ok ? Sfx.ok() : Sfx.play([[300, 0.15, "sine", 0.05]]);
      $(".ld-after", box).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? "✅ 对了！" : "❌ 不太对。"} ${html}
        <div class="row mt-s" style="justify-content:flex-end"><button class="btn primary sm" data-next>${i + 1 < items.length ? "下一题" : "看结果"}</button></div></div>`;
      $("[data-next]", box).onclick = () => { i++; draw(); };
    };
    const draw = () => {
      if (signal.aborted) return;
      if (i >= items.length) return finish();
      const it = items[i];
      if (d.type === "listen") {
        voice = pick(HV_VOICES);
        box.innerHTML = head() + `<div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn soft" data-play>🔊 播放</button>${d.opts.map((o, j) => `<button class="btn" data-o="${j}">${esc(o)}</button>`).join("")}</div><div class="ld-after"></div>`;
        const play = () => TTS.speak(it[0], undefined, voice);
        $("[data-play]", box).onclick = play;
        $$("[data-o]", box).forEach((b) => (b.onclick = () => {
          if ($(".ld-after", box).innerHTML) return;
          const ok = +b.dataset.o === it[1];
          b.classList.add(ok ? "good" : "bad");
          after(ok, `读的是：<span class="en">${esc(it[0])}</span> ${speakBtn(it[0], "sm")}`);
        }));
        play();
      } else if (d.type === "choose") {
        const [qq, opts, ans, why, say] = it;
        box.innerHTML = head() + `<div class="ld-q"><span class="en">${esc(qq)}</span> ${say ? `<button class="speak sm" data-say="${esc(say)}">🔊</button>` : ""}</div>
          <div class="ld-opts">${opts.map((o, j) => `<button class="btn" data-o="${j}">${esc(o)}</button>`).join("")}</div><div class="ld-after"></div>`;
        if (say) TTS.speak(say);
        $$("[data-o]", box).forEach((b) => (b.onclick = () => {
          if ($(".ld-after", box).innerHTML) return;
          const ok = +b.dataset.o === ans;
          b.classList.add(ok ? "good" : "bad");
          if (!ok) $$("[data-o]", box)[ans].classList.add("good");
          after(ok, esc(why));
        }));
      } else {
        // link：在词和词之间点；stress：点词。答案都写在题目字符串里
        const isLink = d.type === "link";
        const words = isLink ? it.replace(/‿/g, " ‿ ").split(/\s+/).filter(Boolean) : it.split(/\s+/);
        const toks = []; // { w, gap: 连读答案, stressed }
        if (isLink) {
          words.forEach((w) => { if (w === "‿") toks[toks.length - 1].link = true; else toks.push({ w }); });
        } else {
          words.forEach((w, j) => {
            const core = w.replace(/[^A-Za-z']/g, "");
            const stressed = core.length > 1 && core === core.toUpperCase();
            let shown = stressed ? w.toLowerCase() : w;
            if (j === 0) shown = shown[0].toUpperCase() + shown.slice(1);
            toks.push({ w: shown, stressed });
          });
        }
        const sel = new Set();
        const sentence = toks.map((t) => t.w).join(" ");
        const howto = isLink
          ? `👆 两个词中间的 <span class="ld-gap demo">+</span> 是可以点的：觉得这两个词要连起来读，就点一下，它会变成 <span class="ld-gap demo on">连</span>，再点一下取消。选好了点「检查」。<span class="faint">（例：Pick it up 读成 pi-ki-tup，所以两个空都要点）</span>`
          : `👆 点一下句子里你觉得应该<b>重读</b>的词，选中的词会变成橙色，再点一下取消。选好了点「检查」。<span class="faint">（实词：名词、动词、形容词、副词、疑问词、否定词）</span>`;
        box.innerHTML = head() + `<div class="small muted ld-howto">${howto}</div><div class="ld-sent ${isLink ? "gaps" : "words"}">${toks.map((t, j) => isLink
          ? `<span class="ld-w">${esc(t.w)}</span>${j < toks.length - 1 ? `<button class="ld-gap" data-j="${j}" title="点一下：${esc(t.w)} 和 ${esc(toks[j + 1].w)} 连读">+</button>` : ""}`
          : `<button class="ld-word" data-j="${j}">${esc(t.w)}</button>`).join(isLink ? "" : " ")}</div>
          <div class="row mt-s" style="gap:8px"><button class="speak sm" data-say="${esc(sentence)}">🔊</button><button class="speak sm" data-say="${esc(sentence)}" data-rate="0.6">🐢</button><span class="spacer"></span><span class="small muted ld-count"></span><button class="btn primary sm" data-check>检查</button></div><div class="ld-after"></div>`;
        TTS.speak(sentence);
        $(".ld-sent", box).onclick = (e) => {
          const b = e.target.closest("[data-j]");
          if (!b || $(".ld-after", box).innerHTML) return;
          const j = +b.dataset.j;
          if (sel.has(j)) sel.delete(j); else sel.add(j);
          b.classList.toggle("on", sel.has(j));
          if (isLink) b.textContent = sel.has(j) ? "连" : "+";
          $(".ld-count", box).textContent = sel.size ? `已选 ${sel.size} 处` : "";
        };
        $("[data-check]", box).onclick = () => {
          if ($(".ld-after", box).innerHTML) return;
          const answer = new Set(toks.map((t, j) => ((isLink ? t.link : t.stressed) ? j : -1)).filter((j) => j >= 0));
          const ok = answer.size === sel.size && [...answer].every((j) => sel.has(j));
          $$("[data-j]", box).forEach((b) => {
            const j = +b.dataset.j;
            b.classList.remove("on");
            const cls = answer.has(j) ? (sel.has(j) ? "right" : "missed") : sel.has(j) ? "wrong" : "x";
            b.classList.add(cls);
            if (isLink) b.textContent = { right: "✓", missed: "漏", wrong: "✗", x: "" }[cls];
          });
          const correct = isLink
            ? toks.map((t, j) => esc(t.w) + (t.link ? '<span class="lk">‿</span>' : j < toks.length - 1 ? " " : "")).join("")
            : toks.map((t) => (t.stressed ? `<b class="ld-stress">${esc(t.w.toUpperCase())}</b>` : esc(t.w))).join(" ");
          after(ok, `正确答案：<span class="en ld-answer">${correct}</span>
            <div class="small muted mt-s">${isLink ? "✓ 你点对的 · 漏 = 应该连读但你没点 · ✗ = 这里其实不连读" : "绿色 = 你选对的重读词 · 黄色 = 应该重读但你没选 · 红色 = 这个词其实轻读"}</div>`);
        };
      }
    };
    draw();
  },

  // ---------- 跟读句子（原来的口语页） ----------
  shadowList(root, signal) {
    root.innerHTML = pageHead("口语", "", `<a class="btn soft" href="#/tutor">🤖 和 AI 情景对话</a>`) + this.tabs("shadow")
      + `<div class="card" style="margin:16px 0">
          <div class="card-title">📌 跟读小技巧</div>
          <div class="grid grid-3 small muted">
            <div><b style="color:var(--ink)">1. 先慢后快</b><br>先用 🐢 慢速听清每个词，再用正常语速模仿整体节奏。</div>
            <div><b style="color:var(--ink)">2. 模仿语调</b><br>注意句子哪里升调、哪里降调，重读的词要读得更响更长。</div>
            <div><b style="color:var(--ink)">3. 注意连读</b><br>比如 <i>Can I</i> 读成 /kæ naɪ/，<i>Thank you</i> 读成 /θæŋ kjuː/。</div>
          </div></div>
        <div class="row" style="margin-bottom:16px;align-items:flex-start"><div class="chips" id="scenes" style="flex:1"></div>
          <span class="small faint" style="white-space:nowrap;padding-top:6px">🎯 跟读评测：鼠标指着句子按 Ctrl+M</span></div>
        <div id="list"></div>`;
    this.bindTabs(root);

    const scenes = $("#scenes", root);
    const list = $("#list", root);
    const draw = () => {
      scenes.innerHTML = SENTENCE_SCENES.map((s) => `<button class="chip ${this.scene === s.id ? "active" : ""}" data-sc="${s.id}">${s.icon} ${s.title}</button>`).join("");
      const sc = SENTENCE_SCENES.find((s) => s.id === this.scene);
      // Ctrl+M：鼠标停在哪句就跟读哪句，不在任何一句上时从第一句开始
      App.shadowTarget = () => sc.sentences.map(([en, zh]) => ({ en, zh, label: "" }));
      list.innerHTML = sc.sentences.map(([en, zh], i) => {
        const key = `${sc.id}-${i}`;
        return `<div class="shadow-item" data-key="${key}" data-en="${esc(en)}" data-shadow-host>
          <div class="txt"><div class="en">${esc(en)}</div><div class="zh">${esc(zh)}</div></div>
          <div class="tools">
            <button class="btn sm soft" data-say="${esc(en)}">🔊 原速</button>
            <button class="btn sm ghost" data-say="${esc(en)}" data-rate="0.6">🐢 慢速</button>
            <button class="btn sm" data-rec>🎙️ 录音</button>
            <button class="btn sm ${this.recordings[key] ? "good" : "ghost"}" data-play ${this.recordings[key] ? "" : "disabled"}>▶ 我的</button>
            ${shadowBtn(en, { zh }, false)}
          </div></div>`;
      }).join("");
    };
    draw();
    scenes.onclick = (e) => {
      const c = e.target.closest("[data-sc]");
      if (c) { this.scene = c.dataset.sc; draw(); }
    };

    let rec = null; // { recorder, item, stream }
    const stopRec = () => { if (rec) rec.recorder.stop(); };
    signal.addEventListener("abort", stopRec);

    list.addEventListener("click", async (e) => {
      const item = e.target.closest(".shadow-item");
      if (!item) return;
      const key = item.dataset.key;

      if (e.target.closest("[data-play]")) {
        const url = this.recordings[key];
        if (url) new Audio(url).play();
        return;
      }
      if (!e.target.closest("[data-rec]")) return;

      if (rec) { // 正在录音 → 停止
        const same = rec.item === item;
        stopRec();
        if (same) return;
      }
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return micUnavailable();
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        toast("无法使用麦克风：请检查麦克风是否连接，以及系统隐私设置里是否允许应用使用麦克风。", "bad", 5000);
        return;
      }
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      rec = { recorder, item, stream };
      const btn = $("[data-rec]", item);
      item.classList.add("recording");
      btn.innerHTML = `<span class="rec-dot"></span> 停止`;
      recorder.ondataavailable = (ev) => chunks.push(ev.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        item.classList.remove("recording");
        btn.innerHTML = "🎙️ 重录";
        if (rec && rec.recorder === recorder) rec = null;
        if (!chunks.length) return;
        if (this.recordings[key]) URL.revokeObjectURL(this.recordings[key]);
        this.recordings[key] = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
        const pb = $("[data-play]", item);
        pb.disabled = false;
        pb.className = "btn sm good";
        Store.data.stats.speaking++;
        addXP(2);
        // 录完先放原音，再放自己的，方便对比
        TTS.speak(item.dataset.en).then(() => { if (item.isConnected) new Audio(this.recordings[key]).play(); });
      };
      recorder.start();
      // 最长 20 秒自动停止
      setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 20000);
    });
  },

  // ---------- 流利度训练：4/3/2 复述 ----------
  topicList(root) {
    const hist = Store.data.fluency || [];
    root.innerHTML = pageHead("口语", "", `<a class="btn soft" href="#/tutor">🤖 和 AI 情景对话</a>`) + this.tabs("fluency") + `
      <div class="card" style="margin:16px 0"><div class="card-title">⏱️ 4/3/2 复述法</div>
        <div class="small muted">选一个话题，<b>同一件事连说三遍，每遍时间更短</b>（比如 2 分钟 → 1 分半 → 1 分钟）。第一遍想内容，第二遍更顺，第三遍又快又流利。
        研究发现这样重复几次，说话速度会变快、停顿会变少，而且效果能保持下去。每遍说完自动识别，统计语速和停顿；开了 AI 还能帮你改错、给一个更地道的版本。</div></div>
      <div class="grid grid-3">${SPEAK_TOPICS.map((t) => {
        const h = hist.filter((x) => x.id === t.id).pop();
        return `<a class="card sp-topic" href="#/speaking/fluency/${t.id}"><div class="row"><b style="flex:1">${esc(t.t)}</b><span class="badge">${t.lv}</span></div>
          <div class="small faint en">${esc(t.en)}</div>${h ? `<div class="small good-text mt-s">上次：${h.wpm.join(" → ")} 词/分钟</div>` : ""}</a>`;
      }).join("")}</div>`;
    this.bindTabs(root);
  },

  fluency(root, id, signal) {
    const t = SPEAK_TOPICS.find((x) => x.id === id);
    if (!t) return Router.go("speaking/fluency");
    const P = Store.prefs;
    const PLANS = { easy: [90, 60, 45], std: [120, 90, 60], hard: [240, 180, 120] };
    P.flu_plan ||= "easy";
    const rounds = [];
    let k = 0, timer = null, recUrl = [];
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
    root.innerHTML = this.head(root, `⏱️ ${esc(t.t)}`, `${esc(t.en)} · ${t.lv}`, "#/speaking/fluency") + `
      <div class="flu-layout">
        <div class="card">
          <div class="card-title">💡 可以说这些</div>
          <ul class="small flu-ask">${t.ask.map((q) => `<li class="en">${esc(q)}</li>`).join("")}</ul>
          <div class="card-title mt">🧩 好用的表达</div>
          ${t.chunks.map(([en, zh]) => `<div class="flu-chunk"><span class="en">${esc(en)}</span>${speakBtn(en.replace(/\.\.\./g, ""), "sm")}<div class="small muted">${esc(zh)}</div></div>`).join("")}
          <div class="card-title mt">⏲️ 每遍时长</div>
          <div class="tabs" id="plan">${[["easy", "1:30 → 1:00 → 0:45"], ["std", "2:00 → 1:30 → 1:00"], ["hard", "4:00 → 3:00 → 2:00"]].map(([v, l]) => `<button class="tab ${P.flu_plan === v ? "active" : ""}" data-plan="${v}">${l}</button>`).join("")}</div>
        </div>
        <div class="card" id="flu"></div>
      </div>`;
    const box = $("#flu", root);
    $("#plan", root).onclick = (e) => {
      const b = e.target.closest("[data-plan]");
      if (!b) return;
      if (k > 0 || Mic.active) return toast("这一轮已经开始了，下次再换时长");
      P.flu_plan = b.dataset.plan;
      Store.save();
      $$("[data-plan]", root).forEach((x) => x.classList.toggle("active", x === b));
      draw();
    };
    const secs = () => PLANS[P.flu_plan][k];

    const roundsHtml = () => rounds.length ? `<div class="flu-rounds">${rounds.map((r, j) => `
        <div class="flu-round"><div class="row"><b>第 ${j + 1} 遍</b><span class="small muted">${fmt(r.dur)}</span><span class="spacer"></span>
          <span class="flu-stat"><b>${r.wpm}</b> 词/分钟</span><span class="flu-stat"><b>${r.words}</b> 词</span><span class="flu-stat"><b>${r.pauses}</b> 次停顿</span>
          <button class="speak sm" data-mine="${j}" title="听我的录音">▶</button></div>
          <div class="small flu-text" data-text="${esc(r.text)}">${r.text ? wrapWords(r.text) : `<span class="faint">（没有识别出内容）</span>`}</div></div>`).join("")}</div>` : "";

    const draw = () => {
      clearInterval(timer);
      if (k >= 3) return summary();
      box.innerHTML = `<div class="center flu-now">
          <div class="small muted">第 ${k + 1} / 3 遍${k ? " · 还是同一个话题，这次时间更短，试着说得更快更顺" : " · 先看左边的提示想一想，准备好了就开始"}</div>
          <div class="flu-clock" id="clock">${fmt(secs())}</div>
          <div class="bar flu-bar"><i id="tbar" style="width:0"></i></div>
          <button class="btn primary lg mt" id="go">🎙️ 开始说 <span class="kbd">空格</span></button>
          <div class="small faint mt-s">时间到会自动结束；说完了也可以提前停</div></div>` + roundsHtml();
      $("#go", box).onclick = start;
    };

    const start = async () => {
      if (Mic.active) return stop();
      if (!(await Stt.ready())) return;
      if (!navigator.mediaDevices?.getUserMedia) return micUnavailable();
      TTS.stop();
      const total = secs(), t0 = Date.now();
      try {
        await Mic.start({ onSilence: () => stop(), silenceMs: 1e9, maxMs: total * 1000 });
      } catch (e) { toast(`打不开麦克风：${e.message || e}`, "bad", 4000); return; }
      const go = $("#go", box);
      go.innerHTML = `<span class="rec-dot"></span> 说完了 <span class="kbd">空格</span>`;
      go.classList.replace("primary", "bad");
      timer = setInterval(() => {
        const used = (Date.now() - t0) / 1000;
        const c = $("#clock", box);
        if (!c) return clearInterval(timer);
        c.textContent = fmt(Math.max(0, total - used));
        c.classList.toggle("warn-text", total - used < 10);
        $("#tbar", box).style.width = `${Math.min(100, (used / total) * 100)}%`;
      }, 250);
    };

    const stop = async () => {
      if (!Mic.active) return;
      clearInterval(timer);
      const rec = await Mic.stop();
      if (!rec?.heard || rec.seconds < 3) { toast("没听到声音，检查一下麦克风再试一次", "bad"); draw(); return; }
      box.querySelector(".flu-now").innerHTML = `<div class="flu-clock">⏳</div><div class="muted">正在识别你说的话……（说得越长要等越久）</div>`;
      let r;
      try { r = await pywebview.api.stt_assess(rec.pcm); } catch (e) { r = { ok: false, error: String(e) }; }
      if (signal.aborted) return;
      if (!r.ok) { toast(r.error, "bad", 4000); draw(); return; }
      const ws = r.words || [];
      const speak = ws.length >= 2 ? ws[ws.length - 1].e - ws[0].s : rec.seconds;
      const pauses = ws.slice(1).filter((w, j) => w.s - ws[j].e > 1).length;
      recUrl[k] = URL.createObjectURL(rec.wav());
      rounds.push({ text: r.text, words: ws.length, wpm: speak > 0 ? Math.round((ws.length / speak) * 60) : 0, pauses, dur: Math.round(rec.seconds) });
      k++;
      Store.data.stats.speaking++;
      addXP(3);
      draw();
    };

    const summary = () => {
      const [a, , c] = rounds;
      (Store.data.fluency ||= []).push({ id: t.id, date: today(), wpm: rounds.map((r) => r.wpm), pauses: rounds.map((r) => r.pauses) });
      if (Store.data.fluency.length > 100) Store.data.fluency.shift();
      Store.save();
      addXP(5);
      const max = Math.max(...rounds.map((r) => r.wpm), 1);
      box.innerHTML = `<div class="center"><div style="font-size:40px">🎉</div><h3>三遍说完了！</h3>
          <p class="muted">语速 ${a.wpm} → ${c.wpm} 词/分钟${c.wpm > a.wpm ? `（快了 ${Math.round((c.wpm / Math.max(a.wpm, 1) - 1) * 100)}%）` : ""} · 停顿 ${a.pauses} → ${c.pauses} 次</p>
          <div class="flu-chart">${rounds.map((r, j) => `<div class="flu-col"><div class="flu-colbar" style="height:${Math.round((r.wpm / max) * 100)}%"><span>${r.wpm}</span></div><div class="small muted">第 ${j + 1} 遍</div></div>`).join("")}</div>
          <p class="small faint">母语者日常聊天大约 120–160 词/分钟。语速不是越快越好，重要的是少卡顿、意思连贯。</p>
          <div class="row" style="justify-content:center">${AI.enabled ? `<button class="btn primary" id="ai">🤖 让 AI 帮我改一改</button>` : ""}<button class="btn" id="again">再来三遍</button><a class="btn ghost" href="#/speaking/fluency">换个话题</a></div></div>
        <div id="ai-box"></div>` + roundsHtml();
      $("#again", box).onclick = () => { rounds.length = 0; k = 0; draw(); };
      const ai = $("#ai", box);
      if (ai) ai.onclick = async () => {
        ai.disabled = true;
        ai.textContent = "AI 正在看……";
        const res = await AI.json(`You are a friendly English speaking coach for Chinese learners. ${LEARNER_PROFILE}`,
          `The learner talked about the topic "${t.en}" three times (4/3/2 fluency practice). This is the speech-recognition transcript of the last attempt:
"${c.text}"
Speech rate went from ${a.wpm} to ${c.wpm} words per minute; long pauses from ${a.pauses} to ${c.pauses}.
Return JSON: {"comment": "中文总评，2-3 句，先肯定再给最重要的一个建议", "fixes": [{"wrong": "learner's phrase", "right": "corrected phrase", "why": "中文简短说明"}], "better": "a natural spoken version of what the learner said, similar length, CEFR B1, keep their ideas", "chunks": [["a useful phrase for this topic", "中文"]]}
At most 5 fixes (ignore recognition errors that are clearly just mishearing) and 3 chunks.`);
        if (signal.aborted) return;
        ai.disabled = false;
        ai.textContent = "🤖 让 AI 帮我改一改";
        if (!res.ok) { toast(res.error, "bad", 4000); return; }
        const d = res.data;
        $("#ai-box", box).innerHTML = `<div class="explain"><b>🤖 ${esc(d.comment || "")}</b>
          ${(d.fixes || []).map((f) => `<div class="correction"><span class="from">${esc(f.wrong)}</span> → <span class="to">${esc(f.right)}</span><div class="small muted">${esc(f.why)}</div></div>`).join("")}
          ${d.better ? `<div class="mt"><b>更地道的说法</b> ${speakBtn(d.better, "sm")}${shadowBtn(d.better)}<div class="en flu-better" data-text="${esc(d.better)}">${wrapWords(d.better)}</div></div>` : ""}
          ${(d.chunks || []).length ? `<div class="mt"><b>可以学的表达</b>${d.chunks.map(([en, zh]) => `<div><span class="en">${esc(en)}</span> <span class="muted small">${esc(zh)}</span> ${speakBtn(en, "sm")}</div>`).join("")}</div>` : ""}
          <div class="small faint mt-s">可以再来三遍，试着用上这些表达。</div></div>`;
      };
    };

    box.addEventListener("click", (e) => { const b = e.target.closest("[data-mine]"); if (b && recUrl[+b.dataset.mine]) new Audio(recUrl[+b.dataset.mine]).play(); });
    bindWordClicks(box);
    onKey(signal, (e) => { if (e.key === " " && k < 3 && $("#go", box)) { e.preventDefault(); start(); } });
    signal.addEventListener("abort", () => { clearInterval(timer); Mic.cancel(); recUrl.forEach((u) => u && URL.revokeObjectURL(u)); });
    draw();
  },
};
