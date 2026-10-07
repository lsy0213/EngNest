// 人生剧场：每个选择都是另一种人生。剧本架 + 分支剧情（合租日记是其中一本，有自己的页面 #/sitcom）
// 剧本数据在 data/life*.js（LIFE.stories），对话引擎在 js/story_engine.js
// 进度存在 Store.data.life[剧本 id]：{ vars 属性和标记, done 演过的章, hist 每章开头的快照和做过的决定, seen 所有人生里选过的选项, endings 收集到的结局 }

// 条件："party"、"!party"、"study>=60"、"route=study"，& 并且，| 或者
function lifeTest(cond, v) {
  if (typeof cond === "function") return !!cond(v);
  return String(cond).split("|").some((any) => any.split("&").every((part) => {
    part = part.trim();
    let m = part.match(/^(!?)(\w+)$/);
    if (m) return m[1] ? !v[m[2]] : !!v[m[2]];
    m = part.match(/^(\w+)\s*(>=|<=|!=|>|<|=)\s*(.+)$/);
    if (!m) return false;
    const a = v[m[1]] ?? 0, b = isNaN(+m[3]) ? m[3].trim() : +m[3];
    return { ">=": a >= b, "<=": a <= b, ">": a > b, "<": a < b, "=": a === b, "!=": a !== b }[m[2]];
  }));
}

// 剧本里所有的「做什么」节点（包括藏在分支里的），人生树用
function lifeDecides(script, out = []) {
  for (const n of script || []) {
    if (Array.isArray(n) || !n) continue;
    if (n.decide) out.push(n);
    for (const k of ["then", "else", "pass", "fail"]) lifeDecides(n[k], out);
    for (const o of n.opts || []) lifeDecides(Array.isArray(o) ? o.find((x, i) => i && Array.isArray(x)) : o.then, out);
  }
  return out;
}

