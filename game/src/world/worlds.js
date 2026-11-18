// GOO PRIX · src/world/worlds.js — The five worlds: track definitions, their looks and the track builder.
'use strict';

// ============================================================================================
// TRACK_DEFS — the Gloop Cup: five courses, each with its own geometric motif and hazards
// ============================================================================================
// curves / hills: [amplitude u, waves per lap, phase] summed as sines of s, so every lap closes.
const TRACKS = [
  {
    name: 'CENTRE COURT', motif: 'court', seed: 101, len: 1900, win: [11, 6.5], spacing: 75,
    curves: [[26, 2, 0.4], [9, 5, 1.3]], hills: [[1.5, 3, 0]], slide: 0,
    hazards: ['paddle', 'ball'], tip: 'THREAD THE WINDOWS. THE DASHED LINE IS THE RACING LINE.',
    beats: { GATE: 6, DOUBLE: 1, PILLARS: 1, RING_LINE: 2, CUBE_ROW: 2, BALL_ARC: 2, BLOCKS: 1, HAZARD: 2, BREATHER: 1 },
    song: makeSong(201, 126, 57, 'major', 'four'),
  },
  {
    name: 'CHECKER CHUTE', motif: 'checker', seed: 202, len: 2000, win: [9.5, 6], spacing: 68,
    curves: [[22, 3, 2.1], [8, 6, 0.2]], hills: [[9, 3, 0.7], [4, 7, 1.9]], slide: 0,
    hazards: ['curtain', 'updraft'], tip: 'DRIP CURTAINS GOOP YOU. UPDRAFTS LIFT YOU.',
    beats: { GATE: 6, DOUBLE: 1, PILLARS: 1, RING_LINE: 2, CUBE_ROW: 2, BALL_ARC: 2, BLOCKS: 1, HAZARD: 3, BREATHER: 1 },
    song: makeSong(202, 132, 55, 'minor', 'broken'),
  },
  {
    name: 'BAR CODE', motif: 'barcode', seed: 303, len: 2050, win: [8.5, 5.5], spacing: 62,
    curves: [[30, 3, 4.0], [10, 7, 2.2]], hills: [[3, 2, 0.1]], slide: 0,
    hazards: ['rotor', 'wind'], tip: 'SPINNING BARS JAM WHEN GOOPED. LEAN INTO CROSSWINDS.',
    beats: { GATE: 5, DOUBLE: 1, PILLARS: 3, RING_LINE: 2, CUBE_ROW: 2, BALL_ARC: 2, BLOCKS: 1, HAZARD: 3, BREATHER: 1 },
    song: makeSong(303, 138, 58, 'phryg', 'four'),
  },
  {
    name: 'WIREFRAME CITY', motif: 'city', seed: 404, len: 2150, win: [7.5, 5], spacing: 56,
    curves: [[30, 4, 0.9], [12, 9, 0.4]], hills: [[4, 3, 2.2]], slide: 3,
    hazards: ['slider', 'ball'], tip: 'WINDOWS SLIDE. TIME YOUR LINE.',
    beats: { GATE: 6, DOUBLE: 1, PILLARS: 2, RING_LINE: 2, CUBE_ROW: 2, BALL_ARC: 2, BLOCKS: 2, HAZARD: 2, BREATHER: 1 },
    song: makeSong(404, 142, 53, 'dorian', 'broken'),
  },
  {
    name: 'NULL VOID', motif: 'void', seed: 505, len: 2200, win: [6.5, 4.5], spacing: 52,
    curves: [[28, 3, 1.6], [14, 8, 3.1]], hills: [[10, 4, 0.5], [3, 9, 0]], slide: 1.5,
    hazards: ['lowg', 'laser', 'rotor'], tip: 'LOW-G FIELDS FLOAT YOU. LASERS BLINK: PICK THE DARK HALF.',
    beats: { GATE: 6, DOUBLE: 1, PILLARS: 2, RING_LINE: 2, CUBE_ROW: 2, BALL_ARC: 2, BLOCKS: 1, HAZARD: 3, BREATHER: 1 },
    song: makeSong(505, 150, 50, 'minor', 'four'),
  },
  {
    name: 'THE SHOWROOM', motif: 'showroom', seed: 606, len: 1600, win: [8, 5.5], spacing: 60, empty: true,
    curves: [[10, 2, 0.3]], hills: [[1, 2, 0]], slide: 0,
    hazards: [], tip: 'MAKE HIM FILTHY.', beats: { BREATHER: 1 },
    song: makeSong(606, 156, 52, 'phryg', 'four'),
  },
];

