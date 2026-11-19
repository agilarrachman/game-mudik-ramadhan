// input.js — Penanganan Input Tunggal yang Aman (Pointer Events & Keyboard)
// Spesifikasi: PRD-Menara-Kue.md v2.0 (Audit Bebas Glitch)

(function(global) {
  'use strict';

  let lastActionTime = 0;
  const DEBOUNCE_MS = 200;

  function onActionTriggered(source, evt) {
    // 1. Cek apakah input sedang dikunci oleh GameEngine (STATE_LOCK atau INPUT_LOCK)
    if (global.GameEngine && global.GameEngine.isInputLocked && global.GameEngine.isInputLocked()) {
      return;
    }

    const now = performance.now();
    if (now - lastActionTime < DEBOUNCE_MS) {
      return; // Cegah duplikasi
    }
    lastActionTime = now;

    if (global.GameEngine && global.GameEngine.handleInput) {
      global.GameEngine.handleInput(source, evt ? evt.type : 'manual');
    }
  }

  function initInput(canvas) {
    // 1. Jalur Tunggal Pointer Events (Mouse, Touch, Stylus)
    // Hindari percampuran touchstart + click sintetis
    window.addEventListener('pointerdown', (e) => {
      // Hanya terima primary pointer
      if (!e.isPrimary) return;
      // Abaikan jika mengenai elemen tombol UI interaktif
      if (e.target.closest('.interactive')) return;

      // Hanya tombol kiri mouse / sentuhan utama
      if (e.button !== undefined && e.button !== 0) return;

      onActionTriggered(e.pointerType || 'pointer', e);
    }, { passive: true });

    // 2. Keyboard (Spasi dan Enter)
    window.addEventListener('keydown', (e) => {
      // Abaikan jika fokus pada input form
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;

      // Wajib: Abaikan keydown berulang (tahan tombol) agar tidak langsung menjatuhkan kue berikutnya
      if (e.repeat) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onActionTriggered('keyboard', e);
      }
    });
  }

  global.InputManager = {
    initInput
  };

})(window);
