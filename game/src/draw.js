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
// ---- realistic goo: smooth organic outlines, a translucent lit body, a dark wet rim, specular
// highlights and drips that run. Everything is gradients on the canvas; no images.
const GOO_TONES = { light: '#DAFFB0', mid: '#7CFF3A', deep: '#3DA516', rim: '#1F5E0A' };

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
// Fill the current path as a lump of wet goo lit from the top left, centred at (x, y), radius r.
function gooShade(c, x, y, r, alpha) {
  const a = alpha == null ? 1 : alpha;
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.15);
  g.addColorStop(0, GOO_TONES.light); g.addColorStop(0.35, GOO_TONES.mid); g.addColorStop(0.85, GOO_TONES.deep); g.addColorStop(1, GOO_TONES.rim);
  c.globalAlpha *= a;
  c.fillStyle = g; c.fill();
  c.lineWidth = Math.max(1, r * 0.08); c.strokeStyle = 'rgba(16,52,4,0.85)'; c.stroke();
  c.globalAlpha /= a;
}
function gooSpecular(c, x, y, r, alpha) {
  if (r < 3) return;
  const a = alpha == null ? 1 : alpha;
  c.save();
  c.globalAlpha *= 0.9 * a;
  c.fillStyle = '#FFFFFF';
  c.beginPath(); c.ellipse(x - r * 0.34, y - r * 0.4, r * 0.26, r * 0.13, -0.6, 0, TAU); c.fill();
  c.globalAlpha *= 0.7;
  c.beginPath(); c.arc(x + r * 0.28, y + r * 0.26, r * 0.07, 0, TAU); c.fill();
  c.restore();
}

// A wobbling goo blob in flight. With `color` it is drawn flat in that colour (used for icons).
function gooBlob(c, x, y, r, seed, t, color) {
  const pts = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const wob = 1 + 0.14 * Math.sin(seed * 3.1 + i * 2.3 + t * 9) + 0.08 * Math.sin(seed + i * 5.7 + t * 4);
    pts.push([x + Math.cos(a) * r * wob, y + Math.sin(a) * r * wob]);
  }
  c.beginPath(); smoothPath(c, pts);
  if (color) { c.fillStyle = color; c.fill(); return; }
  gooShade(c, x, y, r);
  gooSpecular(c, x, y, r);
}

// A splat of goo stuck to a surface: a lumpy pool with satellite droplets, thin spatter rays and
// drips that run down from the bottom edge for the first second and a half of its life (`age`, s).
function gooSplat(c, x, y, r, seed, alpha, age) {
  if (r < 0.8) return;
  const rng = mulberry32(seed | 0);
  const a0 = alpha == null ? 1 : alpha;
  const run = age == null ? 1 : clamp(age / 1.5, 0, 1);
  c.save();
  c.globalAlpha *= a0;
  // spatter rays: tapered streaks flung outward
  if (r > 5) {
    c.fillStyle = GOO_TONES.deep;
    for (let i = 0; i < 6; i++) {
      const a = rng() * TAU, l = r * (1.1 + rng() * 0.9), w = r * (0.06 + rng() * 0.06);
      const ca = Math.cos(a), sa = Math.sin(a);
      c.beginPath();
      c.moveTo(x + ca * r * 0.6 - sa * w, y + sa * r * 0.6 + ca * w);
      c.lineTo(x + ca * l, y + sa * l);
      c.lineTo(x + ca * r * 0.6 + sa * w, y + sa * r * 0.6 - ca * w);
      c.closePath(); c.fill();
    }
  }
  // drips running down from the lower edge: drawn first, so the pool covers where they start
  const drips = [];
  for (let i = 0; i < 3; i++) drips.push([x + (rng() - 0.5) * r * 1.1, r * (0.3 + rng() * 0.9) * run, r * (0.1 + rng() * 0.07)]);
  for (const [dx, len, w] of drips) {
    if (len < w) continue;
    const top = y + r * 0.2, end = y + r * 0.55 + len;
    c.beginPath();
    c.moveTo(dx - w, top);
    c.bezierCurveTo(dx - w, end - w * 2, dx - w * 1.25, end - w, dx - w * 1.2, end);
    c.arc(dx, end, w * 1.2, Math.PI, 0, true);
    c.bezierCurveTo(dx + w * 1.25, end - w, dx + w, end - w * 2, dx + w, top);
    c.closePath();
    const g = c.createLinearGradient(dx - w * 1.2, 0, dx + w * 1.2, 0);
    g.addColorStop(0, GOO_TONES.deep); g.addColorStop(0.35, GOO_TONES.light); g.addColorStop(0.6, GOO_TONES.mid); g.addColorStop(1, GOO_TONES.deep);
    c.fillStyle = g; c.fill();
    c.lineWidth = Math.max(1, r * 0.06); c.strokeStyle = 'rgba(16,52,4,0.8)'; c.stroke();
  }
  // the main pool: an organic outline, wider than tall
  const pts = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = r * (0.78 + rng() * 0.38);
    pts.push([x + Math.cos(a) * rr * 1.08, y + Math.sin(a) * rr * 0.92]);
  }
  c.beginPath(); smoothPath(c, pts);
  gooShade(c, x, y, r);
  // satellite droplets
  for (let i = 0; i < 5; i++) {
    const a = rng() * TAU, d = r * (1.15 + rng() * 0.7), rr = r * (0.08 + rng() * 0.12);
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    c.beginPath(); c.arc(px, py, rr, 0, TAU); gooShade(c, px, py, rr);
  }
  gooSpecular(c, x, y, r * 0.9);
  for (const [dx, len, w] of drips) if (len > w * 2) gooSpecular(c, dx, y + r * 0.55 + len, w * 1.2, 0.8);
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
