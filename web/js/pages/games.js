// ============================================================
// 单词游戏：每日猜词、单词阶梯、拆拼单词、限时快答、填字格、单元 Boss 战、听力侦探
// 题目都从你在学的词书和学过的词里出；玩完的词可以一键加入复习
// 成绩存在 Store.data.games：{ 游戏 id: {played, wins, best, streak, maxStreak, last, t, …各游戏自己的字段} }
// ============================================================

const GameStats = {
  rec(id) { return ((Store.data.games ||= {})[id] ||= { played: 0, wins: 0, best: 0, streak: 0, maxStreak: 0, t: 0 }); },
  // 一局结束：记成绩、算每日任务、加经验
  end(id, { win = false, score = 0, xp = 0 } = {}) {
    const r = this.rec(id);
    r.played++;
    if (win) { r.wins++; r.streak = (r.streak || 0) + 1; r.maxStreak = Math.max(r.maxStreak || 0, r.streak); } else r.streak = 0;
    if (score > (r.best || 0)) r.best = score;
    r.last = today();
    r.t = Date.now();
    bump("c_game");
    if (xp) addXP(xp);
    Store.save();
    return r;
  },
};

// 词池：学过的词 / 当前词书；所有认识的英文单词（判断猜的是不是真词）
const GameWords = {
  _set: null,
  ok: (w) => /^[a-z]+$/.test(w),
  item: (w) => WORD_MAP[w.toLowerCase()] || null,
  learned() { return Object.keys(Store.data.words).map((w) => WORD_MAP[w.toLowerCase()]).filter((it) => it && it.m && this.ok(it.w)); },
  book() { return bookItems().filter((it) => it.m && this.ok(it.w)); },
  // 学过的够多就用学过的，不然用当前词书
  pool(min = 12, filter = () => true) {
    const l = this.learned().filter(filter);
    return l.length >= min ? l : [...new Map([...l, ...this.book().filter(filter)].map((x) => [x.w, x])).values()];
  },
  // 包括还没加载完的大词书里的词（只有单词，没有释义）
  set() {
    if (this._set) return this._set;
    const s = new Set();
    for (const b of BOOKS) for (const u of b.units) for (const it of u.items) if (this.ok(it.w)) s.add(it.w);
    return (this._set = s);
  },
  async isWord(w) {
    if (this.set().has(w)) return true;
    try { return !!(Dict.ok && (await Dict.lookup(w))?.word?.toLowerCase() === w); } catch { return false; }
  },
  // 释义：词书里有就用词书的，没有查词典
  async meaning(w) {
    const it = this.item(w);
    if (it?.m) return shortMeaning(it);
    try { const d = await Dict.lookup(w); return d ? d.trans.split("\n")[0] : ""; } catch { return ""; }
  },
};

// 游戏结束时的单词卡片：发音、释义、例句、生词本、加入复习
function gameWordCard(w) {
  const it = GameWords.item(w);
  const learned = !!Store.data.words[w];
  return `<div class="game-word">
    <div class="row" style="gap:8px;align-items:baseline"><b class="en game-word-w">${esc(w)}</b><span class="fc-ipa">${esc(it?.ph || "")}</span>${speakBtn(w)}
      <span class="spacer"></span><button class="star ${inNotebook(w) ? "on" : ""}" data-gstar="${esc(w)}" title="加入生词本">★</button></div>
    <div class="muted" data-gmean="${esc(w)}">${it ? esc(shortMeaning(it)) : ""}</div>
    ${it?.ex ? `<div class="small mt-s"><span class="en">${esc(it.ex)}</span> <span class="faint">${esc(it.zh || "")}</span></div>` : ""}
    ${it && !learned ? `<button class="btn sm mt-s" data-glearn="${esc(w)}">＋ 加入复习</button>` : learned ? `<div class="small faint mt-s">✓ 已经在复习里</div>` : ""}
  </div>`;
}
function bindGameWords(root) {
  $$("[data-gmean]", root).forEach(async (el) => { if (!el.textContent) el.textContent = await GameWords.meaning(el.dataset.gmean); });
  root.addEventListener("click", (e) => {
    const s = e.target.closest("[data-gstar]"), l = e.target.closest("[data-glearn]");
    if (s) { const it = GameWords.item(s.dataset.gstar) || { w: s.dataset.gstar }; s.classList.toggle("on", toggleNotebook(it)); }
    if (l) { gradeWord(l.dataset.glearn, 1); dayRec().new = (dayRec().new || 0) + 1; Store.save(); renderNav(); l.outerHTML = `<div class="small good-text mt-s">✓ 已加入，明天开始复习</div>`; }
  });
}

const GAMES = [
  { id: "wordle", ico: "🟩", name: "每日猜词", desc: "6 次猜出一个 5 个字母的单词。答案来自你在学的词书，每天一个，也可以无限练习。", daily: true },
  { id: "ladder", ico: "🪜", name: "单词阶梯", desc: "每次只改一个字母，从一个词走到另一个词：cold → cord → card → ward → warm。" },
  { id: "roots", ico: "🧬", name: "拆拼单词", desc: "看中文，用词根词缀拼出单词：in + spect + ion。拼的时候顺便记住每块的意思。" },
  { id: "speed", ico: "⚡", name: "限时快答", desc: "60 秒内认出尽量多的词，答对加时间、连对有加成。练的是「秒懂」。" },
  { id: "cross", ico: "🔠", name: "填字格", desc: "用学过的词排成的小填字游戏，提示是中文。" },
  { id: "boss", ico: "👾", name: "单元 Boss 战", desc: "挑一个单元，答对一题打 Boss 一下；答错三次就输了。" },
  { id: "case", ico: "🕵️", name: "听力侦探", desc: "每周一个案子：证词只放声音，听出细节里的破绽，找出真相。", daily: true },
];

