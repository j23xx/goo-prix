// GOO PRIX · src/render.js — The depth-sorted world draw list, the player craft and screen effects.
'use strict';

// ============================================================================================
// RENDER_RACE — one depth-sorted draw list per frame, then the player's craft and screen FX
// ============================================================================================
function drawRival(c, r, dz) {
  projectDz(dz, r.u, r.v, PT);
  const x = PT.x, y = PT.y;
  const size = clamp(PT.k * 3.0, 6, 380);   // drawn larger than the 1.4 u hitbox so racers read at a glance
  const blink = r.invuln > 0 && Math.floor(world.t * 12) % 2 === 0;
  if (THEME.ground.kind !== 'none') {
    // ground shadow: an ink ellipse straight below, which doubles as an altitude cue
    projectDz(dz, r.u, 0.03, PT2);
    c.fillStyle = 'rgba(11,11,18,0.45)';
    c.beginPath(); c.ellipse(PT2.x, PT2.y, size * 0.34, size * 0.08, cam.roll, 0, TAU); c.fill();
  }
  drawRacerArt(c, r.def, x, y, size, {
    flap: r.flapAnim, stun: r.stun > 0, goo: r.goop > 0, shield: r.shield > 0, ghost: r.ghost > 0,
    splats: r.splats, color: INK, fill: col(r.def.color, dz), roll: cam.roll + r.vu * 0.02, alpha: blink ? 0.45 : 1,
  });
  const npx = clamp(size * 0.045, 1, 6);
  const ny = y - size * 0.62 - npx * 8;
  if (dz < 110) world.tags.push({ dz, x, y: ny, px: npx, text: String(r.idx + 1), color: WHT, border: r.def.color, place: world.attract ? null : r.place });
  const b = world.barks.find((bb) => bb.r === r);
  if (b && dz < 90) {
    const tw = textWidth(b.text, 2) + 14;
    const bx = x - tw / 2, by = ny - 30;
    c.fillStyle = WHT; c.fillRect(bx, by, tw, 22);
    c.beginPath(); c.moveTo(x - 5, by + 22); c.lineTo(x + 5, by + 22); c.lineTo(x, by + 30); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(bx, by, tw, 22);
    blockText(c, b.text, x, by + 4, 2, { align: 'center', color: INK });
  }
}

function drawGlob(c, g, dz) {
  projectDz(dz, g.u, g.v, PT);
  const r = Math.max(2, PT.k * g.r);
  gooBlob(c, PT.x, PT.y, r, g.seed, world.t);
  c.fillStyle = GOO_C;
  for (let i = 1; i <= 3; i++) {
    const d2 = dz - i * 0.9;
    if (d2 < CFG.near) break;
    projectDz(d2, g.u - g.vu * i * 0.006, g.v - g.vv * i * 0.006, PT2);
    const rr = Math.max(1.5, PT2.k * g.r * (0.55 - i * 0.12));
    c.fillRect(PT2.x - rr / 2, PT2.y - rr / 2, rr, rr);
  }
  gooBlob(c, PT.x - r * 0.3, PT.y - r * 0.3, r * 0.22, g.seed + 1, world.t, '#eaffdc');
}

function renderWorld(c) {
  const w = world, T = TRACK, p = w.player;
  const nb = !w.attract && w.state !== 'done' ? nextBlocker(p) : null;
  w.nextTh = nb ? nb.th : null;
  w.tags = [];
  drawSky(c, T);
  drawCorridor(c, T);
  const list = [];
  queueThings(T, list, w.t);
  drawZones(c, T, list);
  if (T.scenery.length) drawScenery(c, T, list);
  for (const r of w.racers) {
    if (r === p) continue;
    const dz = relDz(r.dist);
    if (dz < (w.attract ? 9 : CFG.near) || dz > CFG.far) continue;   // the attract camera keeps clear of the pack
    list.push({ dz, draw: drawRival, o: r });
  }
  for (const g of w.globs) { const dz = relDz(g.dist); if (dz > CFG.near + 0.5 && dz < CFG.far) list.push({ dz, draw: drawGlob, o: g }); }
  for (const e of w.ents) { const dz = relDz(e.dist); if (dz > CFG.near + 0.5 && dz < CFG.far) list.push({ dz, draw: drawEnt, o: e }); }
  for (const pt of w.parts) { const dz = relDz(pt.dist); if (dz > CFG.near + 0.3 && dz < 120) list.push({ dz, draw: drawPart, o: pt }); }
  for (const b of w.blasts) { const dz = Math.max(3, relDz(b.dist)); if (dz < CFG.far) list.push({ dz: dz + 0.01, draw: drawBlast, o: b }); }
  if (nb) list.push({ dz: nb.dz - 0.05, draw: drawPathMarker, o: nb });
  list.sort((a, b) => b.dz - a.dz);
  for (const it of list) it.draw(c, it.o, it.dz, it);
  drawTags(c);
}

