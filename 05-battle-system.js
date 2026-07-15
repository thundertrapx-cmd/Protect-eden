    // ---------- Combat helpers ----------
    function dropLoot(e){
      if (currentMap === "Dungeon"){
        items.push({x:e.x,y:e.y,type:"Meat",size:15,bob:0});
        if (e.boss) items.push({x:e.x+12,y:e.y,type:"Egg",size:16,bob:0,elementHint:"Leaf",speciesHint:"Duck"});
      } else if (currentMap === "Cave"){
        items.push({x:e.x,y:e.y,type: e.boss ? "Crystal" : "Chili", size:15, bob:0});
        if (e.boss) items.push({x:e.x+12,y:e.y,type:"Egg",size:16,bob:0,elementHint:"Fire",speciesHint:"Lion"});
      } else if (currentMap === "Volcano"){
        items.push({x:e.x,y:e.y,type:"Obsidian",size:15,bob:0});
        if (e.boss) items.push({x:e.x+12,y:e.y,type:"Egg",size:16,bob:0,elementHint:"Fire",speciesHint:"Wolf"});
      } else if (currentMap === "Ruins"){
        items.push({x:e.x,y:e.y,type:"Relic",size:15,bob:0});
        if (e.boss) items.push({x:e.x+12,y:e.y,type:"Egg",size:16,bob:0,elementHint:"Earth",speciesHint:"Turtle"});
      } else if (currentMap === "Snow"){
        items.push({x:e.x,y:e.y,type:"Fur",size:15,bob:0});
        if (e.boss) items.push({x:e.x+12,y:e.y,type:"Egg",size:16,bob:0,elementHint:"Water",speciesHint:"Bear"});
      }
    }
    function damageEnemy(e, dmg){
      e.hp -= dmg; e.squish = 8;
      spawnText(e.x, e.y-18, "-"+dmg, "#ff5252");
      sfx.hit();
      if (e.hp <= 0){
        spawnBurst(e.x, e.y, e.color, 16, 3, 30, 4);
        sfx.enemyDown(); tut.defeated = true; defeatCount++;
        gainExp(active(), e.boss ? 40 : 15);
        dropLoot(e);
        enemies = enemies.filter(x => x !== e);
        updateEVA("กำจัดศัตรูได้! เดินไปเก็บของดรอปเลย!");
      }
    }

    // ---------- Tactical Grid Battle system ----------
    function cellToPixel(gx,gy){ return { x: BATTLE_OX + gx*BATTLE_CELL + BATTLE_CELL/2, y: BATTLE_OY + gy*BATTLE_CELL + BATTLE_CELL/2 }; }
    function gridDist(a,b){ return Math.abs(a.gx-b.gx)+Math.abs(a.gy-b.gy); }
    function spreadRows(n, rows){
      if (n<=0) return [];
      if (n===1) return [Math.floor(rows/2)];
      const arr=[]; const step=(rows-1)/(n-1);
      for (let i=0;i<n;i++) arr.push(Math.round(i*step));
      return arr;
    }
    function currentUnit(){ return battle ? battle.turnQueue[battle.turnIndex] : null; }
    function buildTurnQueue(){
      battle.turnQueue = battle.units.filter(u=>u.alive).sort((a,b)=> b.spd - a.spd);
      battle.turnIndex = 0;
    }
    function computeReachable(unit){
      const occ = new Set(battle.units.filter(u=>u.alive && u!==unit).map(u=>u.gx+','+u.gy));
      const start = {gx:unit.gx, gy:unit.gy};
      const visited = new Map(); visited.set(start.gx+','+start.gy, 0);
      const queue = [start];
      const result = [{gx:start.gx, gy:start.gy}];
      while (queue.length){
        const cur = queue.shift();
        const d = visited.get(cur.gx+','+cur.gy);
        if (d >= unit.moveRange) continue;
        const neighbors = [{gx:cur.gx+1,gy:cur.gy},{gx:cur.gx-1,gy:cur.gy},{gx:cur.gx,gy:cur.gy+1},{gx:cur.gx,gy:cur.gy-1}];
        for (const n of neighbors){
          if (n.gx<0||n.gx>=BATTLE_COLS||n.gy<0||n.gy>=BATTLE_ROWS) continue;
          const key = n.gx+','+n.gy;
          if (visited.has(key) || occ.has(key)) continue;
          visited.set(key, d+1);
          result.push({gx:n.gx, gy:n.gy});
          queue.push(n);
        }
      }
      return result;
    }
    // ---------- Tactical Roles (Tank / DPS / Support / CC) ----------
    const ROLE_ICONS = { Tank:'🛡️', DPS:'⚔️', Support:'✚', CC:'💫' };
    const ROLE_NAMES = { Tank:'Tank', DPS:'DPS', Support:'Support', CC:'CC' };

    // ---------- Data-driven skill system ----------
    // Add a new skill by adding one entry here — nothing else needs to change
    // for it to be usable, as long as some creature's skillSlots references its id.
    // damage: multiplier applied to the unit's normal attack/heal amount (1.0 = baseline).
    // cooldown: turns (of that unit's own turns) before the skill can be used again; omit/0 = no cooldown.
    // guard:true marks a defensive skill that sets up the "defending" damage-reduction state instead of attacking.
    const SKILL_DB = {
      strike:      { id:'strike',      name:'โจมตี',           desc:'โจมตี (หรือรักษาพันธมิตร) ด้วยพลังปกติ',                 damage:1.0 },
      guard:       { id:'guard',       name:'ตั้งการ์ด',        desc:'ลดดาเมจที่ได้รับ 30% จนถึงตาถัดไป ไม่ต้องมีเป้าหมาย', damage:0, guard:true },
      powerStrike: { id:'powerStrike', name:'โจมตีรุนแรง',      desc:'โจมตี/รักษาแรงขึ้น 35%',                                damage:1.35, cooldown:2 },
      shieldBash:  { id:'shieldBash',  name:'ทุบโล่',           desc:'พุ่งชนด้วยโล่ แรงขึ้น 20%',                             damage:1.2,  cooldown:1 },
      healBoost:   { id:'healBoost',   name:'พลังฟื้นฟู',       desc:'รักษา/โจมตีแรงขึ้น 50%',                                damage:1.5,  cooldown:2 },
      disable:     { id:'disable',     name:'จู่โจมก่อกวน',     desc:'โจมตีแรงขึ้น 10% เน้นทำให้ศัตรูเสียจังหวะ',            damage:1.1,  cooldown:2 },
    };
    // Which 3 skills each role starts with. The 3rd slot is locked (shows "Empty")
    // until the creature's special ability is unlocked (fed a Crystal Cake) — see skillSlotsForUnit.
    const ROLE_SKILL_LOADOUT = {
      Tank:    ['strike','guard','shieldBash'],
      DPS:     ['strike','guard','powerStrike'],
      Support: ['strike','guard','healBoost'],
      CC:      ['strike','guard','disable'],
    };
    function skillSlotsForUnit(role, thirdSlotUnlocked){
      const loadout = ROLE_SKILL_LOADOUT[role] || ['strike','guard',null];
      return [ loadout[0], loadout[1], thirdSlotUnlocked ? loadout[2] : null ];
    }

    // ---------- Skill learning system ----------
    // Creatures start knowing "strike" + "guard". At the levels below they learn one more
    // skill from a role-flavoured pool. If a skill slot (max 3) is free it's filled automatically;
    // otherwise the player is asked which of the 3 equipped skills to replace.
    const SKILL_LEARN_LEVELS = [5, 10, 16, 24];
    const SKILL_LEARN_POOL = {
      Tank:    ['shieldBash','powerStrike','healBoost','disable'],
      DPS:     ['powerStrike','shieldBash','disable','healBoost'],
      Support: ['healBoost','disable','powerStrike','shieldBash'],
      CC:      ['disable','shieldBash','powerStrike','healBoost'],
    };
    function nextSkillToLearn(cr){
      const role = roleForCreature(cr);
      const pool = SKILL_LEARN_POOL[role] || SKILL_LEARN_POOL.DPS;
      const idx = cr.skillLearnIndex || 0;
      if (idx >= pool.length) return null;
      return pool[idx];
    }
    // Queue so multiple level-ups (or multiple creatures) in the same moment don't clobber each other.
    let skillLearnQueue = [];
    let skillLearnOpen = false;
    function queueSkillLearn(cr){
      const skillId = nextSkillToLearn(cr);
      if (!skillId) return;
      skillLearnQueue.push({ cr, skillId });
      processSkillLearnQueue();
    }
    function processSkillLearnQueue(){
      if (skillLearnOpen || skillLearnQueue.length===0) return;
      const { cr, skillId } = skillLearnQueue.shift();
      cr.skillLearnIndex = (cr.skillLearnIndex || 0) + 1;
      const emptySlot = cr.skills.findIndex(s => !s);
      if (emptySlot !== -1){
        cr.skills[emptySlot] = skillId;
        const skill = SKILL_DB[skillId];
        updateEVA(`✨ ${cr.name} เรียนรู้สกิลใหม่: ${skill.name}!`);
        spawnText(cr.x, cr.y-30, "สกิลใหม่!", "#9dc4cc");
        spawnStars(cr.x, cr.y, 12, '#c3e0e4'); sfx.skill();
        processSkillLearnQueue();
      } else {
        openSkillReplaceModal(cr, skillId);
      }
    }
    function openSkillReplaceModal(cr, newSkillId){
      skillLearnOpen = true;
      const overlay = document.getElementById('skillLearnOverlay');
      const newSkill = SKILL_DB[newSkillId];
      document.getElementById('skillLearnCreatureName').textContent = `${cr.name} (Lv.${cr.level}) เรียนรู้สกิลใหม่!`;
      document.getElementById('skillLearnNewName').textContent = newSkill.name;
      document.getElementById('skillLearnNewDesc').textContent = newSkill.desc;
      const list = document.getElementById('skillLearnCurrentList');
      list.innerHTML = cr.skills.map((sid,i)=>{
        const s = SKILL_DB[sid];
        return `<div class="skillLearnRow">
          <div class="skillLearnInfo">
            <div class="skillLearnName">${s ? s.name : 'ว่าง'}</div>
            <div class="skillLearnDesc">${s ? s.desc : ''}</div>
          </div>
          <button onclick="confirmReplaceSkill(${i})">แทนที่</button>
        </div>`;
      }).join('');
      overlay.dataset.creatureIdx = party.indexOf(cr);
      overlay.dataset.newSkillId = newSkillId;
      overlay.classList.add('open');
    }
    function confirmReplaceSkill(slotIndex){
      const overlay = document.getElementById('skillLearnOverlay');
      const cr = party[parseInt(overlay.dataset.creatureIdx,10)];
      const newSkillId = overlay.dataset.newSkillId;
      if (cr && newSkillId){
        const oldSkill = SKILL_DB[cr.skills[slotIndex]];
        const newSkill = SKILL_DB[newSkillId];
        cr.skills[slotIndex] = newSkillId;
        updateEVA(`✨ ${cr.name} เปลี่ยน "${oldSkill?oldSkill.name:'ว่าง'}" เป็น "${newSkill.name}" แล้ว!`);
        spawnStars(cr.x, cr.y, 12, '#c3e0e4'); sfx.skill();
      }
      closeSkillReplaceModal();
    }
    function cancelReplaceSkill(){
      const overlay = document.getElementById('skillLearnOverlay');
      const cr = party[parseInt(overlay.dataset.creatureIdx,10)];
      if (cr) updateEVA(`${cr.name} ยังคงใช้สกิลเดิมต่อไป`);
      closeSkillReplaceModal();
    }
    function closeSkillReplaceModal(){
      document.getElementById('skillLearnOverlay').classList.remove('open');
      skillLearnOpen = false;
      processSkillLearnQueue();
    }
    function roleForCreature(c){
      if (c.element==="Nature") return "Support"; // heals allies, fits Heal Pulse skill line
      if (c.element==="Fire") return "DPS";        // highest raw attack, fits Fireball skill line
      if (c.element==="Chimera") return "Tank";    // hybrid, sturdiest, no further evolution
      if (c.element==="Earth") return "Tank";       // Boulder Golem: grounded and sturdy
      if (c.element==="Water") return "CC";         // Tide Serpent: slows/entangles foes
      if (c.element==="Electric") return "DPS";     // Volt Fox: fast, shocking strikes
      return "DPS";                                // base Seedling before evolving
    }
    function zoneElement(){
      if (currentMap==="Cave" || currentMap==="Volcano") return "Fire";
      if (currentMap==="Snow") return "Water";     // frozen water
      if (currentMap==="Dungeon") return "Leaf";   // forest
      if (currentMap==="Ruins") return "Earth";    // ancient stone
      return "Neutral";
    }
    function zoneEnemyName(){
      if (currentMap==="Cave") return "สัตว์ถ้ำ";
      if (currentMap==="Volcano") return "อสูรลาวา";
      if (currentMap==="Ruins") return "ผู้พิทักษ์โบราณ";
      if (currentMap==="Snow") return "สัตว์หิมะ";
      return "สัตว์ป่า";
    }
    function roleForEnemy(isBoss){
      if (isBoss) return "Tank";                          // pack leader draws aggro, high HP
      if (currentMap==="Cave" || currentMap==="Volcano") return "DPS";   // fire beasts hit hard
      return "CC";                                          // forest/ruins/snow beasts disorient
    }
    function startBattle(triggerEnemy){
      if (battleActive) return;
      const playerCreatures = party.filter(p=>p.hp>0);
      if (playerCreatures.length===0){ updateEVA("⚠️ สัตว์เลี้ยงของคุณหมดแรงทั้งหมด รีบกลับฟาร์มไปพักฟื้นก่อน!"); return; }
      const cluster = enemies.filter(e => e===triggerEnemy || Math.hypot(e.x-triggerEnemy.x,e.y-triggerEnemy.y)<130).slice(0,4);
      enemies = enemies.filter(e => !cluster.includes(e));
      battleActive = true;
      const pRows = spreadRows(playerCreatures.length, BATTLE_ROWS);
      const eRows = spreadRows(cluster.length, BATTLE_ROWS);
      const pUnits = playerCreatures.map((cr,i)=>{
        const role = roleForCreature(cr);
        let atk = Math.round(cr.atk*(1+cr.bond/200));
        if (role==='DPS') atk = Math.round(atk*1.2);
        let maxHp = role==='Tank' ? Math.round(cr.maxHp*1.15) : cr.maxHp;
        const skillSlots = cr.skills && cr.skills.some(Boolean) ? cr.skills : skillSlotsForUnit(role, !!cr.skillUnlocked);
        return {
          isPlayer:true, ref:cr, name:cr.name, color:cr.color, element:cr.element, size:cr.size, role,
          species:cr.species, stage:cr.stage, napping:false,
          hp:Math.min(maxHp,cr.hp), maxHp, atk, spd:10+cr.level+(cr.stage*3)+traitSpdBonus(cr.trait),
          moveRange:3, atkRange: cr.element==="Nature" ? 2 : 1,
          skillSlots, skillCd:[0,0,0],
          gx:1, gy:pRows[i], x:0, y:0, facing:{x:1,y:0}, alive:true, isBoss:false, stunned:false, defending:false
        };
      });
      const eUnits = cluster.map((e,i)=>{
        const role = roleForEnemy(!!e.boss);
        let atk = e.boss?18:10;
        if (role==='DPS') atk = Math.round(atk*1.2);
        let maxHp = role==='Tank' ? Math.round(e.maxHp*1.15) : e.maxHp;
        return {
          isPlayer:false, ref:e, name: e.tournamentName || (e.boss ? "หัวหน้าฝูง" : zoneEnemyName()), color:e.color, element: e.tournamentName ? "Electric" : zoneElement(), size:e.size, role,
          hp:Math.min(maxHp,e.hp), maxHp, atk, spd: e.boss?9:13,
          moveRange:2, atkRange:1,
          gx:5, gy:eRows[i], x:0, y:0, squish:0, alive:true, isBoss:!!e.boss, boss:!!e.boss, stunned:false
        };
      });
      battle = {
        units:[...pUnits, ...eUnits], turnQueue:[], turnIndex:0, activeUnit:null,
        phase:'move', cursor:{gx:1,gy:pRows[0]}, reachable:[], targets:[], targetIndex:0,
        aiTimer:0, phaseTimer:0, ended:false, endTimer:0, retreat:false, rewardExp:0, rewardLoot:[], anim:null
      };
      buildTurnQueue();
      beginUnitTurn();
      sfx.zone();
      mapBanner = { text:"TACTICAL BATTLE", sub:"วางแผนการเคลื่อนที่และโจมตี! (Tank ดึงเป้า / Support รักษา / CC ทำให้มึนงง)", timer:110 };
    }
    function beginUnitTurn(){
      if (checkBattleEnd()) return;
      let u = currentUnit();
      let guard = 0;
      while (u && !u.alive && guard<30){ battle.turnIndex++; if (battle.turnIndex>=battle.turnQueue.length) buildTurnQueue(); u = currentUnit(); guard++; }
      if (!u){ return; }
      if (u.stunned){
        u.stunned = false;
        const pos = cellToPixel(u.gx,u.gy);
        spawnText(pos.x,pos.y-30,"มึนงง! ข้ามตา","#ba68c8");
        spawnBurst(pos.x,pos.y,'#ba68c8',10,2,24,3);
        advanceTurnIndex();
        beginUnitTurn();
        return;
      }
      battle.activeUnit = u;
      u.defending = false;
      battle.cursor = {gx:u.gx, gy:u.gy};
      battle.targets = []; battle.targetIndex = 0;
      if (u.isPlayer){
        battle.phase = 'menu';
        battle.skillMult = 1;
        battle.reachable = computeReachable(u);
        if (u.skillCd) u.skillCd = u.skillCd.map(v=>Math.max(0, v-1));
        updateEVA(`⚔️ ตาของ ${u.name} [${ROLE_ICONS[u.role]} ${ROLE_NAMES[u.role]}]: เลือกการกระทำจากเมนูด้านล่าง`);
      } else {
        battle.phase = 'ai_think';
        battle.aiTimer = 40;
      }
    }
    function advanceTurnIndex(){
      battle.turnIndex++;
      if (battle.turnIndex >= battle.turnQueue.length) buildTurnQueue();
    }
    function endUnitTurn(){
      if (checkBattleEnd()) return;
      advanceTurnIndex();
      beginUnitTurn();
    }
    function checkBattleEnd(){
      if (!battle || battle.ended) return true;
      const playersAlive = battle.units.some(u=>u.isPlayer && u.alive);
      const enemiesAlive = battle.units.some(u=>!u.isPlayer && u.alive);
      if (!enemiesAlive){ winBattle(); return true; }
      if (!playersAlive){ loseBattle(); return true; }
      return false;
    }
    function winBattle(){
      battle.ended = true; battle.endTimer = 70;
      for (const u of battle.units){ if (u.isPlayer && u.ref) u.ref.hp = Math.max(1, Math.round(u.hp)); }
      const isTournament = battle.units.some(u=>!u.isPlayer && u.ref && u.ref.tournamentName);
      if (isTournament){
        tournamentWon = true;
        inv.coin += 80;
        gainExp(active(), 50);
        sfx.enemyDown(); flashAlpha = 0.7;
        updateEVA("🏆 ชนะ Monster Tournament! ได้รับ 80 เหรียญ และ EXP พิเศษ 50");
        mapBanner = { text:"TOURNAMENT VICTORY!", sub:"ท่านคือแชมป์แห่งเทศกาลปีนี้!", timer:130 };
        return;
      }
      if (battle.rewardExp>0) gainExp(active(), battle.rewardExp);
      for (const t of battle.rewardLoot){
        if (currentMap === "Dungeon"){
          items.push({x:player.x+(Math.random()*30-15), y:player.y+22, type:"Meat", size:15, bob:0});
          if (t.isBoss) items.push({x:player.x+10, y:player.y+22, type:"Egg", size:16, bob:0, elementHint:"Leaf", speciesHint:"Duck"});
        } else if (currentMap === "Cave"){
          items.push({x:player.x+(Math.random()*30-15), y:player.y+22, type: t.isBoss?"Crystal":"Chili", size:15, bob:0});
          if (t.isBoss) items.push({x:player.x+10, y:player.y+22, type:"Egg", size:16, bob:0, elementHint:"Fire", speciesHint:"Lion"});
        } else if (currentMap === "Volcano"){
          items.push({x:player.x+(Math.random()*30-15), y:player.y+22, type:"Obsidian", size:15, bob:0});
          if (t.isBoss) items.push({x:player.x+10, y:player.y+22, type:"Egg", size:16, bob:0, elementHint:"Fire", speciesHint:"Wolf"});
        } else if (currentMap === "Ruins"){
          items.push({x:player.x+(Math.random()*30-15), y:player.y+22, type:"Relic", size:15, bob:0});
          if (t.isBoss) items.push({x:player.x+10, y:player.y+22, type:"Egg", size:16, bob:0, elementHint:"Earth", speciesHint:"Turtle"});
        } else if (currentMap === "Snow"){
          items.push({x:player.x+(Math.random()*30-15), y:player.y+22, type:"Fur", size:15, bob:0});
          if (t.isBoss) items.push({x:player.x+10, y:player.y+22, type:"Egg", size:16, bob:0, elementHint:"Water", speciesHint:"Bear"});
        }
      }
      sfx.enemyDown(); flashAlpha = 0.7;
      updateEVA("🏆 ชนะการต่อสู้แบบ Tactical! ได้รับ EXP และของรางวัลตกอยู่ใกล้ๆ ตัวคุณแล้ว");
      mapBanner = { text:"VICTORY!", sub:"เก็บของรางวัลที่ดรอปไว้", timer:110 };
    }
    function loseBattle(){
      battle.ended = true; battle.endTimer = 70; battle.retreat = true;
      for (const u of battle.units){ if (u.isPlayer && u.ref) u.ref.hp = 1; }
      const penalty = Math.min(inv.coin, 10);
      inv.coin -= penalty;
      updateEVA(`💥 ปาร์ตี้ของคุณพ่ายแพ้ในการต่อสู้! ถอยกลับไปพักฟื้นที่ฟาร์ม (เสียเหรียญ ${penalty})`);
      mapBanner = { text:"RETREAT...", sub:"กลับไปพักฟื้นที่ฟาร์ม", timer:110 };
    }
    function tryMoveCursor(dx,dy){
      const ngx = battle.cursor.gx+dx, ngy = battle.cursor.gy+dy;
      const ok = battle.reachable.some(r=>r.gx===ngx && r.gy===ngy);
      if (!ok) return;
      battle.cursor = {gx:ngx, gy:ngy};
    }
    // ---------- Battle action menu (2x2: Skill 1 / Skill 2 / Skill 3 / Move) ----------
    // The menu only ever shows on the player's own turn (see refreshBattleMenuUI).
    // Skill 1: normal attack (or heal for Support). Skill 2: Defend (guaranteed, no target needed).
    // Skill 3: a stronger version of the attack/heal. Move: reposition, but never attack the same turn.
    function battleTargetsInRange(u){
      let targets = battle.units.filter(o=>o.alive && o.isPlayer!==u.isPlayer && gridDist(u,o)<=u.atkRange);
      if (u.role==='Support'){
        const healTargets = battle.units.filter(o=>o.alive && o.isPlayer===u.isPlayer && o!==u && o.hp<o.maxHp && gridDist(u,o)<=u.atkRange);
        targets = targets.concat(healTargets);
      }
      return targets;
    }
    function battleUseSkill(slotNum){
      if (!battle || battle.phase!=='menu') return;
      const u = battle.activeUnit;
      if (!u || !u.isPlayer) return;
      const idx = slotNum-1;
      const skillId = u.skillSlots && u.skillSlots[idx];
      if (!skillId){ updateEVA('ช่องสกิลนี้ว่างเปล่า (Empty)'); return; }
      const skill = SKILL_DB[skillId];
      if (!skill) return;
      const cdLeft = (u.skillCd && u.skillCd[idx]) || 0;
      if (cdLeft>0){ updateEVA(`${skill.name} ยังไม่พร้อมใช้งาน (อีก ${cdLeft} ตา)`); return; }
      if (u.skillCd) u.skillCd[idx] = skill.cooldown || 0;
      if (skill.guard){ skipTurn(); return; }
      battle.skillMult = skill.damage!=null ? skill.damage : 1;
      const targets = battleTargetsInRange(u);
      if (targets.length===0){
        updateEVA(`${u.name} ใช้ ${skill.name} แต่ไม่มีเป้าหมายในระยะ ข้ามเทิร์นนี้`);
        battle.phase = 'resolve'; battle.phaseTimer = 10;
        return;
      }
      battle.targets = targets; battle.targetIndex = 0; battle.phase = 'target';
      updateEVA(u.role==='Support' ? `🎯 ${skill.name}: A/D เลือกเป้าหมาย (ศัตรู=โจมตี ✚พวกเดียวกัน=รักษา) แล้วกด SPACE` : `🎯 ${skill.name}: เลือกเป้าหมายด้วย A/D แล้วกด SPACE`);
    }
    function battleEnterMove(){
      if (!battle || battle.phase!=='menu') return;
      const u = battle.activeUnit;
      battle.reachable = computeReachable(u);
      battle.cursor = {gx:u.gx, gy:u.gy};
      battle.phase = 'move';
      updateEVA("🚶 WASD เลือกช่องในระยะ แล้วกด SPACE หรือปุ่มยืนยัน (เดินแล้วเทิร์นจะจบทันที โจมตีต่อไม่ได้)");
    }
    function battleCancelMove(){
      if (!battle || battle.phase!=='move') return;
      battle.phase = 'menu';
      updateEVA(`⚔️ ตาของ ${battle.activeUnit.name}: เลือกการกระทำจากเมนูด้านล่าง`);
    }
    function battleConfirmMove(){
      if (!battle || battle.phase!=='move') return;
      const u = battle.activeUnit;
      u.gx = battle.cursor.gx; u.gy = battle.cursor.gy;
      updateEVA(`${u.name} เคลื่อนที่แล้ว เทิร์นจบทันที`);
      battle.phase = 'resolve'; battle.phaseTimer = 10;
    }
    function renderBattleSkillButtons(){
      const u = battle && battle.activeUnit;
      for (let i=0;i<3;i++){
        const btn = document.getElementById('battleSkill'+(i+1)+'Btn');
        if (!btn) continue;
        const skillId = u && u.isPlayer && u.skillSlots ? u.skillSlots[i] : null;
        const skill = skillId ? SKILL_DB[skillId] : null;
        if (!skill){
          btn.textContent = 'Empty';
          btn.title = '';
          btn.disabled = true;
          continue;
        }
        const cd = (u.skillCd && u.skillCd[i]) || 0;
        btn.textContent = cd>0 ? `⏳ ${skill.name} (${cd})` : skill.name;
        btn.title = skill.desc + (skill.damage ? ` · ดาเมจ x${skill.damage}` : '') + (skill.cooldown ? ` · คูลดาวน์ ${skill.cooldown} ตา` : '');
        btn.disabled = cd>0;
      }
    }
    function refreshBattleMenuUI(){
      const menuEl = document.getElementById('battleActionMenu');
      const moveEl = document.getElementById('battleMoveMenu');
      if (!menuEl || !moveEl) return;
      const u = battle && battle.activeUnit;
      const showMenu = !!(battleActive && battle && !battle.ended && u && u.isPlayer && battle.phase==='menu');
      const showMove = !!(battleActive && battle && !battle.ended && u && u.isPlayer && battle.phase==='move');
      menuEl.classList.toggle('hidden', !showMenu);
      moveEl.classList.toggle('hidden', !showMove);
      if (showMenu) renderBattleSkillButtons();
    }
    function skipTurn(){
      if (battle.activeUnit){
        battle.activeUnit.defending = true;
        const pos = cellToPixel(battle.activeUnit.gx, battle.activeUnit.gy);
        spawnText(pos.x,pos.y-30,"DEFEND!","#64b5f6");
        updateEVA(`🛡️ ${battle.activeUnit.name} ตั้งการ์ด! ลดดาเมจที่ได้รับ 30% จนกว่าจะถึงตาถัดไป`);
      }
      battle.phase = 'resolve'; battle.phaseTimer = 5;
    }
    function cycleTarget(dir){
      if (battle.targets.length===0) return;
      battle.targetIndex = (battle.targetIndex + dir + battle.targets.length) % battle.targets.length;
    }
    function startAttackAnim(attacker, target, isHeal, applyFn){
      // Instead of applying the outcome instantly, play a short lunge animation
      // (attacker slides toward target, impact effects fire mid-lunge, then it slides back).
      battle.anim = { attacker, target, isHeal, t:0, duration:22, impact:11, applied:false, apply:applyFn };
      battle.phase = 'attack_anim';
    }
    function confirmAttack(){
      const u = battle.activeUnit;
      const t = battle.targets[battle.targetIndex];
      const skillMult = battle.skillMult || 1;
      if (t.isPlayer === u.isPlayer){
        // Support healing an ally instead of attacking
        const healAmt = Math.max(4, Math.round(u.atk*0.6*skillMult));
        updateEVA(`✚ ${u.name} รักษา ${t.name} ไป ${healAmt} HP!`);
        startAttackAnim(u, t, true, ()=>{
          t.hp = Math.min(t.maxHp, t.hp + healAmt);
          if (t.ref) t.ref.hp = Math.max(0, Math.round(t.hp));
          const pos = cellToPixel(t.gx,t.gy);
          spawnText(pos.x,pos.y-24,"+"+healAmt,"#8BC34A");
          spawnBurst(pos.x,pos.y,'#8BC34A',12,2.5,26,4);
          sfx.feed();
          t.hitFlash = 8;
        });
        return;
      }
      let dmg = Math.max(1, Math.round(u.atk * (0.85 + Math.random()*0.3)));
      dmg = Math.round(dmg * typeMultiplier(u.element, t.element) * skillMult);
      const isCrit = Math.random() < critChance(u);
      if (isCrit) dmg = Math.round(dmg*1.6);
      if (t.role==='Tank') dmg = Math.max(1, Math.round(dmg*0.8));
      if (t.defending) dmg = Math.max(1, Math.round(dmg*0.7));
      startAttackAnim(u, t, false, ()=>{
        t.hp -= dmg;
        const pos = cellToPixel(t.gx,t.gy);
        spawnText(pos.x,pos.y-24,"-"+dmg,"#ff5252");
        if (isCrit) spawnText(pos.x,pos.y-42,"CRIT!","#ffeb3b");
        spawnBurst(pos.x,pos.y,t.color,14,3,26,4);
        sfx.hit(); shake(isCrit?5:3,isCrit?9:6);
        t.hitFlash = 8;
        if (t.ref) t.ref.hp = Math.max(0, Math.round(t.hp));
        if (t.hp<=0){
          t.hp = 0; t.alive = false;
          spawnBurst(pos.x,pos.y,t.color,20,4,32,5);
          sfx.enemyDown();
          if (!t.isPlayer){
            defeatCount++; tut.defeated = true;
            battle.rewardExp += (t.isBoss?40:15);
            battle.rewardLoot.push(t);
          }
        } else if (u.role==='CC' && Math.random()<0.35){
          t.stunned = true;
          spawnText(pos.x,pos.y-42,"STUN!","#ba68c8");
          spawnBurst(pos.x,pos.y,'#ba68c8',10,2,24,3);
        }
      });
    }
    function aiAct(u){
      let targets = battle.units.filter(o=>o.alive && o.isPlayer);
      if (targets.length===0){ battle.phase='resolve'; battle.phaseTimer=10; return; }
      const taunters = targets.filter(t=>t.role==='Tank');
      if (taunters.length>0) targets = taunters; // Tank draws enemy aggro
      let target = targets[0], minD = Infinity;
      for (const t of targets){ const d=gridDist(u,t); if (d<minD){ minD=d; target=t; } }
      if (gridDist(u,target) > u.atkRange){
        const reach = computeReachable(u);
        let best=null, bestD=gridDist(u,target);
        for (const cell of reach){
          const d = Math.abs(cell.gx-target.gx)+Math.abs(cell.gy-target.gy);
          if (d < bestD){ bestD=d; best=cell; }
        }
        if (best){ u.gx=best.gx; u.gy=best.gy; }
      }
      if (gridDist(u,target) <= u.atkRange){
        let dmg = Math.max(1, Math.round(u.atk * (0.85 + Math.random()*0.3)));
        dmg = Math.round(dmg * typeMultiplier(u.element, target.element));
        const isCrit = Math.random() < critChance(u);
        if (isCrit) dmg = Math.round(dmg*1.6);
        if (target.role==='Tank') dmg = Math.max(1, Math.round(dmg*0.8));
        if (target.defending) dmg = Math.max(1, Math.round(dmg*0.7));
        startAttackAnim(u, target, false, ()=>{
          target.hp -= dmg;
          const pos = cellToPixel(target.gx,target.gy);
          spawnText(pos.x,pos.y-24,"-"+dmg,"#ff5252");
          if (isCrit) spawnText(pos.x,pos.y-42,"CRIT!","#ffeb3b");
          spawnBurst(pos.x,pos.y,'#ff5252',12,3,26,4);
          sfx.hit(); shake(isCrit?4:2,isCrit?8:5);
          target.hitFlash = 8;
          if (target.ref) target.ref.hp = Math.max(0, Math.round(target.hp));
          if (target.hp<=0){
            target.hp = 0; target.alive = false;
            spawnBurst(pos.x,pos.y,target.color,18,4,30,5);
            sfx.enemyDown();
          } else if (u.role==='CC' && Math.random()<0.35){
            target.stunned = true;
            spawnText(pos.x,pos.y-42,"STUN!","#ba68c8");
            spawnBurst(pos.x,pos.y,'#ba68c8',10,2,24,3);
          }
        });
        return;
      }
      battle.phase = 'resolve'; battle.phaseTimer = 25;
    }
    function updateBattle(){
      if (!battle){ refreshBattleMenuUI(); return; }
      if (shakeTime>0) shakeTime--;
      if (flashAlpha>0) flashAlpha -= 0.05;
      if (mapBanner.timer>0) mapBanner.timer--;
      for (let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        p.x+=p.vx; p.y+=p.vy; p.vx*=0.96; p.vy*=0.96; p.life--;
        if (p.life<=0) particles.splice(i,1);
      }
      for (const unit of battle.units){ if (unit.hitFlash>0) unit.hitFlash--; }
      if (battle.ended){
        battle.endTimer--;
        if (battle.endTimer<=0){
          const wasRetreat = battle.retreat;
          battleActive = false; battle = null;
          if (wasRetreat) switchMap("Farm");
        }
        refreshBattleMenuUI();
        return;
      }
      const u = battle.activeUnit;
      if (battle.phase === 'menu' && u && u.isPlayer){
        // Waiting on a click from the 2x2 action menu (Skill 1/2/3 or Move) — see battleUseSkill/battleEnterMove.
      } else if (battle.phase === 'move' && u && u.isPlayer){
        if (pressedOnce.w) tryMoveCursor(0,-1);
        if (pressedOnce.s) tryMoveCursor(0,1);
        if (pressedOnce.a) tryMoveCursor(-1,0);
        if (pressedOnce.d) tryMoveCursor(1,0);
        if (pressedOnce[' ']) battleConfirmMove();
        if (pressedOnce.q) battleCancelMove();
      } else if (battle.phase === 'target' && u && u.isPlayer){
        if (pressedOnce.a || pressedOnce.w) cycleTarget(-1);
        if (pressedOnce.d || pressedOnce.s) cycleTarget(1);
        if (pressedOnce[' ']) confirmAttack();
        if (pressedOnce.q){ skipTurn(); }
      } else if (battle.phase === 'ai_think'){
        battle.aiTimer--;
        if (battle.aiTimer<=0) aiAct(u);
      } else if (battle.phase === 'attack_anim'){
        const anim = battle.anim;
        if (anim){
          anim.t++;
          if (!anim.applied && anim.t>=anim.impact){
            anim.applied = true;
            anim.apply();
          }
          if (anim.t>=anim.duration){
            battle.anim = null;
            battle.phase = 'resolve'; battle.phaseTimer = 8;
          }
        } else {
          battle.phase = 'resolve'; battle.phaseTimer = 5;
        }
      } else if (battle.phase === 'resolve'){
        battle.phaseTimer--;
        if (battle.phaseTimer<=0) endUnitTurn();
      }
      refreshBattleMenuUI();
    }
    function drawBattleScene(){
      const sky = ctx.createLinearGradient(0,0,0,canvas.height);
      if (currentMap==="Cave"){ sky.addColorStop(0,"#3a1f14"); sky.addColorStop(1,"#160a06"); }
      else { sky.addColorStop(0,"#16241a"); sky.addColorStop(1,"#0a140e"); }
      ctx.fillStyle=sky; ctx.fillRect(0,0,canvas.width,canvas.height);

      ctx.font="11px Kanit, sans-serif"; ctx.fillStyle="#cfe9d6"; ctx.textAlign="center";
      if (battle.turnQueue && battle.turnQueue.length){
        const order = battle.turnQueue.map((u,i)=> (i===battle.turnIndex?"▶":"") + (u.alive? (u.isPlayer?"🐾":"👹") : "💀")).join(" ");
        ctx.fillText("ลำดับเทิร์น: "+order, canvas.width/2, 54);
      }
      ctx.textAlign="left";

      const u = battle.activeUnit;
      for (let gx=0; gx<BATTLE_COLS; gx++){
        for (let gy=0; gy<BATTLE_ROWS; gy++){
          const px = BATTLE_OX+gx*BATTLE_CELL, py = BATTLE_OY+gy*BATTLE_CELL;
          let fill = "rgba(255,255,255,0.04)";
          if (battle.phase==='move' && u && u.isPlayer && battle.reachable.some(r=>r.gx===gx&&r.gy===gy)) fill = "rgba(111,191,71,0.28)";
          ctx.fillStyle = fill;
          ctx.beginPath(); ctx.roundRect(px+2,py+2,BATTLE_CELL-4,BATTLE_CELL-4,6); ctx.fill();
          ctx.strokeStyle="rgba(255,255,255,0.08)"; ctx.lineWidth=1;
          ctx.beginPath(); ctx.roundRect(px+2,py+2,BATTLE_CELL-4,BATTLE_CELL-4,6); ctx.stroke();
        }
      }

      if (battle.phase==='target' && battle.targets.length){
        battle.targets.forEach((t,i)=>{
          const pos = cellToPixel(t.gx,t.gy);
          const isHeal = t.isPlayer === battle.activeUnit.isPlayer;
          const baseColor = isHeal ? "#8BC34A" : "#ff5252";
          ctx.strokeStyle = i===battle.targetIndex ? baseColor : (isHeal ? "rgba(139,195,74,0.4)" : "rgba(255,82,82,0.4)");
          ctx.lineWidth = i===battle.targetIndex ? 3 : 2;
          ctx.beginPath(); ctx.arc(pos.x,pos.y,BATTLE_CELL*0.42,0,Math.PI*2); ctx.stroke();
        });
      }

      if (battle.phase==='move' && u && u.isPlayer){
        const cp = cellToPixel(battle.cursor.gx, battle.cursor.gy);
        ctx.strokeStyle="#ffe066"; ctx.lineWidth=3;
        ctx.beginPath(); ctx.roundRect(cp.x-BATTLE_CELL/2+4, cp.y-BATTLE_CELL/2+4, BATTLE_CELL-8, BATTLE_CELL-8, 6); ctx.stroke();
      }

      for (const unit of battle.units){
        if (!unit.alive) continue;
        const basePos = cellToPixel(unit.gx, unit.gy);
        let dx=0, dy=0;
        if (battle.anim && battle.anim.attacker===unit && battle.anim.target){
          // lunge toward the target during the first half, snap back during the second half
          const tp = cellToPixel(battle.anim.target.gx, battle.anim.target.gy);
          const p = Math.min(1, battle.anim.t/battle.anim.duration);
          const lungeAmt = Math.sin(p*Math.PI) * (battle.anim.isHeal ? 0.16 : 0.3);
          dx = (tp.x-basePos.x)*lungeAmt; dy = (tp.y-basePos.y)*lungeAmt;
        }
        const pos = { x: basePos.x+dx, y: basePos.y+dy };
        unit.x = pos.x; unit.y = pos.y;
        if (unit===u){
          ctx.strokeStyle="rgba(255,235,102,0.9)"; ctx.lineWidth=2;
          ctx.beginPath(); ctx.arc(basePos.x,basePos.y,BATTLE_CELL*0.46,0,Math.PI*2); ctx.stroke();
        }
        if (unit.isPlayer){
          drawCreature(unit, 2);
        } else {
          drawEnemy(unit);
        }
        if (unit.hitFlash>0){
          ctx.save();
          ctx.globalAlpha = Math.min(1,unit.hitFlash/8)*0.55;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath(); ctx.arc(pos.x,pos.y,unit.size*1.05,0,Math.PI*2); ctx.fill();
          ctx.restore();
        }
        const barW = 40;
        ctx.fillStyle="rgba(0,0,0,0.5)"; ctx.fillRect(basePos.x-barW/2, basePos.y-unit.size-16, barW, 6);
        ctx.fillStyle = unit.isPlayer ? "#66bb6a" : "#ff8a65";
        ctx.fillRect(basePos.x-barW/2, basePos.y-unit.size-16, barW*Math.max(0,unit.hp/unit.maxHp), 6);
        ctx.font="10px Kanit, sans-serif"; ctx.fillStyle="#eafff0"; ctx.textAlign="center";
        ctx.fillText((ROLE_ICONS[unit.role]||"") + " " + unit.name, basePos.x, basePos.y-unit.size-20);
        ctx.textAlign="left";
        if (unit.stunned){
          ctx.font="13px Kanit, sans-serif"; ctx.fillStyle="#ba68c8"; ctx.textAlign="center";
          ctx.fillText("💫", basePos.x+barW/2-4, basePos.y-unit.size-16);
          ctx.textAlign="left";
        }
      }

      drawParticles();

      ctx.font="12.5px Kanit, sans-serif"; ctx.fillStyle="#fff2cf"; ctx.textAlign="center";
      let hint = "";
      if (u && u.isPlayer && battle.phase==='menu') hint = "เลือกสกิลที่ติดตั้งไว้ หรือ Move จากเมนูด้านล่าง";
      else if (u && u.isPlayer && battle.phase==='move') hint = "WASD: เลือกช่อง · SPACE/ยืนยัน: เดินแล้วจบเทิร์นทันที · Q/ยกเลิก: กลับเมนู";
      else if (u && u.isPlayer && battle.phase==='target') hint = u.role==='Support' ? "A/D: เลือกเป้า (แดง=โจมตี เขียว=รักษา) · SPACE: ยืนยัน · Q: ตั้งการ์ดแทน" : "A/D: เลือกเป้าหมาย · SPACE: โจมตี · Q: ตั้งการ์ดแทน";
      else if (u && !u.isPlayer) hint = (u.name||"ศัตรู") + " กำลังคิด...";
      ctx.fillText(hint, canvas.width/2, canvas.height-14);
      ctx.textAlign="left";
      drawMapBanner();
    }

