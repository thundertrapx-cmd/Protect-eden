    // ---------- Shop (Economy) ----------
    let shopOpen = false;
    const shopOverlay = document.getElementById('shopOverlay');
    const buyItems = [
      { id:'seeds5', name:'🌱 เมล็ดพันธุ์ x5', price:10, sub:'ปลูกได้ตามฤดูกาล: ผัก(ใบไม้ผลิ/ใบไม้ร่วง) หรือพริกไฟ(ร้อน) — หนาวปลูกไม่ได้ถ้าไม่มีโรงเรือน', buy:()=>{ inv.seeds+=5; } },
      { id:'energyBar', name:'🍪 บาร์พลังงาน', price:15, sub:'ฟื้นพลังงาน +30 ทันที', buy:()=>{ energy=Math.min(maxEnergy,energy+30); } },
      { id:'fireBerry', name:'🍓 Fire Berry', price:12, sub:'ป้อนให้สัตว์เลี้ยง: +10 Affinity 🔥ไฟ มีผลต่อทิศทางวิวัฒนาการ', buy:()=>{ inv.fireBerry+=1; } },
      { id:'waterBerry', name:'🫐 Water Berry', price:12, sub:'ป้อนให้สัตว์เลี้ยง: +10 Affinity 💧น้ำ มีผลต่อทิศทางวิวัฒนาการ', buy:()=>{ inv.waterBerry+=1; } },
      { id:'earthBerry', name:'🌰 Earth Berry', price:12, sub:'ป้อนให้สัตว์เลี้ยง: +10 Affinity 🌍ดิน มีผลต่อทิศทางวิวัฒนาการ', buy:()=>{ inv.earthBerry+=1; } },
      { id:'leafBerry', name:'🍏 Leaf Berry', price:12, sub:'ป้อนให้สัตว์เลี้ยง: +10 Affinity 🌿ใบไม้ มีผลต่อทิศทางวิวัฒนาการ', buy:()=>{ inv.leafBerry+=1; } },
      { id:'electricBerry', name:'⚡ Electric Berry', price:12, sub:'ป้อนให้สัตว์เลี้ยง: +10 Affinity ⚡ไฟฟ้า มีผลต่อทิศทางวิวัฒนาการ', buy:()=>{ inv.electricBerry+=1; } }
    ];
    const sellPrices = { veggie:2, meat:3, chili:4, crystal:8, wood:3, ore:6, fish:5, obsidian:10, relic:15, fur:7 };
    const sellLabels = { veggie:'🥦 ผัก', meat:'🍖 เนื้อ', chili:'🌶️ พริกไฟ', crystal:'💎 คริสตัล', wood:'🪵 ไม้', ore:'🪨 แร่', fish:'🐟 ปลา', obsidian:'🖤 ออบซิเดียน', relic:'🏺 โบราณวัตถุ', fur:'🦊 ขนสัตว์' };
    function openShop(){ shopOpen = true; renderShop(); shopOverlay.classList.add('open'); }
    function closeShop(){ shopOpen = false; shopOverlay.classList.remove('open'); }
    function renderShop(){
      document.getElementById('shop-coin').textContent = inv.coin;
      const buyEl = document.getElementById('shopBuyList');
      buyEl.innerHTML = '';
      for (const item of buyItems){
        const row = document.createElement('div');
        row.className = 'shopRow';
        row.innerHTML = `<div class="shopInfo"><div class="shopName">${item.name}</div><div class="shopSub">${item.sub} · 🪙${item.price}</div></div>
          <button ${inv.coin<item.price?'disabled':''}>ซื้อ</button>`;
        row.querySelector('button').addEventListener('click', ()=>{
          if (inv.coin < item.price) return;
          inv.coin -= item.price; item.buy(); sfx.pickup();
          updateEVA(`ซื้อ ${item.name} เรียบร้อย!`);
          renderShop(); updateUI();
        });
        buyEl.appendChild(row);
      }
      const sellEl = document.getElementById('shopSellList');
      sellEl.innerHTML = '';
      for (const key in sellPrices){
        const owned = inv[key] || 0;
        const row = document.createElement('div');
        row.className = 'shopRow';
        row.innerHTML = `<div class="shopInfo"><div class="shopName">${sellLabels[key]}</div><div class="shopSub">มี ${owned} ชิ้น · ได้ 🪙${sellPrices[key]}/ชิ้น</div></div>
          <button ${owned<1?'disabled':''}>ขาย 1</button>`;
        row.querySelector('button').addEventListener('click', ()=>{
          if ((inv[key]||0) < 1) return;
          inv[key] -= 1; inv.coin += sellPrices[key]; sfx.pickup();
          updateEVA(`ขาย ${sellLabels[key]} ได้ 🪙${sellPrices[key]}`);
          renderShop(); updateUI();
        });
        sellEl.appendChild(row);
      }
    }
    document.getElementById('shopToggle').addEventListener('click', openShop);
    document.getElementById('closeShopBtn').addEventListener('click', closeShop);
    shopOverlay.addEventListener('click', e=>{ if (e.target === shopOverlay) closeShop(); });

    // ---------- Story (Intro) ----------
    let storyActive = false;
    const storySlides = [
      { icon:"🌫️", text:"สายลมพัดผ่านฟาร์มร้างที่ปกคลุมด้วยหมอกสีเขียว... เจ้าลืมตาตื่นขึ้นกลางแปลงดินที่ไม่คุ้นเคย โดยจำอะไรก่อนหน้านี้ไม่ได้เลย" },
      { icon:"🤖", text:"\"ตื่นแล้วสินะ\" เสียงหนึ่งดังขึ้นในหัวของเจ้า — \"ข้าคือ EVA ระบบสนับสนุนที่ถูกส่งมาพร้อมเจ้า ดูเหมือนเราจะตกลงมาที่ดินแดนที่เรียกว่า Eden\"" },
      { icon:"🌾", text:"Eden เคยเป็นฟาร์มอันอุดมสมบูรณ์ ก่อนที่สิ่งมีชีวิตประหลาดจะยึดครองป่าและถ้ำโดยรอบ ผู้คนหายไปเกือบหมด เหลือเพียงผู้เฒ่าคนหนึ่งที่ยังคงเฝ้าดูแลผืนดินนี้" },
      { icon:"🏚️", text:"\"ถ้าเจ้าอยากรู้ความจริง เจ้าต้องช่วยฟื้นฟูฟาร์มนี้ขึ้นมาใหม่\" เสียงแหบพร่าดังมาจากกระท่อมเก่าไม่ไกลนัก... ผู้เฒ่าโรวันกำลังรอเจ้าอยู่" }
    ];
    let storyIndex = 0;
    const storyScreenEl = document.getElementById('storyScreen');
    const storyTextEl = document.getElementById('storyText');
    const storyIconEl = document.getElementById('storyIcon');
    const storyDotsEl = document.getElementById('storyDots');
    function renderStory(){
      const s = storySlides[storyIndex];
      storyIconEl.textContent = s.icon;
      storyTextEl.textContent = s.text;
      storyDotsEl.innerHTML = storySlides.map((_,i)=> `<span class="${i===storyIndex?'on':''}"></span>`).join('');
      document.getElementById('storyNext').textContent = storyIndex === storySlides.length-1 ? "เริ่มการเดินทาง ▶" : "ถัดไป ▶";
    }
    function openStory(){
      storyActive = true; storyIndex = 0; renderStory();
      storyScreenEl.classList.add('open');
    }
    function closeStory(){
      storyActive = false;
      storyScreenEl.classList.remove('open');
      if (!hasSaveData){
        starterActive = true;
        renderStarterGrid();
        document.getElementById('starterScreen').classList.add('open');
      } else {
        updateEVA("ยินดีต้อนรับกลับสู่ Eden! ลองเดินสำรวจฟาร์มด้วย WASD ดูก่อนนะ");
      }
    }
    document.getElementById('storyNext').addEventListener('click', ()=>{
      sfx.pickup();
      if (storyIndex < storySlides.length-1){ storyIndex++; renderStory(); } else { closeStory(); }
    });
    document.getElementById('storySkip').addEventListener('click', closeStory);

    // ---------- NPC dialogue ----------
    let dialogueOpen = false;
    const dialogueOverlayEl = document.getElementById('dialogueOverlay');
    const npcTextEl = document.getElementById('npcText');
    const npcNameEl = document.getElementById('npcName');
    let dialogueLines = [], dialogueIndex = 0;
    let activeDialogueNpc = null;
    function friendshipHearts(npcObj){ return Math.floor((npcObj.friendship||0)/20); }
    function renderNpcFriend(npcObj){
      const hearts = friendshipHearts(npcObj);
      document.getElementById('npcFriend').textContent = 'ความสนิทสนม: ' + '❤️'.repeat(hearts) + '🤍'.repeat(5-hearts);
    }
    const GIFT_ITEMS = [
      {key:'veggie', label:'🥕 ผัก'}, {key:'meat', label:'🍖 เนื้อ'}, {key:'chili', label:'🌶️ พริกไฟ'},
      {key:'fish', label:'🐟 ปลา'}, {key:'crystal', label:'💎 คริสตัล'}, {key:'wood', label:'🪵 ไม้'},
      {key:'ore', label:'⛏️ แร่'}, {key:'obsidian', label:'🖤 ออบซิเดียน'}, {key:'relic', label:'🏺 โบราณวัตถุ'}, {key:'fur', label:'🧶 ขนสัตว์'}
    ];
    function renderGiftPanel(){
      const el = document.getElementById('giftPanel');
      el.innerHTML = GIFT_ITEMS.map(g=>`<button ${((inv[g.key]||0)<=0)?'disabled':''} onclick="giveGift('${g.key}')">${g.label} (${inv[g.key]||0})</button>`).join('');
    }
    function giveGift(itemKey){
      const npcObj = activeDialogueNpc;
      if (!npcObj || (inv[itemKey]||0) <= 0) return;
      inv[itemKey]--;
      let delta = 3, reaction = 'เฉยๆ นะ แต่ก็ขอบใจ';
      if ((npcObj.loves||[]).includes(itemKey)){ delta = 15; reaction = 'ชอบมากๆ เลย! ขอบใจนะ'; sfx.chime(); }
      else if ((npcObj.likes||[]).includes(itemKey)){ delta = 8; reaction = 'โอ้ ชอบนะเนี่ย ขอบใจ'; sfx.pickup(); }
      else if ((npcObj.dislikes||[]).includes(itemKey)){ delta = -5; reaction = 'อืม...ไม่ค่อยถูกใจเท่าไหร่ แต่ก็ขอบใจที่คิดถึงนะ'; }
      npcObj.friendship = Math.max(0, Math.min(100, (npcObj.friendship||0)+delta));
      const msg = `${npcObj.name}: "${reaction}" (${delta>=0?'+':''}${delta} ความสนิทสนม)`;
      dialogueLines = [msg]; dialogueIndex = 0;
      npcTextEl.textContent = msg;
      document.getElementById('npcNextBtn').textContent = "ปิด";
      renderNpcFriend(npcObj);
      renderGiftPanel();
      updateUI();
    }
    function openDialogue(npcObj, lines){
      dialogueOpen = true;
      activeDialogueNpc = npcObj;
      npcNameEl.textContent = npcObj.name;
      dialogueLines = lines; dialogueIndex = 0;
      npcTextEl.textContent = dialogueLines[0];
      document.getElementById('npcNextBtn').textContent = dialogueLines.length>1 ? "ถัดไป ▶" : "ปิด";
      renderNpcFriend(npcObj);
      document.getElementById('giftPanel').classList.remove('open');
      dialogueOverlayEl.classList.add('open');
    }
    function advanceDialogue(){
      dialogueIndex++;
      if (dialogueIndex >= dialogueLines.length){ closeDialogue(); return; }
      npcTextEl.textContent = dialogueLines[dialogueIndex];
      document.getElementById('npcNextBtn').textContent = dialogueIndex === dialogueLines.length-1 ? "ปิด" : "ถัดไป ▶";
    }
    function closeDialogue(){
      dialogueOpen = false;
      dialogueOverlayEl.classList.remove('open');
      document.getElementById('giftPanel').classList.remove('open');
    }
    document.getElementById('npcNextBtn').addEventListener('click', advanceDialogue);
    document.getElementById('npcCloseBtn').addEventListener('click', closeDialogue);
    document.getElementById('npcGiftBtn').addEventListener('click', ()=>{
      const el = document.getElementById('giftPanel');
      el.classList.toggle('open');
      if (el.classList.contains('open')) renderGiftPanel();
    });
    dialogueOverlayEl.addEventListener('click', e=>{ if (e.target===dialogueOverlayEl) closeDialogue(); });

    // ---------- NPCs: daily schedule + friendship ----------
    const npc = { x:110, y:120, size:22, name:"ผู้เฒ่าโรวัน", range:58, friendship:0, lastTalkDay:0,
      loves:['crystal'], likes:['veggie','wood'], dislikes:['fish'],
      schedule:[ {phase:'dawn',x:110,y:120}, {phase:'day',x:110,y:120}, {phase:'dusk',x:150,y:160}, {phase:'night',x:100,y:100} ] };
    const npc2 = { x:70, y:340, size:20, name:"มายา นักสมุนไพร", range:55, friendship:0, lastTalkDay:0,
      loves:['fish'], likes:['chili','veggie'], dislikes:['ore'],
      schedule:[ {phase:'dawn',x:70,y:340}, {phase:'day',x:160,y:420}, {phase:'dusk',x:260,y:100}, {phase:'night',x:70,y:360} ] };
    function scheduledPos(npcObj){
      const phase = dayPhase();
      return npcObj.schedule.find(s=>s.phase===phase) || npcObj.schedule[0];
    }

    function talkToNPC(){
      sfx.chime();
      if (npc.lastTalkDay !== dayCount){ npc.lastTalkDay = dayCount; npc.friendship = Math.min(100, npc.friendship+2); }
      if (!tut.talkedToRowan){
        tut.talkedToRowan = true;
        sideQuestsUnlocked = true;
        openDialogue(npc, [
          "อ้อ...เจ้าตื่นแล้วสินะ ข้าคือผู้เฒ่าโรวัน ผู้เฝ้าดูแลฟาร์มเอเดนแห่งนี้มาหลายปี",
          "ที่นี่เคยอุดมสมบูรณ์ ก่อนสัตว์ประหลาดจะยึดครองป่าและถ้ำรอบข้าง จนผู้คนหนีหายไปเกือบหมด",
          "ถ้าเจ้าช่วยฟื้นฟูฟาร์ม ดูแลสัตว์เลี้ยง และกล้าเผชิญหน้ากับสิ่งเหล่านั้น บางทีเราอาจพลิกฟื้นเอเดนได้อีกครั้ง",
          "ข้าปักหมุดภารกิจเสริมไว้ให้แล้ว ลองดูที่กระดาน Side Quest ด้านล่างได้เลย"
        ]);
        renderSideQuestList();
        return;
      }
      if (tutorialIndex >= tutorialSteps.length){
        const flavor = [
          "ฟาร์มนี้กลับมามีชีวิตชีวาอีกครั้งเพราะเจ้าเลยนะ",
          "สัตว์เลี้ยงของเจ้าดูมีความสุขดี ดูแลมันต่อไปนะ",
          "ยังมีภารกิจเสริมเหลืออยู่ ลองสำรวจดูได้เรื่อยๆ"
        ];
        openDialogue(npc, [ flavor[Math.floor(Math.random()*flavor.length)] ]);
        return;
      }
      const step = tutorialSteps[tutorialIndex];
      if (step.id === 'finalReport'){
        tut.talkedToRowanFinal = true;
        openDialogue(npc, [
          "เจ้าทำได้เกินคาด ปลูก เก็บเกี่ยว เลี้ยงดู ต่อสู้ ปรุงอาหาร ผสมพันธุ์ และบันทึกเรื่องราวไว้ครบถ้วน",
          "Main Quest จบลงแล้ว แต่เรื่องราวของเอเดนยังไม่จบ...ยังมีภารกิจเสริมให้ทำอีกมากมาย",
          "ขอบใจที่ช่วยฟื้นฟูบ้านของข้านะ นักเดินทาง"
        ]);
        return;
      }
      openDialogue(npc, [ `ภารกิจตอนนี้คือ "${step.title}"`, step.desc ]);
    }

    function talkToMaya(){
      sfx.chime();
      if (npc2.lastTalkDay !== dayCount){ npc2.lastTalkDay = dayCount; npc2.friendship = Math.min(100, npc2.friendship+2); }
      const lines = [
        "โอ้! เจอกันอีกแล้วนะ วันนี้ปลาที่บ่อกัดเบ็ดดีจัง 🎣",
        "ข้าชื่อมายา เดินทางตามหาสมุนไพรหายากมาหลายเมือง แต่หมู่นี้ปักหลักอยู่แถวฟาร์มนี้แหละ",
        "ถ้าเจอปลาแปลกๆ หรือพริกไฟระหว่างผจญภัย เอามาแลกเปลี่ยนความรู้กับข้าได้นะ",
        "ลองปรุงอาหารรสจัดๆ ดูสิ ใส่พริกไฟเยอะๆ อร่อยกว่าเดิมเยอะเลย!",
        "ฟาร์มนี้อบอุ่นดีนะ อยู่ๆ ไปข้าก็เริ่มไม่อยากย้ายไปไหนแล้ว"
      ];
      const idx = Math.floor(Math.random()*lines.length);
      openDialogue(npc2, [ lines[idx] ]);
    }

    // ---------- Main Quest chain (also drives the tutorial banner) ----------
    const tut = { moved:false, planted:false, harvested:false, fedVeggie:false, fedMeat:false,
      enteredDungeon:false, defeated:false, cooked:false, skilled:false, bred:false, saved:false,
      talkedToRowan:false, talkedToRowanFinal:false };
    let tutorialIndex = 0, tutorialDismissed = false;
    const tutorialSteps = [
      { id:'wake', title:"ตื่นจากภวังค์", desc:"ใช้ W A S D เพื่อเดินสำรวจฟาร์ม", done:()=> tut.moved },
      { id:'plant', title:"หว่านความหวัง", desc:"เดินไปที่แปลงดินสีน้ำตาลแล้วกด SPACE เพื่อปลูกเมล็ด", done:()=> tut.planted },
      { id:'harvest', title:"ผลแรกของฟาร์ม", desc:"รอพืชโตเต็มที่แล้วกด SPACE อีกครั้งเพื่อเก็บเกี่ยว", done:()=> tut.harvested },
      { id:'meet', title:"พบผู้เฒ่าโรวัน", desc:"เดินเข้าใกล้ผู้เฒ่าโรวันแล้วกด T เพื่อพูดคุย", done:()=> tut.talkedToRowan },
      { id:'feed', title:"สายสัมพันธ์แรก", desc:"กด 1 ป้อนผัก หรือ 2 ป้อนเนื้อให้สัตว์เลี้ยง", done:()=> tut.fedVeggie || tut.fedMeat },
      { id:'venture', title:"ก้าวออกจากเขตปลอดภัย", desc:"เดินไปขอบขวาเข้า Forest Dungeon หรือขอบซ้ายเข้า Crystal Cave", done:()=> tut.enteredDungeon },
      { id:'defeat', title:"ปราบสิ่งมีชีวิตแปลกปลอม", desc:"เดินเข้าใกล้ศัตรูเพื่อเริ่ม Tactical Battle แล้วเอาชนะศัตรูสักตัว", done:()=> tut.defeated },
      { id:'cook', title:"มื้ออาหารแห่งสายใย", desc:"กลับฟาร์มแล้วกด C เพื่อทำอาหารเมื่อมีวัตถุดิบพอ", done:()=> tut.cooked },
      { id:'skill', title:"พลังที่หลับใหล", desc:"เมื่อปลดล็อกสกิลแล้ว กด E เพื่อใช้สกิลพิเศษ", done:()=> tut.skilled },
      { id:'breed', title:"จุดกำเนิดใหม่", desc:"มีสัตว์เลี้ยง 2 ตัว Bond ≥80 ไปที่รังกลางฟาร์มแล้วกด N", done:()=> tut.bred },
      { id:'save', title:"จารึกตำนาน", desc:"อย่าลืมกด P เพื่อบันทึกความคืบหน้า!", done:()=> tut.saved },
      { id:'finalReport', title:"รายงานผลต่อผู้เฒ่า", desc:"กลับไปคุยกับผู้เฒ่าโรวันอีกครั้งเพื่อรายงานความคืบหน้า (กด T)", done:()=> tut.talkedToRowanFinal }
    ];
    const tutorialBarEl = document.getElementById('tutorialBar');
    const tutorialTextEl = document.getElementById('tutorialText');
    const tutorialProgEl = document.getElementById('tutorialProgress');
    document.getElementById('tutorialClose').addEventListener('click', ()=>{
      tutorialDismissed = true;
      tutorialBarEl.style.display = 'none';
    });
    function renderMainQuestList(){
      const el = document.getElementById('mainQuestList');
      el.innerHTML = tutorialSteps.map((s,i)=>{
        const state = i<tutorialIndex ? 'done' : (i===tutorialIndex ? '' : 'locked');
        const icon = i<tutorialIndex ? '✅' : (i===tutorialIndex ? '▶️' : '🔒');
        return `<div class="questItem ${state}"><div class="qTitle">${icon} ${s.title}</div><div class="qDesc">${s.desc}</div></div>`;
      }).join('');
    }
    function updateTutorialUI(){
      renderMainQuestList();
      if (tutorialDismissed) return;
      if (tutorialIndex >= tutorialSteps.length){
        tutorialProgEl.textContent = "MAIN QUEST COMPLETE";
        tutorialTextEl.textContent = "🎉 Main Quest เสร็จสมบูรณ์! ลองทำภารกิจเสริมที่เหลือให้ครบดู";
        tutorialBarEl.classList.add('done');
        setTimeout(()=>{ tutorialBarEl.style.display='none'; }, 6000);
        return;
      }
      tutorialProgEl.textContent = "MAIN QUEST " + (tutorialIndex+1) + "/" + tutorialSteps.length;
      tutorialTextEl.textContent = tutorialSteps[tutorialIndex].title + " — " + tutorialSteps[tutorialIndex].desc;
    }
    function updateTutorial(){
      if (tutorialIndex >= tutorialSteps.length) return;
      if (tutorialSteps[tutorialIndex].done()){
        sfx.chime();
        tutorialIndex++;
        updateTutorialUI();
      }
    }
    updateTutorialUI();

    // ---------- Side Quests ----------
    let sideQuestsUnlocked = false;
    let harvestCount = 0, defeatCount = 0, cookCount = 0;
    const sideQuests = [
      { id:'harvest5', title:"นักเก็บเกี่ยวมือใหม่", desc:"เก็บเกี่ยวผลผลิต 5 ครั้ง", done:false,
        check:()=> harvestCount>=5, reward:()=>{ inv.seeds+=3; updateEVA("🔖 ภารกิจเสริมสำเร็จ! ได้รับเมล็ดพันธุ์ 3 เมล็ด"); } },
      { id:'defeat3', title:"นักล่าสัตว์ประหลาด", desc:"กำจัดศัตรู 3 ตัว", done:false,
        check:()=> defeatCount>=3, reward:()=>{ const c=active(); c.bond=Math.min(100,c.bond+10); updateEVA("🔖 ภารกิจเสริมสำเร็จ! สายสัมพันธ์กับสัตว์เลี้ยงเพิ่มขึ้น"); } },
      { id:'cook3', title:"เชฟประจำฟาร์ม", desc:"ทำอาหารสำเร็จ 3 ครั้ง", done:false,
        check:()=> cookCount>=3, reward:()=>{ inv.crystal+=1; updateEVA("🔖 ภารกิจเสริมสำเร็จ! ได้รับคริสตัล 1 ก้อน"); } },
      { id:'bond100', title:"เพื่อนแท้ตลอดกาล", desc:"ทำให้สัตว์เลี้ยงตัวใดตัวหนึ่งมี Bond ครบ 100", done:false,
        check:()=> party.some(c=>c.bond>=100), reward:()=>{ spawnStars(active().x,active().y,20); updateEVA("🔖 ภารกิจเสริมสำเร็จ! สายสัมพันธ์ถึงขีดสุดแล้ว"); } },
      { id:'fish3', title:"ชาวประมงมือใหม่", desc:"ตกปลาให้ได้ 3 ตัว", done:false,
        check:()=> fishCount>=3, reward:()=>{ inv.coin+=10; updateEVA("🔖 ภารกิจเสริมสำเร็จ! ได้รับ 10 เหรียญ"); } },
      { id:'mine3', title:"นักขุดมือใหม่", desc:"ขุดแร่ในถ้ำให้ได้ 3 ก้อน", done:false,
        check:()=> mineCount>=3, reward:()=>{ inv.coin+=10; updateEVA("🔖 ภารกิจเสริมสำเร็จ! ได้รับ 10 เหรียญ"); } }
    ];
    function renderSideQuestList(){
      const el = document.getElementById('sideQuestList');
      if (!sideQuestsUnlocked){ el.innerHTML = "คุยกับผู้เฒ่าโรวันเพื่อปลดล็อกภารกิจเสริม"; return; }
      el.innerHTML = sideQuests.map(q=> `<div class="questItem ${q.done?'done':''}"><div class="qTitle">${q.done?'✅':'🔸'} ${q.title}</div><div class="qDesc">${q.desc}</div></div>`).join('');
    }
    function updateSideQuests(){
      if (!sideQuestsUnlocked) return;
      let changed = false;
      for (const q of sideQuests){
        if (!q.done && q.check()){ q.done = true; sfx.chime(); q.reward(); changed = true; }
      }
      if (changed) renderSideQuestList();
    }