// Each world's look: sky, ground, walls, rails, ribs, gate slab and props, and the colour distance
// fades into. Every hazard is tomato red, every window wears a cream icing rim.
const THEMES = [
  {
    id: 'breakfast', name: 'BREAKFAST BAY', fog: '#FFE9A8', fogAmt: 0.72,
    tip: 'THREAD THE TOAST. DODGE THE SPATULAS AND THE ROLLING TOMATO.',
    sky: { stops: ['#5CD6FF', '#BDF2FF', '#FFE9A8'], below: '#E0234E', toast: true, eggs: true },
    ground: { kind: 'waffle', a: '#F2B544', b: '#D98E2B', sea: { wave: '#FF5C7A' } },
    rail: { style: 'bacon', a: '#C7372F', b: '#F7B7A3' }, ribs: null,
    gate: { fill: '#E8A65A', alpha: 0.97, hatch: 'grill', ink: '#8A4B1C', edge: '#8A4B1C' },
    props: { kinds: ['toast', 'toast', 'jar', 'hoop'], every: [14, 26], u: [17, 46], float: false, size: [6, 12] },
  },
  {
    id: 'disco', name: 'DRAIN DISCO', fog: '#1B0B3A', fogAmt: 0.85,
    tip: 'LIME DRIP CURTAINS GOOP YOU. AQUA UPDRAFTS LIFT YOU.',
    sky: { stops: ['#12052B', '#3A0F6B', '#0E6B6B'], below: '#12052B', disco: true },
    ground: { kind: 'dance', base: '#5B1FA6', lights: [MAG, AQUA, YEL] },
    walls: { fill: '#2B1A4F', mortar: '#4A3478', pipe: '#B04CFF' },
    rail: { style: 'plain', a: '#B04CFF' }, ribs: { color: ORG, every: 30, shape: 'octagon' },
    gate: { fill: '#3B3F5C', alpha: 0.96, hatch: 'rivets', ink: '#9BA0C8', edge: '#23263A' },
    props: { kinds: ['discoball'], every: [110, 150], u: [0, 0], v: CFG.ceil - 2.6, float: false, size: [4.4, 5.2] },
  },
  {
    id: 'freezer', name: 'FREEZER BURN', fog: '#CFF3FF', fogAmt: 0.78,
    tip: 'RED FANS JAM WHEN GOOPED. LEAN INTO THE COLD GUSTS.',
    sky: { stops: ['#E9FBFF', '#9FE3FF', '#5AA8FF'], below: '#DDF6FF', bulb: true, shelves: true },
    ground: { kind: 'ice', scratch: '#9CCFE6', puddle: '#FF6FAE' }, net: '#3D7BFF',
    rail: { style: 'frost', a: '#3D7BFF' }, ribs: null,
    gate: { fill: '#2F6BD9', alpha: 0.92, hatch: 'cracks', ink: '#FFFFFF', edge: '#1D4FAA' },
    props: { kinds: ['popsicle', 'popsicle', 'pea', 'cube', 'carton'], every: [12, 24], u: [16, 44], float: false, size: [5, 11] },
  },
  {
    id: 'lava', name: 'LAVA LAMP LAGOON', fog: '#7A1FA0', fogAmt: 0.7,
    tip: 'THE WAX WINDOWS SLIDE. TIME YOUR LINE.',
    sky: { lava: true, cols: ['#3A0A5E', '#FF3D9A', '#FFB01F', '#FFE66B'] },
    ground: { kind: 'none' },
    rail: { style: 'chrome', a: '#D9DDEA', glint: ORG }, ribs: { color: '#7FF2FF', every: 40, shape: 'ring' },
    gate: { fill: '#FF7A1A', alpha: 0.95, hatch: 'blotch', ink: '#C94A0A', edge: '#A83A06' },
    props: { kinds: ['cap'], every: [40, 70], u: [18, 34], float: true, size: [4, 8] },
  },
  {
    id: 'cosmic', name: 'COSMIC DUMPSTER', fog: '#1B1464', fogAmt: 0.8,
    tip: 'AQUA FIELDS FLOAT YOU. RED LASERS BLINK: PICK THE DARK HALF.',
    sky: { stops: ['#050A2E', '#1B1464', '#0B5D7A'], below: '#050A2E', planet: true, duck: true, confetti: true },
    ground: { kind: 'lanes' },
    rail: { style: 'plain', a: '#B04CFF' }, ribs: { color: '#3D7BFF', every: 50, shape: 'lid' },
    gate: { fill: '#0FA3A3', alpha: 0.95, hatch: 'ridges', ink: '#086E6E', edge: '#065050' },
    props: { kinds: ['tv', 'cone', 'pizza', 'can', 'bag'], every: [9, 20], u: [15, 40], float: true, size: [3, 7] },
  },
  {
    id: 'showroom', name: 'THE SHOWROOM', fog: '#EEF2F7', fogAmt: 0.55,
    tip: 'A WHITE-TILE SHOWROOM WHERE NOTHING HAS EVER BEEN DIRTY. YET.',
    sky: { stops: ['#C9D2DE', '#EEF2F7', '#FFFFFF'], below: '#DCE3EC', spots: true },
    ground: { kind: 'tiles', a: '#FFFFFF', b: '#DCE3EC', grout: '#9AA6B8' },
    rail: { style: 'chrome', a: '#D9DDEA', glint: '#7FF2FF' }, ribs: { color: '#FFFFFF', every: 36, shape: 'octagon' },
    gate: { fill: '#2F3A4F', alpha: 0.96, hatch: 'ridges', ink: '#1A2232', edge: '#11151F' },
    props: { kinds: ['bottle', 'bucket', 'plinth'], every: [12, 22], u: [16, 40], float: false, size: [5, 10] },
  },
];
TRACKS.forEach((t, i) => { t.theme = THEMES[i]; t.name = THEMES[i].name; t.tip = THEMES[i].tip; });

