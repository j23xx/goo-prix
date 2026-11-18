// GOO PRIX · src/render/goo-paint.js — Shared drawing helpers: goo blobs, splats, boxes, fog levels.
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
// ---- glossy goo: translucent slime with no ink line, so it stands apart from the inked, flat-lit
// world. A see-through body that deepens towards its edge, light glowing through its lower rim,
// long white highlights along the top, tiny suspended bubbles, and a soft shadow where it sticks.
const GOO_TONES = { light: '#C9FF86', mid: '#72D828', deep: '#3E9F12', rim: '#2B7A08' };

// Trace a closed, smooth outline through points [[x, y], ...] (quadratic curves through midpoints).
function smoothPath(c, pts) {
  const n = pts.length;
  c.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  c.closePath();
}
// Fill the current path as a lump of glossy slime, lit from the top left, centred at (x, y), radius r.
// noEdge: skip the thin edge line (for shapes built from several overlapping parts).
function gooShade(c, x, y, r, alpha, noEdge) {
  const a = alpha == null ? 1 : alpha;
  c.save();
  c.globalAlpha *= a;
  const g = c.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r * 1.12);
  g.addColorStop(0, 'rgba(122,218,42,0.84)'); g.addColorStop(0.55, 'rgba(98,200,28,0.88)');
  g.addColorStop(0.86, 'rgba(66,160,16,0.95)'); g.addColorStop(1, 'rgba(54,140,12,0.97)');
  c.fillStyle = g; c.fill();
  if (r > 3) {
    // light passing through the slime pools along its lower right rim
    c.save(); c.clip();
    const rl = c.createRadialGradient(x - r * 0.1, y - r * 0.3, r * 0.2, x - r * 0.1, y - r * 0.3, r * 1.3);
    rl.addColorStop(0, 'rgba(222,255,160,0)'); rl.addColorStop(0.7, 'rgba(222,255,160,0)'); rl.addColorStop(0.86, 'rgba(222,255,160,0.6)'); rl.addColorStop(1, 'rgba(222,255,160,0)');
    c.fillStyle = rl; c.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
    c.restore();
  }
  if (!noEdge) { c.lineWidth = Math.max(0.8, r * 0.04); c.strokeStyle = 'rgba(38,112,4,0.55)'; c.stroke(); }
  c.restore();
}
// The gloss: a long soft highlight along the top left, a short one above it, a speck lower right,
// and a few bubbles caught inside. seed picks where the bubbles sit.
function gooSpecular(c, x, y, r, alpha, seed) {
  if (r < 2.5) return;
  const a = alpha == null ? 1 : alpha;
  c.save();
  c.globalAlpha *= a;
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,255,255,0.88)'; c.lineWidth = Math.max(1, r * 0.11);
  c.beginPath(); c.arc(x, y, r * 0.68, Math.PI * 1.06, Math.PI * 1.42); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = Math.max(0.8, r * 0.07);
  c.beginPath(); c.arc(x, y, r * 0.68, Math.PI * 1.5, Math.PI * 1.6); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath(); c.arc(x + r * 0.42, y + r * 0.4, Math.max(0.6, r * 0.055), 0, TAU); c.fill();
  if (r > 9) {
    const rng = mulberry32((seed | 0) + 77);
    c.fillStyle = 'rgba(236,255,212,0.55)';
    for (let i = 0; i < 6; i++) {
      const ang = rng() * TAU, d = r * 0.6 * Math.sqrt(rng());
      c.beginPath(); c.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d, Math.max(0.6, r * (0.02 + rng() * 0.025)), 0, TAU); c.fill();
    }
  }
  c.restore();
}

// A wobbling goo blob in flight. With `color` it is drawn flat in that colour (used for icons).
function gooBlob(c, x, y, r, seed, t, color) {
  const pts = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const wob = 1 + 0.12 * Math.sin(seed * 3.1 + i * 2.3 + t * 9) + 0.07 * Math.sin(seed + i * 5.7 + t * 4);
    pts.push([x + Math.cos(a) * r * wob, y + Math.sin(a) * r * wob]);
  }
  c.beginPath(); smoothPath(c, pts);
  if (color) { c.fillStyle = color; c.fill(); return; }
  gooShade(c, x, y, r);
  gooSpecular(c, x, y, r, 1, seed);
}

