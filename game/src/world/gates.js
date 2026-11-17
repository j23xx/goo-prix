// GOO PRIX · src/world/gates.js — Gates with icing-rim windows, hazards and pickups.
'use strict';

// ============================================================================================
// GATES_HAZARDS — update the moving parts and draw gates, pillars, rotors, lasers and pickups
// ============================================================================================
function updateThings(T, t, dt) {
  for (const th of T.things) {
    if (th.kind === 'rotor') {
      if (th.jam > 0) th.jam -= dt; else th.spun += th.speed * dt;
    }
    if ((th.kind === 'cube' || th.kind === 'coin') && th.back > 0) th.back -= dt;
  }
}

function queueThings(T, list, t) {
  let solid = 0;
  for (const th of T.things) {
    const dz = relDz(th.s);
    if (dz < CFG.near || dz > CFG.far) continue;
    list.push({ dz, draw: drawThing, o: th });
  }
  // the next 3 blocking things are drawn solid, the rest as outlines
  const sorted = list.filter((d) => d.o && d.o.kind && (d.o.kind === 'gate' || d.o.kind === 'pillars')).sort((a, b) => a.dz - b.dz);
  for (const d of sorted) d.solid = solid++ < 3;
}

function drawThing(c, th, dz, item) {
  switch (th.kind) {
    case 'gate': drawGate(c, th, dz, item.solid); break;
    case 'pillars': drawPillars(c, th, dz, item.solid); break;
    case 'blocks': drawBlocks(c, th, dz); break;
    case 'ring': drawRing(c, th, dz); break;
    case 'cube': if (!(th.back > 0)) drawCube(c, th, dz); break;
    case 'coin': if (!(th.back > 0)) drawCoin(c, th, dz); break;
    case 'ball': drawBall(c, th, dz); break;
    case 'rotor': drawRotor(c, th, dz); break;
    case 'curtain': drawCurtain(c, th, dz); break;
    case 'laser': drawLaser(c, th, dz); break;
  }
}

function drawDecals(c, S, th) {
  for (const d of th.decals) gooSplat(c, sx(S, d.u, d.v), sy(S, d.u, d.v), d.r * S.k, d.seed, 0.95, world.t - (d.t0 || 0));
}
// Fill the current path in a colour with an ink keyline round it: reads on any background.
function inked(c, fill, lw) {
  c.fillStyle = fill; c.fill();
  c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
}
// Red-and-ink warning chevrons across a hazard's face (pillars, blocks).
function chevrons(c, S, u0, v0, u1, v1, dz) {
  if (dz > 110) return;
  c.save(); c.beginPath(); slabRect(c, S, u0, v0, u1, v1); c.clip();
  c.beginPath();
  for (let v = v0 - (u1 - u0); v < v1 + 2; v += 1.4) {
    c.moveTo(sx(S, u0, v), sy(S, u0, v)); c.lineTo(sx(S, (u0 + u1) / 2, v + (u1 - u0) / 2), sy(S, (u0 + u1) / 2, v + (u1 - u0) / 2)); c.lineTo(sx(S, u1, v), sy(S, u1, v));
  }
  c.lineWidth = Math.max(1, S.k * 0.3); c.strokeStyle = col(INK, dz, 0.85); c.stroke();
  c.restore();
}

