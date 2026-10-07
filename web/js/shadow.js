// ============================================================
// 跟读评测：听原音 → 跟读录音 → 离线识别打分 → AI 纠音
// 任何页面按 Ctrl+M（或点 🎙️）打开。跟读的内容按顺序找：选中的英文 → 鼠标所在的那一行 → 页面当前在学的词句
// 页面用 App.shadowTarget = () => [{en, zh, ph, label}] 告诉这里「当前在学什么」，返回 null 表示现在不能跟读（比如还没答题）
// 列表页给每一行加 data-shadow-host，行里放 shadowBtn()，鼠标停在哪行按 Ctrl+M 就跟读哪行
// ============================================================

// 跟读按钮：icon=true 是和 🔊 一样的小圆按钮，否则是带文字的按钮
function shadowBtn(en, { zh = "", ph = "", label = "" } = {}, icon = true) {
  const data = `data-shadow="${esc(en)}" data-zh="${esc(zh)}" data-ph="${esc(ph)}" data-label="${esc(label)}"`;
  return icon ? `<button class="speak sm" ${data} title="跟读评测（Ctrl+M）">🎙️</button>`
    : `<button class="btn sm soft" ${data} title="跟读评测（Ctrl+M）">🎯 跟读评测</button>`;
}
const shadowItem = (b) => ({ en: b.dataset.shadow, zh: b.dataset.zh || "", ph: b.dataset.ph || "", label: b.dataset.label || "" });

