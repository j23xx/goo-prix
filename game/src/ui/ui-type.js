// GOO PRIX · src/ui/ui-type.js — The type system: clean labels, panels and the shared colour ground.
'use strict';

// ============================================================================================
// UI_TYPE — the pixel block font is for logos, numerals and headlines only; every label, list
// and line of rules is set in a clean condensed sans, uppercase, so it reads when shrunk
// ============================================================================================
const SANS = '"Avenir Next Condensed", "DIN Condensed", "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
// The one ground every menu and the boss arena share: night navy to violet.
const GROUND = { top: '#0E0B26', mid: '#161233', low: '#2A1B5C' };

// Set a label in the sans: uppercase, bold, 1 px tracking, with an optional ink outline.
// opts: align, weight, outline (px), color2 (shadow colour), alpha, maxW (shrink to fit). Returns width.
function label(c, text, x, y, size, color, opts) {
  const o = opts || {};
  text = String(text).toUpperCase();
  c.save();
  c.font = (o.weight || 700) + ' ' + size + 'px ' + SANS;
  if ('letterSpacing' in c) c.letterSpacing = (o.track != null ? o.track : 1) + 'px';
  c.textBaseline = 'top'; c.textAlign = o.align || 'left';
  let w = c.measureText(text).width;
  if (o.maxW && w > o.maxW) { const k = o.maxW / w; c.font = (o.weight || 700) + ' ' + Math.floor(size * k) + 'px ' + SANS; w = c.measureText(text).width; }
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  if (o.outline) { c.lineJoin = 'round'; c.lineWidth = o.outline * 2; c.strokeStyle = o.outlineColor || INK; c.strokeText(text, x, y); }
  if (o.shadow) { c.fillStyle = o.color2 || INK; c.fillText(text, x + o.shadow, y + o.shadow); }
  c.fillStyle = color || CREAM; c.fillText(text, x, y);
  c.restore();
  return w;
}
function labelWidth(c, text, size, weight) {
  c.save(); c.font = (weight || 700) + ' ' + size + 'px ' + SANS;
  if ('letterSpacing' in c) c.letterSpacing = '1px';
  const w = c.measureText(String(text).toUpperCase()).width; c.restore();
  return w;
}

// A translucent ink panel with a thin coloured top rule and a small heading.
function panel(c, x, y, w, h, title, accent) {
  c.save();
  c.beginPath(); c.roundRect(x, y, w, h, 10);
  c.fillStyle = 'rgba(11,9,30,0.8)'; c.fill();
  c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,246,224,0.22)'; c.stroke();
  c.fillStyle = accent || AQUA; c.fillRect(x + 10, y, Math.min(46, w - 20), 3);
  c.restore();
  if (title) label(c, title, x + 10, y + 7, 15, accent || AQUA);
}

// Fill the frame with the shared navy-violet ground, a soft glow and a few lime drips.
function drawGround(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, GROUND.top); g.addColorStop(0.55, GROUND.mid); g.addColorStop(1, GROUND.low);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = c.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, W * 0.6);
  r.addColorStop(0, 'rgba(127,242,255,0.10)'); r.addColorStop(1, 'rgba(127,242,255,0)');
  c.fillStyle = r; c.fillRect(0, 0, W, H);
}
// Wash a live world render into the shared ground, so every menu reads as the same product.
function groundWash(c, a) {
  c.save();
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(14,11,38,' + a + ')'); g.addColorStop(1, 'rgba(42,27,92,' + a + ')');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}
