// GOO PRIX · src/hud.js — The heads-up display.
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

function drawHUD(c) {
  const w = world, p = w.player, L = w.level;
  // ---- top centre: the score, what it just did, and the quota (or the boss's FILTH bar)
  plate(c, W / 2 - 250, 10, 500, 150);
  w.shownScore = w.shownScore == null ? w.score : damp(w.shownScore, w.score, 12, DT);
  const sc = Math.round(w.shownScore);
  const bump = w.deltas.length && w.deltas[w.deltas.length - 1].t < 0.15 ? 1.08 : 1;
  c.save(); c.translate(W / 2 - 40, 46); c.scale(bump, bump);
  hudText(c, fmtScore(sc), 0, -24, 7, YEL, 'center');
  c.restore();
  w.deltas.slice(-3).forEach((d, k) => {
    const a = clamp((1.6 - d.t) / 0.4, 0, 1);
    blockText(c, d.text, W / 2 + 232, 24 + k * 16 - d.t * 8, 2, { align: 'right', color: d.good ? GOO_C : RED, outline: 1.5, outlineColor: INK, alpha: a });
  });
  const bx = W / 2 - 220, bw = 440, by = 100;
  if (w.boss) {
    const b = w.boss;
    hudText(c, 'FILTH', bx, by - 22, 2, GOO_C);
    hudText(c, 'PHASE ' + b.phase + '/3', bx + bw, by - 22, 2, CREAM, 'right');
    c.fillStyle = INK; c.fillRect(bx - 3, by - 3, bw + 6, 26);
    const g = c.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, '#3DA516'); g.addColorStop(0.6, GOO_C); g.addColorStop(1, '#DAFFB0');
    c.fillStyle = g; c.fillRect(bx, by, bw * b.filth / 100, 20);
    for (const m of [40, 75]) { c.fillStyle = WHT; c.fillRect(bx + bw * m / 100 - 1, by - 6, 3, 32); }
    const wiping = b.turrets.every((tr) => tr.hp > 0);
    hudText(c, wiping ? 'JAM A TURRET TO STOP THE SQUEEGEE' : 'SQUEEGEE JAMMED!', W / 2, by + 30, 2, wiping ? CYN : YEL, 'center');
  } else {
    const q = w.quota, f = clamp(w.score / Math.max(1, q), 0, 3);
    const passed = w.score >= q;
    hudText(c, passed ? 'QUOTA SMASHED' : 'QUOTA ' + fmtScore(q), bx, by - 22, 2, passed ? GOO_C : CYN);
    const gr = gradeFor(w.score / Math.max(1, q));
    hudText(c, gr === 'D' ? '' : 'RANK ' + gr, bx + bw, by - 22, 2, GRADE_COLORS[gr], 'right');
    c.fillStyle = INK; c.fillRect(bx - 3, by - 3, bw + 6, 20);
    // the bar fills to the quota at its middle, and keeps going toward an S at the far end
    const k = f <= 1 ? f * 0.5 : 0.5 + (f - 1) / 2 * 0.5;
    c.fillStyle = passed ? GOO_C : YEL; c.fillRect(bx, by, bw * k, 14);
    for (const [m, lab] of [[1, 'C'], [1.6, 'B'], [2.2, 'A'], [3, 'S']]) {
      const xx = bx + bw * (m <= 1 ? m * 0.5 : 0.5 + (m - 1) / 2 * 0.5);
      c.fillStyle = WHT; c.fillRect(xx - 1, by - 5, 3, 24);
      blockText(c, lab, xx - 4, by + 21, 1.5, { color: GRADE_COLORS[lab] });
    }
    // how far through the level you are, with your ship on it
    const prog = clamp(p.dist / w.length, 0, 1), py0 = by + 40;
    c.fillStyle = 'rgba(255,246,224,0.45)'; c.fillRect(bx, py0, bw, 2);
    c.fillStyle = YEL; c.fillRect(bx + bw * prog - 3, py0 - 5, 6, 12);
  }
  // ---- top left: the multiplier, the chain draining away, and the coat of paint it buys
  plate(c, 16, 14, 230, 130, w.mult >= 6 ? MAG : w.mult >= 3 ? YEL : null);
  const mcol = w.mult >= 6 ? MAG : w.mult >= 3 ? YEL : CREAM;
  const pulse = w.chainT > 0 ? 1 + 0.05 * Math.sin(w.t * 12) : 1;
  c.save(); c.translate(32, 26); c.scale(pulse, pulse);
  hudText(c, 'x' + w.mult, 0, 0, 8, mcol);
  c.restore();
  hudText(c, 'CHAIN ' + w.chain, 150, 30, 2, WHT);
  hudText(c, COAT_NAMES[w.coat], 150, 52, 2, w.coat === 2 ? MAG : w.coat === 1 ? YEL : CYN);
  c.fillStyle = INK; c.fillRect(30, 100, 200, 14);
  c.fillStyle = mcol; c.fillRect(32, 102, 196 * clamp(w.chainT / 2.5, 0, 1), 10);
  hudText(c, 'HIT AGAIN TO KEEP IT', 30, 120, 1.5, CYN);
  // ---- top right: which level, the clock, knocks taken and continues left
  plate(c, W - 246, 14, 230, 130);
  const run = game.run;
  hudText(c, (L.boss ? 'FINAL' : 'LEVEL ' + (w.levelIdx + 1) + '/5'), W - 30, 26, 2, CYN, 'right');
  const tLeft = w.boss ? w.boss.time : Math.max(0, (w.length - p.dist) / Math.max(1, levelSpeed(L)));
  const low = tLeft < 10 && Math.floor(w.t * 4) % 2 === 0;
  const ts = Math.ceil(tLeft);
  hudText(c, Math.floor(ts / 60) + ':' + String(ts % 60).padStart(2, '0'), W - 30, 46, 6, low ? RED : WHT, 'right');
  hudText(c, 'KNOCKS ' + w.knocks, W - 30, 100, 2, w.knocks ? RED : GOO_C, 'right');
  if (run && run.mode === 'campaign') hudText(c, 'CONTINUES ' + run.continues, W - 30, 120, 2, CREAM, 'right');
  else hudText(c, 'PRACTICE', W - 30, 120, 2, CREAM, 'right');
  // ---- bottom left: item slot and goo tank
  const ix = 30, iy = H - 122, isz = 86;
  plate(c, 16, iy - 32, 160, isz + 62);
  c.fillStyle = INK; c.fillRect(ix, iy, isz, isz);
  strokeBox(c, ix, iy, isz, isz, 4, p.item || p.roll > 0 ? YEL : WHT);
  if (p.roll > 0) {
    const keys = Object.keys(ITEMS);
    drawItemIcon(c, keys[Math.floor(w.t * 14) % keys.length], ix + isz / 2, iy + isz / 2, isz * 0.8);
  } else if (p.item) {
    drawItemIcon(c, p.item, ix + isz / 2, iy + isz / 2, isz * 0.8);
    hudText(c, ITEMS[p.item].name, ix, iy - 22, 2, YEL);
  } else hudText(c, 'ITEM', ix, iy - 22, 2, CYN);
  if (p.autogun > 0) hudText(c, 'AUTO ' + p.autogun.toFixed(1), ix + isz / 2, iy + isz / 2 - 6, 2, GOO_C, 'center');
  hudText(c, 'X', ix + isz / 2, iy + isz + 8, 2, CYN, 'center');
  const tx = ix + isz + 16, th = isz, tw = 24;
  c.fillStyle = INK; c.fillRect(tx, iy, tw, th);
  const fill = (p.tank / CFG.tank) * (th - 8);
  c.fillStyle = p.geyser > 0 && Math.floor(w.t * 10) % 2 ? WHT : GOO_C;
  c.fillRect(tx + 4, iy + th - 4 - fill, tw - 8, fill);
  strokeBox(c, tx, iy, tw, th, 3, p.tank < CFG.shotCost ? RED : WHT);
  hudText(c, 'GOO', tx + tw / 2, iy + isz + 8, 2, CYN, 'center');
  // ---- bottom right: boost meter (dive charge), or the lock pips in zero-G
  const bx2 = W - 30 - 10 * 22, by2 = H - 66;
  plate(c, bx2 - 16, by2 - 76, 10 * 22 + 30, 122);
  if (L.twist === 'zerog') {
    for (let i = 0; i < 6; i++) {
      const on = i < w.locks.length;
      c.fillStyle = INK; c.fillRect(bx2 + i * 37 - 2, by2 - 2, 32, 30);
      c.fillStyle = on ? (i % 2 ? YEL : RED) : '#22222C'; c.fillRect(bx2 + i * 37, by2, 28, 26);
    }
    hudText(c, w.locks.length ? 'LOCKS ' + w.locks.length + ' · LET GO!' : 'HOLD SPACE: LOCK', bx2, by2 - 20, 2, w.locks.length ? YEL : CYN);
  } else {
    const charge = p.boostT > 0 ? 1 : clamp(p.diveT / CFG.swoopTiers[1][0], 0, 1);
    const lit = Math.round(charge * 10);
    for (let i = 0; i < 10; i++) {
      const on = i < lit;
      c.fillStyle = on ? (p.boostT > 0 ? (Math.floor(w.t * 16) % 2 ? ORG : YEL) : CYN) : '#22222C';
      c.fillRect(bx2 + i * 22, by2, 18, 26);
    }
    hudText(c, p.boostT > 0 ? 'BOOST!' : p.diveT > 0.1 ? 'CHARGE' : L.twist === 'rhythm' ? 'FIRE ON THE BEAT' : 'DIVE TO CHARGE', bx2, by2 - 20, 2, p.boostT > 0 ? ORG : L.twist === 'rhythm' ? MAG : CYN);
  }
  hudText(c, Math.round(p.speed * 3.6) + ' GPH', W - 30, by2 - 64, 4, WHT, 'right');
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
