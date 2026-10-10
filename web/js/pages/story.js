// ============================================================
// 今日故事：用今天该复习的词写一篇小故事，在语境里复习
// 开了 AI：按你的水平写 150–220 词的原创故事，每段带中文，读完做 3 道题；同一天的故事存在 KV（story），不会重复花钱
// 没开 AI：从 Tatoeba 真实例句和词书例句里给每个词找一句，读成「今日例句」
// 读完后逐个确认「这个词读懂了吗」：读懂的算一次复习（只对今天到期的词），没读懂的明天再来
// ============================================================
App.pages.story = {
  // 目标词：今天到期的优先，不够就用最近学的
  targets(n = 10) {
    const due = dueWords().filter((it) => /^[a-z][a-z' -]+$/i.test(it.w) && it.m).slice(0, n);
    const more = due.length >= 5 ? [] : wordsToUse(Math.min(8, n) - due.length, due.map((x) => x.w));
    return [...due, ...more];
  },
  async render(root, params, signal) {
    const key = today() + ":" + curBook().id;
    let saved = await KV.get("story", key);
    if (signal.aborted) return;
    const targets = saved?.targets ? saved.targets.map((w) => WORD_MAP[w.toLowerCase()]).filter(Boolean) : this.targets();
    root.innerHTML = pageHead("📜 今日故事", "用今天该复习的词写成的小故事。在语境里再见一次，比单独翻卡片记得牢。", `<a class="btn ghost sm" href="#/reading">阅读 ›</a>`) + `<div id="st-body"></div>`;
    const body = $("#st-body", root);
    if (targets.length < 3) {
      body.innerHTML = `<div class="card">${emptyGuide("📜", "今天要复习的词还太少", "学过一些词以后，这里每天会用你该复习的词写一篇小故事。", [["#/words/new", "🆕 学新词"], ["#/reading", "📖 去阅读"]])}</div>`;
      return;
    }
    const intro = () => {
      body.innerHTML = `<div class="card"><div class="card-title">今天的 ${targets.length} 个词</div>
        <div class="chips">${targets.map((it) => `<span class="chip" title="${esc(shortMeaning(it))}">${esc(it.w)}</span>`).join("")}</div>
        <p class="small muted mt">${AI.enabled ? "AI 会按你的水平，用上这些词写一篇 200 词左右的小故事（大约 20 秒）。" : "没开 AI：给每个词找一句真实例句，连起来读。接入 AI 后可以生成完整的故事。"}</p>
        <div class="row mt"><button class="btn primary" id="st-go">${AI.enabled ? "✨ 写今天的故事" : "📚 读今日例句"}</button></div></div>`;
      $("#st-go", body).onclick = () => (AI.enabled ? this.generate(body, targets, key, signal) : this.offline(body, targets, signal));
    };
    if (saved?.story) this.show(body, saved.story, targets, signal, { key, regen: () => { KV.set("story", key, null); this.generate(body, targets, key, signal); } });
    else intro();
  },
  async generate(body, targets, key, signal) {
    body.innerHTML = `<div class="card">${aiLoading("AI 正在用今天的词写故事…")}</div>`;
    const r = await AI.json(`You write short, original, engaging stories for English learners. ${LEARNER_PROFILE}`,
      `Write an original short story (150-220 words, 3-5 paragraphs) for today's review. It MUST naturally use ALL of these words (inflected forms are fine), each with the given meaning:
${targets.map((it) => `- ${it.w}: ${shortMeaning(it)}`).join("\n")}
Keep the rest of the vocabulary simple for the learner's level. Give it a clear plot and a small twist or warm ending.
Return JSON: {"title": "English title", "title_zh": "中文标题", "paragraphs": [{"en": "...", "zh": "中文翻译"}], "questions": [{"q": "a comprehension question in English", "o": ["option", "option", "option", "option"], "a": 0}]}  // exactly 3 questions`);
    if (signal.aborted) return;
    if (!r.ok || !r.data?.paragraphs?.length) { body.innerHTML = `<div class="card">${aiError(r.error || "AI 没有写出故事，再试一次")}<div class="mt"><button class="btn" id="st-retry">再试一次</button></div></div>`; $("#st-retry", body).onclick = () => this.generate(body, targets, key, signal); return; }
    const story = r.data;
    await KV.set("story", key, { story, targets: targets.map((x) => x.w), t: Date.now() });
    this.show(body, story, targets, signal, { key, regen: () => { KV.set("story", key, null); this.generate(body, targets, key, signal); } });
  },
  async offline(body, targets, signal) {
    body.innerHTML = `<div class="card">${aiLoading("正在找例句…")}</div>`;
    const paras = [];
    for (const it of targets) {
      let pair = null;
      try { pair = (await Tatoeba.find(it.w, [], 8)).find(([en]) => en.split(/\s+/).length >= 5); } catch { /* 没加载到就用词书例句 */ }
      if (!pair && it.ex) pair = [it.ex, it.zh];
      if (pair) paras.push({ en: pair[0], zh: pair[1] });
    }
    if (signal.aborted) return;
    this.show(body, { title: "Today's Sentences", title_zh: "今日例句", paragraphs: paras, questions: [], offline: true }, targets, signal, {});
  },
  show(body, story, targets, signal, { regen } = {}) {
    const words = targets.map((x) => x.w.toLowerCase());
    const session = Session.start();
    // 目标词（含变形）高亮
    const isTarget = (w) => words.includes(w.toLowerCase()) || words.includes(lookupWord(w)?.w?.toLowerCase());
    const mark = (en) => wrapWords(en).replace(/<span class="w([^"]*)">([^<]+)<\/span>/g, (m, cls, w) => (isTarget(w) ? `<span class="w${cls} story-target">${w}</span>` : m));
    let showZh = false;
    const qs = (story.questions || []).filter((q) => q?.o?.length >= 2).map((q) => { const o = shuffle(q.o.map((t, k) => [t, k])); return { q: q.q, o: o.map((x) => x[0]), a: o.findIndex((x) => x[1] === (q.a || 0)) }; });
    const draw = () => {
      body.innerHTML = `<div class="card story-card">
        <div class="row" style="align-items:baseline;flex-wrap:wrap;gap:8px"><h2 class="en" style="margin:0">${esc(story.title || "")}</h2><span class="muted">${esc(story.title_zh || "")}</span><span class="spacer"></span>
          <button class="btn sm ghost" id="st-zh">${showZh ? "隐藏中文" : "显示中文"}</button><button class="btn sm ghost" id="st-read">🔊 朗读全文</button>${regen ? `<button class="btn sm ghost" id="st-regen" title="不满意就换一篇">↻ 换一篇</button>` : ""}</div>
        ${story.offline ? `<p class="small faint">例句来自 Tatoeba（CC BY 2.0 FR）和词书。</p>` : ""}
        <div class="story-text">${story.paragraphs.map((p, k) => `<div class="story-p" data-p="${k}"><p class="en" data-text="${esc(p.en)}">${mark(p.en)} ${speakBtn(p.en, "sm")}</p>${showZh ? `<p class="small muted">${esc(p.zh || "")}</p>` : ""}</div>`).join("")}</div>
      </div>
      ${qs.length ? `<div class="card mt"><div class="card-title">🧐 读懂了吗</div>${qs.map((q, k) => `<div class="mt-s" data-q="${k}"><div class="en"><b>${k + 1}.</b> ${esc(q.q)}</div><div class="options two mt-s">${q.o.map((o, j) => `<button class="option" data-qa="${k}:${j}"><span class="letter">${"ABCD"[j]}</span><span class="en">${esc(o)}</span></button>`).join("")}</div></div>`).join("")}</div>` : ""}
      <div class="card mt" id="st-check"><div class="card-title">✅ 这些词读懂了吗</div>
        <p class="small muted">点掉没读懂的词。读懂的算一次复习（只算今天该复习的词），没读懂的明天再练。</p>
        <div class="chips st-words">${targets.map((it) => `<button class="chip active" data-sw="${esc(it.w)}" title="${esc(shortMeaning(it))}">✓ ${esc(it.w)} <small class="muted">${esc(shortMeaning(it).slice(0, 16))}</small></button>`).join("")}</div>
        <div class="row mt"><span class="spacer"></span><button class="btn primary" id="st-done">读完了</button></div></div>`;
      bindWordClicks(body);
    };
    draw();
    let right = 0;
    body.addEventListener("click", async (e) => {
      if (e.target.closest("#st-zh")) { showZh = !showZh; draw(); return; }
      if (e.target.closest("#st-regen")) { regen(); return; }
      if (e.target.closest("#st-read")) {
        for (const p of story.paragraphs) { if (signal.aborted || !body.isConnected) break; await TTS.speak(p.en); }
        return;
      }
      const qa = e.target.closest("[data-qa]");
      if (qa && !qa.disabled) {
        const [k, j] = qa.dataset.qa.split(":").map(Number), q = qs[k], box = qa.closest("[data-q]");
        $$("[data-qa]", box).forEach((b, x) => { b.disabled = true; if (x === q.a) b.classList.add("right"); else if (x === j) b.classList.add("wrong"); });
        if (j === q.a) { right++; addXP(1); }
        return;
      }
      const sw = e.target.closest("[data-sw]");
      if (sw) { sw.classList.toggle("active"); sw.firstChild.textContent = sw.classList.contains("active") ? "✓ " : "✗ "; return; }
      if (e.target.closest("#st-done")) {
        const t = today();
        let reviewed = 0, missed = [];
        $$("[data-sw]", body).forEach((b) => {
          const w = b.dataset.sw, rec = Store.data.words[w], ok = b.classList.contains("active");
          if (!ok) missed.push(w);
          if (rec && rec.due <= t) { gradeWord(w, ok ? 2 : 0); addXP(1, "review"); reviewed++; }
          else if (!ok && rec) { rec.due = addDays(t, 1); rec.t = Date.now(); }
        });
        bump("c_story");
        addXP(story.offline ? 3 : 6);
        Store.save();
        renderNav();
        $("#st-check", body).outerHTML = Session.finishHtml(session, {
          emoji: "📜", title: "今天的故事读完了！", exit: false,
          lines: `${reviewed ? `顺便复习了 ${reviewed} 个词` : "这些词还没到复习时间，读一读加深印象"}${qs.length ? ` · 理解题答对 ${right} / ${qs.length}` : ""}`,
          note: missed.length ? `没读懂的 ${missed.join("、")} 明天会再出现。` : "全都读懂了，记得很牢！",
        });
      }
    }, { signal });
  },
};
