// 学习内容的校验：改了 web/data/ 下的文件以后跑一下，CI 里也会跑
//     node tools/validate_data.mjs
// 检查 README「添加学习内容」里那些要人工遵守的规则：每个词条的格式、连词成句和成分标注一一对应、
// 短语单元引用的连词成句课存在、语法和阅读题的答案在选项范围内、片单和书目对应的文件存在、id 不重复……
import fs from "node:fs";
import path from "node:path";

import { WEB, loadApp } from "../tests/js/harness.mjs";

const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);

// index.html 里引用的 data/ 脚本都要存在，并按页面上的顺序加载
const html = fs.readFileSync(path.join(WEB, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
for (const s of scripts) if (!fs.existsSync(path.join(WEB, s))) err(`index.html 引用的 ${s} 不存在`);
const app = loadApp(scripts.filter((s) => s.startsWith("data/") && fs.existsSync(path.join(WEB, s))));
const G = (n) => app.run(`typeof ${n} === "undefined" ? undefined : ${n}`);

// ---------- 词书 ----------
const books = G("WORD_BOOKS") || [];
const ids = new Set();
for (const b of books) {
  if (ids.has(b.id)) err(`词书 id 重复：${b.id}`);
  ids.add(b.id);
  if (!b.title || !b.units?.length) err(`词书 ${b.id} 没有标题或单元`);
  b.units?.forEach((u, ui) => {
    if (!u.words?.length) warn(`词书 ${b.id} 第 ${ui + 1} 单元是空的`);
    u.words?.forEach((w, wi) => {
      const where = `词书 ${b.id} 单元 ${ui + 1} 第 ${wi + 1} 个`;
      if (!Array.isArray(w) || w.length !== 7) return err(`${where}：应该是 7 项的数组 [词, 音标, 释义, 例句, 短语, 记忆, 真题]`);
      if (!w[0] || typeof w[0] !== "string") err(`${where}：没有单词`);
      if (!w[2]) warn(`${where}（${w[0]}）：没有释义`);
      if (!Array.isArray(w[3]) || w[3].some((e) => !Array.isArray(e) || e.length < 1)) err(`${where}（${w[0]}）：例句格式应为 [[英文, 中文], …]`);
      if (!Array.isArray(w[4])) err(`${where}（${w[0]}）：短语应为数组`);
    });
  });
}

// ---------- 连词成句 + 句子成分标注 ----------
const lessons = G("BUILDER_LESSONS") || [];
const lessonIds = new Set();
let sentenceCount = 0;
for (const l of lessons) {
  if (lessonIds.has(l.id)) err(`连词成句课 id 重复：${l.id}`);
  lessonIds.add(l.id);
  l.sentences.forEach((steps, si) => {
    sentenceCount++;
    steps.forEach((st, k) => {
      if (st.length < 2 || !st[0] || !st[1]) err(`连词成句 ${l.id} 第 ${si + 1} 句第 ${k + 1} 步：应为「英文|中文」`);
    });
    for (let k = 1; k < steps.length; k++) if (steps[k][0].length < steps[k - 1][0].length) warn(`连词成句 ${l.id} 第 ${si + 1} 句：第 ${k + 1} 步比上一步短`);
  });
}
const notesRaw = G("BUILDER_NOTES_RAW");
if (notesRaw !== undefined) {
  const noteLines = notesRaw.split("\n").filter((x) => x.trim() && !x.trim().startsWith("//"));
  if (noteLines.length !== sentenceCount) err(`builder_notes.js 有 ${noteLines.length} 行，连词成句有 ${sentenceCount} 句：新增句子后要在 builder_notes.js 补一行`);
}

// ---------- 短语课程 ----------
const units = G("PHRASE_UNITS") || [];
const unitIds = new Set();
for (const u of units) {
  if (unitIds.has(u.id)) err(`短语单元 id 重复：${u.id}（进度按单元 id 记录）`);
  unitIds.add(u.id);
  if (u.builder && !lessonIds.has(u.builder)) err(`短语单元 ${u.id} 引用的连词成句课 ${u.builder} 不存在`);
  u.lessons.forEach((ls) => ls.phrases.forEach((p, i) => {
    if (p.length < 2 || !p[0] || !p[1]) err(`短语单元 ${u.id}「${ls.title}」第 ${i + 1} 行：应为「英文|中文」或「英文|中文|用法提示」`);
  }));
}

// ---------- 语法 ----------
const gl = G("GRAMMAR_LESSONS") || [], gc = G("GRAMMAR_CHAPTERS") || [];
const glIds = new Set(gl.map((l) => l.id));
if (glIds.size !== gl.length) err("语法课 id 有重复");
for (const c of gc) for (const id of c.ids) if (!glIds.has(id)) err(`语法章节「${c.title}」引用的课 ${id} 不存在`);
for (const l of gl) {
  if (!gc.some((c) => c.ids.includes(l.id))) warn(`语法课 ${l.id} 没有放进任何章节（GRAMMAR_CHAPTERS）`);
  (l.quiz || []).forEach((q, i) => { if (!(q.a >= 0 && q.a < q.o.length)) err(`语法课 ${l.id} 第 ${i + 1} 题的答案序号超出选项范围`); });
}

// ---------- 阅读 ----------
const passages = [...(G("READING_PASSAGES") || []), ...(G("READING_EXTRA") || [])];
const pIds = new Set();
for (const p of passages) {
  if (pIds.has(p.id)) err(`阅读文章 id 重复：${p.id}`);
  pIds.add(p.id);
  if (!p.paragraphs?.length) err(`阅读文章 ${p.id} 没有正文`);
  (p.questions || []).forEach((q, i) => { if (!(q.a >= 0 && q.a < q.o.length)) err(`阅读文章 ${p.id} 第 ${i + 1} 题的答案序号超出选项范围`); });
}

// ---------- 原著书架、影视片库：对应的文件要存在 ----------
for (const b of G("BOOK_SHELF") || []) {
  const f = path.join(WEB, "data", "books", `${b.id}.js`);
  if (!fs.existsSync(f)) { err(`书架上的 ${b.id} 没有正文文件 data/books/${b.id}.js`); continue; }
  const text = loadApp([`data/books/${b.id}.js`]).run(`BOOK_TEXT[${JSON.stringify(b.id)}]`);
  if (text?.length !== b.chapters.length) err(`《${b.title}》：书目里 ${b.chapters.length} 章，正文文件里 ${text?.length} 章`);
}
const filmIds = new Set();
for (const sr of G("FILM_SERIES") || []) for (const it of sr.items) {
  if (filmIds.has(it.id)) err(`影视片库 id 重复：${it.id}`);
  filmIds.add(it.id);
  if (!fs.existsSync(path.join(WEB, "data", "films", `${it.id}.js`))) err(`影视片库 ${it.id} 没有字幕文件 data/films/${it.id}.js`);
  if (it.url && !it.url.startsWith("https://")) err(`影视片库 ${it.id} 的视频地址不是 https`);
}

// ---------- 计算机词典（第一次查词时才加载，不在 index.html 里） ----------
const tech = loadApp(["data/techdict.js"]).run("TECH_DICT");
if (!tech?.items?.length) err("data/techdict.js 里没有词条");
tech?.items?.forEach((r, i) => {
  if (!Array.isArray(r) || r.length !== 7 || !r[0] || !r[2] || !Array.isArray(r[4]) || !tech.cats[r[5]]) err(`计算机词典第 ${i + 1} 条格式不对：${JSON.stringify(r).slice(0, 80)}`);
});

// ---------- 学习者英英释义（第一次用时才加载） ----------
const sd = loadApp(["data/simpledef.js"]).run("SIMPLE_DEF");
const sdWords = Object.entries(sd?.words || {});
if (!sdWords.length) err("data/simpledef.js 里没有词条");
for (const [w, senses] of sdWords) {
  if (!Array.isArray(senses) || !senses.length || senses.some((s) => !Array.isArray(s) || s.length !== 4 || !s[1] || !Array.isArray(s[3])))
    err(`英文释义「${w}」格式不对：${JSON.stringify(senses).slice(0, 80)}`);
}

// ---------- 结果 ----------
for (const w of warns.slice(0, 50)) console.log("⚠ " + w);
if (warns.length > 50) console.log(`⚠ ……还有 ${warns.length - 50} 条提醒`);
for (const e of errors) console.log("✗ " + e);
console.log(`\n词书 ${books.length} 本 · 连词成句 ${lessons.length} 课 ${sentenceCount} 句 · 短语单元 ${units.length} 个 · 语法 ${gl.length} 课 · 阅读 ${passages.length} 篇 · 原著 ${(G("BOOK_SHELF") || []).length} 本 · 影视 ${filmIds.size} 个 · 计算机词典 ${tech?.items?.length || 0} 条 · 英文释义 ${sdWords.length} 词`);
console.log(errors.length ? `✗ ${errors.length} 个错误，${warns.length} 条提醒` : `✓ 没有错误（${warns.length} 条提醒）`);
process.exit(errors.length ? 1 : 0);