// The outline of a splat, worked out once per seed: metaballs (a body, a couple of lumps on it and
// 3-4 arms, each joined to it by a neck), traced round from the centre, in units of its radius.
const SPLAT_SHAPES = new Map();
function splatShape(seed) {
  let pts = SPLAT_SHAPES.get(seed);
  if (pts) return pts;
  const rng = mulberry32((seed | 0) * 7919 + 13);
  const balls = [[0, 0, 0.78]];
  const na = 3 + Math.floor(rng() * 2), base = rng() * TAU;
  for (let i = 0; i < na; i++) {
    // an arm: a chain of balls out from the body, thinning to a neck, ending in a round bulb
    const a = base + (i / na) * TAU + (rng() - 0.5) * 0.9, d = 1.05 + rng() * 0.5, rr = 0.22 + rng() * 0.14;
    const ca = Math.cos(a), sa = Math.sin(a) * 0.9;
    balls.push([ca * d * 0.45, sa * d * 0.45, rr * 1.25], [ca * d * 0.72, sa * d * 0.72, rr * 0.95], [ca * d, sa * d, rr]);
  }
  for (let i = 0; i < 2; i++) { const a = rng() * TAU; balls.push([Math.cos(a) * 0.4, Math.sin(a) * 0.35, 0.5 + rng() * 0.15]); }
  const field = (x, y) => {
    let f = 0;
    for (const [bx, by, br] of balls) { const R = br * 1.5, q = 1 - ((x - bx) ** 2 + (y - by) ** 2) / (R * R); if (q > 0) f += q * q; }
    return f;
  };
  pts = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * TAU, ca = Math.cos(a), sa = Math.sin(a);
    let s = 0.05;
    while (s < 2.6 && field(ca * s, sa * s) >= 0.25) s += 0.02;
    pts.push([ca * s, sa * s]);
  }
  if (SPLAT_SHAPES.size > 400) SPLAT_SHAPES.delete(SPLAT_SHAPES.keys().next().value);
  SPLAT_SHAPES.set(seed, pts);
  return pts;
}
// A splat of goo stuck to a surface: one smooth shape (the pool with its arms, and drips that run
// down for the first second and a half of its life, `age` in s), filled once so the see-through
// slime never doubles up, then beads of goo scattered just past its edge.
function gooSplat(c, x, y, r, seed, alpha, age) {
  if (r < 0.8) return;
  const shape = splatShape(seed | 0);
  const at = (dx, dy) => shape.map(([u, v]) => [x + dx + u * r, y + dy + v * r]);
  c.save();
  c.globalAlpha *= alpha == null ? 1 : alpha;
  if (r < 6) {   // far away: just the shape, shaded
    c.beginPath(); smoothPath(c, at(0, 0)); gooShade(c, x, y, r * 1.1, 1, true);
    c.restore();
    return;
  }
  const rng = mulberry32(seed | 0);
  const run = age == null ? 1 : clamp(age / 1.5, 0, 1);
  const drips = [];
  for (let i = 0; i < 3; i++) drips.push([x + (rng() - 0.5) * r * 0.9, r * (0.25 + rng() * 0.9) * run, r * (0.07 + rng() * 0.06)]);
  const dripPaths = (dx, dy) => {
    for (const [px, len, w] of drips) {
      if (len < w * 1.5) continue;
      const x0 = px + dx, top = y + dy + r * 0.3, end = y + dy + r * 0.62 + len;
      c.moveTo(x0 + w, top);
      c.bezierCurveTo(x0 + w * 0.9, end - w * 3, x0 + w * 1.3, end - w * 1.2, x0 + w * 1.25, end);
      c.arc(x0, end, w * 1.25, 0, Math.PI, false);
      c.bezierCurveTo(x0 - w * 1.3, end - w * 1.2, x0 - w * 0.9, end - w * 3, x0 - w, top);
      c.closePath();
    }
  };
  // a soft shadow where it sticks: the same shape twice, nudged down and right
  for (const [k, al] of [[1, 0.16], [0.55, 0.16]]) {
    c.beginPath(); smoothPath(c, at(r * 0.06 * k, r * 0.13 * k)); dripPaths(r * 0.06 * k, r * 0.13 * k);
    c.fillStyle = 'rgba(10,34,0,' + al + ')'; c.fill();
  }
  // the pool and its drips, wound the same way so the union fills once
  c.beginPath(); smoothPath(c, at(0, 0)); dripPaths(0, 0);
  gooShade(c, x, y, r * 1.1, 1, true);
  c.beginPath(); smoothPath(c, at(0, 0));
  c.lineWidth = Math.max(0.8, r * 0.035); c.strokeStyle = 'rgba(38,112,4,0.5)'; c.stroke();
  // beads of goo just past the edge
  for (let i = 0; i < 4; i++) {
    const [u, v] = shape[Math.floor(rng() * shape.length)], rr = r * (0.06 + rng() * 0.09);
    const far = 1 + (rr * 1.8 + r * rng() * 0.3) / (r * Math.max(0.3, Math.hypot(u, v)));
    const px = x + u * r * far, py = y + v * r * far;
    c.beginPath(); c.arc(px, py, rr, 0, TAU); gooShade(c, px, py, rr);
    gooSpecular(c, px, py, rr, 0.9, i);
  }
  gooSpecular(c, x, y, r * 0.85, 1, seed);
  for (const [dx, len, w] of drips) if (len > w * 3) gooSpecular(c, dx, y + r * 0.62 + len, w * 1.25, 0.8, 0);
  c.restore();
}
function strokeBox(c, x, y, w, h, lw, color) {
  c.lineWidth = lw; c.strokeStyle = color || '#fff';
  c.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
}

