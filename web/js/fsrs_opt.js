// ============================================================
// 用自己的复习记录优化 FSRS 参数（纯 JS，不需要下载任何东西）
// 复习记录 Store.data.revlog：[id, 时间戳, 评分 0–3, 间隔]。按卡片排好，用和 ts-fsrs 一样的 FSRS-6 公式算出
// 每次复习前「还记得的概率」，和实际有没有记住比，用 Adam 梯度下降（数值梯度）把对数损失降下来。
// 只有拿出来验证的那部分记录上也更准，才建议换成新参数。参数存在 Store.prefs.fsrs_w。
// ============================================================
const FsrsOpt = {
  MIN_REVIEWS: 400, // 至少这么多次「不是第一次」的复习，结果才靠得住
  CLAMP: [[0.001, 100], [0.001, 100], [0.001, 100], [0.001, 100], [1, 10], [0.001, 4], [0.001, 4], [0.001, 0.75], [0, 4.5], [0, 0.8], [0.001, 3.5],
    [0.001, 5], [0.001, 0.25], [0.001, 0.9], [0, 4], [0, 1], [1, 6], [0, 2], [0, 2], [0, 0.8], [0.1, 0.8]],
  defaults() { return [...(window.FSRS?.default_w || [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542])]; },

  // 复习记录 → 每张卡的复习序列 [[相隔天数, 评分 1–4], …]（按本地日期算相隔几天，第一次是 0）
  sequences(revlog) {
    const by = new Map();
    for (const e of revlog || []) {
      if (!Array.isArray(e) || e.length < 3 || !(e[2] >= 0 && e[2] <= 3)) continue;
      (by.get(e[0]) || by.set(e[0], []).get(e[0])).push(e);
    }
    const day = (ts) => { const d = new Date(ts); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5); };
    const out = [];
    for (const list of by.values()) {
      list.sort((a, b) => a[1] - b[1]);
      let prev = null;
      const seq = list.map((e) => { const d = day(e[1]); const t = prev == null ? 0 : d - prev; prev = d; return [t, e[2] + 1]; });
      if (seq.length >= 2) out.push(seq);
    }
    return out;
  },

  // FSRS-6：和 ts-fsrs 的公式一致（不用分钟级的短期学习）
  model(w) {
    const decay = -w[20], factor = Math.pow(0.9, 1 / decay) - 1;
    const clampD = (d) => Math.min(10, Math.max(1, d));
    const initD = (g) => clampD(w[4] - Math.exp(w[5] * (g - 1)) + 1);
    const initD4 = w[4] - Math.exp(w[5] * 3) + 1;
    return {
      R: (t, s) => Math.pow(1 + factor * t / s, decay),
      initS: (g) => Math.max(w[g - 1], 0.1),
      initD,
      nextD: (d, g) => { const dd = d + (-w[6] * (g - 3)) * (10 - d) / 9; return clampD(w[7] * initD4 + (1 - w[7]) * dd); },
      recallS: (d, s, r, g) => s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * (g === 2 ? w[15] : 1) * (g === 4 ? w[16] : 1)),
      forgetS: (d, s, r) => Math.min(s, w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14])),
    };
  },

  // 平均对数损失和按预测概率分组的 RMSE（越小越准）
  loss(w, seqs) {
    const m = this.model(w);
    let sum = 0, n = 0;
    const bins = new Map();
    for (const seq of seqs) {
      let s = m.initS(seq[0][1]), d = m.initD(seq[0][1]);
      for (let i = 1; i < seq.length; i++) {
        const [t, g] = seq[i];
        const r = Math.min(0.9999, Math.max(0.0001, m.R(Math.max(0, t), s)));
        if (t > 0) {
          const y = g > 1 ? 1 : 0;
          sum += -(y * Math.log(r) + (1 - y) * Math.log(1 - r));
          n++;
          const b = Math.round(r * 20), cur = bins.get(b) || [0, 0, 0];
          cur[0] += r; cur[1] += y; cur[2]++;
          bins.set(b, cur);
        }
        s = Math.min(36500, Math.max(0.001, g === 1 ? m.forgetS(d, s, r) : m.recallS(d, s, r, g)));
        d = m.nextD(d, g);
      }
    }
    let se = 0, cnt = 0;
    for (const [p, y, c] of bins.values()) { se += c * ((p - y) / c) ** 2; cnt += c; }
    return { logLoss: n ? sum / n : NaN, rmse: cnt ? Math.sqrt(se / cnt) : NaN, n };
  },

  // 训练用的快速版本：序列压成平铺的数组，只算对数损失
  pack(seqs) {
    const n = seqs.reduce((s, q) => s + q.length, 0), t = new Float64Array(n), g = new Uint8Array(n), first = new Uint8Array(n);
    let k = 0;
    for (const q of seqs) q.forEach(([tt, gg], i) => { t[k] = tt; g[k] = gg; first[k] = i === 0 ? 1 : 0; k++; });
    return { t, g, first, n };
  },
  fastLoss(w, P) {
    const decay = -w[20], factor = Math.pow(0.9, 1 / decay) - 1, initD4 = w[4] - Math.exp(w[5] * 3) + 1, e8 = Math.exp(w[8]);
    const { t, g, first, n } = P;
    let s = 1, d = 5, sum = 0, cnt = 0;
    for (let k = 0; k < n; k++) {
      const gg = g[k];
      if (first[k]) { s = Math.max(w[gg - 1], 0.1); d = Math.min(10, Math.max(1, w[4] - Math.exp(w[5] * (gg - 1)) + 1)); continue; }
      const tt = t[k] > 0 ? t[k] : 0;
      let r = Math.pow(1 + factor * tt / s, decay);
      r = r < 0.0001 ? 0.0001 : r > 0.9999 ? 0.9999 : r;
      if (tt > 0) { sum -= gg > 1 ? Math.log(r) : Math.log(1 - r); cnt++; }
      if (gg === 1) s = Math.min(s, w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]));
      else s = s * (1 + e8 * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * (gg === 2 ? w[15] : 1) * (gg === 4 ? w[16] : 1));
      s = s < 0.001 ? 0.001 : s > 36500 ? 36500 : s;
      const dd = d + (-w[6] * (gg - 3)) * (10 - d) / 9;
      d = w[7] * initD4 + (1 - w[7]) * dd;
      d = d < 1 ? 1 : d > 10 ? 10 : d;
    }
    return cnt ? sum / cnt : NaN;
  },

  clip(w) { return w.map((x, i) => Math.min(this.CLAMP[i][1], Math.max(this.CLAMP[i][0], x))); },

  // 训练：前 80% 的卡片训练，后 20% 验证。onProgress(0–1) 用来显示进度
  async optimize(revlog, { epochs = 80, onProgress } = {}) {
    const seqs = this.sequences(revlog);
    const reviews = seqs.reduce((s, q) => s + q.filter(([t], i) => i > 0 && t > 0).length, 0);
    if (reviews < this.MIN_REVIEWS) return { ok: false, reason: "few", reviews, need: this.MIN_REVIEWS };
    // 固定顺序打乱（同样的数据得到同样的结果）
    const rnd = (typeof seededRandom === "function" ? seededRandom : () => Math.random)("fsrs-split");
    const shuffled = seqs.map((s) => [rnd(), s]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const cut = Math.floor(shuffled.length * 0.8), test = shuffled.slice(cut);
    // 训练集太大时只取一部分卡片（大约 12000 次复习就够了），几十秒内算完
    let train = shuffled.slice(0, cut), acc = 0;
    if (train.reduce((s, q) => s + q.length, 0) > 12000) train = train.filter((q) => (acc += q.length) <= 12000);
    const P = this.pack(train);
    let w = this.clip(this.defaults());
    const before = this.loss(w, test), beforeTrain = { logLoss: this.fastLoss(w, P) };
    const lr = 0.02, b1 = 0.9, b2 = 0.999, eps = 1e-8, h = 1e-4;
    const mo = new Array(21).fill(0), ve = new Array(21).fill(0);
    let best = { w: [...w], l: beforeTrain.logLoss };
    for (let ep = 1; ep <= epochs; ep++) {
      const base = this.fastLoss(w, P);
      const grad = w.map((x, i) => {
        const range = this.CLAMP[i][1] - this.CLAMP[i][0], step = Math.max(h, Math.abs(x) * h * 10);
        if (range <= 0) return 0;
        const w2 = [...w];
        w2[i] = x + step;
        return (this.fastLoss(this.clip(w2), P) - base) / step;
      });
      // Adam：每个参数按自己的取值范围缩放步长
      w = this.clip(w.map((x, i) => {
        mo[i] = b1 * mo[i] + (1 - b1) * grad[i];
        ve[i] = b2 * ve[i] + (1 - b2) * grad[i] * grad[i];
        const mh = mo[i] / (1 - b1 ** ep), vh = ve[i] / (1 - b2 ** ep);
        const scale = Math.min(1, (this.CLAMP[i][1] - this.CLAMP[i][0]) / 4);
        return x - lr * scale * mh / (Math.sqrt(vh) + eps);
      }));
      const l = this.fastLoss(w, P);
      if (l < best.l) best = { w: [...w], l };
      if (onProgress && ep % 5 === 0) { onProgress(ep / epochs); await new Promise((r) => setTimeout(r, 0)); }
    }
    const after = this.loss(best.w, test);
    return { ok: true, w: best.w.map((x) => Math.round(x * 10000) / 10000), before, after, reviews, cards: seqs.length, better: after.logLoss < before.logLoss };
  },
};
