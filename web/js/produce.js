// ============================================================
// 主动产出：用学过的词造句（单词 → 练习 → 造句）、英语日记（写作 → 英语日记）
// 开了 AI：检查用法和语法，改过的句子收进薄弱点本；没开 AI：检查有没有用上这个词，给例句对照
// 日记存在 Store.data.diary：{ 日期: {text, n 词数, result AI 批改, t} }
// ============================================================

// 这个词（含 -s / -ed / -ing 等变形）有没有出现在句子里
function usesWord(sentence, w) {
  const k = w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stem = k.replace(/e$/, "").replace(/y$/, "(?:y|i)");
  return new RegExp(`\\b(?:${k}|${stem})(?:s|es|ed|d|ing|ies|ied|er|est|ly)?\\b`, "i").test(sentence);
}

// 最近学的、还不太熟的词优先
function wordsToUse(n = 3, skip = []) {
  const recs = Object.entries(Store.data.words)
    .map(([w, s]) => [WORD_MAP[w.toLowerCase()], s])
    .filter(([it]) => it && it.m && !skip.includes(it.w) && /^[a-z][a-z-]+$/i.test(it.w) && it.w.length > 2);
  recs.sort((a, b) => (a[1].box >= MASTERED_BOX) - (b[1].box >= MASTERED_BOX) || ((b[1].first || "") > (a[1].first || "") ? 1 : -1));
  return sample(recs.slice(0, Math.max(n * 4, 12)), n).map(([it]) => it);
}

async function checkSentenceAI(w, meaning, sentence) {
  return AI.json(`You are a kind, precise English teacher. ${LEARNER_PROFILE}`,
    `Target word: "${w}" (meaning: ${meaning})
Learner's sentence: "${sentence}"
Check (1) whether the target word (or an inflected form) is used with a correct meaning and usage, and (2) whether the whole sentence is grammatical and natural.
Return JSON: {"used": true/false, "ok": true/false, "corrected": "the corrected sentence (same as the original if ok)", "better": "a more natural version a native speaker might say", "comment": "一两句中文点评：哪里用得好，哪里要改、为什么"}`);
}

