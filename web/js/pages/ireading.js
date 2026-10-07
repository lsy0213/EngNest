// 雅思阅读练习（软件内）：题库来自 IELTS-practice（GitHub sallowayma-git/IELTS-practice，个人学习用），
// 在「雅思」页下载到数据目录的 cache/ext/ielts-practice/ 后，这里读它的题库数据，用软件自己的界面做题：
// 左边文章、右边题目，计时、交卷判分、逐题解析、段落翻译，成绩记在 Store.data.ireading
// 路由：#/ireading 题库 · #/ireading/<题目 id> 做题
const IR = {
  EXT: "ielts-practice",
  DIR: "assets/generated/",
  cache: {},
  // 读题库数据：题库文件是「往全局注册」的 JS，由 Python 只解析里面的数据（不执行下载来的代码），只能在电脑上用
  async data(rel) {
    if (!Store.bridge || Store.remote) return null;
    try { return await pywebview.api.ext_data(this.EXT, this.DIR + rel); } catch { return null; }
  },
  async base() {
    if (this._base !== undefined) return this._base;
    this._base = Store.bridge && !Store.remote ? (await pywebview.api.ext_base(this.EXT)) + this.DIR : `ext/${this.EXT}/${this.DIR}`;
    return this._base;
  },
  async index() {
    if (this._index) return this._index;
    const m = await this.data("reading-exams/manifest.js");
    if (!m) return null;
    const freq = (f) => ({ low: "低频", 低频: "低频", 中频: "中频", 次高频: "次高频", 高频: "高频" }[f] || f || "");
    this._index = (m.index || []).filter((e) => e.type !== "listening")
      .map((e) => ({ id: e.id, title: e.title, cat: e.category, freq: freq(e.frequency), diff: e.difficultyScore || 0 }));
    return this._index;
  },
  async exam(id) {
    if (this.cache[id]) return this.cache[id];
    const d = await this.data(`reading-exams/${id}.js`);
    if (!d || d.id !== id) return null;
    const e = await this.data(`reading-explanations/${id}.js`);
    return (this.cache[id] = { exam: d.data, expl: e?.id === id ? e.data : null });
  },
};

