// 雅思写作模考：Task 2 议论文（40 分钟 / 250 词）、Task 1 学术类图表（20 分钟 / 150 词，软件自己画图）、Task 1 培训类书信
// 计时、实时字数、草稿自动保存；AI 按四项评分标准估分，标出原文里的错误，给词汇升级和 Band 7+ 范文
// 路由：#/iwrite · #/iwrite/<t2|t1a|t1g>[/<题号>]
const IW_TASKS = {
  t2: { name: "Task 2 议论文", en: "Task 2 essay", mins: 40, min: 250, crit: "Task Response" },
  t1a: { name: "Task 1 学术类 · 图表", en: "Academic Task 1 chart description", mins: 20, min: 150, crit: "Task Achievement" },
  t1g: { name: "Task 1 培训类 · 书信", en: "General Training Task 1 letter", mins: 20, min: 150, crit: "Task Achievement" },
};
const IW_CRIT = [
  ["ta", "任务完成", "回应了题目所有部分吗？观点明确、论证展开（Task 1：概述清楚、抓住主要特征和数据比较）"],
  ["cc", "连贯与衔接", "分段合理、每段一个中心，连接词和指代自然、不生硬"],
  ["lr", "词汇丰富度", "用词准确多样，搭配地道，拼写正确，会换说法"],
  ["gra", "语法多样性与准确性", "复杂句、从句用得多且正确，无错句比例高"],
];
const IW_LINKERS = "however|moreover|furthermore|in addition|therefore|consequently|as a result|for example|for instance|in contrast|on the other hand|whereas|while|although|nevertheless|in conclusion|to sum up|overall|firstly|secondly|finally|meanwhile|similarly|likewise|thus|hence|in particular|that is to say".split("|");
const IW_COLORS = ["var(--brand)", "var(--info, #3b82f6)", "var(--warn, #f59e0b)", "var(--good, #16a34a)", "#a855f7", "#ef4444"];

