    // ---------- Input ----------
    const keys = { w:false, a:false, s:false, d:false, ' ':false, '1':false, '2':false };
    const actionKeys = ['q','c','e','n','p','t','b','f','g','m','r','w','a','s','d','x','v',' '];
    const gameKeys = ['w','a','s','d',' ','1','2','q','c','e','n','p','t','b','f','g','m','r','x','v'];
    let pressedOnce = {};
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (gameKeys.includes(k)) e.preventDefault();
      if (!gameStarted && k === ' ' && !e.repeat) startGame();
      if (keys.hasOwnProperty(k)) keys[k] = true;
      if (actionKeys.includes(k) && !e.repeat) pressedOnce[k] = true;
    });
    window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (gameKeys.includes(k)) e.preventDefault(); if (keys.hasOwnProperty(k)) keys[k] = false; });

    // ---------- World State ----------
    let currentMap = "Farm";
    let frameCount = 0;
    let shakeTime = 0, shakeMag = 0;
    let transitionAlpha = 0;
    let cookCooldown = 0, breedCooldown = 0;

    let inv = { coin: 20, seeds: 5, veggie: 0, meat: 0, chili: 0, crystal: 0, wood: 0, ore: 0, fish: 0, obsidian: 0, relic: 0, fur: 0, eggs: [],
      fireBerry:0, waterBerry:0, earthBerry:0, leafBerry:0, electricBerry:0 };
    let energy = 100, maxEnergy = 100, energyRegenTimer = 0;
    function spendEnergy(amount){
      if (energy < amount){ updateEVA("⚡ พลังงานไม่พอ ลองพักรอให้ฟื้น หรือกินอาหารที่ปรุงเสร็จ"); return false; }
      energy -= amount; return true;
    }

    // ---------- Day/Night cycle ----------
    let dayCount = 1;
    const DAY_LENGTH = 7200; // frames per full day/night cycle (slowed to ~2x for a calmer pace)
    let dayTimer = 0;
    function dayPhase(){
      const t = dayTimer/DAY_LENGTH;
      if (t < 0.05) return 'dawn';
      if (t < 0.45) return 'day';
      if (t < 0.55) return 'dusk';
      return 'night';
    }
    function isNight(){ return dayPhase() === 'night'; }

    // ---------- Seasons ----------
    const SEASON_NAMES = ["ใบไม้ผลิ","ร้อน","ใบไม้ร่วง","หนาว"];
    const SEASON_ICONS = ["🌸","☀️","🍂","❄️"];
    const DAYS_PER_SEASON = 5;
    function seasonIdx(){ return Math.floor((dayCount-1)/DAYS_PER_SEASON) % 4; }
    function seasonName(){ return SEASON_NAMES[seasonIdx()]; }
    function seasonIcon(){ return SEASON_ICONS[seasonIdx()]; }
    // which crop grows from a planted seed depends on the current season
    function seasonCrop(){
      const s = seasonIdx();
      if (s===0) return 'veggie';   // spring: gentle growing season
      if (s===1) return 'chili';    // summer: hot season favors chili
      if (s===2) return 'veggie';   // fall: harvest season, bonus yield
      return greenhouseBuilt ? 'veggie' : null; // winter: soil too cold unless greenhouse built
    }
    let lastSeasonIdx = seasonIdx();

    // ---------- Festivals: Fishing Contest & Monster Tournament ----------
    const FESTIVAL_CYCLE_DAYS = DAYS_PER_SEASON*4; // 20-day repeating calendar
    const FESTIVALS = [
      { key:'fishing',    day:3, icon:'🎣', name:'Fishing Contest',    desc:'ตกปลาให้ได้มากที่สุดภายในวันนี้เพื่อรับรางวัล' },
      { key:'tournament', day:8, icon:'⚔️', name:'Monster Tournament', desc:'ไปที่เวทีประลองใกล้ฟาร์มแล้วกด V เพื่อท้าดวลศัตรูชุดพิเศษ' }
    ];
    function dayOfYear(){ return ((dayCount-1) % FESTIVAL_CYCLE_DAYS) + 1; }
    function activeFestival(){ return FESTIVALS.find(f=>f.day===dayOfYear()) || null; }
    let currentFestival = null;
    let festivalStartCount = 0;
    let tournamentWon = false;
    function startFestival(f){
      tournamentWon = false;
      mapBanner = { text:`${f.icon} ${f.name}`, sub:f.desc, timer:180 };
      sfx.zone();
      if (f.key==='fishing'){
        festivalStartCount = fishCount;
        updateEVA(`🎣 Fishing Contest เริ่มแล้ว! วันนี้ตกปลาให้ได้มากที่สุดที่บ่อน้ำ (กด F) เพื่อรับรางวัลตามจำนวนที่ตกได้`);
      } else if (f.key==='tournament'){
        updateEVA(`⚔️ Monster Tournament เริ่มแล้ว! เดินไปที่เวทีประลองทางขวาของฟาร์มแล้วกด V เพื่อท้าดวลศัตรูชุดพิเศษ`);
      }
    }
    function endFestival(f){
      if (f.key==='fishing'){
        const caught = fishCount - festivalStartCount;
        let reward=0, tier='';
        if (caught>=15){ reward=60; tier='🥇 ทอง'; }
        else if (caught>=8){ reward=35; tier='🥈 เงิน'; }
        else if (caught>=3){ reward=15; tier='🥉 ทองแดง'; }
        if (reward>0){ inv.coin += reward; updateEVA(`🎣 Fishing Contest จบแล้ว! คุณตกปลาได้ ${caught} ตัว ได้รางวัล ${tier} รับ ${reward} เหรียญ`); }
        else updateEVA(`🎣 Fishing Contest จบแล้ว คุณตกปลาได้ ${caught} ตัว ลองใหม่เทศกาลหน้านะ!`);
      } else if (f.key==='tournament'){
        updateEVA(tournamentWon ? `⚔️ Monster Tournament ปิดฉากลงแล้ว ยินดีด้วยกับชัยชนะ!` : `⚔️ Monster Tournament จบแล้วสำหรับปีนี้ พบกันใหม่เทศกาลหน้า`);
      }
    }
    function spawnTournamentWave(){
      const ax = arena.x, ay = arena.y;
      enemies.push({ x:ax-40, y:ay-20, size:26, hp:70, maxHp:70, color:"#c62828", speed:1, squish:0, boss:false, atk:14, tournamentName:'นักสู้ประลอง' });
      enemies.push({ x:ax+40, y:ay-20, size:26, hp:70, maxHp:70, color:"#c62828", speed:1, squish:0, boss:false, atk:14, tournamentName:'นักสู้ประลอง' });
      enemies.push({ x:ax, y:ay+30, size:34, hp:150, maxHp:150, color:"#4a148c", speed:0.8, squish:0, boss:true, atk:25, tournamentName:'แชมป์ประลอง' });
    }
    function startTournament(){
      if (battleActive) return;
      const trigger = enemies.find(e=>e.tournamentName) || (spawnTournamentWave(), enemies[enemies.length-3]);
      startBattle(trigger);
    }

    // ---------- Weather system ----------
    let weather = 'clear'; // clear | rain | storm
    let weatherTimer = 0;
    const WEATHER_INTERVAL = 1800;
    const weatherOptions = [ {type:'clear', weight:55}, {type:'rain', weight:30}, {type:'storm', weight:15} ];
    function pickWeather(){
      const total = weatherOptions.reduce((s,w)=>s+w.weight,0);
      let r = Math.random()*total;
      for (const w of weatherOptions){ if (r < w.weight) return w.type; r -= w.weight; }
      return 'clear';
    }
    let rainDrops = [];
    for (let i=0;i<60;i++) rainDrops.push({x:Math.random()*640, y:Math.random()*480, len:10+Math.random()*8});

    const player = { x: 100, y: 240, size: 24, speed: 4, color: "#4fa3ff", facing:{x:0,y:1}, moving:false };

    const plots = [
      {x: 190, y: 190, size: 36, state: 0, timer: 0, maxTimer: 180, soil: 0, crop: null},
      {x: 236, y: 190, size: 36, state: 0, timer: 0, maxTimer: 180, soil: 0, crop: null},
      {x: 190, y: 236, size: 36, state: 0, timer: 0, maxTimer: 180, soil: 0, crop: null},
      {x: 236, y: 236, size: 36, state: 0, timer: 0, maxTimer: 180, soil: 0, crop: null}
    ];
    // ---------- Farm automation ----------
    let sprinklerBuilt = false, greenhouseBuilt = false, autoFeederBuilt = false;
    let autoFeederTimer = 0;
    const SOIL_NAMES = ["ดินธรรมดา","ดินอุดม","ดินเข้มข้น"];
    const SOIL_SPEED = [1, 1.25, 1.55];
    const nest = { x: 420, y: 330, size: 26 };
    const arena = { x: 480, y: 210, size: 30 };

    let enemies = [];
    let items = [];
    let particles = [];

    // ---------- Tactical Grid Battle state ----------
    let battleActive = false;
    let battle = null;
    const BATTLE_COLS = 8, BATTLE_ROWS = 5, BATTLE_CELL = 60, BATTLE_OX = 80, BATTLE_OY = 100;
    let torches = [ {x:20,y:40}, {x:620,y:40}, {x:20,y:440}, {x:620,y:440} ];
    let grassTufts = [];
    for (let i=0;i<70;i++) grassTufts.push({x:Math.random()*640, y:Math.random()*480, s:1+Math.random()*1.5});

    // ---------- Ambience ----------
    let mapBanner = { text:"", sub:"", timer:0 };
    let flashAlpha = 0;
    let clouds = [];
    for (let i=0;i<4;i++) clouds.push({x:Math.random()*640, y:24+Math.random()*70, w:55+Math.random()*45, speed:0.12+Math.random()*0.15});
    let fireflies = [];
    for (let i=0;i<14;i++) fireflies.push({x:Math.random()*640, y:230+Math.random()*220, phase:Math.random()*Math.PI*2});
    let emberMotes = [];
    for (let i=0;i<24;i++) emberMotes.push({x:Math.random()*640, y:480+Math.random()*60, phase:Math.random()*Math.PI*2, speed:0.3+Math.random()*0.5});
    let fogMotes = [];
    for (let i=0;i<6;i++) fogMotes.push({x:Math.random()*640, y:150+Math.random()*250, r:40+Math.random()*40, speed:0.08+Math.random()*0.1});
    let snowMotes = [];
    for (let i=0;i<28;i++) snowMotes.push({x:Math.random()*640, y:Math.random()*480, r:1.5+Math.random()*2.5, speed:0.4+Math.random()*0.8, drift:Math.random()*Math.PI*2});
    let runeMotes = [];
    for (let i=0;i<10;i++) runeMotes.push({x:Math.random()*640, y:100+Math.random()*300, phase:Math.random()*Math.PI*2, speed:0.15+Math.random()*0.2});
    const flowerSpots = [
      {x:340,y:75,c:'#ff8fab'},{x:400,y:55,c:'#fff176'},{x:150,y:95,c:'#ba68c8'},
      {x:520,y:390,c:'#ff8fab'},{x:560,y:430,c:'#fff176'},{x:300,y:430,c:'#ba68c8'},
      {x:250,y:55,c:'#ff8fab'},{x:470,y:65,c:'#fff176'}
    ];
    const pond = { x:80, y:390, rw:52, rh:24 };
    const trees = [
      { x:550, y:90, size:28, chopped:0, maxCooldown:480 },
      { x:550, y:400, size:28, chopped:0, maxCooldown:480 },
      { x:300, y:90, size:28, chopped:0, maxCooldown:480 }
    ];
    const oreNodes = [
      { x:100, y:400, size:24, mined:0, maxCooldown:480 },
      { x:380, y:420, size:24, mined:0, maxCooldown:480 },
      { x:580, y:400, size:24, mined:0, maxCooldown:480 }
    ];
    let fishCooldown = 0;

    let interactCooldown = 0;
    let feedCooldown = 0;