// The slab's surface pattern: grill lines, rivets, ice cracks, wax blotches or dumpster ridges.
function slabPattern(c, S, g, dz, u0, v0, u1, v1) {
  const gt = THEME.gate, hw = CFG.halfW, ch = CFG.ceil;
  const r = mulberry32(Math.floor(g.s * 13));
  const outside = (u, v) => !(u > u0 - 0.3 && u < u1 + 0.3 && v > v0 - 0.3 && v < v1 + 0.3);
  c.beginPath();
  if (gt.hatch === 'grill') {
    for (let u = -hw - ch; u < hw; u += 3) { c.moveTo(sx(S, u, 0), sy(S, u, 0)); c.lineTo(sx(S, u + ch, ch), sy(S, u + ch, ch)); }
    c.save(); c.beginPath(); slabRect(c, S, -hw, 0, hw, ch); slabRect(c, S, u0, v0, u1, v1); c.clip('evenodd');
    c.beginPath();
    for (let u = -hw - ch; u < hw; u += 3) { c.moveTo(sx(S, u, 0), sy(S, u, 0)); c.lineTo(sx(S, u + ch, ch), sy(S, u + ch, ch)); }
    c.lineWidth = Math.max(1, S.k * 0.35); c.strokeStyle = col(gt.ink, dz, 0.75); c.stroke();
    c.restore();
    return;
  }
  if (gt.hatch === 'rivets') {
    const rs = Math.max(1.5, S.k * 0.28);
    c.fillStyle = col(gt.ink, dz);
    for (let v = 1; v < ch; v += 2) for (let u = -hw + 1; u < hw; u += 2) if (outside(u, v)) c.fillRect(sx(S, u, v) - rs / 2, sy(S, u, v) - rs / 2, rs, rs);
    return;
  }
  if (gt.hatch === 'cracks') {
    for (let k = 0; k < 5; k++) {
      let u = r() * 22 - 11, v = r() * 13;
      c.moveTo(sx(S, u, v), sy(S, u, v));
      for (let j = 0; j < 4; j++) { u += r() * 4 - 2; v += r() * 4 - 2; c.lineTo(sx(S, u, v), sy(S, u, v)); }
    }
    c.save(); c.beginPath(); slabRect(c, S, -hw, 0, hw, ch); slabRect(c, S, u0, v0, u1, v1); c.clip('evenodd');
    c.lineWidth = Math.max(1, S.k * 0.12); c.strokeStyle = col(gt.ink, dz, 0.8);
    c.beginPath();
    const r2 = mulberry32(Math.floor(g.s * 13));
    for (let k = 0; k < 5; k++) {
      let u = r2() * 22 - 11, v = r2() * 13;
      c.moveTo(sx(S, u, v), sy(S, u, v));
      for (let j = 0; j < 4; j++) { u += r2() * 4 - 2; v += r2() * 4 - 2; c.lineTo(sx(S, u, v), sy(S, u, v)); }
    }
    c.stroke(); c.restore();
    return;
  }
  if (gt.hatch === 'blotch') {
    c.fillStyle = col(gt.ink, dz, 0.85);
    for (let k = 0; k < 9; k++) {
      const u = r() * 24 - 12, v = r() * 14, rr = 0.8 + r() * 1.6;
      if (!outside(u, v)) continue;
      c.beginPath(); c.arc(sx(S, u, v), sy(S, u, v), rr * S.k, 0, TAU); c.fill();
    }
    return;
  }
  if (gt.hatch === 'ridges') {
    for (let u = -hw + 0.6; u < hw; u += 1.2) {
      if (u > u0 - 0.3 && u < u1 + 0.3) { c.moveTo(sx(S, u, 0), sy(S, u, 0)); c.lineTo(sx(S, u, v0), sy(S, u, v0)); c.moveTo(sx(S, u, v1), sy(S, u, v1)); c.lineTo(sx(S, u, ch), sy(S, u, ch)); }
      else { c.moveTo(sx(S, u, 0), sy(S, u, 0)); c.lineTo(sx(S, u, ch), sy(S, u, ch)); }
    }
    c.lineWidth = Math.max(1, S.k * 0.22); c.strokeStyle = col(gt.ink, dz, 0.85); c.stroke();
  }
}

// The window's icing rim: a thick piped cream border with ink keylines, drips and gold studs.
function icingRim(c, S, g, dz, u0, v0, u1, v1, next) {
  const t = world.t, lw = clamp(S.k * 0.5, 2.5, 22);
  c.beginPath(); slabRect(c, S, u0, v0, u1, v1);
  c.lineJoin = 'round';
  c.lineWidth = lw + 5; c.strokeStyle = INK; c.stroke();
  c.lineWidth = lw; c.strokeStyle = col(CREAM, dz); c.stroke();
  if (dz < 150) {
    // drips of icing hanging off the top edge into the window
    const r = mulberry32(Math.floor(g.s * 7));
    for (let i = 0; i < 4; i++) {
      const u = u0 + (u1 - u0) * (0.15 + i * 0.23 + r() * 0.06);
      const len = (0.5 + r() * 0.8) * (1 + 0.08 * Math.sin(t * 2 + i));
      const x = sx(S, u, v1), y = sy(S, u, v1), w = Math.max(2, S.k * 0.42), hgt = len * S.k;
      c.beginPath(); c.roundRect(x - w / 2, y, w, hgt, w / 2);
      c.fillStyle = col(CREAM, dz); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    }
    // gold studs at the corners, blinking; bigger on the window you are flying at
    const on = Math.floor(t * 4) % 2 === 0;
    const st = Math.max(3, S.k * (next ? 0.9 : 0.6));
    for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]) {
      const x = sx(S, u, v), y = sy(S, u, v);
      c.fillStyle = INK; c.fillRect(x - st / 2 - 2, y - st / 2 - 2, st + 4, st + 4);
      c.fillStyle = on || !next ? col(YEL, dz) : col(CREAM, dz); c.fillRect(x - st / 2, y - st / 2, st, st);
    }
  }
}

