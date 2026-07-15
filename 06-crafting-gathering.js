    // ---------- Map switching ----------
    function switchMap(newMap){
      const fromMap = currentMap;
      currentMap = newMap; enemies = []; items = []; transitionAlpha = 1;
      sfx.zone();
      if (newMap !== "Farm") tut.enteredDungeon = true;
      const c = active();
      if (newMap === "Dungeon"){
        player.x = 50; c.x = 30;
        document.getElementById('ui-map').innerText = "Forest Dungeon";
        mapBanner = { text:"FOREST DUNGEON", sub:"ระวังสัตว์ป่าดุร้าย!", timer:120 };
        updateEVA("ระวังด้วย! คุณเข้าสู่ Forest Dungeon แล้ว สัตว์เลี้ยงจะคอยปกป้องคุณ");
        enemies.push({ x:300,y:150,size:24,hp:50,maxHp:50,color:"#ff4f4f",speed:1,squish:0 });
        enemies.push({ x:450,y:300,size:24,hp:50,maxHp:50,color:"#ff4f4f",speed:1,squish:0 });
        enemies.push({ x:500,y:100,size:30,hp:80,maxHp:80,color:"#8b0000",speed:0.8,squish:0,boss:true });
      } else if (newMap === "Cave"){
        player.x = 50; c.x = 30;
        document.getElementById('ui-map').innerText = "Crystal Cave";
        mapBanner = { text:"CRYSTAL CAVE", sub:"ธาตุไฟปกคลุมทุกหนแห่ง", timer:120 };
        updateEVA("เข้าสู่ Crystal Cave! ระวังธาตุไฟ ที่นี่มีพริกไฟและคริสตัลให้เก็บ");
        enemies.push({ x:300,y:140,size:22,hp:40,maxHp:40,color:"#ff9800",speed:1.2,squish:0 });
        enemies.push({ x:460,y:280,size:22,hp:40,maxHp:40,color:"#ff9800",speed:1.2,squish:0 });
        enemies.push({ x:520,y:120,size:32,hp:120,maxHp:120,color:"#b71c1c",speed:0.9,squish:0,boss:true });
      } else if (newMap === "Ruins"){
        player.x = 50; c.x = 30;
        document.getElementById('ui-map').innerText = "ซากอารยธรรม";
        mapBanner = { text:"ANCIENT RUINS", sub:"พลังเวทมนตร์โบราณยังหลงเหลืออยู่...", timer:120 };
        updateEVA("เข้าสู่ซากอารยธรรมโบราณ! สิ่งมีชีวิตพิทักษ์ที่นี่ชอบทำให้มึนงง ระวังตัวด้วย");
        enemies.push({ x:310,y:160,size:24,hp:60,maxHp:60,color:"#9575cd",speed:0.9,squish:0 });
        enemies.push({ x:470,y:290,size:24,hp:60,maxHp:60,color:"#9575cd",speed:0.9,squish:0 });
        enemies.push({ x:520,y:110,size:33,hp:150,maxHp:150,color:"#5e35b1",speed:0.7,squish:0,boss:true });
      } else if (newMap === "Volcano"){
        player.x = 50; c.x = 30;
        document.getElementById('ui-map').innerText = "ภูเขาไฟ";
        mapBanner = { text:"VOLCANO", sub:"ลาวาร้อนระอุ ระวังทุกฝีก้าว!", timer:120 };
        updateEVA("เข้าสู่ภูเขาไฟ! สัตว์ที่นี่ดุร้ายและโจมตีแรงมาก เก็บออบซิเดียนจากศัตรูที่ปราบได้");
        enemies.push({ x:300,y:150,size:24,hp:55,maxHp:55,color:"#ff5722",speed:1.3,squish:0 });
        enemies.push({ x:460,y:300,size:24,hp:55,maxHp:55,color:"#ff5722",speed:1.3,squish:0 });
        enemies.push({ x:520,y:110,size:34,hp:170,maxHp:170,color:"#bf360c",speed:1,squish:0,boss:true });
      } else if (newMap === "Snow"){
        player.y = canvas.height-60; c.y = canvas.height-40;
        document.getElementById('ui-map').innerText = "ภูเขาหิมะ";
        mapBanner = { text:"SNOW MOUNTAIN", sub:"อากาศหนาวเหน็บ ทัศนวิสัยต่ำ", timer:120 };
        updateEVA("เข้าสู่ภูเขาหิมะ! สัตว์ที่นี่ชอบทำให้มึนงงเหมือนกัน แต่ให้ขนสัตว์อันอบอุ่น");
        enemies.push({ x:300,y:150,size:23,hp:50,maxHp:50,color:"#81d4fa",speed:1,squish:0 });
        enemies.push({ x:460,y:280,size:23,hp:50,maxHp:50,color:"#81d4fa",speed:1,squish:0 });
        enemies.push({ x:520,y:120,size:32,hp:140,maxHp:140,color:"#0288d1",speed:0.8,squish:0,boss:true });
      } else {
        if (fromMap === "Snow"){ player.x = 300; c.x = 280; player.y = 20; c.y = 40; }
        else { player.x = 580; c.x = 600; player.y = 240; c.y = 240; }
        document.getElementById('ui-map').innerText = "Farm Zone";
        mapBanner = { text:"FARM ZONE", sub:"กลับสู่บ้านอันอบอุ่น", timer:120 };
        updateEVA("กลับมาที่ฟาร์มแล้ว นำผลผลิตที่ได้ไปดูแลสัตว์เลี้ยงกันเถอะ!");
      }
    }

    // ---------- Cooking ----------
    function cook(){
      if (cookCooldown > 0){ updateEVA("รอครัวเย็นตัวก่อนนะ"); return; }
      if (energy < 5){ updateEVA("⚡ พลังงานไม่พอสำหรับทำอาหาร ลองพักหรือกินของฟื้นพลังงานก่อน"); return; }
      const c = active();
      const recipes = [
        { name:"Hearty Feast", need:{veggie:3,meat:3}, run:()=>{ c.hp=c.maxHp; c.atk+=3; c.bond=Math.min(100,c.bond+8); energy=Math.min(maxEnergy,energy+15); } },
        { name:"Crystal Cake", need:{veggie:1,meat:1,crystal:1}, run:()=>{ c.skillUnlocked=true; c.bond=Math.min(100,c.bond+5); energy=Math.min(maxEnergy,energy+5); } },
        { name:"Fire Stew", need:{meat:2,chili:1}, run:()=>{ c.atk+=5; c.bond=Math.min(100,c.bond+2); energy=Math.min(maxEnergy,energy+10); } },
        { name:"Forest Salad", need:{veggie:2}, run:()=>{ c.hp=Math.min(c.maxHp,c.hp+40); c.bond=Math.min(100,c.bond+2); energy=Math.min(maxEnergy,energy+8); } },
      ];
      for (const r of recipes){
        let ok = true;
        for (const k in r.need) if ((inv[k]||0) < r.need[k]) ok = false;
        if (ok){
          for (const k in r.need) inv[k] -= r.need[k];
          energy -= 5;
          r.run(); cookCooldown = 60;
          spawnBurst(c.x,c.y,'#ffd54f',16,3,30,4);
          spawnText(c.x,c.y-30,r.name+"!","#ffd54f");
          sfx.cook(); tut.cooked = true; cookCount++;
          gainExp(c, 6);
          updateEVA(`ทำอาหาร ${r.name} สำเร็จ! ป้อนให้ ${c.name} เรียบร้อย`);
          checkEvolution(c);
          return;
        }
      }
      updateEVA("วัตถุดิบไม่พอสำหรับสูตรไหนเลย ลองหาผัก เนื้อ พริกไฟ หรือคริสตัลเพิ่ม");
    }

    // ---------- Skill ----------
    function useSkill(){
      const c = active();
      if (!c.skillUnlocked){ updateEVA(`${c.name} ยังไม่ได้ปลดล็อกสกิล ลองทำ Crystal Cake ให้กินสิ`); return; }
      if (c.skillCooldown > 0){ updateEVA("สกิลกำลังชาร์จอยู่ รอสักครู่นะ"); return; }
      c.skillCooldown = 300;
      sfx.skill(); tut.skilled = true;
      if (c.element === "Nature" || c.element === "Chimera"){
        const heal = Math.floor(c.maxHp * (c.element==="Chimera"?0.18:0.3));
        c.hp = Math.min(c.maxHp, c.hp + heal);
        spawnBurst(c.x,c.y,'#8BC34A',24,3,40,5);
        spawnText(c.x,c.y-30,"Heal Pulse +"+heal,"#8BC34A");
      }
      if (c.element === "Fire" || c.element === "Chimera"){
        const dmg = Math.floor(c.atk * (c.element==="Chimera"?1:1.5));
        for (const e of [...enemies]) if (Math.hypot(e.x-c.x,e.y-c.y) < 160) damageEnemy(e,dmg);
        spawnBurst(c.x,c.y,'#ff7043',24,4,40,5); shake(6,16);
        spawnText(c.x,c.y-30,"Fireball!","#ff7043");
      }
      if (c.element === "Earth"){
        const dmg = Math.floor(c.atk * 1.3);
        for (const e of [...enemies]) if (Math.hypot(e.x-c.x,e.y-c.y) < 140) damageEnemy(e,dmg);
        spawnBurst(c.x,c.y,'#8D6E63',24,3,40,6); shake(6,14);
        spawnText(c.x,c.y-30,"Rock Slide!","#8D6E63");
      }
      if (c.element === "Water"){
        const heal = Math.floor(c.maxHp * 0.25);
        c.hp = Math.min(c.maxHp, c.hp + heal);
        spawnBurst(c.x,c.y,'#29B6F6',24,3,40,5);
        spawnText(c.x,c.y-30,"Healing Tide +"+heal,"#29B6F6");
      }
      if (c.element === "Electric"){
        const dmg = Math.floor(c.atk * 1.4);
        for (const e of [...enemies]) if (Math.hypot(e.x-c.x,e.y-c.y) < 180) damageEnemy(e,dmg);
        spawnBurst(c.x,c.y,'#fdd835',24,4,40,5); shake(7,18);
        spawnText(c.x,c.y-30,"Thunder Strike!","#fdd835");
      }
      updateEVA(`${c.name} ใช้สกิลพิเศษ!`);
    }

    // ---------- Breeding & Eggs ----------
    // Secret recipe: breed a fully-evolved Fire Lion with a fully-evolved Fire Wolf to hatch a T-Rex.
    function isSecretTRexPair(p1,p2){
      const specs = [p1.species, p2.species].sort();
      const bothStage2 = p1.stage===2 && p2.stage===2;
      const bothFire = p1.element==="Fire" && p2.element==="Fire";
      return bothStage2 && bothFire && specs[0]==="Lion" && specs[1]==="Wolf";
    }
    function tryBreed(){
      const eligible = party.filter(c => c.stage>=1 && c.bond>=80);
      if (eligible.length < 2){ updateEVA("ต้องมีสัตว์เลี้ยงอย่างน้อย 2 ตัวที่วิวัฒนาการแล้วและ Bond ≥80 ถึงจะผสมพันธุ์ได้"); return; }
      if (breedCooldown > 0){ updateEVA("รังยังต้องพักฟื้นอยู่"); return; }
      if (!spendEnergy(10)) return;
      const [p1,p2] = eligible.sort(()=>Math.random()-0.5).slice(0,2);
      p1.bond -= 30; p2.bond -= 30; breedCooldown = 180;
      const hint = Math.random() < 0.5 ? p1.element : p2.element;
      let speciesHint = Math.random() < 0.5 ? p1.species : p2.species;
      const isSecretCombo = isSecretTRexPair(p1,p2);
      if (isSecretCombo) speciesHint = "TRex";
      const childIV = {
        hp: inheritIV(p1.iv.hp, p2.iv.hp),
        atk: inheritIV(p1.iv.atk, p2.iv.atk),
        spd: inheritIV(p1.iv.spd, p2.iv.spd)
      };
      let childTrait = Math.random()<0.5 ? p1.trait : p2.trait;
      const isMutant = Math.random() < 0.05; // rare mutation, ~1 in 20 eggs
      if (isMutant){
        childIV.hp = 31; childIV.atk = 31; childIV.spd = 31; // guaranteed perfect IVs
        childTrait = randomTrait();
        if (!isSecretCombo) speciesHint = randomSpecies(); // mutation can also surprise with a different animal
      } else if (Math.random() < 0.15){
        childTrait = randomTrait(); // small chance of a fresh, non-inherited trait
      }
      inv.eggs.push({ timer: 1800, maxTimer:1800, elementHint: hint === "Normal" ? "Neutral" : hint, speciesHint, iv: childIV, trait: childTrait, mutant: isMutant });
      spawnBurst(nest.x,nest.y, isSecretCombo?'#ff6f00':(isMutant?'#ffd700':'#ff8fc7'), isSecretCombo?50:(isMutant?40:26),3,40,5);
      sfx.breed(); tut.bred = true;
      if (isSecretCombo){
        updateEVA(`🌋✨ พื้นดินสั่นสะเทือน! ไข่ของ ${p1.name} และ ${p2.name} แผ่รังสีความร้อนมหาศาลออกมา... นี่ไม่ใช่ไข่ธรรมดาแน่ๆ!`);
      } else {
        updateEVA(isMutant ? `✨ เหตุการณ์หายาก! ไข่ของ ${p1.name} และ ${p2.name} เกิดการกลายพันธุ์ผิดปกติ...` : `${p1.name} และ ${p2.name} ผสมพันธุ์กันสำเร็จ! ไข่ฟองใหม่กำลังฟักอยู่ (Trait: ${TRAITS[childTrait].icon} ${TRAITS[childTrait].name})`);
      }
    }

    // ---------- Gathering (Fishing / Wood Cutting / Mining) ----------
    let fishCount = 0, mineCount = 0, woodCount = 0;
    let fishingUpgraded = false, miningUpgraded = false, woodcuttingUpgraded = false, fertilizerCharges = 0;
    function fish(){
      if (Math.hypot(player.x-pond.x, player.y-pond.y) > 70){ updateEVA("ต้องยืนใกล้บ่อน้ำถึงจะตกปลาได้"); return; }
      if (fishCooldown > 0){ updateEVA("รอเบ็ดพร้อมอีกครู่นะ"); return; }
      if (!spendEnergy(4)) return;
      fishCooldown = 90;
      sfx.pickup();
      if (Math.random() < 0.15){ updateEVA("🎣 ปลาหลุดไปซะแล้ว... ลองใหม่อีกครั้ง"); return; }
      const qty = fishingUpgraded ? 2 : 1;
      inv.fish += qty; fishCount += qty;
      gainExp(active(), 4);
      spawnBurst(pond.x,pond.y,'#4fc3f7',10,2,26,3);
      spawnText(player.x,player.y-24, "+"+qty+" Fish", "#4fc3f7");
      updateEVA(`ตกปลาได้ ${qty} ตัว!`);
    }
    function chopTree(){
      let target = null;
      for (const t of trees){ if (t.chopped<=0 && Math.hypot(player.x-t.x, player.y-t.y) < 60){ target=t; break; } }
      if (!target){ updateEVA("ต้องยืนใกล้ต้นไม้ที่ยังไม่ถูกตัดถึงจะตัดไม้ได้"); return; }
      if (!spendEnergy(4)) return;
      const qty = woodcuttingUpgraded ? 2 : 1;
      inv.wood += qty; woodCount += qty;
      target.chopped = target.maxCooldown;
      gainExp(active(), 3);
      spawnBurst(target.x,target.y,'#8d6e63',12,2.5,28,4);
      spawnText(target.x,target.y-30,"+"+qty+" Wood","#a1887f");
      sfx.harvest();
      updateEVA(`ตัดไม้ได้ ${qty} ท่อน! ต้นไม้จะงอกใหม่หลังผ่านไปสักพัก`);
    }
    function mineOre(){
      if (currentMap !== "Cave"){ updateEVA("ต้องอยู่ใน Crystal Cave ถึงจะขุดแร่ได้"); return; }
      let target = null;
      for (const o of oreNodes){ if (o.mined<=0 && Math.hypot(player.x-o.x, player.y-o.y) < 55){ target=o; break; } }
      if (!target){ updateEVA("ต้องยืนใกล้ก้อนแร่ที่ยังไม่ถูกขุดถึงจะขุดได้"); return; }
      if (!spendEnergy(5)) return;
      const qty = miningUpgraded ? 2 : 1;
      inv.ore += qty; mineCount += qty;
      target.mined = target.maxCooldown;
      gainExp(active(), 4);
      spawnBurst(target.x,target.y,'#90a4ae',12,2.5,28,4);
      spawnText(target.x,target.y-30,"+"+qty+" Ore","#cfd8dc");
      sfx.hit();
      updateEVA(`ขุดแร่ได้ ${qty} ก้อน!`);
    }

    // ---------- Crafting ----------
    let craftOpen = false;
    const craftOverlayEl = document.getElementById('craftOverlay');
    const craftRecipes = [
      { id:'rod', name:'🎣 เบ็ดตกปลาแข็งแรง', need:{wood:3,ore:1}, sub:'อัปเกรดถาวร: ตกปลาได้ครั้งละ 2 ตัว', permanent:true, done:()=>fishingUpgraded, run:()=>{ fishingUpgraded=true; } },
      { id:'pick', name:'⛏️ จอบขุดแร่', need:{ore:3,wood:1}, sub:'อัปเกรดถาวร: ขุดแร่ได้ครั้งละ 2 ก้อน', permanent:true, done:()=>miningUpgraded, run:()=>{ miningUpgraded=true; } },
      { id:'axe', name:'🪓 ขวานฟันไม้', need:{wood:2,ore:2}, sub:'อัปเกรดถาวร: ตัดไม้ได้ครั้งละ 2 ท่อน', permanent:true, done:()=>woodcuttingUpgraded, run:()=>{ woodcuttingUpgraded=true; } },
      { id:'fertilizer', name:'🌾 ปุ๋ยเร่งโต', need:{wood:2,fish:1}, sub:'ใช้ครั้งเดียว: พืชที่ปลูกครั้งถัดไปโตเร็วขึ้นเท่าตัว (สะสมได้)', permanent:false, done:()=>false, run:()=>{ fertilizerCharges++; } },
      { id:'sprinkler', name:'💧 ระบบสปริงเกอร์', need:{wood:6,ore:3,crystal:1}, sub:'อัปเกรดถาวร: รดน้ำแปลงทั้งหมดอัตโนมัติทุกวัน โตเร็วเทียบเท่าฝนตกตลอดเวลา', permanent:true, done:()=>sprinklerBuilt, run:()=>{ sprinklerBuilt=true; } },
      { id:'greenhouse', name:'🏡 โรงเรือน', need:{wood:10,ore:5,crystal:2}, sub:'อัปเกรดถาวร: ปลูกพืชได้แม้ในฤดูหนาว และไม่โดนโทษการเติบโตตอนกลางคืน', permanent:true, done:()=>greenhouseBuilt, run:()=>{ greenhouseBuilt=true; } },
      { id:'autofeeder', name:'🍽️ เครื่องให้อาหารอัตโนมัติ', need:{wood:5,ore:4,fish:2}, sub:'อัปเกรดถาวร: ป้อนผักให้สัตว์เลี้ยงหลักอัตโนมัติเป็นระยะเมื่อมีผักในคลัง', permanent:true, done:()=>autoFeederBuilt, run:()=>{ autoFeederBuilt=true; } }
    ];
    function openCraft(){ craftOpen = true; renderCraft(); craftOverlayEl.classList.add('open'); }
    function closeCraft(){ craftOpen = false; craftOverlayEl.classList.remove('open'); }
    function renderCraft(){
      const el = document.getElementById('craftList');
      el.innerHTML = '';
      for (const r of craftRecipes){
        const isDone = r.permanent && r.done();
        const canAfford = Object.keys(r.need).every(k => (inv[k]||0) >= r.need[k]);
        const needText = Object.entries(r.need).map(([k,v])=> `${k} x${v}`).join(', ');
        const row = document.createElement('div');
        row.className = 'shopRow';
        row.innerHTML = `<div class="shopInfo"><div class="shopName">${r.name}${isDone?' ✅':''}</div><div class="shopSub">${r.sub} · ต้องการ: ${needText}${r.id==='fertilizer'&&fertilizerCharges>0?` · มีอยู่ ${fertilizerCharges} ชุด`:''}</div></div>
          <button ${(!canAfford || isDone)?'disabled':''}>${isDone?'มีแล้ว':'ประดิษฐ์'}</button>`;
        row.querySelector('button').addEventListener('click', ()=>{
          if (!canAfford || isDone) return;
          for (const k in r.need) inv[k] -= r.need[k];
          r.run(); sfx.cook();
          updateEVA(`ประดิษฐ์ ${r.name} สำเร็จ!`);
          renderCraft(); updateUI();
        });
        el.appendChild(row);
      }
    }
    document.getElementById('craftToggle').addEventListener('click', openCraft);
    document.getElementById('closeCraftBtn').addEventListener('click', closeCraft);
    craftOverlayEl.addEventListener('click', e=>{ if (e.target===craftOverlayEl) closeCraft(); });

    // ---------- Pet Storage Box (deposit/withdraw beyond the 3-slot party) ----------
    let storageBox = [];
    let storageOpen = false;
    const storageOverlayEl = document.getElementById('storageOverlay');
    function openStorage(){ storageOpen = true; renderStorage(); storageOverlayEl.classList.add('open'); }
    function closeStorage(){ storageOpen = false; storageOverlayEl.classList.remove('open'); }
    function creatureSummaryRow(c, i, actionLabel, actionFn, actionDisabled){
      const spec = speciesInfo(c.species);
      return `<div class="shopRow"><div class="shopInfo">
        <div class="shopName">${spec.icon} ${c.name} <span style="opacity:.65;">Lv.${c.level}</span></div>
        <div class="shopSub">${elementIcon(c.element)} ${elementName(c.element)} · Stage ${c.stage} · Bond ${Math.round(c.bond)}/100</div>
        </div><button ${actionDisabled?'disabled':''} onclick="${actionFn}(${i})">${actionLabel}</button></div>`;
    }
    function renderStorage(){
      const el = document.getElementById('storageContent');
      if (!el) return;
      const partyHtml = party.map((c,i)=> creatureSummaryRow(c,i,"📦 ฝาก","depositCreature", party.length<=1)).join('')
        || '<div style="opacity:.6; font-size:12px;">ไม่มีสัตว์เลี้ยงในปาร์ตี้</div>';
      const boxHtml = storageBox.map((c,i)=> creatureSummaryRow(c,i,"🐾 รับกลับ","withdrawCreature", party.length>=MAX_PARTY)).join('')
        || '<div style="opacity:.6; font-size:12px;">คลังว่างเปล่า — ยังไม่มีสัตว์เลี้ยงฝากไว้</div>';
      el.innerHTML = `<h4>ปาร์ตี้ปัจจุบัน (${party.length}/${MAX_PARTY})</h4>${partyHtml}<h4>📦 คลังเก็บ (${storageBox.length})</h4>${boxHtml}`;
    }
    function depositCreature(idx){
      if (party.length <= 1){ updateEVA("ต้องมีสัตว์เลี้ยงติดตัวอย่างน้อย 1 ตัวเสมอ ฝากตัวนี้ไม่ได้"); return; }
      const [cr] = party.splice(idx,1);
      storageBox.push(cr);
      if (activeIndex >= party.length) activeIndex = party.length-1;
      updateEVA(`📦 ฝาก ${cr.name} ไว้ในคลังแล้ว ปลอดภัยดี รอวันได้กลับมาลุยด้วยกันอีกครั้ง!`);
      renderStorage(); updateUI();
    }
    function withdrawCreature(idx){
      if (party.length >= MAX_PARTY){ updateEVA(`ปาร์ตี้เต็มแล้ว (${MAX_PARTY} ตัว) ต้องฝากตัวอื่นก่อนถึงจะรับตัวนี้กลับมาได้`); return; }
      const [cr] = storageBox.splice(idx,1);
      cr.x = player.x - 20; cr.y = player.y + 10;
      party.push(cr);
      updateEVA(`🐾 รับ ${cr.name} กลับเข้าปาร์ตี้แล้ว! (Lv.${cr.level}, Bond ${Math.round(cr.bond)}/100 — ค่าเดิมทุกอย่างยังอยู่ครบ)`);
      renderStorage(); updateUI();
    }
    document.getElementById('storageToggle').addEventListener('click', openStorage);
    document.getElementById('closeStorageBtn').addEventListener('click', closeStorage);
    storageOverlayEl.addEventListener('click', e=>{ if (e.target===storageOverlayEl) closeStorage(); });

