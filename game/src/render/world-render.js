// GOO PRIX · src/render/world-render.js — The depth-sorted world draw list, the player's ship and screen effects.
'use strict';

// ============================================================================================
// RENDER — one depth-sorted draw list per frame, then the player's ship and the screen FX
// ============================================================================================
function drawGlob(c, g, dz) {
  projectDz(dz, g.u, g.v, PT);
  const r = Math.max(2, PT.k * g.r);
  // a short wet tail of droplets behind the blob
  for (let i = 3; i >= 1; i--) {
    const d2 = dz - i * 0.9;
    if (d2 < CFG.near) continue;
    projectDz(d2, g.u - g.vu * i * 0.006, g.v - g.vv * i * 0.006, PT2);
    gooBlob(c, PT2.x, PT2.y, Math.max(1.2, PT2.k * g.r * (0.55 - i * 0.12)), g.seed + i, world.t);
  }
  gooBlob(c, PT.x, PT.y, r, g.seed, world.t);
  if (g.beat || g.homing) {
    // on-beat and homing globs glow so you can follow them
    c.save(); c.globalCompositeOperation = 'lighter';
    const gl = c.createRadialGradient(PT.x, PT.y, 0, PT.x, PT.y, r * 2.4);
    gl.addColorStop(0, g.beat ? 'rgba(255,79,216,0.55)' : 'rgba(255,194,26,0.5)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gl; c.beginPath(); c.arc(PT.x, PT.y, r * 2.4, 0, TAU); c.fill();
    c.restore();
  }
}

function renderWorld(c) {
  const w = world, T = TRACK, p = w.player;
  const nb = !w.attract && w.state !== 'done' && !w.boss ? nextBlocker(p) : null;
  w.nextTh = nb ? nb.th : null;
  w.tags = [];
  drawSky(c, T);
  drawCorridor(c, T);
  const list = [];
  queueThings(T, list, w.t);
  drawZones(c, T, list);
  if (T.scenery.length) drawScenery(c, T, list);
  const inView = (dz) => dz > CFG.near + 0.5 && dz < CFG.far;
  for (const tg of w.targets) { const dz = relDz(tg.dist); if (inView(dz)) list.push({ dz, draw: drawTarget, o: tg }); }
  for (const b of w.bolts) { const dz = relDz(b.dist); if (inView(dz)) list.push({ dz, draw: drawBolt, o: b }); }
  for (const wl of w.walls) { const dz = relDz(wl.dist); if (inView(dz)) list.push({ dz, draw: drawBossWall, o: wl }); }
  if (w.boss) { const dz = relDz(w.boss.dist); if (inView(dz)) list.push({ dz: dz + 0.5, draw: drawBoss, o: w.boss }); }
  for (const g of w.globs) { const dz = relDz(g.dist); if (inView(dz)) list.push({ dz, draw: drawGlob, o: g }); }
  for (const e of w.ents) { const dz = relDz(e.dist); if (inView(dz)) list.push({ dz, draw: drawEnt, o: e }); }
  for (const pt of w.parts) { const dz = relDz(pt.dist); if (dz > CFG.near + 0.3 && dz < 120) list.push({ dz, draw: drawPart, o: pt }); }
  for (const b of w.blasts) { if (b.t < 0) continue; const dz = Math.max(3, relDz(b.dist)); if (dz < CFG.far) list.push({ dz: dz + 0.01, draw: drawBlast, o: b }); }
  if (nb) list.push({ dz: nb.dz - 0.05, draw: drawPathMarker, o: nb });
  list.sort((a, b) => b.dz - a.dz);
  for (const it of list) it.draw(c, it.o, it.dz, it);
  drawTags(c);
  drawBarks(c);
  // the final boss bleaches the world grey as his clock runs out
  if (w.boss && w.boss.bleach > 0.01) {
    c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = 'rgba(128,128,128,' + w.boss.bleach.toFixed(3) + ')'; c.fillRect(0, 0, W, H); c.restore();
  }
}

// Name tags over rival aces; a tag that would overlap a nearer one is skipped.
function drawTags(c) {
  if (game.scene !== 'race') return;
  const placed = [];
  const tags = world.tags.sort((a, b) => a.dz - b.dz);
  for (const t of tags) {
    const w = textWidth(t.text, t.px) + t.px * 2, h = t.px * 9;
    const box = [t.x - w / 2, t.y - t.px, w, h];
    if (placed.some((b) => box[0] < b[0] + b[2] && b[0] < box[0] + box[2] && box[1] < b[1] + b[3] && b[1] < box[1] + box[3])) continue;
    placed.push(box);
    const px0 = t.x - w / 2, py0 = t.y - t.px, cf = t.px * 1.2;
    c.beginPath();
    c.moveTo(px0 + cf, py0); c.lineTo(px0 + w, py0); c.lineTo(px0 + w, py0 + h - cf); c.lineTo(px0 + w - cf, py0 + h); c.lineTo(px0, py0 + h); c.lineTo(px0, py0 + cf); c.closePath();
    c.fillStyle = INK; c.fill();
    if (t.border) { c.strokeStyle = t.border; c.lineWidth = Math.max(1, t.px * 0.45); c.stroke(); }
    blockText(c, t.text, t.x, t.y, t.px, { align: 'center', color: t.color });
  }
}
// Speech bubbles: a rival ace complains when you goo its paintwork.
function drawBarks(c) {
  for (const b of world.barks) {
    const tg = b.tg;
    if (!tg || tg.dead) continue;
    const dz = relDz(tg.dist);
    if (dz < 4 || dz > 100) continue;
    projectDz(dz, tg.u, tg.v, PT);
    const s = tg.r * PT.k, tw = textWidth(b.text, 2) + 14;
    const bx = clamp(PT.x - tw / 2, 8, W - tw - 8), by = PT.y - s * 2.1 - 34;
    const pop = easeOutBack(clamp(b.t / 0.15, 0, 1));
    c.save(); c.translate(PT.x, by + 15); c.scale(pop, pop); c.translate(-PT.x, -(by + 15));
    c.fillStyle = WHT; c.beginPath(); c.roundRect(bx, by, tw, 22, 6); c.fill();
    c.beginPath(); c.moveTo(PT.x - 6, by + 21); c.lineTo(PT.x + 6, by + 21); c.lineTo(PT.x, by + 31); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.roundRect(bx, by, tw, 22, 6); c.stroke();
    blockText(c, b.text, bx + tw / 2, by + 4, 2, { align: 'center', color: INK });
    c.restore();
  }
}

// The goal cue on the next wall: what it is and how far.
const CUE_WORDS = { gate: 'THREAD IT', pillars: 'SLALOM', rotor: 'SPINNER', laser: 'DARK HALF', ball: 'DODGE', blocks: 'SHOOT OR DODGE' };
function drawNextCue(c, nb, dz) {
  const th = nb.th;
  if (nb.ahead < 10 || nb.ahead > 140) return;
  if (world.blizz > 0.5 && th.kind === 'gate' && !th.decals.length) return;   // hidden in the blizzard
  const S = slabAt(dz);
  let u = 0, v = CFG.ceil - 1.2;
  if (th.kind === 'gate') { u = gateCentreU(th, world.t); v = Math.min(CFG.ceil - 0.6, th.v + th.h / 2 + 0.5); }
  else if (th.kind === 'rotor') { u = th.u; v = Math.min(CFG.ceil - 0.6, th.v + th.len + 0.5); }
  const word = th.kind === 'rotor' && th.jam > 0 ? 'JAMMED' : CUE_WORDS[th.kind];
  const px = clamp(S.k * 0.075, 2, 4);
  blockText(c, word + ' ' + Math.round(nb.ahead) + 'M', sx(S, u, v), sy(S, u, v) - px * 8, px, { align: 'center', color: GOO_C, outline: px * 0.7 });
}

// The next wall-like thing the player will cross, and how far ahead it is.
function nextBlocker(p) {
  const T = TRACK, n = T.things.length;
  let idx = p.ti, base = p.tBase;
  for (let k = 0; k < 12 && n; k++) {
    const th = T.things[idx];
    const ahead = base + th.s - p.dist;
    if (ahead > 150) return null;
    if (th.kind === 'gate' || th.kind === 'pillars' || th.kind === 'rotor' || th.kind === 'laser' || th.kind === 'blocks' || th.kind === 'ball') {
      return { th, dz: ahead + CFG.camBack, ahead };
    }
    idx++; if (idx >= n) { idx = 0; base += T.L; }
  }
  return null;
}
// Flight-path marker: where you would cross the next wall if you held your line.
function drawPathMarker(c, nb, dz) {
  const p = world.player;
  if (dz < 6) return;
  drawNextCue(c, nb, dz);
  if (world.blizz > 0.5 && nb.th.kind === 'gate' && !nb.th.decals.length) return;
  const tArrive = world.t + nb.ahead / Math.max(20, p.speed);
  const hit = p.ghost <= 0 && thingBlocks(nb.th, p.u, p.v, tArrive) === 'bonk';
  if (hit && Math.floor(world.t * 8) % 2) return;
  projectDz(dz, p.u, p.v, PT);
  const s = clamp(PT.k * 0.55, 7, 18);
  c.beginPath();
  c.moveTo(PT.x, PT.y - s); c.lineTo(PT.x + s, PT.y); c.lineTo(PT.x, PT.y + s); c.lineTo(PT.x - s, PT.y); c.closePath();
  c.lineWidth = 3; c.strokeStyle = hit ? RED : '#fff'; c.stroke();
  c.fillStyle = hit ? RED : '#fff'; c.fillRect(PT.x - 2, PT.y - 2, 4, 4);
}

// Where the player's ship sits on screen: just below the camera, turned with any world spin.
function craftScreen() {
  const w = world, p = w.player;
  const x0 = clamp(W / 2 + (p.u - w.camU) * 70, 170, W - 170) - W / 2;
  const y0 = clamp(553 - (p.v - (w.camV - CFG.camUp)) * 70, 380, 640) - cam.hz;
  const sp = w.camSpin || 0, cs = Math.cos(sp), sn = Math.sin(sp);
  return [W / 2 + cam.ox + x0 * cs - y0 * sn, cam.hz + cam.oy + x0 * sn + y0 * cs];
}
function drawPlayerCraft(c) {
  const w = world, p = w.player;
  const [x, y] = craftScreen();
  const blink = p.invuln > 0 && Math.floor(w.t * 12) % 2 === 0;
  const spin = w.camSpin || 0;
  c.save();
  c.translate(x, y); c.rotate(spin);
  if (p.diveT > 0.1) {
    const tier2 = p.diveT >= CFG.swoopTiers[1][0];
    c.fillStyle = tier2 ? YEL : CYN;
    const rng = mulberry32(Math.floor(w.t * 30));
    for (let i = 0; i < (tier2 ? 14 : 8); i++) c.fillRect((rng() - 0.5) * 140, -60 - rng() * 70, 4, 10);
  }
  // a soft shadow ring under the ship, so you can read where it is against busy skies
  c.beginPath(); c.ellipse(0, 58 * (w.gFlip || 1), 84, 16, 0, 0, TAU);
  c.lineWidth = 8; c.strokeStyle = 'rgba(11,11,18,0.45)'; c.stroke();
  c.lineWidth = 3; c.strokeStyle = 'rgba(255,246,224,0.8)'; c.stroke();
  // Upside Drown: the ship turns over with gravity
  c.scale(1, w.gFlip == null ? 1 : w.gFlip);
  const thrust = p.boostT > 0 ? 1 : w.level && w.level.twist === 'zerog' ? 0.6 : 0.35;
  drawShip(c, p.def, 0, 0, 196, {
    flap: p.flapAnim, stun: p.stun > 0, goo: p.goop > 0, shield: p.shield > 0, ghost: p.ghost > 0,
    splats: p.splats, roll: clamp(p.vu / CFG.latMax, -1, 1) * 0.28, alpha: blink ? 0.4 : 1, thrust, speed: p.boostT > 0,
  });
  c.restore();
}

function drawSpeedDashes(c) {
  const p = world.player;
  if (!(p.boostT > 0) && !(p.ghost > 0)) return;
  const rng = mulberry32(Math.floor(world.t * 24));
  c.strokeStyle = '#fff'; c.lineWidth = 3; c.globalAlpha = 0.5;
  c.beginPath();
  for (let i = 0; i < 18; i++) {
    const a = rng() * TAU, r0 = 470 + rng() * 260, len = 30 + rng() * 60;
    const cx = W / 2, cy = cam.hz;
    c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.75);
    c.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len) * 0.75);
  }
  c.stroke(); c.globalAlpha = 1;
}