function drawGate(c, g, dz, solid) {
  const t = world.t, gt = THEME.gate;
  const S = slabAt(dz);
  const cu = gateCentreU(g, t);
  const hw = CFG.halfW, ch = CFG.ceil;
  const u0 = cu - g.w / 2, u1 = cu + g.w / 2, v0 = g.v - g.h / 2, v1 = g.v + g.h / 2;
  c.beginPath();
  slabRect(c, S, -hw, 0, hw, ch);
  slabRect(c, S, u0, v0, u1, v1);
  if (solid) { c.fillStyle = col(gt.fill, dz, gt.alpha); c.fill('evenodd'); }
  c.lineWidth = Math.max(1.5, S.k * (solid ? 0.45 : 0.15)); c.strokeStyle = col(gt.edge, dz); c.stroke();
  if (solid && dz < 170) slabPattern(c, S, g, dz, u0, v0, u1, v1);
  // White-Out: in a blizzard the whole slab frosts over, window and all, until goo melts a peek
  const frost = (world.blizz || 0) * (g.decals.length ? 0.25 : 1);
  if (frost < 0.6) icingRim(c, S, g, dz, u0, v0, u1, v1, g === world.nextTh);
  if (frost > 0.02) {
    c.beginPath(); slabRect(c, S, -hw, 0, hw, ch);
    c.fillStyle = 'rgba(236,250,255,' + (frost * 0.9).toFixed(3) + ')'; c.fill();
    if (dz < 140) {
      c.save(); c.clip(); c.globalAlpha = frost * 0.7;
      c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1, S.k * 0.12);
      const r = mulberry32(Math.floor(g.s * 5) + 3);
      c.beginPath();
      for (let k = 0; k < 9; k++) { const u = r() * 24 - 12, v = r() * 14, l = 1 + r() * 2; for (let a = 0; a < 3; a++) { const an = a * Math.PI / 3; c.moveTo(sx(S, u - Math.cos(an) * l, v - Math.sin(an) * l), sy(S, u - Math.cos(an) * l, v - Math.sin(an) * l)); c.lineTo(sx(S, u + Math.cos(an) * l, v + Math.sin(an) * l), sy(S, u + Math.cos(an) * l, v + Math.sin(an) * l)); } }
      c.stroke(); c.restore();
    }
  }
  drawDecals(c, S, g);
  if (solid) {
    // drop-line from the sill to the floor so the height reads at a glance
    c.beginPath();
    c.moveTo(sx(S, cu, v0), sy(S, cu, v0)); c.lineTo(sx(S, cu, 0), sy(S, cu, 0));
    c.moveTo(sx(S, cu - 0.5, 0), sy(S, cu - 0.5, 0)); c.lineTo(sx(S, cu + 0.5, 0), sy(S, cu + 0.5, 0));
    c.strokeStyle = col(CREAM, dz, 0.55); c.lineWidth = Math.max(1, S.k * 0.08); c.stroke();
  }
  if (g.paddle) {
    // a spatula sweeping across the window
    const pu = paddleU(g, t);
    c.beginPath(); slabRect(c, S, pu - g.paddle.w / 2, g.v - g.paddle.h / 2, pu + g.paddle.w / 2, g.v + g.paddle.h / 2);
    inked(c, col(RED, dz), Math.max(2, S.k * 0.2));
    chevrons(c, S, pu - g.paddle.w / 2, g.v - g.paddle.h / 2, pu + g.paddle.w / 2, g.v + g.paddle.h / 2, dz);
  }
}

