// 学习者英英释义（SimpleDef）：按学习者认识多少词决定先给英文还是先给中文
import assert from "node:assert/strict";
import { test } from "node:test";

import { loadApp } from "./harness.mjs";

const app = loadApp(["data/words.js", "js/vendor/ts-fsrs.umd.js", "js/core.js", "js/components.js", "data/simpledef.js"]);
app.run("Store.data = fillDefaults({}, DEFAULT_PROGRESS()); Store.save = () => {}; SimpleDef.words = SIMPLE_DEF.words;");
const SD = app.get("SimpleDef");
const reset = () => app.run("Store.data.words = {}; delete Store.data.level; Store.prefs.en_def = 'auto';");

test("释义里全是常用词：先显示英文", () => {
  reset();
  const v = SD.view("abandon");
  assert.equal(v.mode, "en");
  assert.match(v.senses[0][1], /^If you abandon something/);
});

test("不认识的词超过 1 个先显示中文；学过以后变成先英文，剩下的那个标出来", () => {
  reset();
  // appointment 的释义里有 formal、agreement、doctor 三个不在最常用 1200 词里的词
  assert.equal(SD.view("appointment").mode, "zh");
  app.run("Store.data.words.formal = { due: today() }; Store.data.words.agreement = { due: today() };");
  const v = SD.view("appointment");
  assert.equal(v.mode, "en");
  assert.deepEqual([...v.unknown], ["doctor"]);
  const html = SD.defHtml(v.senses[0][1], v.unknown);
  assert.match(html, /class="w sd-new"[^>]*>doctor</);
  assert.doesNotMatch(html, /sd-new"[^>]*>formal</);
});

test("做过水平测试：按估计词汇量判断", () => {
  reset();
  app.run("Store.data.level = { vocab: 4000 };");
  assert.equal(SD.view("appointment").mode, "en");
});

test("设置：总是先中文 / 总是先英文 / 不显示", () => {
  reset();
  app.run("Store.prefs.en_def = 'zh'");
  assert.equal(SD.view("abandon").mode, "zh");
  app.run("Store.prefs.en_def = 'en'");
  assert.equal(SD.view("appointment").mode, "en");
  app.run("Store.prefs.en_def = 'off'");
  assert.equal(SD.view("abandon"), null);
  assert.equal(SD.view("zzzznotaword"), null);
});