App.pages.games = {
  render(root, params, signal) {
    const [id] = params;
    const g = GAMES.find((x) => x.id === id);
    if (g) {
      root.innerHTML = pageHead(`${g.ico} ${g.name}`, g.desc, `<a class="btn ghost sm" href="#/games">‹ 全部游戏</a>`) + `<div id="game-body"></div>`;
      this[id]($("#game-body", root), signal, params.slice(1));
      return;
    }
    const today_ = today();
    root.innerHTML = pageHead("🎲 单词游戏", "题目都从你在学的词书和学过的词里出，玩完的词可以一键加入复习。每天玩一局也算每日任务。") + `
      <div class="game-grid">${GAMES.map((x) => {
        const r = (Store.data.games || {})[x.id];
        const dailyDone = x.id === "wordle" ? r?.daily?.date === today_ && r.daily.done : x.id === "case" ? r?.solved?.[CaseGame.weekCase().id] : false;
        return `<a class="game-card" href="#/games/${x.id}"><div class="game-ico">${x.ico}</div><b>${x.name}</b><div class="small muted">${x.desc}</div>
          <div class="small faint mt-s">${r?.played ? `玩过 ${r.played} 局${r.wins ? ` · 赢 ${r.wins} 局` : ""}${r.best ? ` · 最好 ${r.best}` : ""}` : "还没玩过"}</div>
          ${x.daily ? `<span class="badge ${dailyDone ? "good" : "brand"} game-daily">${dailyDone ? "今天已完成" : x.id === "case" ? "本周新案" : "今日题目"}</span>` : ""}</a>`;
      }).join("")}</div>`;
  },

  // ---------- 每日猜词 ----------
  wordle(box, pageSignal, [mode]) {
    const signal = freshSignal(this, pageSignal);
    const rec = GameStats.rec("wordle");
    const five = (it) => it.w.length === 5;
    const pool = GameWords.pool(30, five);
    if (pool.length < 5) { box.innerHTML = `<div class="card empty">这本词书里 5 个字母的词太少，换一本词书试试</div>`; return; }
    const daily = mode !== "free";
    let answer;
    if (daily) {
      // 每日题：按日期和词书固定；做过了就恢复当时的盘面
      if (rec.daily?.date === today()) answer = rec.daily.answer;
      else {
        const list = GameWords.book().filter(five).map((x) => x.w).sort();
        answer = (list.length ? list : pool.map((x) => x.w))[Math.floor(seededRandom("wordle:" + today() + curBook().id)() * (list.length || pool.length))];
        rec.daily = { date: today(), answer, guesses: [], done: false, win: false, hint: false };
      }
    } else answer = pick(pool).w;
    const state = daily ? rec.daily : { answer, guesses: [], done: false, win: false, hint: false };
    let cur = "";
    const colors = (g) => {
      const res = Array(5).fill("absent"), left = {};
      for (let i = 0; i < 5; i++) { if (g[i] === answer[i]) res[i] = "correct"; else left[answer[i]] = (left[answer[i]] || 0) + 1; }
      for (let i = 0; i < 5; i++) if (res[i] !== "correct" && left[g[i]]) { res[i] = "present"; left[g[i]]--; }
      return res;
    };
    const keyState = () => {
      const k = {};
      const rank = { absent: 1, present: 2, correct: 3 };
      state.guesses.forEach((g) => colors(g).forEach((c, i) => { if (!k[g[i]] || rank[c] > rank[k[g[i]]]) k[g[i]] = c; }));
      return k;
    };
    const draw = () => {
      const ks = keyState();
      const rows = [];
      for (let r = 0; r < 6; r++) {
        const g = state.guesses[r], c = g ? colors(g) : null, typing = !g && r === state.guesses.length && !state.done;
        // 揭示过的字母：在正在输入的那一行用浅色先显示出来
        const ghost = (i) => typing && !cur[i] && (state.rev || []).includes(i);
        rows.push(`<div class="wd-row">${Array.from({ length: 5 }, (_, i) => `<div class="wd-cell ${c ? c[i] : typing && cur[i] ? "filled" : ghost(i) ? "ghost" : ""}">${esc((g || (typing ? cur : ""))[i] || (ghost(i) ? answer[i] : ""))}</div>`).join("")}</div>`);
      }
      const kb = ["qwertyuiop", "asdfghjkl", "zxcvbnm"].map((row, ri) => `<div class="wd-krow">${ri === 2 ? `<button class="wd-key wide" data-k="enter">Enter</button>` : ""}${[...row].map((ch) => `<button class="wd-key ${ks[ch] || ""}" data-k="${ch}">${ch}</button>`).join("")}${ri === 2 ? `<button class="wd-key wide" data-k="back" aria-label="删除">⌫</button>` : ""}</div>`).join("");
      box.innerHTML = `<div class="wordle">
        <div class="row small muted" style="justify-content:center;gap:10px;flex-wrap:wrap">
          <span>${daily ? `📅 今日题目（${esc(curBook().title)}）` : "♾️ 无限练习"}</span>
          <a href="#/games/wordle${daily ? "/free" : ""}" class="small">${daily ? "无限练习 ›" : "‹ 今日题目"}</a>
          <span>连胜 ${rec.streak || 0} · 赢 ${rec.wins || 0} / ${rec.played || 0}</span></div>
        <div class="wd-grid">${rows.join("")}</div>
        <div class="center small" id="wd-msg">${state.hint ? `💡 提示：<span data-gmean-hint>${esc(GameWords.item(answer) ? shortMeaning(GameWords.item(answer)) : "")}</span>` : ""}</div>
        ${(state.rev || []).length && !state.done ? `<div class="center small wd-rev">🔤 已揭示：<span class="en">${[...answer].map((ch, i) => (state.rev.includes(i) ? ch : "_")).join(" ")}</span></div>` : ""}
        ${state.done ? `<div class="card wd-end">${state.win ? `<b>🎉 ${state.guesses.length} 次猜中！</b>` : `<b>${state.gaveUp ? "答案是" : "这次没猜出来，答案是"}</b>`}${gameWordCard(answer)}
          ${daily ? `<div class="small faint mt-s">明天还有新题。也可以去<a href="#/games/wordle/free">无限练习</a>。</div>` : `<div class="row mt-s" style="justify-content:center"><button class="btn primary" data-again>再来一个</button></div>`}
          ${this.wdDist(rec, state.win ? state.guesses.length : 0)}</div>`
          : `<div class="wd-kb">${kb}</div><div class="row mt-s wd-help" style="justify-content:center;gap:6px;flex-wrap:wrap">
              <button class="btn sm ghost" data-hint ${state.hint ? "disabled" : ""}>💡 中文提示</button>
              <button class="btn sm ghost" data-reveal title="把一个字母放到它正确的位置上">🔤 揭示一个字母${(state.rev || []).length ? `（${state.rev.length}）` : ""}</button>
              <button class="btn sm ghost" data-giveup>🏳️ 看答案</button></div>
            <div class="center small faint">每用一次提示，猜中时少得一点经验</div>`}
      </div>`;
      bindGameWords(box);
      if (state.hint) $$("[data-gmean-hint]", box).forEach(async (el) => { if (!el.textContent) el.textContent = await GameWords.meaning(answer); });
      $("[data-again]", box)?.addEventListener("click", () => this.wordle(box, pageSignal, ["free"]));
    };
    const msg = (t) => { const m = $("#wd-msg", box); if (m) { m.textContent = t; m.classList.remove("shake"); void m.offsetWidth; m.classList.add("shake"); } };
    const submit = async () => {
      if (cur.length < 5) return msg("要 5 个字母");
      if (cur !== answer && !(await GameWords.isWord(cur))) return msg(`没找到「${cur}」这个词`);
      state.guesses.push(cur);
      cur = "";
      if (state.guesses[state.guesses.length - 1] === answer || state.guesses.length >= 6) {
        state.done = true;
        state.win = state.guesses[state.guesses.length - 1] === answer;
        if (state.win) (rec.dist ||= [0, 0, 0, 0, 0, 0, 0])[state.guesses.length]++;
        GameStats.end("wordle", { win: state.win, xp: state.win ? Math.max(2, 12 - state.guesses.length - (state.hint ? 2 : 0) - 2 * (state.rev || []).length) : 2 });
        Sound.play(state.win ? "achv" : "bad");
      }
      rec.t = Date.now();
      Store.save();
      draw();
      if (state.done) TTS.speak(answer);
    };
    const key = (k) => {
      if (state.done) return;
      if (k === "enter") return submit();
      if (k === "back") cur = cur.slice(0, -1);
      else if (/^[a-z]$/.test(k) && cur.length < 5) cur += k;
      draw();
    };
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-k]");
      if (b) key(b.dataset.k);
      if (e.target.closest("[data-hint]")) { state.hint = true; rec.t = Date.now(); Store.save(); draw(); }
      if (e.target.closest("[data-reveal]")) {
        // 还没猜对、也没揭示过的位置里挑最左边的；只剩最后一个就不揭示了（等于直接给答案）
        const known = new Set(state.rev || []);
        state.guesses.forEach((g) => colors(g).forEach((c, i) => { if (c === "correct") known.add(i); }));
        const left = [0, 1, 2, 3, 4].filter((i) => !known.has(i));
        if (left.length <= 1) return msg(left.length ? "只剩最后一个字母了，自己猜猜，或者看答案" : "所有字母都已经知道了");
        (state.rev ||= []).push(left[0]);
        rec.t = Date.now();
        Store.save();
        draw();
      }
      if (e.target.closest("[data-giveup]") && !state.done) {
        state.done = true; state.win = false; state.gaveUp = true;
        GameStats.end("wordle", { win: false, xp: 1 });
        rec.t = Date.now();
        Store.save();
        draw();
        TTS.speak(answer);
      }
    }, { signal });
    onKey(signal, (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") { e.preventDefault(); key("enter"); }
      else if (e.key === "Backspace") key("back");
      else if (/^[a-zA-Z]$/.test(e.key)) key(e.key.toLowerCase());
    });
    draw();
  },
  wdDist(rec, mine) {
    const d = rec.dist || [0, 0, 0, 0, 0, 0, 0], max = Math.max(1, ...d.slice(1));
    return `<div class="wd-dist mt"><div class="small muted">猜中用了几次</div>${[1, 2, 3, 4, 5, 6].map((n) => `<div class="wd-dbar"><span>${n}</span><i class="${n === mine ? "me" : ""}" style="width:${Math.max(6, (d[n] / max) * 100)}%">${d[n]}</i></div>`).join("")}</div>`;
  },

  // ---------- 单词阶梯 ----------
  ladder(box, pageSignal) {
    const signal = freshSignal(this, pageSignal);
    const words = [...GameWords.set()].filter((w) => w.length === 4);
    const set = new Set(words);
    // 只差一个字母的词：按通配符分桶（_old、c_ld……）
    const buckets = new Map();
    for (const w of words) for (let i = 0; i < 4; i++) { const k = w.slice(0, i) + "_" + w.slice(i + 1); (buckets.get(k) || buckets.set(k, []).get(k)).push(w); }
    const nb = (w) => { const out = new Set(); for (let i = 0; i < 4; i++) for (const x of buckets.get(w.slice(0, i) + "_" + w.slice(i + 1)) || []) if (x !== w) out.add(x); return [...out]; };
    const bfs = (from) => { const dist = new Map([[from, 0]]), q = [from]; while (q.length) { const w = q.shift(); for (const x of nb(w)) if (!dist.has(x)) { dist.set(x, dist.get(w) + 1); q.push(x); } } return dist; };
    // 出题：终点挑常见的词（有释义），起点离终点 3–5 步
    const known = (w) => GameWords.item(w)?.m;
    let end, start, dist;
    for (let tries = 0; tries < 60 && !start; tries++) {
      end = pick(words.filter(known));
      dist = bfs(end);
      const cands = [...dist].filter(([w, d]) => d >= 3 && d <= 5 && known(w)).map(([w]) => w);
      if (cands.length) start = pick(cands);
    }
    if (!start) { box.innerHTML = `<div class="card empty">没出成题，换本词书再试试</div>`; return; }
    const best = dist.get(start), path = [start];
    let gaveUp = false;
    const draw = (note = "") => {
      const last = path[path.length - 1], won = last === end, shown = won ? path.slice(0, -1) : path;
      box.innerHTML = `<div class="card ladder" style="max-width:520px;margin:0 auto">
        <div class="row small muted"><span>最少 ${best} 步</span><span class="spacer"></span><span>已走 ${path.length - 1} 步</span></div>
        <div class="ld-rungs">
          ${shown.map((w, i) => `<div class="ld-rung ${i === 0 ? "start" : ""}"><span class="ld-side">${i === 0 ? `<em class="ld-tag">起点</em>` : i === path.length - 1 && !won ? `<button class="btn sm ghost" data-undo title="退一步">↶</button>` : ""}</span><span class="ld-word">${[...w].map((c, k) => `<span class="${i && path[i - 1][k] !== c ? "chg" : ""}">${c}</span>`).join("")}</span><small data-gmean="${w}">${esc(GameWords.item(w) ? shortMeaning(GameWords.item(w)) : "")}</small></div>`).join("")}
          ${won ? "" : `<div class="ld-rung ld-typing"><span class="ld-side"></span><input class="input en" id="ld-in" maxlength="4" autocomplete="off" spellcheck="false" placeholder="改一个字母"><small class="faint">下一步：只改一个字母</small></div><div class="ld-dots" title="中间还要走几步">⋮</div>`}
          <div class="ld-rung end ${won ? "won" : ""}"><span class="ld-side"><em class="ld-tag end">🎯 终点</em></span><span class="ld-word">${[...end].map((c) => `<span>${c}</span>`).join("")}</span><small data-gmean="${end}">${esc(GameWords.item(end) ? shortMeaning(GameWords.item(end)) : "")}</small></div>
        </div>
        <div class="center small" id="ld-msg">${note}</div>
        ${won ? `<div class="center"><b>${gaveUp ? "这是一条最短路线，记住这些词，下一题自己走！" : path.length - 1 === best ? "🏆 最短路线！" : `🎉 走到了！用了 ${path.length - 1} 步（最少 ${best} 步）`}</b></div>
          <div class="row mt" style="justify-content:center"><button class="btn primary" data-again>再来一题</button></div>`
          : `<div class="row mt" style="justify-content:center;gap:8px"><button class="btn ghost sm" data-hint>💡 提示下一步</button><button class="btn ghost sm" data-giveup>看答案</button></div>`}
      </div>`;
      bindGameWords(box);
      const inp = $("#ld-in", box);
      if (inp) {
        setTimeout(() => inp.focus(), 30);
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); step(inp.value.trim().toLowerCase()); } });
      }
    };
    const step = (w) => {
      const last = path[path.length - 1];
      if (w.length !== 4) return draw("要 4 个字母");
      const diff = [...w].filter((c, i) => c !== last[i]).length;
      if (diff !== 1) return draw(diff === 0 ? "和上一个词一样" : "每次只能改一个字母");
      if (!set.has(w) && w !== end) return draw(`没找到「${w}」这个词`);
      path.push(w);
      if (w === end) {
        const steps = path.length - 1;
        GameStats.end("ladder", { win: true, score: Math.max(1, 10 - (steps - best) * 2), xp: steps === best ? 10 : 6 });
        Sound.play("achv");
      } else Sound.play("tick");
      draw();
    };
    const solution = () => { const d = bfs(end), out = [path[path.length - 1]]; while (out[out.length - 1] !== end) { const c = out[out.length - 1]; out.push(nb(c).find((x) => d.get(x) === d.get(c) - 1)); } return out; };
    box.addEventListener("click", (e) => {
      if (e.target.closest("[data-again]")) return this.ladder(box, pageSignal);
      if (e.target.closest("[data-undo]")) { path.pop(); return draw(); }
      if (e.target.closest("[data-hint]")) { const s = solution(); return draw(`💡 下一步可以是：${s[1]}`); }
      if (e.target.closest("[data-giveup]")) { const s = solution(); gaveUp = true; GameStats.end("ladder", { win: false, xp: 1 }); path.push(...s.slice(1)); draw(); }
    }, { signal });
    draw();
  },

  // ---------- 拆拼单词 ----------
  roots(box, pageSignal) {
    const signal = freshSignal(this, pageSignal);
    const items = (window.MORPH || []).flatMap((g) => g.items.flatMap((it) => (it.ex || []).map(([w, split, zh]) => ({ w, parts: split.split("+").map((s) => s.trim()).filter(Boolean), zh }))))
      .filter((x) => x.parts.length >= 2 && x.parts.join("").replace(/-/g, "").length >= 4);
    const meanings = {};
    (window.MORPH || []).forEach((g) => g.items.forEach((it) => it.p.split(/[\/,，]/).forEach((p) => { meanings[p.replace(/-/g, "").trim().toLowerCase()] = it.m; })));
    const allParts = [...new Set(items.flatMap((x) => x.parts))];
    const qs = sample(items, Math.min(8, items.length));
    const session = Session.start();
    let i = 0, right = 0, picked = [], wrongTry = false;
    const show = () => {
      if (i >= qs.length) return finish();
      const q = qs[i];
      const tiles = shuffle([...q.parts, ...sample(allParts.filter((p) => !q.parts.includes(p)), 3)]);
      picked = [];
      wrongTry = false;
      const draw = (note = "") => {
        box.innerHTML = `<div class="card rt-card" style="max-width:600px;margin:0 auto">
          <div class="row small muted"><span>${i + 1} / ${qs.length}</span><span class="spacer"></span><span>答对 ${right}</span></div>
          <div class="colloc-zh">${esc(q.zh)}</div>
          <div class="build-line rt-line">${picked.map((k, j) => `<button class="tile in" data-k="${j}">${esc(tiles[k])}</button>`).join("") || `<span class="faint small">按顺序点下面的词块</span>`}</div>
          <div class="tiles">${tiles.map((t, k) => `<button class="tile ${picked.includes(k) ? "used" : ""}" data-t="${k}" title="${esc(meanings[t.replace(/-/g, "").toLowerCase()] || "")}">${esc(t)}</button>`).join("")}</div>
          <div class="center small mt-s" id="rt-msg">${note}</div>
          <div class="row mt"><button class="btn ghost" data-skip>不会，看答案</button><span class="spacer"></span><button class="btn primary" data-chk ${picked.length ? "" : "disabled"}>拼好了</button></div></div>`;
      };
      const reveal = (ok) => {
        if (ok && !wrongTry) right++;
        if (ok) addXP(wrongTry ? 1 : 2);
        box.innerHTML = `<div class="card rt-card" style="max-width:600px;margin:0 auto">
          <div class="colloc-zh">${esc(q.zh)}</div>
          <div class="rt-answer">${q.parts.map((p) => `<span class="rt-part"><b class="en">${esc(p)}</b><small>${esc(meanings[p.replace(/-/g, "").toLowerCase()] || "　")}</small></span>`).join('<span class="rt-plus">+</span>')}</div>
          <div class="center"><span class="en game-word-w">${esc(q.w)}</span> ${speakBtn(q.w)}</div>
          <div class="center mt-s ${ok ? "good-text" : "bad-text"}">${ok ? (wrongTry ? "拼对了（第二次）" : "✅ 一次拼对！") : "记住这个拆法，下次就会了"}</div>
          <div class="row mt" style="justify-content:center"><button class="btn primary" data-next>${i + 1 < qs.length ? "下一个" : "看结果"} <span class="kbd">Enter</span></button></div></div>`;
        TTS.speak(q.w);
      };
      draw();
      box.onclick = (e) => {
        const t = e.target.closest("[data-t]"), k = e.target.closest("[data-k]");
        if (t && !picked.includes(+t.dataset.t)) { picked.push(+t.dataset.t); draw(); }
        else if (k) { picked.splice(+k.dataset.k, 1); draw(); }
        else if (e.target.closest("[data-chk]")) {
          const word = picked.map((j) => tiles[j]).join("+");
          if (word === q.parts.join("+")) reveal(true);
          else if (!wrongTry) { wrongTry = true; picked = []; draw("不对，再试一次（鼠标移到词块上能看到意思）"); }
          else reveal(false);
        } else if (e.target.closest("[data-skip]")) reveal(false);
        else if (e.target.closest("[data-next]")) { i++; show(); }
      };
    };
    const finish = () => {
      box.onclick = null;
      GameStats.end("roots", { win: right >= qs.length * 0.6, score: right, xp: 3 });
      box.innerHTML = Session.finishHtml(session, { emoji: "🧬", title: "拆拼完成！", exit: false, lines: `一次拼对 ${right} / ${qs.length}`, note: "每块词根词缀的意思都在「单词 → 词根词缀」里。" });
      $("[data-finish-actions]", box).innerHTML = `<button class="btn primary" data-again>再来一组</button><a class="btn" href="#/words/roots">去看词根词缀</a>`;
      $("[data-again]", box).onclick = () => this.roots(box, pageSignal);
    };
    onKey(signal, (e) => { if (e.key === "Enter") $("[data-next]", box)?.click(); });
    show();
  },

  // ---------- 限时快答 ----------
  speed(box, pageSignal) {
    const signal = freshSignal(this, pageSignal);
    const pool = GameWords.pool(12);
    if (pool.length < 8) { box.innerHTML = `<div class="card">${emptyGuide("⚡", "词太少了", "先学十几个词再来玩。", [["#/words/new", "🆕 学新词"]])}</div>`; return; }
    const rec = GameStats.rec("speed");
    box.innerHTML = `<div class="card center" style="max-width:560px;margin:0 auto;padding:30px">
      <div style="font-size:46px">⚡</div><h3>60 秒限时快答</h3>
      <p class="muted small">看英文选中文，或者看中文选英文。答对 +1 秒，答错 −3 秒；连对 5 题以后每题算 2 分。</p>
      <p class="small faint">最好成绩：${rec.best || 0} 分 · 词来自${GameWords.learned().length >= 12 ? "你学过的词" : `「${esc(curBook().title)}」`}</p>
      <button class="btn primary lg mt" data-go>开始 <span class="kbd">空格</span></button></div>`;
    let time = 60, score = 0, combo = 0, n = 0, ok = 0, timer = 0, q = null, over = false;
    const missed = [];
    const nextQ = () => {
      const it = pick(pool), rev = Math.random() < 0.4;
      const others = sample(pool.filter((x) => x.w !== it.w && shortMeaning(x) !== shortMeaning(it)), 3);
      const opts = shuffle([it, ...others]);
      q = { it, rev, opts, a: opts.indexOf(it) };
      $("#sp-q", box).innerHTML = rev ? `<div class="sp-prompt">${esc(shortMeaning(it))}</div>` : `<div class="sp-prompt en">${esc(it.w)}</div>`;
      $("#sp-opts", box).innerHTML = opts.map((o, k) => `<button class="option" data-o="${k}"><span class="letter">${k + 1}</span><span ${rev ? 'class="en"' : ""}>${esc(rev ? o.w : shortMeaning(o))}</span></button>`).join("");
    };
    const hud = () => { $("#sp-time", box).textContent = Math.max(0, Math.ceil(time)); $("#sp-score", box).textContent = score; $("#sp-combo", box).textContent = combo >= 2 ? `🔥 ×${combo}` : ""; $("#sp-bar", box).style.width = `${Math.max(0, Math.min(100, (time / 60) * 100))}%`; };
    const answer = (k) => {
      if (over || !q) return;
      n++;
      const btn = $$("#sp-opts .option", box)[k];
      if (k === q.a) { ok++; combo++; score += combo >= 5 ? 2 : 1; time = Math.min(90, time + 1); btn?.classList.add("right"); Sound.play("tick"); }
      else {
        combo = 0; time -= 3; btn?.classList.add("wrong"); $$("#sp-opts .option", box)[q.a]?.classList.add("right"); Sound.play("bad");
        missed.push(q.it);
        if (Store.data.words[q.it.w]) gradeWord(q.it.w, 0);
      }
      hud();
      q = null;
      setTimeout(() => { if (!over) nextQ(); }, k === undefined ? 0 : 260);
    };
    const finish = () => {
      over = true;
      clearInterval(timer);
      const prev = rec.best || 0;
      GameStats.end("speed", { win: score > prev, score, xp: Math.min(15, 2 + Math.floor(score / 3)) });
      const uniq = [...new Map(missed.map((x) => [x.w, x])).values()];
      box.innerHTML = `<div class="card center" style="max-width:620px;margin:0 auto;padding:26px">
        <div style="font-size:42px">${score > prev ? "🏆" : "⏰"}</div><h2>${score} 分</h2>
        <p class="muted">${score > prev ? `新纪录！（之前最好 ${prev} 分）` : `最好成绩 ${prev} 分`} · 答了 ${n} 题，对 ${ok} 题</p>
        ${uniq.length ? `<div class="card-title mt" style="justify-content:center">没认出来的词</div><div class="game-missed">${uniq.slice(0, 8).map((x) => gameWordCard(x.w)).join("")}</div>` : ""}
        <div class="row mt" style="justify-content:center"><button class="btn primary" data-go>再来一局</button></div></div>`;
      bindGameWords(box);
    };
    const start = () => {
      time = 60; score = 0; combo = 0; n = 0; ok = 0; over = false; missed.length = 0;
      box.innerHTML = `<div class="card speed" style="max-width:560px;margin:0 auto">
        <div class="row"><b class="sp-time">⏱ <span id="sp-time">60</span></b><span class="spacer"></span><span id="sp-combo" class="sp-combo"></span><b>得分 <span id="sp-score">0</span></b></div>
        <div class="bar mt-s"><i id="sp-bar" style="width:100%"></i></div>
        <div id="sp-q" class="mt"></div><div id="sp-opts" class="options mt"></div><div class="kbd-hint">按 1–4 快速作答</div></div>`;
      nextQ();
      hud();
      const t0 = Date.now();
      let last = t0;
      timer = setInterval(() => { const now = Date.now(); time -= (now - last) / 1000; last = now; hud(); if (time <= 0) finish(); }, 100);
      signal.addEventListener("abort", () => clearInterval(timer), { once: true });
    };
    box.addEventListener("click", (e) => {
      if (e.target.closest("[data-go]")) start();
      const o = e.target.closest("[data-o]");
      if (o) answer(+o.dataset.o);
    }, { signal });
    onKey(signal, (e) => {
      if (["1", "2", "3", "4"].includes(e.key)) answer(+e.key - 1);
      else if (e.key === " " && $("[data-go]", box)) { e.preventDefault(); start(); }
    });
  },

  // ---------- 填字格 ----------
  cross(box, pageSignal) {
    const signal = freshSignal(this, pageSignal);
    const cands = GameWords.pool(15, (it) => it.w.length >= 3 && it.w.length <= 8);
    const puzzle = makeCrossword(shuffle(cands).slice(0, 40).map((it) => ({ w: it.w, clue: shortMeaning(it) })), 8);
    if (!puzzle || puzzle.words.length < 4) { box.innerHTML = `<div class="card">${emptyGuide("🔠", "词不够排成填字格", "多学一些词再来。", [["#/words/new", "🆕 学新词"]])}</div>`; return; }
    const { grid, words, rows, cols } = puzzle;
    const cellId = (r, c) => `${r}-${c}`;
    const startNum = {};
    words.forEach((w) => { startNum[cellId(w.r, w.c)] = w.n; });
    let dir = "a", checked = false;
    box.innerHTML = `<div class="cw-wrap">
      <div class="cw-board" style="grid-template-columns:repeat(${cols}, var(--cw))">${Array.from({ length: rows * cols }, (_, k) => {
        const r = Math.floor(k / cols), c = k % cols, ch = grid[r][c];
        return ch ? `<label class="cw-cell">${startNum[cellId(r, c)] ? `<small>${startNum[cellId(r, c)]}</small>` : ""}<input maxlength="1" data-r="${r}" data-c="${c}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="第 ${r + 1} 行第 ${c + 1} 列"></label>` : `<div class="cw-cell blank"></div>`;
      }).join("")}</div>
      <div class="cw-clues card">
        ${[["a", "横向 →"], ["d", "纵向 ↓"]].map(([d, t]) => `<div class="card-title">${t}</div>${words.filter((w) => w.d === d).sort((a, b) => a.n - b.n).map((w) => `<div class="cw-clue" data-clue="${w.n}${d}"><b>${w.n}.</b> ${esc(w.clue)} <span class="faint">(${w.w.length})</span></div>`).join("")}`).join("")}
        <div class="row mt" style="gap:8px;flex-wrap:wrap"><button class="btn sm" data-check>检查</button><button class="btn sm ghost" data-letter>💡 提示一个字母</button><button class="btn sm ghost" data-reveal>看答案</button><span class="spacer"></span><button class="btn sm primary" data-again>换一组</button></div>
        <div class="small muted mt-s" id="cw-msg">点格子输入；方向键移动，再点一次同一格切换横 / 竖。</div>
      </div></div>`;
    const inp = (r, c) => $(`input[data-r="${r}"][data-c="${c}"]`, box);
    const wordAt = (r, c, d) => words.find((w) => w.d === d && (d === "a" ? w.r === r && c >= w.c && c < w.c + w.w.length : w.c === c && r >= w.r && r < w.r + w.w.length));
    const highlight = (r, c) => {
      $$(".cw-cell.hl", box).forEach((x) => x.classList.remove("hl"));
      $$(".cw-clue.hl", box).forEach((x) => x.classList.remove("hl"));
      let w = wordAt(r, c, dir);
      if (!w) { dir = dir === "a" ? "d" : "a"; w = wordAt(r, c, dir); }
      if (!w) return;
      for (let k = 0; k < w.w.length; k++) inp(w.d === "a" ? w.r : w.r + k, w.d === "a" ? w.c + k : w.c)?.parentElement.classList.add("hl");
      $(`[data-clue="${w.n}${w.d}"]`, box)?.classList.add("hl");
    };
    const solved = () => words.every((w) => [...w.w].every((ch, k) => (inp(w.d === "a" ? w.r : w.r + k, w.d === "a" ? w.c + k : w.c)?.value || "").toLowerCase() === ch));
    let won = false;
    const winCheck = () => {
      if (won || !solved()) return;
      won = true;
      GameStats.end("cross", { win: true, score: words.length, xp: 4 + words.length });
      Sound.play("achv");
      $$(".cw-cell input", box).forEach((x) => { x.readOnly = true; x.parentElement.classList.add("ok"); });
      $("#cw-msg", box).innerHTML = `<b class="good-text">🎉 全部填对了！</b>`;
      const list = el(`<div class="card mt"><div class="card-title">这一组的词</div><div class="game-missed">${words.map((w) => gameWordCard(w.w)).join("")}</div></div>`);
      box.appendChild(list);
      bindGameWords(list);
    };
    box.addEventListener("focusin", (e) => { const x = e.target.closest("input[data-r]"); if (x) highlight(+x.dataset.r, +x.dataset.c); }, { signal });
    box.addEventListener("mousedown", (e) => {
      const x = e.target.closest("input[data-r]");
      if (x && document.activeElement === x) { dir = dir === "a" ? "d" : "a"; setTimeout(() => highlight(+x.dataset.r, +x.dataset.c)); }
    }, { signal });
    box.addEventListener("input", (e) => {
      const x = e.target.closest("input[data-r]");
      if (!x) return;
      x.value = x.value.replace(/[^a-z]/gi, "").slice(-1).toLowerCase();
      x.parentElement.classList.remove("bad");
      if (x.value) { const r = +x.dataset.r + (dir === "d" ? 1 : 0), c = +x.dataset.c + (dir === "a" ? 1 : 0); inp(r, c)?.focus(); }
      winCheck();
    }, { signal });
    box.addEventListener("keydown", (e) => {
      const x = e.target.closest("input[data-r]");
      if (!x) return;
      const r = +x.dataset.r, c = +x.dataset.c;
      const mv = { ArrowLeft: [0, -1, "a"], ArrowRight: [0, 1, "a"], ArrowUp: [-1, 0, "d"], ArrowDown: [1, 0, "d"] }[e.key];
      if (mv) { e.preventDefault(); dir = mv[2]; for (let k = 1; k < 12; k++) { const t = inp(r + mv[0] * k, c + mv[1] * k); if (t) { t.focus(); break; } } }
      else if (e.key === "Backspace" && !x.value) { e.preventDefault(); const t = inp(r - (dir === "d" ? 1 : 0), c - (dir === "a" ? 1 : 0)); if (t) { t.value = ""; t.focus(); } }
    }, { signal });
    box.addEventListener("click", (e) => {
      if (e.target.closest("[data-again]")) return this.cross(box, pageSignal);
      if (e.target.closest("[data-check]")) {
        checked = true;
        let bad = 0;
        $$(".cw-cell input", box).forEach((x) => { const wrong = x.value && x.value !== grid[+x.dataset.r][+x.dataset.c]; x.parentElement.classList.toggle("bad", !!wrong); if (wrong) bad++; });
        $("#cw-msg", box).textContent = bad ? `有 ${bad} 个字母不对（标红了）` : "目前填的都对，继续！";
      }
      if (e.target.closest("[data-letter]")) {
        const empty = $$(".cw-cell input", box).filter((x) => x.value !== grid[+x.dataset.r][+x.dataset.c]);
        const x = document.activeElement?.matches?.("input[data-r]") && empty.includes(document.activeElement) ? document.activeElement : pick(empty);
        if (x) { x.value = grid[+x.dataset.r][+x.dataset.c]; x.parentElement.classList.add("hinted"); winCheck(); }
      }
      if (e.target.closest("[data-reveal]")) {
        $$(".cw-cell input", box).forEach((x) => { if (x.value !== grid[+x.dataset.r][+x.dataset.c]) { x.value = grid[+x.dataset.r][+x.dataset.c]; x.parentElement.classList.add("hinted"); } });
        if (!won) { won = true; GameStats.end("cross", { win: false, xp: 1 }); }
        $("#cw-msg", box).textContent = "答案都填上了。换一组再挑战吧。";
      }
    }, { signal });
    void checked;
  },

  // ---------- 单元 Boss 战 ----------
  boss(box, pageSignal, [unitArg]) {
    const signal = freshSignal(this, pageSignal);
    const b = curBook(), rec = GameStats.rec("boss");
    const units = b.units.map((u, ui) => ({ u, ui, learned: u.items.filter((x) => Store.data.words[x.w]).length, n: u.items.length })).filter((x) => x.n >= 6);
    const bosses = ["👾", "🐉", "🦖", "🐙", "👹", "🤖", "🦂", "🧟", "🐺", "🦈"];
    if (unitArg === undefined) {
      box.innerHTML = `<p class="small muted">「${esc(b.title)}」的单元。学过的词多的单元打起来更容易；打赢后会记下星星。可以在「单词」页换词书。</p>
        <div class="boss-grid">${units.map((x) => { const s = rec.units?.[`${b.id}:${x.ui}`] || 0; return `<a class="boss-unit" href="#/games/boss/${x.ui}"><span class="boss-ico">${bosses[x.ui % bosses.length]}</span><b>${esc(x.u.title)}</b><small class="muted">学过 ${x.learned} / ${x.n}</small><small>${s ? "★".repeat(s) + "☆".repeat(3 - s) : "未挑战"}</small></a>`; }).join("")}</div>`;
      return;
    }
    const unit = b.units[+unitArg];
    if (!unit) { box.innerHTML = `<div class="card empty">没有这个单元</div>`; return; }
    const items = unit.items.filter((x) => x.m && GameWords.ok(x.w));
    const learnedFirst = [...items.filter((x) => Store.data.words[x.w]), ...shuffle(items.filter((x) => !Store.data.words[x.w]))];
    const qs = shuffle(learnedFirst.slice(0, 10));
    const HP = qs.length * 10, ico = bosses[+unitArg % bosses.length];
    let hp = HP, hearts = 3, i = 0, combo = 0, answered = false;
    const session = Session.start();
    const draw = () => {
      if (hp <= 0 || hearts <= 0 || i >= qs.length) return finish();
      const it = qs[i], type = ["mean", "word", "listen", "spell"][i % 4];
      answered = false;
      const others = sample(items.filter((x) => x.w !== it.w && shortMeaning(x) !== shortMeaning(it)), 3), opts = shuffle([it, ...others]);
      box.innerHTML = `<div class="card boss-arena" style="max-width:620px;margin:0 auto">
        <div class="row"><span class="boss-hearts">${"❤️".repeat(hearts)}${"🤍".repeat(3 - hearts)}</span><span class="spacer"></span><span class="small muted">${esc(unit.title)} · ${i + 1} / ${qs.length}</span></div>
        <div class="boss-figure" id="boss-fig">${ico}</div>
        <div class="bar boss-hp"><i style="width:${(hp / HP) * 100}%"></i></div><div class="small center faint">HP ${hp} / ${HP}${combo >= 3 ? ` · 🔥 连击 ×${combo}，伤害加倍` : ""}</div>
        <div class="boss-q mt">${type === "mean" ? `<div class="sp-prompt en">${esc(it.w)}</div>` : type === "word" ? `<div class="sp-prompt">${esc(shortMeaning(it))}</div>`
          : type === "listen" ? `<div class="center">${speakBtn(it.w)} <span class="small muted">听音选意思</span></div>` : `<div class="sp-prompt">${esc(shortMeaning(it))}</div><input class="input en center" id="boss-in" placeholder="拼出这个词，Enter" autocomplete="off" spellcheck="false" autocapitalize="off">`}</div>
        ${type === "spell" ? "" : `<div class="options mt">${opts.map((o, k) => `<button class="option" data-o="${k}"><span class="letter">${k + 1}</span><span ${type === "word" ? 'class="en"' : ""}>${esc(type === "word" ? o.w : shortMeaning(o))}</span></button>`).join("")}</div>`}
        <div class="center small mt-s" id="boss-msg"></div></div>`;
      if (type === "listen") setTimeout(() => TTS.speak(it.w), 200);
      const inp = $("#boss-in", box);
      if (inp) { setTimeout(() => inp.focus(), 30); inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && inp.value.trim()) { e.preventDefault(); hit(spellNorm(inp.value) === spellNorm(it.w), it); } }); }
      $$("[data-o]", box).forEach((o) => (o.onclick = () => { if (answered) return; const ok = opts[+o.dataset.o] === it; o.classList.add(ok ? "right" : "wrong"); if (!ok) $$("[data-o]", box)[opts.indexOf(it)].classList.add("right"); hit(ok, it); }));
    };
    const hit = (ok, it) => {
      if (answered) return;
      answered = true;
      const fig = $("#boss-fig", box), msg = $("#boss-msg", box);
      if (ok) {
        combo++;
        const dmg = combo >= 3 ? 20 : 10;
        hp = Math.max(0, hp - dmg);
        fig.classList.add("hit");
        msg.innerHTML = `<b class="good-text">💥 命中！−${dmg}</b>`;
        addXP(1);
        Sound.play("good");
      } else {
        combo = 0;
        hearts--;
        box.querySelector(".boss-arena").classList.add("shake");
        msg.innerHTML = `<b class="bad-text">💢 被反击了！</b> 答案：<span class="en">${esc(it.w)}</span> ${esc(shortMeaning(it))}`;
        if (Store.data.words[it.w]) gradeWord(it.w, 0);
        Sound.play("bad");
      }
      i++;
      setTimeout(draw, ok ? 700 : 1600);
    };
    const finish = () => {
      const win = hp <= 0 || (i >= qs.length && hp <= HP * 0.3 && hearts > 0);
      const stars = !win ? 0 : hearts === 3 ? 3 : hearts === 2 ? 2 : 1;
      const k = `${b.id}:${unitArg}`;
      if (win) (rec.units ||= {})[k] = Math.max(stars, rec.units[k] || 0);
      GameStats.end("boss", { win, score: stars, xp: win ? 10 + stars * 3 : 3 });
      box.innerHTML = Session.finishHtml(session, {
        emoji: win ? "🏆" : "💀", title: win ? `打败了 ${esc(unit.title)} 的 Boss！` : "这次没打过……", exit: false,
        lines: win ? `${"★".repeat(stars)}${"☆".repeat(3 - stars)} · 剩下 ${hearts} 颗心` : `Boss 还剩 ${hp} / ${HP} HP。先把这个单元的词复习一遍再来！`,
      });
      $("[data-finish-actions]", box).innerHTML = `<a class="btn primary" href="#/games/boss">选别的单元</a><button class="btn" data-retry>再打一次</button><a class="btn ghost" href="#/words/new/${unitArg}">学这个单元的词</a>`;
      $("[data-retry]", box).onclick = () => this.boss(box, pageSignal, [unitArg]);
      if (win) Sound.play("achv");
    };
    onKey(signal, (e) => { if (["1", "2", "3", "4"].includes(e.key)) $$("[data-o]", box)[+e.key - 1]?.click(); });
    draw();
  },

  // ---------- 听力侦探 ----------
  case(box, pageSignal, [caseId]) { CaseGame.render(box, freshSignal(this, pageSignal), caseId, () => this.case(box, pageSignal, [caseId])); },
};

// 填字格生成：最长的词放中间，之后每个词找和已放的字母交叉、不和别的词挨着的位置，交叉越多越好
function makeCrossword(list, maxWords = 8, size = 15) {
  // 第一个放最长的（在前 10 个里挑），其余按传进来的（已经打乱的）顺序试，长短词混在一起
  const words = [...new Map(list.filter((x) => /^[a-z]+$/.test(x.w)).map((x) => [x.w, x])).values()];
  if (words.length < 3) return null;
  const head = words.slice(0, 10).reduce((a, b) => (b.w.length > a.w.length ? b : a));
  words.splice(words.indexOf(head), 1);
  words.unshift(head);
  const g = Array.from({ length: size }, () => Array(size).fill(""));
  const placed = [];
  const at = (r, c) => (r >= 0 && c >= 0 && r < size && c < size ? g[r][c] : "");
  const fits = (w, r, c, d) => {
    const dr = d === "d" ? 1 : 0, dc = d === "a" ? 1 : 0;
    if (r < 0 || c < 0 || r + dr * (w.length - 1) >= size || c + dc * (w.length - 1) >= size) return -1;
    if (at(r - dr, c - dc) || at(r + dr * w.length, c + dc * w.length)) return -1; // 前后不能紧挨别的字母
    let cross = 0;
    for (let k = 0; k < w.length; k++) {
      const rr = r + dr * k, cc = c + dc * k, cur = g[rr][cc];
      if (cur) { if (cur !== w[k]) return -1; cross++; continue; }
      // 新放的字母两侧不能有别的字母（不然会拼出不存在的词）
      if (at(rr + dc, cc + dr) || at(rr - dc, cc - dr)) return -1;
    }
    return cross === w.length ? -1 : cross;
  };
  const put = (x, r, c, d) => { for (let k = 0; k < x.w.length; k++) g[r + (d === "d" ? k : 0)][c + (d === "a" ? k : 0)] = x.w[k]; placed.push({ ...x, r, c, d }); };
  const first = words.shift();
  put(first, Math.floor(size / 2), Math.floor((size - first.w.length) / 2), "a");
  for (const x of words) {
    if (placed.length >= maxWords) break;
    let best = null;
    for (const p of placed) for (let i = 0; i < p.w.length; i++) for (let j = 0; j < x.w.length; j++) {
      if (p.w[i] !== x.w[j]) continue;
      const d = p.d === "a" ? "d" : "a";
      const r = p.d === "a" ? p.r - j : p.r + i, c = p.d === "a" ? p.c + i : p.c - j;
      const s = fits(x.w, r, c, d);
      if (s > 0 && (!best || s > best.s)) best = { r, c, d, s };
    }
    if (best) put(x, best.r, best.c, best.d);
  }
  // 裁掉空白，编号（按从上到下、从左到右）
  const rs = placed.flatMap((p) => [p.r, p.r + (p.d === "d" ? p.w.length - 1 : 0)]), cs = placed.flatMap((p) => [p.c, p.c + (p.d === "a" ? p.w.length - 1 : 0)]);
  const r0 = Math.min(...rs), r1 = Math.max(...rs), c0 = Math.min(...cs), c1 = Math.max(...cs);
  const grid = g.slice(r0, r1 + 1).map((row) => row.slice(c0, c1 + 1));
  placed.forEach((p) => { p.r -= r0; p.c -= c0; });
  const starts = [...new Set(placed.map((p) => p.r * 100 + p.c))].sort((a, b) => a - b);
  placed.forEach((p) => { p.n = starts.indexOf(p.r * 100 + p.c) + 1; });
  return { grid, words: placed, rows: r1 - r0 + 1, cols: c1 - c0 + 1 };
}

// ---------- 听力侦探 ----------
const CaseGame = {
  weekNo() { return Math.floor((new Date(weekStart() + "T00:00:00") - new Date("2026-01-05T00:00:00")) / (7 * 864e5)); },
  weekCase() { const L = window.DETECTIVE_CASES || []; return L[((this.weekNo() % L.length) + L.length) % L.length]; },
  find(id) { return (window.DETECTIVE_CASES || []).find((c) => c.id === id) || (Store.data.games?.case?.ai?.id === id ? Store.data.games.case.ai : null); },
  render(box, signal, caseId, rerender) {
    const rec = GameStats.rec("case"), wk = this.weekCase();
    if (!caseId) {
      const all = window.DETECTIVE_CASES || [];
      box.innerHTML = `<div class="card case-week"><div class="card-title">🗞️ 本周案件 <span class="badge brand">${esc(wk.level)}</span></div>
          <h3 style="margin:4px 0">${esc(wk.title)} <span class="small muted en">${esc(wk.en)}</span></h3><p class="muted">${esc(wk.intro)}</p>
          <a class="btn primary" href="#/games/case/${wk.id}">${rec.solved?.[wk.id] ? "再听一遍" : "开始调查"}</a></div>
        <div class="card mt"><div class="card-title">🗂️ 案卷</div>${all.map((c) => `<a class="case-row" href="#/games/case/${c.id}"><b>${esc(c.title)}</b> <span class="small muted en">${esc(c.en)}</span><span class="spacer"></span><span class="small ${rec.solved?.[c.id] ? "good-text" : "faint"}">${rec.solved?.[c.id] ? "✓ 已破案" : c.id === wk.id ? "本周" : ""}</span></a>`).join("")}
          ${AI.enabled ? `<div class="row mt"><button class="btn" data-ai-case>✨ 让 AI 写一个新案子</button><span class="small faint">按你的水平生成，大约 20 秒</span></div>` : `<div class="small faint mt">接入 AI 后可以无限生成新案子。</div>`}
          ${rec.ai ? `<a class="case-row" href="#/games/case/${rec.ai.id}"><b>✨ ${esc(rec.ai.title)}</b> <span class="small muted">AI 生成</span></a>` : ""}</div>`;
      $("[data-ai-case]", box)?.addEventListener("click", () => this.generate(box));
      return;
    }
    const cs = this.find(caseId);
    if (!cs) { box.innerHTML = `<div class="card empty">没有这个案子 <a href="#/games/case">回到案卷</a></div>`; return; }
    const heard = new Set(), shown = new Set();
    let stage = "listen", qi = 0, right = 0, hints = 0;
    // 选项打乱（数据里正确答案都在第一个）
    const qs = cs.questions.map((q) => { const o = shuffle(q.o.map((t, k) => [t, k])); return { ...q, o: o.map((x) => x[0]), a: o.findIndex((x) => x[1] === q.a) }; });
    const vo = shuffle(cs.verdict.o.map((t, k) => [t, k])), verdict = { ...cs.verdict, o: vo.map((x) => x[0]), a: vo.findIndex((x) => x[1] === cs.verdict.a) };
    const play = async (k) => {
      const [who, en] = cs.clips[k], [, voice] = cs.cast[who] || [];
      heard.add(k);
      $$(".case-clip", box).forEach((x) => x.classList.toggle("playing", +x.dataset.clip === k));
      await TTS.speak(en, (Store.prefs.tts_rate || 0.9) * 0.95, voice);
      $(`.case-clip[data-clip="${k}"]`, box)?.classList.remove("playing");
      $(`.case-clip[data-clip="${k}"]`, box)?.classList.add("heard");
    };
    const clipsHtml = () => cs.clips.map(([who, en, zh], k) => `<div class="case-clip ${heard.has(k) ? "heard" : ""}" data-clip="${k}">
      <button class="btn sm" data-play="${k}">▶</button><b>${esc(cs.cast[who]?.[0] || who)}</b>
      ${stage === "solved" || shown.has(k) ? `<div class="case-text"><div class="en">${esc(en)}</div><div class="small muted">${esc(zh)}</div></div>` : `<button class="btn sm ghost" data-peek="${k}" title="看原文会记一次提示">🔍 看原文</button>`}</div>`).join("");
    const draw = () => {
      let main = "";
      if (stage === "listen") main = `<p class="muted">${esc(cs.intro)}</p><div class="case-clips">${clipsHtml()}</div>
        <div class="row mt"><span class="small faint">已听 ${heard.size} / ${cs.clips.length} 段证词。证词可以反复听。</span><span class="spacer"></span><button class="btn primary" data-to-q ${heard.size ? "" : "disabled"}>开始答题 →</button></div>`;
      else if (stage === "q") {
        const q = qs[qi];
        main = `<div class="small muted">第 ${qi + 1} / ${qs.length} 题 · 可以回去再听</div><div class="case-q">${esc(q.q)}</div>
          <div class="options">${q.o.map((o, k) => `<button class="option" data-qa="${k}"><span class="letter">${k + 1}</span><span>${esc(o)}</span></button>`).join("")}</div>
          <div id="case-ex"></div><details class="mt"><summary class="small" style="cursor:pointer">🎧 再听证词</summary><div class="case-clips">${clipsHtml()}</div></details>`;
      } else if (stage === "verdict") {
        main = `<div class="case-q">🕵️ ${esc(verdict.q)}</div><div class="options">${verdict.o.map((o, k) => `<button class="option" data-va="${k}"><span class="letter">${k + 1}</span><span>${esc(o)}</span></button>`).join("")}</div>
          <details class="mt"><summary class="small" style="cursor:pointer">🎧 再听证词</summary><div class="case-clips">${clipsHtml()}</div></details>`;
      } else {
        main = `<div class="explain ${stage === "solved" && verdictOk ? "good" : "bad"}"><b>${verdictOk ? "🎉 破案了！" : "❌ 推理错了……"}</b> ${esc(cs.verdict.why)}</div>
          <p class="small muted">听力题答对 ${right} / ${qs.length}${hints ? ` · 看了 ${hints} 次原文` : ""}</p>
          <div class="card-title mt">📜 全部证词</div><div class="case-clips">${clipsHtml()}</div>
          <div class="row mt"><a class="btn primary" href="#/games/case">回到案卷</a><button class="btn" data-restart>再破一次</button></div>`;
      }
      box.innerHTML = `<div class="card case-card"><div class="card-title">🕵️ ${esc(cs.title)} <span class="small muted en" style="font-weight:400">${esc(cs.en)}</span><span class="spacer"></span><span class="badge">${esc(cs.level || "")}</span></div>${main}</div>`;
    };
    let verdictOk = false;
    box.onclick = (e) => {
      const p = e.target.closest("[data-play]"), pk = e.target.closest("[data-peek]"), qa = e.target.closest("[data-qa]"), va = e.target.closest("[data-va]");
      if (p) play(+p.dataset.play);
      else if (pk) { shown.add(+pk.dataset.peek); hints++; draw(); }
      else if (e.target.closest("[data-to-q]")) { stage = "q"; draw(); }
      else if (qa && !qa.disabled) {
        const q = qs[qi], k = +qa.dataset.qa, ok = k === q.a;
        $$("[data-qa]", box).forEach((b, j) => { b.disabled = true; if (j === q.a) b.classList.add("right"); else if (j === k) b.classList.add("wrong"); });
        if (ok) right++;
        Sound.play(ok ? "good" : "bad");
        $("#case-ex", box).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${ok ? "✅" : "❌"} ${esc(q.why)}</div><div class="row mt-s"><span class="spacer"></span><button class="btn primary" data-qnext>${qi + 1 < qs.length ? "下一题" : "最后的推理 →"}</button></div>`;
      } else if (e.target.closest("[data-qnext]")) { qi++; stage = qi < qs.length ? "q" : "verdict"; draw(); }
      else if (va) {
        verdictOk = +va.dataset.va === verdict.a;
        stage = "solved";
        if (verdictOk) (rec.solved ||= {})[cs.id] = today();
        GameStats.end("case", { win: verdictOk, score: right, xp: verdictOk ? 10 + right * 2 - hints : 3 });
        Sound.play(verdictOk ? "achv" : "bad");
        draw();
      } else if (e.target.closest("[data-restart]")) rerender();
    };
    signal.addEventListener("abort", () => { box.onclick = null; }, { once: true });
    draw();
  },
  async generate(box) {
    const btn = $("[data-ai-case]", box);
    btn.disabled = true;
    btn.textContent = "AI 正在写案子…";
    const voices = ["en-US-GuyNeural", "en-US-JennyNeural", "en-GB-RyanNeural", "en-GB-SoniaNeural", "en-AU-NatashaNeural", "en-US-AndrewNeural"];
    const r = await AI.json(`You write short, original, family-friendly mystery puzzles for English listening practice. ${LEARNER_PROFILE}`,
      `Write a new mystery case (not about cakes, laptops, windows or necklaces). 4-5 short spoken testimonies (each 2-4 sentences, natural spoken English at the learner's level). The solution must be logically deducible from small details in the testimonies (a time, a colour, something a person should not know, physical evidence). It may also be that nobody did it.
Return JSON: {"title": "中文标题", "en": "English title", "level": "CEFR like B1", "intro": "两三句中文背景介绍",
 "cast": {"key": ["中文称呼（身份）", "one of: ${voices.join(", ")}"]},
 "clips": [["castKey", "English testimony", "中文翻译"]],
 "questions": [{"q": "中文听力理解题", "o": ["正确答案", "错误1", "错误2", "错误3"], "a": 0, "why": "引用证词里的原句说明"}],  // exactly 4 questions, correct answer always first
 "verdict": {"q": "最后的推理问题（中文）", "o": ["正确结论", "错误1", "错误2", "错误3"], "a": 0, "why": "中文推理过程"}}`);
    if (!r.ok) { toast(r.error || "生成失败", "bad"); btn.disabled = false; btn.textContent = "✨ 让 AI 写一个新案子"; return; }
    const d = r.data;
    if (!d?.clips?.length || !d.questions?.length || !d.verdict?.o) { toast("AI 写的案子格式不对，再试一次", "bad"); btn.disabled = false; btn.textContent = "✨ 让 AI 写一个新案子"; return; }
    d.id = "ai" + Date.now().toString(36);
    d.questions.forEach((q) => { q.a = q.a || 0; });
    d.verdict.a = d.verdict.a || 0;
    const rec = GameStats.rec("case");
    rec.ai = d;
    rec.t = Date.now();
    Store.save();
    Router.go("games/case/" + d.id);
  },
};
