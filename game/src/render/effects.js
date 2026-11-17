// GOO PRIX · src/render/effects.js — Particles, popups, windscreen goo, shake and flashes.
'use strict';

// ============================================================================================
// PARTICLES_FX — shards, dust, goo drops, popups, windscreen goo, shake, flash and speed dashes
// ============================================================================================
function burst(dist, u, v, n, kind) {
  for (let i = 0; i < n; i++) {
    world.parts.push({
      kind, dist, u, v,
      vd: rnd(-6, 10) + (kind === 'coin' ? -8 : 0), vu: rnd(-7, 7), vv: rnd(-2, 9),
      life: kind === 'shard' ? rnd(0.5, 0.9) : rnd(0.3, 0.7), max: 0.8,
      size: kind === 'shard' ? rnd(0.25, 0.6) : rnd(0.12, 0.3), spin: rnd(0, TAU),
    });
  }
  if (world.parts.length > 400) world.parts.splice(0, world.parts.length - 400);
}
function updateParts(dt) {
  for (const p of world.parts) {
    p.dist += p.vd * dt; p.u += p.vu * dt; p.v += p.vv * dt; p.vv -= 18 * dt; p.life -= dt; p.spin += dt * 9;
    if (p.v < 0) { p.v = 0; p.vv *= -0.4; }
  }
  world.parts = world.parts.filter((p) => p.life > 0);
  for (const pp of world.popups) pp.t += dt;
  world.popups = world.popups.filter((pp) => pp.t < pp.max);
  for (const w of world.wind) { w.t += dt; w.y += w.vy * dt; w.vy += 6 * dt; }
  world.wind = world.wind.filter((w) => w.t < w.max);
  for (const b of world.barks) b.t += dt;
  world.barks = world.barks.filter((b) => b.t < 2);
  world.shake = Math.max(0, world.shake - dt * 30);
  world.flash = Math.max(0, world.flash - dt);
  world.flash2 = Math.max(0, (world.flash2 || 0) - dt);
  for (const b of world.blasts) b.t += dt;
  world.blasts = world.blasts.filter((b) => b.t < 0.7);
}
// The stun bomb's shockwave: a cream and red ring racing outward from where it went off.
function drawBlast(c, b, dz) {
  const r = 1 + b.t * 34;
  const S = slabAt(dz);
  const a = 1 - b.t / 0.7;
  c.beginPath();
  for (let i = 0; i <= 24; i++) {
    const ang = (i / 24) * TAU;
    const u = b.u + Math.cos(ang) * r, v = b.v + Math.sin(ang) * r * 0.8;
    if (i === 0) c.moveTo(sx(S, u, v), sy(S, u, v)); else c.lineTo(sx(S, u, v), sy(S, u, v));
  }
  c.globalAlpha = a;
  c.lineWidth = Math.max(4, S.k * 0.9); c.strokeStyle = INK; c.stroke();
  c.lineWidth = Math.max(3, S.k * 0.6); c.strokeStyle = RED; c.stroke();
  c.lineWidth = Math.max(1.5, S.k * 0.22); c.strokeStyle = CREAM; c.stroke();
  c.globalAlpha = 1;
}
function drawPart(c, p, dz) {
  projectDz(dz, p.u, p.v, PT);
  const s = Math.max(1.5, PT.k * p.size);
  const a = clamp(p.life / 0.4, 0, 1);
  c.globalAlpha = a;
  if (p.kind === 'goo') {
    // a wet droplet: a dark rim, the lime body and a pin of light
    c.fillStyle = '#3DA516'; c.beginPath(); c.arc(PT.x, PT.y, s * 0.6, 0, TAU); c.fill();
    c.fillStyle = GOO_C; c.beginPath(); c.arc(PT.x - s * 0.08, PT.y - s * 0.08, s * 0.48, 0, TAU); c.fill();
    if (s > 4) { c.fillStyle = '#F2FFE0'; c.beginPath(); c.arc(PT.x - s * 0.2, PT.y - s * 0.22, s * 0.14, 0, TAU); c.fill(); }
  }
  else if (p.kind === 'shard') {
    c.save(); c.translate(PT.x, PT.y); c.rotate(p.spin);
    c.fillStyle = INK; c.fillRect(-s - 1, -s * 0.4 - 1, s * 2 + 2, s * 0.8 + 2);
    c.fillStyle = col(THEME.gate.fill, dz); c.fillRect(-s, -s * 0.4, s * 2, s * 0.8); c.restore();
  } else if (p.kind === 'coin') { c.fillStyle = YEL; c.fillRect(PT.x - s, PT.y - s, s * 2, s * 2); }
  else { c.fillStyle = p.kind === 'spark' ? (p.spin % 2 < 1 ? CYN : YEL) : 'rgba(200,200,210,0.8)'; c.fillRect(PT.x - s / 2, PT.y - s / 2, s, s); }
  c.globalAlpha = 1;
}
const POP_SIZES = { big: 11, mid: 8, small: 5 };
function popup(text, size) {
  // centre-upper announcer text; a newer one replaces any of the same size
  world.popups = world.popups.filter((p) => p.world || p.size !== size);
  world.popups.push({ text, size, t: 0, max: size === 'big' ? 1.1 : 0.9 });
}
function worldPopup(text, dist, u, v) { world.popups.push({ text, size: 'small', t: 0, max: 0.9, world: true, dist, u, v }); }
function bark(r, text, tg) { world.barks = world.barks.filter((b) => b.tg !== tg || !tg); world.barks.push({ r, text, t: 0, tg }); }
function shake(px) { world.shake = Math.max(world.shake, px); }
function windscreenGoo(n) {
  for (let i = 0; i < n; i++) {
    const side = rand() < 0.5 ? -1 : 1;
    world.wind.push({ x: W / 2 + side * rnd(180, 520), y: rnd(150, 470), r: rnd(40, 75), seed: rndInt(1, 9999), t: 0, max: 2, vy: rnd(5, 20) });
  }
  if (world.wind.length > 4) world.wind.splice(0, world.wind.length - 4);
}
