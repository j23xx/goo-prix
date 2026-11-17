// GOO PRIX · src/audio.js — The WebAudio synth: buses, sound effects and the step-sequencer music.
'use strict';

// ============================================================================================
// AUDIO_CORE — WebAudio context, buses and the envelope/noise primitives every sound uses
// ============================================================================================
const AU = {
  ctx: null, master: null, sfx: null, music: null, noiseBuf: null, ready: false,
  init() {
    if (this.ctx || SHOT) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
    comp.attack.value = 0.004; comp.release.value = 0.18;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = save.muted ? 0 : 0.8;
    this.master.connect(comp);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
    this.music = ctx.createGain(); this.music.gain.value = 0.42; this.music.connect(this.master);
    const len = ctx.sampleRate * 1.5;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    const nr = mulberry32(99);
    for (let i = 0; i < len; i++) data[i] = nr() * 2 - 1;
    this.ready = true;
  },
  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (typeof MUSIC !== 'undefined') MUSIC.wake();
  },
  setMuted(m) {
    save.muted = m; writeSave();
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.02);
    const use = document.getElementById('i-sound-use');
    if (use) use.setAttribute('href', m ? '#i-mute' : '#i-sound');
  },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
};

// One oscillator with an exponential pitch glide and a quick attack / exponential decay.
function tone(type, f0, f1, dur, vol, opts) {
  if (!AU.ready) return;
  const o = opts || {};
  const ctx = AU.ctx;
  const t = o.when != null ? o.when : ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, f0), t);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  if (o.detune) osc.detune.value = o.detune;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + (o.attack || 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = osc;
  if (o.filter) {
    const f = ctx.createBiquadFilter();
    f.type = o.filter; f.frequency.value = o.cutoff || 1200; f.Q.value = o.q || 1;
    if (o.cutoffEnd) f.frequency.exponentialRampToValueAtTime(o.cutoffEnd, t + dur);
    node.connect(f); node = f;
  }
  node.connect(g);
  g.connect(o.bus || AU.sfx);
  osc.start(t); osc.stop(t + dur + 0.02);
}

// A filtered burst of white noise with a swept filter: puffs, splats, snares, wind.
function noise(dur, vol, filterType, f0, f1, opts) {
  if (!AU.ready) return;
  const o = opts || {};
  const ctx = AU.ctx;
  const t = o.when != null ? o.when : ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = AU.noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = filterType; f.Q.value = o.q || 1.2;
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + (o.attack || 0.003));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(o.bus || AU.sfx);
  src.start(t, rand() * 1.0); src.stop(t + dur + 0.02);
}

