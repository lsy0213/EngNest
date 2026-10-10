// 我的书架：哪些书在书架上、读到百分之几、在读 / 想读 / 读完、最近读过
import assert from "node:assert/strict";
import { test } from "node:test";

import { loadApp } from "./harness.mjs";

function boot() {
  const app = loadApp(["data/words.js", "js/vendor/ts-fsrs.umd.js", "js/core.js", "js/components.js", "data/books_index.js",
    "data/voa_index.js", "data/wiki_index.js", "js/pages/book.js", "js/pages/shelf.js"]);
  app.run("Store.data = fillDefaults({}, DEFAULT_PROGRESS()); Store.save = () => {}; toast = () => {};");
  // 一份导入的读物：4 章，词数不一样
  app.run(`Docs.lib = [{ id: "imp-1", title: "Fox", author: "", source: "fox.txt", added: "2026-10-01", words: 1000,
    chapters: [["Chapter 1", 100], ["Chapter 2", 200], ["Chapter 3", 300], ["Chapter 4", 400]] }]`);
  return app;
}

test("导入的读物一直在书架上；没读过的原著不在，打开读过以后自动放上去", () => {
  const app = boot();
  const oz = app.run(`Docs.metaSync("oz")`);
  assert.deepEqual([...app.run("Shelf.items().map((x) => x.meta.id)")], ["imp-1"]);
  assert.equal(app.run(`Shelf.on(Docs.metaSync("oz"))`), false);
  app.run(`Shelf.touch(Docs.metaSync("oz"), 1, 0)`);
  assert.equal(app.run(`Shelf.on(Docs.metaSync("oz"))`), true);
  assert.equal(app.run(`Shelf.status(Docs.metaSync("oz"))`), "reading");
  assert.ok(oz.chapters.length > 1);
});

test("拿下书架后再读也不会自动放回；以前版本读过的书（没有 shelf 字段）算在书架上", () => {
  const app = boot();
  app.run(`Shelf.touch(Docs.metaSync("oz"), 1, 0); Shelf.toggle(Docs.metaSync("oz"))`);
  assert.equal(app.run(`Shelf.on(Docs.metaSync("oz"))`), false);
  app.run(`Shelf.touch(Docs.metaSync("oz"), 2, 0)`);
  assert.equal(app.run(`Shelf.on(Docs.metaSync("oz"))`), false);
  app.run(`Store.data.books.alice = { last: 3, done: { 1: "2026-01-01" }, pos: {} }`);
  assert.equal(app.run(`Shelf.on(Docs.metaSync("alice"))`), true);
});

test("单篇的 VOA 只有手动放上去才在书架上", () => {
  const app = boot();
  const id = app.run("`voa-${VOA_INDEX[0].id}`");
  app.run(`Shelf.touch(Docs.metaSync("${id}"), 1, 0)`);
  assert.equal(app.run(`Shelf.on(Docs.metaSync("${id}"))`), false);
  assert.equal(app.run(`Shelf.toggle(Docs.metaSync("${id}"))`), true);
  assert.ok(app.run("Shelf.items().map((x) => x.meta.id)").includes(id));
});

test("进度按词数算：读完的章 + 当前这章读到的比例", () => {
  const app = boot();
  const pct = () => app.run(`Shelf.pct(Docs.metaSync("imp-1"))`);
  assert.equal(pct(), 0);
  app.run(`Object.assign(bookRec("imp-1"), { last: 3, done: { 1: "d", 2: "d" }, pf: 0.5 })`);
  assert.equal(pct(), (100 + 200 + 150) / 1000);
  app.run(`Object.assign(bookRec("imp-1"), { last: 4, done: { 1: "d", 2: "d", 3: "d", 4: "d" }, pf: 0.5 })`);
  assert.equal(pct(), 1);
  assert.equal(app.run(`Shelf.status(Docs.metaSync("imp-1"))`), "done");
});

test("最近读过按时间排，书目已经没有了的（删掉的、关掉的在线维基）跳过", () => {
  const app = boot();
  app.run(`bookRec("alice").t = 100; bookRec("oz").t = 300; bookRec("imp-gone").t = 500; bookRec("wikilive-X").t = 400`);
  assert.deepEqual([...app.run("Shelf.recent().map((x) => x.meta.id)")], ["oz", "alice"]);
});

