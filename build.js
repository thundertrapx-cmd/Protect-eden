#!/usr/bin/env node
/**
 * build.js — รวมไฟล์ source (src/js/*.js, src/css/style.css) กลับเป็นไฟล์เดียว
 * eden_game.html ที่ยังเปิดได้ตรง ๆ ทั้งแบบ double-click (file://) และผ่าน server
 *
 * วิธีใช้:
 *   node build/build.js
 *
 * ไม่ต้องลง dependency ใด ๆ ใช้แค่ Node.js core (fs, path)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "eden_game.html");

// ลำดับไฟล์ JS ต้องตรงกับลำดับเดิมในเกมเป๊ะ ๆ (ห้ามสลับ!)
// เพราะตัวแปร/ฟังก์ชันหลายตัวถูกอ้างอิงข้ามระบบผ่าน global scope เดียวกัน
const JS_ORDER = [
  "01-main-init.js",
  "02-economy-quests.js",
  "03-world-state.js",
  "04-pets-genetics.js",
  "05-battle-system.js",
  "06-crafting-gathering.js",
  "07-save-update.js",
  "08-render.js",
  "09-bootstrap.js",
];

function read(relPath) {
  return fs.readFileSync(path.join(SRC, relPath), "utf8");
}

function build() {
  const head = read("head.html");
  const css = read("css/style.css");
  const body = read("body.html");
  const js = JS_ORDER.map((f) => read(path.join("js", f))).join("");
  const tail = read("tail.html");

  const html =
    head +
    "<style>\n" +
    css +
    "</style>\n" +
    body +
    "  <script>\n" +
    js +
    tail;

  fs.writeFileSync(OUT, html, "utf8");
  console.log(`✔ Built ${OUT} (${html.split("\n").length} lines)`);
}

build();
