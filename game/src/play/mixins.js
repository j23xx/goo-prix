// GOO PRIX · src/play/mixins.js — MIX-INS: the twelve perks you draft between levels, and their icons.
'use strict';

// ============================================================================================
// MIX-INS — after every cleared level pick 1 of 3; each one bends a rule of the score attack
// ============================================================================================
// risk: the one card that is a gamble (red rim). Every effect is read where its rule lives:
// score.js (chain, multiplier, knocks, windows), goo.js (splash, twin, dribble), targets.js
// (goldies, armour), physics.js (tank) and boss.js (weak points).
const MIXINS = [
  { id: 'thick', name: 'THICK COAT', color: '#7CFF3A', line: 'HITS SPLASH NEIGHBOURS FOR 1' },
  { id: 'twin', name: 'TWIN NOZZLE', color: '#19E0D0', line: 'FIRE 2 GLOBS · SHOTS COST 25% MORE' },
  { id: 'bucket', name: 'BOTTOMLESS BUCKET', color: '#3D7BFF', line: 'GOO TANK 160 · REFILLS 30% FASTER' },
  { id: 'sticky', name: 'STICKY CHAIN', color: '#FF4FD8', line: 'YOUR CHAIN LASTS 4.5S, NOT 2.5S' },
  { id: 'primer', name: 'PRIMER', color: '#FFF6E0', line: 'NEVER BELOW x2 · KNOCKS HALVE THE CHAIN' },
  { id: 'nonstick', name: 'NON-STICK HULL', color: '#D9DDEA', line: 'KNOCKS COST HALF · FIRST ONE IS FREE' },
  { id: 'needle', name: 'NEEDLE THREADER', color: '#FFF6E0', line: 'WINDOWS +250 · BULLSEYE +600 + REFILL' },
  { id: 'overspill', name: 'OVERSPILL', color: '#FF8A3D', line: 'MULTIPLIER CAP x8 BECOMES x10' },
  { id: 'goldleaf', name: 'GOLD LEAF', color: '#FFC21A', line: 'GOLDIES TWICE AS OFTEN, WORTH 1,500' },
  { id: 'dribble', name: 'DRIBBLE', color: '#7CFF3A', line: 'EVERY KILL DRIPS A HOMING DROPLET' },
  { id: 'hotsauce', name: 'HOT SAUCE', color: '#FF2D3A', line: 'ALL POINTS +50% · KNOCKS COST DOUBLE', risk: true },
  { id: 'turpentine', name: 'TURPENTINE', color: '#B04CFF', line: 'ARMOUR -1 HIT · BOSS STAINS +50%' },
];
const MIXIN_BY_ID = Object.fromEntries(MIXINS.map((m) => [m.id, m]));

// Does the current run own this Mix-in? (Attract demos and practice runs own none.)
function hasMix(id) { return !!(game.run && game.run.mixins && game.run.mixins.includes(id) && world && !world.attract); }

// Three different Mix-ins the run does not own yet, drawn from the run's own seeded stream.
function drawMixinOffer(run) {
  const rng = mulberry32((run.seed || 1) * 977 + run.drafts * 131 + (run.rerolls || 0) * 17);
  const pool = MIXINS.filter((m) => !run.mixins.includes(m.id));
  const offer = [];
  while (offer.length < 3 && pool.length) offer.push(pool.splice(Math.floor(rng() * pool.length), 1)[0].id);
  return offer;
}
function takeMixin(run, id) {
  run.mixins.push(id);
  run.drafts++;
  say(MIXIN_BY_ID[id].name.toLowerCase(), 2);
}

