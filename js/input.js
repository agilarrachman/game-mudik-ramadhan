// input.js — Keyboard, sentuh, mouse
// touch-action: none, tidak ada zoom dua ketukan, respons < 50 ms.

(function() {
  'use strict';

  // ---- State ----
  const state = {
    left:  false,
    right: false,
    pause: false,
    enter: false,
  };

  // Buffer satu input saat animasi sedang berlangsung
  let bufferedDir = 0;  // -1 kiri, +1 kanan, 0 kosong

  let onShiftCallback  = null;  // dipanggil dengan (dir) = -1 atau +1
  let onPauseCallback  = null;
  let onConfirmCallback = null;

  // Waktu terakhir touch untuk debounce
  let lastTouchTime = 0;
  let touchStartX   = 0;
  let touchStartY   = 0;
  const SWIPE_MIN   = 30;  // px minimum untuk dianggap swipe
  const DEBOUNCE_MS = 80;

  // ---- Keyboard ----
  function onKeyDown(e) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        requestShift(-1);
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        requestShift(1);
        break;
      case 'KeyP':
      case 'Escape':
        e.preventDefault();
        if (onPauseCallback) onPauseCallback();
        break;
      case 'Enter':
      case 'Space':
        e.preventDefault();
        if (onConfirmCallback) onConfirmCallback();
        break;
    }
  }

  // ---- Touch ----
  function onTouchStart(e) {
    if (e.target.closest('button, .modal-box')) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function onTouchEnd(e) {
    if (e.target.closest('button, .modal-box')) return;
    e.preventDefault();
    const now = Date.now();
    if (now - lastTouchTime < DEBOUNCE_MS) return;
    lastTouchTime = now;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.abs(dx) >= SWIPE_MIN) {
      // Swipe horizontal
      requestShift(dx > 0 ? 1 : -1);
      return;
    }

    if (Math.abs(dx) < 10 && Math.abs(dy) < 20) {
      // Tap — kiri atau kanan layar
      const half = window.innerWidth / 2;
      requestShift(touch.clientX < half ? -1 : 1);
    }
  }

  // ---- Mouse ----
  function onMouseClick(e) {
    if (e.target.closest('button, .modal-box, #ui-layer')) return;
    const half = window.innerWidth / 2;
    requestShift(e.clientX < half ? -1 : 1);
  }

  // ---- API ----
  function requestShift(dir) {
    if (onShiftCallback) {
      const consumed = onShiftCallback(dir);
      // consumed = false berarti sedang animasi, buffer input
      if (consumed === false) bufferedDir = dir;
    }
  }

  function flushBuffer() {
    if (bufferedDir !== 0) {
      const dir = bufferedDir;
      bufferedDir = 0;
      if (onShiftCallback) onShiftCallback(dir);
    }
  }

  function init() {
    document.addEventListener('keydown', onKeyDown, { passive: false });

    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
    canvas.addEventListener('click',      onMouseClick);

    // Nonaktifkan zoom dua ketukan di canvas
    canvas.addEventListener('dblclick', e => e.preventDefault());
  }

  function setShiftCallback(fn)  { onShiftCallback   = fn; }
  function setPauseCallback(fn)  { onPauseCallback   = fn; }
  function setConfirmCallback(fn){ onConfirmCallback = fn; }

  window.Input = {
    init,
    setShiftCallback,
    setPauseCallback,
    setConfirmCallback,
    flushBuffer,
  };

})();