// ---- cartoon / manga shading helpers
// Darken (k < 1) or lighten (k > 1) a #rrggbb colour.
const SHADES = new Map();
function shade(hex, k) {
  const key = hex + k;
  let s = SHADES.get(key);
  if (s) return s;
  const n = parseInt(hex.slice(1), 7 === hex.length ? 16 : 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (k <= 1) { r *= k; g *= k; b *= k; } else { const t = k - 1; r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; }
  s = '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  SHADES.set(key, s);
  return s;
}
// The screentone: a cached 6x6 dot pattern laid into cel shadows, like a printed manga page.
let TONE = null;
function tonePattern(c) {
  if (TONE) return TONE;
  const cv = document.createElement('canvas'); cv.width = 6; cv.height = 6;
  const x = cv.getContext('2d');
  x.fillStyle = 'rgba(11,11,18,0.55)'; x.beginPath(); x.arc(1.5, 1.5, 1.1, 0, TAU); x.arc(4.5, 4.5, 1.1, 0, TAU); x.fill();
  TONE = c.createPattern(cv, 'repeat');
  return TONE;
}
// Cel-shade a shape: flat base, a hard shadow crescent on the lower right with screentone in it,
// a hard highlight on the upper left, then an ink outline. `shape(c)` adds the path; s is its radius.
function cel(c, shape, base, s, lw, opts) {
  const o = opts || {};
  c.save();
  c.beginPath(); shape(c); c.clip();
  c.fillStyle = shade(base, 0.55); c.fillRect(-s * 4, -s * 4, s * 8, s * 8);
  if (s > 10 && !o.noTone) { c.fillStyle = tonePattern(c); c.fillRect(-s * 4, -s * 4, s * 8, s * 8); }
  c.save(); c.translate(-s * 0.16, -s * 0.18); c.beginPath(); shape(c); c.fillStyle = base; c.fill(); c.restore();
  if (!o.noHi) { c.translate(-s * 0.42, -s * 0.46); c.beginPath(); shape(c); c.globalAlpha = 0.5; c.fillStyle = shade(base, 1.55); c.fill(); }
  c.restore();
  c.beginPath(); shape(c); c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
}
// A four-point manga glint.
function glint(c, x, y, r, alpha) {
  if (r < 1.5) return;
  c.save(); c.globalAlpha *= alpha == null ? 1 : alpha; c.fillStyle = '#FFFFFF';
  c.beginPath();
  c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r);
  c.fill(); c.restore();
}
