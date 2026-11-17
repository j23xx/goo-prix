// GOO PRIX · src/ui/menu-widgets.js — Menu buttons, mouse hit areas, keyboard menu navigation and grade badges.
'use strict';

const UI = { rects: new Map() };
function uiRect(id, x, y, w, h) { UI.rects.set(id, [x, y, w, h]); }
function uiOver(id) {
  const r = UI.rects.get(id);
  return !!r && input.mouseIn && input.mx >= r[0] && input.mx <= r[0] + r[2] && input.my >= r[1] && input.my <= r[1] + r[3];
}
function menuNav(state, ids) {
  const n = ids.length;
  if (keyHit('ArrowUp', 'KeyW')) { state.i = (state.i + n - 1) % n; sfx.uiMove(); }
  if (keyHit('ArrowDown', 'KeyS')) { state.i = (state.i + 1) % n; sfx.uiMove(); }
  if (input.moved) for (let k = 0; k < n; k++) if (uiOver(ids[k]) && state.i !== k) { state.i = k; sfx.uiMove(); }
  if (keyHit('Enter', 'Space', 'NumpadEnter')) return state.i;
  if (input.click) for (let k = 0; k < n; k++) if (uiOver(ids[k])) { state.i = k; return k; }
  return -1;
}
function drawButton(c, id, label, x, y, w, h, selected, opts) {
  uiRect(id, x, y, w, h);
  const o = opts || {};
  if (selected) {
    c.fillStyle = PNK; c.fillRect(x + 5, y + 5, w, h);   // hard pink offset shadow
    c.fillStyle = YEL; c.fillRect(x, y, w, h);
    strokeBox(c, x, y, w, h, 3, INK);
  } else { c.fillStyle = 'rgba(11,11,18,0.88)'; c.fillRect(x, y, w, h); strokeBox(c, x, y, w, h, 2, o.dim ? '#3a3a44' : CREAM); }
  const px = o.px || 3;
  blockText(c, label, x + w / 2, y + h / 2 - px * 3.5, px, { align: 'center', color: selected ? INK : o.dim ? '#5a5a66' : WHT });
  if (selected && o.arrows) {
    blockText(c, '<', x + 14, y + h / 2 - px * 3.5, px, { color: INK });
    blockText(c, '>', x + w - 14, y + h / 2 - px * 3.5, px, { align: 'right', color: INK });
  }
}
function smallText(c, text, x, y, size, color, align) {
  c.font = '600 ' + size + 'px "Chakra Petch", "Bahnschrift", "DIN Alternate", "Avenir Next Condensed", "Trebuchet MS", sans-serif';
  c.fillStyle = color || '#909090'; c.textAlign = align || 'left'; c.textBaseline = 'top';
  c.fillText(text, x, y);
}
function dim(c, a) { c.fillStyle = 'rgba(0,0,0,' + a + ')'; c.fillRect(0, 0, W, H); }

// A letter grade in a stamped roundel (null: an empty slot).
function drawGradeBadge(c, x, y, r, g) {
  c.beginPath(); c.arc(x, y, r, 0, TAU);
  c.fillStyle = g ? GRADE_COLORS[g] : '#15151E'; c.fill();
  c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.lineWidth = 2; c.strokeStyle = g ? WHT : '#3a3a44'; c.beginPath(); c.arc(x, y, r - 5, 0, TAU); c.stroke();
  blockText(c, g || '-', x + r * 0.03, y - r * 0.42, r * 0.12, { align: 'center', color: g ? INK : '#3a3a44' });
}
// A big rubber-stamp grade, slammed down at an angle.
function drawGradeStamp(c, x, y, g, t, size) {
  const s = size || 1;
  const k = clamp(t / 0.22, 0, 1);
  const sc = (1 + (1 - k) * 2.2) * s;
  c.save(); c.translate(x, y); c.rotate(-0.18); c.scale(sc, sc); c.globalAlpha = k;
  c.beginPath(); c.roundRect(-82, -82, 164, 164, 22);
  c.fillStyle = 'rgba(11,11,18,0.85)'; c.fill();
  c.lineWidth = 10; c.strokeStyle = GRADE_COLORS[g]; c.stroke();
  c.lineWidth = 3; c.strokeStyle = WHT; c.beginPath(); c.roundRect(-70, -70, 140, 140, 16); c.stroke();
  blockText(c, g, 0, -50, 15, { align: 'center', color: GRADE_COLORS[g], outline: 4, outlineColor: INK, shadow: 6, shadowColor: g === 'S' ? PNK : INK });
  c.restore();
  if (g === 'S' && k >= 1) { glint(c, x + 60 * s, y - 70 * s, 22 * s * (0.6 + 0.4 * Math.sin(t * 8)), 0.95); glint(c, x - 70 * s, y + 50 * s, 14 * s * (0.6 + 0.4 * Math.sin(t * 6 + 1)), 0.9); }
}
