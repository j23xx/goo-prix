// GOO PRIX · src/corridor.js — Grounds, walls, rails, ribs, the racing line and the props.
'use strict';

// ============================================================================================
// CORRIDOR_RENDER — each world's ground, walls, rails and ribs, the racing line and the props
// ============================================================================================
const BANDS = [0, 18, 40, 75, 125, 185, 261];
function bandOf(dz) { let b = 0; while (b < BANDS.length - 2 && dz >= BANDS[b + 1]) b++; return b; }
function bandMid(b) { return (BANDS[b] + BANDS[b + 1]) / 2; }
function bandPaths() { const ps = []; for (let b = 0; b < BANDS.length - 1; b++) ps.push(new Path2D()); return ps; }
function floorQuad(c, dz0, dz1, u0, u1, v) {
  projectDz(dz0, u0, v, PT); c.moveTo(PT.x, PT.y);
  projectDz(dz0, u1, v, PT); c.lineTo(PT.x, PT.y);
  projectDz(dz1, u1, v, PT); c.lineTo(PT.x, PT.y);
  projectDz(dz1, u0, v, PT); c.lineTo(PT.x, PT.y);
  c.closePath();
}
function wallQuad(c, dz0, dz1, u, v0, v1) {
  projectDz(dz0, u, v0, PT); c.moveTo(PT.x, PT.y);
  projectDz(dz0, u, v1, PT); c.lineTo(PT.x, PT.y);
  projectDz(dz1, u, v1, PT); c.lineTo(PT.x, PT.y);
  projectDz(dz1, u, v0, PT); c.lineTo(PT.x, PT.y);
  c.closePath();
}