// Rival number tags, nearest first; a tag that would overlap a nearer one is skipped.
function drawTags(c) {
  if (game.scene === 'results' || game.scene === 'standings') return;   // panels sit on top there
  const placed = [];
  const tags = world.tags.sort((a, b) => a.dz - b.dz);
  let ordinals = 0;
  for (const t of tags) {
    const w = textWidth(t.text, t.px) + t.px * 2, h = t.px * 9;
    const opx = Math.max(1, t.px * 0.5);
    const withOrd = t.place != null && ordinals < 2 && t.dz < 60;
    const ow = withOrd ? textWidth(ORD[t.place], opx) + 4 : 0;
    const box = [t.x - w / 2, t.y - t.px, w + ow, h];
    if (placed.some((b) => box[0] < b[0] + b[2] && b[0] < box[0] + box[2] && box[1] < b[1] + b[3] && b[1] < box[1] + box[3])) continue;
    placed.push(box);
    // number plate: ink, chamfered, bordered in the racer's own colour
    const px0 = t.x - w / 2, py0 = t.y - t.px, cf = t.px * 1.2;
    c.beginPath();
    c.moveTo(px0 + cf, py0); c.lineTo(px0 + w, py0); c.lineTo(px0 + w, py0 + h - cf); c.lineTo(px0 + w - cf, py0 + h); c.lineTo(px0, py0 + h); c.lineTo(px0, py0 + cf); c.closePath();
    c.fillStyle = INK; c.fill();
    if (t.border) { c.strokeStyle = t.border; c.lineWidth = Math.max(1, t.px * 0.45); c.stroke(); }
    blockText(c, t.text, t.x, t.y, t.px, { align: 'center', color: t.color });
    if (withOrd) {
      ordinals++;
      blockText(c, ORD[t.place], t.x + w / 2 + 3, t.y + t.px * 3, opx, { color: WHT, outline: Math.max(1, opx * 0.6), outlineColor: INK });
    }
  }
}

// The goal cue on the next wall: what it is and how far.
const CUE_WORDS = { gate: 'FLY THROUGH', pillars: 'SLALOM', rotor: 'SPINNER', laser: 'DARK HALF', ball: 'DODGE', blocks: 'SHOOT OR DODGE' };
function drawNextCue(c, nb, dz) {
  const th = nb.th;
  if (nb.ahead < 10 || nb.ahead > 140) return;
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
  const tArrive = world.t + nb.ahead / Math.max(20, p.speed);
  const hit = p.ghost <= 0 && thingBlocks(nb.th, p.u, p.v, tArrive) === 'bonk';
  if (hit && Math.floor(world.t * 8) % 2) return;
  projectDz(dz, p.u, p.v, PT);
  const s = clamp(PT.k * 0.55, 7, 18);
  c.beginPath();
  c.moveTo(PT.x, PT.y - s); c.lineTo(PT.x + s, PT.y); c.lineTo(PT.x, PT.y + s); c.lineTo(PT.x - s, PT.y); c.closePath();
  c.lineWidth = 3; c.strokeStyle = hit ? GOO_C : '#fff'; c.stroke();
  c.fillStyle = hit ? GOO_C : '#fff'; c.fillRect(PT.x - 2, PT.y - 2, 4, 4);
}