// ============================================================================================
// TRACK_BUILDER — turns a track def into sorted "things" along s, hazard zones and a racing line
// ============================================================================================
let TRACK = null;

function weightedWith(rng, table) {
  let total = 0;
  for (const row of table) total += row[1];
  let r = rng() * total;
  for (const row of table) { r -= row[1]; if (r <= 0) return row[0]; }
  return table[table.length - 1][0];
}

function buildTrack(index, opts) {
  const def = TRACKS[index];
  const mirror = opts && opts.mirror ? -1 : 1;
  const diff = opts ? opts.diff : 1;
  const L = def.len;
  const rng = mulberry32(def.seed + (mirror < 0 ? 777 : 0));
  const r = (a, b) => a + (b - a) * rng();
  const toW = (list) => list.map(([a, k, p]) => [a, TAU * k / L, p]);
  const T = {
    index, def, L, mirror, curves: toW(def.curves), hills: toW(def.hills),
    things: [], zones: [], keys: [], lineU: null, lineV: null, scenery: [], stars: [],
  };
  const extra = mirror < 0 ? 0.8 : 0;
  const winW = def.win[0] + CFG.windowAdj[diff] - extra;
  const winH = def.win[1] + CFG.windowAdj[diff] * 0.6 - extra * 0.6;
  let cu = 0, cv = 6.5;
  const nextCentre = (w, h) => {
    cu = clamp(cu + r(-7, 7), -CFG.halfW + w / 2 + 0.6, CFG.halfW - w / 2 - 0.6);
    cv = clamp(cv + r(-4, 4), h / 2 + 0.8, CFG.ceil - h / 2 - 0.8);
    return [cu, cv];
  };
  const add = (t) => { t.decals = []; T.things.push(t); return t; };
  const gate = (s, more) => {
    const [u, v] = nextCentre(winW, winH);
    T.keys.push([s, u, v]);
    return add(Object.assign({ kind: 'gate', s, u, v, w: winW, h: winH, slide: 0, period: 2.4, phase: r(0, TAU) }, more || {}));
  };
  const hazards = def.hazards;
  let s = 160;
  let n = 0;
  const table = Object.entries(def.beats);
  while (!def.empty && s < L - 110) {
    let beat = n < 2 ? 'GATE' : weightedWith(rng, table);
    n++;
    switch (beat) {
      case 'GATE':
        gate(s, def.slide && rng() < 0.6 ? { slide: def.slide * r(0.6, 1) } : null);
        break;
      case 'DOUBLE':
        gate(s); gate(s + 30); s += 30;
        break;
      case 'PILLARS': {
        const off = r(-2.5, 2.5);
        const bars = [-8 + off, -2.6 + off, 2.6 + off, 8 + off].filter((u) => Math.abs(u) < CFG.halfW - 0.5).map((u) => ({ u, w: 1.8 }));
        const gaps = [];
        for (let i = 0; i <= bars.length; i++) {
          const a = i === 0 ? -CFG.halfW : bars[i - 1].u + bars[i - 1].w / 2;
          const b = i === bars.length ? CFG.halfW : bars[i].u - bars[i].w / 2;
          if (b - a > 2.6) gaps.push((a + b) / 2);
        }
        let best = gaps[0];
        for (const g of gaps) if (Math.abs(g - cu) < Math.abs(best - cu)) best = g;
        cu = best;
        T.keys.push([s, best, cv]);
        add({ kind: 'pillars', s, bars, gaps });
        break;
      }
      case 'RING_LINE': {
        const side = rng() < 0.5 ? -1 : 1;
        const ru = clamp(cu + side * r(3, 5), -9, 9), rv = clamp(cv + r(-2, 2.5), 2.5, 11.5);
        for (let i = 0; i < 3; i++) add({ kind: 'ring', s: s - 20 + i * 14, u: ru + side * i * 0.8, v: rv, r: CFG.ringR, spin: r(0, TAU) });
        break;
      }
      case 'CUBE_ROW': {
        const v = clamp(cv + r(-1.5, 1.5), 2.5, 11.5);
        const us = [-5.5, 0, 5.5].map((d) => clamp(cu + d, -10.5, 10.5));
        let far = 0;
        us.forEach((u, i) => { if (Math.abs(u - cu) > Math.abs(us[far] - cu)) far = i; });
        us.forEach((u, i) => add({ kind: 'cube', s: s - 25, u, v, gold: i === far, back: 0, spin: r(0, TAU) }));
        break;
      }
      case 'BALL_ARC': {
        const amp = r(2, 4.5), ph = r(0, TAU);
        for (let i = 0; i < 6; i++) add({ kind: 'coin', s: s - 35 + i * 7, u: clamp(cu + Math.sin(ph + i * 0.7) * amp, -10.5, 10.5), v: clamp(cv + Math.cos(ph + i * 0.5) * 1.5, 1.5, 12.5), back: 0 });
        break;
      }
      case 'BLOCKS': {
        const blocks = [];
        const bu = clamp(cu + r(-3, 3), -8, 8), bv = clamp(cv + r(-2, 2), 2.5, 11);
        for (const [du, dv] of [[-2.1, 0], [0, 0], [2.1, 0], [-1, 2.1], [1, 2.1], [0, -2.1]]) if (rng() < 0.8) blocks.push({ u: bu + du, v: bv + dv, hp: 1, s0: 1 });
        if (blocks.length) add({ kind: 'blocks', s: s - 18, blocks });
        gate(s + 10);
        s += 10;
        break;
      }
      case 'HAZARD': {
        const hz = hazards[Math.floor(rng() * hazards.length)];
        if (hz === 'paddle') gate(s, { paddle: { h: winH * 0.55, w: 1.2, speed: r(0.25, 0.4), phase: r(0, TAU) } });
        else if (hz === 'slider') gate(s, { slide: 3, period: r(2.2, 2.8) });
        else if (hz === 'ball') { add({ kind: 'ball', s, size: 2.6, v: clamp(cv, 3, 11), speed: r(7, 11), phase: r(0, TAU), vAmp: r(1, 2.5) }); }
        else if (hz === 'curtain') {
          const side = rng() < 0.5 ? -1 : 1;
          add({ kind: 'curtain', s, u0: side < 0 ? -CFG.halfW : 0.5, u1: side < 0 ? -0.5 : CFG.halfW, on: 1.2, off: 1.2, phase: r(0, 2.4) });
          cu = clamp(-side * 6, -8, 8);
          T.keys.push([s, cu, cv]);
        } else if (hz === 'updraft') {
          const uc = clamp(cu + r(-4, 4), -8, 8);
          T.zones.push({ kind: 'updraft', s0: s - 25, s1: s + 25, u0: uc - 3.5, u1: uc + 3.5, lift: 50 });
          gate(s + 32, null);
          s += 32;
        } else if (hz === 'wind') {
          T.zones.push({ kind: 'wind', s0: s - 30, s1: s + 40, dir: rng() < 0.5 ? -1 : 1, accel: 6 });
          gate(s + 10, null);
          s += 10;
        } else if (hz === 'rotor') {
          const v = clamp(cv, 4.5, 9.5);
          const ang = r(0, TAU);
          add({ kind: 'rotor', s, u: clamp(cu * 0.5, -4, 4), v, len: 6.2, w: 1.1, speed: r(0.22, 0.3) * TAU * (rng() < 0.5 ? -1 : 1), angle: ang, spun: ang, jam: 0 });
          T.keys.push([s, clamp(cu * 0.5, -4, 4) + 7.5, v]);
          cu = clamp(cu * 0.5, -4, 4) + 7.5;
        } else if (hz === 'lowg') {
          T.zones.push({ kind: 'lowg', s0: s - 40, s1: s + 70 });
          gate(s + 15, null);
          s += 15;
        } else if (hz === 'laser') {
          add({ kind: 'laser', s, period: 0.9, phase: r(0, 1.8), split: clamp(cv, 4, 10) });
          T.keys.push([s, cu, cv]);
        }
        break;
      }
      default: // BREATHER
        s += 20;
        break;
    }
    s += def.spacing * r(0.92, 1.15);
  }
  T.things.sort((a, b) => a.s - b.s);
  T.zones.sort((a, b) => a.s0 - b.s0);
  // The racing line: smooth interpolation through every window centre; the net is drawn on it.
  const keys = T.keys.slice().sort((a, b) => a[0] - b[0]);
  if (!keys.length) keys.push([0, 0, 6]);
  const N = Math.ceil(L / 2);
  T.lineU = new Float32Array(N); T.lineV = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const s0 = i * 2;
    let k = keys.findIndex((kk) => kk[0] > s0);
    const b = k === -1 ? keys[0] : keys[k];
    const a = k === -1 ? keys[keys.length - 1] : k === 0 ? keys[keys.length - 1] : keys[k - 1];
    let sa = a[0], sb = b[0];
    if (sa > s0) sa -= L;
    if (sb < s0) sb += L;
    const t = sb === sa ? 0 : smooth01((s0 - sa) / (sb - sa));
    T.lineU[i] = lerp(a[1], b[1], t);
    T.lineV[i] = lerp(a[2], b[2], t);
  }
  // Props: this world's scenery beside the corridor (standing on the ground, or floating in space).
  const pr = def.theme.props;
  if (pr) {
    for (let s2 = 0; s2 < L; s2 += r(pr.every[0], pr.every[1])) {
      const side = rng() < 0.5 ? -1 : 1;
      const kind = pr.kinds[Math.floor(rng() * pr.kinds.length)];
      T.scenery.push({ s: s2, u: side * r(pr.u[0], pr.u[1]), v: pr.v != null ? pr.v : pr.float ? r(-3, 20) : 0, size: r(pr.size[0], pr.size[1]), kind, seed: Math.floor(rng() * 1e6), spin: r(-1, 1) });
    }
  }
  return T;
}
// Spatial gap from race distance a to b along the looping track, in [-L/2, L/2): positive when b
// is physically ahead. Lapped racers share the same stretch of track, so every proximity check uses it.
function gap(a, b) {
  const L = TRACK.L;
  let d = (b - a) % L;
  if (d >= L / 2) d -= L; else if (d < -L / 2) d += L;
  return d;
}
function lineUAt(s) { const T = TRACK; return T.lineU[Math.floor(wrap(s, T.L) / 2) % T.lineU.length]; }
function lineVAt(s) { const T = TRACK; return T.lineV[Math.floor(wrap(s, T.L) / 2) % T.lineV.length]; }