App.pages.life = {
  get all() { return (Store.data.life ||= {}); },

  render(root, params, signal) {
    root.classList.add("page-wide");
    this.root = root;
    this.signal = signal;
    this.sid = LIFE.stories[params[0]] ? params[0] : null;
    if (!this.sid) return this.shelf();
    this.S = LIFE.stories[this.sid];
    if (!this.all[this.sid]) return this.title();
    this.home();
  },
  refresh() {
    if (this._ctl) this._ctl.abort();
    if (this.root?.isConnected) this.render(this.root, this.sid ? [this.sid] : [], this.signal);
  },
  get s() { return this.all[this.sid]; },

  // ---------- 剧本架 ----------
  shelf() {
    const sc = Store.data.sitcom;
    const scDone = sc ? SITCOM.episodes.filter((e) => !e.id.startsWith("rent") && sc.done[e.id]).length : 0;
    const scAll = SITCOM.episodes.filter((e) => !e.id.startsWith("rent")).length;
    const cards = [`<a class="lf-card card" href="#/sitcom">
        <div class="lf-card-ico">🛋️</div><b>合租日记</b><div class="small faint en">Maple Street</div>
        <div class="small muted">美国 · 纽约 · 日常口语。和五个邻居过日子：打工、聊天、送礼物，在情景喜剧里学地道说法。</div>
        <div class="lf-card-foot"><span class="badge">A2–B1</span><span class="badge">生活模拟</span><span class="spacer"></span>
          <span class="small">${sc ? `第 ${sc.day} 天 · 主线 ${scDone}/${scAll}` : "新剧本"}</span></div></a>`];
    for (const id of LIFE.order) {
      const S = LIFE.stories[id], s = this.all[id];
      if (!S) continue;
      const got = s ? Object.keys(s.endings).length : 0;
      const where = !s ? "新剧本" : s.ending ? `结局：${S.endings.find((e) => e.id === s.ending)?.zh || ""}` : this.nextChapter(S, s) ? `进行到第 ${s.done.length + 1} 章` : "样章已读完";
      cards.push(`<a class="lf-card card" href="#/life/${id}">
        <div class="lf-card-ico">${S.ico}</div><b>${esc(S.zh)}</b><div class="small faint en">${esc(S.title)}</div>
        <div class="small muted">${esc(S.place)} · ${esc(S.blurb.slice(0, 46))}…</div>
        <div class="lf-card-foot"><span class="badge">${esc(S.level)}</span><span class="badge">${S.chapters.length} 章${S.more ? " · 连载中" : ""}</span><span class="badge">结局 ${got}/${S.endings.length}</span><span class="spacer"></span>
          <span class="small">${esc(where)}</span></div></a>`);
    }
    for (const u of LIFE.upcoming) {
      cards.push(`<div class="lf-card card soon"><div class="lf-card-ico">${u.ico}</div><b>${esc(u.title)}</b>
        <div class="small muted">${esc(u.sub)}</div>
        <div class="lf-card-foot"><span class="badge">${esc(u.level)}</span><span class="spacer"></span><span class="small faint">筹备中</span></div></div>`);
    }
    this.root.innerHTML = `<div class="lf-shelf-head card">
        <div style="font-size:44px">🎭</div>
        <div><h1>人生剧场 <span class="faint" style="font-weight:400;font-size:16px">每个选择，都是另一种人生</span></h1>
          <p class="muted small">在英语世界里过一段人生。<b>说什么</b>决定你英语地不地道，<b>做什么</b>决定你走向哪种人生。选错了英语不会毁掉人生，
          但说得好，关键时刻能帮你过关。走完一段人生，可以回到任何一个路口，换个选择再活一次。</p></div></div>
      <div class="lf-shelf">${cards.join("")}</div>`;
  },

  // ---------- 开始画面 ----------
  title() {
    const S = this.S;
    const cast = Object.values(S.cast).filter((c) => c.main || c.bio);
    this.root.innerHTML = `<div class="sc-title card">
        <a class="btn sm ghost" href="#/life">← 剧本架</a>
        <div class="sc-title-top mt-s"><div style="font-size:54px">${S.ico}</div>
          <div><h1>${esc(S.zh)} <span class="faint en" style="font-weight:400">${esc(S.title)}</span></h1>
          <div class="row" style="gap:6px;margin-bottom:6px"><span class="badge">${esc(S.place)}</span><span class="badge">${esc(S.level)}</span><span class="badge">${S.chapters.length} 章${S.more ? " · 连载中" : ""}</span><span class="badge">${S.endings.length} 个结局</span></div>
          <p class="muted">${esc(S.blurb)}</p>
          <p class="small muted">📒 能学到：${esc(S.learnWhat)}</p></div></div>
        <div class="sc-cast">${cast.map((c) => `<div class="sc-cast-item"><img src="${storyAvatar(c.avatar)}" alt=""><b>${esc(c.name)}</b><div class="small muted">${esc(c.role)}</div><div class="small faint">${esc(c.bio || "")}</div></div>`).join("")}</div>
        <div class="grid grid-3 small muted sc-how">
          <div><b style="color:var(--ink)">💬 怎么说</b><br>同一个意思的三种说法：地道、能懂、中式英语。选完马上讲为什么，按 V 可以说出来。影响好感，关键时刻还要靠它过关。</div>
          <div><b style="color:var(--ink)">🔀 做什么</b><br>每个选项都是地道的英文，看懂了才知道自己选的是哪条路。有些选项要在「单词」里学过某个词才会解锁。</div>
          <div><b style="color:var(--ink)">🎧 只听 · 🌳 人生树</b><br>有些关键信息只说不写，要靠耳朵。走过的路会长成一棵人生树，可以回到任何一章换个选择。</div>
        </div>
        <div class="center mt"><button class="btn primary lg" id="lf-start">开始这段人生 →</button></div>
      </div>`;
    $("#lf-start", this.root).onclick = () => { this.newGame(); this.refresh(); };
  },

  newGame() {
    const S = this.S, old = this.s;
    const vars = {};
    for (const [k, d] of Object.entries(S.stats)) vars[k] = d.init || 0;
    for (const [k, c] of Object.entries(S.cast)) if (c.main) vars[k] = 0;
    this.all[this.sid] = {
      v: 1, vars, done: [], hist: [], ending: null, best: 0, total: 0, spoke: 0, heard: 0, listens: 0,
      seen: old?.seen || {}, endings: old?.endings || {}, learned: old?.learned || [], lives: (old?.lives || 0) + 1,
    };
    Store.save();
  },
  nextChapter(S = this.S, s = this.s) {
    const last = s.done.length ? S.chapters.findIndex((c) => c.id === s.done.at(-1)) : -1;
    return S.chapters.slice(last + 1).find((c) => !c.when || lifeTest(c.when, s.vars));
  },
  // 把变化加到属性上：数字是加减（属性和好感有上下限），其他直接记下
  apply(vars, delta, clamp = true) {
    const S = this.S;
    for (const [k, v] of Object.entries(delta)) {
      if (typeof v !== "number") { vars[k] = v; continue; }
      let n = (vars[k] || 0) + v;
      if (clamp && (S.stats[k]?.max || S.cast[k]?.main)) n = Math.max(0, Math.min(S.stats[k]?.max || 100, n));
      vars[k] = n;
    }
    return vars;
  },
  chip(k, v) {
    const d = this.S.stats[k], c = this.S.cast[k], sign = v > 0 ? "+" : "";
    if (d) return `${d.ico} ${d.name} ${sign}${d.unit || ""}${v}`;
    if (c?.main) return `${c.name} ❤️ ${sign}${v}`;
    return null;
  },
  ending() {
    return this.S.endings.find((e) => !e.when || lifeTest(e.when, this.s.vars));
  },
  pickText(id, i) {
    for (const ch of this.S.chapters) {
      const d = lifeDecides(ch.script).find((x) => x.id === id);
      if (d) return d.opts[i];
    }
    return null;
  },

  // ---------- 故事主页：属性、下一章、人生轨迹 ----------
  home() {
    const S = this.S, s = this.s, root = this.root, signal = freshSignal(this, this.signal);
    App.shadowTarget = null;
    const next = s.ending ? null : this.nextChapter();
    const end = s.ending && S.endings.find((e) => e.id === s.ending);
    const stats = Object.entries(S.stats).map(([k, d]) => `<div class="lf-stat" title="${esc(d.name)}">${d.ico} <span class="small muted">${esc(d.name)}</span>
        ${d.max ? `<span class="bar sc-bar"><i style="width:${(s.vars[k] / d.max) * 100}%"></i></span>` : ""}<b>${d.unit || ""}${s.vars[k]}</b></div>`).join("");
    const pct = s.total ? Math.round((s.best / s.total) * 100) : 0;
    const eng = `<div class="lf-eng small muted">⭐⭐ 地道 ${s.best}/${s.total}${s.total ? `（${pct}%）` : ""} · 🎧 听懂 ${s.heard}/${s.listens} · 🎤 开口 ${s.spoke} 次 · 📒 表达 ${s.learned.length} 条</div>`;
    let main;
    if (end) {
      main = `<div class="card lf-end"><div class="small muted">第 ${s.lives} 段人生 · 结局</div>
          <div style="font-size:52px">${end.ico}</div><h2>${esc(end.zh)}</h2><div class="faint en">${esc(end.title)}</div>
          <p class="muted">${esc(end.desc)}</p>${eng}
          <div class="small muted mt-s">🏆 已收集结局 ${Object.keys(s.endings).length} / ${S.endings.length}</div>
          <div class="row mt" style="justify-content:center;gap:8px"><button class="btn primary" data-act="tree">🌳 回到某个路口，换个选择</button><button class="btn" data-act="restart">🔁 重新过一遍这段人生</button></div></div>`;
    } else if (next) {
      const n = S.chapters.indexOf(next) + 1;
      main = `<div class="card lf-next"><div class="small muted">${s.done.length ? "接下来" : "故事开始"}</div>
          <h2>${esc(next.zh)}</h2><div class="faint en">${esc(next.title)}</div>
          ${next.learn?.length ? `<div class="small muted mt-s">这一章会学到：${next.learn.slice(0, 4).map(([en]) => `<span class="en">${esc(en)}</span>`).join(" · ")}…</div>` : ""}
          <button class="btn primary lg mt" id="lf-go">${n === 1 ? "开始" : "继续"} <span class="kbd">Enter</span></button>${eng}</div>`;
    } else {
      main = `<div class="card lf-next"><div style="font-size:40px">📝</div><h2>样章到这里结束</h2>
          <p class="muted">后续章节正在写。现在可以打开 <b>🌳 人生树</b>，回到任何一章换个选择，看看另一种人生会怎么走。</p>${eng}
          <div class="row mt" style="justify-content:center;gap:8px"><button class="btn primary" data-act="tree">🌳 人生树</button><button class="btn" data-act="learned">📒 学到的表达</button></div></div>`;
    }
    const timeline = s.hist.map((h) => {
      const ch = S.chapters.find((c) => c.id === h.ch);
      return `<div class="lf-tl-item"><b>${esc(ch?.zh || h.ch)}</b>${h.picks.map(([id, i]) => { const o = this.pickText(id, i); return o ? `<div class="small">🔀 ${esc(o.zh)}</div>` : ""; }).join("")}</div>`;
    }).join("");
    root.innerHTML = `<div class="sc-top card">
        <a class="btn sm ghost" href="#/life" title="回到剧本架">← 剧本架</a>
        <div class="sc-day">${S.ico} <b>${esc(S.zh)}</b> <span class="small faint">第 ${s.lives} 段人生</span></div>
        <span class="spacer"></span>
        <button class="btn sm ghost" data-act="tree">🌳 人生树</button>
        <button class="btn sm ghost" data-act="cast">👥 人物</button>
        <button class="btn sm ghost" data-act="learned">📒 学到的表达 (${s.learned.length})</button>
        <button class="btn sm ghost" data-act="menu" title="设置 / 重新开始">⚙️</button>
      </div>
      <div class="card lf-stats">${stats}</div>
      <div class="lf-main">${main}
        <div class="card lf-tl"><div class="small muted" style="margin-bottom:8px">🧭 这段人生走过的路</div>
          ${timeline || `<div class="small faint">还没有开始。每一章做过的决定都会记在这里。</div>`}</div></div>`;
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      ({ tree: () => this.treeModal(), cast: () => this.castModal(), learned: () => this.learnedModal(), menu: () => this.menuModal(),
        restart: () => this.restart() })[b.dataset.act]?.();
    }, { signal });
    if (next) {
      $("#lf-go", root).onclick = () => this.play(next);
      onKey(signal, (e) => { if (e.key === "Enter") { e.preventDefault(); this.play(next); } });
    }
  },

  // ---------- 演一章 ----------
  play(ch) {
    const S = this.S, s = this.s;
    storyStage({
      root: this.root, signal: freshSignal(this, this.signal), scene: ch, from: `人生剧场 · ${S.zh}`,
      cast: (sp) => S.cast[sp], chip: (k, v) => this.chip(k, v),
      sayFx: (node, sc) => (S.cast[node.who]?.main ? { [node.who]: STORY_SCORE[sc].fr } : {}),
      test: (cond, delta) => lifeTest(cond, this.apply({ ...s.vars }, delta, false)),
      knows: (w) => !!(Store.data.words[w] || Store.data.words[w.toLowerCase()]),
      seen: (id, i) => !!s.seen[id]?.includes(i),
      exitText: "这一章的进度不会保存，下次从这一章的开头重新开始。",
      onFinish: ({ delta, score, picks }) => {
        const snap = { vars: { ...s.vars }, best: s.best, total: s.total, spoke: s.spoke, heard: s.heard, listens: s.listens };
        this.apply(s.vars, delta);
        s.done.push(ch.id);
        s.hist.push({ ch: ch.id, snap, picks });
        for (const [id, i] of picks) if (!(s.seen[id] ||= []).includes(i)) s.seen[id].push(i);
        for (const k of ["best", "total", "spoke", "heard", "listens"]) s[k] += score[k];
        for (const [en] of ch.learn || []) if (!s.learned.includes(en)) s.learned.push(en);
        addXP(5);
        const next = this.nextChapter();
        let r = { ico: "📖", button: "回到故事" };
        if (ch.ending || (!next && !S.more)) {
          const e = this.ending();
          s.ending = e.id;
          const first = !s.endings[e.id];
          s.endings[e.id] ||= today();
          r = { ico: e.ico, button: "看看这段人生", html: `<div class="mt-s"><b>结局：${esc(e.zh)}</b>${first ? ` <span class="badge brand">新结局</span>` : ""}</div>` };
        } else if (!next) r.html = `<div class="small muted mt-s">📝 样章到这里结束，后续章节正在写。可以在 🌳 人生树里换个选择再走一遍。</div>`;
        Store.save();
        renderSidebarFoot();
        return r;
      },
      onDone: () => this.refresh(),
      onExit: () => this.refresh(),
    });
  },

  // ---------- 人生树：每章的决定，走过的、别的人生里走过的、还没走过的 ----------
  treeModal() {
    const S = this.S, s = this.s;
    const next = s.ending ? null : this.nextChapter();
    const chs = S.chapters.map((ch) => {
      const idx = s.done.indexOf(ch.id), h = s.hist[idx];
      const mine = new Map((h?.picks || []).map(([id, i]) => [id, i]));
      const state = idx >= 0 ? "done" : ch === next ? "next" : "todo";
      const decs = lifeDecides(ch.script).map((d) => `<div class="lf-dec"><div class="small muted">🔀 ${esc(d.decide)}</div><div class="lf-opts">${d.opts.map((o, i) => {
        const on = mine.get(d.id) === i, seen = s.seen[d.id]?.includes(i);
        const label = on || seen ? o.zh : `？？？${o.note ? ` · ${o.note}` : ""}`;
        return `<span class="lf-opt ${on ? "on" : seen ? "seen" : "unk"}" title="${esc(on ? "这段人生的选择" : seen ? "别的人生里选过" : "还没走过")}">${o.key && !seen && !on ? "🔒 " : ""}${esc(label)}</span>`;
      }).join("")}</div></div>`).join("");
      return `<div class="lf-tree-ch ${state}">
        <div class="row" style="gap:8px"><b>${state === "done" ? "✅" : state === "next" ? "▶️" : "○"} ${esc(ch.zh)}</b>${ch.when ? `<span class="badge">路线章节</span>` : ""}<span class="spacer"></span>
          ${state === "done" ? `<button class="btn sm soft" data-rewind="${ch.id}" title="回到这一章的开头，之后的进度会清掉（收集到的结局和表达会保留）">⏪ 从这里重新选</button>` : ""}</div>
        ${decs || `<div class="small faint">这一章没有分叉</div>`}</div>`;
    }).join("");
    const ends = S.endings.map((e) => {
      const got = s.endings[e.id];
      return `<div class="lf-ending ${got ? "got" : ""}"><span style="font-size:24px">${got ? e.ico : "❔"}</span><div><b>${got ? esc(e.zh) : "？？？"}</b><div class="small muted">${got ? esc(e.desc) : `提示：${esc(e.hint || "")}`}</div></div></div>`;
    }).join("");
    const m = modal(`<h3>🌳 人生树 · ${esc(S.zh)}</h3>
      <p class="small muted">实心的是这段人生的选择，虚线框是你在别的人生里走过的，？？？ 是还没走过的路。点「从这里重新选」回到那一章的开头。</p>
      <div class="lf-tree">${chs}${S.more ? `<div class="lf-tree-ch todo"><b>○ 后续章节</b><div class="small faint">正在写……</div></div>` : ""}</div>
      <h4 class="mt">🏆 结局图鉴（${Object.keys(s.endings).length} / ${S.endings.length}）</h4><div class="lf-endings">${ends}</div>
      <div class="modal-actions"><button class="btn" data-close>关闭</button></div>`);
    m.root.querySelector(".modal").style.maxWidth = "680px";
    m.root.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-rewind]");
      if (!b) return;
      const ch = S.chapters.find((c) => c.id === b.dataset.rewind);
      m.close();
      if (await confirmBox(`回到「${ch.zh}」？`, "这一章和之后的进度会清掉，属性回到这一章开始时的样子。收集到的结局、走过的路和学到的表达都会保留。", "回到这里")) this.rewind(ch.id);
    });
  },
  rewind(chId) {
    const s = this.s, idx = s.done.indexOf(chId);
    if (idx < 0) return;
    const { snap } = s.hist[idx];
    s.vars = { ...snap.vars };
    for (const k of ["best", "total", "spoke", "heard", "listens"]) s[k] = snap[k];
    s.done = s.done.slice(0, idx);
    s.hist = s.hist.slice(0, idx);
    s.ending = null;
    Store.save();
    toast("回到了这个路口，这次试试别的选择吧", "good");
    this.refresh();
  },
  async restart() {
    if (!(await confirmBox("重新过一遍这段人生？", "属性和进度从头开始。收集到的结局、走过的路和学到的表达都会保留。", "重新开始"))) return;
    this.newGame();
    this.refresh();
  },

  // ---------- 弹窗：人物、学到的表达、设置 ----------
  castModal() {
    const S = this.S, s = this.s;
    const m = modal(`<h3>👥 ${esc(S.zh)} 的人物</h3>${Object.entries(S.cast).filter(([, c]) => c.main).map(([k, c]) => {
      const v = s.vars[k] || 0;
      return `<div class="sc-cast-row"><img src="${storyAvatar(c.avatar)}" alt="">
        <div style="flex:1;min-width:0"><b>${esc(c.full || c.name)}</b>
          <div class="small muted">${esc(c.role)} · ${esc(c.bio || "")}</div>
          <div class="row" style="gap:8px;margin-top:4px"><span class="bar" style="flex:1"><i style="width:${v}%"></i></span><span class="small">❤️ ${v}</span></div></div></div>`;
    }).join("")}<div class="modal-actions"><button class="btn" data-close>关闭</button></div>`);
    m.root.querySelector(".modal").style.maxWidth = "620px";
  },
  learnedModal() {
    const S = this.S, s = this.s, from = `人生剧场 · ${S.zh}`;
    const all = new Map();
    S.chapters.forEach((c) => (c.learn || []).forEach(([en, zh, note]) => all.set(en, [zh, note])));
    const list = s.learned.filter((en) => all.has(en));
    const m = modal(`<h3>📒 学到的表达（${list.length}）</h3>
      ${list.length ? `<div style="max-height:60vh;overflow:auto">${list.map((en) => { const [zh, note] = all.get(en); return `<div class="sc-learn-row"><span class="en">${esc(en)}</span><span class="muted">${esc(zh)}</span>${note ? `<span class="small faint">${esc(note)}</span>` : ""}<span class="spacer"></span><button class="speak sm" data-say="${esc(en.replace(/\.\.\./g, ""))}">🔊</button><button class="star ${inSentNb(en) ? "on" : ""}" data-en="${esc(en)}" data-zh="${esc(zh)}">★</button></div>`; }).join("")}</div>
        <div class="modal-actions"><button class="btn" data-close>关闭</button><button class="btn primary" id="all-nb">全部收进生词本</button></div>`
        : `<p class="muted">演完一章，里面的重点表达会收在这里。</p><div class="modal-actions"><button class="btn" data-close>关闭</button></div>`}`);
    m.root.querySelector(".modal").style.maxWidth = "640px";
    m.root.addEventListener("click", (e) => {
      const st = e.target.closest(".star[data-en]");
      if (st) st.classList.toggle("on", toggleSentNb({ en: st.dataset.en, zh: st.dataset.zh, from }));
      if (e.target.closest("#all-nb")) {
        let n = 0;
        list.forEach((en) => { if (!inSentNb(en)) { sentNb().unshift({ en, zh: all.get(en)[0], from, added: today() }); n++; } });
        Store.save();
        renderNav();
        toast(n ? `收进了 ${n} 条` : "都已经在生词本里了", "good");
        m.close();
      }
    });
  },
  menuModal() {
    const P = Store.prefs;
    const m = modal(`<h3>⚙️ 设置</h3>
      <label class="row" style="gap:8px;cursor:pointer"><input type="checkbox" id="lf-v" ${P.sc_voice !== false ? "checked" : ""}> 自动朗读台词（每个角色有自己的声音，和合租日记共用这个设置）</label>
      <p class="small muted mt-s">中文显示可以在对话框右上角切换：一直显示 / 点一下才显示 / 纯英文。「做什么」的选项建议先不看中文，试试自己能不能看懂。</p>
      <div class="modal-actions"><button class="btn bad" id="lf-reset">清空这本剧本的全部记录</button><span class="spacer"></span><button class="btn" data-close>关闭</button></div>`);
    $("#lf-v", m.root).onchange = (e) => { P.sc_voice = e.target.checked; Store.save(); };
    $("#lf-reset", m.root).onclick = async () => {
      m.close();
      if (await confirmBox("清空全部记录？", "进度、人生树、结局图鉴都会清空（已经收进生词本的句子不受影响）。只想从头再玩一遍的话，用「重新过一遍这段人生」就好。", "清空", true)) {
        delete this.all[this.sid];
        Store.save();
        this.refresh();
      }
    };
  },
};