test("书脊厚薄随词数变、有上下限；颜色可以换", () => {
  const app = boot();
  const w = (n) => app.run(`Shelf.width({ words: ${n} })`);
  assert.equal(w(300), 16);
  assert.ok(w(10000) > w(3000) && w(100000) > w(20000));
  assert.equal(w(5e6), 72);
  app.run(`bookRec("oz").color = 2`);
  assert.deepEqual([...app.run(`Shelf.color(Docs.metaSync("oz"))`)], [...app.run("SPINE_COLORS[2]")]);
});

test("拖动换位置：第一次挪按现在的顺序定下来、换成自己摆的顺序；新放上来的排最前面", () => {
  const app = boot();
  app.run(`["oz", "alice", "peterpan"].forEach((id, i) => { bookRec(id).shelf = 1000 - i; }); Store.prefs.shelf_sort = "added"; Store.prefs.shelf_tab = "all"`);
  const ids = () => [...app.run("Shelf.list().map((x) => x.meta.id)")];
  const before = ids();
  app.run(`Shelf.draw = () => {}; Shelf.move(${JSON.stringify(before[0])}, null)`);
  assert.equal(app.run("Store.prefs.shelf_sort"), "custom");
  assert.deepEqual(ids(), [...before.slice(1), before[0]]);
  app.run(`Shelf.move("alice", ${JSON.stringify(ids()[0])})`);
  assert.equal(ids()[0], "alice");
  app.run(`bookRec("heidi").shelf = 2000`);
  assert.equal(ids()[0], "heidi");
});

test("读的时候点过的词：按词典原形记、数次数", () => {
  const app = boot();
  const meta = `Docs.metaSync("imp-1")`;
  const w = app.run(`WORDS.find((x) => /^[a-z]{4,}[^s]$/.test(x.w)).w`); // 词书里有的词，复数形式查得到原形
  const cap = w[0].toUpperCase() + w.slice(1) + "s";
  app.run(`Shelf.noteWord(${meta}, 2, 5, "${cap}"); Shelf.noteWord(${meta}, 3, 1, "${w}"); Shelf.noteWord(${meta}, 1, 0, "x")`);
  const lk = app.run(`JSON.stringify(bookRec("imp-1").lk)`);
  assert.deepEqual(JSON.parse(lk), { [w]: [2, 5, 2] });
});

test("连续读够目标的天数：今天没读够从昨天算起", () => {
  const app = boot();
  app.run(`Store.prefs.read_goal = 10; [1, 2, 3].forEach((n) => { dayRec(addDays(today(), -n)).rs = 600; }); dayRec(addDays(today(), -4)).rs = 100`);
  assert.equal(app.run("Shelf.streak()"), 3);
  app.run("dayRec().rs = 650");
  assert.equal(app.run("Shelf.streak()"), 4);
});

test("读完推荐：查词多推荐简单一点的、查得少推荐难一点的，读完的不推荐", () => {
  const app = boot();
  const mid = app.run(`BOOK_SHELF.find((b) => b.level === "中等").id`);
  const rec = (lk) => {
    app.run(`Store.data.books = {}; Object.assign(bookRec(${JSON.stringify(mid)}), { last: 1, done: Object.fromEntries(Docs.metaSync(${JSON.stringify(mid)}).chapters.map((_, i) => [i + 1, "d"])), lk: ${lk} })`);
    return app.run(`Shelf.recommend(Docs.metaSync(${JSON.stringify(mid)}))`);
  };
  const many = `Object.fromEntries(Array.from({ length: 2000 }, (_, i) => ["w" + i, [1, 0, 1]]))`;
  assert.equal(rec(many).adj, -1);
  assert.equal(rec(`{ a: [1, 0, 1], b: [1, 0, 1], c: [1, 0, 1] }`).adj, 1);
  assert.equal(rec(`{ a: [1, 0, 1] }`).adj, 0); // 几乎没点过词：不调整
  const r = rec(many);
  assert.equal(r.list.length, 3);
  assert.ok(r.list.every((b) => b.id !== mid && app.run(`levelOf({ kind: "book", level: ${JSON.stringify(b.level)} })`) === r.want));
});
