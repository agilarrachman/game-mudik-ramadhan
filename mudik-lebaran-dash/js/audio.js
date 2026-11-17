// audio.js — Audio prosedural via Web Audio API
// Tanpa berkas audio. Aktif setelah interaksi pertama.

(function() {
  'use strict';

  let ctx = null;
  let masterGain = null;
  let engineOsc  = null;
  let engineGain = null;
  let musicNodes = [];
  let enabled    = true;
  let initialized = false;

  // ---- Inisialisasi konteks audio ----
  function ensureCtx() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(ctx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---- Resume setelah user gesture ----
  function resume() {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!initialized) {
      initialized = true;
      startEngine();
      startMusic();
    }
  }

  // =========================================================
  // DENGUNG MESIN
  // =========================================================
  function startEngine() {
    if (!ctx) return;
    engineOsc  = ctx.createOscillator();
    engineGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = CONFIG.ENGINE_FREQ_MIN;
    filter.type      = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value   = 2.0;
    engineGain.gain.value = 0.06 * CONFIG.SFX_VOLUME;

    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(masterGain);
    engineOsc.start();
  }

  // Update frekuensi mesin sesuai kecepatan (panggil tiap frame)
  function updateEngine(speed) {
    if (!ctx || !engineOsc || !enabled) return;
    const t   = (speed - CONFIG.SPEED_START) / (CONFIG.SPEED_MAX - CONFIG.SPEED_START);
    const freq = CONFIG.ENGINE_FREQ_MIN + t * (CONFIG.ENGINE_FREQ_MAX - CONFIG.ENGINE_FREQ_MIN);
    engineOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
  }

  // =========================================================
  // MUSIK LATAR (pentatonik ceria, sederhana)
  // =========================================================
  const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C D E G A C5
  const MELODY = [0, 2, 4, 2, 1, 0, 3, 4, 2, 0, 1, 3, 4, 2, 0, 2];

  let melodyIdx  = 0;
  let melodyTimer = null;

  function playNote(freqIdx, duration, volume) {
    if (!ctx || !enabled) return;
    const freq = PENTATONIC[freqIdx % PENTATONIC.length];
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume * CONFIG.MUSIC_VOLUME, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  function startMusic() {
    if (!ctx || !enabled) return;
    // Mainkan not satu per satu dengan interval 0.4 detik
    function tick() {
      if (!enabled) return;
      playNote(MELODY[melodyIdx % MELODY.length], 0.35, 0.4);
      melodyIdx++;
      melodyTimer = setTimeout(tick, 400);
    }
    tick();
  }

  function stopMusic() {
    if (melodyTimer) { clearTimeout(melodyTimer); melodyTimer = null; }
  }

  function restartMusic() {
    stopMusic();
    if (enabled && ctx) startMusic();
  }

  // =========================================================
  // SFX
  // =========================================================
  function playSFX(type) {
    if (!ctx || !enabled) return;

    switch (type) {
      case 'shift': {
        // Efek geser jalur — klik singkat
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type   = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.3 * CONFIG.SFX_VOLUME, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(); osc.stop(ctx.currentTime + 0.14);
        break;
      }

      case 'crash': {
        // Tabrakan — noise burst
        const bufSize = ctx.sampleRate * 0.4;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src  = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass'; filter.frequency.value = 300; filter.Q.value = 0.8;
        src.buffer = buf;
        gain.gain.setValueAtTime(0.6 * CONFIG.SFX_VOLUME, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        src.connect(filter); filter.connect(gain); gain.connect(masterGain);
        src.start(); src.stop(ctx.currentTime + 0.42);
        break;
      }

      case 'horn': {
        // Klakson — saat nyaris tabrakan
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type   = 'sawtooth';
        osc.frequency.value = 480;
        gain.gain.setValueAtTime(0.25 * CONFIG.SFX_VOLUME, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(); osc.stop(ctx.currentTime + 0.28);
        break;
      }

      case 'record': {
        // Rekor baru — arpeggio ceria
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3 * CONFIG.SFX_VOLUME, ctx.currentTime + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.09 + 0.15);
          osc.connect(gain); gain.connect(masterGain);
          osc.start(ctx.currentTime + i * 0.09);
          osc.stop(ctx.currentTime + i * 0.09 + 0.17);
        });
        break;
      }

      case 'checkpoint': {
        // Checkpoint — dua nada naik
        [523.25, 783.99].forEach((freq, i) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.25 * CONFIG.SFX_VOLUME, ctx.currentTime + i * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.14 + 0.20);
          osc.connect(gain); gain.connect(masterGain);
          osc.start(ctx.currentTime + i * 0.14);
          osc.stop(ctx.currentTime + i * 0.14 + 0.22);
        });
        break;
      }
    }
  }

  // =========================================================
  // Toggle suara
  // =========================================================
  function setEnabled(val) {
    enabled = val;
    if (!ctx) return;
    if (!enabled) {
      masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      stopMusic();
    } else {
      masterGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.05);
      restartMusic();
    }
  }

  function isEnabled() { return enabled; }

  // Ekspor global
  window.Audio3D = {
    resume,
    updateEngine,
    playSFX,
    setEnabled,
    isEnabled,
  };

})();
