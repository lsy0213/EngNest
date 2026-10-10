// 学习动力：连胜保护、薄弱点本、每日任务、成就、周报
import assert from "node:assert/strict";
import { test } from "node:test";

import { loadApp } from "./harness.mjs";

function boot() {
  const app = loadApp(["data/words.js", "js/vendor/ts-fsrs.umd.js", "js/core.js", "js/components.js", "js/sentsrs.js", "js/motivation.js", "js/pages/stats.js"]);
  app.run("Store.data = fillDefaults({}, DEFAULT_PROGRESS()); Store.save = () => {}; toast = () => {}; renderSidebarFoot = () => {}; renderNav = () => {}; Sound.play = () => {}; Achv.celebrate = () => {}; Achv.soon = () => {};");
  return app;
}
const day = (app, n) => app.run(`addDays(today(), ${n})`);

test("连胜保护：昨天没学、手里有卡，自动补上，连续天数不断", () => {
  const app = boot();
  for (const n of [-2, -3, -4]) app.run(`Store.data.days["${day(app, n)}"] = { xp: 10 }`);
  app.run("Store.data.created = addDays(today(), -10); Store.data.freeze = { n: 1, t: 0 }");
  assert.equal(app.run("streak()"), 0);
  assert.equal(app.run("Freeze.check()"), 1);
  assert.equal(app.run(`Store.data.days["${day(app, -1)}"].frozen`), 1);
  assert.equal(app.run("Store.data.freeze.n"), 0);
  assert.equal(app.run("streak()"), 4);
});

test("连胜保护：断了两天但只有一张卡，不用（用了也保不住）", () => {
  const app = boot();
  app.run(`Store.data.days["${day(app, -3)}"] = { xp: 10 }; Store.data.created = addDays(today(), -10); Store.data.freeze = { n: 1, t: 0 }`);
  assert.equal(app.run("Freeze.check()"), 0);
  assert.equal(app.run("Store.data.freeze.n"), 1);
});

test("连胜保护：连续学满 7 天送一张，同一天不重复送，最多存 2 张", () => {
  const app = boot();
  for (let n = -6; n <= 0; n++) app.run(`Store.data.days["${day(app, n)}"] = { xp: 10 }`);
  app.run("Freeze.award(); Freeze.award()");
  assert.equal(app.run("Store.data.freeze.n"), 1);
  app.run("Store.data.freeze = { n: 2, t: 0 }; Freeze.award()");
  assert.equal(app.run("Store.data.freeze.n"), 2);
});

test("薄弱点：再错一次次数加一、明天复习；记住得够久就算攻克", () => {
  const app = boot();
  app.run(`Weak.add("phrase", "take a rain check", { en: "take a rain check", zh: "改天吧", src: "测试" })`);
  const id = app.run(`Weak.id("phrase", "Take a  rain check")`);
  assert.equal(app.run(`Object.keys(Store.data.weak).length`), 1);
  assert.equal(app.run(`Store.data.weak["${id}"].due`), day(app, 1));
  app.run(`Store.data.weak["${id}"].due = addDays(today(), 30); Weak.add("phrase", "take a rain check", {})`);
  assert.equal(app.run(`Store.data.weak["${id}"].n`), 2);
  assert.equal(app.run(`Store.data.weak["${id}"].due`), day(app, 1));
  // 稳定度够高时评「记住了」→ 攻克
  app.run(`const r = Store.data.weak["${id}"]; r.seen = 3; r.f = { s: 40, d: 3, st: 2, r: 3, l: 0, lr: addDays(today(), -40), sd: 40 }; r.due = today(); globalThis.done = Weak.grade(r, 2)`);
  assert.equal(app.run("done"), true);
  assert.equal(app.run("Weak.active().length"), 0);
  assert.equal(app.run(`dayRec().c_weak`), 1);
});

test("薄弱点：AI 反馈里有改好的英文句子才收，👍 和中文不收", () => {
  const app = boot();
  app.run(`weakFromFeedback("I go to park yesterday.", "**I went to the park yesterday.** 过去的事用过去式。", "AI 语伴")`);
  app.run(`weakFromFeedback("Nice to meet you.", "👍 很自然！", "AI 语伴")`);
  app.run(`weakFromFeedback("我想去公园", "**I want to go to the park.**", "AI 语伴")`);
  const recs = app.run("JSON.stringify(Weak.list().map((r) => [r.k, r.en, r.said, r.note]))");
  assert.deepEqual(JSON.parse(recs), [["fix", "I went to the park yesterday.", "I go to park yesterday.", "过去的事用过去式。"]]);
});

test("每日任务：同一天抽到的任务固定，三个都完成后只发一次奖励", () => {
  const app = boot();
  const a = app.run("JSON.stringify(Quests.today().ids)");
  assert.equal(JSON.parse(a).length, 3);
  app.run("delete Store.data.quests");
  assert.equal(app.run("JSON.stringify(Quests.today().ids)"), a); // 按日期固定，换台设备抽到一样的
  app.run(`for (const it of Quests.items()) dayRec()[it.q.key] = it.n;`);
  const xp0 = app.run("Store.data.xp");
  app.run("Quests.check(); Quests.check()");
  assert.equal(app.run("Store.data.xp") - xp0, app.run("QUEST_BONUS"));
  assert.equal(app.run("Quests.today().bonus"), 1);
});

test("周报：按周一开始统计，学习天数、经验值和新学的词", () => {
  const app = boot();
  const ws = app.run(`weekStart("2026-10-10")`);
  assert.equal(ws, "2026-10-05"); // 2026-10-10 是周六
  app.run(`Store.data.days["2026-10-05"] = { xp: 30, review: 10 }; Store.data.days["2026-10-07"] = { xp: 20, review: 5, rs: 600 };
    Store.data.days["2026-10-12"] = { xp: 99 }; Store.data.words.apple = { first: "2026-10-06", box: 1, due: "2026-10-07", seen: 1, wrong: 0 }`);
  const s = JSON.parse(app.run(`JSON.stringify(Weekly.summary("2026-10-05"))`));
  assert.equal(s.studyDays, 2);
  assert.equal(s.xp, 50);
  assert.equal(s.review, 15);
  assert.equal(s.readMin, 10);
  assert.equal(s.learned, 1);
});

test("成就：最长连续天数把保护卡补的那天也算上；数值变小也不熄灭", () => {
  const app = boot();
  for (const d of ["2026-01-01", "2026-01-02", "2026-01-04"]) app.run(`Store.data.days["${d}"] = { xp: 5 }`);
  app.run(`Store.data.days["2026-01-03"] = { xp: 0, frozen: 1 }`);
  assert.equal(app.run("longestStreak()"), 4);
  app.run("Store.data.achv = {}; Store.data.xp = 600; Achv.check()");
  assert.equal(app.run("Achv.level(ACHIEVEMENTS.find((a) => a.id === 'xp'))"), 1);
  app.run("Store.data.xp = 10; Achv.check()");
  assert.equal(app.run("Achv.level(ACHIEVEMENTS.find((a) => a.id === 'xp'))"), 1);
});