// ============================================================================================
// SFX — one small synth recipe per game sound (square, triangle and noise: Pong-flavoured)
// ============================================================================================
const sfx = {
  flap(p) { p = p || 1; noise(0.05, 0.1, 'bandpass', 1800 * p, 900 * p); tone('square', 520 * p, 330 * p, 0.05, 0.045); },
  shoot() { tone('sawtooth', 340, 90, 0.11, 0.09, { filter: 'lowpass', cutoff: 1500 }); noise(0.05, 0.05, 'lowpass', 2400, 600); },
  splat() { noise(0.24, 0.32, 'bandpass', 1500, 180, { q: 2.2 }); tone('triangle', 120, 48, 0.2, 0.3); },
  wallSplat() { noise(0.12, 0.13, 'bandpass', 900, 260, { q: 1.6 }); },
  gate(streak) { const f = 480 * Math.pow(1.059, Math.min(streak, 12)); tone('square', f, f, 0.035, 0.06); },
  bonk() { tone('square', 170, 52, 0.26, 0.22); noise(0.22, 0.28, 'lowpass', 1400, 160); },
  coin(n) {
    const f = 880 * Math.pow(1.03, Math.min(n, 20));
    tone('square', f, f, 0.04, 0.05); tone('square', f * 1.5, f * 1.5, 0.07, 0.05, { when: AU.now() + 0.045 });
  },
  ring() { tone('sawtooth', 300, 1300, 0.3, 0.08, { filter: 'lowpass', cutoff: 3200 }); tone('triangle', 1200, 1900, 0.25, 0.06, { when: AU.now() + 0.05 }); },
  swoop(tier) { tone('triangle', 300, tier ? 1500 : 900, tier ? 0.4 : 0.28, 0.16); noise(0.35, 0.12, 'bandpass', 500, 2600); },
  charge(t) { const f = 220 + t * 500; tone('triangle', f, f * 1.02, 0.05, 0.035); },
  burp() {
    tone('sawtooth', 96, 58, 0.55, 0.32, { filter: 'lowpass', cutoff: 520, q: 7 });
    tone('square', 72, 50, 0.5, 0.1, { filter: 'lowpass', cutoff: 320 });
  },
  sneeze() { noise(0.32, 0.07, 'highpass', 1500, 3200); noise(0.5, 0.5, 'bandpass', 2600, 280, { when: AU.now() + 0.33 }); },
  tick() { tone('square', 1250, 1250, 0.018, 0.04); },
  itemGet() { [0, 4, 7, 12].forEach((n, i) => { const f = 660 * Math.pow(2, n / 12); tone('square', f, f, 0.07, 0.055, { when: AU.now() + i * 0.05 }); }); },
  launch() { tone('square', 200, 700, 0.18, 0.08); noise(0.15, 0.1, 'highpass', 2000, 800); },
  sock() { tone('square', 140, 120, 0.4, 0.05, { detune: 18 }); tone('square', 141, 119, 0.4, 0.05, { detune: -18 }); },
  pop() { tone('triangle', 900, 260, 0.09, 0.2); noise(0.06, 0.14, 'highpass', 3200, 3200); },
  shield() { tone('triangle', 500, 1000, 0.25, 0.1); tone('triangle', 750, 1500, 0.25, 0.06, { when: AU.now() + 0.06 }); },
  beep(hi) { const f = hi ? 880 : 440; tone('square', f, f, hi ? 0.4 : 0.15, 0.12); },
  posUp() { tone('square', 660, 990, 0.08, 0.06); },
  posDown() { tone('square', 520, 330, 0.12, 0.05); },
  scrape() { tone('square', 240, 230, 0.03, 0.035); },
  warn() { tone('square', 900, 900, 0.05, 0.05); tone('square', 1200, 1200, 0.05, 0.05, { when: AU.now() + 0.07 }); },
  fanfare() { [0, 4, 7, 12, 7, 12].forEach((n, i) => { const f = 523 * Math.pow(2, n / 12); tone('square', f, f, 0.12, 0.07, { when: AU.now() + i * 0.09 }); }); },
  finish() { [0, 7, 12, 16, 19, 24].forEach((n, i) => { const f = 392 * Math.pow(2, n / 12); tone('square', f, f, 0.16, 0.07, { when: AU.now() + i * 0.07 }); }); },
  sad() { [0, -1, -3, -5].forEach((n, i) => { const f = 330 * Math.pow(2, n / 12); tone('triangle', f, f * 0.98, 0.3, 0.12, { when: AU.now() + i * 0.22 }); }); },
  uiMove() { tone('square', 720, 720, 0.025, 0.04); },
  uiSelect() { tone('square', 520, 1040, 0.08, 0.07); },
  uiBack() { tone('square', 600, 300, 0.08, 0.05); },
  wipe() { noise(0.32, 0.12, 'lowpass', 500, 2600); },
  laser() { tone('square', 1800, 1700, 0.04, 0.02); },
  bomb() { tone('triangle', 140, 28, 0.7, 0.5); noise(0.7, 0.5, 'lowpass', 1800, 90); noise(0.25, 0.25, 'highpass', 3000, 1200, { when: AU.now() + 0.05 }); },
};