// 把题库里的图表数据画成 SVG（折线 / 柱状 / 饼图 / 表格）
function iwChart(c) {
  if (c.type === "table") return `<div class="link-table-wrap"><table class="link-table"><thead><tr>${c.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${c.rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const legend = (names) => `<div class="iw-legend">${names.map((n, i) => `<span><i style="background:${IW_COLORS[i % IW_COLORS.length]}"></i>${esc(n)}</span>`).join("")}</div>`;
  if (c.type === "pie") {
    const names = c.pies[0][1].map(([n]) => n);
    const pie = ([label, parts]) => {
      const tot = parts.reduce((s, [, v]) => s + v, 0);
      let a = -Math.PI / 2;
      const segs = parts.map(([n, v], i) => {
        const b = a + (v / tot) * Math.PI * 2, large = b - a > Math.PI ? 1 : 0, m = (a + b) / 2;
        const p = (r, t) => `${(100 + r * Math.cos(t)).toFixed(1)},${(100 + r * Math.sin(t)).toFixed(1)}`;
        const s = `<path d="M100,100 L${p(90, a)} A90,90 0 ${large} 1 ${p(90, b)} Z" fill="${IW_COLORS[names.indexOf(n) % IW_COLORS.length]}" stroke="var(--surface)" stroke-width="1.5"/>`
          + (v / tot > 0.04 ? `<text x="${p(62, m).split(",")[0]}" y="${p(62, m).split(",")[1]}" class="iw-pie-t">${v}${c.unit === "%" ? "%" : ""}</text>` : "");
        a = b;
        return s;
      }).join("");
      return `<div class="iw-pie"><svg viewBox="0 0 200 200" width="190">${segs}</svg><b>${esc(label)}</b></div>`;
    };
    return `<div class="iw-pies">${c.pies.map(pie).join("")}</div>` + legend(names);
  }
  const W = 520, H = 270, L = 46, B = 30, T = 24, R = 10;
  const vals = c.series.flatMap(([, v]) => v), max0 = Math.max(...vals);
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((s) => max0 / s <= 6) || 1000;
  const max = Math.ceil(max0 / step) * step;
  const y = (v) => T + (H - T - B) * (1 - v / max), n = c.x.length, cw = (W - L - R) / n;
  let g = "";
  for (let v = 0; v <= max + 1e-9; v += step) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="iw-grid"/><text x="${L - 6}" y="${y(v) + 4}" class="iw-ax" text-anchor="end">${+v.toFixed(2)}</text>`;
  g += c.x.map((x, i) => `<text x="${L + cw * (i + 0.5)}" y="${H - 10}" class="iw-ax" text-anchor="middle">${esc(x)}</text>`).join("");
  if (c.type === "line") {
    g += c.series.map(([, v], si) => {
      const col = IW_COLORS[si % IW_COLORS.length], pts = v.map((d, i) => `${L + cw * (i + 0.5)},${y(d)}`);
      return `<polyline points="${pts.join(" ")}" fill="none" stroke="${col}" stroke-width="2.5"/>` + pts.map((p) => `<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="3.5" fill="${col}"/>`).join("");
    }).join("");
  } else {
    const k = c.series.length, bw = Math.min(26, (cw * 0.8) / k);
    g += c.series.map(([, v], si) => v.map((d, i) => {
      const x = L + cw * (i + 0.5) - (bw * k) / 2 + bw * si;
      return `<rect x="${x}" y="${y(d)}" width="${bw - 2}" height="${y(0) - y(d)}" fill="${IW_COLORS[si % IW_COLORS.length]}" rx="2"><title>${d}</title></rect>`;
    }).join("")).join("");
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="iw-svg"><text x="4" y="12" class="iw-ax">${esc(c.unit || "")}</text>${g}</svg>` + legend(c.series.map(([s]) => s));
}

App.pages.iwrite = {
  render(root, params, signal) {
    if (IW_TASKS[params[0]]) return this.write(root, signal, params[0], params[1]);
    this.home(root);
  },

  bank(t) { return t === "t2" ? IELTS_WRITE.t2 : t === "t1a" ? IELTS_WRITE.t1a : IELTS_WRITE.t1g; },

  home(root) {
    const H = Store.data.iwrite || [], D = Store.data.iwrite_draft;
    root.innerHTML = `<a class="back-link" href="#/ielts">‹ 返回雅思</a>` + pageHead("✍️ 雅思写作模考", "按考试的时间和字数要求写，写完 AI 按四项评分标准估分、改错，再给一篇高分范文对照") + `
      ${D?.text ? `<div class="card iw-draft"><div class="row"><span>📝 有一篇没写完的 <b>${IW_TASKS[D.t].name}</b>（${tokens(D.text).length} 词，${D.date}）</span><span class="spacer"></span>
        <a class="btn sm primary" href="#/iwrite/${D.t}/draft">继续写</a><button class="btn sm ghost" id="drop">删掉草稿</button></div></div>` : ""}
      <div class="grid grid-3">
        ${Object.entries(IW_TASKS).map(([t, x]) => `<div class="card sp-course"><div class="sp-ico">${t === "t2" ? "🗞️" : t === "t1a" ? "📊" : "✉️"}</div><b>${x.name}</b>
          <div class="small muted">${t === "t2" ? "观点题、讨论题、利弊题、问题解决、双问题五类，共 " + IELTS_WRITE.t2.length + " 题" : t === "t1a" ? "折线图、柱状图、饼图、表格，图由软件画出，共 " + IELTS_WRITE.t1a.length + " 题" : "投诉、请求、建议、求职等正式 / 非正式书信，共 " + IELTS_WRITE.t1g.length + " 题"}</div>
          <div class="small faint mt-s">${x.mins} 分钟 · 至少 ${x.min} 词</div>
          <div class="row mt-s" style="gap:6px;flex-wrap:wrap"><a class="btn sm soft" href="#/iwrite/${t}">🎲 随机一题</a>${AI.enabled ? `<a class="btn sm ghost" href="#/iwrite/${t}/ai">🤖 AI 出新题</a>` : ""}</div></div>`).join("")}
      </div>
      <div class="grid grid-2 mt">
        <div class="card"><div class="card-title">📏 四项评分标准（各占 25%）</div>
          ${IW_CRIT.map(([, zh, d]) => `<div class="isp-crit"><b>${zh}</b><div class="small muted">${d}</div></div>`).join("")}
          <div class="small faint mt-s">真实考试中 Task 2 的分数权重是 Task 1 的两倍；字数不够会被扣分。</div></div>
        <div class="card"><div class="card-title">🧱 常用结构</div>
          <ul class="small muted isp-tips">
            <li><b>Task 2</b>：开头（改写题目 + 表明立场）→ 主体 2 段（每段：中心句 + 解释 + 例子）→ 结尾（总结立场）</li>
            <li><b>Task 1 图表</b>：改写题目 → <b>概述段（Overall, …）写出 2 个最主要的趋势</b> → 2 段细节（数据比较）。不写个人观点</li>
            <li><b>Task 1 书信</b>：称呼 → 说明写信目的 → 逐条回应三个要点 → 结尾句 + 落款。正式信用 Dear Sir or Madam / Yours faithfully</li>
            <li>想练句子可以去「写作 → 中译英」里的雅思写作 100 句</li>
          </ul></div>
      </div>
      <div class="card mt"><div class="card-title">📜 写作记录</div><div id="hist">${H.length ? "" : `<div class="small faint">还没有记录</div>`}</div></div>`;
    $("#drop", root)?.addEventListener("click", async () => { if (await confirmBox("删掉草稿？", "没写完的内容会被清除。", "删除")) { delete Store.data.iwrite_draft; Store.save(); this.home(root); } });
    const hist = $("#hist", root);
    if (!H.length) return;
    hist.innerHTML = H.map((h, i) => `<div class="isp-hist"><div class="row"><b>${IW_TASKS[h.t].name}</b><span class="badge">${h.date}</span>${h.band ? `<span class="badge brand">Band ${h.band}</span>` : ""}
        <span class="small muted">${h.words} 词 · 用时 ${Math.round(h.secs / 60)} 分钟</span><span class="spacer"></span><button class="btn sm ghost" data-i="${i}">展开</button></div>
        <div class="small muted en mt-s">${esc(h.task.q || h.task.title || "").slice(0, 140)}…</div><div class="detail hidden"></div></div>`).join("");
    hist.onclick = (e) => {
      const b = e.target.closest("[data-i]");
      if (!b) return;
      const det = $(".detail", b.closest(".isp-hist"));
      if (det.classList.toggle("hidden")) { b.textContent = "展开"; return; }
      b.textContent = "收起";
      const h = H[+b.dataset.i];
      det.innerHTML = `<div class="mt-s">${this.taskHtml(h.t, h.task)}</div><div class="iw-essay mt-s">${h.ai ? this.markErrors(h.text, h.ai.errors) : esc(h.text)}</div>` + (h.ai ? this.aiHtml(h.t, h.ai) : "");
      bindWordClicks(det);
    };
  },

  taskHtml(t, task) {
    if (t === "t2") return `<div class="iw-task"><div class="small muted">Write about the following topic:</div><p class="en"><b>${esc(task.q)}</b></p>
      <div class="small muted">Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.</div>${task.type ? `<span class="badge mt-s">${esc(task.type)}</span>` : ""}</div>`;
    if (t === "t1g") return `<div class="iw-task"><p class="en">${esc(task.q.split(" In your letter:")[0])}</p>
      ${task.q.includes("In your letter:") ? `<div class="en small">In your letter:<ul>${task.q.split("In your letter:")[1].split(";").map((x) => `<li>${esc(x.trim().replace(/\.$/, ""))}</li>`).join("")}</ul></div>` : ""}
      <div class="small muted">Write at least 150 words. You do NOT need to write any addresses. Begin your letter as follows: <i>Dear ……,</i></div>${task.tone ? `<span class="badge mt-s">语气：${esc(task.tone)}</span>` : ""}</div>`;
    return `<div class="iw-task"><p class="en">The ${task.type === "table" ? "table" : task.type === "pie" ? "charts" : task.type === "line" ? "graph" : "chart"} below shows ${esc(task.title.charAt(0).toLowerCase() + task.title.slice(1))}.</p>
      <p class="en small">Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.</p>
      <div class="iw-chart"><div class="iw-ctitle">${esc(task.title)}</div>${iwChart(task)}</div></div>`;
  },

  async write(root, signal, t, idx) {
    const X = IW_TASKS[t], bank = this.bank(t), D = Store.data.iwrite_draft;
    let task, i = idx, draft = null;
    if (idx === "draft" && D?.t === t) { draft = D; task = D.task; i = D.i; }
    else if (idx === "ai") {
      root.innerHTML = `<a class="back-link" href="#/iwrite">‹ 返回</a><div class="card">${aiLoading("AI 正在出题……")}</div>`;
      const spec = t === "t2" ? `{"type": "观点题|讨论题|利弊题|问题解决|双问题", "q": "the full task prompt"}`
        : t === "t1g" ? `{"tone": "正式|半正式|非正式", "q": "situation sentence. Write a letter to .... In your letter: point one; point two; point three."}`
        : `{"title": "chart title", "type": "line|bar|pie|table", "unit": "% or unit",
  "x": ["category or year labels"], "series": [["series name", [numbers, one per x label]]],  // for line / bar, 2-4 series
  "pies": [["label such as a year", [["segment", number], ...]]],  // for pie only, 1-2 pies, percentages summing to 100
  "head": ["column headers"], "rows": [["cells"]]}  // for table only`;
      const r = await AI.json("You are an experienced IELTS writing test writer. Write ORIGINAL tasks in the style of the real test (never copy published tests).",
        `Write one new IELTS ${X.en} task on a topic common in recent tests (not: ${pick(bank).q || pick(bank).title}). Return JSON: ${spec}`);
      if (signal.aborted) return;
      if (!r.ok || !(r.data.q || r.data.series || r.data.pies || r.data.rows)) { toast(r.ok ? "AI 出的题格式不对，先用题库的题" : r.error, "bad", 4000); i = null; }
      else task = r.data;
    }
    if (!task) {
      if (i == null || i === "ai" || i === "draft" || !bank[+i]) i = Math.floor(Math.random() * bank.length);
      task = bank[+i];
    }
    let secs = draft?.secs || 0, timer = null, saveT = null, done = false;
    root.innerHTML = `<a class="back-link" href="#/iwrite">‹ 返回写作模考</a>` + pageHead(`✍️ ${X.name}`, `${X.mins} 分钟 · 至少 ${X.min} 词`,
      `<button class="btn ghost" id="other">换一题</button>`) + `
      <div class="iw-layout">
        <div class="card iw-left">${this.taskHtml(t, task)}
          ${t === "t2" ? `<details class="mt"><summary class="small muted">💡 卡住了？看看思路提示</summary><div class="small muted mt-s">先判断题型（${esc(task.type || "")}），确定立场；写下 2 个理由，每个理由想一个具体例子（个人经历、新闻、常识都可以）。开头不要照抄题目，换个说法。</div></details>` : ""}</div>
        <div class="card iw-right">
          <div class="row iw-bar"><span class="iw-clock" id="clock">${ispFmt(X.mins * 60)}</span><span class="small muted">剩余时间</span><span class="spacer"></span>
            <span class="iw-count" id="count">0 / ${X.min} 词</span></div>
          <div class="bar"><i id="tbar" style="width:0"></i></div>
          <textarea class="textarea en iw-ta mt-s" id="ta" spellcheck="false" placeholder="${t === "t1g" ? "Dear Sir or Madam,\n\nI am writing to…" : "Start writing here…"}">${esc(draft?.text || "")}</textarea>
          <div class="row mt-s"><span class="small faint" id="saved">草稿会自动保存</span><span class="spacer"></span>
            <button class="btn primary" id="submit">${AI.enabled ? "交卷，AI 评分" : "交卷"}</button></div></div>
      </div><div id="result"></div>`;
    const ta = $("#ta", root), count = $("#count", root);
    const upd = () => {
      const n = tokens(ta.value).length;
      count.textContent = `${n} / ${X.min} 词`;
      count.classList.toggle("good-text", n >= X.min);
    };
    upd();
    const save = () => {
      if (done) return;
      if (ta.value.trim()) Store.data.iwrite_draft = { t, i, task, text: ta.value, secs: Math.round(secs), date: today() };
      Store.save();
      $("#saved", root).textContent = `草稿已保存 ${new Date().toTimeString().slice(0, 5)}`;
    };
    ta.addEventListener("input", () => { upd(); clearTimeout(saveT); saveT = setTimeout(save, 2000); });
    // 开始打字才计时
    const tick = () => {
      secs++;
      const left = X.mins * 60 - secs, c = $("#clock", root);
      if (!c) return clearInterval(timer);
      c.textContent = left >= 0 ? ispFmt(left) : `+${ispFmt(-left)}`;
      c.classList.toggle("bad-text", left < 0);
      c.classList.toggle("warn-text", left >= 0 && left < 300);
      $("#tbar", root).style.width = `${Math.min(100, (secs / (X.mins * 60)) * 100)}%`;
      if (left === 0) toast("时间到了！真实考试这时候就要停笔了，可以交卷看看", "", 5000);
    };
    ta.addEventListener("input", () => { if (!timer && !done) timer = setInterval(tick, 1000); });
    $("#other", root).onclick = async () => {
      if (ta.value.trim() && !(await confirmBox("换一题？", "现在这篇会作为草稿保留，换题后会被新的草稿覆盖。", "换一题"))) return;
      const cur = +i, n = Math.floor(Math.random() * bank.length);
      Router.go(`iwrite/${t}/${n === cur ? (n + 1) % bank.length : n}`);
    };
    signal.addEventListener("abort", () => { clearInterval(timer); clearTimeout(saveT); if (!done && ta.value.trim()) save(); });

    $("#submit", root).onclick = async (evt) => {
      const btn = evt.currentTarget, text = ta.value.trim(), n = tokens(text).length;
      if (n < 40) return toast("至少写 40 个词再交卷吧");
      if (n < X.min && !(await confirmBox("字数不够", `现在 ${n} 词，考试要求至少 ${X.min} 词，不够会在「任务完成」上扣分。还是要交卷吗？`, "交卷"))) return;
      clearInterval(timer);
      done = true;
      ta.readOnly = true;
      btn.disabled = true;
      const rec = { t, date: today(), task, text, words: n, secs: Math.round(secs) };
      (Store.data.iwrite ||= []).unshift(rec);
      Store.data.iwrite = Store.data.iwrite.slice(0, 30);
      delete Store.data.iwrite_draft;
      Store.data.stats.essay++;
      addXP(10, null, evt);
      Store.save();
      const res = $("#result", root);
      res.innerHTML = this.offlineHtml(t, text, secs) + (AI.enabled ? `<div class="card" id="ai-box">${aiLoading("AI 考官正在评分，大约 20–60 秒……")}</div>` : `<div class="card small muted">接入 AI 后可以按四项标准估分、逐句改错、给范文。</div>`)
        + `<div class="row mt" style="justify-content:center;gap:8px"><a class="btn primary" href="#/iwrite/${t}">再写一篇</a><a class="btn ghost" href="#/iwrite">返回</a></div>`;
      res.scrollIntoView({ behavior: "smooth" });
      if (AI.enabled) this.grade(root, signal, rec);
    };
  },

  // 不用 AI 也能算的指标：字数、段落、平均句长、连接词、用词重复
  offlineHtml(t, text, secs) {
    const X = IW_TASKS[t], ws = tokens(text), low = ws.map((w) => w.toLowerCase());
    const paras = text.split(/\n\s*\n|\n/).filter((p) => p.trim()).length;
    const sents = text.split(/[.!?]+(\s|$)/).filter((s) => s && s.trim().length > 2).length || 1;
    const lt = text.toLowerCase(), linkers = IW_LINKERS.filter((l) => new RegExp(`\\b${l}\\b`).test(lt));
    const freq = {};
    low.filter((w) => w.length > 4 && !/^(which|their|there|these|those|about|would|could|should|other|people)$/.test(w)).forEach((w) => (freq[w] = (freq[w] || 0) + 1));
    const rep = Object.entries(freq).filter(([, c]) => c >= 4).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const notes = [];
    if (ws.length < X.min) notes.push(`字数 ${ws.length}，不到 ${X.min} 词，「任务完成」会被扣分。`);
    if (paras < (t === "t2" ? 4 : 3)) notes.push(`只分了 ${paras} 段，${t === "t2" ? "Task 2 建议 4–5 段（开头、2–3 段主体、结尾）" : "Task 1 建议 3–4 段"}。`);
    if (t === "t1a" && !/\b(overall|in general|in summary|it is clear that|it is evident)\b/i.test(text)) notes.push("没找到概述句（Overall, …），图表作文没有概述很难超过 5 分。");
    if (ws.length / sents > 28) notes.push(`平均句长 ${Math.round(ws.length / sents)} 词，句子偏长，检查有没有逗号连接两个完整句（run-on sentence）。`);
    if (ws.length / sents < 11) notes.push(`平均句长 ${Math.round(ws.length / sents)} 词，句子偏短，试着用从句或分词结构把句子合起来。`);
    if (linkers.length < 3) notes.push("连接词偏少，可以用 however / moreover / as a result / for example 让逻辑更清楚。");
    if (/\b(i think|in my opinion)\b/i.test(text) && t === "t1a") notes.push("图表作文不需要个人观点，只客观描述数据。");
    return `<div class="card mt"><div class="card-title">📊 自动检查</div>
      <div class="isp-stats">${[[ws.length, "词"], [paras, "段"], [Math.round(ws.length / sents), "平均句长"], [linkers.length, "种连接词"], [Math.round(secs / 60), "分钟"]].map(([v, l]) => `<div class="isp-stat"><b>${v}</b><span>${l}</span></div>`).join("")}</div>
      ${notes.length ? `<ul class="small mt-s">${notes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<div class="small good-text mt-s">字数、分段、句长都没问题 👍</div>`}
      ${linkers.length ? `<div class="small muted">用到的连接词：${linkers.map((l) => `<span class="en">${esc(l)}</span>`).join("、")}</div>` : ""}
      ${rep.length ? `<div class="small muted">重复较多的词：${rep.map(([w, c]) => `<span class="en">${esc(w)}</span> ×${c}`).join("、")}（可以换同义词）</div>` : ""}</div>`;
  },

  async grade(root, signal, rec) {
    const X = IW_TASKS[rec.t], box = $("#ai-box", root);
    const task = rec.t === "t1a" ? `${rec.task.title}\nData: ${JSON.stringify(rec.task.type === "table" ? { head: rec.task.head, rows: rec.task.rows } : rec.task.type === "pie" ? rec.task.pies : { x: rec.task.x, series: rec.task.series, unit: rec.task.unit })}` : rec.task.q;
    const r = await AI.json(`You are a certified, strict but encouraging IELTS writing examiner giving feedback to a Chinese learner. ${LEARNER_PROFILE} Use the official public IELTS Writing band descriptors for ${rec.t === "t2" ? "Task 2" : rec.t === "t1a" ? "Academic Task 1" : "General Training Task 1"}. Be realistic: do not inflate scores; under-length answers are penalised.`,
      `Task (${X.mins} minutes, at least ${X.min} words):
${task}

Candidate's answer (${rec.words} words, written in ${Math.round(rec.secs / 60)} minutes):
"""
${rec.text}
"""
Return JSON:
{"ta": {"band": 5.5, "comment": "中文，2-3 句，具体说明为什么是这个分"}, "cc": {...same}, "lr": {...same}, "gra": {...same},
 "summary": "中文总评，2-3 句，先肯定优点再说最该提升的一点",
 "errors": [{"original": "exact text copied from the answer", "corrected": "corrected text", "type": "语法|用词|拼写|搭配|标点", "explain": "中文简短解释"}],  // up to 12 most important, 'original' must match the answer exactly
 "vocab": [{"from": "plain word/phrase the candidate used", "to": "more precise or academic alternative", "note": "中文"}],  // up to 6
 "structure": "中文：结构和段落的具体建议（开头、主体段、结尾或概述段）",
 "model": "a Band 8 model answer to the same task, about ${X.min + 30} words, with paragraphs separated by blank lines",
 "tips": ["中文的具体提升建议", "..."]}  // 3
Bands are 0-9 in steps of 0.5.`);
    if (signal.aborted || !box) return;
    if (!r.ok) { box.innerHTML = `${aiError(r.error)}<button class="btn sm mt-s" id="retry">重试</button>`; $("#retry", box).onclick = () => { box.innerHTML = aiLoading("AI 考官正在评分……"); this.grade(root, signal, rec); }; return; }
    const d = r.data;
    d.band = ispBand(IW_CRIT.map(([k]) => +d[k]?.band || 0));
    rec.band = d.band;
    rec.ai = d;
    Store.save();
    box.outerHTML = `<div class="card"><div class="card-title">📝 批改后的原文 <span class="small faint">（标黄的地方有错误，鼠标移上去看改法）</span></div><div class="iw-essay">${this.markErrors(rec.text, d.errors)}</div></div>` + this.aiHtml(rec.t, d);
    bindWordClicks($("#result", root));
  },

  // 在原文中标出错误
  markErrors(text, errors = []) {
    const spans = [];
    (errors || []).forEach((e, n) => {
      const at = e.original ? text.indexOf(e.original) : -1;
      if (at >= 0 && !spans.some((s) => at < s.b && at + e.original.length > s.a)) spans.push({ a: at, b: at + e.original.length, e, n });
    });
    spans.sort((x, y) => x.a - y.a);
    let out = "", p = 0;
    spans.forEach((s) => {
      out += esc(text.slice(p, s.a)) + `<mark class="iw-err" title="${esc(`${s.e.corrected}  —  ${s.e.explain || ""}`)}">${esc(text.slice(s.a, s.b))}<sup>${s.n + 1}</sup></mark>`;
      p = s.b;
    });
    return out + esc(text.slice(p));
  },

  aiHtml(t, d) {
    const crit = IW_CRIT.map(([k, zh], j) => [k, j === 0 ? `${zh}（${IW_TASKS[t].crit}）` : zh]);
    return `<div class="card isp-ai mt">
      <div class="row"><div class="ib-big">${d.band}</div><div><b>预估分数</b><div class="muted small">${esc(d.summary || "")}</div></div></div>
      <div class="ib-crits">${crit.map(([k, zh]) => `<div class="ib-crit"><div class="row"><b>${zh}</b><span class="spacer"></span><span class="ib-band">${d[k]?.band ?? "—"}</span></div>
        <div class="small muted">${esc(d[k]?.comment || "")}</div></div>`).join("")}</div>
      ${(d.errors || []).length ? `<div class="card-title mt">🔧 逐条改错</div>${d.errors.map((e, n) => `<div class="correction"><sup>${n + 1}</sup> <span class="from">${esc(e.original)}</span> → <span class="to">${esc(e.corrected)}</span>${e.type ? ` <span class="badge">${esc(e.type)}</span>` : ""}<div class="small muted">${esc(e.explain || "")}</div></div>`).join("")}` : ""}
      ${(d.vocab || []).length ? `<div class="card-title mt">📈 词汇升级</div>${d.vocab.map((v) => `<div class="iw-vocab"><span class="en from">${esc(v.from)}</span> → <span class="en to">${esc(v.to)}</span> ${speakBtn(v.to, "sm")}<span class="small muted">${esc(v.note || "")}</span></div>`).join("")}` : ""}
      ${d.structure ? `<div class="card-title mt">🧱 结构建议</div><div class="small muted">${esc(d.structure)}</div>` : ""}
      ${d.model ? `<div class="card-title mt">✨ 高分范文 ${speakBtn(d.model, "sm")}</div><div class="iw-essay iw-model" data-text="${esc(d.model)}">${d.model.split(/\n+/).filter(Boolean).map((p) => `<p>${wrapWords(p)}</p>`).join("")}</div>` : ""}
      ${(d.tips || []).length ? `<div class="card-title mt">💡 提升建议</div><ul class="small muted">${d.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="small faint mt-s">AI 估分仅供参考，和真实考官会有 0.5–1 分的出入。</div></div>`;
  },
};
