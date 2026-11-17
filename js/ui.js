// ui.js — HUD, menu, jeda, game over, checkpoint banner
// Gaya stiker mainan: blok solid, outline gelap, bayangan offset keras.
// Tanpa emoji. Ikon SVG inline.

(function () {
  'use strict';

  // ---- Elemen DOM ----
  const $ = id => document.getElementById(id);
  const el = {
    hud: $('hud'),
    hudSpeed: $('hud-speed'),
    hudDist: $('hud-dist'),
    hudBest: $('hud-best'),
    btnPause: $('btn-pause'),
    btnSound: $('btn-sound'),
    iconOn: $('icon-sound-on'),
    iconOff: $('icon-sound-off'),
    banner: $('checkpoint-banner'),
    panelMenu: $('panel-menu'),
    panelPause: $('panel-pause'),
    panelGO: $('panel-gameover'),
    btnStart: $('btn-start'),
    btnResume: $('btn-resume'),
    btnRestartPause: $('btn-restart-pause'),
    btnRestart: $('btn-restart'),
    goDist: $('go-dist'),
    goBest: $('go-best'),
    goNewRec: $('go-new-record'),
  };

  let bannerTimer = null;

  // ---- Tampilkan / sembunyikan ----
  function show(el) { el && el.classList.remove('hidden'); }
  function hide(el) { el && el.classList.add('hidden'); }

  // ---- State panel ----
  function showMenu() {
    show(el.panelMenu);
    hide(el.panelPause);
    hide(el.panelGO);
    hide(el.hud);
    hide(el.btnPause);
  }

  function showPause() {
    hide(el.panelMenu);
    show(el.panelPause);
    hide(el.panelGO);
  }

  function showGameOver(distKm, bestKm, isNewRecord) {
    hide(el.panelMenu);
    hide(el.panelPause);
    show(el.panelGO);
    hide(el.hud);
    hide(el.btnPause);

    el.goDist.textContent = distKm.toFixed(2) + ' km';
    el.goBest.textContent = bestKm.toFixed(2) + ' km';

    if (isNewRecord) {
      show(el.goNewRec);
      el.goBest.classList.add('new-record');
    } else {
      hide(el.goNewRec);
      el.goBest.classList.remove('new-record');
    }

    // Animasi ulang panel
    el.panelGO.querySelector('.modal-box').style.animation = 'none';
    // Trigger reflow
    void el.panelGO.querySelector('.modal-box').offsetHeight;
    el.panelGO.querySelector('.modal-box').style.animation = '';
  }

  function showPlaying() {
    hide(el.panelMenu);
    hide(el.panelPause);
    hide(el.panelGO);
    show(el.hud);
    show(el.btnPause);
  }

  // ---- Update HUD ----
  function updateHUD(speedKmh, distKm, bestKm) {
    // Update nilai teks, pertahankan unit span
    _setHudValue(el.hudSpeed, Math.round(speedKmh), ' km/j');
    _setHudValue(el.hudDist, distKm.toFixed(2), ' km');
    _setHudValue(el.hudBest, bestKm.toFixed(2), ' km');
  }

  function _setHudValue(block, val, unit) {
    const valEl = block.querySelector('.hud-value');
    const unitEl = block.querySelector('.hud-unit');
    if (!valEl) return;
    // Set text langsung tanpa innerHTML agar tidak ada XSS
    valEl.firstChild.nodeValue = String(val);
    if (unitEl) unitEl.textContent = unit;
  }

  // ---- Banner checkpoint ----
  function showCheckpoint(nama) {
    el.banner.textContent = nama;
    el.banner.classList.add('visible');
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      el.banner.classList.remove('visible');
    }, 2200);
  }

  // ---- Tombol suara ----
  function setSoundIcon(isOn) {
    if (isOn) { show(el.iconOn); hide(el.iconOff); }
    else { hide(el.iconOn); show(el.iconOff); }
  }

  // ---- Pasang event handler tombol ----
  function init(callbacks) {
    // callbacks: { onStart, onResume, onRestart, onPause, onSound }

    el.btnStart.addEventListener('click', () => callbacks.onStart && callbacks.onStart());
    el.btnResume.addEventListener('click', () => callbacks.onResume && callbacks.onResume());
    el.btnRestart.addEventListener('click', () => callbacks.onRestart && callbacks.onRestart());
    el.btnRestartPause.addEventListener('click', () => callbacks.onRestart && callbacks.onRestart());
    el.btnPause.addEventListener('click', () => callbacks.onPause && callbacks.onPause());

    el.btnSound.addEventListener('click', () => {
      if (callbacks.onSound) callbacks.onSound();
    });
  }

  // Ekspor
  window.UI = {
    init,
    showMenu,
    showPause,
    showGameOver,
    showPlaying,
    updateHUD,
    showCheckpoint,
    setSoundIcon,
  };

})();