// Track centre-line geometry (periodic, so laps join seamlessly).
function cxAt(s) { let x = 0; for (const c of TRACK.curves) x += c[0] * Math.sin(c[1] * s + c[2]); return x * TRACK.mirror; }
function cxD(s) { let x = 0; for (const c of TRACK.curves) x += c[0] * c[1] * Math.cos(c[1] * s + c[2]); return x * TRACK.mirror; }
function cxDD(s) { let x = 0; for (const c of TRACK.curves) x -= c[0] * c[1] * c[1] * Math.sin(c[1] * s + c[2]); return x * TRACK.mirror; }
function cyAt(s) { let y = 0; for (const c of TRACK.hills) y += c[0] * Math.sin(c[1] * s + c[2]); return y; }
function cyD(s) { let y = 0; for (const c of TRACK.hills) y += c[0] * c[1] * Math.cos(c[1] * s + c[2]); return y; }
function cyDD(s) { let y = 0; for (const c of TRACK.hills) y -= c[0] * c[1] * c[1] * Math.sin(c[1] * s + c[2]); return y; }

// Window centre of a gate at time t (sliding windows move sideways).
function gateCentreU(g, t) { return g.slide ? clamp(g.u + Math.sin(t * TAU / g.period + g.phase) * g.slide, -CFG.halfW + g.w / 2, CFG.halfW - g.w / 2) : g.u; }
function paddleU(g, t) { return gateCentreU(g, t) + Math.sin(t * TAU * g.paddle.speed + g.paddle.phase) * (g.w / 2 - g.paddle.w / 2); }
function ballPos(b, t) {
  const span = CFG.halfW - b.size / 2;
  const p = wrap(t * b.speed / (2 * span) + b.phase, 2);   // triangle wave: a Pong ball bouncing wall to wall
  const u = -span + (p < 1 ? p : 2 - p) * 2 * span;
  return [u, b.v + Math.sin(t * 1.7 + b.phase) * b.vAmp];
}
function curtainOn(c, t) { return wrap(t + c.phase, c.on + c.off) < c.on; }
function laserState(l, t) {
  // 0: top half lit, 1: bottom half lit; warn: last 0.25 s before the switch
  const p = wrap(t + l.phase, l.period * 2);
  const half = p < l.period ? 0 : 1;
  const warn = (p % l.period) > l.period - 0.25;
  return { half, warn };
}
// Does a racer at (u, v) crossing thing th at time t hit it? Returns 'bonk', 'goop' or null.
function thingBlocks(th, u, v, t) {
  const h = CFG.hit;
  switch (th.kind) {
    case 'gate': {
      const cu = gateCentreU(th, t);
      const inside = Math.abs(u - cu) < th.w / 2 - h * 0.6 && Math.abs(v - th.v) < th.h / 2 - h * 0.6;
      if (!inside) return 'bonk';
      if (th.paddle) {
        const pu = paddleU(th, t);
        if (Math.abs(u - pu) < th.paddle.w / 2 + h && Math.abs(v - th.v) < th.paddle.h / 2 + h) return 'bonk';
      }
      return null;
    }
    case 'pillars':
      for (const b of th.bars) if (Math.abs(u - b.u) < b.w / 2 + h * 0.7) return 'bonk';
      return null;
    case 'blocks':
      for (const b of th.blocks) if (b.hp > 0 && Math.abs(u - b.u) < 1 + h && Math.abs(v - b.v) < 1 + h) return 'bonk';
      return null;
    case 'ball': {
      const [bu, bv] = ballPos(th, t);
      return Math.abs(u - bu) < th.size / 2 + h && Math.abs(v - bv) < th.size / 2 + h ? 'bonk' : null;
    }
    case 'rotor': {
      for (let k = 0; k < 2; k++) {
        const a = th.spun + k * Math.PI / 2;
        const dx = Math.cos(a), dy = Math.sin(a);
        const px = u - th.u, py = v - th.v;
        const along = px * dx + py * dy;
        const perp = Math.abs(-px * dy + py * dx);
        if (Math.abs(along) < th.len && perp < th.w / 2 + h * 0.8) return 'bonk';
      }
      return null;
    }
    case 'curtain':
      return curtainOn(th, t) && u > th.u0 - h && u < th.u1 + h ? 'goop' : null;
    case 'laser': {
      const st = laserState(th, t);
      const top = v > th.split;
      return (st.half === 0 && top) || (st.half === 1 && !top) ? 'bonk' : null;
    }
    default:
      return null;
  }
}

