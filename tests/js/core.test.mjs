// 前端纯函数的测试：node --test tests/js/
import assert from "node:assert/strict";
import { test } from "node:test";

import { loadCore } from "./harness.mjs";

const app = loadCore();
const g = (n) => app.get(n);
// vm 里创建的数组原型和这边的不一样，比较前先转成普通对象
const plain = (x) => JSON.parse(JSON.stringify(x));

test("听写对照：写错、漏写、多写", () => {
  const { ops, score } = g("wordDiff")("I would like a cup of coffee", "I like a cup of tea please");
  const kinds = ops.map((o) => o.t);
  assert.ok(kinds.includes("miss"));   // would
  assert.ok(kinds.includes("wrong"));  // coffee → tea
  assert.ok(kinds.includes("extra"));  // please
  assert.equal(Math.round(score * 7), 5);
});

test("分句：缩写和小数不切开", () => {
  const s = g("splitSentences")("Mr. Smith paid $3.50 for it. He was happy! Was it in the U.S. or not? Yes.");
  assert.deepEqual(plain(s), ["Mr. Smith paid $3.50 for it.", "He was happy!", "Was it in the U.S. or not?", "Yes."]);
});

test("mdLite 先转义再排版（AI 回复里的 HTML 不会执行）", () => {
  const html = g("mdLite")("**加粗** <img src=x onerror=alert(1)>\n- 一项");
  assert.ok(html.includes("<b>加粗</b>"));
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("<li>一项</li>"));
});

test("词形还原", () => {
  const lookupWord = g("lookupWord");
  const w = app.run("WORDS[0].w");
  assert.equal(lookupWord(w).w, w);
  assert.equal(lookupWord("zzzzqqq"), null);
});

test("FSRS：认识往后排、不认识今天再来，撤销恢复原样", () => {
  const w = app.run("WORDS[3].w");
  const today = g("today")();
  g("gradeWord")(w, 2);
  const rec = app.run(`Store.data.words[${JSON.stringify(w)}]`);
  assert.ok(rec.due > today && rec.f && rec.f.s > 0);
  const snapshot = JSON.stringify(rec);
  g("gradeWord")(w, 0);
  assert.equal(app.run(`Store.data.words[${JSON.stringify(w)}].due`), today);
  app.run("Undo.pop()");
  assert.equal(JSON.stringify(app.run(`Store.data.words[${JSON.stringify(w)}]`)), snapshot);
  assert.equal(app.run("Store.data.revlog.length"), 1);
});

test("FSRS：旧版 Leitner 记录按间隔换算", () => {
  const w = app.run("WORDS[5].w");
  app.run(`Store.data.words[${JSON.stringify(w)}] = { box: 4, due: today(), seen: 5, wrong: 1, first: "2026-01-01" }`);
  g("gradeWord")(w, 2);
  const rec = app.run(`Store.data.words[${JSON.stringify(w)}]`);
  assert.ok(rec.f.sd >= 7, `间隔 ${rec.f.sd} 天`); // 原来 7 天的间隔，记住了应该更长
  assert.ok(rec.box >= 4);
});

test("Anki / CSV 导入解析", () => {
  const items = g("WordIO").parse('#separator:tab\napple\t苹果\n"bank, river","河岸"\n苹果树\tapple tree\n<b>vivid</b>\t生动的<br>鲜明的\n');
  assert.deepEqual(plain(items.map((x) => x.front)), ["apple", "bank, river", "apple tree", "vivid"]);
  assert.equal(items[3].back, "生动的 鲜明的");
});

test("生词率", () => {
  const st = g("textWordStats")(["the the the the the the the the the the"]);
  assert.equal(st.rate, 0);
  assert.equal(st.verdict, "轻松");
});

test("学习者水平随测试结果变化", () => {
  assert.match(g("LEARNER_PROFILE"), /A2-B1/);
  app.run('Store.data.level = { cefr: "B2", idx: 3, vocab: 6000, date: "2026-10-07" }');
  assert.match(g("LEARNER_PROFILE"), /CEFR B2/);
  app.run("delete Store.data.level");
});

test("记录 id 和后端 LIST_ID 一致（多设备合并靠它对齐）", () => {
  const id = g("RECORD_ID");
  assert.equal(id.notebook({ w: " Apple " }), "apple");
  assert.equal(id.sentence_nb({ en: "Nice  to\tmeet you" }), "nice to meet you");
  assert.equal(id.clips({ video: "v1", en: "Hi  there" }), "v1|hi there");
});