function runUseWords(box, pageSignal) {
  const signal = freshSignal(runUseWords, pageSignal);
  const words = wordsToUse(3);
  if (words.length < 1) {
    box.innerHTML = `<div class="card">${emptyGuide("💬", "先学几个词再来造句", "学过的词越多，可以练的越多。造句是从「认识」到「会用」最有效的一步。", [["#/words/new", "🆕 学新词"]])}</div>`;
    return;
  }
  const session = Session.start();
  let i = 0, good = 0;
  const show = () => {
    if (i >= words.length) return finish();
    const it = words[i], exs = (it.exs?.length ? it.exs : it.ex ? [[it.ex, it.zh]] : []).slice(0, 2);
    box.innerHTML = `<div class="card use-card" style="max-width:720px;margin:0 auto">
      <div class="row small muted"><span>用学过的词造句</span><span class="spacer"></span><span>${i + 1} / ${words.length}</span>
        <button class="btn sm ghost" id="u-swap" title="换一个词">换一个</button></div>
      <div class="row mt-s" style="align-items:baseline;gap:10px"><span class="fc-word" style="font-size:30px;margin:0">${esc(it.w)}</span><span class="fc-ipa">${esc(it.ph || "")}</span>${speakBtn(it.w)}</div>
      <div class="muted">${esc(shortMeaning(it))}</div>
      ${collocHtml(it.w)}
      <textarea class="textarea en mt" id="u-in" rows="2" placeholder="用 ${esc(it.w)} 写一个和你自己有关的句子（Ctrl+Enter 提交）" spellcheck="false"></textarea>
      <div class="small faint mt-s">💡 写自己的事最好记：比如你今天做了什么、你的看法、你的计划。${AI.enabled ? "AI 会检查用法和语法。" : "没开 AI，只检查有没有用上这个词；可以对照下面的例句看用法。"}</div>
      <div id="u-res" class="mt"></div>
      <div class="row mt"><button class="btn ghost" id="u-skip">跳过</button><span class="spacer"></span><button class="btn primary" id="u-go">提交</button></div></div>`;
    const inp = $("#u-in", box), res = $("#u-res", box), go = $("#u-go", box);
    setTimeout(() => inp.focus(), 30);
    let done = false, warned = false;
    const submit = async () => {
      if (done) { i++; show(); return; }
      const s = inp.value.trim();
      if (s.split(/\s+/).length < 3) { toast("多写几个词，写成一个完整的句子"); return; }
      // 不规则变化（go → went）认不出来：提醒一次，再点就照样提交
      if (!usesWord(s, it.w) && !warned) { warned = true; toast(`句子里好像还没有用上「${it.w}」；如果用的是不规则变化，再点一次提交`, "", 4000); return; }
      done = true;
      inp.readOnly = true;
      go.disabled = true;
      bump("c_use");
      const exHtml = exs.length ? `<div class="fc-extra"><b>例句对照</b>${exs.map(([en, zh]) => `<div><span class="en">${esc(en)}</span> ${speakBtn(en, "sm")}<div class="small muted">${esc(zh)}</div></div>`).join("")}</div>` : "";
      if (!AI.enabled) {
        good++;
        addXP(2);
        res.innerHTML = `<div class="explain good">✅ 用上了！对照例句看看用法是不是一样。</div>${exHtml}`;
      } else {
        res.innerHTML = aiLoading("AI 正在看你的句子…");
        const r = await checkSentenceAI(it.w, shortMeaning(it), s);
        if (!res.isConnected) return;
        if (!r.ok) { res.innerHTML = aiError(r.error) + exHtml; }
        else {
          const d = r.data, ok = d.ok && d.used !== false;
          if (ok) { good++; addXP(3); } else addXP(1);
          if (!ok && d.corrected && selNorm(d.corrected) !== selNorm(s)) Weak.add("fix", d.corrected, { en: d.corrected, said: s, note: d.comment || "", src: `造句 · ${it.w}` });
          res.innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? "✅ 用得对！" : "✏️ 有地方要改"} ${esc(d.comment || "")}</div>
            ${!ok && d.corrected ? `<div class="fix-row mt-s"><div class="small faint">改好的句子</div><div class="en"><b>${esc(d.corrected)}</b> ${speakBtn(d.corrected, "sm")}</div></div>` : ""}
            ${d.better && selNorm(d.better) !== selNorm(d.corrected || s) ? `<div class="fix-row mt-s"><div class="small faint">更地道的说法</div><div class="en">${esc(d.better)} ${speakBtn(d.better, "sm")}</div></div>` : ""}
            ${exHtml}`;
        }
      }
      go.disabled = false;
      go.textContent = i + 1 < words.length ? "下一个 ›" : "看结果";
      go.focus();
    };
    go.onclick = submit;
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } });
    $("#u-skip", box).onclick = () => { i++; show(); };
    $("#u-swap", box).onclick = () => { const [n] = wordsToUse(1, words.map((x) => x.w)); if (n) { words[i] = n; show(); } else toast("没有别的词可以换了"); };
  };
  const finish = () => {
    box.innerHTML = Session.finishHtml(session, {
      emoji: "💬", title: "造句完成！", exit: false,
      lines: `写了 ${words.length} 个句子${AI.enabled ? `，${good} 个完全正确` : ""}`,
      note: "自己造的句子比背例句记得牢得多。改过的句子已经收进薄弱点本，过几天会让你再说一遍。",
    });
    $("[data-finish-actions]", box).innerHTML = `<button class="btn primary" data-again>再写 3 句</button>`;
    $("[data-again]", box).onclick = () => runUseWords(box, pageSignal);
  };
  show();
}

// ---------- 英语日记 ----------
const DIARY_PROMPTS = [
  ["What did you do today?", "今天做了什么？"], ["What made you smile today?", "今天什么事让你开心？"],
  ["What did you eat today? Was it good?", "今天吃了什么？好吃吗？"], ["Describe the weather today and how it made you feel.", "今天天气怎么样，让你有什么感觉？"],
  ["What is one thing you learned today?", "今天学到的一件事。"], ["Who did you talk to today? What about?", "今天和谁聊了天？聊了什么？"],
  ["What are your plans for tomorrow?", "明天打算做什么？"], ["What was the hardest part of your day?", "今天最难的是什么？"],
  ["Describe a place you went to today.", "描述一下今天去过的一个地方。"], ["What are you looking forward to this week?", "这周最期待什么？"],
  ["What is something you want to get better at?", "你想在哪方面变得更好？"], ["Write about a song, film or book you like.", "写写你喜欢的一首歌、一部电影或一本书。"],
  ["What would you do if you had a free day tomorrow?", "如果明天放假一天，你会做什么？"], ["Describe someone who helped you recently.", "写写最近帮过你的人。"],
  ["What is a small habit you want to build?", "你想养成的一个小习惯。"], ["Where would you like to travel, and why?", "你想去哪里旅行，为什么？"],
  ["What did you spend money on today?", "今天花钱买了什么？"], ["Describe your room or your desk.", "描述一下你的房间或书桌。"],
  ["What made you tired or stressed today?", "今天什么让你累或者有压力？"], ["What is something you are grateful for?", "写一件让你感恩的事。"],
  ["What did you do in your free time this week?", "这周空闲时间做了什么？"], ["Describe a problem you solved recently.", "写写最近解决的一个问题。"],
  ["What is your favourite time of day, and why?", "你最喜欢一天里的什么时候，为什么？"], ["Write about a friend you haven't seen for a long time.", "写写一个很久没见的朋友。"],
  ["What is one thing you would change about your city?", "你想改变你所在城市的哪一点？"], ["What did you read or watch today?", "今天读了或看了什么？"],
  ["Describe your morning routine.", "描述一下你早上的日常。"], ["What is a goal you have for this month?", "这个月的一个目标。"],
];

const Diary = {
  get all() { return (Store.data.diary ||= {}); },
  prompt(date = today()) { const r = seededRandom("diary:" + date); return DIARY_PROMPTS[Math.floor(r() * DIARY_PROMPTS.length)]; },
  // 今天学过 / 复习过的词：可以点一下插进日记
  todayWords() {
    const t = today(), d0 = new Date(t + "T00:00:00").getTime();
    const ids = new Set((Store.data.revlog || []).filter(([id, ts]) => ts >= d0 && !String(id).includes(":")).map(([id]) => id));
    Object.entries(Store.data.words).forEach(([w, s]) => { if (s.first === t) ids.add(w); });
    return [...ids].filter((w) => /^[a-z][a-z-]+$/i.test(w)).slice(0, 16);
  },
  words: (text) => (text.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length,
  render(body, signal) {
    const t = today(), rec = this.all[t] || {}, [pen, pzh] = this.prompt();
    const tw = this.todayWords();
    const past = Object.entries(this.all).filter(([d, r]) => d !== t && r?.text).sort((a, b) => (a[0] < b[0] ? 1 : -1));
    body.innerHTML = `<div class="grid diary-grid">
      <div class="card diary-card">
        <div class="card-title">📔 ${t} 的英语日记 <span class="spacer"></span><span class="small muted" id="d-n"></span></div>
        <div class="diary-prompt"><span class="small faint">今天可以写：</span><span class="en">${esc(pen)}</span> <span class="small muted">${esc(pzh)}</span></div>
        <textarea class="textarea en diary-text" id="d-text" rows="7" placeholder="Today I ...（写 3 句就够了，写自己的事最好）" spellcheck="false">${esc(rec.text || "")}</textarea>
        ${tw.length ? `<div class="small muted mt-s">试试用上今天学的词（点一下插进去，用上的会变绿）：</div><div class="chips mt-s" id="d-words">${tw.map((w) => `<button class="chip" data-w="${esc(w)}">${esc(w)}</button>`).join("")}</div>` : ""}
        <div class="row mt" style="flex-wrap:wrap;gap:8px"><span class="small faint" id="d-saved">${rec.t ? "已保存" : "写的内容会自动保存"}</span><span class="spacer"></span>
          <button class="btn ${AI.enabled ? "primary" : "ghost"}" id="d-ai" ${AI.enabled ? "" : "disabled title=\"在设置里接入 AI 后可以批改\""}>✨ AI 批改</button></div>
        <div id="d-res" class="mt">${rec.result ? this.resultHtml(rec.result) : ""}</div>
      </div>
      <div class="card"><div class="card-title">🗂️ 以前的日记 <span class="small muted" style="font-weight:400">${past.length} 篇</span></div>
        ${past.length ? past.slice(0, 60).map(([d, r]) => `<details class="diary-past"><summary><b>${d}</b> <span class="small muted">${r.n || this.words(r.text)} 词${r.result ? " · 已批改" : ""}</span></summary>
          <div class="en diary-past-text">${esc(r.text).replace(/\n/g, "<br>")}</div>${r.result ? this.resultHtml(r.result) : ""}</details>`).join("")
          : emptyGuide("🗂️", "还没有以前的日记", "每天写几句，一个月后回头看，会看到自己的进步。")}</div>
    </div>`;
    const ta = $("#d-text", body), n = $("#d-n", body), saved = $("#d-saved", body);
    const refresh = () => {
      const c = this.words(ta.value);
      n.textContent = `${c} 个词`;
      $$("#d-words [data-w]", body).forEach((b) => b.classList.toggle("active", usesWord(ta.value, b.dataset.w)));
    };
    let timer = 0;
    const save = () => {
      const text = ta.value.trim(), r = (this.all[t] ||= {});
      if (!text && !r.text) return;
      const first = !r.counted && this.words(text) >= 15;
      r.text = text;
      r.n = this.words(text);
      r.t = Date.now();
      if (first) { r.counted = 1; bump("c_diary"); addXP(5); toast("📔 今天的日记写好了 +5 XP", "good"); }
      Store.save();
      saved.textContent = "已保存";
    };
    ta.addEventListener("input", () => { refresh(); saved.textContent = "正在保存…"; clearTimeout(timer); timer = setTimeout(save, 800); });
    signal.addEventListener("abort", () => { clearTimeout(timer); save(); }, { once: true });
    $("#d-words", body)?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-w]");
      if (!b) return;
      const pos = ta.selectionStart ?? ta.value.length;
      ta.value = ta.value.slice(0, pos) + (pos && !/\s$/.test(ta.value.slice(0, pos)) ? " " : "") + b.dataset.w + " " + ta.value.slice(pos);
      ta.focus();
      ta.dispatchEvent(new Event("input"));
    });
    $("#d-ai", body).onclick = async () => {
      const text = ta.value.trim();
      if (this.words(text) < 8) { toast("再多写几句再批改吧"); return; }
      save();
      const res = $("#d-res", body), btn = $("#d-ai", body);
      btn.disabled = true;
      res.innerHTML = aiLoading("AI 正在批改你的日记…");
      const r = await AI.json(`You are a warm, encouraging English teacher correcting a learner's diary. ${LEARNER_PROFILE}`,
        `Diary entry:\n"""\n${text}\n"""\nReturn JSON: {"praise": "一句中文：写得好的地方", "errors": [{"original": "exact wrong phrase or sentence from the diary", "corrected": "corrected version", "explain": "中文简短解释"}], "better": "the whole diary rewritten in natural English, keeping the learner's ideas and a similar level", "tip": "一条中文建议"}  // errors: up to 6 most important, empty if none`);
      btn.disabled = false;
      if (!res.isConnected) return;
      if (!r.ok) { res.innerHTML = aiError(r.error); return; }
      const d = r.data, rec2 = (this.all[t] ||= {});
      rec2.result = d;
      rec2.t = Date.now();
      (d.errors || []).forEach((x) => { if (x?.corrected && x.original) Weak.add("fix", x.corrected, { en: x.corrected, said: x.original, note: x.explain || "", src: "英语日记" }); });
      if (!rec2.ai) { rec2.ai = 1; addXP(5, "c_write"); }
      Store.save();
      res.innerHTML = this.resultHtml(d);
    };
    refresh();
  },
  resultHtml(d) {
    return `<div class="diary-result">
      ${d.praise ? `<div class="explain good">👍 ${esc(d.praise)}</div>` : ""}
      ${(d.errors || []).length ? `<div class="card-title mt-s">✏️ 改一改 <span class="small muted" style="font-weight:400">（已收进薄弱点本）</span></div>${d.errors.map((x) => `<div class="fix-row"><div class="small faint"><s>${esc(x.original)}</s></div><div class="en"><b>${esc(x.corrected)}</b> ${speakBtn(x.corrected, "sm")}</div><div class="small muted">${esc(x.explain || "")}</div></div>`).join("")}` : `<div class="small good-text mt-s">没有发现明显的错误 🎉</div>`}
      ${d.better ? `<details class="mt-s"><summary class="small" style="cursor:pointer">📝 看看更地道的写法</summary><div class="en diary-past-text">${esc(d.better).replace(/\n/g, "<br>")} ${speakBtn(d.better, "sm")}</div></details>` : ""}
      ${d.tip ? `<div class="small muted mt-s">💡 ${esc(d.tip)}</div>` : ""}</div>`;
  },
};
