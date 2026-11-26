// js/audio.js — Web Audio API procedural music & SFX

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicMuted = false;
    this.sfxMuted = false;
    this.musicVol = 0.45;
    this.sfxVol = 0.7;
    this.started = false;
    this.musicNodes = [];
    this.beatInterval = null;
    this.noteIndex = 0;

    // Angklung/gamelan-ish pentatonic scale (Hz)
    this.scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
    this.bassScale = [65.41, 73.42, 82.41, 98.00, 110.00, 130.81];
    this.melodyPattern = [0, 2, 4, 5, 2, 4, 7, 5, 4, 2, 0, 4, 5, 7, 4, 2];
    this.bassPattern = [0, 0, 2, 2, 0, 0, 3, 3];
    this.bpm = 112;
    this.beatMs = 60000 / this.bpm;
  }

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVol;
    this.sfxGain.gain.value = this.sfxVol;
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);
    this.started = true;
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  startMusic() {
    if (!this.ctx) return;
    this._stopMusic();
    this._scheduleLoop();
  }

  _scheduleLoop() {
    if (!this.ctx) return;
    let beat = 0;
    const tick = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this._playMelodyNote(beat, t);
      this._playBassNote(beat, t);
      if (beat % 4 === 0) this._playPerc(t, 'kick');
      if (beat % 4 === 2) this._playPerc(t, 'snare');
      if (beat % 2 === 1) this._playPerc(t, 'hat');
      beat++;
    };
    tick();
    this.beatInterval = setInterval(tick, this.beatMs);
  }

  _stopMusic() {
    clearInterval(this.beatInterval);
    this.beatInterval = null;
  }

  _playMelodyNote(beat, t) {
    if (this.musicMuted) return;
    const idx = this.melodyPattern[beat % this.melodyPattern.length];
    const freq = this.scale[idx];
    const dur = this.beatMs / 1000 * 0.5;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  _playBassNote(beat, t) {
    if (this.musicMuted) return;
    if (beat % 2 !== 0) return;
    const idx = this.bassPattern[(beat / 2) % this.bassPattern.length];
    const freq = this.bassScale[idx];
    const dur = this.beatMs / 1000 * 0.8;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  _getNoise(key, seconds, amp) {
    this._noiseCache = this._noiseCache || {};
    const cached = this._noiseCache[key];
    if (cached && cached.sampleRate === this.ctx.sampleRate) return cached;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * seconds), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * amp;
    this._noiseCache[key] = buf;
    return buf;
  }

  _playPerc(t, type) {
    if (this.musicMuted) return;
    const gain = this.ctx.createGain();
    gain.connect(this.musicGain);

    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.3);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(gain);
      osc.start(t); osc.stop(t + 0.35);
    } else if (type === 'snare') {
      const src = this.ctx.createBufferSource();
      src.buffer = this._getNoise('snare', 0.15, 0.5); // buffer derau di-cache, tidak diisi ulang tiap ketukan
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      src.connect(gain);
      src.start(t);
    } else if (type === 'hat') {
      const src = this.ctx.createBufferSource();
      src.buffer = this._getNoise('hat', 0.05, 0.3);
      const hpf = this.ctx.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = 8000;
      src.connect(hpf); hpf.connect(gain);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.start(t);
    }
  }

  stopMusic() { this._stopMusic(); }

  playSfx(type) {
    if (!this.ctx || this.sfxMuted) return;
    const t = this.ctx.currentTime;
    switch (type) {
      case 'place_soft': this._sfxPlace(t, 500, 'sine', 0.15, 0.08); break;
      case 'place_wet': this._sfxPlace(t, 300, 'triangle', 0.2, 0.12); break;
      case 'place_crisp': this._sfxCrisp(t); break;
      case 'correct': this._sfxCorrect(t); break;
      case 'wrong': this._sfxWrong(t); break;
      case 'leave': this._sfxLeave(t); break;
      case 'money': this._sfxMoney(t); break;
      case 'combo': this._sfxCombo(t); break;
      case 'tick': this._sfxTick(t); break;
      case 'button': this._sfxButton(t); break;
      case 'levelup': this._sfxLevelUp(t); break;
      case 'gameover': this._sfxGameOver(t); break;
      case 'impatient': this._sfxImpatient(t); break;
    }
  }

  _sfxPlace(t, freq, type, vol, dur) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  _sfxCrisp(t) {
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const hpf = this.ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 5000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(hpf); hpf.connect(g); g.connect(this.sfxGain);
    src.start(t);
  }

  _sfxCorrect(t) {
    [[523.25, 0], [659.25, 0.1], [783.99, 0.2], [1046.5, 0.3]].forEach(([freq, delay]) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(0.25, t + delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.15);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + delay); osc.stop(t + delay + 0.2);
    });
  }

  _sfxWrong(t) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.3);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.35);
  }

  _sfxLeave(t) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.5);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.55);
  }

  _sfxMoney(t) {
    [[1046.5, 0], [1318.5, 0.08]].forEach(([freq, delay]) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(0.2, t + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.1);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + delay); osc.stop(t + delay + 0.15);
    });
  }

  _sfxCombo(t) {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.2, t + i * 0.07 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.12);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.07); osc.stop(t + i * 0.07 + 0.15);
    });
  }

  _sfxTick(t) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square'; osc.frequency.value = 1200;
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.04);
  }

  _sfxButton(t) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 700;
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.1);
  }

  _sfxLevelUp(t) {
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.3, t + i * 0.1 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.2);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.25);
    });
  }

  _sfxGameOver(t) {
    [400, 350, 280, 200].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.2, t + i * 0.15 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.15 + 0.2);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.15); osc.stop(t + i * 0.15 + 0.25);
    });
  }

  _sfxImpatient(t) {
    [800, 900].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.1, t + i * 0.12 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.1);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t + i * 0.12); osc.stop(t + i * 0.12 + 0.12);
    });
  }

  setMusicVol(v) {
    this.musicVol = v;
    if (this.musicGain) this.musicGain.gain.value = this.musicMuted ? 0 : v;
  }
  setSfxVol(v) {
    this.sfxVol = v;
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxMuted ? 0 : v;
  }
  toggleMuteMusic() {
    this.musicMuted = !this.musicMuted;
    if (this.musicGain) this.musicGain.gain.value = this.musicMuted ? 0 : this.musicVol;
    return this.musicMuted;
  }
  toggleMuteSfx() {
    this.sfxMuted = !this.sfxMuted;
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxMuted ? 0 : this.sfxVol;
    return this.sfxMuted;
  }

  vibrate(pattern = [30]) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }
}