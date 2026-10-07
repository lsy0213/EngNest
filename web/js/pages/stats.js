// 学习统计：记忆保持率、未来 7 天的复习量、各项能力、半年打卡
App.pages.stats = {
  // 复习日志里「不是第一次见」的那些评分，按天统计记住的比例
  retention(days = 30) {
    const log = Store.data.revlog || [];
    const first = new Set(), byDay = {};
    for (const [id, ts, g] of log) {
      if (!first.has(id)) { first.add(id); continue; } // 第一次学不算复习
      const d = fmtDate(new Date(ts));
      (byDay[d] ||= [0, 0])[g > 0 ? 0 : 1]++;
    }
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(today(), -i), [ok, bad] = byDay[d] || [0, 0];
      out.push({ d, n: ok + bad, r: ok + bad ? ok / (ok + bad) : null });
    }
    const tot = out.reduce((a, x) => [a[0] + (x.r ?? 0) * x.n, a[1] + x.n], [0, 0]);
    return { days: out, overall: tot[1] ? tot[0] / tot[1] : null, n: tot[1] };
  },
  // 未来 7 天每天要复习多少（今天包括已经过期的）
  forecast() {
    const recs = [...Object.values(Store.data.words), ...Object.values(Store.data.sent_srs || {})];
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today(), i);
      return { d, n: recs.filter((r) => (i === 0 ? r.due <= d : r.due === d)).length };
    });
  },
  // 六项能力（0–100），没有数据的项是 null
  skills() {
    const D = Store.data, avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
    const words = Object.values(D.words);
    const g = Object.values(D.grammar || {}).map((x) => (x.best || 0) / 5);
    const r = Object.values(D.reading || {}).map((x) => Math.min(1, (x.score || 0) / (x.n || 3)));
    const p = Object.values(D.pron || {}).map((x) => (x.best || 0) / 100);
    const es = (D.essays || []).map((e) => +e.result?.score).filter((x) => x > 0).map((x) => Math.min(1, x / (x > 10 ? 100 : 9)));
    const st = D.stats || {};
    return [
      ["词汇", words.length ? Math.min(1, words.filter((s) => s.box >= MASTERED_BOX).length / Math.max(50, words.length)) * 0.6 + Math.min(1, words.length / 3000) * 0.4 : null],
      ["语法", avg(g)], ["阅读", avg(r)],
      ["听力", st.dictation ? st.dictation_ok / st.dictation : null],
      ["口语", avg(p)], ["写作", avg(es)],
    ].map(([k, v]) => [k, v == null ? null : Math.round(v * 100)]);
  },

  render(root) {
    const ret = this.retention(), fc = this.forecast(), sk = this.skills(), lv = Store.data.level;
    const words = Object.values(Store.data.words);
    const mastered = words.filter((s) => s.box >= MASTERED_BOX).length;
    const reviews30 = ret.days.reduce((s, x) => s + x.n, 0);
    root.innerHTML = pageHead("学习统计", "复习安排用 FSRS 记忆算法；这里的数据都只在你的电脑上。") + `
      <div class="grid grid-4 stats-tiles">
        <div class="card stat"><b>${words.length}</b><span>学过的单词</span></div>
        <div class="card stat"><b>${mastered}</b><span>已掌握（复习间隔 ≥ 7 天）</span></div>
        <div class="card stat"><b>${ret.overall == null ? "—" : Math.round(ret.overall * 100) + "%"}</b><span>近 30 天复习记住率（${ret.n} 次）</span></div>
        <div class="card stat"><b>${lv ? esc(lv.cefr) : "—"}</b><span>${lv ? `水平测试 · ${esc(lv.date)}` : `<a href="#/level">做个水平测试</a>`}</span></div>
      </div>
      <div class="grid grid-2 mt">
        <div class="card"><div class="card-title">📈 记忆保持率（近 30 天）</div>${this.lineChart(ret.days)}
          <p class="small muted">每天复习时「认识 / 模糊」占的比例。目标是 ${Math.round((Store.prefs.retention || 0.9) * 100)}% 左右：太高说明可以多学新词，太低说明新词学得太快了。</p></div>
        <div class="card"><div class="card-title">🗓️ 未来 7 天的复习量</div>${this.barChart(fc)}
          <p class="small muted">单词和短语句子加在一起。今天的包括之前没复习完的。</p></div>
        <div class="card"><div class="card-title">🧭 各项能力</div>${this.radar(sk)}
          <p class="small muted">按各个练习的成绩估算，没练过的项目显示为空。词汇看掌握比例和学过的词数，听力看听写全对的比例，口语看跟读评测的最好成绩。</p></div>
        <div class="card"><div class="card-title">🔥 最近半年</div><div class="heat heat-long">${this.heat(26)}</div>
          <p class="small muted">颜色越深当天经验值越多。共学习 ${Object.values(Store.data.days).filter((x) => x.xp > 0).length} 天，近 30 天复习 ${reviews30} 次。</p></div>
      </div>`;
  },

  lineChart(days) {
    // 纵轴从 50% 到 100%：记住率一般都在 70% 以上，从 0 画起曲线会挤在顶上看不出变化
    const W = 320, H = 140, pad = 24, lo = 0.5, Y = (v) => H - pad - ((Math.max(lo, v) - lo) / (1 - lo)) * (H - pad * 2);
    const pts = days.map((x, i) => [pad + (i * (W - pad * 2)) / (days.length - 1), x.r == null ? null : Y(x.r)]);
    const segs = [];
    let cur = [];
    pts.forEach(([x, y]) => { if (y == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push(`${x.toFixed(1)},${y.toFixed(1)}`); });
    if (cur.length) segs.push(cur);
    const target = Y(Store.prefs.retention || 0.9);
    if (!days.some((x) => x.n)) return `<div class="empty small muted" style="padding:30px">还没有复习记录，复习过几天以后这里会出现曲线。</div>`;
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="近 30 天每天的复习记住率">
      ${[0.5, 0.75, 1].map((v) => `<line x1="${pad}" x2="${W - pad}" y1="${Y(v)}" y2="${Y(v)}" class="grid-line"/><text x="0" y="${Y(v) + 4}" class="axis">${v * 100}%</text>`).join("")}
      <line x1="${pad}" x2="${W - pad}" y1="${target}" y2="${target}" class="target-line"/>
      ${segs.map((s) => `<polyline points="${s.join(" ")}" class="line"/>`).join("")}
      ${pts.map(([x, y], i) => (y == null ? "" : `<circle cx="${x}" cy="${y}" r="2.5" class="dot"><title>${days[i].d}：${Math.round(days[i].r * 100)}%（${days[i].n} 次）</title></circle>`)).join("")}
    </svg>`;
  },

  barChart(fc) {
    const W = 320, H = 140, pad = 22, max = Math.max(1, ...fc.map((x) => x.n)), bw = (W - pad * 2) / fc.length;
    const wd = "日一二三四五六";
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="未来 7 天每天要复习的数量">
      ${fc.map((x, i) => { const h = (x.n / max) * (H - pad * 2); const X = pad + i * bw + 6;
        return `<rect x="${X}" y="${H - pad - h}" width="${bw - 12}" height="${Math.max(h, 1)}" rx="4" class="bar-rect"><title>${x.d}：${x.n} 条</title></rect>
          <text x="${X + (bw - 12) / 2}" y="${H - pad - h - 4}" class="val">${x.n}</text>
          <text x="${X + (bw - 12) / 2}" y="${H - 6}" class="axis" text-anchor="middle">${i === 0 ? "今天" : "周" + wd[new Date(x.d).getDay()]}</text>`; }).join("")}
    </svg>`;
  },

  radar(sk) {
    const S = 260, c = S / 2, R = 92, n = sk.length;
    const pt = (i, r) => [c + r * Math.sin((2 * Math.PI * i) / n), c - r * Math.cos((2 * Math.PI * i) / n)];
    const ring = (f) => sk.map((_, i) => pt(i, R * f).map((v) => v.toFixed(1)).join(",")).join(" ");
    const has = sk.some(([, v]) => v != null);
    return `<svg viewBox="0 0 ${S} ${S}" class="chart radar" role="img" aria-label="各项能力：${sk.map(([k, v]) => `${k} ${v ?? "无数据"}`).join("，")}">
      ${[0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${ring(f)}" class="grid-line"/>`).join("")}
      ${sk.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" class="grid-line"/>`; }).join("")}
      ${has ? `<polygon points="${sk.map(([, v], i) => pt(i, (R * (v || 0)) / 100).map((x) => x.toFixed(1)).join(",")).join(" ")}" class="area"/>` : ""}
      ${sk.map(([k, v], i) => { const [x, y] = pt(i, R + 18); return `<text x="${x}" y="${y + 4}" text-anchor="middle" class="label">${k}${v == null ? "" : ` ${v}`}</text>`; }).join("")}
    </svg>`;
  },

  heat(weeks) {
    const goal = Store.prefs.daily_goal, cells = [];
    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const date = addDays(today(), -i), xp = Store.data.days[date]?.xp || 0;
      const lv = xp === 0 ? "" : xp < goal / 2 ? "l1" : xp < goal ? "l2" : "l3";
      cells.push(`<i class="${lv} ${i === 0 ? "today" : ""}" title="${date}：${xp} XP"></i>`);
    }
    return cells.join("");
  },
};
