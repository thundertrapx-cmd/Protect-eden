    function gameLoop(){ update(); draw(); requestAnimationFrame(gameLoop); }

    (async () => {
      await loadGame();
      gameLoop();
      setInterval(saveGame, 20000);
    })();
