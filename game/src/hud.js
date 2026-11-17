// GOO PRIX · src/hud.js — The heads-up display.
'use strict';

// ============================================================================================
// HUD — the Pong scoreboard (position | lap), progress strip, timer, item, goo tank, boost, mirror
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
// The position numeral wears its medal: gold, silver, bronze, then cream.
function rankColor(place) { return ['#FFC21A', '#D9DDEA', '#FF8A3D'][place] || CREAM; }
// HUD lettering: block font with an ink keyline and a hard ink drop shadow.
function hudText(c, text, x, y, px, color, align) {
  return blockText(c, text, x, y, px, { align: align || 'left', color, outline: Math.max(1.5, px * 0.5), outlineColor: INK, shadow: Math.max(2, px * 0.7), shadowColor: INK });
}

function drawHUD(c) {
  const w = world, p = w.player, T = TRACK;
  const raceLen = CFG.laps * T.L;
  const pos = p.place + 1;
  const lap = Math.min(CFG.laps, Math.floor(Math.max(0, p.dist) / T.L) + 1);
  // ---- the scoreboard: POS | LAP in giant Pong numerals with a dashed net between them
  plate(c, W / 2 - 236, 10, 472, 196);
  hudText(c, String(pos), W / 2 - 52, 20, 16, rankColor(p.place), 'right');
  hudText(c, ORD[p.place].slice(1), W / 2 - 46, 22, 3, rankColor(p.place));
  hudText(c, '/8', W / 2 - 46, 50, 3, CREAM);
  hudText(c, String(lap), W / 2 + 52, 20, 16, CREAM);
  hudText(c, '/' + CFG.laps, W / 2 + 52 + 86, 22, 3, CREAM);
  c.fillStyle = CREAM;
  for (let y = 18; y < 134; y += 16) c.fillRect(W / 2 - 3, y, 6, 9);
  hudText(c, 'POS', W / 2 - 52, 140, 2, CYN, 'right');
  hudText(c, 'LAP', W / 2 + 52, 140, 2, CYN);
  // progress strip: everyone's place along the whole race, you tallest
  const sx0 = W / 2 - 210, sw = 420, sy0 = 166;
  const finalLap = lap === CFG.laps && !p.finished;
  const blinkOn = !finalLap || Math.floor(w.t * 4) % 2 === 0;
  c.fillStyle = blinkOn ? WHT : PNK;
  c.fillRect(sx0, sy0, sw, 2);
  for (let k = 1; k < CFG.laps; k++) for (let y = -8; y < 10; y += 6) c.fillRect(sx0 + sw * k / CFG.laps - 1, sy0 + y, 2, 3);
  c.fillRect(sx0 + sw - 2, sy0 - 8, 4, 18);
  for (const r of w.racers) {
    if (r === p) continue;
    const x = sx0 + clamp(r.dist / raceLen, 0, 1) * sw;
    c.fillStyle = INK; c.fillRect(x - 3, sy0 - 7, 6, 16);
    c.fillStyle = r.def.color; c.fillRect(x - 2, sy0 - 6, 4, 14);
  }
  const px1 = sx0 + clamp(p.dist / raceLen, 0, 1) * sw;
  c.fillStyle = INK; c.fillRect(px1 - 4, sy0 - 13, 8, 28);
  c.fillStyle = YEL; c.fillRect(px1 - 3, sy0 - 12, 6, 26);
  const cup = game.cup;
  const what = (cup && cup.mode === 'cup' ? 'RACE ' + (cup.race + 1) + '/5 · ' : '') + T.def.name + (cup && cup.mode === 'cup' ? ' · TOP 5 ADVANCE' : '');
  hudText(c, what, W / 2, 184, 2, CYN, 'center');
  // ---- top left: time and score
  plate(c, 16, 14, 250, 112);
  hudText(c, fmtTime(raceTime()), 30, 26, 5, WHT);
  hudText(c, 'SCORE', 30, 74, 2, CYN);
  hudText(c, String(w.score), 30, 92, 4, YEL);
  // ---- top right: coins and retry tokens
  const inCup = game.cup && game.cup.mode === 'cup';
  plate(c, W - 206, 14, 190, inCup ? 132 : 76);
  c.fillStyle = INK; c.fillRect(W - 194, 26, 30, 30);
  c.fillStyle = YEL; c.fillRect(W - 191, 29, 24, 24);
  hudText(c, 'x' + p.coins, W - 30, 26, 5, WHT, 'right');
  hudText(c, 'COINS', W - 30, 66, 2, CYN, 'right');
  if (inCup) {
    for (let i = 0; i < CFG.tokens; i++) {
      const x = W - 50 - i * 34, y = 98;
      const on = i < game.cup.tokens;
      c.lineCap = 'square';
      for (const [lw2, colr] of [[7, INK], [4, on ? WHT : '#4A4A55']]) {
        c.strokeStyle = colr; c.lineWidth = lw2;
        c.beginPath(); c.moveTo(x - 9, y + 16); c.lineTo(x + 5, y + 2); c.stroke();
        c.beginPath(); c.arc(x + 8, y - 1, 7, Math.PI * 0.75, Math.PI * 2.25); c.stroke();
      }
    }
    hudText(c, 'RETRIES', W - 30, 124, 2, CYN, 'right');
  }
  // ---- left edge: the race order, top 3 and you, the player highlighted
  const lx = 30, ly = 150;
  const rows = w.order.slice(0, 3);
  if (p.place > 2) rows.push(p);
  plate(c, 16, ly - 12, 200, 40 + rows.length * 30 + (p.place > 2 ? 12 : 0));
  hudText(c, 'ORDER', lx, ly, 2, CYN);
  rows.forEach((r, k) => {
    const y = ly + 26 + k * 30 + (k === 3 ? 12 : 0);
    const me = r === p;
    const label = (r.place + 1) + ' ' + (me ? 'YOU' : r.def.name.split(' ').pop());
    if (me) { c.fillStyle = YEL; c.fillRect(lx - 6, y - 6, 172, 26); blockText(c, label, lx, y, 2, { color: INK }); }
    else {
      c.fillStyle = r.def.color; c.fillRect(lx - 6, y - 4, 4, 18);
      hudText(c, label, lx, y, 2, r.goop > 0 ? GOO_C : WHT);
    }
  });
  if (p.place > 3) hudText(c, '...', lx, ly + 26 + 3 * 30 - 8, 2, WHT);
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
  hudText(c, 'X', ix + isz / 2, iy + isz + 8, 2, CYN, 'center');
  const tx = ix + isz + 16, th = isz, tw = 24;
  c.fillStyle = INK; c.fillRect(tx, iy, tw, th);
  const fill = (p.tank / CFG.tank) * (th - 8);
  c.fillStyle = p.geyser > 0 && Math.floor(w.t * 10) % 2 ? WHT : GOO_C;
  c.fillRect(tx + 4, iy + th - 4 - fill, tw - 8, fill);
  strokeBox(c, tx, iy, tw, th, 3, WHT);
  hudText(c, 'GOO', tx + tw / 2, iy + isz + 8, 2, CYN, 'center');
  // ---- bottom right: boost meter (dive charge) and speed
  const bx = W - 30 - 10 * 22, by = H - 66;
  plate(c, bx - 16, by - 76, 10 * 22 + 30, 122);
  const charge = p.boostT > 0 ? 1 : clamp(p.diveT / CFG.swoopTiers[1][0], 0, 1);
  const lit = Math.round(charge * 10);
  for (let i = 0; i < 10; i++) {
    const on = i < lit;
    const tierMark = i === Math.round(CFG.swoopTiers[0][0] / CFG.swoopTiers[1][0] * 10) - 1 || i === 9;
    c.fillStyle = on ? (p.boostT > 0 ? (Math.floor(w.t * 16) % 2 ? ORG : YEL) : CYN) : '#22222C';
    c.fillRect(bx + i * 22, by, 18, 26);
    if (tierMark) { c.fillStyle = WHT; c.fillRect(bx + i * 22, by + 30, 18, 3); }
  }
  hudText(c, p.boostT > 0 ? 'BOOST!' : p.diveT > 0.1 ? 'CHARGE' : 'SWOOP', bx, by - 20, 2, p.boostT > 0 ? ORG : CYN);
  hudText(c, Math.round(p.speed * 3.6) + ' GPH', W - 30, by - 64, 4, WHT, 'right');
  // ---- bottom centre: the rear-view mirror strip
  const mx = W / 2 - 180, my = H - 54, mw = 360, mh = 40;
  c.fillStyle = 'rgba(11,11,18,0.85)'; c.fillRect(mx, my, mw, mh);
  strokeBox(c, mx, my, mw, mh, 2, CYN);
  hudText(c, 'REAR VIEW', mx + 6, my - 18, 2, CYN);
  c.save(); c.beginPath(); c.rect(mx + 2, my + 2, mw - 4, mh - 4); c.clip();
  for (const r of w.racers) {
    if (r === p) continue;
    const back = gap(r.dist, p.dist);
    if (back < 0 || back > 80) continue;
    const near01 = 1 - back / 80;
    const px = 1 + Math.round(near01 * 3);
    blockText(c, String(r.idx + 1), mx + mw / 2 + clamp(r.u - p.u, -12, 12) * 13, my + mh / 2 - px * 3.5, px, { align: 'center', color: r.def.color });
  }
  c.fillStyle = GOO_C;
  for (const g of w.globs) {
    if (g.owner === p) continue;
    const back = gap(g.dist, p.dist);
    if (back < 0 || back > 80) continue;
    c.fillRect(mx + mw / 2 + clamp(g.u - p.u, -12, 12) * 13 - 3, my + mh / 2 - 3, 6, 6);
  }
  for (const e of w.ents) if (e.kind === 'sock' && gap(e.dist, p.dist) > 0 && gap(e.dist, p.dist) < 80) { c.fillStyle = PNK; c.fillRect(mx + mw / 2 + clamp(e.u - p.u, -12, 12) * 13 - 5, my + 8, 10, 10); }
  c.restore();
  // ---- incoming warning chevron at the screen edge (pink: it hurts)
  if (w.incoming && Math.floor(w.t * 10) % 2 === 0) {
    const ex = w.warnSide < 0 ? 70 : W - 70;
    const d = w.warnSide < 0 ? -1 : 1;
    c.beginPath();
    c.moveTo(ex + d * 26, 360); c.lineTo(ex - d * 6, 330); c.lineTo(ex - d * 6, 348); c.lineTo(ex - d * 26, 348); c.lineTo(ex - d * 26, 372); c.lineTo(ex - d * 6, 372); c.lineTo(ex - d * 6, 390); c.closePath();
    inked(c, PNK, 4);
    hudText(c, 'INCOMING', ex, 400, 2, PNK, 'center');
  }
}
