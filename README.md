# Project Eden — โครงสร้างไฟล์แยก (Factor Split)

## วิธีใช้งาน

1. **แก้โค้ด** — ไปแก้ที่ไฟล์ใน `src/js/*.js` (ระบบไหนก็ไฟล์นั้น) หรือ `src/css/style.css`
2. **Build กลับเป็นไฟล์เดียว**:
   ```
   node build/build.js
   ```
   จะได้ `eden_game.html` ที่รวมทุกอย่างกลับมาเป็นไฟล์เดียว เปิดได้ทั้ง double-click และผ่าน server เหมือนเดิม
3. **ไฟล์ที่แจกจ่าย / อัปโหลดจริง = `eden_game.html`** (ไฟล์ใน src/ เอาไว้แก้เฉย ๆ ห้ามอัปโหลดตรง ๆ)

## โครงสร้าง src/js/ (แบ่งตามระบบ — 9 factor)

| ไฟล์ | ระบบที่อยู่ข้างใน |
|---|---|
| `01-main-init.js` | canvas init, fullscreen scaling, audio (SFX), title screen, toolbar toggle ต่าง ๆ |
| `02-economy-quests.js` | shop, story/intro, NPC dialogue + schedule, main quest, side quests |
| `03-world-state.js` | input, world state, day/night, seasons, festivals, weather |
| `04-pets-genetics.js` | breeding (IV/trait/mutation), elements, affinity berries, personality, species, evolution |
| `05-battle-system.js` | combat helpers, tactical grid battle, roles, skill system, battle action menu |
| `06-crafting-gathering.js` | map switching, cooking, breeding & eggs, fishing/ตัดไม้/mining, crafting, pet storage |
| `07-save-update.js` | save/load, game update loop, UI helpers |
| `08-render.js` | drawing ทั้งหมด, sprite (player/wolf/T-Rex), particle, camera |
| `09-bootstrap.js` | จุดเริ่มเกม (loadGame → gameLoop → autosave) — **ต้องอยู่ไฟล์สุดท้ายเสมอ** |

## ⚠️ กติกาสำคัญ

**ห้ามสลับลำดับไฟล์ในตัวแปร `JS_ORDER` ของ `build/build.js`**
เพราะทั้งหมดยังรันอยู่ใน global scope เดียวกัน (ไม่ใช่ ES module) ตัวแปร/ฟังก์ชันหลายตัวถูกอ้างอิงข้ามไฟล์ — ลำดับต้องตรงกับของเดิมเป๊ะ ถ้าสลับอาจเจอ error แบบ "X is not defined"

ถ้าจะเพิ่มระบบใหม่ที่ใหญ่พอจะแยกไฟล์ของตัวเอง ให้เพิ่มไฟล์ใหม่ + เพิ่มชื่อใน `JS_ORDER` ตรงตำแหน่งที่โค้ดเดิมเคยอยู่ (ดูจาก dependency ว่าไปใช้ตัวแปร/ฟังก์ชันจากไฟล์ไหนบ้าง)

## ทดสอบว่า build ถูกต้อง

รันแล้วลอง diff เทียบกับไฟล์ต้นฉบับก่อนหน้านี้ได้ (ถ้ายังไม่ได้แก้อะไรเลย ควรจะเหมือนกันทุกตัวอักษร)