function drawWindscreen(c) {
  for (const s of world.wind) {
    const a = s.t > s.max - 0.5 ? (s.max - s.t) / 0.5 : 1;
    gooSplat(c, s.x, s.y, s.r * Math.min(1, s.t * 8), s.seed, 0.85 * a, s.t);
  }
}

function drawCrosshair(c) {
  const w = world, a = w.aim;
  if (w.level && w.level.twist === 'zerog') return drawLockReticles(c);
  const x = a.x, y = a.y;
  const locked = !!a.lock;
  c.strokeStyle = locked ? GOO_C : '#fff'; c.lineWidth = 3;
  c.beginPath();
  const g = locked ? 7 : 6, l = locked ? 16 : 13;
  c.moveTo(x - g - l, y); c.lineTo(x - g, y); c.moveTo(x + g, y); c.lineTo(x + g + l, y);
  c.moveTo(x, y - g - l); c.lineTo(x, y - g); c.moveTo(x, y + g); c.lineTo(x, y + g + l);
  c.stroke();
  c.fillStyle = locked ? GOO_C : '#fff'; c.fillRect(x - 2, y - 2, 4, 4);
  if (locked) {
    const sp = w.t * 3;
    c.save(); c.translate(x, y); c.rotate(sp);
    c.lineWidth = 2.5; c.strokeRect(-22, -22, 44, 44);
    c.restore();
  }
  // Beat Drop: a ring closes on the crosshair with every beat; fire as it lands
  if (w.level && w.level.twist === 'rhythm' && w.state === 'run') {
    const f = beatPos() % 1;
    const r = 18 + (1 - f) * 46;
    c.beginPath(); c.arc(x, y, r, 0, TAU);
    c.lineWidth = 4; c.strokeStyle = 'rgba(11,11,18,0.6)'; c.stroke();
    c.lineWidth = 2.5; c.strokeStyle = f > 0.85 || f < 0.1 ? MAG : 'rgba(255,79,216,0.55)'; c.stroke();
    if ((w.beatFlash || 0) > 0) { c.beginPath(); c.arc(x, y, 30, 0, TAU); c.lineWidth = 8; c.strokeStyle = MAG; c.stroke(); }
  }
}
// Lock 'n' Slop: a spinning reticle on every locked target, and a free-floating sight.
function drawLockReticles(c) {
  const w = world;
  const a = w.aim;
  c.strokeStyle = '#fff'; c.lineWidth = 2;
  c.beginPath(); c.arc(a.x, a.y, 26, 0, TAU); c.stroke();
  c.fillStyle = '#fff'; c.fillRect(a.x - 2, a.y - 2, 4, 4);
  w.locks.forEach((tg, i) => {
    if (tg.dead) return;
    const dz = relDz(tg.dist);
    if (dz < CFG.near + 1) return;
    projectDz(dz, tg.u, tg.v, PT);
    const s = Math.max(16, tg.r * PT.k * 1.5);
    c.save(); c.translate(PT.x, PT.y); c.rotate(w.t * 4 + i);
    c.beginPath(); c.moveTo(0, -s); c.lineTo(s, 0); c.lineTo(0, s); c.lineTo(-s, 0); c.closePath();
    c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    c.lineWidth = 3; c.strokeStyle = i % 2 ? YEL : RED; c.stroke();
    c.restore();
    blockText(c, String(i + 1), PT.x + s + 4, PT.y - s, 2, { color: YEL, outline: 1.5, outlineColor: INK });
  });
}

