// ui.js — Manajemen Layar, HUD, Tombol Fullscreen, Suara, dan localStorage
// Spesifikasi tunggal: PRD-Menara-Kue.md v2.0

(function(global) {
  'use strict';

  let highscore = 0;
  let isSoundOn = true;
  let isPaused = false;
  let perfectTimeout = null;

  // DOM Elements
  const hud = document.getElementById('hud');
  const hudScore = document.getElementById('hud-score');
  const hudHighScore = document.getElementById('hud-highscore');
  const hudCombo = document.getElementById('hud-combo');
  const perfectPopup = document.getElementById('perfect-popup');

  const screenMenu = document.getElementById('screen-menu');
  const screenGameOver = document.getElementById('screen-game-over');
  const screenPause = document.getElementById('screen-pause');

  const goScore = document.getElementById('go-score');
  const goHighScore = document.getElementById('go-highscore');
  const badgeNewRecord = document.getElementById('badge-new-record');

  const btnPlay = document.getElementById('btn-play');
  const btnRestart = document.getElementById('btn-restart');
  const btnToMenu = document.getElementById('btn-to-menu');
  const btnResume = document.getElementById('btn-resume');

  const btnSound = document.getElementById('btn-sound');
  const iconSoundOn = document.getElementById('icon-sound-on');
  const iconSoundOff = document.getElementById('icon-sound-off');

  const btnPause = document.getElementById('btn-pause');

  const btnFullscreen = document.getElementById('btn-fullscreen');
  const iconFsEnter = document.getElementById('icon-fs-enter');
  const iconFsExit = document.getElementById('icon-fs-exit');

  // Inisialisasi High Score
  function loadHighScore() {
    try {
      const val = localStorage.getItem(CONFIG.STORAGE_KEY);
      highscore = val ? parseInt(val, 10) || 0 : 0;
    } catch (e) {
      highscore = 0;
    }
    if (hudHighScore) hudHighScore.textContent = highscore;
    if (goHighScore) goHighScore.textContent = highscore;
  }

  function saveHighScore(newScore) {
    if (newScore > highscore) {
      highscore = newScore;
      try {
        localStorage.setItem(CONFIG.STORAGE_KEY, highscore.toString());
      } catch (e) {
        // localStorage tidak tersedia
      }
      if (hudHighScore) hudHighScore.textContent = highscore;
      if (goHighScore) goHighScore.textContent = highscore;
      return true; // Rekor baru
    }
    return false;
  }

  function initUI() {
    loadHighScore();
    setupFullscreen();
    setupSound();
    setupButtons();
  }

  // =========================================================
  // FULLSCREEN API (FR-14)
  // =========================================================
  function isFullscreenSupported() {
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    );
  }

  function isFullscreenActive() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  function toggleFullscreen() {
    if (!isFullscreenSupported()) return;

    if (!isFullscreenActive()) {
      const docEl = document.documentElement;
      const req = docEl.requestFullscreen ||
                  docEl.webkitRequestFullscreen ||
                  docEl.mozRequestFullScreen ||
                  docEl.msRequestFullscreen;
      if (req) {
        req.call(docEl).catch(err => {
          console.warn('Gagal masuk fullscreen:', err);
        });
      }
    } else {
      const exit = document.exitFullscreen ||
                   document.webkitExitFullscreen ||
                   document.mozCancelFullScreen ||
                   document.msExitFullscreen;
      if (exit) {
        exit.call(document).catch(err => {
          console.warn('Gagal keluar fullscreen:', err);
        });
      }
    }
  }

  function updateFullscreenIcons() {
    const active = isFullscreenActive();
    if (iconFsEnter && iconFsExit) {
      if (active) {
        iconFsEnter.classList.add('hidden');
        iconFsExit.classList.remove('hidden');
      } else {
        iconFsEnter.classList.remove('hidden');
        iconFsExit.classList.add('hidden');
      }
    }
  }

  function setupFullscreen() {
    if (!isFullscreenSupported()) {
      if (btnFullscreen) btnFullscreen.classList.add('fullscreen-unsupported');
      return;
    }

    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullscreen();
      });
    }

    // Tombol F untuk toggle fullscreen
    window.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
    });

    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
      document.addEventListener(evt, updateFullscreenIcons);
    });
  }

  // =========================================================
  // SUARA
  // =========================================================
  function setupSound() {
    if (!btnSound) return;
    btnSound.addEventListener('click', (e) => {
      e.stopPropagation();
      isSoundOn = !isSoundOn;
      if (iconSoundOn && iconSoundOff) {
        if (isSoundOn) {
          iconSoundOn.classList.remove('hidden');
          iconSoundOff.classList.add('hidden');
        } else {
          iconSoundOn.classList.add('hidden');
          iconSoundOff.classList.remove('hidden');
        }
      }
    });
  }

  // =========================================================
  // TOMBOL AKSI & NAVIGASI
  // =========================================================
  function setupButtons() {
    if (btnPlay) {
      btnPlay.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      btnPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (global.GameEngine && global.GameEngine.startGame) {
          global.GameEngine.startGame();
        }
      });
    }

    if (btnRestart) {
      btnRestart.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      btnRestart.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (global.GameEngine && global.GameEngine.restartGame) {
          global.GameEngine.restartGame();
        }
      });
    }

    if (btnToMenu) {
      btnToMenu.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      btnToMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (global.GameEngine && global.GameEngine.toMainMenu) {
          global.GameEngine.toMainMenu();
        }
      });
    }

    if (btnPause) {
      btnPause.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      btnPause.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (global.GameEngine && global.GameEngine.togglePause) {
          global.GameEngine.togglePause();
        }
      });
    }

    if (btnResume) {
      btnResume.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      btnResume.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (global.GameEngine && global.GameEngine.togglePause) {
          global.GameEngine.togglePause();
        }
      });
    }
  }

  // =========================================================
  // DISPLAY LAYAR & HUD
  // =========================================================
  function showMenu() {
    if (screenMenu) screenMenu.classList.remove('hidden');
    if (hud) hud.classList.add('hidden');
    if (screenGameOver) screenGameOver.classList.remove('visible');
    if (screenPause) screenPause.classList.remove('visible');
    loadHighScore();
  }

  function showGameplay() {
    if (screenMenu) screenMenu.classList.add('hidden');
    if (hud) hud.classList.remove('hidden');
    if (screenGameOver) screenGameOver.classList.remove('visible');
    if (screenPause) screenPause.classList.remove('visible');
    updateScore(0, 0);
  }

  function showGameOver(finalScore, isNewRecord, reasonText) {
    if (screenGameOver) {
      if (goScore) goScore.textContent = finalScore;
      if (goHighScore) goHighScore.textContent = highscore;
      if (badgeNewRecord) {
        if (isNewRecord) badgeNewRecord.classList.remove('hidden');
        else badgeNewRecord.classList.add('hidden');
      }
      let reasonEl = document.getElementById('go-reason');
      if (!reasonEl) {
        reasonEl = document.createElement('div');
        reasonEl.id = 'go-reason';
        reasonEl.style.cssText = 'color:#6B4E3D; font-weight:700; font-size:0.9rem; margin-top:4px;';
        const card = screenGameOver.querySelector('.game-over-card');
        const title = screenGameOver.querySelector('.game-over-title');
        if (card && title) {
          card.insertBefore(reasonEl, title.nextSibling);
        }
      }
      if (reasonEl) {
        reasonEl.textContent = reasonText || 'Kue meleset dari tumpukan';
      }
      screenGameOver.classList.add('visible');
    }
  }

  function setPauseVisible(visible) {
    isPaused = visible;
    if (screenPause) {
      if (visible) screenPause.classList.add('visible');
      else screenPause.classList.remove('visible');
    }
  }

  function updateScore(score, combo) {
    if (hudScore) hudScore.textContent = score;
    if (hudCombo) {
      if (combo >= 2) {
        hudCombo.textContent = `Kombo x${combo}`;
        hudCombo.classList.add('visible');
      } else {
        hudCombo.classList.remove('visible');
      }
    }
  }

  function triggerPerfectPopup() {
    if (!perfectPopup) return;
    if (perfectTimeout) clearTimeout(perfectTimeout);
    perfectPopup.classList.add('show');
    perfectTimeout = setTimeout(() => {
      perfectPopup.classList.remove('show');
    }, CONFIG.PERFECT_POPUP_MS);
  }

  global.UIManager = {
    initUI,
    loadHighScore,
    saveHighScore,
    showMenu,
    showGameplay,
    showGameOver,
    setPauseVisible,
    updateScore,
    triggerPerfectPopup,
    isSoundActive: () => isSoundOn,
    getHighScore: () => highscore
  };

})(window);
