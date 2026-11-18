// GOO PRIX · src/ui/hud.js — The heads-up display.
'use strict';

// ============================================================================================
// HUD — the score up top, multiplier and chain, quota strip, level clock, item, goo tank, boost
// ============================================================================================
function fmtTime(t) {
  if (!(t >= 0)) t = 0;
  const m = Math.floor(t / 60), s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
}
function drawItemIcon(c, it, x, y, size) {
  const s = size;
  c.save(); c.translate(x, y);
  c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = Math.max(2, s * 0.08); c.lineJoin = 'round';
  switch (it) {
    case 'burp': // a burp cloud with a flame cone
      c.beginPath(); c.arc(-s * 0.15, 0, s * 0.22, 0, TAU); c.arc(s * 0.12, -s * 0.08, s * 0.2, 0, TAU); c.arc(s * 0.15, s * 0.15, s * 0.16, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.38, 0); c.lineTo(-s * 0.48, -s * 0.12); c.lineTo(-s * 0.48, s * 0.12); c.closePath(); c.fill();
      break;
    case 'bazooka':
      gooBlob(c, s * 0.08, 0, s * 0.3, 4, 0);
      c.fillRect(-s * 0.45, -s * 0.05, s * 0.2, s * 0.1); c.fillRect(-s * 0.42, -s * 0.18, s * 0.12, s * 0.08); c.fillRect(-s * 0.42, s * 0.1, s * 0.12, s * 0.08);
      break;
    case 'sock':
      c.beginPath(); c.moveTo(-s * 0.15, -s * 0.38); c.lineTo(s * 0.1, -s * 0.38); c.lineTo(s * 0.1, s * 0.1); c.lineTo(s * 0.35, s * 0.1); c.lineTo(s * 0.35, s * 0.3); c.lineTo(-s * 0.15, s * 0.3); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.15, -s * 0.2); c.lineTo(-s * 0.42, -s * 0.36); c.moveTo(s * 0.1, -s * 0.2); c.lineTo(s * 0.4, -s * 0.36); c.stroke();
      break;
    case 'balloon':
      gooBlob(c, 0, -s * 0.06, s * 0.28, 9, 0, '#000'); c.strokeStyle = GOO_C; c.stroke();
      c.beginPath(); c.moveTo(0, s * 0.22); c.lineTo(0, s * 0.42); c.strokeStyle = '#fff'; c.stroke();
      break;
    case 'bubble':
      c.setLineDash([s * 0.12, s * 0.08]); c.beginPath(); c.arc(0, 0, s * 0.34, 0, TAU); c.stroke(); c.setLineDash([]);
      c.fillRect(-s * 0.18, -s * 0.18, s * 0.08, s * 0.08);
      break;
    case 'ghost':
      c.setLineDash([s * 0.1, s * 0.07]);
      c.beginPath(); c.moveTo(-s * 0.25, s * 0.3); c.lineTo(-s * 0.25, -s * 0.05); c.arc(0, -s * 0.05, s * 0.25, Math.PI, 0); c.lineTo(s * 0.25, s * 0.3); c.lineTo(s * 0.12, s * 0.2); c.lineTo(0, s * 0.3); c.lineTo(-s * 0.12, s * 0.2); c.closePath(); c.stroke();
      c.setLineDash([]); c.fillRect(-s * 0.12, -s * 0.1, s * 0.07, s * 0.07); c.fillRect(s * 0.05, -s * 0.1, s * 0.07, s * 0.07);
      break;
    case 'geyser':
      for (const dx of [-0.25, 0, 0.25]) gooBlob(c, dx * s, -s * 0.15 - Math.abs(dx) * -s * 0.2, s * 0.12, 3 + dx * 10, 0);
      c.fillStyle = GOO_C; c.fillRect(-s * 0.3, s * 0.2, s * 0.6, s * 0.12);
      break;
    case 'sneeze':
      c.beginPath(); c.arc(-s * 0.15, 0, s * 0.18, -Math.PI / 2, Math.PI / 2); c.stroke();
      c.beginPath();
      for (let i = -2; i <= 2; i++) { c.moveTo(s * 0.05, i * s * 0.07); c.lineTo(s * 0.42, i * s * 0.16); }
      c.stroke();
      break;
    case 'autogun': // a barrel spitting a stream of goo blobs
      c.fillRect(-s * 0.42, -s * 0.1, s * 0.3, s * 0.2);
      c.fillRect(-s * 0.36, s * 0.1, s * 0.1, s * 0.16);
      for (let i = 0; i < 3; i++) gooBlob(c, -s * 0.02 + i * s * 0.17, (i % 2 ? -1 : 1) * s * 0.05, s * (0.11 - i * 0.015), 2 + i, 0);
      break;
    case 'bomb': // a round bomb with a lit fuse
      c.beginPath(); c.arc(-s * 0.04, s * 0.06, s * 0.27, 0, TAU);
      c.fillStyle = RED; c.fill(); c.lineWidth = Math.max(2, s * 0.07); c.strokeStyle = WHT; c.stroke();
      c.fillStyle = WHT; c.fillRect(s * 0.06, -s * 0.28, s * 0.1, s * 0.12);
      c.beginPath(); c.moveTo(s * 0.11, -s * 0.28); c.quadraticCurveTo(s * 0.2, -s * 0.42, s * 0.3, -s * 0.36); c.stroke();
      c.fillStyle = YEL; c.beginPath(); c.arc(s * 0.32, -s * 0.38, s * 0.07, 0, TAU); c.fill();
      break;
  }
  c.restore();
}