// 题目里的 HTML 来自下载的题库：去掉脚本和事件属性，去掉泄露答案的 data-answer，拖拽题改成下拉框
function irClean(html, base) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html || "";
  tpl.content.querySelectorAll("script, style, link, iframe").forEach((n) => n.remove());
  tpl.content.querySelectorAll("*").forEach((n) => {
    for (const a of [...n.attributes]) if (/^on/i.test(a.name) || a.name === "data-answer") n.removeAttribute(a.name);
    if (n.tagName === "IMG") { const src = n.getAttribute("src") || ""; if (!/^(https?:|data:)/.test(src)) n.setAttribute("src", base + "reading-exams/" + src.replace(/^\.\//, "")); }
    if (n.tagName === "INPUT" && (n.type === "text" || !n.getAttribute("type"))) { n.setAttribute("autocomplete", "off"); n.setAttribute("spellcheck", "false"); }
    n.removeAttribute("draggable");
  });
  return tpl.innerHTML;
}

App.pages.ireading = {
  async render(root, params, signal) {
    root.classList.add("page-wide");
    root.innerHTML = `<div class="card center muted" style="padding:40px">正在读取题库……</div>`;
    const idx = await IR.index();
    if (signal.aborted) return;
    if (!idx) {
      root.innerHTML = `<a class="back-link" href="#/ielts">‹ 返回雅思</a>` + pageHead("🧪 雅思阅读练习", "") + `
        <div class="card empty"><div class="big">📦</div><h3>还没有下载题库</h3>
        <p>题库来自 GitHub 上的 IELTS-practice（约 35 MB），下载一次就能一直离线用。</p><a class="btn primary" href="#/ielts">去「雅思」页下载</a></div>`;
      return;
    }
    if (params[0]) return this.practice(root, params[0], signal);
    this.list(root, idx);
  },

  // ---------- 题库 ----------
  list(root, idx) {
    const P = Store.prefs, R = Store.data.ireading || {};
    P.ir_cat ||= "all"; P.ir_freq ||= "all"; P.ir_done ||= "all";
    const chips = (key, items) => items.map(([v, l]) => `<button class="chip ${P[key] === v ? "active" : ""}" data-k="${key}" data-v="${v}">${l}</button>`).join("");
    const done = Object.keys(R).length, avg = done ? Math.round((Object.values(R).reduce((n, r) => n + r.best / r.total, 0) / done) * 100) : 0;
    root.innerHTML = `<a class="back-link" href="#/ielts">‹ 返回雅思</a>`
      + pageHead("🧪 雅思阅读练习", `${idx.length} 篇真题风格的文章，左边读文章、右边做题，交卷后看解析和段落翻译`)
      + `<div class="card ir-stat"><span>做过 <b>${done}</b> 篇</span><span>平均正确率 <b>${avg}%</b></span>
          <span class="small muted">建议：每篇限时 20 分钟，先做高频的；做完一定看错题解析里的「定位」，练的就是找同义替换</span></div>
        <div class="ir-filters">
          <div class="chips">${chips("ir_cat", [["all", "全部"], ["P1", "Passage 1"], ["P2", "Passage 2"], ["P3", "Passage 3"]])}</div>
          <div class="chips">${chips("ir_freq", [["all", "全部频率"], ["高频", "高频"], ["次高频", "次高频"], ["中频", "中频"], ["低频", "低频"]])}</div>
          <div class="chips">${chips("ir_done", [["all", "全部"], ["todo", "没做过"], ["done", "做过"], ["wrong", "正确率低于 70%"]])}</div>
          <input class="input" id="ir-q" placeholder="搜索标题（英文或中文）" style="max-width:260px">
        </div>
        <div class="ir-grid" id="ir-grid"></div>`;
    const grid = $("#ir-grid", root);
    const draw = () => {
      const q = $("#ir-q", root).value.trim().toLowerCase();
      const list = idx.filter((e) => (P.ir_cat === "all" || e.cat === P.ir_cat) && (P.ir_freq === "all" || e.freq === P.ir_freq)
        && (P.ir_done === "all" || (P.ir_done === "todo" ? !R[e.id] : P.ir_done === "done" ? !!R[e.id] : R[e.id] && R[e.id].best / R[e.id].total < 0.7))
        && (!q || e.title.toLowerCase().includes(q)));
      grid.innerHTML = list.length ? list.map((e) => {
        const r = R[e.id];
        return `<a class="card ir-card ${r ? "done" : ""}" href="#/ireading/${e.id}">
          <div class="row" style="gap:6px"><span class="badge brand">${esc(e.cat)}</span><span class="badge">${esc(e.freq)}</span><span class="spacer"></span>
            ${r ? `<span class="small ${r.best / r.total >= 0.7 ? "good-text" : "bad-text"}">${r.best} / ${r.total}</span>` : `<span class="small faint">难度 ${e.diff}</span>`}</div>
          <div class="ir-title">${esc(e.title)}</div></a>`;
      }).join("") : `<p class="muted">没有符合条件的文章。</p>`;
    };
    root.addEventListener("click", (e) => {
      const c = e.target.closest("[data-k]");
      if (!c) return;
      P[c.dataset.k] = c.dataset.v;
      Store.save();
      $$(`[data-k="${c.dataset.k}"]`, root).forEach((x) => x.classList.toggle("active", x === c));
      draw();
    });
    $("#ir-q", root).oninput = draw;
    draw();
  },

  // ---------- 做题 ----------
  async practice(root, id, signal) {
    const data = await IR.exam(id);
    if (signal.aborted) return;
    if (!data?.exam) { root.innerHTML = `<div class="card">没有找到这篇文章。<a href="#/ireading">返回题库</a></div>`; return; }
    const { exam, expl } = data, base = await IR.base();
    const meta = (await IR.index()).find((e) => e.id === id) || {};
    const groups = exam.questionGroups || [];
    const order = exam.questionOrder || Object.keys(exam.answerKey || {});
    const label = (q) => exam.questionDisplayMap?.[q] || q.replace(/^q/, "");
    const qGroup = {};
    groups.forEach((g) => g.questionIds.forEach((q) => (qGroup[q] = g)));
    const passageHtml = exam.passage.blocks.map((b) => (b.kind === "html" ? b.html : `<p>${esc(b.text || "")}</p>`)).join("");

    root.innerHTML = `
      <div class="ir-top">
        <a class="btn ghost sm" href="#/ireading">‹ 题库</a>
        <b class="ir-top-title">${esc(exam.meta?.title || meta.title || id)}</b><span class="badge brand">${esc(meta.cat || "")}</span><span class="badge">${esc(meta.freq || "")}</span>
        <span class="spacer"></span>
        <span class="ir-timer" id="ir-timer" title="点一下暂停 / 继续">⏱ 20:00</span>
        <label class="small row" style="gap:4px;cursor:pointer"><input type="checkbox" id="ir-zh"> 段落翻译</label>
        <button class="btn primary" id="ir-submit">交卷</button>
      </div>
      <div class="ir-split">
        <div class="ir-passage card" id="ir-passage">${irClean(passageHtml, base)}</div>
        <div class="ir-questions card" id="ir-questions">
          ${groups.map((g) => `<div class="ir-group" data-g="${esc(g.groupId)}">${irClean(g.bodyHtml, base)}</div>`).join("")}
          <div id="ir-result"></div>
        </div>
      </div>`;
    const pass = $("#ir-passage", root), qs = $("#ir-questions", root);

    // 拖拽题 → 下拉框：每个放置框按所在题组的选项池生成选项
    const poolOf = (g) => {
      const tpl = document.createElement("template");
      tpl.innerHTML = g.bodyHtml;
      return [...tpl.content.querySelectorAll(".drag-item")].map((d) => {
        const v = d.dataset.heading || d.dataset.option || d.dataset.word || d.textContent.trim();
        return [v, d.textContent.trim().replace(/\s+/g, " ")];
      });
    };
    // 放置框有好几种写法（.dropzone、.match-dropzone、.paragraph-dropzone、摘要里的 .drop-target-summary）：
    // 凡是带 data-question、本身不是输入框、里面也没有输入框的，都当放置框
    $$("[data-question]", root).forEach((z) => {
      if (z.matches("input, select, textarea") || z.querySelector("input, select, textarea")) return;
      const q = z.dataset.question, g = qGroup[q];
      if (!g) return;
      const sel = document.createElement("select");
      sel.className = "select ir-drop";
      sel.dataset.q = q;
      sel.innerHTML = `<option value="">第 ${esc(label(q))} 题：选择…</option>` + poolOf(g).map(([v, t]) => `<option value="${esc(v)}">${esc(t.length > 70 ? t.slice(0, 70) + "…" : t)}</option>`).join("");
      z.querySelectorAll(".dropped-items").forEach((n) => n.remove());
      z.appendChild(sel);
      z.classList.add("ir-zone");
    });
    // 选项池里的拖拽项不能拖了，只当参考列表；「把标题拖到……」的说明改成下拉框的说法
    $$(".drag-item", root).forEach((d) => d.classList.add("ir-pool-item"));
    $$("#ir-questions p, #ir-questions em, #ir-questions li", root).forEach((n) => {
      if (/drag[\s\S]*drop|drag and drop|drag the/i.test(n.textContent) && !n.querySelector("input, select")) n.innerHTML = "<em>在每道题的下拉框里选择答案。</em>";
    });
    // 原题库里个别文章缺了题目，只能读文章
    const answerable = order.filter((q) => $(`select.ir-drop[data-q="${q}"]`, root) || $(`[name="${q}"]`, root) || $$('#ir-questions input[type="checkbox"]', root).some((c) => c.name.split(/[-_]/).map((x) => (x.startsWith("q") ? x : "q" + x)).includes(q)));
    if (!answerable.length) {
      $("#ir-questions", root).innerHTML = `<div class="empty"><div class="big">📄</div><h3>这篇的题目数据不完整</h3><p>原题库里缺了这篇的题目，可以读文章、打开「段落翻译」对照，或者回题库换一篇。</p><a class="btn primary" href="#/ireading">回题库</a></div>`;
      $("#ir-submit", root).remove();
    }

    // ---------- 计时 ----------
    let left = 20 * 60, paused = false, finished = false;
    const timerEl = $("#ir-timer", root);
    const tick = setInterval(() => {
      if (paused || finished) return;
      left--;
      timerEl.textContent = `⏱ ${left < 0 ? "-" : ""}${Math.floor(Math.abs(left) / 60)}:${String(Math.abs(left) % 60).padStart(2, "0")}`;
      timerEl.classList.toggle("over", left < 0);
      if (left === 0) toast("20 分钟到了（可以继续做，计时会变成超时）", "", 4000);
    }, 1000);
    signal.addEventListener("abort", () => clearInterval(tick));
    timerEl.onclick = () => { paused = !paused; timerEl.classList.toggle("paused", paused); };

    // ---------- 段落翻译（来自解析里的 passageNotes） ----------
    $("#ir-zh", root).onchange = (e) => {
      $$(".ir-note", pass).forEach((n) => n.remove());
      if (!e.target.checked) return;
      const notes = expl?.passageNotes || [];
      if (!notes.length) { toast("这篇没有段落翻译"); e.target.checked = false; return; }
      // 按段落字母插到对应段落后面；找不到的放在文章最后
      const paras = $$("p", pass);
      // 正文段落（去掉「You should spend about 20 minutes…」这类说明和很短的小标题），按「Paragraph 3 / 段落 3」的序号对应
      const body = paras.filter((x) => x.textContent.trim().length > 60 && !/^\s*You should spend/i.test(x.textContent));
      notes.forEach((n) => {
        const letter = (n.label.match(/Paragraph\s+([A-Z])\b/i) || [])[1];
        const num = +((n.label.match(/(?:Paragraph|段落|第)\s*(\d+)/i) || [])[1] || 0);
        const p = (letter && paras.find((x) => new RegExp(`^\\s*${letter}\\b`).test(x.textContent))) || (num && body[num - 1]);
        const div = el(`<div class="ir-note"><b>${esc(n.label)}</b> ${esc(n.text)}</div>`);
        if (p) p.after(div); else pass.appendChild(div);
      });
    };

    // ---------- 判分 ----------
    const norm = (s) => String(s ?? "").toLowerCase().replace(/[’‘]/g, "'").replace(/[^\w\s',.-]/g, " ").replace(/\s+/g, " ").trim().replace(/[.,]$/, "");
    const alts = (a) => (Array.isArray(a) ? a : String(a).split("/")).map(norm).filter(Boolean);
    const answerOf = (q) => {
      const dz = $(`select.ir-drop[data-q="${q}"]`, root);
      if (dz) return dz.value;
      const named = $$(`[name="${q}"]`, root);
      if (named.length) {
        const r = named.find((x) => x.type === "radio");
        if (r) return named.find((x) => x.checked)?.value || "";
        return named[0].value || "";
      }
      return null; // 多选题（checkbox 的 name 是 q11-12-13）另外算
    };
    const submit = () => {
      if (finished) return;
      finished = true;
      const results = {};
      // 多选：一组 checkbox 对应好几道题，选对一个字母算一题
      const boxes = {};
      $$('input[type="checkbox"]', qs).forEach((c) => (boxes[c.name] ||= []).push(c));
      for (const [name, list] of Object.entries(boxes)) {
        const qids = name.split(/[-_]/).map((n) => (n.startsWith("q") ? n : "q" + n)).filter((q) => q in (exam.answerKey || {}));
        const want = new Set(qids.flatMap((q) => alts(exam.answerKey[q])));
        const got = list.filter((c) => c.checked).map((c) => norm(c.value));
        let ok = got.filter((v) => want.has(v)).length;
        qids.forEach((q) => { results[q] = { ok: ok-- > 0, got: got.join(", ").toUpperCase(), want: [...want].join(", ").toUpperCase() }; });
        list.forEach((c) => c.closest("label, li, div")?.classList.add(want.has(norm(c.value)) ? "ir-right" : c.checked ? "ir-wrong" : "ir-x"));
      }
      for (const q of order) {
        if (results[q]) continue;
        const got = answerOf(q);
        if (got === null) continue;
        const want = exam.answerKey?.[q];
        results[q] = { ok: alts(want).includes(norm(got)), got, want: Array.isArray(want) ? want.join(" / ") : want };
      }
      const total = order.length, right = order.filter((q) => results[q]?.ok).length;
      // 在每道题旁边标对错
      for (const q of order) {
        const r = results[q];
        if (!r) continue;
        const ctl = $(`select.ir-drop[data-q="${q}"]`, root) || $(`[name="${q}"]`, root);
        const mark = el(`<span class="ir-mark ${r.ok ? "ok" : "bad"}">${r.ok ? "✓" : `✗ ${esc(String(r.want ?? ""))}`}</span>`);
        if (ctl?.type === "radio") {
          $$(`[name="${q}"]`, root).forEach((x) => { x.disabled = true; const lab = x.closest("label") || x.parentElement; if (norm(x.value) && alts(r.want).includes(norm(x.value))) lab.classList.add("ir-right"); else if (x.checked) lab.classList.add("ir-wrong"); });
          (ctl.closest(".question-item, li, p, div") || ctl.parentElement).appendChild(mark);
        } else if (ctl) {
          ctl.disabled = true;
          ctl.classList.add(r.ok ? "ir-ok" : "ir-bad");
          ctl.after(mark);
        }
      }
      $$("input, select", qs).forEach((x) => (x.disabled = true));
      clearInterval(tick);
      const used = 20 * 60 - left;
      const R = (Store.data.ireading ||= {}), old = R[id];
      R[id] = { best: Math.max(right, old?.best || 0), last: right, total, date: today(), n: (old?.n || 0) + 1, sec: used };
      Store.save();
      addXP(5 + right);
      // 解析
      const expItems = (expl?.questionExplanations || []).flatMap((s) => (s.items || []).map((it) => ({ ...it, section: s.sectionTitle })));
      const wrongFirst = [...expItems].sort((a, b) => (results[a.questionId]?.ok ? 1 : 0) - (results[b.questionId]?.ok ? 1 : 0));
      $("#ir-result", root).innerHTML = `<div class="ir-score">
          <div class="ir-score-num ${right / total >= 0.7 ? "good" : "bad"}">${right}<span>/ ${total}</span></div>
          <div><b>${right / total >= 0.9 ? "太棒了！" : right / total >= 0.7 ? "不错！" : "错题是最好的老师"}</b>
            <div class="small muted">用时 ${Math.floor(used / 60)} 分 ${used % 60} 秒${old ? ` · 上次 ${old.last} / ${old.total}` : ""} · 打开「段落翻译」对照着看</div></div>
          <span class="spacer"></span><button class="btn" id="ir-again">再做一遍</button></div>
        ${wrongFirst.length ? `<div class="ir-expl"><div class="card-title">📘 解析（错题在前）</div>
          ${wrongFirst.map((it) => `<details class="ir-exp ${results[it.questionId]?.ok ? "" : "wrong"}" ${results[it.questionId]?.ok ? "" : "open"}>
            <summary>${results[it.questionId] ? (results[it.questionId].ok ? "✅" : "❌") : "📌"} 第 ${esc(String(it.questionNumber ?? label(it.questionId || "")))} 题${results[it.questionId] && !results[it.questionId].ok ? `：你的答案「${esc(String(results[it.questionId].got || "没填"))}」，正确答案「${esc(String(results[it.questionId].want ?? ""))}」` : ""}</summary>
            <div class="ir-exp-text">${esc(it.text || "")}</div></details>`).join("")}</div>` : `<p class="small muted">这篇没有解析。</p>`}`;
      $("#ir-again", root).onclick = () => Router.render();
      $("#ir-result", root).scrollIntoView({ behavior: "smooth", block: "start" });
      $("#ir-submit", root).disabled = true;
    };
    $("#ir-submit", root).onclick = async () => {
      const empty = order.filter((q) => { const a = answerOf(q); return a !== null && !String(a).trim(); }).length;
      if (empty && !(await confirmBox("交卷？", `还有 ${empty} 道题没做。`, "交卷"))) return;
      submit();
    };
  },
};