// ---- the paint-can card and the little icon that goes with each Mix-in
function drawMixinIcon(c, id, x, y, s, t) {
  const m = MIXIN_BY_ID[id];
  const lw = Math.max(1.5, s * 0.07);
  c.save(); c.translate(x, y);
  c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = lw;
  switch (id) {
    case 'thick': // a fat splat with a splash ring
      c.beginPath(); c.arc(0, 0, s * 0.42, 0, TAU); c.globalAlpha = 0.5; c.strokeStyle = GOO_C; c.lineWidth = lw * 1.5; c.stroke(); c.globalAlpha = 1;
      gooBlob(c, 0, 0, s * 0.26, 3, t || 0);
      break;
    case 'twin': // two globs side by side
      gooBlob(c, -s * 0.2, 0, s * 0.18, 5, t || 0); gooBlob(c, s * 0.2, 0, s * 0.18, 9, t || 0);
      break;
    case 'bucket': // a brimming bucket
      c.beginPath(); c.moveTo(-s * 0.32, -s * 0.2); c.lineTo(s * 0.32, -s * 0.2); c.lineTo(s * 0.24, s * 0.36); c.lineTo(-s * 0.24, s * 0.36); c.closePath();
      c.fillStyle = m.color; c.fill(); c.stroke();
      gooBlob(c, 0, -s * 0.22, s * 0.2, 4, t || 0);
      break;
    case 'sticky': // two goo chain links
      for (const dx of [-0.16, 0.16]) { c.beginPath(); c.ellipse(dx * s, 0, s * 0.2, s * 0.12, 0, 0, TAU); c.lineWidth = s * 0.08 + 3; c.strokeStyle = INK; c.stroke(); c.lineWidth = s * 0.08; c.strokeStyle = m.color; c.stroke(); }
      break;
    case 'primer': // a paint roller
      c.beginPath(); c.roundRect(-s * 0.32, -s * 0.3, s * 0.64, s * 0.22, s * 0.06); c.fillStyle = m.color; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(s * 0.32, -s * 0.19); c.lineTo(s * 0.4, -s * 0.19); c.lineTo(s * 0.4, s * 0.04); c.lineTo(0, s * 0.04); c.lineTo(0, s * 0.38); c.stroke();
      break;
    case 'nonstick': // a frying-pan shield
      c.beginPath(); c.arc(-s * 0.06, 0, s * 0.28, 0, TAU); c.fillStyle = '#3A3F52'; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(s * 0.2, s * 0.1); c.lineTo(s * 0.44, s * 0.3); c.lineWidth = s * 0.1; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(-s * 0.14, -s * 0.1, s * 0.1, s * 0.05, -0.6, 0, TAU); c.fill();
      break;
    case 'needle': // a needle threading a cream window
      c.beginPath(); c.rect(-s * 0.3, -s * 0.24, s * 0.6, s * 0.48); c.lineWidth = s * 0.09 + 3; c.strokeStyle = INK; c.stroke(); c.lineWidth = s * 0.09; c.strokeStyle = CREAM; c.stroke();
      c.beginPath(); c.moveTo(-s * 0.44, s * 0.32); c.lineTo(s * 0.44, -s * 0.32); c.lineWidth = s * 0.06; c.strokeStyle = '#D9DDEA'; c.stroke();
      break;
    case 'overspill': blockText(c, 'x10', 0, -s * 0.16, s * 0.05, { align: 'center', color: m.color, outline: s * 0.03, outlineColor: INK }); break;
    case 'goldleaf': // a gold leaf with a glint
      c.beginPath(); c.moveTo(0, -s * 0.36); c.quadraticCurveTo(s * 0.34, -s * 0.1, 0, s * 0.36); c.quadraticCurveTo(-s * 0.34, -s * 0.1, 0, -s * 0.36);
      c.fillStyle = m.color; c.fill(); c.stroke();
      glint(c, s * 0.1, -s * 0.12, s * 0.14, 0.95);
      break;
    case 'dribble': // a drop with a curling arrow
      gooBlob(c, -s * 0.16, s * 0.1, s * 0.16, 2, t || 0);
      c.beginPath(); c.moveTo(-s * 0.02, 0); c.quadraticCurveTo(s * 0.24, -s * 0.3, s * 0.36, -s * 0.06); c.lineWidth = s * 0.06; c.strokeStyle = GOO_C; c.stroke();
      c.beginPath(); c.moveTo(s * 0.36, -s * 0.06); c.lineTo(s * 0.24, -s * 0.08); c.moveTo(s * 0.36, -s * 0.06); c.lineTo(s * 0.34, -s * 0.2); c.stroke();
      break;
    case 'hotsauce': // a chilli
      c.beginPath(); c.moveTo(-s * 0.3, -s * 0.18); c.quadraticCurveTo(s * 0.2, -s * 0.28, s * 0.36, s * 0.3); c.quadraticCurveTo(-s * 0.1, 0, -s * 0.3, -s * 0.02); c.closePath();
      c.fillStyle = m.color; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.3, -s * 0.1); c.lineTo(-s * 0.42, -s * 0.24); c.strokeStyle = '#2E8B2E'; c.lineWidth = s * 0.06; c.stroke();
      break;
    case 'turpentine': // a flask that eats through armour
      c.beginPath(); c.moveTo(-s * 0.08, -s * 0.36); c.lineTo(s * 0.08, -s * 0.36); c.lineTo(s * 0.08, -s * 0.1); c.lineTo(s * 0.28, s * 0.32); c.lineTo(-s * 0.28, s * 0.32); c.lineTo(-s * 0.08, -s * 0.1); c.closePath();
      c.fillStyle = 'rgba(176,76,255,0.85)'; c.fill(); c.stroke();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-s * 0.06, s * 0.16, s * 0.04, 0, TAU); c.arc(s * 0.08, s * 0.06, s * 0.03, 0, TAU); c.fill();
      break;
  }
  c.restore();
}