// ---------- 比对：识别出来的词和原文逐词对齐 ----------
const PRON_CONTRACT = {
  "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "he's": "he is", "she's": "she is", "it's": "it is",
  "that's": "that is", "there's": "there is", "what's": "what is", "where's": "where is", "who's": "who is", "how's": "how is", "let's": "let us",
  "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have",
  "i'll": "i will", "you'll": "you will", "he'll": "he will", "she'll": "she will", "we'll": "we will", "they'll": "they will", "it'll": "it will",
  "i'd": "i would", "you'd": "you would", "he'd": "he would", "she'd": "she would", "we'd": "we would", "they'd": "they would",
  "can't": "can not", "cannot": "can not", "won't": "will not", "don't": "do not", "doesn't": "does not", "didn't": "did not",
  "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not", "haven't": "have not", "hasn't": "has not",
  "hadn't": "had not", "wouldn't": "would not", "shouldn't": "should not", "couldn't": "could not", "mustn't": "must not",
  "gonna": "going to", "wanna": "want to", "ok": "okay", "mr": "mister", "mrs": "missus", "dr": "doctor",
};
const NUM_WORDS = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
// 识别器会把 twenty 写成 20、把 I am 写成 I'm，两边都规范成同一种写法再比
function pronNorm(w) {
  const out = [];
  for (let t of w.toLowerCase().replace(/[’‘`]/g, "'").replace(/%/g, " percent").replace(/&/g, " and ").split(/[\s-]+/)) {
    t = t.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
    if (!t) continue;
    if (PRON_CONTRACT[t]) out.push(...PRON_CONTRACT[t].split(" "));
    else if (/^\d+$/.test(t) && +t < 100) {
      const n = +t;
      out.push(...(n < 20 ? [NUM_WORDS[n]] : [TENS_WORDS[Math.floor(n / 10)], ...(n % 10 ? [NUM_WORDS[n % 10]] : [])]));
    } else out.push(t);
  }
  return out;
}

// 返回原文每个词的情况：good 清楚 / weak 不太清楚 / bad 没听清或听成了别的词 / miss 漏读
function alignPron(target, heard) {
  const disp = target.split(/\s+/).filter((w) => pronNorm(w).length);
  const T = [], H = [];
  disp.forEach((w, d) => pronNorm(w).forEach((n) => T.push({ n, d })));
  heard.forEach((x) => pronNorm(x.w).forEach((n) => H.push({ n, p: x.p, raw: x.w })));
  const { hitT, hitI } = lcsMatch(T.map((x) => x.n), H.map((x) => x.n));
  // 依次走一遍：两个匹配点之间，原文没对上的词和识别出的多余词配对成「听成了」
  const res = T.map(() => ({ ok: false, p: 0, heard: "" }));
  const extra = [];
  let i = 0, j = 0;
  while (i < T.length || j < H.length) {
    const ms = [], es = [];
    while (i < T.length && !hitT[i]) ms.push(i++);
    while (j < H.length && !hitI[j]) es.push(j++);
    ms.forEach((ti, k) => {
      const mine = k < ms.length - 1 ? es.slice(k, k + 1) : es.slice(k); // 最后一个漏掉的词收下剩余的识别词
      res[ti].heard = mine.map((hj) => H[hj].raw).join(" ");
    });
    if (!ms.length) extra.push(...es.map((hj) => H[hj].raw));
    if (i < T.length && j < H.length) { res[i] = { ok: true, p: H[j].p, heard: "" }; i++; j++; }
  }
  const words = disp.map((w, d) => {
    const parts = res.filter((_, k) => T[k].d === d);
    const heardAs = parts.map((x) => x.heard).filter(Boolean).join(" ").replace(/^[^\w']+|[^\w']+$/g, "");
    if (parts.every((x) => x.ok)) {
      const p = Math.min(...parts.map((x) => x.p));
      return { w, p, state: p >= 0.7 ? "good" : p >= 0.4 ? "weak" : "bad" };
    }
    if (parts.some((x) => x.ok) || heardAs) return { w, p: 0, state: "bad", heard: heardAs };
    return { w, p: 0, state: "miss" };
  });
  // 单词得分：听清楚了 60~100（看识别把握），听成别的词 25，漏读 0；多说的词每个扣 5 分（最多 15）
  const pts = words.map((x) => (x.state === "miss" ? 0 : x.p ? 60 + 40 * Math.min(1, Math.max(0, (x.p - 0.3) / 0.6)) : 25));
  const avg = pts.length ? pts.reduce((a, b) => a + b, 0) / pts.length : 0;
  const score = Math.round(Math.max(0, Math.min(100, avg - Math.min(15, extra.length * 5))));
  return { words, extra, score };
}

// 中国学习者常见的发音问题：根据「原文词 → 听成的词」猜一下原因（没开 AI 时用）
function pronTip(target, heard) {
  const t = target.toLowerCase().replace(/[^a-z']/g, ""), h = (heard || "").toLowerCase().replace(/[^a-z' ]/g, "");
  if (!h) return "这个词没被听到，可能漏读了或者声音太轻。";
  if (t.includes("th") && !h.includes("th")) return "th 要把舌尖轻轻放在上下牙之间送气（think /θ/、this /ð/），不要发成 s / z / f / d。";
  if (t[0] === "v" && h[0] === "w") return "v 是上牙轻咬下唇振动发音，w 是双唇收圆，不要把 v 发成 w。";
  if (t[0] === "w" && h[0] === "v") return "w 双唇收圆向前突出，牙齿不要碰嘴唇。";
  if (t[0] === "n" && h[0] === "l") return "n 是鼻音，气流从鼻子出来，注意和 l 区分。";
  if (t[0] === "l" && h[0] === "n") return "l 舌尖抵住上齿龈，气流从舌头两侧出来，不是鼻音 n。";
  if (t[0] === "r" && h[0] === "l") return "r 舌尖向上卷但不碰上颚，嘴唇稍微收圆，不要发成 l。";
  if (h.length < t.length && t.startsWith(h.replace(/ /g, ""))) return "词尾的辅音没读出来，比如 -s / -ed / -t / -d，结尾要轻轻带出来。";
  return "听起来像别的词，点 🔊 和 🐢 多听几遍原音，注意元音的长短和重音位置。";
}

// ---------- 面板 ----------
const Shadow = {
  isOpen: false,
  run: 0,

  // 按 Ctrl+M 或点「跟读当前」时：选中的英文 → 鼠标所在的行 → 页面登记的当前内容
  openFor() {
    const sel = window.getSelection()?.toString().replace(/\s+/g, " ").trim();
    if (sel && sel.length <= 300 && /[A-Za-z]/.test(sel) && !/[　-鿿＀-￯]/.test(sel)) return this.open([{ en: sel }]);
    const host = this.hover?.isConnected && this.hover;
    if (host) {
      const items = $$("[data-shadow]", host).map(shadowItem);
      if (items.length) return this.open(items);
    }
    const items = App.shadowTarget?.();
    if (items?.length) return this.open(items);
    toast(App.shadowTarget ? "现在还没有可以跟读的句子（做题时要先答完；也可以选中一段英文再按 Ctrl+M）" : "选中一段英文，或者把鼠标移到要读的那一行，再按 Ctrl+M", "", 3500);
  },

  open(items, idx = 0) {
    if (this.isOpen) return;
    closePopups();
    this.isOpen = true;
    const P = Store.prefs, ctl = new AbortController();
    const prevFocus = document.activeElement;
    prevFocus?.blur?.();
    let it = items[idx], state = "idle", rec = null, wavUrl = "", result = null, msg = "";

    const m = modal(`<div class="sh">
        <div class="row"><h3 style="margin:0">🎯 跟读评测</h3><span class="spacer"></span>
          <button class="btn sm ghost" data-close title="关闭（Esc）">✕</button></div>
        ${items.length > 1 ? `<div class="chips sh-pick" id="sh-pick">${items.map((x, i) => `<button class="chip ${i === idx ? "active" : ""}" data-i="${i}" title="按数字键 ${i + 1} 切换">${esc(x.label || `第 ${i + 1} 句`)}</button>`).join("")}</div>` : ""}
        <div class="sh-target" id="sh-target"></div>
        <div class="sh-mic-row">
          <button class="btn ghost" id="sh-orig" title="听原音（Tab，Shift+Tab 慢速）">🔊 原音</button>
          <button class="sh-mic" id="sh-mic"><span class="sh-ring" id="sh-ring"></span><span id="sh-mic-ico">🎙️</span></button>
          <button class="btn ghost" id="sh-mine" title="听我的录音（P）" disabled>▶ 我的</button>
        </div>
        <div class="sh-state" id="sh-state"></div>
        <div id="sh-result"></div>
        <div class="row sh-foot">
          <label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="sh-first" ${P.shadow_listen !== false ? "checked" : ""}> 先听一遍原音再录</label>
          <span class="spacer"></span><span class="kbd-hint" style="margin:0">空格 / Ctrl+M 开始·停止 · Tab 原音 · P 我的 · C 对比 · Esc 关闭</span>
        </div></div>`, {
      onClose: () => {
        this.run++;
        this.isOpen = false;
        ctl.abort();
        Mic.cancel();
        TTS.stop();
        if (wavUrl) URL.revokeObjectURL(wavUrl);
        if (prevFocus?.isConnected) prevFocus.focus?.();
      },
    });
    m.root.querySelector(".modal").classList.add("sh-modal");
    const q = (s) => $(s, m.root);

    const best = () => (Store.data.pron ||= {})[selNorm(it.en)];
    const drawTarget = () => {
      const b = best();
      q("#sh-target").innerHTML = `<div class="sh-en ${it.en.split(" ").length > 3 ? "long" : ""}">${esc(it.en)}</div>
        ${it.ph ? `<div class="sh-ph">${esc(it.ph)}</div>` : ""}${it.zh ? `<div class="sh-zh">${esc(it.zh)}</div>` : ""}
        ${b ? `<div class="small faint mt-s">练过 ${b.n} 次 · 上次 ${b.last} 分 · 最好 ${b.best} 分</div>` : ""}`;
    };
    const drawState = () => {
      q("#sh-mic").classList.toggle("on", state === "rec");
      q("#sh-mic").disabled = state === "busy";
      q("#sh-mic-ico").textContent = state === "rec" ? "⏹" : state === "busy" ? "⏳" : "🎙️";
      q("#sh-mine").disabled = !wavUrl;
      q("#sh-state").innerHTML = {
        idle: msg || "按 <span class=\"kbd\">空格</span> 或点话筒开始跟读",
        listen: "🔊 先听原音…（按空格跳过）",
        rec: `<span class="rec-dot"></span> 正在录音，读完停一下会自动结束`,
        busy: "正在识别…",
        done: msg || "按空格再读一次",
      }[state];
    };

    const beep = () => new Promise((res) => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)(), o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.13);
        o.onended = () => { ctx.close(); res(); };
      } catch { res(); }
    });

    const start = async () => {
      const my = ++this.run;
      if (!(await Stt.ready()) || my !== this.run) return;
      if (!navigator.mediaDevices?.getUserMedia) return micUnavailable();
      TTS.stop();
      if (P.shadow_listen !== false) {
        state = "listen"; drawState();
        await TTS.speak(it.en);
        if (my !== this.run) return;
      }
      await beep();
      if (my !== this.run) return;
      const n = it.en.split(/\s+/).length;
      try {
        await Mic.start({
          onLevel: (v) => { q("#sh-ring").style.transform = `scale(${1 + Math.min(0.7, v * 9)})`; },
          onSilence: () => finish(my),
          silenceMs: n > 3 ? 1500 : 1100,
          maxMs: Math.min(30000, 4000 + n * 900),
        });
      } catch (e) {
        state = "idle"; msg = ""; drawState();
        toast(`打不开麦克风：${e.message || e}`, "bad", 4000);
        return;
      }
      state = "rec"; drawState();
    };

    const finish = async (my) => {
      if (my !== this.run || state !== "rec") return;
      state = "busy"; drawState();
      rec = await Mic.stop();
      q("#sh-ring").style.transform = "";
      if (my !== this.run) return;
      if (!rec || !rec.heard || rec.seconds < 0.4) { state = "idle"; msg = "没听到声音，检查一下麦克风，再按空格试一次"; drawState(); return; }
      if (wavUrl) URL.revokeObjectURL(wavUrl);
      wavUrl = URL.createObjectURL(rec.wav());
      let r;
      try { r = await pywebview.api.stt_assess(rec.pcm); } catch (e) { r = { ok: false, error: String(e) }; }
      if (my !== this.run) return;
      if (!r.ok) { state = "idle"; msg = ""; drawState(); toast(r.error, "bad", 4000); return; }
      result = { ...alignPron(it.en, r.words || []), text: r.text, raw: r.words || [] };
      // 语速和停顿：只看句子
      const ws = result.raw;
      if (ws.length >= 2) {
        result.secs = Math.max(0.1, ws[ws.length - 1].e - ws[0].s);
        result.pauses = ws.slice(1).filter((x, k) => x.s - ws[k].e > 0.6).length;
      }
      const key = selNorm(it.en), old = (Store.data.pron ||= {})[key];
      Store.data.pron[key] = { best: Math.max(result.score, old?.best || 0), last: result.score, n: (old?.n || 0) + 1, date: today(), t: Date.now() };
      Store.data.stats.speaking++;
      addXP(result.score >= 80 ? 3 : 2);
      state = "done"; msg = ""; drawState(); drawTarget();
      drawResult();
      feedback(my);
    };

    const toggle = () => {
      if (state === "rec") finish(this.run);
      else if (state === "listen") TTS.stop(); // 跳过原音，直接开始录
      else if (state !== "busy") start();
    };

    const scoreWord = (s) => (s >= 90 ? "发音很棒！" : s >= 75 ? "不错，大部分都很清楚" : s >= 60 ? "还可以，有几个词要再练练" : "再练练，先多听几遍原音");
    const drawResult = () => {
      const r = result, cls = r.score >= 80 ? "good" : r.score >= 60 ? "warn" : "bad";
      const wordsHtml = r.words.map((x) => `<span class="sh-w ${x.state}" data-say="${esc(x.w.replace(/^[^\w']+|[^\w']+$/g, ""))}" title="${
        x.state === "good" ? "很清楚" : x.state === "weak" ? "不太清楚" : x.state === "miss" ? "没读出来" : x.heard ? `听起来像「${x.heard}」` : "没听清"}（点一下听原音）">${esc(x.w)}</span>`).join(" ");
      const n = r.words.length;
      const pace = r.secs && n >= 4 ? Math.round((n / r.secs) * 60) : 0;
      q("#sh-result").innerHTML = `<div class="sh-res">
          <div class="sh-score ${cls}"><b>${r.score}</b><span>分</span></div>
          <div style="flex:1;min-width:0">
            <div class="sh-verdict">${scoreWord(r.score)}</div>
            <div class="sh-words">${wordsHtml}</div>
            <div class="small muted mt-s">识别到：<span class="en">${esc(r.text || "（没有识别出内容）")}</span></div>
            <div class="small faint">${[
              r.extra.length ? `多读了：${esc(r.extra.join(" "))}` : "",
              pace ? `语速约 ${pace} 词/分钟${pace < 80 ? "（偏慢，试着连贯一点）" : pace > 210 ? "（有点快）" : ""}` : "",
              r.pauses ? `中间停顿 ${r.pauses} 次` : "",
            ].filter(Boolean).join(" · ")}</div>
          </div></div>
        <div class="sh-legend small faint"><span class="sh-w good">清楚</span><span class="sh-w weak">不太清楚</span><span class="sh-w bad">没听清</span><span class="sh-w miss">漏读</span> 点词可以听原音
          <details class="sh-about"><summary>这个分数是怎么算的？</summary>离线语音识别（Whisper）把你的录音转成文字，看每个词有没有被认出来、认得有多确定，再加上语速和停顿。它反映的是「别人能不能听懂你」，<b>不是</b>逐个音素的发音打分：读成了相近的音、重音或语调不对，有时也会被判为清楚。开了 AI 时，AI 会再根据识别结果指出可能读错的音。</details></div>
        <div id="sh-ai"></div>`;
    };

    // 纠音建议：开了 AI 让 AI 讲，没开就用内置的常见问题提示
    const feedback = async (my) => {
      const box = q("#sh-ai"), r = result;
      const probs = r.words.filter((x) => x.state !== "good");
      const ipaOf = (w) => lookupWord(w)?.ph || "";
      if (!AI.enabled) {
        box.innerHTML = probs.length ? `<div class="explain">${probs.slice(0, 4).map((x) => {
          const w = x.w.replace(/^[^\w']+|[^\w']+$/g, "");
          return `<div class="sh-issue"><b class="en">${esc(w)}</b> <span class="faint">${esc(ipaOf(w))}</span> ${speakBtn(w, "sm")}<button class="speak sm" data-say="${esc(w)}" data-rate="0.6" title="慢速">🐢</button>
            <div class="small">${x.state === "weak" ? "读得不太清楚，再把这个词读饱满一点。" : esc(pronTip(w, x.heard))}</div></div>`;
        }).join("")}<div class="small faint mt-s">开启 AI 后可以得到更具体的纠音建议。</div></div>`
          : `<div class="explain good">每个词都听得很清楚 👍 接下来可以模仿原音的语调和节奏，读得更自然。</div>`;
        return;
      }
      box.innerHTML = `<div class="explain"><span class="muted">🤖 AI 正在分析你的发音…</span></div>`;
      const align = r.words.map((x) => `- ${x.w} → ${x.state === "miss" ? "(not heard)" : x.heard ? `heard as "${x.heard}"` : "matched"}${x.p ? ` (confidence ${x.p.toFixed(2)})` : ""}`).join("\n");
      const res = await AI.json(`You are a warm but precise English pronunciation coach for Chinese learners. ${LEARNER_PROFILE}`,
        `The learner read this text aloud: "${it.en}"${it.ph ? ` (IPA: ${it.ph})` : ""}
An offline speech recognizer (Whisper) transcribed the recording as: "${r.text}"
Word-by-word alignment (target word → result, recognizer confidence 0-1):
${align}
${r.extra.length ? `Extra words heard: ${r.extra.join(" ")}\n` : ""}${r.secs ? `Speaking time: ${r.secs.toFixed(1)} s for ${r.words.length} words, ${r.pauses || 0} pauses longer than 0.6 s.\n` : ""}
The recognizer cannot hear phonemes directly: a word heard as a different word, or with confidence below about 0.6, was probably pronounced unclearly. Infer the most likely cause from what it was heard as and from typical problems of Chinese speakers (th, v/w, l/n, r/l, dropped final consonants, added vowels after final consonants, short/long vowels, word stress). Numbers written as digits, contractions and spelling variants are not errors. If everything matched with high confidence, praise briefly and give at most one tip about stress, linking or intonation for this text.
Return JSON: {"summary": "一句中文总评，鼓励为主，不超过40字", "issues": [{"word": "target word", "ipa": "American IPA of the word, like /θɪŋk/", "problem": "中文：可能哪里读得不对", "fix": "中文：具体怎么改（舌位、嘴型、对比词）"}], "tips": ["中文：这句话的连读、重音、语调或节奏提示"]}
At most 4 issues (most important first, empty list if none) and at most 2 tips.`);
      if (my !== this.run || !box.isConnected) return;
      if (!res.ok) { box.innerHTML = `<div class="explain bad">AI 分析失败：${esc(res.error)} <button class="btn sm ghost" id="sh-retry">重试</button></div>`; q("#sh-retry").onclick = () => feedback(my); return; }
      const d = res.data;
      box.innerHTML = `<div class="explain">
        <div><b>🤖 ${esc(d.summary || "")}</b></div>
        ${(d.issues || []).map((x) => `<div class="sh-issue"><b class="en">${esc(x.word)}</b> <span class="faint">${esc(x.ipa || ipaOf(x.word))}</span> ${speakBtn(x.word || "", "sm")}<button class="speak sm" data-say="${esc(x.word || "")}" data-rate="0.6" title="慢速">🐢</button>
          <div class="small">${esc(x.problem || "")}</div><div class="small"><b>怎么改：</b>${esc(x.fix || "")}</div></div>`).join("")}
        ${(d.tips || []).length ? `<ul class="small mt-s">${d.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}</div>`;
    };

    const playMine = () => { if (wavUrl) { TTS.stop(); new Audio(wavUrl).play(); } };
    const compare = async () => {
      if (!wavUrl || state === "rec" || state === "busy") return;
      const my = this.run;
      await TTS.speak(it.en);
      if (my === this.run && this.isOpen) playMine();
    };
    const pickItem = (i) => {
      if (state === "rec" || state === "busy") return;
      this.run++;
      TTS.stop();
      it = items[i];
      state = "idle"; msg = ""; result = null;
      if (wavUrl) { URL.revokeObjectURL(wavUrl); wavUrl = ""; }
      $$("#sh-pick .chip", m.root).forEach((c) => c.classList.toggle("active", +c.dataset.i === i));
      q("#sh-result").innerHTML = "";
      drawTarget(); drawState();
    };

    q("#sh-mic").onclick = toggle;
    q("#sh-orig").onclick = () => { if (state !== "rec") TTS.speak(it.en); };
    q("#sh-mine").onclick = playMine;
    q("#sh-first").onchange = (e) => { P.shadow_listen = e.target.checked; Store.save(); };
    const pick = q("#sh-pick");
    if (pick) pick.onclick = (e) => { const c = e.target.closest("[data-i]"); if (c) pickItem(+c.dataset.i); };
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || e.target.closest?.("input:not([type=checkbox]), textarea, select")) return;
      e.stopPropagation(); // 面板开着时，页面自己的快捷键（打字、翻卡片等）都不响应
      const k = e.key.toLowerCase();
      if (e.key === " " || ((e.ctrlKey || e.metaKey) && (k === "m" || e.code === "KeyM"))) { e.preventDefault(); toggle(); }
      else if (e.key === "Tab") { e.preventDefault(); if (state !== "rec") TTS.speak(it.en, e.shiftKey ? 0.6 : undefined); }
      else if (e.ctrlKey || e.metaKey || e.altKey) return;
      else if (k === "p") playMine();
      else if (k === "c") compare();
      else if (/^[1-9]$/.test(k) && items[+k - 1]) pickItem(+k - 1);
    }, { signal: ctl.signal, capture: true });

    window.addEventListener("hashchange", () => m.close(), { signal: ctl.signal });
    drawTarget(); drawState();
    start();
  },
};

// 点 🎙️ 按钮跟读这一句；data-shadow-cur 表示跟读页面当前在学的内容
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-shadow], [data-shadow-cur]");
  if (!b || !Store.data) return;
  e.stopPropagation();
  if (b.hasAttribute("data-shadow-cur")) return Shadow.openFor();
  // 一行里有好几个（比如单词 + 例句）时都放进面板，从点的那个开始
  const host = b.closest("[data-shadow-host]");
  const list = host ? $$("[data-shadow]", host) : [b];
  Shadow.open(list.map(shadowItem), Math.max(0, list.indexOf(b)));
});
// 记住鼠标停在哪一行，按 Ctrl+M 时跟读这一行
document.addEventListener("mouseover", (e) => {
  const h = e.target.closest?.("[data-shadow-host]");
  if (h) Shadow.hover = h;
  else if (e.target.closest?.("#view")) Shadow.hover = null;
});
document.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || !Store.data || Shadow.isOpen) return;
  if (e.key.toLowerCase() !== "m" && e.code !== "KeyM") return;
  e.preventDefault();
  if ($(".modal-mask")) return;
  Shadow.openFor();
});