function drawPopups(c) {
  const w = world;
  const rows = { big: 196, mid: 268, small: 318 };
  for (const pp of w.popups) {
    const k = clamp(pp.t / 0.16, 0, 1);
    const sc = easeOutBack(k);
    const a = pp.t > pp.max - 0.25 ? (pp.max - pp.t) / 0.25 : 1;
    if (pp.world) {
      const dz = relDz(pp.dist);
      if (dz < CFG.near) continue;
      projectDz(dz, pp.u, pp.v + pp.t * 1.5, PT);
      const px = clamp(PT.k * 0.12, 2, 4);
      c.save(); c.globalAlpha = a; c.translate(PT.x, PT.y); c.scale(sc, sc);
      blockText(c, pp.text, 0, 0, px, { align: 'center', color: YEL, outline: px * 0.7, skew: 0.15 });
      c.restore();
      continue;
    }
    const px = POP_SIZES[pp.size];
    c.save(); c.globalAlpha = a;
    c.translate(W / 2, rows[pp.size] + px * 3.5); c.scale(sc, sc);
    const bad = pp.text.startsWith('BONK') || pp.text.startsWith('REJECTED') || pp.text.startsWith('TIME UP') || pp.text.startsWith('BLEACHED');
    blockText(c, pp.text, 0, -px * 3.5, px, { align: 'center', color: bad ? RED : CREAM, outline: px * 0.55, outlineColor: INK, shadow: px * 0.9, shadowColor: bad ? WHT : PNK, skew: 0.15 });
    c.restore();
  }
}

