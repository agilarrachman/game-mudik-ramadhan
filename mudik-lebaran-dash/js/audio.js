// audio.js — Audio prosedural via Web Audio API (tanpa berkas audio)
// Berisi: backsound (musik latar), dengung mesin, dan efek suara (SFX).
// Audio baru aktif setelah interaksi pertama pengguna (aturan autoplay browser).

(function () {
  'use strict';

  // ---- Volume (bisa diubah di config.js) ----
  const MUSIC_VOL = (typeof CONFIG !== 'undefined' && CONFIG.MUSIC_VOLUME != null) ? CONFIG.MUSIC_VOLUME : 0.5;
  const SFX_VOL = (typeof CONFIG !== 'undefined' && CONFIG.SFX_VOLUME != null) ? CONFIG.SFX_VOLUME : 0.8;
  const ENGINE_VOL = (typeof CONFIG !== 'undefined' && CONFIG.ENGINE_VOLUME != null) ? CONFIG.ENGINE_VOLUME : 0.5;
  const F_MIN = (typeof CONFIG !== 'undefined' && CONFIG.ENGINE_FREQ_MIN) || 110;
  const F_MAX = (typeof CONFIG !== 'undefined' && CONFIG.ENGINE_FREQ_MAX) || 420;

  let ctx = null;
  let masterGain = null, musicBus = null, musicDuck = null, sfxBus = null, engineBus = null;
  let noiseBuf = null;

  let enabled = true;          // preferensi suara (tombol speaker)
  let mode = 'idle';           // idle | playing | paused | over

  // Mesin
  let engineOsc1 = null, engineOsc2 = null, engineFilter = null, engineLfo = null;
  let engineSpeedT = 0;

  // =========================================================
  // KONTEKS AUDIO
  // =========================================================
  function ensureCtx() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();

      // Rantai: bus -> master -> kompresor -> speaker
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      comp.connect(ctx.destination);

      masterGain = ctx.createGain();
      masterGain.gain.value = enabled ? 1.0 : 0.0;
      masterGain.connect(comp);

      musicDuck = ctx.createGain();
      musicDuck.gain.value = 1.0;
      musicDuck.connect(masterGain);

      musicBus = ctx.createGain();
      musicBus.gain.value = MUSIC_VOL;
      musicBus.connect(musicDuck);

      sfxBus = ctx.createGain();
      sfxBus.gain.value = SFX_VOL;
      sfxBus.connect(masterGain);

      engineBus = ctx.createGain();
      engineBus.gain.value = 0.0;           // dinyalakan saat bermain
      engineBus.connect(masterGain);

      // Buffer noise (dipakai ulang)
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

      buildEngine();
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  // Dipanggil dari gesture pengguna. Aman dipanggil berulang.
  function unlock() {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    // Trik iOS: putar buffer kosong agar audio terbuka
    try {
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch (e) { }
    if (mode === 'playing' || mode === 'paused') startMusicScheduler();
  }

  // Buka audio pada interaksi pertama apa pun
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev =>
    window.addEventListener(ev, unlock, { passive: true })
  );

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { if (ctx.state === 'running') ctx.suspend(); }
    else if (ctx.state === 'suspended') ctx.resume();
  });

  // =========================================================
  // HELPER SUARA
  // =========================================================
  function tone(freq, t, dur, type, vol, dest, o) {
    o = o || {};
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
    const atk = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = o.lp;
      osc.connect(f); node = f;
    }
    node.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(t, dur, vol, filterType, f0, f1, dest, q) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    f.Q.value = q || 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // =========================================================
  // MESIN
  // =========================================================
  function buildEngine() {
    engineOsc1 = ctx.createOscillator();
    engineOsc2 = ctx.createOscillator();
    engineFilter = ctx.createBiquadFilter();
    const eg = ctx.createGain();
    const g2 = ctx.createGain();
    engineLfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();

    engineOsc1.type = 'sawtooth';
    engineOsc2.type = 'square';
    engineOsc1.frequency.value = F_MIN;
    engineOsc2.frequency.value = F_MIN * 2;
    g2.gain.value = 0.35;

    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 800;
    engineFilter.Q.value = 3;

    eg.gain.value = 0.14;                 // dasar
    engineLfo.type = 'sine';
    engineLfo.frequency.value = 14;       // getaran "putt-putt"
    lfoDepth.gain.value = 0.05;
    engineLfo.connect(lfoDepth);
    lfoDepth.connect(eg.gain);

    engineOsc1.connect(engineFilter);
    engineOsc2.connect(g2); g2.connect(engineFilter);
    engineFilter.connect(eg);
    eg.connect(engineBus);

    engineOsc1.start(); engineOsc2.start(); engineLfo.start();
  }

  function setEngine(on) {
    if (!ctx) return;
    engineBus.gain.setTargetAtTime(on ? ENGINE_VOL : 0.0, ctx.currentTime, on ? 0.15 : 0.08);
  }

  // Dipanggil tiap frame dari game.js
  function updateEngine(speed) {
    if (!ctx || !engineOsc1) return;
    const span = (CONFIG.SPEED_MAX - CONFIG.SPEED_START) || 1;
    const t = Math.max(0, Math.min(1, (speed - CONFIG.SPEED_START) / span));
    engineSpeedT = t;
    const f = F_MIN + t * (F_MAX - F_MIN);
    const now = ctx.currentTime;
    engineOsc1.frequency.setTargetAtTime(f, now, 0.1);
    engineOsc2.frequency.setTargetAtTime(f * 2, now, 0.1);
    engineFilter.frequency.setTargetAtTime(700 + t * 1400, now, 0.1);
    engineLfo.frequency.setTargetAtTime(12 + t * 22, now, 0.1);
  }

  // =========================================================
  // BACKSOUND (musik latar: ceria ala mudik, C - Am - F - G)
  // =========================================================
  const BPM = 132;
  const STEP = 60 / BPM / 2;             // not seperdelapan
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C D E G A C6

  const CHORDS = [
    { root: 130.81, notes: [261.63, 329.63, 392.00] },   // C
    { root: 110.00, notes: [220.00, 261.63, 329.63] },   // Am
    { root: 87.31, notes: [174.61, 220.00, 261.63] },   // F
    { root: 98.00, notes: [196.00, 246.94, 293.66] },   // G
  ];
  // Melodi: 4 bar x 8 langkah, -1 = jeda
  const MELODY = [
    [2, -1, 4, 2, 3, -1, 2, 0],
    [1, -1, 2, 0, 1, -1, 2, 4],
    [0, -1, 2, 3, 2, -1, 0, -1],
    [3, -1, 4, 5, 4, -1, 3, 2],
  ];
  const BASS = [1, 0, 1, 0, 1.5, 0, 1, 0]; // pengali nada dasar, 0 = jeda

  let schedTimer = null;
  let nextTime = 0;
  let stepIdx = 0;

  function scheduleStep(idx, t) {
    const bar = Math.floor(idx / 8) % 4;
    const s = idx % 8;
    const chord = CHORDS[bar];

    // Kick
    if (s === 0 || s === 4 || s === 6) {
      tone(150, t, 0.22, 'sine', 0.9, musicBus, { slideTo: 45 });
    }
    // Snare/tepuk
    if (s === 2 || s === 6) {
      noise(t, 0.14, 0.35, 'highpass', 1500, null, musicBus, 0.7);
    }
    // Hi-hat di ketukan ganjil
    if (s % 2 === 1) {
      noise(t, 0.05, 0.16, 'highpass', 7000, null, musicBus, 0.7);
    }
    // Bass
    if (BASS[s] > 0) {
      tone(chord.root * BASS[s] * 2, t, STEP * 1.6, 'sawtooth', 0.32, musicBus, { lp: 900 });
    }
    // Chord stab di off-beat
    if (s % 2 === 1) {
      chord.notes.forEach(f => tone(f, t, STEP * 0.8, 'square', 0.06, musicBus, { lp: 2200 }));
    }
    // Melodi
    const m = MELODY[bar][s];
    if (m >= 0) {
      tone(SCALE[m], t, STEP * 1.5, 'triangle', 0.30, musicBus, { attack: 0.008 });
      tone(SCALE[m] * 2, t, STEP * 0.8, 'sine', 0.06, musicBus);
    }
  }

  function schedulerTick() {
    if (!ctx || (mode !== 'playing' && mode !== 'paused')) return;
    if (ctx.state !== 'running') { nextTime = ctx.currentTime + 0.05; return; }
    while (nextTime < ctx.currentTime + 0.25) {
      scheduleStep(stepIdx, nextTime);
      nextTime += STEP;
      stepIdx++;
    }
  }

  function startMusicScheduler() {
    if (!ctx || schedTimer) return;
    nextTime = ctx.currentTime + 0.08;
    schedTimer = setInterval(schedulerTick, 50);
  }

  function stopMusicScheduler() {
    if (schedTimer) { clearInterval(schedTimer); schedTimer = null; }
  }

  function setMusicLevel(level, tc) {
    if (!ctx) return;
    musicDuck.gain.setTargetAtTime(level, ctx.currentTime, tc || 0.1);
  }

  // =========================================================
  // EFEK SUARA (SFX)
  // =========================================================
  function playSFX(type) {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime;
    const out = sfxBus;

    switch (type) {
      case 'shift': {
        noise(t, 0.16, 0.45, 'bandpass', 600, 2200, out, 1.2);
        tone(420, t, 0.10, 'sine', 0.25, out, { slideTo: 700 });
        break;
      }
      case 'crash': {
        // Mesin & musik berhenti, lalu bunyi tabrakan
        setEngine(false);
        setMusicLevel(0.0, 0.15);
        noise(t, 0.7, 1.0, 'lowpass', 2500, 150, out, 0.7);
        tone(130, t, 0.45, 'sine', 0.9, out, { slideTo: 40 });
        tone(220, t, 0.25, 'square', 0.25, out, { slideTo: 90, lp: 1200 });
        tone(1800, t + 0.02, 0.18, 'square', 0.08, out, { slideTo: 700 }); // dentang logam
        break;
      }
      case 'horn': {
        // Klakson "tin-tin"
        [0, 0.17].forEach(d => {
          tone(440, t + d, 0.13, 'square', 0.18, out, { lp: 2400 });
          tone(554, t + d, 0.13, 'square', 0.14, out, { lp: 2400 });
        });
        break;
      }
      case 'checkpoint': {
        [523.25, 659.25, 783.99].forEach((f, i) => {
          tone(f, t + i * 0.11, 0.30, 'triangle', 0.35, out);
          tone(f * 2, t + i * 0.11, 0.20, 'sine', 0.10, out);
        });
        break;
      }
      case 'record': {
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => {
          tone(f, t + i * 0.09, 0.28, 'triangle', 0.35, out);
          tone(f * 2, t + i * 0.09, 0.15, 'sine', 0.08, out);
        });
        break;
      }
      case 'gameover': {
        [392.00, 349.23, 311.13, 261.63].forEach((f, i) => {
          tone(f, t + i * 0.2, 0.45, 'sawtooth', 0.22, out, { lp: 1200 });
        });
        break;
      }
      case 'click': {
        tone(900, t, 0.06, 'square', 0.12, out, { lp: 3000 });
        break;
      }
    }
  }

  // =========================================================
  // ALUR GAME (dipanggil dari main.js)
  // =========================================================
  function startGame() {
    unlock();
    if (!ctx) return;
    mode = 'playing';
    stepIdx = 0;
    stopMusicScheduler();
    setMusicLevel(1.0, 0.05);
    startMusicScheduler();
    setEngine(true);
  }

  function pauseGame() {
    if (mode !== 'playing') return;
    mode = 'paused';
    setEngine(false);
    setMusicLevel(0.25, 0.1);       // musik pelan saat jeda
  }

  function resumeGame() {
    if (mode !== 'paused') return;
    mode = 'playing';
    setEngine(true);
    setMusicLevel(1.0, 0.1);
  }

  function gameOver(isNewRecord) {
    mode = 'over';
    stopMusicScheduler();
    setEngine(false);
    setMusicLevel(1.0, 0.05);       // siap untuk main lagi
    playSFX(isNewRecord ? 'record' : 'gameover');
  }

  // =========================================================
  // TOGGLE SUARA
  // =========================================================
  function setEnabled(val) {
    enabled = !!val;
    if (ctx) masterGain.gain.setTargetAtTime(enabled ? 1.0 : 0.0, ctx.currentTime, 0.05);
  }
  function isEnabled() { return enabled; }

  // Ekspor global
  window.Audio3D = {
    resume: unlock,          // kompatibel dengan kode lama
    unlock,
    startGame, pauseGame, resumeGame, gameOver,
    updateEngine,
    playSFX,
    setEnabled, isEnabled,
  };

})();