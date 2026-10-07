// 写作：中译英（离线可用，开 AI 可点评）/ 作文批改（需要 AI）
App.pages.writing = {
  render(root, params, signal) {
    const tab = params[0] || "translate";
    root.innerHTML = pageHead("写作", "",
      tabsHtml([["translate", "中译英"], ["essay", "作文批改"], ["history", "批改记录"]], tab)) + `<div id="w-body"></div>`;
    $$(".tab", root).forEach((b) => (b.onclick = () => Router.go("writing/" + b.dataset.tab)));
    const body = $("#w-body", root);
    this._page = signal;
    ({ translate: this.translate, essay: this.essay, history: this.history })[tab].call(this, body);
  },

  translate(body) {
    const signal = freshSignal(this, this._page);
    // 题目来源：情景句子（随机）或雅思写作 100 句（按顺序做，记住做到第几句）
    const P = Store.prefs;
    const w100 = P.tr_src === "w100" && window.IELTS_W100?.length;
    let item;
    if (w100) {
      const k = (P.w100_i || 0) % IELTS_W100.length, x = IELTS_W100[k];
      item = { en: x.en, zh: x.zh, alt: x.alt, note: x.note, scene: `雅思写作 100 句 · 第 ${x.no} 句 · ${x.sec}`, k };
    } else {
      const all = SENTENCE_SCENES.flatMap((s) => s.sentences.map(([en, zh]) => ({ en, zh, scene: s.title })));
      item = pick(all);
    }
    let done = false;
    body.innerHTML = `${window.IELTS_W100 ? `<div class="chips" style="justify-content:center;margin-bottom:12px">
        <button class="chip ${w100 ? "" : "active"}" data-src="scene">💬 情景句子（随机）</button>
        <button class="chip ${w100 ? "active" : ""}" data-src="w100">🎓 雅思写作 100 句（第 ${(P.w100_i || 0) % IELTS_W100.length + 1} / ${IELTS_W100.length} 句）</button></div>` : ""}
      <div class="card" style="max-width:760px;margin:0 auto">
      <div class="row small muted"><span class="badge">${esc(item.scene)}</span><span class="spacer"></span><span>已翻译 ${Store.data.stats.translate} 句</span></div>
      <div style="font-size:22px;font-weight:600;margin:18px 0 14px">${esc(item.zh)}</div>
      <textarea class="textarea en" id="ans" rows="3" placeholder="用英文翻译这句话…（按 Ctrl+Enter 提交）" spellcheck="false"></textarea>
      <div id="res" class="mt"></div>
      <div class="row mt"><button class="btn ghost" id="skip">换一句</button><span class="spacer"></span><button class="btn primary" id="submit">提交</button></div>
    </div>`;
    const ans = $("#ans", body);
    ans.focus();
    $$("[data-src]", body).forEach((b) => (b.onclick = () => { P.tr_src = b.dataset.src; Store.save(); this.translate(body); }));

    const submit = async (evt) => {
      if (done) return this.translate(body);
      const text = ans.value.trim();
      if (!text) { toast("先写点什么吧"); return; }
      done = true;
      ans.readOnly = true;
      // 和参考答案（有第二种译法时取更像的那个）比相似度
      const mine = tokens(text);
      const simOf = (en) => { const ref = tokens(en); return ref.length ? Math.round((2 * lcsMatch(ref, mine).common / (ref.length + mine.length)) * 100) : 0; };
      const sim = Math.max(simOf(item.en), item.alt ? simOf(item.alt) : 0);
      if (item.k !== undefined) { P.w100_i = item.k + 1; Store.save(); }
      Store.data.stats.translate++;
      addXP(sim >= 80 ? 5 : 3, null, evt);
      $("#submit", body).textContent = "下一句 ›";
      $("#res", body).innerHTML = `
        <div class="row"><span class="score-pill ${sim >= 80 ? "high" : sim >= 50 ? "mid" : "low"}">与参考答案相似度 ${sim}%</span>
          <span class="small faint">意思对、语法对就行，不必和参考答案一字不差</span></div>
        <div class="ex mt-s"><div class="txt"><span class="en">${esc(item.en)}</span><span class="zh">参考答案</span></div>${speakBtn(item.en)}</div>
        ${item.alt && item.alt !== item.en ? `<div class="ex mt-s"><div class="txt"><span class="en">${esc(item.alt)}</span><span class="zh">另一种说法</span></div>${speakBtn(item.alt)}</div>` : ""}
        ${item.note ? `<div class="small muted mt-s">📌 ${esc(item.note)}</div>` : ""}
        <div id="ai-res" class="mt-s">${AI.enabled ? aiLoading("AI 老师正在看你的翻译…") : `<p class="small faint">开启 AI 后，会告诉你的翻译对不对、哪里可以改进。</p>`}</div>`;
      if (!AI.enabled) return;
      await aiAnswer($("#ai-res", body),
        `You are an encouraging English teacher reviewing a translation exercise. ${LEARNER_PROFILE}
Reply in Chinese, concise (under 150 Chinese characters plus English examples):
1. First line: verdict — "✅ 正确" / "🟡 基本正确" / "❌ 有错误".
2. Point out grammar or word-choice errors, if any, with the corrected sentence in bold.
3. If the learner's version is correct but differs from the reference, say it's also fine.`,
        `中文原句：${item.zh}\n参考译文：${item.en}\n学习者的翻译：${text}`, "AI 老师正在看你的翻译…");
    };
    $("#submit", body).onclick = submit;
    $("#skip", body).onclick = () => this.translate(body);
    ans.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || done)) { e.preventDefault(); submit(e); }
    });
    onKey(signal, (e) => { if (e.key === "Enter" && done) this.translate(body); });
  },

  essay(body) {
    if (!AI.enabled) { body.innerHTML = aiLockHtml("作文批改"); return; }
    let topic = WRITING_TOPICS[0];
    body.innerHTML = `<div class="card">
      <div class="card-title">选一个题目</div>
      <div class="chips" id="topics">${WRITING_TOPICS.map((t, i) => `<button class="chip ${i === 0 ? "active" : ""}" data-i="${i}">${t.title}</button>`).join("")}<button class="chip" data-i="free">✏️ 自由写</button></div>
      <div id="topic-box" class="mt"></div>
      <textarea class="textarea en mt" id="essay" rows="9" placeholder="Start writing here…" spellcheck="false"></textarea>
      <div class="row mt"><span class="small muted" id="count">0 词</span><span class="spacer"></span><button class="btn primary" id="submit">提交批改</button></div>
    </div><div id="result"></div>`;
    const tb = $("#topic-box", body);
    const drawTopic = () => {
      tb.innerHTML = topic
        ? `<div class="ex" style="border-left-color:var(--info)"><div class="txt"><span class="en">${esc(topic.prompt)}</span><span class="zh">${esc(topic.hint)}</span></div></div>`
        : `<div class="small muted">自由写作：写什么都可以，比如今天发生的事、最近的想法。</div>`;
    };
    drawTopic();
    $("#topics", body).onclick = (e) => {
      const c = e.target.closest("[data-i]");
      if (!c) return;
      $$(".chip", body).forEach((x) => x.classList.toggle("active", x === c));
      topic = c.dataset.i === "free" ? null : WRITING_TOPICS[+c.dataset.i];
      drawTopic();
    };
    const ta = $("#essay", body);
    ta.addEventListener("input", () => { $("#count", body).textContent = `${tokens(ta.value).length} 词`; });

    $("#submit", body).onclick = async (evt) => {
      const text = ta.value.trim();
      if (tokens(text).length < 15) { toast("至少写 15 个词再提交吧"); return; }
      const btn = evt.currentTarget;
      btn.disabled = true;
      const res = $("#result", body);
      res.innerHTML = `<div class="card">${aiLoading("正在批改，大约需要 10–30 秒…")}</div>`;
      const r = await AI.json(
        `You are a kind but precise English writing teacher. ${LEARNER_PROFILE}`,
        `Topic: ${topic ? topic.prompt : "Free writing"}
Learner's essay:
"""
${text}
"""
Review it and return JSON:
{"score": integer 0-100,
 "summary": "一两句中文总评，先肯定优点",
 "errors": [{"original": "the exact wrong phrase from the essay", "corrected": "corrected phrase", "explain": "中文简短解释"}],  // up to 8 most important errors, empty if none
 "better": "an improved version of the whole essay, keeping the learner's ideas and a similar level (A2-B1), natural English",
 "tips": ["中文写作建议 1", "中文写作建议 2"]}`);
      btn.disabled = false;
      if (!r.ok) { res.innerHTML = `<div class="card">${aiError(r.error)}</div>`; return; }
      const d = r.data;
      Store.data.stats.essay++;
      Store.data.essays.unshift({ date: today(), topic: topic ? topic.title : "自由写作", text, result: d });
      Store.data.essays = Store.data.essays.slice(0, 30);
      addXP(8, null, evt);
      res.innerHTML = this.resultHtml(d);
    };
  },

  resultHtml(d) {
    const s = +d.score || 0;
    return `<div class="card">
      <div class="row"><div class="result-big" style="font-size:44px">${s}</div><div><b>分</b><div class="muted">${esc(d.summary || "")}</div></div></div>
      ${(d.errors || []).length ? `<div class="card-title mt">🔧 需要修改的地方</div>${d.errors.map((x) => `
        <div class="correction"><span class="from">${esc(x.original)}</span> → <span class="to">${esc(x.corrected)}</span><div class="small muted">${esc(x.explain)}</div></div>`).join("")}`
        : `<p class="mt">没有发现明显错误，很棒！</p>`}
      ${d.better ? `<div class="card-title mt">✨ 参考范文 ${speakBtn(d.better, "sm")}</div><div class="ai-box" style="font-family:var(--font-en);font-size:15px;white-space:pre-wrap">${esc(d.better)}</div>` : ""}
      ${(d.tips || []).length ? `<div class="card-title mt">💡 建议</div><ul class="muted">${d.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    </div>`;
  },

  history(body) {
    const list = Store.data.essays;
    if (!list.length) { body.innerHTML = `<div class="card empty"><div class="big">📝</div>还没有批改记录</div>`; return; }
    body.innerHTML = list.map((e, i) => `<div class="card">
      <div class="row"><b>${esc(e.topic)}</b><span class="badge">${e.date}</span><span class="badge brand">${e.result.score} 分</span><span class="spacer"></span><button class="btn sm ghost" data-i="${i}">展开</button></div>
      <div class="small muted mt-s" style="font-family:var(--font-en)">${esc(e.text.slice(0, 160))}${e.text.length > 160 ? "…" : ""}</div>
      <div class="detail hidden"></div></div>`).join("");
    body.onclick = (ev) => {
      const b = ev.target.closest("[data-i]");
      if (!b) return;
      const det = $(".detail", b.closest(".card"));
      if (det.classList.toggle("hidden")) { b.textContent = "展开"; return; }
      b.textContent = "收起";
      const e = list[+b.dataset.i];
      det.innerHTML = `<div class="ai-box mt" style="background:var(--surface-2);font-family:var(--font-en);white-space:pre-wrap">${esc(e.text)}</div>` + this.resultHtml(e.result).replace('class="card"', 'class="mt"');
    };
  },
};
