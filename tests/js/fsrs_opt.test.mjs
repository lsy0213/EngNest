// FSRS 参数优化：拿模拟出来的复习记录（一个记性和默认参数不一样的人）检验，优化后预测应该更准
import assert from "node:assert/strict";
import { test } from "node:test";

import { loadApp } from "./harness.mjs";

function boot() {
  const app = loadApp(["data/words.js", "js/vendor/ts-fsrs.umd.js", "js/core.js", "js/fsrs_opt.js", "js/motivation.js"]);
  app.run("Store.data = fillDefaults({}, DEFAULT_PROGRESS()); Store.save = () => {};");
  return app;
}

// 模拟：真实的记性用 trueW（比默认忘得快），按 FSRS 排的日子复习，记没记住按真实概率抽
function simulate(app, cards = 500) {
  return app.run(`(() => {
    const trueW = FsrsOpt.defaults(); trueW[0] = 0.1; trueW[2] = 1.2; trueW[8] = 1.2; trueW[10] = 1.3; trueW[20] = 0.3;
    const real = FsrsOpt.model(trueW), sched = FsrsOpt.model(FsrsOpt.defaults());
    const rnd = seededRandom("sim"), log = [], t0 = Date.UTC(2026, 0, 1);
    for (let c = 0; c < ${cards}; c++) {
      let day = Math.floor(rnd() * 60), g = 3, s = real.initS(g), d = real.initD(g), ss = sched.initS(g), sd = sched.initD(g);
      log.push(["w" + c, t0 + day * 864e5 + 36e5 * 10, g - 1, 0]);
      for (let k = 0; k < 7; k++) {
        const ivl = Math.max(1, Math.round(ss * 1));
        day += ivl;
        const r = real.R(ivl, s), ok = rnd() < r;
        g = ok ? 3 : 1;
        log.push(["w" + c, t0 + day * 864e5 + 36e5 * 10, g - 1, ivl]);
        s = ok ? real.recallS(d, s, r, g) : real.forgetS(d, s, r); d = real.nextD(d, g);
        const sr = sched.R(ivl, ss); ss = ok ? sched.recallS(sd, ss, sr, g) : sched.forgetS(sd, ss, sr); sd = sched.nextD(sd, g);
      }
    }
    return log;
  })()`);
}

test("复习记录太少时不优化", async () => {
  const app = boot();
  const r = await app.run(`FsrsOpt.optimize([["a", 1, 2, 0], ["a", 864e5 * 3, 2, 3]])`);
  assert.equal(r.ok, false);
  assert.equal(r.reason, "few");
});

test("按卡片和日期整理复习序列：相隔天数按本地日期算", () => {
  const app = boot();
  const seqs = app.run(`FsrsOpt.sequences([["a", new Date(2026,0,1,23).getTime(), 2, 0], ["a", new Date(2026,0,2,8).getTime(), 0, 1], ["b", 5, 2, 0]])`);
  assert.deepEqual(JSON.parse(JSON.stringify(seqs)), [[[0, 3], [1, 1]]]); // b 只复习过一次，不算
});

test("模拟的学习者：优化后在验证集上预测更准，参数在取值范围内", async () => {
  const app = boot();
  app.run(`globalThis.simLog = ${JSON.stringify(simulate(app))}`);
  const r = await app.run(`FsrsOpt.optimize(simLog, { epochs: 40 })`);
  assert.equal(r.ok, true);
  assert.ok(r.after.logLoss < r.before.logLoss, `logLoss ${r.before.logLoss} → ${r.after.logLoss}`);
  assert.equal(r.better, true);
  r.w.forEach((x, i) => { const [lo, hi] = app.run(`FsrsOpt.CLAMP[${i}]`); assert.ok(x >= lo && x <= hi, `w${i}=${x}`); });
});

test("复习量均衡：在前后几天里挑排得最少的那天；关掉就按原来的间隔", () => {
  const app = boot();
  app.run(`Fsrs._load = { [addDays(today(), 20)]: 50, [addDays(today(), 21)]: 2, [addDays(today(), 19)]: 40 }`);
  assert.equal(app.run("Fsrs.balance(20)"), 21);
  assert.equal(app.run("Fsrs.balance(2)"), 2); // 短间隔不动
  app.run("Store.prefs.load_balance = false");
  assert.equal(app.run("Fsrs.balance(20)"), 20);
});