function drawPillars(c, p, dz, solid) {
  const S = slabAt(dz);
  for (const b of p.bars) {
    c.beginPath(); slabRect(c, S, b.u - b.w / 2, 0, b.u + b.w / 2, CFG.ceil);
    if (solid) { inked(c, col(RED, dz), Math.max(2, S.k * 0.2)); chevrons(c, S, b.u - b.w / 2, 0, b.u + b.w / 2, CFG.ceil, dz); }
    else { c.strokeStyle = col(RED, dz); c.lineWidth = Math.max(1, S.k * 0.1); c.stroke(); }
  }
  drawDecals(c, S, p);
}

function drawBlocks(c, th, dz) {
  for (const b of th.blocks) {
    if (b.hp <= 0) continue;
    const S2 = slabAt(dz + 2);
    c.beginPath(); slabRect(c, S2, b.u - 1, b.v - 1, b.u + 1, b.v + 1);
    c.fillStyle = col('#9A1B22', dz); c.fill();
    const S1 = slabAt(dz);
    c.beginPath(); slabRect(c, S1, b.u - 1, b.v - 1, b.u + 1, b.v + 1);
    inked(c, col(RED, dz), Math.max(2, S1.k * 0.18));
    chevrons(c, S1, b.u - 1, b.v - 1, b.u + 1, b.v + 1, dz);
  }
  drawDecals(c, slabAt(dz), th);
}

// Boost rings are jelly donuts: an aqua torus with an ink edge and a white glaze highlight.
function drawRing(c, r, dz) {
  const S = slabAt(dz);
  const wob = 1 + 0.05 * Math.sin(world.t * 5 + r.spin);
  c.beginPath();
  for (let i = 0; i <= 28; i++) {
    const a = i / 28 * TAU;
    const u = r.u + Math.cos(a) * r.r * wob, v = r.v + Math.sin(a) * r.r / wob;
    if (i === 0) c.moveTo(sx(S, u, v), sy(S, u, v)); else c.lineTo(sx(S, u, v), sy(S, u, v));
  }
  const lw = clamp(S.k * 0.75, 2.5, 30);
  c.lineWidth = lw + 5; c.strokeStyle = INK; c.stroke();
  c.lineWidth = lw; c.strokeStyle = col(AQUA, dz); c.stroke();
  c.lineWidth = Math.max(1, lw * 0.22); c.strokeStyle = '#E8FFFC'; c.stroke();
  if (dz < 90) {
    // sprinkles
    const rr = mulberry32(Math.floor(r.s * 3));
    for (let i = 0; i < 10; i++) {
      const a = rr() * TAU, u = r.u + Math.cos(a) * r.r, v = r.v + Math.sin(a) * r.r;
      c.fillStyle = [MAG, YEL, '#FFFFFF'][i % 3];
      const sz = Math.max(1.5, S.k * 0.18);
      c.fillRect(sx(S, u, v) - sz / 2, sy(S, u, v) - sz / 2, sz, sz);
    }
  }
}

// Jelly Cubes: wobbling magenta jelly with a white swirl; the gold-rimmed one rolls better.
function drawCube(c, cb, dz) {
  const S = slabAt(dz);
  const k = S.k;
  const x = sx(S, cb.u, cb.v), y = sy(S, cb.u, cb.v + Math.sin(world.t * 3 + cb.spin) * 0.25);
  const wob = Math.sin(world.t * 7 + cb.spin) * 0.08;
  const size = 1.7 * k;
  c.save();
  c.translate(x, y); c.rotate(cam.roll + wob * 0.5); c.scale(1 + wob, 1 - wob);
  c.beginPath(); c.roundRect(-size / 2, -size / 2, size, size, size * 0.18);
  c.fillStyle = 'rgba(255,79,216,0.86)'; c.fill();
  c.lineWidth = Math.max(2, size * 0.08); c.strokeStyle = INK; c.stroke();
  if (cb.gold) { c.lineWidth = Math.max(2, size * 0.07); c.strokeStyle = YEL; c.strokeRect(-size * 0.62, -size * 0.62, size * 1.24, size * 1.24); }
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(-size * 0.36, -size * 0.36, size * 0.18, size * 0.36);
  c.beginPath();
  const q = size * 0.12;
  c.moveTo(0, 0); c.lineTo(q, 0); c.lineTo(q, q); c.lineTo(-q, q); c.lineTo(-q, -q * 2); c.lineTo(q * 2, -q * 2); c.lineTo(q * 2, q * 2);
  c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1.5, size * 0.08); c.stroke();
  c.restore();
}

