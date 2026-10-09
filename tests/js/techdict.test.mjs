// 计算机词典（TechDict）的查词规则：node --test tests/js/
import assert from "node:assert/strict";
import { test } from "node:test";

import { loadApp } from "./harness.mjs";

const app = loadApp(["data/words.js", "js/vendor/ts-fsrs.umd.js", "js/core.js", "js/components.js", "data/techdict.js"]);
app.run("TechDict.build(window.TECH_DICT)");
const T = app.get("TechDict");
const words = (list) => list.map((it) => it.w);

test("缩写：全称、中文都有；复数也能查到", () => {
  const [pdu] = T.senses("PDU");
  assert.equal(pdu.full, "Protocol Data Unit");
  assert.ok(pdu.zh.includes("协议数据单元"));
  assert.ok(words(T.senses("PDUs")).includes("PDU"));
});

test("全大写缩写不匹配同拼写的普通词", () => {
  assert.ok(words(T.senses("SIP")).includes("SIP"));
  assert.ok(!words(T.senses("sip")).includes("SIP"));
  assert.ok(!words(T.senses("Arm")).includes("ARM"));
  assert.ok(!words(T.senses("python")).includes("Python"));
});

test("小写术语：变形还原", () => {
  assert.ok(words(T.senses("encapsulated")).includes("encapsulation") || words(T.senses("encapsulate")).length);
  assert.ok(words(T.senses("packets")).includes("packet"));
  assert.ok(words(T.senses("dissectors")).includes("dissector"));
});

test("上下文里的多词术语", () => {
  const ctx = "In the field below the Display Filter field you can choose the level from which you want to export the PDUs.";
  assert.ok(words(T.phrasesIn("Filter", ctx)).includes("display filter"));
  assert.ok(words(T.phrasesIn("Display", ctx)).includes("display filter"));
  assert.equal(T.phrasesIn("Filter", "Coffee filter paper.").length, 0);
});

test("智能模式：日常常见词只在技术文章里显示计算机义", () => {
  const novel = "She kept the old photo in a frame on the table by the window.";
  const doc = "The TCP segment is wrapped in an IP packet, which is then carried in an Ethernet frame.";
  assert.equal(T.pick("frame", novel, "auto").senses.length, 0);
  assert.ok(T.pick("frame", doc, "auto").senses.length > 0);
  assert.ok(T.pick("frame", novel, "always").senses.length > 0);
  assert.equal(T.pick("TCP", doc, "off").senses.length, 0);
  // 不常见的术语在哪都显示
  assert.ok(T.pick("encapsulation", novel, "auto").senses.length > 0);
});

test("搜索：缩写、全称前缀、中文", () => {
  assert.equal(T.search("tcp")[0].w, "TCP");
  assert.ok(words(T.search("Transmission Control")).includes("TCP"));
  assert.ok(words(T.search("封装")).includes("encapsulation"));
  assert.ok(words(T.search("modbus")).includes("Modbus TCP"));
});