// A paint can for the draft: lid, label band in the Mix-in's colour, the icon, the name, one line.
function drawMixinCard(c, id, x, y, w, h, selected, t) {
  const m = MIXIN_BY_ID[id];
  const sc = selected ? 1.08 : 1;
  c.save(); c.translate(x + w / 2, y + h / 2); c.scale(sc, sc); c.translate(-w / 2, -h / 2);
  if (selected) { c.fillStyle = PNK; c.beginPath(); c.roundRect(10, 12, w, h, 18); c.fill(); }
  // the can: a chrome body with a lid ellipse on top
  const g = c.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#8E98A8'); g.addColorStop(0.25, '#F2F5F9'); g.addColorStop(0.55, '#B5BDCA'); g.addColorStop(1, '#6C7586');
  c.beginPath(); c.roundRect(0, 18, w, h - 18, 16); c.fillStyle = g; c.fill();
  c.lineWidth = 5; c.strokeStyle = m.risk ? RED : selected ? YEL : INK; c.stroke();
  c.beginPath(); c.ellipse(w / 2, 20, w / 2 - 2, 18, 0, 0, TAU); c.fillStyle = '#D7DDE6'; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.ellipse(w / 2, 20, w / 2 - 22, 10, 0, 0, TAU); c.stroke();
  // goo spilling over the rim
  c.save(); c.translate(w * 0.7, 16); gooBlob(c, 0, 0, 14, id.length, t); c.restore();
  // the label band
  c.beginPath(); c.rect(6, 70, w - 12, h - 140); c.fillStyle = m.color; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  c.fillStyle = 'rgba(11,11,18,0.82)'; c.beginPath(); c.arc(w / 2, 70 + (h - 140) * 0.42, Math.min(w, h) * 0.24, 0, TAU); c.fill();
  drawMixinIcon(c, id, w / 2, 70 + (h - 140) * 0.42, Math.min(w, h) * 0.38, t);
  // the name and its one line of rules
  const words = m.name.split(' ');
  const lines = words.length > 1 && textWidth(m.name, 4) > w - 24 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [m.name];
  const npx = lines.length > 1 ? 3 : 4;
  lines.forEach((ln, i) => blockText(c, ln, w / 2, h - 128 + i * 26 - (lines.length - 1) * 10, npx, { align: 'center', color: WHT, outline: 3, outlineColor: INK }));
  const ruleLines = m.line.split(' · ');
  ruleLines.forEach((ln, i) => blockText(c, ln, w / 2, h - 52 + i * 18 - (ruleLines.length - 1) * 8, 2, { align: 'center', color: INK }));
  if (m.risk) blockText(c, 'RISKY!', w / 2, 40, 2, { align: 'center', color: RED, outline: 1.5, outlineColor: INK });
  c.restore();
}
// The row of owned Mix-ins (HUD, pause, draft footer).
function drawMixinRow(c, ids, x, y, s, align) {
  const gapX = s + 6, total = ids.length * gapX - 6;
  const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ids.forEach((id, i) => {
    const cx = x0 + i * gapX + s / 2;
    c.beginPath(); c.arc(cx, y, s / 2, 0, TAU); c.fillStyle = 'rgba(11,11,18,0.85)'; c.fill();
    c.lineWidth = 2; c.strokeStyle = MIXIN_BY_ID[id].color; c.stroke();
    drawMixinIcon(c, id, cx, y, s * 0.8, 0);
  });
}
