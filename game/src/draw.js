// GOO PRIX · src/draw.js — Shared drawing helpers: goo blobs, splats, boxes, fog levels.
'use strict';

// ============================================================================================
// DRAW_UTILS — fog grey levels, crisp line widths and the small vector shapes everything uses
// ============================================================================================
function fogLevel(dz) {
  const t = clamp(dz / CFG.far, 0, 1);
  return Math.min(4, Math.floor(Math.pow(t, 1.5) * 5));
}
function lineW(k) { return clamp(k * 0.12, 1, 5); }
function poly(c, pts) {
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
}
// A wobbling goo blob: the one green thing in the game.
function gooBlob(c, x, y, r, seed, t, color) {
  c.beginPath();
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const wob = 1 + 0.18 * Math.sin(seed * 3.1 + i * 2.3 + t * 9) + 0.12 * Math.sin(seed + i * 5.7);
    const px = x + Math.cos(a) * r * wob, py = y + Math.sin(a) * r * wob;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.fillStyle = color || GOO_C;
  c.fill();
  if (!color && r > 3) {
    // goo gets a dark keyline and a wet highlight, so it pops on any background
    c.lineWidth = Math.max(1.5, r * 0.14); c.strokeStyle = '#0B2A00'; c.stroke();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x - r * 0.32, y - r * 0.32, r * 0.16, 0, TAU); c.fill();
  }
}
// A flat goo splat with drips: used for decals, hits and the windscreen.
function gooSplat(c, x, y, r, seed, alpha) {
  const rng = mulberry32(seed | 0);
  c.save();
  c.globalAlpha *= alpha == null ? 1 : alpha;
  c.fillStyle = GOO_C;
  c.beginPath();
  const n = 11;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const rr = r * (i % 2 ? 0.55 + rng() * 0.3 : 0.9 + rng() * 0.45);
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath(); c.fill();
  if (r > 4) { c.lineWidth = Math.max(1.2, r * 0.1); c.strokeStyle = '#0B2A00'; c.stroke(); }
  for (let i = 0; i < 4; i++) {
    const a = rng() * TAU, d = r * (1.2 + rng() * 0.6);
    c.fillRect(x + Math.cos(a) * d - r * 0.12, y + Math.sin(a) * d - r * 0.12, r * 0.24, r * 0.24);
  }
  c.restore();
}
function strokeBox(c, x, y, w, h, lw, color) {
  c.lineWidth = lw; c.strokeStyle = color || '#fff';
  c.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
}
