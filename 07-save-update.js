    // ---------- Save / Load ----------
    // Prefer the Artifact storage API when available (claude.ai), but fall back to
    // localStorage so the game can still save/load when opened as a plain HTML file
    // in a normal browser — this is what fixes "ระบบบันทึกไม่พร้อมใช้งาน".
    const LS_KEY = "eden-save-v1";
    async function storageSet(key, value){
      if (window.storage){
        try{ const r = await window.storage.set(key, value); if (r) return true; }catch(err){ console.error(err); }
      }
      try{ localStorage.setItem(LS_KEY, value); return true; }catch(err){ console.error(err); return false; }
    }
    async function storageGet(key){
      if (window.storage){
        try{ const r = await window.storage.get(key); if (r && r.value) return r.value; }catch(err){ /* fall through to localStorage */ }
      }
      try{ return localStorage.getItem(LS_KEY); }catch(err){ return null; }
    }
    function serializeCreature(c){
      return { name:c.name, element:c.element, color:c.color, size:c.size, stage:c.stage, species:c.species,
        hp:c.hp, maxHp:c.maxHp, atk:c.atk, veggieEaten:c.veggieEaten, meatEaten:c.meatEaten,
        bond:c.bond, skillUnlocked:c.skillUnlocked, level:c.level, exp:c.exp,
        skills:c.skills, skillLearnIndex:c.skillLearnIndex,
        iv:c.iv, trait:c.trait, mutant:c.mutant, personality:c.personality, affinity:c.affinity };
    }
    async function saveGame(){
      try{
        const data = { inv, energy, party: party.map(serializeCreature), activeIndex,
          storageBox: storageBox.map(serializeCreature),
          fishingUpgraded, miningUpgraded, woodcuttingUpgraded, fertilizerCharges, dayCount,
          sprinklerBuilt, greenhouseBuilt, autoFeederBuilt,
          npcFriendship: { rowan: npc.friendship, maya: npc2.friendship },
          plots: plots.map(p=>({state:p.state, timer:p.timer, maxTimer:p.maxTimer, soil:p.soil, crop:p.crop})) };
        const ok = await storageSet('eden-save', JSON.stringify(data));
        if (ok){
          sfx.save(); tut.saved = true;
          updateEVA("💾 บันทึกเกมเรียบร้อยแล้ว!");
          document.getElementById('save-status').innerText = "บันทึกล่าสุด: " + new Date().toLocaleTimeString();
        } else {
          updateEVA("บันทึกเกมไม่สำเร็จ เบราว์เซอร์นี้อาจปิดกั้นการจัดเก็บข้อมูล (ลองเปิดโหมดปกติ ไม่ใช่ Incognito)");
        }
      }catch(err){ console.error(err); updateEVA("บันทึกเกมไม่สำเร็จ ลองใหม่อีกครั้ง"); }
    }
    let hasSaveData = false;
    async function loadGame(){
      try{
        const raw = await storageGet('eden-save');
        if (raw){
          const data = JSON.parse(raw);
          hasSaveData = true;
          inv = Object.assign({coin:20,seeds:5,veggie:0,meat:0,chili:0,crystal:0,wood:0,ore:0,fish:0,eggs:[]}, data.inv);
          energy = typeof data.energy === 'number' ? data.energy : maxEnergy;
          fishingUpgraded = !!data.fishingUpgraded;
          miningUpgraded = !!data.miningUpgraded;
          woodcuttingUpgraded = !!data.woodcuttingUpgraded;
          fertilizerCharges = data.fertilizerCharges || 0;
          dayCount = data.dayCount || 1;
          lastSeasonIdx = seasonIdx();
          currentFestival = activeFestival();
          festivalStartCount = fishCount;
          sprinklerBuilt = !!data.sprinklerBuilt;
          greenhouseBuilt = !!data.greenhouseBuilt;
          autoFeederBuilt = !!data.autoFeederBuilt;
          if (data.npcFriendship){
            npc.friendship = data.npcFriendship.rowan || 0;
            npc2.friendship = data.npcFriendship.maya || 0;
          }
          if (data.plots && Array.isArray(data.plots)){
            data.plots.forEach((sp,i)=>{ if (plots[i]) Object.assign(plots[i], { state:sp.state||0, timer:sp.timer||0, maxTimer:sp.maxTimer||180, soil:sp.soil||0, crop:sp.crop||null }); });
          }
          party = data.party.map((c,i)=> makeCreature(c.name, c.element, c.color, 80 - i*20, 240, c));
          activeIndex = Math.min(data.activeIndex||0, party.length-1);
          storageBox = Array.isArray(data.storageBox) ? data.storageBox.map(c => makeCreature(c.name, c.element, c.color, -999, -999, c)) : [];
          updateEVA("โหลดข้อมูลที่บันทึกไว้เรียบร้อย! ยินดีต้อนรับกลับสู่ Eden");
          document.getElementById('save-status').innerText = "โหลดเซฟล่าสุดแล้ว";
        } else {
          updateEVA("ยังไม่มีเซฟเก่า เริ่มเกมใหม่ได้เลย! ลองเดินไปปลูกพืชหรือกด P เพื่อบันทึก");
        }
      }catch(err){
        updateEVA("ยังไม่มีเซฟเก่า เริ่มเกมใหม่ได้เลย! ลองเดินไปปลูกพืชหรือกด P เพื่อบันทึก");
      }
    }
    document.getElementById('save-btn').addEventListener('click', saveGame);

    // ---------- Update ----------
    function update(){
      frameCount++;
      if (storyActive || starterActive || dialogueOpen || shopOpen || craftOpen || storageOpen || skillLearnOpen){ pressedOnce = {}; updateUI(); return; }
      if (battleActive){ updateBattle(); pressedOnce = {}; updateUI(); return; }
      const c = active();

      dayTimer++;
      if (dayTimer >= DAY_LENGTH){
        dayTimer = 0; dayCount++;
        if (currentFestival) endFestival(currentFestival);
        currentFestival = activeFestival();
        if (currentFestival) startFestival(currentFestival);
        const si = seasonIdx();
        if (si !== lastSeasonIdx){
          lastSeasonIdx = si;
          mapBanner = { text: `${seasonIcon()} ฤดู${seasonName()}มาถึงแล้ว`, sub: si===1?"อากาศร้อน เหมาะกับการปลูกพริกไฟ":si===3?"ฤดูหนาว ปลูกพืชไม่ได้ถ้าไม่มีโรงเรือน":"พืชผลเติบโตได้ตามปกติ", timer:150 };
          updateEVA(`${seasonIcon()} ฤดูกาลเปลี่ยนเป็น "${seasonName()}" แล้ว! การปลูกพืชและสภาพอากาศจะเปลี่ยนไปตามฤดูนี้`);
        }
      }
      weatherTimer++;
      if (weatherTimer >= WEATHER_INTERVAL){
        weatherTimer = 0;
        const nw = pickWeather();
        if (nw !== weather){
          weather = nw;
          updateEVA(weather==='rain' ? "🌧️ ฝนเริ่มตก พืชจะเติบโตเร็วขึ้น!" : weather==='storm' ? "⛈️ พายุมาแล้ว! เดินช้าลงชั่วคราว" : "☀️ ท้องฟ้าแจ่มใสอีกครั้ง");
        }
      }
      if (weather !== 'clear'){
        const rspd = weather==='storm' ? 14 : 8;
        for (const d of rainDrops){
          d.y += rspd; d.x -= rspd*0.15;
          if (d.y > canvas.height){ d.y = -10; d.x = Math.random()*canvas.width+60; }
          if (d.x < -10) d.x = canvas.width+10;
        }
      }

      const moveMul = (currentMap==='Farm' && weather==='storm') ? 0.7 : 1;
      let moved = false;
      let fx = 0, fy = 0;
      if (keys.w && player.y > 0){ player.y -= player.speed*moveMul; fy = -1; moved=true; }
      if (keys.s && player.y < canvas.height-player.size){ player.y += player.speed*moveMul; fy = 1; moved=true; }
      if (keys.a && player.x > 0){ player.x -= player.speed*moveMul; fx = -1; moved=true; }
      if (keys.d && player.x < canvas.width-player.size){ player.x += player.speed*moveMul; fx = 1; moved=true; }
      if (moved) player.facing = {x:fx, y:fy};
      player.moving = moved;
      if (moved) tut.moved = true;

      if (currentMap === "Farm"){
        if (player.x > canvas.width-30) switchMap("Dungeon");
        else if (player.x < 10) switchMap("Cave");
        else if (player.y < 10) switchMap("Snow");
        for (const nObj of [npc, npc2]){
          const target = scheduledPos(nObj);
          nObj.x += (target.x - nObj.x) * 0.01;
          nObj.y += (target.y - nObj.y) * 0.01;
        }
      } else if (currentMap === "Dungeon"){
        if (player.x < 10) switchMap("Farm");
        else if (player.x > canvas.width-30) switchMap("Ruins");
      } else if (currentMap === "Cave"){
        if (player.x < 10) switchMap("Farm");
        else if (player.x > canvas.width-30) switchMap("Volcano");
      } else if (currentMap === "Ruins"){
        if (player.x < 10) switchMap("Dungeon");
      } else if (currentMap === "Volcano"){
        if (player.x < 10) switchMap("Cave");
      } else if (currentMap === "Snow"){
        if (player.y > canvas.height-player.size-5) switchMap("Farm");
      }

      if (currentMap === "Farm"){
        for (let p of plots){
          if (p.state === 1){
            let growRate = (weather==='rain'?2:1) * (isNight()?0.5:1);
            if (sprinklerBuilt) growRate = Math.max(growRate, 2) * (isNight() && !greenhouseBuilt ? 0.5 : 1);
            if (greenhouseBuilt) growRate = growRate * (isNight() ? 2 : 1); // greenhouse cancels the night penalty
            growRate *= SOIL_SPEED[p.soil];
            p.timer -= growRate;
            if (p.timer<=0){ p.state=2; spawnBurst(p.x+18,p.y+18, p.crop==='chili' ? '#ff8a50' : '#ffe082',8,2,26,3);}
          }
          if (keys[' '] && interactCooldown<=0){
            if (player.x<p.x+p.size && player.x+player.size>p.x && player.y<p.y+p.size && player.y+player.size>p.y){
              if (p.state===0 && inv.seeds>0){
                const crop = seasonCrop();
                if (!crop){ updateEVA("❄️ ตอนนี้เป็นฤดูหนาว ดินแข็งเกินกว่าจะปลูกได้ — ต้องมีโรงเรือนถึงจะปลูกได้ตลอดปี"); continue; }
                if (!spendEnergy(3)) continue;
                const useFert = fertilizerCharges > 0;
                p.crop = crop;
                p.state = 1;
                p.maxTimer = useFert ? 90 : 180;
                p.timer = p.maxTimer; inv.seeds--; interactCooldown=30;
                if (useFert) fertilizerCharges--;
                spawnBurst(p.x+18,p.y+18,'#8d6e63',6,1.5,18,3);
                sfx.plant(); tut.planted = true;
                const cropLabel = crop==='chili' ? 'พริกไฟ (ตามฤดูร้อน)' : 'ผัก';
                updateEVA(useFert ? `ใช้ปุ๋ยเร่งโต! ${cropLabel}จะโตเร็วขึ้นเท่าตัว` : `ปลูก${cropLabel}แล้ว รอให้เติบโตสักพักนะ`);
              } else if (p.state===2){
                if (!spendEnergy(2)) continue;
                const cropType = p.crop || 'veggie';
                let qty = 1;
                if (p.soil>=2) qty++;
                else if (p.soil===1 && Math.random()<0.35) qty++;
                if (seasonIdx()===2) qty++; // fall harvest bonus
                inv[cropType] += qty; inv.seeds++;
                p.state=0; p.crop=null; interactCooldown=30;
                spawnBurst(p.x+18,p.y+18, cropType==='chili' ? '#ff5722' : '#4CAF50',14,3,32,4);
                sfx.harvest(); tut.harvested = true; harvestCount++;
                gainExp(active(), 3);
                const cropLabel = cropType==='chili' ? 'พริกไฟ' : 'ผัก';
                updateEVA(`เก็บเกี่ยว${cropLabel}ได้ ${qty}! ลองกดปุ่ม [1] เพื่อป้อนให้สัตว์เลี้ยงสิ`);
              }
            }
          }
          // compost: press X while standing on a plot to raise its soil quality using wood
          if (pressedOnce.x && p.state===0 && player.x<p.x+p.size && player.x+player.size>p.x && player.y<p.y+p.size && player.y+player.size>p.y){
            if (p.soil>=2){ updateEVA(`${SOIL_NAMES[p.soil]}อยู่แล้ว ไม่สามารถปรับปรุงเพิ่มได้อีก`); }
            else if (inv.wood < 3){ updateEVA("ต้องใช้ไม้ 3 ท่อนในการหมักปุ๋ยปรับปรุงดิน"); }
            else { inv.wood -= 3; p.soil++; spawnBurst(p.x+18,p.y+18,'#795548',10,2,28,3); sfx.plant(); updateEVA(`🌱 ปรับปรุงดินเป็น "${SOIL_NAMES[p.soil]}"! พืชจะโตเร็วขึ้นและให้ผลผลิตมากขึ้น`); }
          }
        }
        // nest breeding trigger
        if (pressedOnce.n){
          if (Math.hypot(player.x-nest.x, player.y-nest.y) < 50) tryBreed();
          else updateEVA("ต้องยืนใกล้รังตรงกลางฟาร์มถึงจะผสมพันธุ์ได้");
        }
      } else if (pressedOnce.n){
        updateEVA("ผสมพันธุ์ได้เฉพาะที่รังในฟาร์มเท่านั้น");
      }

      if (interactCooldown>0) interactCooldown--;
      if (feedCooldown>0) feedCooldown--;
      if (cookCooldown>0) cookCooldown--;
      if (breedCooldown>0) breedCooldown--;
      if (c.skillCooldown>0) c.skillCooldown--;

      energyRegenTimer++;
      if (energyRegenTimer >= 240){
        energyRegenTimer = 0;
        if (energy < maxEnergy) energy = Math.min(maxEnergy, energy+1);
      }
      if (fishCooldown>0) fishCooldown--;
      for (const t of trees) if (t.chopped>0) t.chopped--;
      for (const o of oreNodes) if (o.mined>0) o.mined--;

      if (autoFeederBuilt){
        autoFeederTimer++;
        if (autoFeederTimer >= 900){ // periodic auto-feed while a supply of veggies is stocked
          autoFeederTimer = 0;
          if (inv.veggie>0 && c.hp < c.maxHp){
            inv.veggie--; c.veggieEaten++; c.hp=Math.min(c.maxHp,c.hp+20); c.bond=Math.min(100,c.bond+1*traitBondMult(c.trait)*personalityBondMult(c.personality));
            spawnText(c.x,c.y-24,"+20 HP (Auto)","#8BC34A"); spawnBurst(c.x,c.y,'#8BC34A',6,1.5,20,3);
            checkEvolution(c);
          }
        }
      }
      if (keys['1'] && feedCooldown<=0 && inv.veggie>0 && energy>=1){
        inv.veggie--; c.veggieEaten++; c.hp=Math.min(c.maxHp,c.hp+20); c.bond=Math.min(100,c.bond+2*traitBondMult(c.trait)*personalityBondMult(c.personality)); energy=Math.max(0,energy-1);
        feedCooldown=30; spawnText(c.x,c.y-24,"+20 HP","#8BC34A"); spawnBurst(c.x,c.y,'#8BC34A',8,2,24,3);
        sfx.feed(); tut.fedVeggie = true;
        checkEvolution(c);
      }
      if (keys['2'] && feedCooldown<=0 && inv.meat>0 && energy>=1){
        inv.meat--; c.meatEaten++; c.atk+=2; c.bond=Math.min(100,c.bond+2*traitBondMult(c.trait)*personalityBondMult(c.personality)); energy=Math.max(0,energy-1);
        feedCooldown=30; spawnText(c.x,c.y-24,"+2 ATK","#ff8a65"); spawnBurst(c.x,c.y,'#ff8a65',8,2,24,3);
        sfx.feed(); tut.fedMeat = true;
        checkEvolution(c);
      }
      if (pressedOnce.c) cook();
      if (pressedOnce.e) useSkill();
      if (pressedOnce.q && party.length>1){
        activeIndex = (activeIndex+1) % party.length;
        const nc = active();
        nc.x = player.x - 30; nc.y = player.y;
        updateEVA(`สลับไปใช้ ${nc.name} เป็นตัวหลักแล้ว`);
      }
      if (pressedOnce.p) saveGame();
      if (pressedOnce.t){
        if (currentMap === "Farm" && Math.hypot(player.x-npc.x, player.y-npc.y) < npc.range) talkToNPC();
        else if (currentMap === "Farm" && Math.hypot(player.x-npc2.x, player.y-npc2.y) < npc2.range) talkToMaya();
        else updateEVA("ต้องเข้าไปใกล้ผู้เฒ่าโรวันหรือมายาที่ฟาร์มก่อนถึงจะคุยได้");
      }
      if (pressedOnce.b) openShop();
      if (pressedOnce.f) fish();
      if (pressedOnce.g) chopTree();
      if (pressedOnce.m) mineOre();
      if (pressedOnce.r) openCraft();
      if (pressedOnce.v){
        if (currentMap === "Farm" && currentFestival && currentFestival.key === 'tournament'){
          if (Math.hypot(player.x-arena.x, player.y-arena.y) < 55) startTournament();
          else updateEVA("ต้องยืนใกล้เวทีประลองทางขวาของฟาร์มก่อนถึงจะเริ่ม Monster Tournament ได้");
        } else {
          updateEVA("เวทีประลองจะเปิดใช้งานเฉพาะวัน Monster Tournament เท่านั้น");
        }
      }

      // active creature follows player; enemies roam and trigger Tactical Grid Battle on contact
      c.target = null;
      if (currentMap !== "Farm" && enemies.length>0){
        let closest=null, minDist=Infinity;
        for (let e of enemies){ const d=Math.hypot(e.x-c.x,e.y-c.y); if(d<minDist){minDist=d;closest=e;} }
        if (closest && minDist < 36){ startBattle(closest); }
        else c.target = closest;
      }
      if (c.target){
        const angle = Math.atan2(c.target.y-c.y, c.target.x-c.x);
        c.x+=Math.cos(angle)*c.speed; c.y+=Math.sin(angle)*c.speed; c.facing={x:Math.cos(angle),y:Math.sin(angle)};
        c.napping = false;
      } else {
        const pers = personalityInfo(c.personality);
        const angle = Math.atan2(player.y-c.y, player.x-c.x);
        const dist = Math.hypot(player.x-c.x, player.y-c.y);
        if (pers.style === 'slow'){
          if (c.napTimer > 0){ c.napTimer--; }
          else if (dist < pers.followDist+15 && Math.random()<0.004){ c.napTimer = 90; }
        }
        c.napping = pers.style==='slow' && c.napTimer>0;
        if (dist > pers.followDist && !c.napping){
          if (pers.style === 'bouncy'){
            const wob = Math.sin(frameCount*0.15 + c.bouncePhase) * 0.55;
            const bx = Math.cos(angle+wob), by = Math.sin(angle+wob);
            c.x += bx*c.speed; c.y += by*c.speed; c.facing = {x:bx, y:by};
          } else {
            c.x+=Math.cos(angle)*c.speed; c.y+=Math.sin(angle)*c.speed; c.facing={x:Math.cos(angle),y:Math.sin(angle)};
          }
        }
      }
      if (c.attackCooldown>0) c.attackCooldown--;

      if (!battleActive){
        for (let e of enemies){
          const angle = Math.atan2(player.y-e.y, player.x-e.x);
          const nightMul = isNight() ? 1.15 : 1;
          e.x += Math.cos(angle)*e.speed*nightMul; e.y += Math.sin(angle)*e.speed*nightMul;
          if (e.squish>0) e.squish--;
          if (Math.hypot(player.x-e.x, player.y-e.y) < 30) startBattle(e);
        }
      }

      for (let i=items.length-1;i>=0;i--){
        const item = items[i]; item.bob += 0.15;
        if (Math.hypot(player.x-item.x, player.y-item.y) < 30){
          if (item.type==="Meat"){ inv.meat++; spawnText(item.x,item.y-10,"+1 Meat","#ff8a65"); }
          else if (item.type==="Chili"){ inv.chili++; spawnText(item.x,item.y-10,"+1 Chili","#ff9800"); }
          else if (item.type==="Crystal"){ inv.crystal++; spawnText(item.x,item.y-10,"+1 Crystal","#4fc3f7"); }
          else if (item.type==="Obsidian"){ inv.obsidian++; spawnText(item.x,item.y-10,"+1 Obsidian","#4a148c"); }
          else if (item.type==="Relic"){ inv.relic++; spawnText(item.x,item.y-10,"+1 Relic","#9575cd"); }
          else if (item.type==="Fur"){ inv.fur++; spawnText(item.x,item.y-10,"+1 Fur","#e1f5fe"); }
          else if (item.type==="Egg"){ inv.eggs.push({timer:1800,maxTimer:1800,elementHint:item.elementHint, speciesHint:item.speciesHint, iv:{hp:rand32(),atk:rand32(),spd:rand32()}, trait:randomTrait(), mutant:false}); spawnText(item.x,item.y-10,"+1 Egg","#ffd54f"); }
          sfx.pickup();
          items.splice(i,1);
        }
      }

      // egg incubation
      for (let i=inv.eggs.length-1;i>=0;i--){
        const egg = inv.eggs[i];
        if (egg.timer>0) egg.timer--;
        if (egg.timer<=0 && party.length<MAX_PARTY){
          const species = egg.speciesHint || randomSpecies();
          const spec = speciesInfo(species);
          let baseColor = spec.babyColor;
          if (egg.mutant) baseColor = "#ffd700";
          const hatched = makeCreature(spec.babyName, "Normal", baseColor, player.x-20, player.y+10, {
            iv: egg.iv || { hp:rand32(), atk:rand32(), spd:rand32() },
            trait: egg.trait || randomTrait(),
            mutant: !!egg.mutant,
            species
          });
          party.push(hatched);
          spawnBurst(player.x,player.y, species==="TRex"?'#ff6f00':(egg.mutant?'#ffd700':'#ffd54f'), species==="TRex"?44:(egg.mutant?36:20),3,35,4);
          sfx.hatch();
          const traitInfo = TRAITS[hatched.trait];
          if (species === "TRex"){
            shake(8,20);
            updateEVA(`🦖🔥 เสียงคำรามดังกึกก้อง! ไข่ลับที่เจ้าผสมพันธุ์ไว้ฟักออกมาเป็น ${hatched.name} — สัตว์ในตำนานที่หาตัวจับยาก! (Trait ${traitInfo.icon} ${traitInfo.name})`);
          } else {
            updateEVA(egg.mutant
              ? `✨🐣 ไข่กลายพันธุ์ฟักออกมาแล้ว! ${hatched.name} มีค่าสถานะสมบูรณ์แบบและ Trait ${traitInfo.icon} ${traitInfo.name}!`
              : `🐣 ไข่ฟักออกมาแล้ว! ${hatched.name} เข้าร่วมปาร์ตี้ พร้อม Trait ${traitInfo.icon} ${traitInfo.name} (${traitInfo.desc})`);
          }
          inv.eggs.splice(i,1);
        }
      }

      for (let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        p.x+=p.vx; p.y+=p.vy; p.vx*=0.96; p.vy*=0.96; p.life--;
        if (p.life<=0) particles.splice(i,1);
      }

      if (shakeTime>0) shakeTime--;
      if (transitionAlpha>0) transitionAlpha -= 0.04;
      if (mapBanner.timer>0) mapBanner.timer--;
      if (flashAlpha>0) flashAlpha -= 0.05;

      // ambience updates
      if (currentMap === "Farm"){
        for (const cl of clouds){ cl.x += cl.speed; if (cl.x - cl.w > canvas.width) cl.x = -cl.w; }
        for (const f of fireflies){ f.phase += 0.02; }
        if (player.moving && frameCount % 8 === 0){
          particles.push({x:player.x+player.size/2,y:player.y+player.size,vx:(Math.random()-0.5)*0.4,vy:-0.3,life:22,maxLife:22,color:"rgba(255,255,255,0.5)",size:3});
        }
      } else if (currentMap === "Cave" || currentMap === "Volcano"){
        for (const em of emberMotes){
          em.y -= em.speed; em.x += Math.sin(frameCount*0.02+em.phase)*0.3;
          if (em.y < -10){ em.y = 480+Math.random()*40; em.x = Math.random()*640; }
        }
      } else if (currentMap === "Dungeon"){
        for (const fg of fogMotes){ fg.x += fg.speed; if (fg.x - fg.r > canvas.width) fg.x = -fg.r; }
      } else if (currentMap === "Snow"){
        for (const s of snowMotes){ s.y += s.speed; if (s.y > 480){ s.y = -10; s.x = Math.random()*640; } }
      } else if (currentMap === "Ruins"){
        for (const r of runeMotes){ r.phase += 0.015; }
      }

      pressedOnce = {};
      updateUI();
      updateTutorial();
      updateSideQuests();
    }

    // ---------- UI ----------
    function updateUI(){
      const c = active();
      document.getElementById('ui-coin').innerText = inv.coin;
      document.getElementById('ui-seeds').innerText = inv.seeds;
      document.getElementById('ui-veggie').innerText = inv.veggie;
      document.getElementById('ui-meat').innerText = inv.meat;
      document.getElementById('ui-chili').innerText = inv.chili;
      document.getElementById('ui-crystal').innerText = inv.crystal;
      document.getElementById('ui-wood').innerText = inv.wood;
      document.getElementById('ui-ore').innerText = inv.ore;
      document.getElementById('ui-fish').innerText = inv.fish;
      document.getElementById('ui-berries').innerText = AFFINITY_KEYS.reduce((sum,k)=>sum+(inv[BERRIES[k].key]||0),0);
      document.getElementById('ui-energy').innerText = Math.round(energy)+"/"+maxEnergy;
      document.getElementById('ui-energybar').style.width = (energy/maxEnergy*100)+"%";

      document.getElementById('ui-beastName').innerText = c.name;
      document.getElementById('ui-beastName').style.color = c.color;
      document.getElementById('ui-stage').innerText = "Stage "+c.stage;
      document.getElementById('ui-blevel').innerText = c.level;
      document.getElementById('ui-bexp').innerText = Math.floor(c.exp)+"/"+expNeeded(c.level)+" EXP";
      document.getElementById('ui-bexpbar').style.width = Math.min(100, c.exp/expNeeded(c.level)*100)+"%";
      document.getElementById('ui-bhp').innerText = Math.max(0,Math.round(c.hp));
      document.getElementById('ui-bhpbar').style.width = Math.max(0,(c.hp/c.maxHp*100))+"%";
      document.getElementById('ui-batk').innerText = c.atk;
      document.getElementById('ui-bond').innerText = Math.round(c.bond)+"/100";
      document.getElementById('ui-bondbar').style.width = c.bond+"%";
      document.getElementById('ui-bveggie').innerText = c.veggieEaten;
      document.getElementById('ui-bmeat').innerText = c.meatEaten;
      const tInfo = TRAITS[c.trait] || TRAITS.hardy;
      document.getElementById('ui-btrait').innerText = `${tInfo.icon} ${tInfo.name}`;
      document.getElementById('ui-btrait').title = tInfo.desc;
      document.getElementById('ui-bmutant').innerText = c.mutant ? "🌟 กลายพันธุ์" : "";
      document.getElementById('ui-bmutant').style.color = "#ffd700";
      document.getElementById('ui-belement').innerText = `${elementIcon(c.element)} ${elementName(c.element)}`;
      const pInfo = personalityInfo(c.personality);
      const pEl = document.getElementById('ui-bpersonality');
      pEl.innerText = `${pInfo.icon} ${pInfo.name}`;
      pEl.title = pInfo.desc;
      document.getElementById('ui-biv').innerText = c.iv ? `IV  HP ${c.iv.hp}/31 · ATK ${c.iv.atk}/31 · SPD ${c.iv.spd}/31` : "";
      if (c.affinity && c.stage===0){
        const parts = AFFINITY_KEYS.filter(k=>c.affinity[k]>0).map(k=>`${elementIcon(k)}${c.affinity[k]}`);
        document.getElementById('ui-baffinity').innerText = parts.length ? `Affinity: ${parts.join(' ')}` : "Affinity: ยังไม่ได้ป้อนผลไม้ธาตุ";
      } else {
        document.getElementById('ui-baffinity').innerText = "";
      }

      document.getElementById('ui-skillstate').innerText = c.skillUnlocked ? (c.skillCooldown>0 ? "⏳ 1/1 ชาร์จ" : "✅ 1/1 พร้อมใช้") : "🔒 0/1";
      document.getElementById('ui-skillbar').style.width = c.skillUnlocked ? (100 - c.skillCooldown/300*100)+"%" : "0%";

      const phase = dayPhase();
      const phaseIcon = phase==='night' ? '🌙' : phase==='dusk' ? '🌆' : phase==='dawn' ? '🌅' : '☀️';
      const phaseLabel = phase==='night' ? 'กลางคืน' : phase==='dusk' ? 'พลบค่ำ' : phase==='dawn' ? 'รุ่งอรุณ' : 'กลางวัน';
      document.getElementById('hud-daynight').innerText = phaseIcon;
      document.getElementById('hud-day').innerText = 'Day '+dayCount+' · '+phaseLabel;
      const weatherIcon = weather==='rain' ? '🌧️' : weather==='storm' ? '⛈️' : '🌤️';
      const weatherLabel = weather==='rain' ? 'ฝนตก' : weather==='storm' ? 'พายุ' : 'แจ่มใส';
      document.getElementById('hud-weather').innerText = weatherIcon;
      document.getElementById('hud-weathertext').innerText = weatherLabel;
      document.getElementById('hud-season').innerText = seasonIcon();
      document.getElementById('hud-seasontext').innerText = seasonName();
      const festWrap = document.getElementById('hud-festival-wrap');
      if (currentFestival){
        festWrap.style.display = '';
        document.getElementById('hud-festival-icon').innerText = currentFestival.icon;
        document.getElementById('hud-festival-text').innerText = currentFestival.name;
      } else {
        festWrap.style.display = 'none';
      }

      document.getElementById('ui-eggcount').innerText = inv.eggs.length;
      const eggEl = document.getElementById('ui-eggtimer');
      if (inv.eggs.length===0) eggEl.innerText = "ไม่มีไข่ในครอบครอง";
      else {
        const soon = inv.eggs.reduce((a,b)=> a.timer<b.timer?a:b);
        eggEl.innerText = "ใกล้ฟักที่สุด: " + Math.ceil(soon.timer/60) + " วิ" + (soon.mutant ? " ✨ (กลายพันธุ์!)" : "");
      }

      const partyEl = document.getElementById('ui-party');
      partyEl.innerHTML = "";
      party.forEach((cr,i)=>{
        const div = document.createElement('div');
        div.className = "partyItem" + (i===activeIndex ? " active":"");
        const hpPct = Math.max(0, Math.round(cr.hp/cr.maxHp*100));
        const role = roleForCreature(cr);
        const tInfo = TRAITS[cr.trait] || TRAITS.hardy;
        const pInfo = personalityInfo(cr.personality);
        div.innerHTML = `<span class="dot" style="background:${cr.color}"></span>
          <span style="flex:1;">${elementIcon(cr.element)} ${ROLE_ICONS[role]} ${cr.mutant?'🌟':''}${cr.name} <span style="opacity:.65;" title="${tInfo.desc}">${tInfo.icon} Lv.${cr.stage}</span> <span style="opacity:.65;" title="${pInfo.desc}">${pInfo.icon}</span>
          <div class="barTrack" style="height:4px;margin-top:2px;"><div class="barFill" style="width:${hpPct}%; background:linear-gradient(90deg,#66bb6a,#a5d6a7);"></div></div>
          </span>`;
        partyEl.appendChild(div);
      });
    }