// Floor tiles inside the corridor: waffle squares, or a dance floor that flashes on the kick drum.
function drawTiles(c, gr, t) {
  const s0 = cam.s, tile = 4, hw = CFG.halfW;
  const first = Math.ceil((s0 + CFG.near + 0.5) / tile), last = Math.floor((s0 + CFG.far * 0.8) / tile);
  const beat = Math.floor(t * TRACK.def.song.bpm / 60);
  for (let i = last; i >= first; i--) {
    const dzA = i * tile - s0, dzB = dzA + tile;
    c.fillStyle = col(gr.kind === 'waffle' ? gr.b : gr.base, dzA);
    c.beginPath(); floorQuad(c, dzA, dzB, -hw, hw, 0); c.fill();
    if (gr.kind === 'waffle') {
      c.fillStyle = col(gr.a, dzA);
      c.beginPath();
      for (let j = 0; j < 6; j++) if ((i + j) & 1) floorQuad(c, dzA + 0.4, dzB - 0.4, -hw + j * 4 + 0.4, -hw + j * 4 + 3.6, 0.01);
      c.fill();
    } else {
      for (let j = 0; j < 6; j++) {
        const hsh = (Math.imul(i * 31 + j * 17 + beat * 13, 2654435761) >>> 0) % 7;
        if (hsh > 2) continue;
        c.fillStyle = col(gr.lights[hsh], dzA, 0.9);
        c.beginPath(); floorQuad(c, dzA + 0.3, dzB - 0.3, -hw + j * 4 + 0.3, -hw + j * 4 + 3.7, 0.01); c.fill();
      }
    }
  }
}
// Breakfast Bay's jam sea: wavy bands rolling toward you across the whole width.
function drawJamWaves(c, gr, t) {
  const s0 = cam.s, step = 9;
  const first = Math.ceil((s0 + 4) / step), last = Math.floor((s0 + CFG.far) / step);
  for (let i = last; i >= first; i--) {
    const dz = i * step - s0 - wrap(t * 6, step);
    if (dz < 3) continue;
    c.beginPath();
    for (let u = -90; u <= 90; u += 6) {
      projectDz(dz + Math.sin(u * 0.15 + i) * 1.2, u, 0, PT);
      if (u === -90) c.moveTo(PT.x, PT.y); else c.lineTo(PT.x, PT.y);
    }
    c.lineWidth = clamp(PT.k * 0.4, 1, 7); c.strokeStyle = col(gr.wave, dz); c.stroke();
  }
}
// Freezer Burn's ice sheet: skate scratches and pink popsicle-melt puddles.
function drawIce(c, gr) {
  const s0 = cam.s, step = 10;
  const first = Math.ceil((s0 + 3) / step), last = Math.floor((s0 + CFG.far) / step);
  for (let i = last; i >= first; i--) {
    const dz = i * step - s0;
    const r = mulberry32(i * 977);
    c.beginPath();
    for (let k = 0; k < 5; k++) {
      const u = r() * 120 - 60, d0 = dz + r() * step, len = 3 + r() * 6;
      seg3(c, d0, u, 0, d0 + len, u + len * (r() < 0.5 ? -1.2 : 1.2), 0);
    }
    c.lineWidth = clamp(projectDz(dz, 0, 0, PT).k * 0.06, 1, 3); c.strokeStyle = col(gr.scratch, dz); c.stroke();
    if (r() < 0.35) {
      const u = r() * 80 - 40;
      c.beginPath();
      for (let k = 0; k <= 12; k++) { const a = k / 12 * TAU; projectDz(dz + 2 + Math.sin(a) * 2.2, u + Math.cos(a) * 3.2, 0, PT); if (k === 0) c.moveTo(PT.x, PT.y); else c.lineTo(PT.x, PT.y); }
      c.fillStyle = col(gr.puddle, dz, 0.75); c.fill();
    }
  }
}
// Drain Disco's brick walls, with pipe mouths dribbling purple sludge.
function drawBrickWalls(c, wl, t) {
  const s0 = cam.s, len = 8, hw = CFG.halfW, ch = CFG.ceil;
  const first = Math.floor((s0 + 1) / len), last = Math.floor((s0 + CFG.far * 0.8) / len);
  for (let i = last; i >= first; i--) {
    const dzA = Math.max(CFG.near + 0.3, i * len - s0), dzB = i * len + len - s0;
    if (dzB <= CFG.near + 0.5) continue;
    for (const side of [-1, 1]) {
      const u = side * hw;
      c.beginPath(); wallQuad(c, dzA, dzB, u, 0, ch); c.fillStyle = col(wl.fill, dzA); c.fill();
      if (dzA < 140) {
        c.beginPath();
        for (let v = 1.5; v < ch; v += 1.5) seg3(c, dzA, u, v, dzB, u, v);
        for (let v = 0; v < ch; v += 1.5) { const off = (Math.round(v / 1.5) % 2) * 2; for (let d = dzA + off; d < dzB; d += 4) seg3(c, d, u, v, d, u, v + 1.5); }
        c.lineWidth = 1.2; c.strokeStyle = col(wl.mortar, dzA); c.stroke();
      }
      if (i % 3 === 0 && dzA < 160) {
        const dm = (dzA + dzB) / 2, vv = 5 + (i % 2) * 3;
        c.beginPath();
        for (let k = 0; k <= 12; k++) { const a = k / 12 * TAU; projectDz(dm + Math.cos(a) * 1.6, u, vv + Math.sin(a) * 1.6, PT); if (k === 0) c.moveTo(PT.x, PT.y); else c.lineTo(PT.x, PT.y); }
        c.fillStyle = col(INK, dm); c.fill(); c.lineWidth = clamp(PT.k * 0.25, 1.5, 6); c.strokeStyle = col('#8C91B8', dm); c.stroke();
        const drip = (t * 3 + i) % 1;
        c.beginPath(); seg3(c, dm, u, vv - 1.6, dm, u, Math.max(0, vv - 1.6 - drip * 4));
        c.lineWidth = clamp(PT.k * 0.5, 2, 10); c.strokeStyle = col(wl.pipe, dm); c.stroke();
      }
    }
  }
}

