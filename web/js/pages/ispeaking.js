// 雅思口语模考：考官（神经语音）提问 → 自动录音 → 离线 Whisper 转写 → 语速、停顿、词汇量等指标 → AI 按四项评分标准估分
// Part 1 日常问答 / Part 2 话题卡（1 分钟准备 + 最多 2 分钟独白）/ Part 3 深入讨论，可以整套考也可以单练一个部分
// 路由：#/ispeak · #/ispeak/test/<full|1|2|3>
const ISP_VOICES = [["en-GB-RyanNeural", "英音 · 男"], ["en-GB-SoniaNeural", "英音 · 女"], ["en-AU-NatashaNeural", "澳音 · 女"], ["en-US-GuyNeural", "美音 · 男"]];
const ISP_CRIT = [
  ["fc", "流利度与连贯性", "Fluency & Coherence", "说得是否连贯、停顿和自我纠正多不多，有没有用连接词把意思串起来"],
  ["lr", "词汇丰富度", "Lexical Resource", "用词是否多样、准确，会不会换个说法（paraphrase），有没有地道的搭配和习语"],
  ["gra", "语法多样性与准确性", "Grammatical Range & Accuracy", "能否用复合句、从句、各种时态，错误多不多、影不影响理解"],
  ["p", "发音", "Pronunciation", "单词发音、重音、连读、语调，听的人是否需要费力"],
];
const ispBand = (xs) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 2) / 2;
const ispFmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

