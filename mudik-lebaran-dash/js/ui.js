// ui.js — HUD, menu, jeda, game over, chip kota, popup pergantian kota
// Gaya stiker mainan: blok solid, outline gelap, bayangan offset keras.
// Tanpa emoji. Ikon SVG inline.

(function() {
  'use strict';

  // ---- Elemen DOM ----
  const $  = id => document.getElementById(id);
  const el = {
    hud:        $('hud'),
    hudSpeed:   $('hud-speed'),
    hudDist:    $('hud-dist'),
    hudBest:    $('hud-best'),
    hudCityTitle:   $('hud-city-title'),
    hudCityBarFill: $('hud-city-bar-fill'),
    hudCityNext:    $('hud-city-next'),
    btnPause:   $('btn-pause'),
    btnSound:   $('btn-sound'),
    iconOn:     $('icon-sound-on'),
    iconOff:    $('icon-sound-off'),
    cityPopup:      $('city-popup'),
    cityPopupTitle: $('city-popup-title'),
    cityPopupDesc:  $('city-popup-desc'),
    panelMenu:  $('panel-menu'),
    panelPause: $('panel-pause'),
    panelGO:    $('panel-gameover'),
    btnStart:   $('btn-start'),
    btnResume:  $('btn-resume'),
    btnRestartPause: $('btn-restart-pause'),
    btnRestart:      $('btn-restart'),
    goDist:     $('go-dist'),
    goBest:     $('go-best'),
    goNewRec:   $('go-new-record'),
  };

  // ---- Antrean Popup ----
  const popupQueue = [];
  let popupActive = false;
  let popupTimer = null;
  let popupExitTimer = null;

  // ---- Tampilkan / sembunyikan ----
  function show(e) { e && e.classList.remove('hidden'); }
  function hide(e) { e && e.classList.add('hidden'); }

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

  // ---- Update HUD nilai ----
  function updateHUD(speedKmh, distKm, bestKm) {
    _setHudValue(el.hudSpeed, Math.round(speedKmh), ' km/j');
    _setHudValue(el.hudDist,  distKm.toFixed(2), ' km');
    _setHudValue(el.hudBest,  bestKm.toFixed(2), ' km');
  }

  function _setHudValue(block, val, unit) {
    const valEl  = block.querySelector('.hud-value');
    const unitEl = block.querySelector('.hud-unit');
    if (!valEl) return;
    valEl.firstChild.nodeValue = String(val);
    if (unitEl) unitEl.textContent = unit;
  }

  // ---- Update Chip Kota ----
  function updateCityChip(kotaState) {
    if (!kotaState) return;
    // Nama kota
    if (el.hudCityTitle) {
      el.hudCityTitle.textContent = kotaState.nama;
    }
    // Progress bar via transform scaleX
    if (el.hudCityBarFill) {
      el.hudCityBarFill.style.transform = 'scaleX(' + kotaState.progres.toFixed(4) + ')';
    }
    // Teks sisa jarak
    if (el.hudCityNext) {
      if (kotaState.isLast) {
        el.hudCityNext.textContent = 'Sudah sampai di kampung halaman';
      } else {
        el.hudCityNext.textContent = kotaState.sisaKm.toFixed(1) + ' km lagi ke ' + kotaState.namaBerikutnya;
      }
    }
  }

  // ---- Popup Pergantian Kota ----
  function showCityPopup(nama, desc) {
    popupQueue.push({ nama, desc });
    if (!popupActive) _processPopupQueue();
  }

  function _processPopupQueue() {
    if (popupQueue.length === 0) {
      popupActive = false;
      return;
    }
    popupActive = true;
    const item = popupQueue.shift();
    _displayPopup(item.nama, item.desc);
  }

  function _displayPopup(nama, desc) {
    const popup = el.cityPopup;
    if (!popup) return;

    // Set konten
    if (el.cityPopupTitle) el.cityPopupTitle.textContent = nama;
    if (el.cityPopupDesc)  el.cityPopupDesc.textContent  = desc || '';

    // Reset kelas animasi
    popup.classList.remove('city-popup-hidden', 'city-popup-enter', 'city-popup-exit');
    // Trigger reflow
    void popup.offsetHeight;
    // Animasi masuk
    popup.classList.add('city-popup-enter');

    // Bersihkan timer lama
    if (popupTimer) clearTimeout(popupTimer);
    if (popupExitTimer) clearTimeout(popupExitTimer);

    // Tampil 2.5 detik lalu keluar
    popupTimer = setTimeout(() => {
      popup.classList.remove('city-popup-enter');
      popup.classList.add('city-popup-exit');
      popupExitTimer = setTimeout(() => {
        popup.classList.add('city-popup-hidden');
        popup.classList.remove('city-popup-exit');
        _processPopupQueue();
      }, 400); // sesuai durasi animasi exit
    }, 2500);
  }

  function resetPopupQueue() {
    if (popupTimer) clearTimeout(popupTimer);
    if (popupExitTimer) clearTimeout(popupExitTimer);
    popupTimer = null;
    popupExitTimer = null;
    popupQueue.length = 0;
    popupActive = false;
    if (el.cityPopup) {
      el.cityPopup.classList.add('city-popup-hidden');
      el.cityPopup.classList.remove('city-popup-enter', 'city-popup-exit');
    }
  }

  // ---- Tombol suara ----
  function setSoundIcon(isOn) {
    if (isOn) { show(el.iconOn); hide(el.iconOff); }
    else       { hide(el.iconOn); show(el.iconOff); }
  }

  // ---- Pasang event handler tombol ----
  function init(callbacks) {
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
    updateCityChip,
    showCityPopup,
    resetPopupQueue,
    setSoundIcon,
    // Kompatibilitas mundur
    showCheckpoint: (nama) => showCityPopup(nama, ''),
  };

})();