const SEG_STEP = 4;
function drawCorridor(c, T) {
  const th = THEME, s0 = cam.s, hw = CFG.halfW, ch = CFG.ceil, t = world.t;
  const startI = Math.ceil((s0 + CFG.near) / SEG_STEP), endI = Math.floor((s0 + CFG.far) / SEG_STEP);
  const gr = th.ground;
  if (gr.sea) drawJamWaves(c, gr.sea, t);
  if (gr.kind === 'ice') drawIce(c, gr);
  if (gr.kind === 'waffle' || gr.kind === 'dance') drawTiles(c, gr, t);
  if (th.walls) drawBrickWalls(c, th.walls, t);
  // rails along the floor and ceiling edges, one path per distance band, styled per world
  const rail = th.rail, floorP = bandPaths(), ceilP = bandPaths();
  for (let i = startI; i < endI; i++) {
    const dzA = i * SEG_STEP - s0, dzB = dzA + SEG_STEP, b = bandOf(dzA);
    for (const side of [-1, 1]) {
      const u = side * hw;
      if (rail.style === 'bacon') {
        const w0 = Math.sin((i * SEG_STEP) * 0.5) * 0.3, w1 = Math.sin((i * SEG_STEP + SEG_STEP) * 0.5) * 0.3;
        seg3(floorP[b], dzA, u, 0.4 + w0, dzB, u, 0.4 + w1);
      } else if (gr.kind !== 'none' || rail.style === 'plain') seg3(floorP[b], dzA, u, 0, dzB, u, 0);
      seg3(ceilP[b], dzA, u, ch, dzB, u, ch);
    }
  }
  for (let b = floorP.length - 1; b >= 0; b--) {
    const mid = bandMid(b), lw = b < 2 ? 7 : b < 4 ? 4 : 2;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (rail.style === 'bacon') {
      c.lineWidth = lw * 1.8 + 3; c.strokeStyle = col(INK, mid); c.stroke(floorP[b]);
      c.lineWidth = lw * 1.8; c.strokeStyle = col(rail.a, mid); c.stroke(floorP[b]);
      c.lineWidth = lw * 0.6; c.strokeStyle = col(rail.b, mid); c.stroke(floorP[b]);
      c.lineWidth = Math.max(1, lw * 0.4); c.strokeStyle = col(rail.b, mid, 0.6); c.stroke(ceilP[b]);
    } else if (rail.style === 'chrome') {
      for (const p of [floorP[b], ceilP[b]]) {
        c.lineWidth = lw + 3; c.strokeStyle = col(INK, mid); c.stroke(p);
        c.lineWidth = lw; c.strokeStyle = col(rail.a, mid); c.stroke(p);
        c.lineWidth = Math.max(1, lw * 0.3); c.strokeStyle = col(rail.glint, mid); c.stroke(p);
      }
    } else {
      for (const p of [floorP[b], ceilP[b]]) {
        c.lineWidth = lw + 3; c.strokeStyle = col(INK, mid, 0.8); c.stroke(p);
        c.lineWidth = lw; c.strokeStyle = col(rail.a, mid); c.stroke(p);
      }
    }
  }
  if (rail.style === 'frost') {
    // an icicle fringe hanging off the ceiling rails
    c.beginPath();
    for (let i = startI; i < Math.min(endI, startI + 24); i++) {
      const dz = i * SEG_STEP - s0;
      if (dz < CFG.near + 0.5) continue;
      for (const side of [-1, 1]) for (const f of [0, 0.5]) {
        const d = dz + f * SEG_STEP, u = side * hw, len = 0.8 + ((i * 7 + f * 10) % 3) * 0.4;
        projectDz(d - 0.3, u, ch, PT); c.moveTo(PT.x, PT.y);
        projectDz(d, u, ch - len, PT); c.lineTo(PT.x, PT.y);
        projectDz(d + 0.3, u, ch, PT); c.lineTo(PT.x, PT.y);
      }
    }
    c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#7FB6FF'; c.stroke();
  }
  // floating dotted lane lines (Cosmic Dumpster has no floor at all)
  if (gr.kind === 'lanes') {
    for (let i = endI; i >= startI; i--) {
      const dz = i * SEG_STEP - s0;
      if (dz < CFG.near + 0.5) continue;
      for (const side of [-1, 1]) {
        projectDz(dz, side * hw, 0, PT);
        const s = clamp(PT.k * 0.45, 2, 12);
        c.fillStyle = col(rail.a, dz); c.fillRect(PT.x - s / 2, PT.y - s / 2, s, s);
      }
    }
  }
  // ribs: octagonal pipe hoops, glass rings or riveted dumpster-lid frames across the corridor
  if (th.ribs) {
    const rb = th.ribs;
    const first = Math.ceil((s0 + 4) / rb.every) * rb.every;
    for (let s = first + Math.floor((CFG.far - 4) / rb.every) * rb.every; s >= first; s -= rb.every) {
      const dz = s - s0;
      if (dz > CFG.far) continue;
      const S = slabAt(dz);
      const lw = clamp(S.k * 0.35, 1.5, 14);
      c.beginPath();
      if (rb.shape === 'octagon') {
        const k = 3.2, pts = [[-hw + k, 0], [hw - k, 0], [hw, k], [hw, ch - k], [hw - k, ch], [-hw + k, ch], [-hw, ch - k], [-hw, k]];
        pts.forEach(([u, v], i) => (i ? c.lineTo(sx(S, u, v), sy(S, u, v)) : c.moveTo(sx(S, u, v), sy(S, u, v))));
        c.closePath(); inkStroke(c, col(rb.color, dz), lw);
      } else if (rb.shape === 'ring') {
        for (let k = 0; k <= 32; k++) { const a = k / 32 * TAU; const u = Math.cos(a) * 13.5, v = ch / 2 + Math.sin(a) * 9.5; if (k === 0) c.moveTo(sx(S, u, v), sy(S, u, v)); else c.lineTo(sx(S, u, v), sy(S, u, v)); }
        c.globalAlpha = 0.85; c.lineWidth = lw * 0.6; c.strokeStyle = col(rb.color, dz); c.stroke();
        c.lineWidth = Math.max(1, lw * 0.18); c.strokeStyle = '#FFFFFF'; c.stroke(); c.globalAlpha = 1;
      } else {
        slabRect(c, S, -hw, 0, hw, ch); inkStroke(c, col(rb.color, dz), lw);
        if (dz < 120) {
          c.fillStyle = col(CREAM, dz);
          const rs = Math.max(2, S.k * 0.3);
          for (let u = -hw + 1.5; u < hw; u += 3) { c.fillRect(sx(S, u, ch) - rs / 2, sy(S, u, ch) - rs / 2, rs, rs); c.fillRect(sx(S, u, 0) - rs / 2, sy(S, u, 0) - rs / 2, rs, rs); }
        }
      }
    }
  }
  // the dashed racing line, in cream
  for (let i = endI; i >= startI; i--) {
    if (i % 2) continue;
    const sA = i * SEG_STEP, dzA = sA - s0, dzB = dzA + SEG_STEP * 0.9;
    if (dzA < CFG.near) continue;
    const uA = lineUAt(sA), uB = lineUAt(sA + SEG_STEP * 0.9);
    const v = gr.kind === 'none' || gr.kind === 'lanes' ? 0 : 0.04;
    c.beginPath();
    projectDz(dzA, uA - 0.34, v, PT); c.moveTo(PT.x, PT.y);
    projectDz(dzA, uA + 0.34, v, PT); c.lineTo(PT.x, PT.y);
    projectDz(dzB, uB + 0.34, v, PT); c.lineTo(PT.x, PT.y);
    projectDz(dzB, uB - 0.34, v, PT); c.lineTo(PT.x, PT.y);
    c.closePath();
    c.fillStyle = col(th.net || CREAM, dzA); c.fill();
    if (dzA < 60) { c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
  }
  // start / finish: a cream and ink chequered strip with a gold arch
  for (let lap = 0; lap < 2; lap++) {
    const dz = relDz(lap * T.L);
    if (dz < CFG.near || dz > CFG.far) continue;
    for (let j = 0; j < 12; j++) for (let row = 0; row < 2; row++) {
      c.fillStyle = (j + row) & 1 ? col(INK, dz) : col(CREAM, dz);
      c.beginPath(); floorQuad(c, dz + row * 1.2, dz + row * 1.2 + 1.2, -hw + j * 2, -hw + j * 2 + 2, 0.02); c.fill();
    }
    const S = slabAt(dz);
    c.beginPath(); slabRect(c, S, -hw, 0, hw, ch);
    inkStroke(c, col(YEL, dz), clamp(S.k * 0.3, 2, 12));
  }
}

// ---- props: the world's scenery, drawn as fat-outlined cartoon billboards beside the corridor
function drawScenery(c, T, list) {
  for (const pr of T.scenery) {
    const dz = relDz(pr.s);
    if (dz < 4 || dz > CFG.far) continue;
    list.push({ dz, draw: drawProp, o: pr });
  }
}
function drawProp(c, pr, dz) {
  const t = world.t;
  projectDz(dz, pr.u, pr.v, PT);
  const k = PT.k, s = pr.size * k;
  if (s < 2) return;
  const x = PT.x, y = PT.y, lw = clamp(s * 0.05, 1, 5);
  c.save(); c.translate(x, y); c.rotate(cam.roll + (pr.v && pr.kind !== 'discoball' ? Math.sin(t * 0.5 + pr.seed) * 0.4 * pr.spin : 0));
  c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = INK;
  const f = (hex) => col(hex, dz);
  switch (pr.kind) {
    case 'discoball': { // hanging from the pipe roof, facets spinning and glinting
      const r = s * 0.5;
      c.beginPath(); c.moveTo(0, -r); c.lineTo(0, -r - s * 0.6); c.lineWidth = Math.max(1, lw * 0.6); c.strokeStyle = f('#D9DDEA'); c.stroke();
      c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
      c.fillStyle = f('#5A5AD0'); c.fillRect(-r, -r, r * 2, r * 2);
      for (let row = -4; row <= 4; row++) {
        const lat = row / 4.5 * (Math.PI / 2), yy = Math.sin(lat) * r, rr = Math.cos(lat) * r;
        for (let k2 = 0; k2 < 12; k2++) {
          const lon = t * 0.9 + pr.seed + k2 * TAU / 12;
          if (Math.cos(lon) < 0) continue;
          const tw = Math.max(1, Math.cos(lon) * rr * 0.45);
          const flick = (k2 * 7 + row * 3 + Math.floor(t * 8)) % 9;
          c.fillStyle = flick === 0 ? '#FFFFFF' : f((k2 + row) % 2 ? '#D9DDEA' : '#8C8CFF');
          c.fillRect(Math.sin(lon) * rr - tw / 2, yy - r * 0.09, tw, r * 0.18);
        }
      }
      c.restore();
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
      break;
    }
    case 'toast': { // a stack of toast slices
      const n = 2 + pr.seed % 3;
      for (let i = 0; i < n; i++) {
        const yy = -i * s * 0.32;
        c.beginPath(); c.roundRect(-s * 0.4, yy - s * 0.42, s * 0.8, s * 0.42, [s * 0.16, s * 0.16, s * 0.04, s * 0.04]);
        c.fillStyle = f('#B36B2C'); c.fill(); c.stroke();
        c.beginPath(); c.roundRect(-s * 0.32, yy - s * 0.36, s * 0.64, s * 0.32, s * 0.1); c.fillStyle = f('#E8A65A'); c.fill();
      }
      break;
    }
    case 'jar': {
      c.beginPath(); c.roundRect(-s * 0.3, -s * 0.8, s * 0.6, s * 0.8, s * 0.08); c.fillStyle = f('#E0234E'); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(-s * 0.36, -s * 0.98, s * 0.72, s * 0.2, s * 0.05); c.fillStyle = f('#FFFFFF'); c.fill(); c.stroke();
      c.fillStyle = f('#FF5C7A');
      for (let i = 0; i < 4; i++) c.fillRect(-s * 0.34 + i * s * 0.18, -s * 0.96, s * 0.09, s * 0.16);
      c.fillStyle = f('#FFFFFF'); c.fillRect(-s * 0.2, -s * 0.6, s * 0.08, s * 0.3);
      break;
    }
    case 'hoop': { // a giant cereal hoop standing in the jam
      c.beginPath(); c.arc(0, -s * 0.6, s * 0.55, 0, TAU);
      c.lineWidth = s * 0.26 + 4; c.strokeStyle = INK; c.stroke();
      c.lineWidth = s * 0.26; c.strokeStyle = f(pr.seed % 2 ? '#FF8A3D' : '#7B5CFF'); c.stroke();
      break;
    }
    case 'popsicle': {
      c.beginPath(); c.roundRect(-s * 0.06, -s * 0.3, s * 0.12, s * 0.3, s * 0.04); c.fillStyle = f('#E8C88A'); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(-s * 0.26, -s * 1.1, s * 0.52, s * 0.82, [s * 0.24, s * 0.24, s * 0.06, s * 0.06]);
      c.fillStyle = f(['#FF6FAE', '#FF9F1C', '#7B5CFF'][pr.seed % 3]); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(-s * 0.16, -s * 0.98, s * 0.08, s * 0.5);
      break;
    }
    case 'pea': {
      c.beginPath(); c.arc(0, -s * 0.45, s * 0.45, 0, TAU); c.fillStyle = f('#18A558'); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.arc(-s * 0.15, -s * 0.62, s * 0.1, 0, TAU); c.fill();
      break;
    }
    case 'cube': {
      c.beginPath(); c.roundRect(-s * 0.4, -s * 0.8, s * 0.8, s * 0.8, s * 0.1); c.fillStyle = 'rgba(214,244,255,0.7)'; c.fill(); c.stroke();
      c.strokeStyle = '#FFFFFF'; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(-s * 0.25, -s * 0.66); c.lineTo(s * 0.05, -s * 0.66); c.stroke();
      break;
    }
    case 'carton': {
      c.beginPath(); c.rect(-s * 0.3, -s * 0.9, s * 0.6, s * 0.9); c.fillStyle = f('#FFFFFF'); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.3, -s * 0.9); c.lineTo(0, -s * 1.15); c.lineTo(s * 0.3, -s * 0.9); c.closePath(); c.fillStyle = f('#3D7BFF'); c.fill(); c.stroke();
      c.fillStyle = f('#3D7BFF'); c.fillRect(-s * 0.3, -s * 0.5, s * 0.6, s * 0.16);
      break;
    }
    case 'cap': { // a chrome lava-lamp cap drifting in the wax
      c.beginPath(); c.moveTo(-s * 0.35, 0); c.lineTo(-s * 0.18, -s * 0.8); c.lineTo(s * 0.18, -s * 0.8); c.lineTo(s * 0.35, 0); c.closePath();
      c.fillStyle = f('#D9DDEA'); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(-s * 0.12, -s * 0.7, s * 0.06, s * 0.6);
      break;
    }
    case 'tv': { // a tumbling old telly with static on screen
      c.beginPath(); c.roundRect(-s * 0.5, -s * 0.4, s, s * 0.8, s * 0.1); c.fillStyle = f('#0FA3A3'); c.fill(); c.stroke();
      c.fillStyle = f('#0B0B12'); c.fillRect(-s * 0.38, -s * 0.28, s * 0.56, s * 0.56);
      const r = mulberry32(Math.floor(t * 20) + pr.seed);
      for (let i = 0; i < 18; i++) { c.fillStyle = r() < 0.5 ? '#FFFFFF' : '#8C8C94'; c.fillRect(-s * 0.36 + r() * s * 0.5, -s * 0.26 + r() * s * 0.5, s * 0.06, s * 0.03); }
      c.beginPath(); c.moveTo(-s * 0.2, -s * 0.4); c.lineTo(-s * 0.35, -s * 0.7); c.moveTo(s * 0.1, -s * 0.4); c.lineTo(s * 0.3, -s * 0.72); c.stroke();
      break;
    }
    case 'cone': {
      c.beginPath(); c.moveTo(-s * 0.32, 0); c.lineTo(0, -s * 0.9); c.lineTo(s * 0.32, 0); c.closePath(); c.fillStyle = f('#FF730D'); c.fill(); c.stroke();
      c.fillStyle = f('#FFFFFF'); c.fillRect(-s * 0.16, -s * 0.5, s * 0.32, s * 0.12);
      break;
    }
    case 'pizza': {
      c.beginPath(); c.rect(-s * 0.5, -s * 0.12, s, s * 0.24); c.fillStyle = f('#E8C88A'); c.fill(); c.stroke();
      c.fillStyle = f(RED); c.beginPath(); c.arc(0, 0, s * 0.08, 0, TAU); c.fill();
      break;
    }
    case 'can': {
      c.beginPath(); c.roundRect(-s * 0.25, -s * 0.7, s * 0.5, s * 0.7, s * 0.08); c.fillStyle = f('#D9DDEA'); c.fill(); c.stroke();
      c.fillStyle = f(MAG); c.fillRect(-s * 0.25, -s * 0.5, s * 0.5, s * 0.25);
      break;
    }
    case 'bag': {
      c.beginPath(); c.ellipse(0, -s * 0.4, s * 0.42, s * 0.36, 0, 0, TAU); c.fillStyle = f('#2B2B3A'); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.1, -s * 0.74); c.lineTo(0, -s * 0.9); c.lineTo(s * 0.1, -s * 0.74); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.ellipse(-s * 0.15, -s * 0.52, s * 0.08, s * 0.14, 0.4, 0, TAU); c.fill();
      break;
    }
  }
  c.restore();
}
