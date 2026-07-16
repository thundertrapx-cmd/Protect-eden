# Project Eden — โครงสร้างแยกตาม Feature (26 ไฟล์)

## วิธีใช้งาน

1. **แก้โค้ด** — แก้ไฟล์ใน `src/js/*.js` (feature ไหนก็ไฟล์นั้น ดูตารางล่าง) หรือ `src/css/style.css` / `src/body.html`
2. **Build กลับเป็นไฟล์เดียว**: `node build/build.js` → ได้ `eden_game.html` เปิดได้ทั้ง double-click และผ่าน server
3. **ไฟล์ที่แจกจ่ายจริง = `eden_game.html`** (src/ มีไว้แก้เท่านั้น)

## ตารางไฟล์ (แก้อะไร → เปิดไฟล์ไหน)

| ไฟล์ | Feature |
|---|---|
| `01-init.js` | canvas, fullscreen, เสียง SFX, title screen, toolbar |
| `02-shop-market.js` | ร้านค้า (ซื้อ/ขาย), **ตลาดผันผวนรายวัน + ของฮอต** |
| `03-story-dialogue.js` | intro story, กล่องบทสนทนา NPC, ระบบของขวัญ |
| `04-quests.js` | Main Quest (tutorial), Side Quests |
| `05-chapters.js` | **CHAPTERS** — เนื้อเรื่อง 4 บท, ปลดล็อกโซน, เป้าหมายบท |
| `06-npcs.js` | **NPC ทั้ง 6 คน** — defineNPC, schedule, เควสส่วนตัว, บทพูดตามฤดู/เทศกาล |
| `07-world-state.js` | input, กระเป๋า (inv), วัน/คืน, ฤดู, เทศกาล, สภาพอากาศ, **CROP_DB พืช 4 ชนิด**, แปลง+แปลงเสริม |
| `08-genetics.js` | Traits, IV, ธาตุ+ตารางแพ้ทาง, Berry, นิสัยสัตว์เลี้ยง |
| `09-species-dex.js` | สายพันธุ์ทั้ง 11, **SECRET_RECIPES สูตรผสมลับ 5 สูตร**, **Eden Dex**, เลือกสัตว์เริ่มต้น |
| `10-creatures-evolution.js` | makeCreature, เลเวล/EXP, วิวัฒนาการ 2 ขั้น |
| `11-combat-skills.js` | **SKILL_DB + SKILL_PATHS (เลือกสาย Lv.8)**, ระบบเรียนสกิล, Role |
| `12-battle-engine.js` | Tactical Grid Battle: เทิร์น, เมนู, applySkillHit, AI ศัตรู |
| `13-battle-render.js` | วาดฉากต่อสู้ (กริด, telegraph ช่องแดง, HP bar) |
| `14-bosses.js` | **BOSS_DB — boss 4 ตัวประจำบท** (pattern/phase2/summon/blast) |
| `15-maps.js` | switchMap + การกั้นโซนตาม chapter + spawn ศัตรู/boss |
| `16-cooking-skill.js` | ทำอาหาร, สกิลนอกสนาม (ปุ่ม E) |
| `17-breeding.js` | ผสมพันธุ์ที่รัง (เรียกใช้ SECRET_RECIPES) |
| `18-gathering.js` | ตกปลา / ตัดไม้ / ขุดแร่ |
| `19-crafting-gear.js` | เมนูประดิษฐ์, **GEAR_DB อุปกรณ์สวมใส่**, ขยายแปลง |
| `20-pet-storage.js` | กล่องเก็บสัตว์เลี้ยง |
| `21-save-load.js` | **save/load + SAVE_VERSION + migrateSave** (ปัจจุบัน v7) |
| `22-game-loop.js` | update() หลัก: เดิน, ปลูก/เก็บ, ให้อาหาร, ฟักไข่, ปุ่มลัดทั้งหมด |
| `23-hud-ui.js` | updateUI() — ตัวเลข/แถบทุกอย่างบนจอ |
| `24-render-sprites.js` | sprite สัตว์ทุกตัว (หมาป่า/T-Rex/**แพนด้าแดง**), ผู้เล่น, ศัตรู |
| `25-render-world.js` | ฉากทุกโซน, NPC, ต้นไม้/บ่อ/รัง, particle, draw() หลัก |
| `26-bootstrap.js` | จุดเริ่มเกม — **ต้องอยู่ท้ายสุดเสมอ** |

## ⚠️ กติกาสำคัญ

1. **ห้ามสลับลำดับใน `JS_ORDER` ของ `build/build.js`** — ทุกไฟล์รันใน global scope เดียวกัน
   ตัวแปรอ้างข้ามไฟล์ตามลำดับ ถ้าสลับจะเจอ "X is not defined"
2. **เพิ่มไฟล์ใหม่** = สร้างไฟล์ + แทรกชื่อใน `JS_ORDER` ตรงตำแหน่งที่เหมาะกับ dependency
3. **แตะ save format เมื่อไหร่** = bump `SAVE_VERSION` + เขียน migration step ใน `migrateSave()` (`21-save-load.js`) เสมอ
4. ระบบใหม่ให้ทำแบบ data-driven ตาม convention เดิม: เพิ่ม entry ใน table (CROP_DB, BOSS_DB, SKILL_DB,
   SECRET_RECIPES, GEAR_DB, defineNPC, CHAPTERS) โดยไม่แตะ logic

## ทดสอบว่า build ถูกต้อง

แก้เสร็จรัน `node build/build.js` แล้วเปิด `eden_game.html` — ถ้ายังไม่ได้แก้อะไร output ต้องเหมือนเดิมทุกตัวอักษร
(refactor รอบนี้ตรวจด้วย md5 แล้ว: ตรงกับไฟล์ก่อน refactor 100%)
