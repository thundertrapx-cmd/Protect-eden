    // ---------- Breeding: IV / Trait / Mutation ----------
    const TRAITS = {
      hardy:  { icon:'💪', name:'Hardy',  desc:'HP สูงสุด +10%' },
      brave:  { icon:'🔥', name:'Brave',  desc:'พลังโจมตี +10%' },
      swift:  { icon:'💨', name:'Swift',  desc:'ความเร็วในสนามรบ +3' },
      gentle: { icon:'💗', name:'Gentle', desc:'ได้ Bond จากการป้อนอาหาร +50%' },
      clever: { icon:'✨', name:'Clever', desc:'ได้ EXP เพิ่ม +20%' }
    };
    const TRAIT_KEYS = Object.keys(TRAITS);
    function randomTrait(){ return TRAIT_KEYS[Math.floor(Math.random()*TRAIT_KEYS.length)]; }
    function rand32(){ return Math.floor(Math.random()*32); }
    function inheritIV(v1,v2){ return Math.random()<0.15 ? rand32() : (Math.random()<0.5?v1:v2); }
    function ivMult(iv){ return 1 + (iv||0)/31*0.12; } // up to +12% from a perfect IV
    function traitMultHp(trait,mutant){ let m=1; if (trait==='hardy') m*=1.10; if (mutant) m*=1.08; return m; }
    function traitMultAtk(trait,mutant){ let m=1; if (trait==='brave') m*=1.10; if (mutant) m*=1.08; return m; }
    function traitSpdBonus(trait){ return trait==='swift' ? 3 : 0; }
    function traitBondMult(trait){ return trait==='gentle' ? 1.5 : 1; }
    function traitExpMult(trait){ return trait==='clever' ? 1.2 : 1; }

    // ---------- Elements: 5-type wheel (ดิน/น้ำ/ไฟ/ใบไม้/ไฟฟ้า) ----------
    const ELEMENT_INFO = {
      Earth:    { icon:'🌍', name:'ดิน' },
      Water:    { icon:'💧', name:'น้ำ' },
      Fire:     { icon:'🔥', name:'ไฟ' },
      Leaf:     { icon:'🌿', name:'ใบไม้' },
      Electric: { icon:'⚡', name:'ไฟฟ้า' },
      Nature:   { icon:'🌿', name:'ใบไม้' }, // player creature's Nature line displays as Leaf
      Chimera:  { icon:'🌀', name:'ลูกผสม' }, // hybrid: no elemental weakness in the wheel
      Neutral:  { icon:'⚪', name:'กลาง' },
      Ice:      { icon:'💧', name:'น้ำแข็ง' }
    };
    function elementIcon(el){ return (ELEMENT_INFO[el]||ELEMENT_INFO.Neutral).icon; }
    function elementName(el){ return (ELEMENT_INFO[el]||ELEMENT_INFO.Neutral).name; }
    // wheel: each element is strong (1.4x) vs the next one, weak (0.75x) vs the previous one
    const ELEMENT_WHEEL = ['Fire','Leaf','Earth','Electric','Water'];
    function elementKey(el){ return el === 'Nature' ? 'Leaf' : (el === 'Ice' ? 'Water' : el); }
    function typeMultiplier(atkElement, defElement){
      const a = elementKey(atkElement), d = elementKey(defElement);
      const ai = ELEMENT_WHEEL.indexOf(a), di = ELEMENT_WHEEL.indexOf(d);
      if (ai<0 || di<0) return 1; // Chimera/Neutral/unknown: no bonus or penalty
      if ((ai+1)%5 === di) return 1.4; // atk's element beats def's element
      if ((di+1)%5 === ai) return 0.75; // atk's element is weak against def's element
      return 1;
    }
    // Crit chance: DPS units land bigger hits more often; 'brave' creatures are natural risk-takers
    function critChance(u){
      let c = 0.10;
      if (u.role === 'DPS') c += 0.08;
      if (u.ref && u.ref.trait === 'brave') c += 0.10;
      return c;
    }

    // ---------- Affinity Berries: food that steers evolution toward an element ----------
    const BERRIES = {
      Fire:     { key:'fireBerry',     icon:'🍓', name:'Fire Berry',     price:12 },
      Water:    { key:'waterBerry',    icon:'🫐', name:'Water Berry',    price:12 },
      Earth:    { key:'earthBerry',    icon:'🌰', name:'Earth Berry',    price:12 },
      Leaf:     { key:'leafBerry',     icon:'🍏', name:'Leaf Berry',     price:12 },
      Electric: { key:'electricBerry', icon:'⚡', name:'Electric Berry', price:12 }
    };
    const AFFINITY_KEYS = ['Fire','Water','Earth','Leaf','Electric'];
    function blankAffinity(){ return { Fire:0, Water:0, Earth:0, Leaf:0, Electric:0 }; }
    function topAffinity(aff){
      if (!aff) return null;
      let best=null, bestV=0;
      for (const k of AFFINITY_KEYS){ if ((aff[k]||0) > bestV){ bestV=aff[k]; best=k; } }
      return bestV>0 ? best : null;
    }
    function feedBerry(el){
      const c = active();
      const b = BERRIES[el];
      if (!b) return;
      if ((inv[b.key]||0) <= 0){ updateEVA(`ไม่มี ${b.icon} ${b.name} ในคลัง ลองซื้อจากร้านค้าดูนะ`); return; }
      if (!spendEnergy(1)) return;
      inv[b.key]--;
      c.affinity = c.affinity || blankAffinity();
      c.affinity[el] = (c.affinity[el]||0) + 10;
      c.bond = Math.min(100, c.bond + 1*traitBondMult(c.trait)*personalityBondMult(c.personality));
      spawnText(c.x,c.y-24, `+10 ${elementIcon(el)} Affinity`, "#ce93d8");
      spawnBurst(c.x,c.y,'#ce93d8',8,2,24,3);
      sfx.feed();
      renderBerryPanel();
      updateUI();
      checkEvolution(c);
    }
    function renderBerryPanel(){
      const el = document.getElementById('berryPanel');
      el.innerHTML = AFFINITY_KEYS.map(k=>{
        const b = BERRIES[k];
        return `<button ${((inv[b.key]||0)<=0)?'disabled':''} onclick="feedBerry('${k}')">${b.icon} ${b.name} (${inv[b.key]||0})</button>`;
      }).join('');
    }
    document.getElementById('berryFeedBtn').addEventListener('click', ()=>{
      const el = document.getElementById('berryPanel');
      el.classList.toggle('open');
      if (el.classList.contains('open')) renderBerryPanel();
    });

    // ---------- Pet Personality: affects movement/follow style & stats ----------
    const PERSONALITIES = {
      playful: { icon:'🤪', name:'ขี้เล่น', desc:'ร่าเริง ชอบวิ่งวนเล่นตอนเดินตาม ความเร็ววิ่งตามสูงกว่าปกติ แต่ HP ต่ำกว่าเล็กน้อย',
        speedMult:1.18, hpMult:0.93, atkMult:1.0, bondMult:1.05, followDist:60, style:'bouncy' },
      clingy:  { icon:'🥰', name:'ขี้อ้อน', desc:'ติดเจ้าของมาก ชอบเดินใกล้ๆ ตลอดเวลา ได้ Bond จากการป้อนอาหาร/เล่นด้วยเร็วกว่ามาก แต่โจมตีเบากว่า',
        speedMult:1.0, hpMult:1.0, atkMult:0.9, bondMult:1.35, followDist:26, style:'close' },
      grumpy:  { icon:'😾', name:'ขี้โมโห', desc:'อารมณ์ร้อน ไม่ค่อยอยากเดินตามใกล้ๆ ได้ Bond ช้ากว่า แต่โจมตีแรงกว่าตัวอื่น',
        speedMult:0.95, hpMult:1.0, atkMult:1.15, bondMult:0.8, followDist:85, style:'far' },
      sleepy:  { icon:'😴', name:'ขี้เซา', desc:'เชื่องช้า เดินตามช้าและแอบงีบหลับเป็นระยะ แต่พลังชีวิตสูงกว่าตัวอื่น',
        speedMult:0.82, hpMult:1.15, atkMult:0.95, bondMult:1.0, followDist:55, style:'slow' }
    };
    const PERSONALITY_KEYS = Object.keys(PERSONALITIES);
    function randomPersonality(){ return PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)]; }
    function personalityInfo(p){ return PERSONALITIES[p] || PERSONALITIES.playful; }
    function personalityMultHp(p){ return personalityInfo(p).hpMult; }
    function personalityMultAtk(p){ return personalityInfo(p).atkMult; }
    function personalitySpeedMult(p){ return personalityInfo(p).speedMult; }
    function personalityBondMult(p){ return personalityInfo(p).bondMult; }

    // ---------- Species: 5 tameable animals (+ original Seedling), all can evolve into any element ----------
    const SPECIES_INFO = {
      Seedling: { icon:'🌱', name:'Seedling', babyName:'Seedling',    babyColor:'#ffeb3b', hpMult:1.00, atkMult:1.00, spdMult:1.00 },
      Wolf:     { icon:'🐺', name:'Wolf',     babyName:'Wolf Pup',    babyColor:'#b0bec5', hpMult:0.95, atkMult:1.15, spdMult:1.15 },
      Turtle:   { icon:'🐢', name:'Turtle',   babyName:'Baby Turtle', babyColor:'#66bb6a', hpMult:1.30, atkMult:0.75, spdMult:0.75 },
      Bear:     { icon:'🐻', name:'Bear',     babyName:'Bear Cub',    babyColor:'#8d6e63', hpMult:1.15, atkMult:1.10, spdMult:0.90 },
      Duck:     { icon:'🦆', name:'Duck',     babyName:'Duckling',    babyColor:'#fff59d', hpMult:0.80, atkMult:0.90, spdMult:1.30 },
      Lion:     { icon:'🦁', name:'Lion',     babyName:'Lion Cub',    babyColor:'#ffb300', hpMult:0.95, atkMult:1.30, spdMult:1.05 },
      TRex:     { icon:'🦖', name:'T-Rex',    babyName:'Rex Hatchling', babyColor:'#7cb342', hpMult:1.20, atkMult:1.45, spdMult:0.95 }
    };
    const SPECIES_KEYS = Object.keys(SPECIES_INFO);
    const SECRET_SPECIES_KEYS = ["TRex"]; // never appear from eggs, loot, or random mutation — earned only via the hidden breeding recipe
    const TAMEABLE_SPECIES_KEYS = SPECIES_KEYS.filter(k=>k!=="Seedling" && !SECRET_SPECIES_KEYS.includes(k));
    function speciesInfo(s){ return SPECIES_INFO[s] || SPECIES_INFO.Seedling; }
    function randomSpecies(){ return TAMEABLE_SPECIES_KEYS[Math.floor(Math.random()*TAMEABLE_SPECIES_KEYS.length)]; }

    // ---------- Starter pet selection (new games only) ----------
    const STARTER_DESC = {
      Wolf:   "ไวและดุดัน เก่งเรื่องบุกตะลุย",
      Turtle: "HP สูงมาก ป้องกันหนึบ แต่ช้า",
      Bear:   "สมดุลรอบด้าน ทนทานทุกด้าน",
      Duck:   "ว่องไวที่สุดในบรรดาทั้งหมด แต่ HP ต่ำ",
      Lion:   "โจมตีแรงที่สุดในบรรดาสัตว์เริ่มต้น"
    };
    let starterActive = false;
    function renderStarterGrid(){
      const grid = document.getElementById('starterGrid');
      if (!grid) return;
      grid.innerHTML = TAMEABLE_SPECIES_KEYS.map(k=>{
        const s = speciesInfo(k);
        return `<div class="starterCard" onclick="chooseStarter('${k}')">
          <div class="icon">${s.icon}</div>
          <div class="sname">${s.name}</div>
          <div class="sdesc">${STARTER_DESC[k]||''}</div>
        </div>`;
      }).join('');
    }
    function chooseStarter(species){
      const spec = speciesInfo(species);
      party = [ makeCreature(spec.babyName, "Normal", spec.babyColor, 80, 240, { species }) ];
      activeIndex = 0;
      starterActive = false;
      document.getElementById('starterScreen').classList.remove('open');
      updateEVA(`ยินดีต้อนรับสู่ Eden! ${spec.icon} ${spec.babyName} จะร่วมผจญภัยไปกับเจ้า ลองเดินสำรวจฟาร์มด้วย WASD ดูก่อนนะ`);
    }

    // ---------- Creatures ----------
    function makeCreature(name, element, color, x, y, overrides={}) {
      const iv = overrides.iv || { hp: rand32(), atk: rand32(), spd: rand32() };
      const trait = overrides.trait || randomTrait();
      const personality = overrides.personality || randomPersonality();
      const mutant = !!overrides.mutant;
      const species = overrides.species || "Seedling";
      const spec = speciesInfo(species);
      const hpM = ivMult(iv.hp) * traitMultHp(trait,mutant) * personalityMultHp(personality) * spec.hpMult;
      const atkM = ivMult(iv.atk) * traitMultAtk(trait,mutant) * personalityMultAtk(personality) * spec.atkMult;
      const maxHp = Math.round(100*hpM);
      const base = {
        x, y, size:20, speed:3.5*personalitySpeedMult(personality)*spec.spdMult, color, name, element, stage:0, species,
        hp:maxHp, maxHp, atk:Math.round(15*atkM),
        veggieEaten:0, meatEaten:0, bond:20,
        level:1, exp:0,
        skillUnlocked:false, skillCooldown:0,
        skills: overrides.skills ? overrides.skills.slice(0,3) : ['strike','guard',null],
        skillLearnIndex: overrides.skillLearnIndex || 0,
        target:null, attackCooldown:0, facing:{x:1,y:0},
        iv, trait, mutant, personality, bouncePhase:Math.random()*Math.PI*2, napTimer:0, napping:false,
        affinity: overrides.affinity || blankAffinity()
      };
      return Object.assign(base, overrides);
    }
    function expNeeded(level){ return 40 + level*30; }
    function gainExp(c, amount){
      if (!c) return;
      c.exp += amount * traitExpMult(c.trait);
      let leveled = false;
      while (c.exp >= expNeeded(c.level)){
        c.exp -= expNeeded(c.level);
        c.level++;
        const spec = speciesInfo(c.species);
        const hpGain = Math.round(12 * ivMult(c.iv.hp) * traitMultHp(c.trait,c.mutant) * personalityMultHp(c.personality) * spec.hpMult);
        const atkGain = Math.round(2 * ivMult(c.iv.atk) * traitMultAtk(c.trait,c.mutant) * personalityMultAtk(c.personality) * spec.atkMult);
        c.maxHp += hpGain; c.hp = Math.min(c.maxHp, c.hp + hpGain); c.atk += atkGain;
        leveled = true;
        if (SKILL_LEARN_LEVELS.includes(c.level)) queueSkillLearn(c);
      }
      if (leveled){
        spawnText(c.x,c.y-30,"LEVEL UP! Lv."+c.level,"#ffe066");
        spawnStars(c.x,c.y,12); sfx.evolve(); shake(4,10);
        updateEVA(`🎉 ${c.name} เลเวลอัพเป็น Lv.${c.level}! พลังแกร่งขึ้น`);
      }
    }
    let party = [ makeCreature("Seedling", "Normal", "#ffeb3b", 80, 240) ];
    let activeIndex = 0;
    const MAX_PARTY = 3;
    function active(){ return party[activeIndex]; }

    // ---------- Helpers ----------
    function spawnBurst(x,y,color,count=10,speed=3,life=30,size=4){
      for(let i=0;i<count;i++){
        const a = Math.random()*Math.PI*2, sp = speed*(0.4+Math.random());
        particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life,maxLife:life,color,size:size*(0.6+Math.random()*0.8)});
      }
    }
    function spawnText(x,y,text,color){ particles.push({x,y,vx:(Math.random()-0.5)*0.5,vy:-1.1,life:45,maxLife:45,color,text}); }
    function spawnStars(x,y,count=14,color='#fff59d'){
      for(let i=0;i<count;i++){
        const a=Math.random()*Math.PI*2, sp=1+Math.random()*3.5;
        particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:55,maxLife:55,color,size:4+Math.random()*4,shape:'star',rot:Math.random()*Math.PI});
      }
    }
    function shake(mag=4,time=8){ shakeMag = mag; shakeTime = time; }
    function updateEVA(msg){ document.getElementById('eva-text').innerText = msg; }
    function shade(hex, percent){
      const num = parseInt(hex.replace("#",""),16);
      let r=(num>>16)+percent, g=(num>>8 & 0x00FF)+percent, b=(num & 0x0000FF)+percent;
      r=Math.min(255,Math.max(0,r)); g=Math.min(255,Math.max(0,g)); b=Math.min(255,Math.max(0,b));
      return "rgb("+r+","+g+","+b+")";
    }

    // ---------- Evolution (5 elemental forms x 6 species, + Chimera hybrid) ----------
    // Base stats per element at each stage, before species/IV/trait/personality multipliers
    const EVO_BASE_STATS = {
      Fire:     { s1:{hp:130,atk:35}, s2:{hp:260,atk:55}, color1:"#FF5722", color2:"#D84315", size1:28, size2:34, skill:"Fireball" },
      Nature:   { s1:{hp:200,atk:20}, s2:{hp:340,atk:32}, color1:"#4CAF50", color2:"#2E7D32", size1:28, size2:34, skill:"Heal Pulse" },
      Earth:    { s1:{hp:240,atk:22}, s2:{hp:420,atk:38}, color1:"#8D6E63", color2:"#5D4037", size1:30, size2:36, skill:"Rock Slide" },
      Water:    { s1:{hp:180,atk:24}, s2:{hp:320,atk:40}, color1:"#29B6F6", color2:"#0277BD", size1:27, size2:33, skill:"Healing Tide" },
      Electric: { s1:{hp:150,atk:30}, s2:{hp:280,atk:50}, color1:"#FFEB3B", color2:"#FBC02D", size1:26, size2:32, skill:"Thunder Strike" },
      Chimera:  { s1:{hp:160,atk:25}, s2:{hp:300,atk:40}, color1:"#AB47BC", color2:"#7B1FA2", size1:26, size2:32, skill:null }
    };
    const ELEMENT_EVO_MSG1 = {
      Fire:"✨ EVOLUTION! วิวัฒนาการเป็น {name} สายโจมตีดุดัน!",
      Nature:"✨ EVOLUTION! วิวัฒนาการเป็น {name} ธาตุพืช แข็งแกร่งขึ้นมาก!",
      Earth:"🌍 EVOLUTION! วิวัฒนาการเป็น {name} แข็งแกร่งดุจหิน!",
      Water:"💧 EVOLUTION! วิวัฒนาการเป็น {name} ปราดเปรียวดุจกระแสน้ำ!",
      Electric:"⚡ EVOLUTION! วิวัฒนาการเป็น {name} ว่องไวดุจสายฟ้า!",
      Chimera:"✨ EVOLUTION! เกิดการผสมธาตุ กลายเป็น {name} ตัวลูกผสมหายาก!"
    };
    const ELEMENT_EVO_MSG2 = {
      Fire:"🔥 EVOLUTION ขั้นสูงสุด! กลายเป็น {name}! ปลดล็อกสกิล Fireball!",
      Nature:"🌳 EVOLUTION ขั้นสูงสุด! กลายเป็น {name}! ปลดล็อกสกิล Heal Pulse!",
      Earth:"🌍 EVOLUTION ขั้นสูงสุด! กลายเป็น {name}! ปลดล็อกสกิล Rock Slide!",
      Water:"💧 EVOLUTION ขั้นสูงสุด! กลายเป็น {name}! ปลดล็อกสกิล Healing Tide!",
      Electric:"⚡ EVOLUTION ขั้นสูงสุด! กลายเป็น {name}! ปลดล็อกสกิล Thunder Strike!",
      Chimera:"✨ EVOLUTION ขั้นสูงสุด! กลายเป็น {name}!"
    };
    // Species-specific stage-1/stage-2 name tables (Seedling keeps its original classic names)
    const SEEDLING_EVO_NAMES = {
      Fire:     { s1:"War Beast",      s2:"Inferno Fiend" },
      Nature:   { s1:"Nature Guardian",s2:"Elder Treant" },
      Earth:    { s1:"Boulder Golem",  s2:"Titan Golem" },
      Water:    { s1:"Tide Serpent",   s2:"Abyssal Serpent" },
      Electric: { s1:"Volt Fox",       s2:"Storm Fox" },
      Chimera:  { s1:"Chimera Beast",  s2:"Chimera Overlord" }
    };
    const ELEMENT_EVO_ADJ1 = { Fire:"Ember", Nature:"Verdant", Earth:"Granite", Water:"Tide", Electric:"Volt", Chimera:"Chimera" };
    const ELEMENT_EVO_ADJ2 = { Fire:"Inferno", Nature:"Elder", Earth:"Titan", Water:"Abyssal", Electric:"Storm", Chimera:"Chimera" };
    function evoName(species, element, stage){
      if (species === "Seedling" || !species) return SEEDLING_EVO_NAMES[element][stage===2?"s2":"s1"];
      const adj = stage===2 ? ELEMENT_EVO_ADJ2[element] : ELEMENT_EVO_ADJ1[element];
      return `${adj} ${speciesInfo(species).name}`;
    }
    function checkEvolution(c){
      const hpM = ivMult(c.iv.hp) * traitMultHp(c.trait,c.mutant) * speciesInfo(c.species).hpMult;
      const atkM = ivMult(c.iv.atk) * traitMultAtk(c.trait,c.mutant) * speciesInfo(c.species).atkMult;
      const mutTint = c.mutant ? "#ffd700" : null;
      if (c.stage === 0){
        const totalFeeds = c.veggieEaten + c.meatEaten + Math.round(((c.affinity&&Object.values(c.affinity).reduce((a,b)=>a+b,0))||0)/10);
        if (totalFeeds < 3) return; // not grown up enough yet
        const topEl = topAffinity(c.affinity); // Fire/Water/Earth/Leaf/Electric from berries, or null if none fed
        let element;
        if (topEl === "Fire" || (!topEl && c.meatEaten>=3 && c.veggieEaten<2)) element = "Fire";
        else if (topEl === "Leaf" || (!topEl && c.veggieEaten>=3 && c.meatEaten<2)) element = "Nature";
        else if (topEl === "Earth") element = "Earth";
        else if (topEl === "Water") element = "Water";
        else if (topEl === "Electric") element = "Electric";
        else element = "Chimera";
        const stats = EVO_BASE_STATS[element];
        const maxHp = Math.round(stats.s1.hp*hpM);
        const name = evoName(c.species, element, 1);
        Object.assign(c,{name, element, color: mutTint||stats.color1, size:stats.size1, stage:1, maxHp, hp:maxHp, atk:Math.round(stats.s1.atk*atkM)});
        fanfare(c, mutTint||stats.color1, ELEMENT_EVO_MSG1[element].replace("{name}",name));
      } else if (c.stage === 1 && c.bond>=60 && (c.veggieEaten+c.meatEaten)>=8){
        const stats = EVO_BASE_STATS[c.element];
        if (!stats) return;
        const maxHp = Math.round(stats.s2.hp*hpM);
        const name = evoName(c.species, c.element, 2);
        Object.assign(c,{name, color: mutTint||stats.color2, size:stats.size2, stage:2, maxHp, hp:Math.min(maxHp,c.hp), atk:Math.round(stats.s2.atk*atkM), skillUnlocked:true});
        fanfare(c, mutTint||stats.color2, ELEMENT_EVO_MSG2[c.element].replace("{name}",name));
      }
    }
    function fanfare(c,color,msg){ spawnBurst(c.x,c.y,color,34,4,55,6); spawnStars(c.x,c.y,16); shake(5,14); flashAlpha=1; sfx.evolve(); updateEVA(msg); }