// Coins are gold droplets.
function drawCoin(c, cn, dz) {
  const S = slabAt(dz);
  const x = sx(S, cn.u, cn.v), y = sy(S, cn.u, cn.v);
  const s = 0.75 * S.k;
  const sq = Math.max(0.35, Math.abs(Math.cos(world.t * 4 + cn.s)));
  c.save(); c.translate(x, y); c.scale(sq, 1);
  c.beginPath(); c.moveTo(0, -s * 0.7); c.quadraticCurveTo(s * 0.5, -s * 0.05, s * 0.4, s * 0.15); c.arc(0, s * 0.15, s * 0.4, 0, Math.PI); c.quadraticCurveTo(-s * 0.5, -s * 0.05, 0, -s * 0.7);
  c.fillStyle = col(YEL, dz); c.fill(); c.lineWidth = Math.max(1.5, s * 0.12); c.strokeStyle = INK; c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(-s * 0.18, -s * 0.05, s * 0.1, s * 0.22);
  c.restore();
}

// The rolling hazard ball: a tomato (or a wax blob) bouncing wall to wall.
function drawBall(c, b, dz) {
  const [bu, bv] = ballPos(b, world.t);
  const S = slabAt(dz);
  const x = sx(S, bu, bv), y = sy(S, bu, bv), r = b.size / 2 * S.k;
  c.beginPath(); c.ellipse(sx(S, bu, 0.05), sy(S, bu, 0.05), r, r * 0.25, cam.roll, 0, TAU); c.fillStyle = col(INK, dz, 0.35); c.fill();
  c.beginPath(); c.arc(x, y, r, 0, TAU);
  inked(c, col(RED, dz), Math.max(2, r * 0.12));
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(x - r * 0.3, y - r * 0.9); c.lineTo(x, y - r * 0.7); c.lineTo(x + r * 0.3, y - r * 0.9);
  c.lineWidth = Math.max(2, r * 0.14); c.strokeStyle = col('#2E8B2E', dz); c.stroke();
  drawDecals(c, S, b);
}

function drawRotor(c, r, dz) {
  const S = slabAt(dz);
  const a0 = r.spun;
  for (let k = 0; k < 2; k++) {
    const a = a0 + k * Math.PI / 2;
    const dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
    const hw = r.w / 2;
    c.beginPath();
    const pts = [[r.u - dx * r.len + px * hw, r.v - dy * r.len + py * hw], [r.u + dx * r.len + px * hw, r.v + dy * r.len + py * hw],
      [r.u + dx * r.len - px * hw, r.v + dy * r.len - py * hw], [r.u - dx * r.len - px * hw, r.v - dy * r.len - py * hw]];
    pts.forEach(([u, v], i) => (i ? c.lineTo(sx(S, u, v), sy(S, u, v)) : c.moveTo(sx(S, u, v), sy(S, u, v))));
    c.closePath();
    inked(c, col(r.jam > 0 ? '#8A1A22' : RED, dz), Math.max(2, S.k * 0.2));
  }
  c.beginPath(); c.arc(sx(S, r.u, r.v), sy(S, r.u, r.v), Math.max(2, S.k * 0.9), 0, TAU);
  inked(c, col(CREAM, dz), Math.max(2, S.k * 0.16));
  if (r.jam > 0) gooBlob(c, sx(S, r.u, r.v), sy(S, r.u, r.v), S.k * 1.1, 3, world.t);
  drawDecals(c, S, r);
}

