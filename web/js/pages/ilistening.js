// 雅思听力训练：
// ① Section 1 专项：名字拼写、电话号码、日期、价格、时间、邮编、门牌地址——雅思听力第一部分最常考的「听写信息」，离线随机生成，英音澳音美音轮流读
// ② 179 考点词听写：听雅思听力最常考的词（和它们的同义替换），拼出来
// ③ AI 模拟套题：按雅思格式生成 Section 1–4（表格填空、独白、讨论选择题、讲座笔记），几个人用不同口音读，可以只听一遍，交卷看原文和答案位置
// 路由：#/ilisten · #/ilisten/drill · #/ilisten/l179 · #/ilisten/mock/<1-4>
const IL_VOICES = [
  ["en-GB-SoniaNeural", "英音 · 女"], ["en-GB-RyanNeural", "英音 · 男"], ["en-GB-LibbyNeural", "英音 · 女"],
  ["en-AU-NatashaNeural", "澳音 · 女"], ["en-US-JennyNeural", "美音 · 女"], ["en-US-GuyNeural", "美音 · 男"],
];
const IL_SURNAMES = "Henderson Whitfield Thompson Fairbanks Gallagher Pemberton Ashworth Kingsley Lancaster Mortimer Rowntree Sinclair Treadwell Underhill Wainwright Yardley Bellamy Carmichael Davenport Ellingham Fitzgerald Hollis Jarvis Kettering Lockwood Merriweather Norbury Oakley Prescott Quinlan Radcliffe Stanhope Thornbury Vaughan Westbrook Abbott Barraclough Copeland Dalrymple Hargreaves".split(" ");
const IL_STREETS = "Elm Grove|Station Road|Mill Lane|Church Street|Harbour View|Kingsway|Oakfield Avenue|Riverside Drive|Beechwood Close|Market Square|Hillcrest Road|Victoria Terrace|Primrose Lane|Westgate|Abbey Road".split("|");
const IL_MONTHS = "January February March April May June July August September October November December".split(" ");
const IL_NUM = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const IL_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const ilWords = (n) => n < 20 ? IL_NUM[n] : n < 100 ? IL_TENS[Math.floor(n / 10)] + (n % 10 ? "-" + IL_NUM[n % 10] : "")
  : n < 1000 ? `${IL_NUM[Math.floor(n / 100)]} hundred${n % 100 ? " and " + ilWords(n % 100) : ""}`
  : `${ilWords(Math.floor(n / 1000))} thousand${n % 1000 ? (n % 1000 < 100 ? " and " : " ") + ilWords(n % 1000) : ""}`;
const ilOrd = (n) => ({ 1: "first", 2: "second", 3: "third", 5: "fifth", 8: "eighth", 9: "ninth", 12: "twelfth", 20: "twentieth", 30: "thirtieth" }[n]
  || (n > 20 && n % 10 ? `${IL_TENS[Math.floor(n / 10)]}-${ilOrd(n % 10)}` : ilWords(n) + "th"));