App.pages.ispeak = {
  render(root, params, signal) {
    if (params[0] === "test") return this.test(root, signal, params[1] || "full");
    this.home(root);
  },

  home(root) {
    const P = Store.prefs, H = Store.data.ispeak || [];
    P.isp_voice ||= ISP_VOICES[0][0];
    root.innerHTML = `<a class="back-link" href="#/ielts">‹ 返回雅思</a>` + pageHead("🗣️ 雅思口语模考", "考官用语音提问，你直接回答，说完停顿几秒就自动进入下一题。考完看转写、语速和停顿，AI 按雅思四项标准估分") + `
      <div class="grid grid-2">
        <div class="card"><div class="card-title">🎬 开始模考</div>
          <div class="isp-modes">
            <a class="isp-mode main" href="#/ispeak/test/full"><b>完整模考</b><span>Part 1 → 2 → 3，约 12–14 分钟</span></a>
            <a class="isp-mode" href="#/ispeak/test/1"><b>Part 1</b><span>日常问答 · 3 个话题约 10 题</span></a>
            <a class="isp-mode" href="#/ispeak/test/2"><b>Part 2</b><span>话题卡 · 准备 1 分钟，说 1–2 分钟</span></a>
            <a class="isp-mode" href="#/ispeak/test/3"><b>Part 3</b><span>深入讨论 · 4 个抽象问题</span></a>
          </div>
          <div class="card-title mt">⚙️ 设置</div>
          <div class="row" style="gap:8px;flex-wrap:wrap"><span class="small muted">考官声音</span>
            <select class="input sm" id="voice">${ISP_VOICES.map(([v, l]) => `<option value="${v}" ${P.isp_voice === v ? "selected" : ""}>${l}</option>`).join("")}</select>
            <label class="small"><input type="checkbox" id="text" ${P.isp_text ? "checked" : ""}> 显示题目文字（真实考试只能听）</label></div>
          <div class="row mt-s" style="gap:8px;flex-wrap:wrap"><span class="small muted">题目来源</span>
            <div class="tabs" id="src">${[["bank", "📚 题库"], ["ai", "🤖 AI 出新题"]].map(([v, l]) => `<button class="tab ${(P.isp_src || "bank") === v ? "active" : ""}" data-src="${v}">${l}</button>`).join("")}</div></div>
          <div class="small faint mt-s">${AI.enabled ? "考完会自动让 AI 按四项标准打分。" : "没接入 AI 也能考：能看到转写、语速、停顿和词汇量；接入 AI 后可以估分和改错。"}</div>
        </div>
        <div class="card"><div class="card-title">📏 四项评分标准（各占 25%）</div>
          ${ISP_CRIT.map(([, zh, en, d]) => `<div class="isp-crit"><b>${zh}</b> <span class="small faint">${en}</span><div class="small muted">${d}</div></div>`).join("")}
          <div class="card-title mt">💡 答题小技巧</div>
          <ul class="small muted isp-tips">
            <li><b>Part 1</b>：每题 2–3 句，直接回答 + 原因 / 例子，别只说 Yes / No</li>
            <li><b>Part 2</b>：按卡片上的提示一条条讲，至少说满 1 分钟，最好接近 2 分钟；准备时只记关键词</li>
            <li><b>Part 3</b>：观点 + 解释 + 例子 + 对比，多用 I'd say… / It depends on… / On the other hand…</li>
            <li>没听清可以说 <i>Sorry, could you repeat the question?</i>，不扣分</li>
          </ul></div>
      </div>
      <div class="card mt"><div class="card-title">📜 模考记录</div><div id="hist">${H.length ? "" : `<div class="small faint">还没有记录</div>`}</div></div>`;
    $("#voice", root).onchange = (e) => { P.isp_voice = e.target.value; Store.save(); TTS.speak("Good morning. My name is Alex, and I'll be your examiner today.", undefined, P.isp_voice); };
    $("#text", root).onchange = (e) => { P.isp_text = e.target.checked; Store.save(); };
    $("#src", root).onclick = (e) => {
      const b = e.target.closest("[data-src]");
      if (!b) return;
      if (b.dataset.src === "ai" && !AI.enabled) return toast("需要先在设置里接入 AI");
      P.isp_src = b.dataset.src;
      Store.save();
      $$("[data-src]", root).forEach((x) => x.classList.toggle("active", x === b));
    };
    const hist = $("#hist", root);
    if (H.length) {
      hist.innerHTML = H.map((h, i) => `<div class="isp-hist"><div class="row"><b>${h.mode === "full" ? "完整模考" : `Part ${h.mode}`}</b><span class="badge">${h.date}</span>
          ${h.band ? `<span class="badge brand">Band ${h.band}</span>` : ""}<span class="small muted">${h.wpm} 词/分 · ${h.words} 词 · ${ispFmt(h.secs)}</span><span class="spacer"></span><button class="btn sm ghost" data-i="${i}">展开</button></div>
          <div class="detail hidden"></div></div>`).join("");
      hist.onclick = (e) => {
        const b = e.target.closest("[data-i]");
        if (!b) return;
        const det = $(".detail", b.closest(".isp-hist"));
        if (det.classList.toggle("hidden")) { b.textContent = "展开"; return; }
        b.textContent = "收起";
        const h = H[+b.dataset.i];
        det.innerHTML = h.items.map((it) => `<div class="isp-ans"><div class="small muted">${esc(it.part)} · ${esc(it.q)}</div><div class="en">${esc(it.text) || `<span class="faint">（没有识别出内容）</span>`}</div></div>`).join("")
          + (h.ai ? this.aiHtml(h.ai) : "");
      };
    }
  },

  // 组一套题：[{ part: 1|2|3, topic, q, intro, card }]
  async build(mode) {
    let p1, card;
    if (Store.prefs.isp_src === "ai" && AI.enabled) {
      const r = await AI.json("You are an experienced IELTS speaking examiner. Write ORIGINAL questions in the style of the real test (never copy published tests).",
        `Create a new IELTS speaking test. Return JSON:
{"p1": [{"t": "topic name", "q": ["question", "question", "question"]}],  // 3 topics: the first is about work/study, hometown or home; then 2 everyday topics; 3-4 questions each
 "p2": {"t": "Describe ...", "b": ["what ...", "when ...", "how ...", "and explain ..."], "p3": ["abstract discussion question", "...", "...", "..."]}}
Use topics that are common in recent IELTS tests but vary them; avoid: ${pick(IELTS_SPEAK.p1).t}, ${pick(IELTS_SPEAK.p2).t}.`);
      if (r.ok && r.data.p1?.length && r.data.p2?.b) { p1 = r.data.p1; card = r.data.p2; }
      else toast(r.ok ? "AI 出的题格式不对，先用题库的题" : r.error, "bad", 4000);
    }
    if (!p1) {
      const others = shuffle([...IELTS_SPEAK.p1]).slice(0, 2);
      p1 = [pick(IELTS_SPEAK.p1First), ...others].map((t, i) => ({ t: t.t, q: i ? t.q.slice(0, 3) : t.q }));
      card = pick(IELTS_SPEAK.p2);
    }
    const items = [];
    if (mode === "full" || mode === "1") p1.forEach((t, i) => t.q.forEach((q, j) => items.push({ part: 1, topic: t.t, q,
      intro: j ? "" : i === 0 ? `In this first part, I'd like to ask you some questions about yourself. Let's talk about ${t.t.toLowerCase()}.` : `Now, let's talk about ${t.t.toLowerCase()}.` })));
    if (mode === "full" || mode === "2") items.push({ part: 2, topic: card.t, q: card.t, card });
    if (mode === "full" || mode === "3") (card.p3 || []).slice(0, 4).forEach((q, j) => items.push({ part: 3, topic: card.t, q,
      intro: j ? "" : mode === "3" ? `Today's topic is: ${card.t}. I'd like to discuss with you some general questions related to this.` : "Thank you. Now, I'd like to discuss with you one or two more general questions related to the topic you've just talked about." }));
    return items;
  },

  async test(root, signal, mode) {
    const P = Store.prefs, V = P.isp_voice || ISP_VOICES[0][0];
    root.innerHTML = `<a class="back-link" href="#/ispeak">‹ 退出模考</a>` + pageHead(`🗣️ ${mode === "full" ? "雅思口语完整模考" : `雅思口语 Part ${mode}`}`, "") + `<div class="card" id="isp"><div class="center muted" style="padding:40px">${P.isp_src === "ai" && AI.enabled ? aiLoading("AI 正在出题……") : "准备题目……"}</div></div>`;
    const box = $("#isp", root);
    const items = await this.build(mode);
    if (signal.aborted) return;
    if (!(await Stt.ready())) { box.innerHTML = `<div class="center muted" style="padding:30px">需要先装好离线语音识别才能考口语</div>`; return; }
    if (!navigator.mediaDevices?.getUserMedia) return micUnavailable();
    if (signal.aborted) return;

    let k = 0, timer = null, sttQ = Promise.resolve(), run = 0;
    const urls = [];
    const say = (text) => TTS.speak(text, undefined, V);
    const ok = () => !signal.aborted;
    // 转写排队进行，不耽误下一题
    const transcribe = (it, rec) => {
      it.secs = rec.seconds;
      urls.push(it.url = URL.createObjectURL(rec.wav()));
      it.done = sttQ = sttQ.then(async () => {
        let r;
        try { r = await pywebview.api.stt_assess(rec.pcm); } catch (e) { r = { ok: false, error: String(e) }; }
        const ws = r.ok ? r.words || [] : [];
        const span = ws.length >= 2 ? ws[ws.length - 1].e - ws[0].s : 0;
        Object.assign(it, { text: r.ok ? r.text.trim() : "", words: ws, n: ws.length, wpm: span > 2 ? Math.round((ws.length / span) * 60) : 0,
          pauses: ws.slice(1).filter((w, j) => w.s - ws[j].e > 1.2).length, unclear: ws.filter((w) => w.p < 0.5).map((w) => w.w.replace(/[^\w']/g, "")).filter(Boolean) });
      });
    };
    const partHead = (it) => `<div class="row isp-top"><span class="badge brand">Part ${it.part}</span><span class="small muted">${esc(it.topic)}</span><span class="spacer"></span><span class="small faint">${k + 1} / ${items.length}</span></div>
      <div class="bar"><i style="width:${(k / items.length) * 100}%"></i></div>`;

    // 录一段回答：Part 1/3 停顿 3–4 秒自动结束；Part 2 只按时间或手动结束
    const record = (it, { silence, max, min = 0 }) => new Promise(async (res) => {
      const my = ++run, t0 = Date.now();
      const finish = async () => {
        if (my !== run || !Mic.active) return;
        run++;
        clearInterval(timer);
        const rec = await Mic.stop();
        if (!ok()) return res(false);
        if (!rec?.heard || rec.seconds < 1.5) return res(null);
        transcribe(it, rec);
        res(true);
      };
      try { await Mic.start({ onSilence: () => finish(), silenceMs: silence, maxMs: max * 1000 }); }
      catch (e) { toast(`打不开麦克风：${e.message || e}`, "bad", 4000); return res(false); }
      if (my !== run) return Mic.cancel();
      const btn = $("#done", box);
      btn.classList.remove("hidden");
      btn.onclick = finish;
      this.finish = finish;
      timer = setInterval(() => {
        const used = (Date.now() - t0) / 1000, c = $("#clock", box);
        if (!c || my !== run) return clearInterval(timer);
        c.textContent = ispFmt(used);
        c.classList.toggle("good-text", min > 0 && used >= min);
        const b = $("#tbar", box);
        if (b) b.style.width = `${Math.min(100, (used / max) * 100)}%`;
      }, 250);
    });

    const ask = async () => {
      if (!ok()) return;
      if (k >= items.length) return this.results(box, signal, mode, items, urls);
      const it = items[k];
      if (it.part === 2) return card(it);
      box.innerHTML = partHead(it) + `<div class="center isp-stage">
          <div class="isp-examiner">🧑‍🏫</div>
          <div class="isp-q en ${P.isp_text ? "" : "blurred"}" id="qtext" title="点一下显示 / 隐藏">${esc(it.q)}</div>
          <div class="small muted" id="hint">考官提问中……</div>
          <div class="isp-clock" id="clock">0:00</div><div class="bar isp-bar"><i id="tbar" style="width:0"></i></div>
          <div class="row mt" style="justify-content:center;gap:8px">
            <button class="btn bad hidden" id="done"><span class="rec-dot"></span> 说完了 <span class="kbd">空格</span></button>
            <button class="btn ghost sm" id="rep">🔁 再问一遍</button><button class="btn ghost sm" id="skip">跳过这题</button></div>
          <div class="small faint mt-s">说完停顿 ${it.part === 1 ? 3 : 4} 秒会自动进入下一题</div></div>`;
      $("#qtext", box).onclick = (e) => e.currentTarget.classList.toggle("blurred");
      $("#rep", box).onclick = () => { run++; Mic.cancel(); clearInterval(timer); ask(); };
      $("#skip", box).onclick = () => { run++; Mic.cancel(); clearInterval(timer); it.skipped = true; k++; ask(); };
      const my = run;
      if (it.intro) await say(it.intro);
      if (!ok() || my !== run) return;
      await say(it.q);
      if (!ok() || my !== run) return;
      $("#hint", box).innerHTML = `<span class="rec-dot"></span> 正在录音，请回答`;
      const r = await record(it, it.part === 1 ? { silence: 3000, max: 45 } : { silence: 4000, max: 90 });
      if (r === false) return;
      if (r === null) { toast("没听到声音，再问一遍", "bad"); return ask(); }
      k++;
      ask();
    };

    const card = async (it) => {
      const c = it.card;
      let prep = 60, my = run;
      box.innerHTML = partHead(it) + `<div class="isp-card-wrap">
          <div class="isp-card"><b class="en">${esc(c.t)}</b><div class="small muted mt-s">You should say:</div>
            <ul class="en">${c.b.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
          <div class="isp-side">
            <div class="small muted" id="hint">考官说明中……</div>
            <div class="isp-clock" id="clock">1:00</div><div class="bar isp-bar"><i id="tbar" style="width:0"></i></div>
            <textarea class="textarea en mt-s" id="notes" rows="5" placeholder="准备时间只记关键词，比如：my uncle / taught me chess / patient / changed how I think"></textarea>
            <div class="row mt-s" style="gap:8px"><button class="btn primary" id="go">我准备好了，开始说</button>
              <button class="btn bad hidden" id="done"><span class="rec-dot"></span> 说完了 <span class="kbd">空格</span></button></div>
            <div class="small faint mt-s" id="tip">说满 1 分钟计时会变绿；2 分钟时自动结束</div></div></div>`;
      const talk = async () => {
        if (my !== run) return;
        run++;
        clearInterval(timer);
        $("#go", box).classList.add("hidden");
        $("#hint", box).textContent = "考官说明中……";
        await say("All right? Remember, you have one to two minutes for this. Don't worry if I stop you. I'll tell you when the time is up. Can you start speaking now, please?");
        if (!ok()) return;
        $("#hint", box).innerHTML = `<span class="rec-dot"></span> 正在录音 · 说满 1 分钟，最多 2 分钟`;
        $("#clock", box).textContent = "0:00";
        const r = await record(it, { silence: 1e9, max: 120, min: 60 });
        if (r === false) return;
        if (r === null) { toast("没听到声音，重新开始这一部分", "bad"); return card(it); }
        if (it.secs >= 119) await say("Thank you.");
        k++;
        ask();
      };
      $("#go", box).onclick = talk;
      await say(`Now, I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. You can make some notes if you wish. Here is your topic. ${c.t}.`);
      if (!ok() || my !== run) return;
      $("#hint", box).textContent = "准备时间：1 分钟（可以在下面记笔记）";
      $("#notes", box).focus();
      const t0 = Date.now();
      timer = setInterval(() => {
        const left = prep - (Date.now() - t0) / 1000, cl = $("#clock", box);
        if (!cl || my !== run) return clearInterval(timer);
        cl.textContent = ispFmt(Math.max(0, left));
        $("#tbar", box).style.width = `${Math.min(100, (1 - left / prep) * 100)}%`;
        if (left <= 0) talk();
      }, 250);
    };

    onKey(signal, (e) => {
      if (e.key !== " " || e.target.closest("textarea, input")) return;
      const d = $("#done", box);
      if (d && !d.classList.contains("hidden")) { e.preventDefault(); this.finish?.(); }
    });
    signal.addEventListener("abort", () => { run++; clearInterval(timer); Mic.cancel(); TTS.stop(); setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 60000); });
    box.innerHTML = `<div class="center isp-stage"><div class="isp-examiner">🧑‍🏫</div>
        <h3>准备好了吗？</h3>
        <p class="muted">一共 ${items.length} 题${items.some((x) => x.part === 2) ? "（含一张 Part 2 话题卡）" : ""}。考官问完会自动开始录音，<br>说完停顿几秒自动进入下一题，也可以按 <span class="kbd">空格</span> 提前结束。</p>
        <p class="small faint">戴耳机效果更好（避免录进考官的声音）。考完后统一识别和打分。</p>
        <button class="btn primary lg" id="start">🎙️ 开始考试</button></div>`;
    $("#start", box).onclick = async () => {
      if (mode === "full" || mode === "1") { await say("Good morning. My name is Alex, and I'll be your examiner today. Can you tell me your full name, please?"); if (!ok()) return; await new Promise((r) => setTimeout(r, 3500)); }
      ask();
    };
  },

  async results(box, signal, mode, items, urls) {
    TTS.stop();
    if (mode === "full" || mode === "3") TTS.speak("Thank you. That is the end of the speaking test.", undefined, Store.prefs.isp_voice);
    box.innerHTML = `<div class="center" style="padding:30px"><div class="isp-clock">⏳</div><div class="muted">正在识别你的回答……（说得越多等得越久）</div></div>`;
    await Promise.all(items.map((it) => it.done));
    if (signal.aborted) return;
    const ans = items.filter((it) => it.text != null);
    const allW = ans.flatMap((it) => it.words || []);
    const secs = ans.reduce((s, it) => s + (it.secs || 0), 0);
    const spoken = ans.reduce((s, it) => s + (it.words?.length >= 2 ? it.words[it.words.length - 1].e - it.words[0].s : 0), 0);
    const wpm = spoken > 0 ? Math.round((allW.length / spoken) * 60) : 0;
    const lex = allW.map((w) => w.w.toLowerCase().replace(/[^a-z']/g, "")).filter(Boolean);
    const uniq = new Set(lex).size, pauses = ans.reduce((s, it) => s + (it.pauses || 0), 0);
    const unclear = [...new Set(ans.flatMap((it) => it.unclear || []))].slice(0, 20);
    const byPart = [1, 2, 3].map((p) => ans.filter((it) => it.part === p)).map((xs) => xs.length ? Math.round(xs.reduce((s, it) => s + (it.n || 0), 0) / xs.length) : 0);
    const p2 = ans.find((it) => it.part === 2);
    const notes = [];
    if (byPart[0] && byPart[0] < 20) notes.push(`Part 1 平均每题只有 ${byPart[0]} 个词，试着每题说 2–3 句：直接回答 + 原因或例子。`);
    if (p2 && p2.secs < 60) notes.push(`Part 2 只说了 ${ispFmt(p2.secs)}，没到 1 分钟会影响流利度分数，按卡片的四个提示逐条展开。`);
    if (byPart[2] && byPart[2] < 35) notes.push(`Part 3 平均每题 ${byPart[2]} 个词，偏短，用「观点 + 原因 + 例子 + 对比」把回答展开。`);
    if (wpm && wpm < 90) notes.push(`语速 ${wpm} 词/分钟偏慢（自然口语约 120–160），可以多做流利度 4/3/2 训练。`);
    if (pauses > ans.length * 1.5) notes.push(`超过 1 秒的停顿有 ${pauses} 次，可以用 Well… / Let me think… / What I mean is… 这类填充语代替沉默。`);
    if (lex.length > 60 && uniq / lex.length < 0.4) notes.push(`用过的不同单词 ${uniq} 个（占 ${Math.round((uniq / lex.length) * 100)}%），重复词偏多，试着换同义表达。`);
    if (!notes.length && ans.length) notes.push("回答长度和语速都不错，接下来注意用词的准确和多样。");

    const rec = { date: today(), mode, wpm, words: allW.length, secs: Math.round(secs), items: ans.map((it) => ({ part: `Part ${it.part}`, q: it.q, text: it.text })) };
    (Store.data.ispeak ||= []).unshift(rec);
    Store.data.ispeak = Store.data.ispeak.slice(0, 30);
    Store.data.stats.speaking++;
    addXP(10);
    Store.save();

    const stat = (v, l) => `<div class="isp-stat"><b>${v}</b><span>${l}</span></div>`;
    box.innerHTML = `<div class="center"><div style="font-size:40px">🎉</div><h3>考完了！</h3></div>
      <div class="isp-stats">${stat(ispFmt(secs), "总时长")}${stat(allW.length, "总词数")}${stat(wpm || "—", "词 / 分钟")}${stat(pauses, "长停顿（>1.2 秒）")}${stat(uniq, "不同单词")}</div>
      <div class="explain mt"><b>📊 自动分析</b><ul class="small">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
        ${unclear.length ? `<div class="small muted">识别得不太确定的词（可能发音不清楚）：${unclear.map((w) => `<span class="en isp-unclear">${esc(w)}</span>${speakBtn(w, "sm")}`).join(" ")}</div>` : ""}</div>
      <div id="ai-box" class="mt">${AI.enabled ? `<div class="card">${aiLoading("AI 考官正在按四项标准评分……")}</div>` : `<div class="small faint">接入 AI 后可以按雅思四项标准估分、改错、给高分版本的回答。</div>`}</div>
      <div class="card-title mt">📝 你的回答 <span class="small faint">（点单词查词，▶ 听自己的录音）</span></div>
      ${items.map((it, i) => `<div class="isp-ans"><div class="row"><span class="badge">Part ${it.part}</span><span class="small en">${esc(it.q)}</span>${speakBtn(it.q, "sm")}<span class="spacer"></span>
          ${it.skipped ? `<span class="small faint">跳过</span>` : `<span class="small muted">${ispFmt(it.secs || 0)} · ${it.n || 0} 词${it.wpm ? ` · ${it.wpm} 词/分` : ""}</span><button class="speak sm" data-mine="${i}" title="听我的录音">▶</button>`}</div>
          ${it.skipped ? "" : `<div class="en isp-text" data-text="${esc(it.text || "")}">${it.text ? this.markUnclear(it) : `<span class="faint">（没有识别出内容）</span>`}</div>`}</div>`).join("")}
      <div class="row mt" style="justify-content:center;gap:8px"><button class="btn primary" id="again">再考一次</button><a class="btn ghost" href="#/ispeak">返回</a></div>`;
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-mine]"); if (b && items[+b.dataset.mine].url) new Audio(items[+b.dataset.mine].url).play(); });
    $("#again", box).onclick = () => Router.render();
    bindWordClicks(box);
    if (AI.enabled && ans.some((it) => it.text)) this.grade(box, signal, items, rec, { wpm, pauses, unclear });
  },

  // 识别置信度低的词标出来（可能是发音不清楚）
  markUnclear(it) {
    if (!it.words?.length) return wrapWords(it.text);
    return it.words.map((w) => {
      const t = w.w.trim(), h = wrapWords(t);
      return w.p < 0.5 ? `<u class="isp-low" title="识别不太确定，可能发音不清楚">${h}</u>` : h;
    }).join(" ");
  },

  async grade(box, signal, items, rec, m) {
    const out = $("#ai-box", box);
    const qa = items.filter((it) => it.text).map((it) => `[Part ${it.part}] Q: ${it.q}\nA (${Math.round(it.secs)}s): ${it.text}`).join("\n\n");
    const r = await AI.json(`You are a certified, strict but encouraging IELTS speaking examiner giving feedback to a Chinese learner. ${LEARNER_PROFILE} Use the official public IELTS Speaking band descriptors. Be realistic: do not inflate scores.`,
      `These are speech-recognition transcripts of the candidate's answers (recognition may drop fillers or mishear a few words; don't penalise obvious recognition errors).
${qa}

Measured: speech rate ${m.wpm} words/min, ${m.pauses} pauses longer than 1.2 s. Words the recogniser was unsure about (possible pronunciation problems): ${m.unclear.join(", ") || "none"}.
Pronunciation can only be estimated from these signals, so say so briefly in its comment.

Return JSON:
{"fc": {"band": 5.5, "comment": "中文，2 句，具体指出表现"}, "lr": {...same}, "gra": {...same}, "p": {...same},
 "summary": "中文总评，2-3 句，先肯定再说最该提升的一点",
 "fixes": [{"wrong": "candidate's exact phrase", "right": "corrected", "why": "中文简短说明"}],  // up to 8 most important grammar / word-choice errors
 "upgrades": [{"q": "the question", "better": "a Band 7 version of the candidate's answer, keeping their ideas, natural spoken English"}],  // for the 3 weakest answers (Part 2 if present should be one of them, max 180 words)
 "phrases": [["useful expression for these topics", "中文"]],  // 5
 "tips": ["中文的具体练习建议", "..."]}  // 3
Bands are 0-9 in steps of 0.5.`);
    if (signal.aborted) return;
    if (!r.ok) { out.innerHTML = `<div class="card">${aiError(r.error)}<button class="btn sm mt-s" id="retry">重试</button></div>`; $("#retry", out).onclick = () => { out.innerHTML = `<div class="card">${aiLoading("AI 考官正在评分……")}</div>`; this.grade(box, signal, items, rec, m); }; return; }
    const d = r.data;
    d.band = ispBand(ISP_CRIT.map(([k]) => +d[k]?.band || 0));
    rec.band = d.band;
    rec.ai = d;
    Store.save();
    out.innerHTML = this.aiHtml(d);
    bindWordClicks(out);
  },

  aiHtml(d) {
    return `<div class="card isp-ai">
      <div class="row"><div class="ib-big">${d.band}</div><div><b>预估总分</b><div class="muted small">${esc(d.summary || "")}</div></div></div>
      <div class="ib-crits">${ISP_CRIT.map(([k, zh, en]) => `<div class="ib-crit"><div class="row"><b>${zh}</b><span class="spacer"></span><span class="ib-band">${d[k]?.band ?? "—"}</span></div>
        <div class="small faint">${en}</div><div class="small muted">${esc(d[k]?.comment || "")}</div></div>`).join("")}</div>
      ${(d.fixes || []).length ? `<div class="card-title mt">🔧 需要改的地方</div>${d.fixes.map((f) => `<div class="correction"><span class="from">${esc(f.wrong)}</span> → <span class="to">${esc(f.right)}</span><div class="small muted">${esc(f.why)}</div></div>`).join("")}` : ""}
      ${(d.upgrades || []).length ? `<div class="card-title mt">✨ Band 7 版本的回答</div>${d.upgrades.map((u) => `<div class="isp-up"><div class="small muted">${esc(u.q)}</div>
        <div class="en" data-text="${esc(u.better)}">${wrapWords(u.better)} ${speakBtn(u.better, "sm")}${shadowBtn(u.better)}</div></div>`).join("")}` : ""}
      ${(d.phrases || []).length ? `<div class="card-title mt">🧩 可以学的表达</div>${d.phrases.map(([en, zh]) => `<div><span class="en">${esc(en)}</span> <span class="small muted">${esc(zh)}</span> ${speakBtn(en, "sm")}</div>`).join("")}` : ""}
      ${(d.tips || []).length ? `<div class="card-title mt">💡 练习建议</div><ul class="small muted">${d.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      <div class="small faint mt-s">AI 估分仅供参考：发音只能根据识别结果间接判断，和真人考官会有出入。</div></div>`;
  },
};