function drawCurtain(c, cu, dz) {
  const S = slabAt(dz);
  const on = curtainOn(cu, world.t);
  c.beginPath();
  for (let u = cu.u0 + 0.6; u < cu.u1; u += 1.2) {
    const drip = (world.t * 9 + u * 3) % 2.4;
    for (let v = CFG.ceil - drip; v > 0; v -= 2.4) {
      c.moveTo(sx(S, u, v), sy(S, u, v)); c.lineTo(sx(S, u, Math.max(0, v - 1.2)), sy(S, u, Math.max(0, v - 1.2)));
    }
  }
  c.lineCap = 'round';
  if (on) { c.strokeStyle = INK; c.lineWidth = Math.max(2, S.k * 0.42); c.stroke(); }
  c.strokeStyle = on ? GOO_C : col('#8C8C94', dz, 0.5);
  c.lineWidth = Math.max(1, S.k * (on ? 0.28 : 0.1)); c.stroke();
  c.beginPath(); c.moveTo(sx(S, cu.u0, CFG.ceil), sy(S, cu.u0, CFG.ceil)); c.lineTo(sx(S, cu.u1, CFG.ceil), sy(S, cu.u1, CFG.ceil));
  inkStroke(c, col(RED, dz), Math.max(2, S.k * 0.3));
}

function drawLaser(c, l, dz) {
  const S = slabAt(dz);
  const st = laserState(l, world.t);
  const flick = st.warn && Math.floor(world.t * 30) % 2 === 0;
  const bands = [[l.split, CFG.ceil], [0, l.split]];
  bands.forEach((band, i) => {
    const lit = (st.half === i) !== flick;
    c.beginPath();
    for (let v = band[0] + 0.5; v < band[1]; v += 1) {
      for (let u = -CFG.halfW; u < CFG.halfW; u += 1.5) {
        c.moveTo(sx(S, u, v), sy(S, u, v)); c.lineTo(sx(S, u + 0.9, v), sy(S, u + 0.9, v));
      }
    }
    if (lit) neon(c, col(RED, dz), Math.max(1, S.k * 0.14), dz < 80 ? '#FFFFFF' : null);
    else { c.strokeStyle = col(RED, dz, 0.18); c.lineWidth = Math.max(1, S.k * 0.05); c.stroke(); }
  });
  c.beginPath(); slabRect(c, S, -CFG.halfW, 0, CFG.halfW, CFG.ceil);
  inkStroke(c, col(RED, dz), Math.max(1.5, S.k * 0.2));
}

function drawZones(c, T, list) {
  for (const z of T.zones) {
    const d0 = relDz(z.s0), d1 = relDz(z.s1);
    if (d1 < CFG.near || d0 > CFG.far) continue;
    list.push({ dz: Math.max(d0, CFG.near + 0.1), draw: drawZone, o: z, d1 });
  }
}
function drawZone(c, z, dz, item) {
  const d1 = Math.min(item.d1, CFG.far);
  const t = world.t;
  c.beginPath();
  if (z.kind === 'updraft') {
    for (let s = Math.ceil((cam.s + dz) / 3) * 3; s < cam.s + d1; s += 3) {
      const d = s - cam.s;
      for (let u = z.u0 + 0.8; u < z.u1; u += 1.6) {
        const v = (t * 8 + u * 2 + s) % CFG.ceil;
        seg3(c, d, u, v, d, u, Math.min(CFG.ceil, v + 1.2));
      }
    }
    neon(c, AQUA, 2);
  } else if (z.kind === 'wind') {
    for (let s = Math.ceil((cam.s + dz) / 5) * 5; s < cam.s + d1; s += 5) {
      const d = s - cam.s;
      for (let v = 2; v < CFG.ceil; v += 3.5) {
        const u = ((t * 14 * z.dir + s * 1.7 + v * 5) % 24 + 24) % 24 - 12;
        seg3(c, d, u, v, d, u + z.dir * 1.8, v);
      }
    }
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2.5; c.stroke();
  } else if (z.kind === 'lowg') {
    for (let s = Math.ceil((cam.s + dz) / 6) * 6; s < cam.s + d1; s += 6) {
      const d = s - cam.s;
      for (let v = 1; v < CFG.ceil; v += 3) for (let u = -11; u <= 11; u += 4) {
        const bob = Math.sin(t * 2 + u + s) * 0.4;
        seg3(c, d, u, v + bob, d, u + 0.15, v + bob);
      }
    }
    c.strokeStyle = AQUA; c.lineWidth = 3; c.lineCap = 'round'; c.stroke();
  }
}