// 读数字串：英国人习惯把 0 读成 oh，两个相同的数字读成 double
function ilDigits(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const d = s[i];
    if (d === " ") { out.push(","); continue; }
    if (s[i + 1] === d && s[i + 2] !== d) { out.push(`double ${d === "0" ? "oh" : IL_NUM[+d]}`); i++; continue; }
    out.push(d === "0" ? "oh" : IL_NUM[+d]);
  }
  return out.join(" ").replace(/ ,/g, ",");
}
// 拼读字母：H, E, double N...
function ilSpell(w) {
  const L = w.toUpperCase().split(""), out = [];
  for (let i = 0; i < L.length; i++) {
    if (L[i + 1] === L[i]) { out.push(`double ${L[i]}`); i++; } else out.push(L[i]);
  }
  return out.join(", ");
}
const ilR = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// 随机出一道 Section 1 专项题：{ kind, ask(题目说明), say(读出来的话), answer(标准答案), check(用户输入) }
const IL_DRILLS = {
  name: () => {
    const n = pick(IL_SURNAMES);
    return { kind: "姓名拼写", ask: "写出这个人的姓（Surname）", say: `${pick(["My surname is", "The name's", "It's under the name"])} ${n}. That's ${ilSpell(n)}.`, answer: n, check: (v) => v.trim().toLowerCase() === n.toLowerCase() };
  },
  phone: () => {
    const d = `07${ilR(100, 999)} ${ilR(100, 999)} ${ilR(100, 999)}`;
    return { kind: "电话号码", ask: "写出电话号码（只写数字）", say: `${pick(["My mobile number is", "You can reach me on", "The number is"])} ${ilDigits(d)}.`, answer: d, check: (v) => v.replace(/\D/g, "") === d.replace(/\D/g, "") };
  },
  date: () => {
    const day = ilR(1, 28), m = pick(IL_MONTHS);
    return { kind: "日期", ask: "写出日期（比如 23 March）", say: `${pick(["The course starts on", "I'd like to book it for", "The deadline is"])} the ${ilOrd(day)} of ${m}.`, answer: `${day} ${m}`,
      check: (v) => { const s = v.toLowerCase(); return new RegExp(`\\b${day}(st|nd|rd|th)?\\b`).test(s) && s.includes(m.toLowerCase().slice(0, 3)); } };
  },
  price: () => {
    const p = ilR(3, 180), c = pick([0, 25, 50, 75, 99, 95]);
    const said = `${ilWords(p)} pounds${c ? " " + ilWords(c) : ""}`;
    return { kind: "价格", ask: "写出价格（比如 14.50）", say: `${pick(["That comes to", "It costs", "The fee is"])} ${said}.`, answer: `£${p}${c ? "." + String(c).padStart(2, "0") : ""}`,
      check: (v) => { const x = parseFloat(v.replace(/[^\d.]/g, "")); return Math.abs(x - (p + c / 100)) < 0.001; } };
  },
  time: () => {
    const pm = Math.random() < 0.5, h = pm ? ilR(1, 9) : ilR(7, 11), m = pick([0, 15, 30, 45, 10, 20, 40, 50]);
    const said = m === 0 ? `${ilWords(h)} o'clock` : m === 15 ? `quarter past ${ilWords(h)}` : m === 30 ? `half past ${ilWords(h)}` : m === 45 ? `quarter to ${ilWords(h % 12 + 1)}` : `${ilWords(h)} ${ilWords(m)}`;
    const H = (h % 12) + (pm ? 12 : 0);
    return { kind: "时间", ask: "写出时间（比如 7:45 或 7.45 pm）", say: `${pick(["We'll meet at", "The bus leaves at", "Doors open at"])} ${said} ${pm ? (h < 6 ? "in the afternoon" : "in the evening") : "in the morning"}.`, answer: `${h}:${String(m).padStart(2, "0")} ${pm ? "pm" : "am"}`,
      check: (v) => { const t = v.toLowerCase().match(/(\d{1,2})\s*[:.]\s*(\d{2})|(\d{1,2})\s*(am|pm|o'?clock)/); if (!t) return false; const hh = +(t[1] || t[3]), mm = +(t[2] || 0); return mm === m && (hh % 12 === h % 12 || hh === H); } };
  },
  postcode: () => {
    const A = "ABCDEGHKLMNPRSTW", a = () => A[ilR(0, A.length - 1)];
    const pc = `${a()}${a()}${ilR(1, 19)} ${ilR(1, 9)}${a()}${a()}`;
    const sayPc = pc.split("").map((c) => (c === " " ? "," : /\d/.test(c) ? IL_NUM[+c] : c)).join(" ").replace(/ ,/g, ",");
    return { kind: "邮编", ask: "写出英国邮编", say: `${pick(["The postcode is", "And the postcode, that's"])} ${sayPc}.`, answer: pc, check: (v) => v.replace(/\s/g, "").toUpperCase() === pc.replace(/\s/g, "") };
  },
  address: () => {
    const no = ilR(2, 160), st = pick(IL_STREETS);
    return { kind: "地址", ask: "写出地址（门牌号 + 街道名）", say: `${pick(["I live at", "The office is at", "Send it to"])} ${ilWords(no)} ${st}.`, answer: `${no} ${st}`,
      check: (v) => { const s = v.toLowerCase().replace(/\s+/g, " "); return s.includes(String(no)) && s.includes(st.toLowerCase().split(" ")[0]); } };
  },
};

App.pages.ilisten = {
  render(root, params, signal) {
    if (params[0] === "drill") return this.drill(root, signal, params[1]);
    if (params[0] === "l179") return this.l179(root, signal);
    if (params[0] === "mock") return this.mock(root, signal, +params[1] || 1);
    this.home(root);
  },

  home(root) {
    const R = Store.data.ilisten || {};
    root.innerHTML = `<a class="back-link" href="#/ielts">‹ 返回雅思</a>` + pageHead("🎧 雅思听力训练", "雅思听力只放一遍、要求拼写正确。先把最常考的信息练熟，再做整段模拟") + `
      <div class="grid grid-3">
        <a class="card sp-course" href="#/ilisten/drill"><div class="sp-ico">🔢</div><b>Section 1 专项</b>
          <div class="small muted">名字拼写、电话号码（double six、oh）、日期、价格、时间、邮编、地址。英音、澳音、美音轮流读，不用联网 AI</div>
          <div class="small faint mt-s">${R.drill ? `练过 ${R.drill.n} 题 · 正确率 ${Math.round((R.drill.ok / R.drill.n) * 100)}%` : "还没练过"}</div></a>
        <a class="card sp-course" href="#/ilisten/l179"><div class="sp-ico">🎯</div><b>179 考点词听写</b>
          <div class="small muted">雅思听力最常考的词和它们的同义替换：听到就要会拼，拼错一个字母就不得分</div>
          <div class="small faint mt-s">${R.l179 ? `练过 ${R.l179.n} 个 · 正确率 ${Math.round((R.l179.ok / R.l179.n) * 100)}%` : "还没练过"}</div></a>
        <div class="card sp-course"><div class="sp-ico">🤖</div><b>AI 模拟套题</b>
          <div class="small muted">按雅思格式生成一段原创听力：几个人用不同口音读，边听边做题，交卷看原文和答案出处</div>
          <div class="row mt-s" style="gap:6px;flex-wrap:wrap">${[1, 2, 3, 4].map((n) => `<a class="btn sm ${AI.enabled ? "soft" : "ghost"}" href="#/ilisten/mock/${n}">Section ${n}</a>`).join("")}</div>
          ${AI.enabled ? "" : `<div class="small faint mt-s">需要先在设置里接入 AI</div>`}</div>
      </div>
      <div class="card mt"><div class="card-title">📌 四个部分考什么</div>
        <div class="link-table-wrap"><table class="link-table"><thead><tr><th></th><th>场景</th><th>常见题型</th><th>要点</th></tr></thead><tbody>
          <tr><td><b>Section 1</b></td><td>日常对话（订房、报名、租车）</td><td>表格 / 笔记填空</td><td>名字拼写、数字、日期、地址，最容易拿分也最容易因为拼写丢分</td></tr>
          <tr><td><b>Section 2</b></td><td>日常独白（导游介绍、活动安排）</td><td>选择、地图题、配对</td><td>注意方位词（opposite、next to、on the left）和顺序</td></tr>
          <tr><td><b>Section 3</b></td><td>学术讨论（学生和老师讨论作业）</td><td>选择、配对</td><td>同义替换最多，听到原词的选项往往是干扰项</td></tr>
          <tr><td><b>Section 4</b></td><td>学术讲座</td><td>笔记 / 摘要填空</td><td>没有中间停顿，按笔记的结构预判下一个空</td></tr>
        </tbody></table></div>
        <div class="small muted mt-s">有正版的剑桥雅思音频的话，可以用「影视精听 → 打开本地视频」逐句精听（支持 mp3 和字幕）。</div></div>`;
  },

  stat(key, ok) {
    const R = (Store.data.ilisten ||= {}), s = (R[key] ||= { n: 0, ok: 0 });
    s.n++;
    if (ok) s.ok++;
    Store.save();
  },

  // ---------- Section 1 专项 ----------
  drill(root, signal, only) {
    const kinds = Object.keys(IL_DRILLS);
    const NAMES = { name: "姓名拼写", phone: "电话号码", date: "日期", price: "价格", time: "时间", postcode: "邮编", address: "地址" };
    const N = 10;
    let i = 0, right = 0, cur, voice, plays, checked;
    root.innerHTML = `<a class="back-link" href="#/ilisten">‹ 雅思听力训练</a>` + pageHead("🔢 Section 1 专项", "听一句话，把里面的信息写下来。考试只放一遍，尽量一遍就听懂")
      + `<div class="chips" style="margin-bottom:12px"><a class="chip ${only ? "" : "active"}" href="#/ilisten/drill">混合</a>${kinds.map((k) => `<a class="chip ${only === k ? "active" : ""}" href="#/ilisten/drill/${k}">${NAMES[k]}</a>`).join("")}</div>
        <div class="card pair-stage" id="st"></div><div class="kbd-hint">Tab 再听一遍（Shift+Tab 慢速）· Enter 检查 / 下一题</div>`;
    const st = $("#st", root);
    const play = (rate) => { plays++; TTS.speak(cur.say, rate, voice[0]); };
    const next = () => {
      if (i >= N) {
        addXP(2 + right);
        st.innerHTML = `<div class="center" style="padding:16px"><div style="font-size:44px">🔢</div><h3>答对 ${right} / ${N}</h3>
          <p class="muted">${right >= 9 ? "信息题基本稳了！" : "错的题多练几轮，尤其是 double、oh 和字母拼读。"}</p><button class="btn primary" id="again">再来一组</button></div>`;
        $("#again", st).onclick = () => Router.render();
        return;
      }
      cur = IL_DRILLS[only && IL_DRILLS[only] ? only : pick(kinds)]();
      voice = pick(IL_VOICES); plays = 0; checked = false;
      st.innerHTML = `<div class="small muted center">第 ${i + 1} / ${N} 题 · ${cur.kind} · ${voice[1]}</div>
        <div class="center mt"><button class="play-big" id="pl">🔊</button></div>
        <div class="center mt-s"><b>${esc(cur.ask)}</b></div>
        <input class="input en center mt" id="in" autocomplete="off" spellcheck="false"><div id="res"></div>`;
      const inp = $("#in", st);
      $("#pl", st).onclick = () => play();
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Tab") { e.preventDefault(); play(e.shiftKey ? 0.7 : undefined); }
        else if (e.key === "Enter") { e.preventDefault(); checked ? (i++, next()) : check(); }
      });
      setTimeout(() => inp.focus(), 50);
      play();
    };
    const check = () => {
      const v = $("#in", st).value;
      if (!v.trim()) return;
      checked = true;
      const ok = cur.check(v);
      if (ok) right++;
      this.stat("drill", ok);
      $("#res", st).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? `✅ 对了${plays > 1 ? `（听了 ${plays} 遍，考试只有一遍哦）` : ""}` : `❌ 正确答案：<b class="en">${esc(cur.answer)}</b>`}
        <div class="small mt-s">原句：<span class="en">${esc(cur.say)}</span> ${speakBtn(cur.say, "sm")}</div>
        <div class="row mt-s" style="justify-content:flex-end"><button class="btn primary sm" id="nx">${i + 1 < N ? "下一题" : "看结果"} <span class="kbd">Enter</span></button></div></div>`;
      $("#nx", st).onclick = () => { i++; next(); };
    };
    next();
  },

  // ---------- 179 考点词听写 ----------
  l179(root, signal) {
    const book = BOOK_MAP.ielts_l179;
    if (!book) { root.innerHTML = `<div class="card">没有找到 179 考点词词书。</div>`; return; }
    // 考点词和它的同义替换都拿来听写（同义替换在考试里才是真正读出来的那个词）
    const pool = bookItems(book).flatMap((it) => [{ w: it.w, of: it }, ...(it.phrases || []).map(([p]) => ({ w: p, of: it }))]).filter((x) => /^[a-z][a-z '-]*$/i.test(x.w));
    const N = 15, items = sample(pool, N);
    let i = 0, right = 0, voice, checked;
    const wrong = [];
    root.innerHTML = `<a class="back-link" href="#/ilisten">‹ 雅思听力训练</a>` + pageHead("🎯 179 考点词听写", "听到就写下来。每题的提示是这个词的中文意思；写完会告诉你它和哪些词互相替换")
      + `<div class="card pair-stage" id="st"></div><div class="kbd-hint">Tab 再听一遍（Shift+Tab 慢速）· Enter 检查 / 下一题</div>`;
    const st = $("#st", root);
    const play = (rate) => TTS.speak(items[i].w, rate ?? 0.9, voice[0]);
    const next = () => {
      if (i >= N) {
        addXP(2 + right);
        st.innerHTML = `<div class="center" style="padding:16px"><div style="font-size:44px">🎯</div><h3>拼对 ${right} / ${N}</h3>
          ${wrong.length ? `<div class="small muted">拼错的：${wrong.map((w) => `<button class="chip" data-say="${esc(w)}">${esc(w)}</button>`).join(" ")}</div>` : `<p class="muted">全对！</p>`}
          <button class="btn primary mt" id="again">再来一组</button></div>`;
        $("#again", st).onclick = () => Router.render();
        return;
      }
      voice = pick(IL_VOICES); checked = false;
      const x = items[i];
      st.innerHTML = `<div class="small muted center">第 ${i + 1} / ${N} 个 · ${voice[1]}</div>
        <div class="center mt"><button class="play-big" id="pl">🔊</button></div>
        <div class="center small muted mt-s">提示：${esc(x.w === x.of.w ? shortMeaning(x.of) : `和「${x.of.w}」意思相近`)}</div>
        <input class="input en center mt" id="in" autocomplete="off" spellcheck="false"><div id="res"></div>`;
      const inp = $("#in", st);
      $("#pl", st).onclick = () => play();
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Tab") { e.preventDefault(); play(e.shiftKey ? 0.6 : undefined); }
        else if (e.key === "Enter") { e.preventDefault(); checked ? (i++, next()) : check(); }
      });
      setTimeout(() => inp.focus(), 50);
      play();
    };
    const check = () => {
      const x = items[i], v = $("#in", st).value.trim();
      if (!v) return;
      checked = true;
      const ok = v.toLowerCase().replace(/\s+/g, " ") === x.w.toLowerCase();
      if (ok) right++; else wrong.push(x.w);
      this.stat("l179", ok);
      const syn = [x.of.w, ...(x.of.phrases || []).map(([p]) => p)];
      $("#res", st).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? "✅ 拼对了" : `❌ ${spellDiffHtml(v, x.w)} → <b class="en">${esc(x.w)}</b>`}
        <div class="small mt-s"><b class="en">${esc(x.of.w)}</b> ${esc(x.of.m)}</div>
        <div class="small muted">考试里可以互相替换：<span class="en">${syn.map(esc).join(" · ")}</span></div>
        <div class="row mt-s" style="justify-content:flex-end"><button class="btn primary sm" id="nx">${i + 1 < N ? "下一个" : "看结果"} <span class="kbd">Enter</span></button></div></div>`;
      $("#nx", st).onclick = () => { i++; next(); };
    };
    next();
  },

  // ---------- AI 模拟套题 ----------
  async mock(root, signal, sec) {
    if (!AI.enabled) { root.innerHTML = `<a class="back-link" href="#/ilisten">‹ 雅思听力训练</a><div class="card empty"><div class="big">🤖</div><h3>需要先接入 AI</h3><a class="btn primary" href="#/settings">去设置</a></div>`; return; }
    const SPEC = {
      1: "Section 1: a conversation between two people in an everyday social context (e.g. booking accommodation, joining a club, renting a car). Questions: form or notes completion, 10 blanks, each answer ONE WORD AND/OR A NUMBER (include a spelled-out surname, a phone number or date, a price, and an address). The person giving information should spell names letter by letter.",
      2: "Section 2: a monologue in an everyday social context (e.g. a guide introducing a park, a manager explaining a community event). Questions: 5 multiple choice (A/B/C) then 5 notes completion (ONE OR TWO WORDS).",
      3: "Section 3: a conversation between two or three students and a tutor discussing an assignment or research project. Questions: 6 multiple choice (A/B/C) then 4 sentence completion (NO MORE THAN TWO WORDS). Use paraphrase: the options should NOT repeat the exact words of the script.",
      4: "Section 4: an academic lecture by one speaker on a general academic topic (science, history, environment, psychology). Questions: 10 notes completion blanks (ONE WORD ONLY), following the structure of the lecture.",
    }[sec];
    root.innerHTML = `<a class="back-link" href="#/ilisten">‹ 雅思听力训练</a>` + pageHead(`🤖 AI 模拟 · Section ${sec}`, "AI 正在写一段原创的雅思风格听力……（大约 20–40 秒）") + `<div class="card center muted" style="padding:40px">✍️ 正在出题……</div>`;
    const r = await AI.json(`You are an experienced IELTS listening test writer. Write ORIGINAL material (never copy Cambridge tests).`,
      `${SPEC}
The script should take about 3-4 minutes to read aloud (around 450-600 words), natural spoken English with fillers like "well", "actually", some self-corrections (a typical IELTS distractor: the speaker first says one thing, then corrects it). Every answer must be stated clearly in the script, in the same order as the questions.
Return JSON:
{"title": "short English title", "context": "中文：一句话说明场景", "instructions": "the exam instructions, e.g. Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.",
 "speakers": [{"id": "A", "name": "first name", "gender": "female|male", "accent": "british|australian|american"}],
 "lines": [{"speaker": "A", "en": "one or two sentences"}],
 "questions": [{"no": 1, "type": "blank|choice", "prompt": "for blanks put ___ where the answer goes, e.g. 'Surname: ___'", "options": ["A ...", "B ...", "C ..."], "answer": "for choice: the letter; for blank: the exact word(s)", "alt": ["other acceptable spellings or forms"]}]}
Exactly 10 questions numbered 1-10. "options" only for choice questions.`);
    if (signal.aborted) return;
    if (!r.ok || !r.data?.lines?.length || !r.data?.questions?.length) {
      root.innerHTML = `<a class="back-link" href="#/ilisten">‹ 雅思听力训练</a><div class="card"><p class="bad-text">${esc(r.error || "AI 出的题格式不对")}</p><button class="btn primary" id="retry">再试一次</button></div>`;
      $("#retry", root).onclick = () => Router.render();
      return;
    }
    this.runMock(root, signal, sec, r.data);
  },

  runMock(root, signal, sec, t) {
    // 给每个说话人分配声音：按性别和口音挑
    const pool = { british: { female: ["en-GB-SoniaNeural", "en-GB-LibbyNeural"], male: ["en-GB-RyanNeural"] }, australian: { female: ["en-AU-NatashaNeural"], male: ["en-GB-RyanNeural"] },
      american: { female: ["en-US-JennyNeural", "en-US-AriaNeural", "en-US-EmmaNeural"], male: ["en-US-GuyNeural", "en-US-AndrewNeural", "en-US-BrianNeural"] } };
    const used = new Set(), voiceOf = {};
    (t.speakers || []).forEach((s) => {
      const list = pool[s.accent]?.[s.gender] || pool.british[s.gender] || pool.british.female;
      const v = list.find((x) => !used.has(x)) || list[0];
      used.add(v);
      voiceOf[s.id] = v;
    });
    const nameOf = Object.fromEntries((t.speakers || []).map((s) => [s.id, s.name]));
    const P = Store.prefs;
    let playing = false, idx = 0, finished = false, playedOnce = false;
    root.innerHTML = `<a class="back-link" href="#/ilisten">‹ 雅思听力训练</a>`
      + pageHead(`🎧 Section ${sec} · ${esc(t.title || "")}`, `${esc(t.context || "")}　·　${(t.speakers || []).map((s) => `${esc(s.name)}（${{ british: "英音", australian: "澳音", american: "美音" }[s.accent] || ""}）`).join("、")}`)
      + `<div class="card il-player"><button class="btn primary" id="il-play">▶ 开始播放</button>
          <label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="il-once" ${P.il_once !== false ? "checked" : ""}> 考试模式：只放一遍</label>
          <span class="small muted" id="il-pos"></span><span class="spacer"></span><button class="btn" id="il-submit">交卷</button></div>
        <div class="card"><div class="small muted">${esc(t.instructions || "")}</div><div id="il-qs" class="il-qs"></div></div>
        <div id="il-after"></div>`;
    const qbox = $("#il-qs", root);
    qbox.innerHTML = t.questions.map((q) => q.type === "choice"
      ? `<div class="il-q" data-no="${q.no}"><b>${q.no}</b> ${esc(q.prompt || "")}<div class="il-opts">${(q.options || []).map((o) => `<label><input type="radio" name="il${q.no}" value="${esc(o.trim()[0])}"> ${esc(o)}</label>`).join("")}</div></div>`
      : `<div class="il-q" data-no="${q.no}"><b>${q.no}</b> ${esc(q.prompt || "").replace("___", `<input class="il-blank en" data-no="${q.no}" autocomplete="off" spellcheck="false">`)}${(q.prompt || "").includes("___") ? "" : ` <input class="il-blank en" data-no="${q.no}" autocomplete="off" spellcheck="false">`}</div>`).join("");
    const pos = $("#il-pos", root), btn = $("#il-play", root);
    const play = async () => {
      if (playing) { playing = false; TTS.stop(); btn.textContent = "▶ 继续"; return; }
      if (finished === false && playedOnce && $("#il-once", root).checked) { toast("考试模式只放一遍，交卷后可以随便听"); return; }
      playing = true;
      btn.textContent = "⏸ 暂停";
      for (; idx < t.lines.length && playing && !signal.aborted; idx++) {
        pos.textContent = `${idx + 1} / ${t.lines.length} 句`;
        const l = t.lines[idx];
        await TTS.speak(l.en, undefined, voiceOf[l.speaker]);
        await new Promise((r) => setTimeout(r, 250));
      }
      if (idx >= t.lines.length) { playing = false; playedOnce = true; idx = 0; btn.textContent = "▶ 从头再放"; pos.textContent = "放完了"; }
    };
    btn.onclick = play;
    $("#il-once", root).onchange = (e) => { P.il_once = e.target.checked; Store.save(); };
    signal.addEventListener("abort", () => { playing = false; TTS.stop(); });

    const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9£.:\s'-]/g, " ").replace(/\s+/g, " ").trim();
    $("#il-submit", root).onclick = () => {
      if (finished) return;
      finished = true;
      playing = false;
      TTS.stop();
      let right = 0;
      for (const q of t.questions) {
        const box = $(`.il-q[data-no="${q.no}"]`, qbox);
        let got = "", ok;
        if (q.type === "choice") {
          got = $(`input[name="il${q.no}"]:checked`, qbox)?.value || "";
          ok = got.toUpperCase() === String(q.answer).trim()[0].toUpperCase();
          $$("label", box).forEach((lab) => { const v = $("input", lab).value.toUpperCase(); if (v === String(q.answer).trim()[0].toUpperCase()) lab.classList.add("ir-right"); else if ($("input", lab).checked) lab.classList.add("ir-wrong"); });
        } else {
          const inp = $(".il-blank", box);
          got = inp.value;
          ok = [q.answer, ...(q.alt || [])].map(norm).includes(norm(got));
          inp.classList.add(ok ? "ir-ok" : "ir-bad");
          inp.readOnly = true;
        }
        if (ok) right++;
        box.insertAdjacentHTML("beforeend", `<span class="ir-mark ${ok ? "ok" : "bad"}">${ok ? "✓" : `✗ ${esc(String(q.answer))}`}</span>`);
      }
      $$("input", qbox).forEach((x) => (x.disabled = true));
      const R = (Store.data.ilisten ||= {}), m = (R["mock" + sec] ||= { n: 0, best: 0, last: 0 });
      m.n++; m.last = right; m.best = Math.max(m.best, right);
      Store.save();
      addXP(5 + right);
      // 原文：答案所在的地方标出来
      const answers = t.questions.filter((q) => q.type !== "choice").map((q) => String(q.answer)).filter((a) => a.length > 1);
      const mark = (en) => answers.reduce((h, a) => h.replace(new RegExp(`(${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i"), "<mark>$1</mark>"), esc(en));
      $("#il-after", root).innerHTML = `<div class="ir-score"><div class="ir-score-num ${right >= 7 ? "good" : "bad"}">${right}<span>/ ${t.questions.length}</span></div>
          <div><b>${right >= 9 ? "太棒了！" : right >= 7 ? "不错！" : "对着原文找一找错在哪"}</b><div class="small muted">现在可以点原文里的任何一句重听，或者用 Ctrl+M 跟读</div></div>
          <span class="spacer"></span><button class="btn" id="il-new">换一套</button></div>
        <div class="card"><div class="card-title">📜 原文（黄色是填空题的答案）</div>
          ${t.lines.map((l, k) => `<div class="il-line" data-shadow-host><span class="il-who">${esc(nameOf[l.speaker] || l.speaker)}</span><span class="en" style="flex:1">${mark(l.en)}</span>
            <button class="speak sm" data-k="${k}" title="重听这句">🔊</button>${shadowBtn(l.en)}</div>`).join("")}</div>`;
      $("#il-after", root).addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) TTS.speak(t.lines[+b.dataset.k].en, undefined, voiceOf[t.lines[+b.dataset.k].speaker]); });
      $("#il-new", root).onclick = () => Router.render();
      $("#il-after", root).scrollIntoView({ behavior: "smooth" });
    };
  },
};
