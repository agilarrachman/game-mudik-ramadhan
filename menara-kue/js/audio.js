// audio.js — Audio prosedural Menara Kue via Web Audio API (tanpa berkas audio)
// Berisi: backsound (musik latar), dan efek suara (SFX) untuk semua aksi game.
// Audio baru aktif setelah interaksi pertama pengguna (aturan autoplay browser).

(function (global) {
    'use strict';

    const MUSIC_VOL = 0.45;
    const SFX_VOL = 0.9;

    let ctx = null;
    let masterGain = null, musicDuck = null, musicBus = null, sfxBus = null;
    let noiseBuf = null;

    let enabled = true;        // mengikuti tombol speaker
    let mode = 'idle';         // idle | playing | paused
    let intensity = 0;         // skor, membuat musik makin cepat

    // =========================================================
    // KONTEKS AUDIO
    // =========================================================
    function ensureCtx() {
        if (ctx) return true;
        try {
            const AC = global.AudioContext || global.webkitAudioContext;
            if (!AC) return false;
            ctx = new AC();

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

            noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
            const d = noiseBuf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            return true;
        } catch (e) {
            ctx = null;
            return false;
        }
    }

    function unlock() {
        if (!ensureCtx()) return;
        if (ctx.state === 'suspended') ctx.resume();
        try { // Trik iOS
            const b = ctx.createBuffer(1, 1, 22050);
            const s = ctx.createBufferSource();
            s.buffer = b; s.connect(ctx.destination); s.start(0);
        } catch (e) { }
        if (mode !== 'idle') startScheduler();
    }

    // Buka audio pada interaksi pertama (fase capture agar tidak terhalang handler lain)
    ['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev =>
        global.addEventListener(ev, unlock, { passive: true, capture: true })
    );

    // Bunyi klik untuk semua tombol (kecuali tombol suara)
    global.addEventListener('pointerdown', e => {
        const b = e.target && e.target.closest && e.target.closest('button, a.sticker-btn');
        if (b && b.id !== 'btn-sound') playSFX('click');
    }, { passive: true });

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
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + (o.attack || 0.004));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        let node = osc;
        if (o.lp) {
            const f = ctx.createBiquadFilter();
            f.type = 'lowpass'; f.frequency.value = o.lp;
            osc.connect(f); node = f;
        }
        node.connect(g); g.connect(dest);
        osc.start(t);
        osc.stop(t + dur + 0.05);
    }

    function noise(t, dur, vol, type, f0, f1, dest, q) {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        src.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = type;
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

    // Nada ala marimba/lonceng: sedikit harmonik, peluruhan cepat
    function bell(freq, t, dur, vol, dest) {
        tone(freq, t, dur, 'sine', vol, dest);
        tone(freq * 2, t, dur * 0.6, 'sine', vol * 0.35, dest);
        tone(freq * 3.01, t, dur * 0.3, 'sine', vol * 0.12, dest);
    }

    // =========================================================
    // BACKSOUND (ceria, lembut, ala Lebaran: C - G - Am - F)
    // =========================================================
    const SCALE = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C D E G A C6
    const CHORDS = [
        { bass: 130.81, notes: [261.63, 329.63, 392.00] },  // C
        { bass: 196.00, notes: [246.94, 293.66, 392.00] },  // G
        { bass: 220.00, notes: [261.63, 329.63, 440.00] },  // Am
        { bass: 174.61, notes: [261.63, 349.23, 440.00] },  // F
    ];
    const MELODY = [
        [2, -1, 3, 4, 3, -1, 2, -1],
        [1, -1, 2, 3, 2, -1, 1, -1],
        [0, -1, 2, 4, 3, -1, 2, 0],
        [2, -1, 3, 2, 0, -1, 1, -1],
    ];

    let schedTimer = null, nextTime = 0, stepIdx = 0;

    function stepLen() {
        const bpm = 112 + Math.min(intensity, 40) * 0.6;   // 112 -> 136 BPM
        return 60 / bpm / 2;
    }

    function scheduleStep(idx, t, len) {
        const bar = Math.floor(idx / 8) % 4;
        const s = idx % 8;
        const ch = CHORDS[bar];

        // Kick lembut + tepukan
        if (s === 0 || s === 4) tone(140, t, 0.2, 'sine', 0.7, musicBus, { slideTo: 45 });
        if (s === 4) noise(t, 0.10, 0.18, 'highpass', 1800, null, musicBus, 0.7);
        // Shaker di ketukan ganjil
        if (s % 2 === 1) noise(t, 0.04, 0.10, 'highpass', 8000, null, musicBus, 0.7);
        // Bass
        if (s === 0 || s === 3 || s === 4 || s === 7) {
            tone(ch.bass * 2, t, len * 1.8, 'triangle', 0.38, musicBus, { lp: 800 });
        }
        // Petikan akor
        if (s === 2 || s === 6) {
            ch.notes.forEach(f => tone(f, t, len * 1.2, 'triangle', 0.10, musicBus));
        }
        // Melodi marimba
        const m = MELODY[bar][s];
        if (m >= 0) bell(SCALE[m], t, len * 2.2, 0.26, musicBus);
    }

    function tick() {
        if (!ctx || mode === 'idle') return;
        if (ctx.state !== 'running') { nextTime = ctx.currentTime + 0.05; return; }
        while (nextTime < ctx.currentTime + 0.25) {
            const len = stepLen();
            scheduleStep(stepIdx, nextTime, len);
            nextTime += len;
            stepIdx++;
        }
    }

    function startScheduler() {
        if (!ctx || schedTimer) return;
        nextTime = ctx.currentTime + 0.08;
        schedTimer = setInterval(tick, 50);
    }
    function stopScheduler() {
        if (schedTimer) { clearInterval(schedTimer); schedTimer = null; }
    }
    function setMusicLevel(v, tc) {
        if (ctx) musicDuck.gain.setTargetAtTime(v, ctx.currentTime, tc || 0.1);
    }

    // =========================================================
    // EFEK SUARA (SFX)
    // =========================================================
    function playSFX(type, arg) {
        if (!ctx || !enabled) return;
        const t = ctx.currentTime;
        const out = sfxBus;

        switch (type) {
            case 'click':
                tone(900, t, 0.06, 'square', 0.12, out, { lp: 3000 });
                break;

            case 'spawn': {   // Capit membawa kue baru turun
                noise(t, 0.28, 0.22, 'bandpass', 400, 1400, out, 1.5);
                bell(1046.5, t + 0.22, 0.25, 0.12, out);
                break;
            }
            case 'release': { // Capit membuka lalu kue dijatuhkan
                tone(1500, t, 0.03, 'square', 0.14, out, { lp: 4000 });
                tone(1100, t + 0.04, 0.03, 'square', 0.12, out, { lp: 4000 });
                noise(t + 0.02, 0.14, 0.30, 'bandpass', 2200, 500, out, 1.0);
                break;
            }
            case 'land': {    // Kue mendarat
                tone(150, t, 0.18, 'sine', 0.9, out, { slideTo: 50 });
                noise(t, 0.06, 0.35, 'lowpass', 1200, null, out, 0.7);
                break;
            }
            case 'perfect': { // arg = jumlah combo, nada naik tiap combo
                const c = Math.min(arg || 1, 8);
                const k = Math.pow(2, (c - 1) * 2 / 12);
                tone(150, t, 0.18, 'sine', 0.8, out, { slideTo: 50 });
                [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                    bell(f * k, t + 0.04 + i * 0.065, 0.32, 0.30, out);
                });
                if (c >= 3) bell(2093 * k, t + 0.34, 0.40, 0.14, out);   // kilau pemulihan lebar
                break;
            }
            case 'slice': {   // Kue terpotong, potongan jatuh
                tone(150, t, 0.18, 'sine', 0.8, out, { slideTo: 50 });
                noise(t, 0.09, 0.40, 'highpass', 2500, null, out, 0.8);
                tone(700, t + 0.05, 0.35, 'triangle', 0.16, out, { slideTo: 160 });
                break;
            }
            case 'miss': {    // Kue meleset total
                tone(800, t, 0.7, 'sine', 0.30, out, { slideTo: 110 });
                noise(t, 0.5, 0.20, 'bandpass', 1800, 300, out, 1.0);
                break;
            }
            case 'gameover': {
                [392.00, 349.23, 311.13, 261.63].forEach((f, i) => {
                    tone(f, t + i * 0.2, 0.45, 'triangle', 0.32, out, { lp: 1500 });
                });
                tone(130.81, t + 0.6, 0.6, 'sine', 0.4, out);
                break;
            }
            case 'record': {
                [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => {
                    bell(f, t + i * 0.09, 0.35, 0.32, out);
                });
                break;
            }
        }
    }

    // =========================================================
    // ALUR GAME
    // =========================================================
    function startGame() {
        unlock();
        if (!ctx) return;
        mode = 'playing';
        intensity = 0;
        stepIdx = 0;
        stopScheduler();
        setMusicLevel(1.0, 0.05);
        startScheduler();
    }
    function pauseGame() {
        if (mode !== 'playing') return;
        mode = 'paused';
        setMusicLevel(0.25, 0.1);       // musik pelan saat jeda
    }
    function resumeGame() {
        if (mode !== 'paused') return;
        mode = 'playing';
        setMusicLevel(1.0, 0.1);
    }
    function stopMusic() {
        mode = 'idle';
        stopScheduler();
    }
    function gameOver(isNewRecord) {
        stopMusic();
        playSFX(isNewRecord ? 'record' : 'gameover');
    }
    function setIntensity(score) { intensity = score || 0; }

    function setEnabled(v) {
        enabled = !!v;
        if (ctx) masterGain.gain.setTargetAtTime(enabled ? 1.0 : 0.0, ctx.currentTime, 0.05);
    }

    global.GameAudio = {
        unlock, startGame, pauseGame, resumeGame, stopMusic, gameOver,
        setIntensity, playSFX, setEnabled, isEnabled: () => enabled,
    };

})(window);