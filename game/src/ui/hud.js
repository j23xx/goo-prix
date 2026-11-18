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

// One slim bar along the top (multiplier · score · stage and clock, with the quota line under it),
// thin goo and boost bars along the bottom, the item slot in the corner. Under 12% of the frame.
function drawHUD(c) {
  const w = world, p = w.player, L = w.level;
  const barH = 62;
  const g = c.createLinearGradient(0, 0, 0, barH);
  g.addColorStop(0, 'rgba(11,11,18,0.92)'); g.addColorStop(1, 'rgba(11,11,18,0.72)');
  c.fillStyle = g; c.fillRect(0, 0, W, barH);
  // ---- left: the multiplier in its coat colour, the chain draining under it
  const mcol = w.mult >= 6 ? MAG : w.mult >= 3 ? YEL : CREAM;
  const pulse = w.chainT > 0 ? 1 + 0.05 * Math.sin(w.t * 12) : 1;
  c.save(); c.translate(20, 8); c.scale(pulse, pulse);
  hudText(c, 'x' + w.mult, 0, 0, 6, mcol);
  c.restore();
  hudText(c, 'CHAIN ' + w.chain, 128, 10, 2, WHT);
  hudText(c, COAT_NAMES[w.coat], 128, 30, 2, w.coat === 2 ? MAG : w.coat === 1 ? YEL : CYN);
  c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(20, 52, 220, 4);
  c.fillStyle = mcol; c.fillRect(20, 52, 220 * clamp(w.chainT / chainLife(), 0, 1), 4);
  // ---- centre: the score, and what it just did
  w.shownScore = w.shownScore == null ? w.score : damp(w.shownScore, w.score, 12, DT);
  const bump = w.deltas.length && w.deltas[w.deltas.length - 1].t < 0.15 ? 1.08 : 1;
  c.save(); c.translate(W / 2, 31); c.scale(bump, bump);
  hudText(c, fmtScore(Math.round(w.shownScore)), 0, -24, 7, YEL, 'center');
  c.restore();
  w.deltas.slice(-2).forEach((d, k) => {
    const a = clamp((1.6 - d.t) / 0.4, 0, 1);
    blockText(c, d.text, W / 2 + 190, 12 + k * 20 - d.t * 6, 2, { color: d.good ? GOO_C : RED, outline: 1.5, outlineColor: INK, alpha: a });
  });
  // ---- right: which stage, the clock, knocks
  const tLeft = w.boss ? w.boss.time : Math.max(0, (w.length - p.dist) / Math.max(1, levelSpeed(L)));
  const ts = Math.ceil(tLeft), low = tLeft < 10 && Math.floor(w.t * 4) % 2 === 0;
  hudText(c, Math.floor(ts / 60) + ':' + String(ts % 60).padStart(2, '0'), W - 20, 10, 5, low ? RED : WHT, 'right');
  const stage = (loopOf() ? 'LOOP ' + (loopOf() + 1) + ' ' : '') + (L.boss ? '6/6 FINAL BOSS' : (w.levelIdx + 1) + '/6 ' + L.name);
  hudText(c, stage, W - 168, 10, 2, CYN, 'right');
  hudText(c, 'KNOCKS ' + w.knocks, W - 168, 32, 2, w.knocks ? RED : GOO_C, 'right');
  // ---- the quota line hugging the bar's bottom edge (the boss shows his FILTH at the bottom instead)
  if (!w.boss) {
    const q = w.quota, f = clamp(w.score / Math.max(1, q), 0, 3);
    const k = f <= 1 ? f * 0.5 : 0.5 + (f - 1) / 2 * 0.5;
    c.fillStyle = 'rgba(11,11,18,0.8)'; c.fillRect(0, barH, W, 8);
    c.fillStyle = w.score >= q ? GOO_C : YEL; c.fillRect(0, barH + 1, W * k, 6);
    for (const [m, lab] of [[1, 'C'], [1.6, 'B'], [2.2, 'A'], [3, 'S']]) {
      const xx = W * (m <= 1 ? m * 0.5 : 0.5 + (m - 1) / 2 * 0.5) - (m === 3 ? 14 : 0);
      c.fillStyle = WHT; c.fillRect(xx - 1, barH, 2, 10);
      blockText(c, m === 1 ? 'QUOTA' : lab, xx + 4, barH + 12, 1.5, { color: GRADE_COLORS[lab], outline: 1, outlineColor: INK });
    }
    const prog = clamp(p.dist / w.length, 0, 1);
    c.fillStyle = WHT; c.beginPath(); c.moveTo(W * prog - 6, barH + 8); c.lineTo(W * prog + 6, barH + 8); c.lineTo(W * prog, barH + 16); c.closePath(); c.fill();
  }
  // ---- this run's Mix-ins, a small row under the score
  if (game.run && game.run.mixins.length) drawMixinRow(c, game.run.mixins, W / 2, barH + 40, 26, 'center');
  // ---- bottom: item slot, goo tank and boost as thin bars, the boss's FILTH above them
  const isz = 56, ix = 14, iy = H - isz - 14;
  c.fillStyle = 'rgba(11,11,18,0.85)'; c.fillRect(ix, iy, isz, isz);
  strokeBox(c, ix, iy, isz, isz, 3, p.item || p.roll > 0 ? YEL : 'rgba(255,255,255,0.5)');
  if (p.roll > 0) { const keys = Object.keys(ITEMS); drawItemIcon(c, keys[Math.floor(w.t * 14) % keys.length], ix + isz / 2, iy + isz / 2, isz * 0.8); }
  else if (p.item) { drawItemIcon(c, p.item, ix + isz / 2, iy + isz / 2, isz * 0.8); hudText(c, 'X', ix + isz - 12, iy + isz - 16, 2, YEL); }
  if (p.autogun > 0) hudText(c, 'AUTO-GOO ' + p.autogun.toFixed(1), ix + isz + 12, iy + 2, 2, GOO_C);
  const by = H - 24, gx0 = ix + isz + 12, gw = W / 2 - gx0 - 30;
  const tank = clamp(p.tank / tankMax(p), 0, 1);
  c.fillStyle = 'rgba(11,11,18,0.85)'; c.fillRect(gx0 - 2, by - 2, gw + 4, 14);
  c.fillStyle = p.tank < CFG.shotCost ? RED : p.geyser > 0 && Math.floor(w.t * 10) % 2 ? WHT : GOO_C; c.fillRect(gx0, by, gw * tank, 10);
  blockText(c, 'GOO', gx0, by - 18, 2, { color: GOO_C, outline: 1.5, outlineColor: INK });
  const bx0 = W / 2 + 30, bw = W - 30 - bx0;
  c.fillStyle = 'rgba(11,11,18,0.85)'; c.fillRect(bx0 - 2, by - 2, bw + 4, 14);
  if (L.twist === 'zerog') {
    for (let i = 0; i < 6; i++) { c.fillStyle = i < w.locks.length ? (i % 2 ? YEL : RED) : '#22222C'; c.fillRect(bx0 + i * (bw / 6), by, bw / 6 - 4, 10); }
    blockText(c, w.locks.length ? 'LOCKS ' + w.locks.length + ': LET GO!' : 'HOLD SPACE TO LOCK', bx0, by - 18, 2, { color: w.locks.length ? YEL : CYN, outline: 1.5, outlineColor: INK });
  } else {
    const charge = p.boostT > 0 ? 1 : clamp(p.diveT / CFG.swoopTiers[1][0], 0, 1);
    c.fillStyle = p.boostT > 0 ? (Math.floor(w.t * 16) % 2 ? ORG : YEL) : CYN; c.fillRect(bx0, by, bw * charge, 10);
    blockText(c, p.boostT > 0 ? 'BOOST!' : L.twist === 'rhythm' ? 'FIRE ON THE BEAT' : 'DIVE + FLAP: BOOST', bx0, by - 18, 2, { color: p.boostT > 0 ? ORG : L.twist === 'rhythm' ? MAG : CYN, outline: 1.5, outlineColor: INK });
  }
  if (w.boss) {
    const b = w.boss, fx = W * 0.18, fw = W * 0.64, fy = barH + 4;
    c.fillStyle = 'rgba(11,11,18,0.88)'; c.fillRect(fx - 3, fy - 3, fw + 6, 22);
    const fg = c.createLinearGradient(fx, 0, fx + fw, 0);
    fg.addColorStop(0, '#3DA516'); fg.addColorStop(0.6, GOO_C); fg.addColorStop(1, '#DAFFB0');
    c.fillStyle = fg; c.fillRect(fx, fy, fw * b.filth / 100, 16);
    for (const m of [40, 75]) { c.fillStyle = WHT; c.fillRect(fx + fw * m / 100 - 1, fy - 5, 3, 26); }
    blockText(c, 'FILTH ' + Math.floor(b.filth) + '% · 100% WINS', fx, fy + 24, 2, { color: GOO_C, outline: 1.5, outlineColor: INK });
    const wiping = b.turrets.every((tr) => tr.hp > 0);
    blockText(c, 'PHASE ' + b.phase + '/3 · ' + (wiping ? 'JAM A TURRET!' : 'SQUEEGEE JAMMED'), fx + fw, fy + 24, 2, { align: 'right', color: wiping ? CYN : YEL, outline: 1.5, outlineColor: INK });
  }
  // ---- incoming warning chevron at the screen edge
  if (w.incoming && Math.floor(w.t * 10) % 2 === 0) {
    const ex = w.warnSide < 0 ? 90 : W - 90;
    const d = w.warnSide < 0 ? -1 : 1;
    c.beginPath();
    c.moveTo(ex + d * 26, 360); c.lineTo(ex - d * 6, 330); c.lineTo(ex - d * 6, 348); c.lineTo(ex - d * 26, 348); c.lineTo(ex - d * 26, 372); c.lineTo(ex - d * 6, 372); c.lineTo(ex - d * 6, 390); c.closePath();
    inked(c, RED, 4);
    hudText(c, 'INCOMING', ex, 400, 2, RED, 'center');
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