// A chamfered ink plate with a neon border: every HUD cluster sits on one, so it reads on any sky.
function plate(c, x, y, w, h, border) {
  c.beginPath(); c.roundRect(x, y, w, h, 12);
  c.fillStyle = 'rgba(11,11,18,0.74)'; c.fill();
  c.lineWidth = 3; c.strokeStyle = border || CREAM; c.stroke();
  if (!border) {
    // two icing drips off the bottom edge
    c.fillStyle = CREAM;
    for (const [fx, len] of [[0.22, 10], [0.74, 15]]) {
      c.beginPath(); c.roundRect(x + w * fx - 4, y + h - 2, 8, len, 4); c.fill();
    }
  }
}
// HUD lettering: block font with an ink keyline and a hard ink drop shadow.
function hudText(c, text, x, y, px, color, align) {
  return blockText(c, text, x, y, px, { align: align || 'left', color, outline: Math.max(1.5, px * 0.5), outlineColor: INK, shadow: Math.max(2, px * 0.7), shadowColor: INK });
}
function fmtScore(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

// The play HUD states the game in words: which stage, what to beat, how you win and lose, who
// you are flying, what everything is worth, and every control as a key. H hides the side panels.
function drawHUD(c) {
  const w = world, p = w.player, L = w.level;
  const cx = W / 2;
  // ---- top centre: the stage, its bar, its rule, and the WIN / LOSE pills
  const stage = (loopOf() ? 'LOOP ' + (loopOf() + 1) + ' · ' : '') + 'STAGE ' + (w.levelIdx + 1) + '/6 · ' + (L.boss ? 'FINAL BOSS' : L.name);
  label(c, stage, cx, 6, 18, AQUA, { align: 'center', outline: 2 });
  const bx = cx - 300, bw = 600, by = 50;
  c.fillStyle = 'rgba(11,9,30,0.85)'; c.beginPath(); c.roundRect(bx - 4, by - 4, bw + 8, 22, 6); c.fill();
  if (w.boss) {
    const b = w.boss;
    label(c, 'MISTER SPOTLESS — FILTH ' + Math.floor(b.filth) + '%', bx, 28, 17, GOO_C, { outline: 2 });
    label(c, 'PHASE ' + b.phase + '/3', bx + bw, 28, 17, CREAM, { align: 'right', outline: 2 });
    const fg = c.createLinearGradient(bx, 0, bx + bw, 0);
    fg.addColorStop(0, '#3DA516'); fg.addColorStop(0.6, GOO_C); fg.addColorStop(1, '#DAFFB0');
    c.fillStyle = fg; c.fillRect(bx, by, bw * b.filth / 100, 14);
    for (const m of [40, 75]) { c.fillStyle = WHT; c.fillRect(bx + bw * m / 100 - 1, by - 4, 3, 22); }
    const state = b.phase >= 3 ? 'PHASE 3/3 · ALL FOUR GOLD STAINS EXPOSED — FINISH HIM' : b.phase >= 2 ? 'PHASE 2/3 · MAW OPEN — FEED IT GOO · WEAK POINTS x3' : 'PHASE 1/3 · JAM A SPRAY TURRET TO STOP THE SQUEEGEE';
    label(c, state, cx, 70, 15, YEL, { align: 'center', outline: 2 });
  } else {
    const q = w.quota, f = clamp(w.score / Math.max(1, q), 0, 3);
    const k = f <= 1 ? f * 0.5 : 0.5 + (f - 1) / 2 * 0.5;
    label(c, 'QUOTA ' + fmtScore(q) + ' · ' + Math.floor(f * 100) + '%', bx, 28, 17, w.score >= q ? GOO_C : YEL, { outline: 2 });
    const gr = gradeFor(f);
    label(c, gr === 'D' ? 'NOT YET' : 'GRADE ' + gr, bx + bw, 28, 17, GRADE_COLORS[gr], { align: 'right', outline: 2 });
    c.fillStyle = w.score >= q ? GOO_C : YEL; c.fillRect(bx, by, bw * k, 14);
    for (const [m, lab] of [[1, 'C'], [1.6, 'B'], [2.2, 'A'], [3, 'S']]) {
      const xx = bx + bw * (m <= 1 ? m * 0.5 : 0.5 + (m - 1) / 2 * 0.5);
      c.fillStyle = WHT; c.fillRect(xx - 1, by - 4, 2, 22);
      label(c, lab, xx - 3, by + 1, 11, INK, { align: 'right' });
    }
    const prog = clamp(p.dist / w.length, 0, 1);
    c.fillStyle = CREAM; c.beginPath(); c.moveTo(bx + bw * prog - 5, by + 18); c.lineTo(bx + bw * prog + 5, by + 18); c.lineTo(bx + bw * prog, by + 12); c.closePath(); c.fill();
    label(c, L.rule, cx, 70, 15, YEL, { align: 'center', outline: 2 });
  }
  // the clock, big, right of the bar
  const tLeft = w.boss ? w.boss.time : Math.max(0, (w.length - p.dist) / Math.max(1, levelSpeed(L)));
  const ts = Math.ceil(tLeft), low = tLeft < 10 && Math.floor(w.t * 4) % 2 === 0;
  blockText(c, Math.floor(ts / 60) + ':' + String(ts % 60).padStart(2, '0'), bx + bw + 14, 36, 4, { color: low ? RED : WHT, outline: 2, outlineColor: INK });
  drawWinLosePills(c, cx, 94, 26);
  // ---- the side columns (H toggles them off)
  if (!game.hudCompact) {
    drawRunPanel(c, 12, 10, 212);
    drawScorePanel(c, W - 224, 10, 212);
    const ta = clamp((TARGETS_SHOWN - w.t) / 0.6, 0, 1);
    if (ta > 0) { c.save(); c.globalAlpha = ta; drawTargetsPanel(c, W - 224, 138, 212); c.restore(); }
  } else blockText(c, fmtScore(w.score), W - 20, 12, 5, { align: 'right', color: YEL, outline: 2, outlineColor: INK });
  // score deltas float by the top bar
  w.deltas.slice(-3).forEach((d, k) => {
    const a = clamp((1.6 - d.t) / 0.4, 0, 1);
    label(c, d.text, cx + 300, 126 + k * 18 - d.t * 6, 16, d.good ? GOO_C : RED, { align: 'right', outline: 2, alpha: a });
  });
  // ---- bottom: the goo tank and item as key cards, the flight keys, pause / sound / restart
  const yb = H - 60;
  panel(c, 12, yb, 236, 50);
  const kw = keycap(c, 'SPACE', 22, yb + 12, 26, keyDown('Space'));
  label(c, L.twist === 'zerog' ? 'GOO · LOCKS ' + w.locks.length + '/6' : 'GOO', 30 + kw, yb + 9, 15, GOO_C);
  const gx = 30 + kw, gw = 236 - kw - 30, tank = clamp(p.tank / tankMax(p), 0, 1);
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(gx, yb + 30, gw, 8);
  c.fillStyle = p.tank < CFG.shotCost ? RED : p.geyser > 0 && Math.floor(w.t * 10) % 2 ? WHT : GOO_C; c.fillRect(gx, yb + 30, gw * tank, 8);
  const charge = p.boostT > 0 ? 1 : clamp(p.diveT / CFG.swoopTiers[1][0], 0, 1);
  c.fillStyle = p.boostT > 0 ? ORG : AQUA; c.fillRect(gx, yb + 41, gw * charge, 3);
  panel(c, 256, yb, 190, 50);
  keycap(c, 'X', 266, yb + 12, 26, !!p.item);
  c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(300, yb + 6, 38, 38);
  if (p.roll > 0) { const keys = Object.keys(ITEMS); drawItemIcon(c, keys[Math.floor(w.t * 14) % keys.length], 319, yb + 25, 34); }
  else if (p.item) drawItemIcon(c, p.item, 319, yb + 25, 34);
  label(c, p.autogun > 0 ? 'AUTO-GOO ' + p.autogun.toFixed(1) : p.item ? ITEMS[p.item].name : 'ITEM', 346, yb + 9, 14, p.item || p.autogun > 0 ? YEL : '#B9B4D8', { maxW: 94 });
  label(c, p.item ? 'PRESS X' : 'FLY INTO A CUBE', 346, yb + 28, 12, '#B9B4D8', { maxW: 94 });
  drawKeyLegend(c, L.twist === 'zerog' ? [[['↑'], 'THRUST UP'], [['←', '→'], 'STEER'], [['↓'], 'THRUST DOWN']] : [[['↑'], 'FLAP'], [['←', '→'], 'STEER'], [['↓'], 'DIVE']], 458, yb + 13, 24, 'left');
  drawSystemButtons(c, W - 12, yb, 50);
  // ---- incoming warning chevron at the screen edge
  if (w.incoming && Math.floor(w.t * 10) % 2 === 0) {
    const ex = w.warnSide < 0 ? 250 : W - 250;
    const d = w.warnSide < 0 ? -1 : 1;
    c.beginPath();
    c.moveTo(ex + d * 26, 360); c.lineTo(ex - d * 6, 330); c.lineTo(ex - d * 6, 348); c.lineTo(ex - d * 26, 348); c.lineTo(ex - d * 26, 372); c.lineTo(ex - d * 6, 372); c.lineTo(ex - d * 6, 390); c.closePath();
    inked(c, RED, 4);
    label(c, 'INCOMING', ex, 398, 16, RED, { align: 'center', outline: 2 });
  }
}
// The ink vignette on every play frame: darker corners pull the eye to the middle.
let VIGNETTE = null;
function drawVignette(c) {
  if (!VIGNETTE) {
    VIGNETTE = document.createElement('canvas'); VIGNETTE.width = W; VIGNETTE.height = H;
    const k = VIGNETTE.getContext('2d');
    const g = k.createRadialGradient(W / 2, H * 0.48, H * 0.45, W / 2, H * 0.48, W * 0.72);
    g.addColorStop(0, 'rgba(11,11,18,0)'); g.addColorStop(1, 'rgba(11,11,18,0.42)');
    k.fillStyle = g; k.fillRect(0, 0, W, H);
  }
  c.drawImage(VIGNETTE, 0, 0);
}