// ============================================================================================
// MUSIC — a tiny look-ahead step sequencer; every track gets its own seeded groove
// ============================================================================================
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10] };
function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function makeSong(seed, bpm, root, scaleName, style) {
  const rng = mulberry32(seed);
  const scale = SCALES[scaleName];
  const prog = style === 'chill' ? [0, 3, 5, 4] : pickFrom(rng, [[0, 5, 3, 4], [0, 3, 4, 3], [0, 6, 5, 4], [0, 4, 5, 3]]);
  const kicks = { four: 'x...x...x...x...', broken: 'x.....x...x..x..', chill: 'x.......x.x.....' };
  const lead = [];
  for (let bar = 0; bar < 2; bar++) {
    for (let i = 0; i < 16; i++) {
      const on = rng() < (i % 4 === 0 ? 0.75 : i % 2 === 0 ? 0.45 : 0.2);
      lead.push(on ? Math.floor(rng() * 5) * (rng() < 0.5 ? 1 : 2) % 7 : -1);
    }
  }
  return {
    bpm, root, scale, prog, lead,
    kick: style === 'chill' ? kicks.chill : style === 'broken' ? kicks.broken : kicks.four,
    snare: style === 'chill' ? '........x.......' : '....x.......x...',
    hat: style === 'chill' ? '..x...x...x...x.' : 'x.xxx.xxx.xxx.xx',
    bass: style === 'chill' ? 'x.......x.......' : pickFrom(rng, ['x..x..x.x..x..x.', 'x.x.x.x.x.x.x.x.', 'x..xx..xx..x.x..']),
  };
}
function pickFrom(rng, list) { return list[Math.floor(rng() * list.length)]; }

const MUSIC = {
  song: null, step: 0, nextTime: 0, timer: null, tempoMul: 1, transpose: 0, duck: 1,
  play(song) {
    this.song = song; this.step = 0; this.tempoMul = 1; this.transpose = 0;
    if (!AU.ready) return;
    this.nextTime = AU.now() + 0.08;
    this.t0 = this.nextTime;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 25);
  },
  wake() { if (this.song && AU.ready && !this.timer) this.play(this.song); },
  stop() { this.song = null; },
  tick() {
    if (!this.song || !AU.ready || AU.ctx.state !== 'running') return;
    const spStep = 60 / (this.song.bpm * this.tempoMul) / 4;
    if (this.nextTime < AU.now() - 0.2) this.nextTime = AU.now() + 0.02;
    while (this.nextTime < AU.now() + 0.12) {
      this.playStep(this.step, this.nextTime, spStep);
      this.nextTime += spStep; this.step++;
    }
  },
  note(deg, octave) {
    const s = this.song;
    const len = s.scale.length;
    const d = ((deg % len) + len) % len;
    return s.root + this.transpose + s.scale[d] + 12 * (octave + Math.floor(deg / len));
  },
  playStep(i, t, sp) {
    const s = this.song;
    const st = i % 16;
    const bar = Math.floor(i / 16);
    const chord = s.prog[bar % s.prog.length];
    const v = this.duck;
    const bus = AU.music;
    if (s.kick[st] === 'x') tone('triangle', 150, 42, 0.16, 0.55 * v, { when: t, bus });
    if (s.snare[st] === 'x') { noise(0.12, 0.22 * v, 'bandpass', 1900, 1200, { when: t, bus }); tone('triangle', 210, 160, 0.08, 0.1 * v, { when: t, bus }); }
    if (s.hat[st] === 'x') noise(0.03, (st % 4 === 2 ? 0.09 : 0.05) * v, 'highpass', 7500, 7000, { when: t, bus });
    if (s.bass[st] === 'x') {
      const f = midiHz(this.note(chord, -2));
      tone('square', f, f, sp * 1.7, 0.1 * v, { when: t, bus, filter: 'lowpass', cutoff: 700, cutoffEnd: 260 });
    }
    const ln = s.lead[(bar % 2) * 16 + st];
    if (ln >= 0) {
      const f = midiHz(this.note(chord + ln, 0));
      tone('square', f, f, sp * 0.9, 0.035 * v, { when: t, bus });
    }
    if (st === 0) { // pad: a soft triangle triad every bar
      for (const k of [0, 2, 4]) { const f = midiHz(this.note(chord + k, -1)); tone('triangle', f, f, sp * 15, 0.03 * v, { when: t, bus, attack: 0.08 }); }
    }
  },
};
const SONGS = {
  title: makeSong(11, 100, 57, 'dorian', 'chill'),
  results: makeSong(12, 112, 60, 'major', 'chill'),
  podium: makeSong(13, 120, 60, 'major', 'four'),
  over: makeSong(14, 84, 52, 'minor', 'chill'),
};