// Where an AI racer should aim to pass thing th, arriving at time t.
function thingAim(th, u, v, t) {
  switch (th.kind) {
    case 'gate': {
      let au = gateCentreU(th, t), av = th.v;
      if (th.paddle) {
        const pu = paddleU(th, t);
        au = pu > au ? au - th.w * 0.28 : au + th.w * 0.28;
      }
      return [au, av];
    }
    case 'pillars': {
      let best = th.gaps[0];
      for (const g of th.gaps) if (Math.abs(g - u) < Math.abs(best - u)) best = g;
      return [best, v];
    }
    case 'blocks': {
      // aim at the side with the most room
      const lo = Math.min(...th.blocks.filter((b) => b.hp > 0).map((b) => b.u), 99);
      const hi = Math.max(...th.blocks.filter((b) => b.hp > 0).map((b) => b.u), -99);
      if (lo > 90) return null;
      return [lo + 12 > CFG.halfW - hi ? lo - 3.5 : hi + 3.5, v];
    }
    case 'ball': {
      const [bu] = ballPos(th, t);
      return [bu > 0 ? bu - 6 : bu + 6, v];
    }
    case 'rotor': {
      const a = th.spun + th.speed * (t - world.t) + Math.PI / 4;   // the gap between blades when we arrive
      return [th.u + Math.cos(a) * th.len * 0.75, th.v + Math.sin(a) * th.len * 0.75];
    }
    case 'curtain':
      return [th.u0 < 0 ? 6 : -6, v];   // always take the dry side
    case 'laser': {
      const st = laserState(th, t);
      return [u, st.half === 0 ? th.split * 0.5 : (th.split + CFG.ceil) / 2];
    }
    default:
      return null;
  }
}