// ============================================================================================
// SCREEN_FX — the coat of paint your multiplier puts on the world, blizzards and the lights going out
// ============================================================================================
// A halftone dot vignette, built once per colour and stamped over the frame edges.
const HALFTONE = new Map();
function halftoneLayer(color) {
  let cv = HALFTONE.get(color);
  if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const k = cv.getContext('2d');
  k.fillStyle = color;
  for (let y = 0; y < H; y += 14) for (let x = (y / 14) % 2 ? 7 : 0; x < W; x += 14) {
    const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
    const e = clamp((Math.hypot(dx * 0.9, dy) - 0.62) / 0.5, 0, 1);
    if (e <= 0) continue;
    k.beginPath(); k.arc(x, y, 1 + e * 6, 0, TAU); k.fill();
  }
  HALFTONE.set(color, cv);
  return cv;
}
const ONOS = ['SPLAT!', 'GLORP!', 'SPLOOSH!', 'BLAM!', 'SPLUT!', 'GLOOP!', 'SHLORP!'];
function drawCoat(c) {
  const w = world;
  if (!w.coat) { w.onos = []; w.seenHits = w.hits; return; }
  const fade = clamp(w.coatT / 0.4, 0, 1);
  // POP and up: comic halftone at the edges, onomatopoeia bursting out of every hit
  c.save(); c.globalAlpha = 0.38 * fade;
  c.drawImage(halftoneLayer(w.coat >= 2 ? '#7CFF3A' : '#FFC21A'), 0, 0);
  c.restore();
  w.onos = w.onos || [];
  if (w.hits > (w.seenHits || 0)) {
    w.seenHits = w.hits;
    const side = rand() < 0.5 ? -1 : 1;
    w.onos.push({ text: pick(ONOS), x: W / 2 + side * rnd(220, 470), y: rnd(150, 420), t: 0, rot: rnd(-0.3, 0.3), col: pick([YEL, MAG, CYN, ORG]) });
    if (w.onos.length > 3) w.onos.shift();
  }
  for (const o of w.onos) {
    o.t += 1 / 60;
    if (o.t > 0.7) continue;
    const sc = easeOutBack(clamp(o.t / 0.12, 0, 1)) * (w.coat >= 2 ? 1.25 : 1);
    c.save(); c.translate(o.x, o.y); c.rotate(o.rot); c.scale(sc, sc); c.globalAlpha = clamp((0.7 - o.t) / 0.2, 0, 1);
    // a jagged comic burst behind the word
    c.beginPath();
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, r = i % 2 ? 46 : 74; c.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 0.75); }
    c.closePath(); c.fillStyle = o.col; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    blockText(c, o.text, 0, -14, 4, { align: 'center', color: WHT, outline: 3, outlineColor: INK, skew: 0.2 });
    c.restore();
  }
  w.onos = w.onos.filter((o) => o.t <= 0.7);
  // WET PAINT: thick paint running down from the top of the screen
  if (w.coat >= 2) {
    const r = mulberry32(77);
    for (let i = 0; i < 14; i++) {
      const x = r() * W, wd = 10 + r() * 22, sp = 30 + r() * 60;
      const len = Math.min(220, 20 + w.coatT * sp) * (0.6 + r() * 0.4);
      const colr = ['#FF4FD8', '#FFC21A', '#19E0D0', '#7CFF3A'][i % 4];
      c.save(); c.globalAlpha = 0.85 * fade;
      c.beginPath(); c.roundRect(x - wd / 2, -10, wd, len, wd / 2);
      const g = c.createLinearGradient(x - wd / 2, 0, x + wd / 2, 0);
      g.addColorStop(0, shade(colr, 0.7)); g.addColorStop(0.35, colr); g.addColorStop(0.55, shade(colr, 1.25)); g.addColorStop(1, shade(colr, 0.6));
      c.fillStyle = g; c.fill();
      c.beginPath(); c.arc(x, len - 10 + wd * 0.1, wd * 0.62, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(x - wd * 0.25, 0, wd * 0.12, len * 0.8);
      c.restore();
    }
  }
}
// White-Out's blizzard: a white haze and snow streaking past.
function drawBlizzard(c) {
  const w = world, b = w.blizz || 0;
  if (b <= 0.01) return;
  const g = c.createRadialGradient(W / 2, cam.hz, 60, W / 2, cam.hz, W * 0.75);
  g.addColorStop(0, 'rgba(240,250,255,' + (0.78 * b).toFixed(3) + ')'); g.addColorStop(1, 'rgba(220,240,255,' + (0.35 * b).toFixed(3) + ')');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = mulberry32(5);
  c.strokeStyle = 'rgba(255,255,255,' + (0.85 * b).toFixed(3) + ')'; c.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const a = r() * TAU, sp = 0.6 + r() * 1.4;
    const d = wrap(w.t * sp + r(), 1);
    const rr = 40 + d * d * 900;
    const x = W / 2 + Math.cos(a) * rr, y = cam.hz + Math.sin(a) * rr * 0.6;
    c.lineWidth = 1 + d * 4;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * d * 40, y + Math.sin(a) * d * 24); c.stroke();
  }
}
// Lights out: the world goes black, lit only by your goo and a headlight.
let DARK = null;
function drawDarkness(c) {
  const w = world;
  const k = clamp(w.darkT, 0, 1) * clamp((6 - w.darkT) / 0.3 + 0.2, 0, 1);
  if (k <= 0.01) return;
  if (!DARK) { DARK = document.createElement('canvas'); DARK.width = W; DARK.height = H; }
  const d = DARK.getContext('2d');
  d.globalCompositeOperation = 'source-over';
  d.clearRect(0, 0, W, H);
  d.fillStyle = 'rgba(4,6,14,' + (0.94 * k).toFixed(3) + ')'; d.fillRect(0, 0, W, H);
  d.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => {
    const g = d.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g; d.beginPath(); d.arc(x, y, r, 0, TAU); d.fill();
  };
  hole(w.aim.x, w.aim.y, 170, 0.75);                 // the headlight
  const [px, py] = craftScreen(); hole(px, py, 160, 0.9);
  for (const g of w.globs) { const dz = relDz(g.dist); if (dz > CFG.near + 0.5 && dz < CFG.far) { projectDz(dz, g.u, g.v, PT); hole(PT.x, PT.y, Math.max(40, PT.k * 4), 1); } }
  for (const tg of w.targets) {
    if (!tg.splats.length) continue;
    const dz = relDz(tg.dist); if (dz < CFG.near + 0.5 || dz > CFG.far) continue;
    projectDz(dz, tg.u, tg.v, PT); hole(PT.x, PT.y, Math.max(50, PT.k * tg.r * 3.2), 1);
  }
  for (const th of w.decalList) if (th.s != null) { const dz = relDz(th.s); if (dz > CFG.near + 0.5 && dz < CFG.far) { projectDz(dz, th.decals[0] ? th.decals[0].u : 0, th.decals[0] ? th.decals[0].v : 6, PT); hole(PT.x, PT.y, Math.max(40, PT.k * 3), 0.9); } }
  c.drawImage(DARK, 0, 0);
}
// Upside Drown: an arrow at the screen edge showing which way is down, and the flip countdown.
function drawGravityCue(c) {
  const w = world;
  if (!w.level || w.level.twist !== 'gravity' || w.state !== 'run') return;
  const down = w.gsign > 0 ? 1 : -1, x = 46, y = H / 2;
  const warn = w.flipT < 2 && Math.floor(w.t * 8) % 2 === 0;
  c.save(); c.translate(x, y); c.scale(1, down);
  c.beginPath(); c.moveTo(-14, -40); c.lineTo(14, -40); c.lineTo(14, 10); c.lineTo(28, 10); c.lineTo(0, 44); c.lineTo(-28, 10); c.lineTo(-14, 10); c.closePath();
  c.fillStyle = warn ? RED : CYN; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.restore();
  blockText(c, 'G', x, y - 10, 3, { align: 'center', color: INK });
  blockText(c, 'FLIP ' + Math.max(0, Math.ceil(w.flipT)), x, y + 58, 2, { align: 'center', color: warn ? RED : WHT, outline: 1.5, outlineColor: INK });
}
function drawScreenFx(c) {
  drawDarkness(c);
  drawBlizzard(c);
  drawCoat(c);
  drawGravityCue(c);
}
