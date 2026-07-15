    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');

    // ---------- Fullscreen display scaling ----------
    // The game's internal resolution stays 640x480 (all drawing math relies on that);
    // we only resize how large it is drawn on screen, keeping the 4:3 aspect ratio and
    // letterboxing into whatever space is available so it always fills the viewport nicely.
    function fitCanvasToScreen(){
      const ratio = 4 / 3;
      let w = window.innerWidth;
      let h = w / ratio;
      if (h > window.innerHeight){ h = window.innerHeight; w = h * ratio; }
      canvas.style.width = Math.floor(w) + 'px';
      canvas.style.height = Math.floor(h) + 'px';
    }
    fitCanvasToScreen();
    window.addEventListener('resize', fitCanvasToScreen);
    window.addEventListener('orientationchange', fitCanvasToScreen);

    // ---------- Audio (synthesized SFX, no external assets) ----------
    let audioCtx = null;
    let soundOn = true;
    function ensureAudio(){
      if (!audioCtx){
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch(e){ audioCtx = null; }
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }
    function tone(freq, dur, type, vol, delay){
      if (!soundOn || !audioCtx) return;
      const t0 = audioCtx.currentTime + (delay||0);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol!=null?vol:0.16, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    }
    const sfx = {
      plant: ()=> tone(520,.12,'triangle',.14),
      harvest: ()=> { tone(660,.1,'triangle',.15); tone(880,.12,'triangle',.13,.06); },
      feed: ()=> tone(420,.14,'sine',.16),
      hit: ()=> tone(160,.08,'square',.10),
      enemyDown: ()=> { tone(300,.1,'sawtooth',.14); tone(180,.16,'sawtooth',.11,.08); },
      evolve: ()=> [523,659,784,1046].forEach((f,i)=> tone(f,.28,'triangle',.18,i*0.09)),
      cook: ()=> { tone(440,.1,'sine',.15); tone(660,.12,'sine',.14,.07); tone(880,.14,'sine',.12,.14); },
      skill: ()=> { tone(200,.2,'sawtooth',.16); tone(500,.2,'sawtooth',.13,.05); },
      breed: ()=> [660,880,1100].forEach((f,i)=> tone(f,.22,'sine',.15,i*0.08)),
      hatch: ()=> [400,700,1000].forEach((f,i)=> tone(f,.18,'triangle',.16,i*0.07)),
      save: ()=> { tone(700,.08,'sine',.14); tone(900,.1,'sine',.13,.06); },
      zone: ()=> { tone(300,.15,'sine',.13); tone(450,.15,'sine',.11,.08); },
      chime: ()=> { tone(880,.12,'sine',.14); tone(1180,.14,'sine',.12,.08); },
      pickup: ()=> tone(740,.07,'triangle',.12),
      start: ()=> [392,523,659,784].forEach((f,i)=> tone(f,.22,'triangle',.18,i*0.08))
    };

    // ---------- Title screen / start gate ----------
    let gameStarted = false;
    const titleScreenEl = document.getElementById('titleScreen');
    function startGame(){
      if (gameStarted) return;
      gameStarted = true;
      document.body.classList.add('game-started');
      ensureAudio();
      sfx.start();
      titleScreenEl.style.display = 'none';
      openStory();
    }
    document.getElementById('battleSkill1Btn').addEventListener('click', ()=> battleUseSkill(1));
    document.getElementById('battleSkill2Btn').addEventListener('click', ()=> battleUseSkill(2));
    document.getElementById('battleSkill3Btn').addEventListener('click', ()=> battleUseSkill(3));
    document.getElementById('battleMoveBtn').addEventListener('click', battleEnterMove);
    document.getElementById('battleCancelBtn').addEventListener('click', battleCancelMove);
    document.getElementById('battleConfirmBtn').addEventListener('click', battleConfirmMove);

    document.getElementById('startBtn').addEventListener('click', startGame);
    titleScreenEl.addEventListener('click', startGame);
    canvas.addEventListener('click', ()=> { if (!gameStarted) startGame(); });

    // ---------- Title-menu buttons that must NOT trigger startGame ----------
    document.getElementById('fullscreenToggleMenu').addEventListener('click', e=>{ e.stopPropagation(); toggleFullscreen(); });
    document.getElementById('helpBtnMenu').addEventListener('click', e=>{ e.stopPropagation(); document.getElementById('helpOverlay').classList.add('open'); });

    // ---------- Fullscreen toggle ----------
    function toggleFullscreen(){
      if (!document.fullscreenElement){
        (document.documentElement.requestFullscreen && document.documentElement.requestFullscreen())?.catch?.(()=>{});
      } else if (document.exitFullscreen){
        document.exitFullscreen();
      }
    }
    document.getElementById('fullscreenToggle').addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', ()=>{
      const on = !!document.fullscreenElement;
      const label = on ? '⛶ ออกเต็มจอ' : '⛶ เต็มจอ';
      const btn1 = document.getElementById('fullscreenToggle'); if (btn1) btn1.textContent = label;
      const btn2 = document.getElementById('fullscreenToggleMenu'); if (btn2) btn2.textContent = label;
      fitCanvasToScreen();
    });

    // ---------- Quest drawer / controls strip / stats HUD toggles ----------
    // Stats panel (#ui2) and the quest panel share the same top-right dock, so only one
    // may be open at a time — this keeps them from ever being drawn on top of each other.
    const statsToggleBtn = document.getElementById('statsToggle');
    const questToggleBtn = document.getElementById('questToggle');
    const questPanelEl = document.getElementById('questPanel');
    function setStatsOpen(open){
      document.body.classList.toggle('stats-open', open);
      statsToggleBtn.classList.toggle('active', open);
      if (open){ questPanelEl.classList.remove('open'); questToggleBtn.classList.remove('active'); }
    }
    function setQuestOpen(open){
      questPanelEl.classList.toggle('open', open);
      questToggleBtn.classList.toggle('active', open);
      if (open) setStatsOpen(false);
    }
    statsToggleBtn.addEventListener('click', ()=> setStatsOpen(!document.body.classList.contains('stats-open')));
    questToggleBtn.addEventListener('click', ()=> setQuestOpen(!questPanelEl.classList.contains('open')));
    document.getElementById('controlsToggle').addEventListener('click', ()=>{
      document.querySelector('.controls').classList.toggle('open');
    });

    // ---------- Sound / Help toolbar ----------
    const soundBtn = document.getElementById('soundToggle');
    soundBtn.addEventListener('click', ()=>{
      soundOn = !soundOn;
      soundBtn.textContent = soundOn ? '🔊 Sound: On' : '🔇 Sound: Off';
    });
    const helpOverlay = document.getElementById('helpOverlay');
    document.getElementById('helpBtn').addEventListener('click', ()=> helpOverlay.classList.add('open'));
    document.getElementById('closeHelpBtn').addEventListener('click', ()=> helpOverlay.classList.remove('open'));
    helpOverlay.addEventListener('click', e=>{ if (e.target === helpOverlay) helpOverlay.classList.remove('open'); });
    window.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ helpOverlay.classList.remove('open'); closeShop(); closeCraft(); closeStorage(); } });

