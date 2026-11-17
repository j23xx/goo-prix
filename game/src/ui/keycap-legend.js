// GOO PRIX · src/ui/keycap-legend.js — Drawn keyboard keys and the control legends built from them.
'use strict';

// ============================================================================================
// KEYCAPS — every control is shown as the key you press, next to what it does
// ============================================================================================
// One keycap at (x, y), h tall; returns its width.
function keycap(c, key, x, y, h, lit) {
  const size = Math.round(h * 0.56);
  const w = Math.max(h, labelWidth(c, key, size) + h * 0.5);
  c.save();
  c.beginPath(); c.roundRect(x, y + 2, w, h, 5); c.fillStyle = 'rgba(0,0,0,0.55)'; c.fill();
  c.beginPath(); c.roundRect(x, y, w, h, 5);
  c.fillStyle = lit ? YEL : CREAM; c.fill();
  c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
  c.restore();
  label(c, key, x + w / 2, y + (h - size) / 2 - 1, size, INK, { align: 'center', track: 0 });
  return w;
}
// A row of [key] action pairs; returns the row's width. align: left | center | right.
function drawKeyLegend(c, items, x, y, h, align, color) {
  const gap = h * 0.35, sep = h * 0.9, size = Math.round(h * 0.62);
  const parts = items.map(([keys, act]) => {
    const kw = keys.map((k) => Math.max(h, labelWidth(c, k, Math.round(h * 0.56)) + h * 0.5)).reduce((a, b) => a + b + 4, -4);
    return { keys, act, w: kw + gap + labelWidth(c, act, size) };
  });
  const total = parts.reduce((a, p) => a + p.w + sep, -sep);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  for (const p of parts) {
    for (const k of p.keys) cx += keycap(c, k, cx, y, h) + 4;
    cx += gap - 4;
    cx += label(c, p.act, cx, y + (h - size) / 2, size, color || CREAM, { outline: 2 }) + sep;
  }
  return total;
}
// The flight controls, as one legend.
const FLIGHT_KEYS = [[['↑'], 'FLAP'], [['←', '→'], 'STEER'], [['↓'], 'DIVE'], [['SPACE'], 'SHOOT GOO'], [['X'], 'ITEM']];
// Pause, sound and restart as three key buttons in a row (right-aligned at x).
function drawSystemButtons(c, x, y, h) {
  const items = [['P', 'PAUSE'], ['M', save.muted ? 'SOUND OFF' : 'SOUND'], ['R', 'RESTART']];
  let cx = x;
  for (let i = items.length - 1; i >= 0; i--) {
    const [k, act] = items[i];
    const w = Math.max(78, labelWidth(c, act, 13) + 16);
    cx -= w;
    c.save(); c.beginPath(); c.roundRect(cx, y, w, h, 8); c.fillStyle = 'rgba(11,9,30,0.8)'; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,246,224,0.3)'; c.stroke(); c.restore();
    keycap(c, k, cx + w / 2 - 12, y + 6, 24);
    label(c, act, cx + w / 2, y + h - 19, 13, CREAM, { align: 'center' });
    cx -= 8;
  }
}
