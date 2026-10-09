// 大词书按需加载：启动时只有目录（占位词条），加载后原地填满，查词表随之更新
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { WEB, loadApp } from "./harness.mjs";

function boot() {
  const app = loadApp(["data/words.js", "data/vocab_index.js", "js/vendor/ts-fsrs.umd.js", "js/core.js"]);
  app.run("Store.data = fillDefaults({}, DEFAULT_PROGRESS()); Store.save = () => {};");
  return app;
}
// 模拟 <script> 加载完：在同一个上下文里执行词书文件，再交给 Books.fill
const loadFile = (app, id) => {
  app.run(fs.readFileSync(path.join(WEB, app.run(`BOOK_MAP.${id}.file`)), "utf8"));
  app.run(`Books.fill(BOOK_MAP.${id})`);
};

test("启动时大词书只有目录：数量、单元都在，但不进查词表", () => {
  const app = boot();
  assert.equal(app.run("BOOK_MAP.med.stub"), true);
  assert.ok(app.run("BOOK_MAP.med.count") > 1000);
  assert.equal(app.run("BOOK_MAP.med.units[0].items[0].m"), "");
  const w = app.run("BOOK_MAP.med.units[0].items.find((x) => !WORD_MAP[x.w.toLowerCase()]).w");
  assert.equal(app.run(`lookupWord(${JSON.stringify(w)})`), null);
});

test("加载后原地填满占位词条，查词表能查到，词书列表不多出一项", () => {
  const app = boot();
  const n = app.run("BOOKS.length");
  app.run("globalThis.held = BOOK_MAP.med.units[0].items[1]");
  const w = app.run("held.w");
  loadFile(app, "med");
  assert.equal(app.run("BOOKS.length"), n);
  assert.equal(app.run("BOOK_MAP.med.stub"), undefined);
  assert.equal(app.run("held.stub"), undefined);
  assert.ok(app.run("held.m").length > 0);               // 别处拿着的引用也有内容了
  assert.ok(app.run("BOOK_MAP.med.units[0].words").length > 0);
  assert.ok(app.run(`lookupWord(${JSON.stringify(w)})`));
});

test("复习要用的词书：已学的词只在没加载的词书里时才加上，选信息最全的一本", () => {
  const app = boot();
  // 只在医学词书里的词
  const medOnly = app.run(`BOOK_MAP.med.units.flatMap((u) => u.items).map((x) => x.w)
    .find((w) => !WORD_MAP[w.toLowerCase()] && !BOOKS.some((b) => b.id !== "med" && b.units.some((u) => u.items.some((x) => x.w.toLowerCase() === w.toLowerCase()))))`);
  const cet4Word = app.run("BOOK_MAP.cet4.units[0].items[0].w");
  app.run(`Store.data.words[${JSON.stringify(medOnly)}] = { due: 0 }; Store.data.words[${JSON.stringify(cet4Word)}] = { due: 0 };`);
  const need = app.run("Books.forLearned([])");
  assert.ok(need.includes("med"));
  assert.ok(need.includes("cet4"));
  // 当前词书已经包含的词不再额外加词书
  const need2 = app.run(`Books.forLearned(["cet4"])`);
  assert.deepEqual([...need2].sort(), ["cet4", "med"]);
});