function craftScreen() {
  const w = world, p = w.player;
  const x = clamp(W / 2 + cam.ox + (p.u - w.camU) * 70, 170, W - 170);
  const y = clamp(553 + cam.oy - (p.v - (w.camV - CFG.camUp)) * 70, 380, 640);
  return [x, y];
}
function drawPlayerCraft(c) {
  const p = world.player;
  const [x, y] = craftScreen();
  const blink = p.invuln > 0 && Math.floor(world.t * 12) % 2 === 0;
  if (p.diveT > 0.1) {
    // dive-charge sparks trailing upward: cyan, turning yellow once the big swoop is charged
    const tier2 = p.diveT >= CFG.swoopTiers[1][0];
    c.fillStyle = tier2 ? YEL : CYN;
    const rng = mulberry32(Math.floor(world.t * 30));
    for (let i = 0; i < (tier2 ? 14 : 8); i++) c.fillRect(x + (rng() - 0.5) * 140, y - 60 - rng() * 70, 4, 10);
  }
  if (p.boostT > 0) {
    // boost flame: cyan blocks pouring out under the craft, orange on a mega boost
    const rng = mulberry32(Math.floor(world.t * 40));
    const hot = p.boostMul >= 1.42 ? ORG : CYN;
    for (let i = 0; i < 16; i++) {
      const d = rng();
      c.fillStyle = d < 0.25 ? WHT : hot;
      const s = 11 - d * 6;
      c.fillRect(x - 18 + rng() * 36 - s / 2, y + 46 + d * 76, s, s * 1.4);
    }
  }
  // the player's halo: a cream ring under the craft with a small gold chevron
  c.save(); c.translate(x, y);
  c.beginPath(); c.ellipse(0, 52, 92, 20, 0, 0, TAU);
  c.lineWidth = 9; c.strokeStyle = INK; c.globalAlpha = 0.7; c.stroke(); c.globalAlpha = 1;
  c.lineWidth = 4; c.strokeStyle = CREAM; c.stroke();
  c.beginPath(); c.moveTo(-14, 76); c.lineTo(0, 90); c.lineTo(14, 76);
  c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
  c.lineWidth = 4; c.strokeStyle = YEL; c.stroke();
  c.restore();
  drawRacerArt(c, p.def, x, y, 150, {
    flap: p.flapAnim, stun: p.stun > 0, goo: p.goop > 0, shield: p.shield > 0, ghost: p.ghost > 0,
    splats: p.splats, color: INK, fill: p.def.color, roll: clamp(p.vu / CFG.latMax, -1, 1) * 0.28, alpha: blink ? 0.4 : 1,
  });
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
    gooSplat(c, s.x, s.y, s.r * Math.min(1, s.t * 8), s.seed, 0.85 * a);
    c.fillStyle = GOO_C; c.globalAlpha = 0.8 * a;
    c.fillRect(s.x - s.r * 0.15, s.y, s.r * 0.18, s.r * 0.6 + s.t * 40);
    c.globalAlpha = 1;
  }
}

function drawCrosshair(c) {
  const a = world.aim;
  const x = a.x, y = a.y;
  const locked = !!a.lock;
  c.strokeStyle = locked ? GOO_C : '#fff'; c.lineWidth = 3;
  c.beginPath();
  const g = locked ? 7 : 6, l = locked ? 16 : 13;
  c.moveTo(x - g - l, y); c.lineTo(x - g, y); c.moveTo(x + g, y); c.lineTo(x + g + l, y);
  c.moveTo(x, y - g - l); c.lineTo(x, y - g); c.moveTo(x, y + g); c.lineTo(x, y + g + l);
  c.stroke();
  c.fillStyle = locked ? GOO_C : '#fff'; c.fillRect(x - 2, y - 2, 4, 4);
  if (locked) { c.lineWidth = 2; c.strokeRect(x - 24, y - 24, 48, 48); }
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
      blockText(c, pp.text, 0, 0, px, { align: 'center', color: GOO_C, outline: px * 0.7, skew: 0.15 });
      c.restore();
      continue;
    }
    const px = POP_SIZES[pp.size];
    c.save(); c.globalAlpha = a;
    c.translate(W / 2, rows[pp.size] + px * 3.5); c.scale(sc, sc);
    const bonk = pp.text.startsWith('BONK');
    blockText(c, pp.text, 0, -px * 3.5, px, { align: 'center', color: bonk ? RED : CREAM, outline: px * 0.55, outlineColor: INK, shadow: px * 0.9, shadowColor: bonk ? WHT : PNK, skew: 0.15 });
    c.restore();
  }
}
