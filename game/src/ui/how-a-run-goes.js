// GOO PRIX · src/ui/how-a-run-goes.js — Four numbered cards on the title: how a run plays out.
'use strict';

// ============================================================================================
// HOW_A_RUN_GOES — flap and thread, splat and chain, draft a Mix-in, make the boss filthy
// ============================================================================================
const RUN_STEPS = [
  ['FLAP & THREAD', 'FLY THROUGH THE WINDOW IN EVERY WALL. BULLSEYE +250.'],
  ['SPLAT & CHAIN', 'GOO EVERYTHING. EVERY 5 HITS ADD x1, UP TO x8.'],
  ['DRAFT A MIX-IN', 'BEAT THE QUOTA, PICK 1 OF 3 PERKS THAT BEND THE RULES.'],
  ['MAKE HIM FILTHY', 'FIVE WORLDS, THEN MISTER SPOTLESS. COVER HIM IN GOO.'],
];
function drawHowARunGoes(c, x, y, w, h, t) {
  const gap = 14, cw = (w - gap * 3) / 4;
  RUN_STEPS.forEach(([title, line], i) => {
    const cx = x + i * (cw + gap);
    panel(c, cx, y, cw, h, null, WORLD_COLORS[i]);
    c.beginPath(); c.arc(cx + 22, y + 22, 13, 0, TAU); c.fillStyle = WORLD_COLORS[i]; c.fill();
    label(c, String(i + 1), cx + 22, y + 13, 18, INK, { align: 'center' });
    label(c, title, cx + 42, y + 12, 19, CREAM, { maxW: cw - 50 });
    drawStepArt(c, i, cx + cw / 2, y + h * 0.5, Math.min(cw, h) * 0.32, t);
    wrapLabel(c, line, cx + cw / 2, y + h - 40, cw - 20, 13, '#C9C4E8');
  });
}
// A tiny picture for each step.
function drawStepArt(c, i, x, y, s, t) {
  c.save(); c.translate(x, y);
  if (i === 0) {
    c.beginPath(); c.rect(-s, -s * 0.7, s * 2, s * 1.4); c.lineWidth = s * 0.16 + 3; c.strokeStyle = INK; c.stroke(); c.lineWidth = s * 0.16; c.strokeStyle = CREAM; c.stroke();
    drawShip(c, RACERS[1], 0, s * 0.15, s * 1.3, { t, thrust: 1 });
  } else if (i === 1) {
    gooBlob(c, -s * 0.5, 0, s * 0.4, 3, t); gooBlob(c, s * 0.15, -s * 0.2, s * 0.3, 5, t);
    blockText(c, 'x8', s * 0.75, -s * 0.1, s * 0.09, { align: 'center', color: MAG, outline: 2, outlineColor: INK });
  } else if (i === 2) {
    drawMixinIcon(c, 'hotsauce', -s * 0.55, 0, s * 0.9, t); drawMixinIcon(c, 'twin', s * 0.1, 0, s * 0.9, t); drawMixinIcon(c, 'goldleaf', s * 0.75, 0, s * 0.9, t);
  } else {
    c.beginPath(); c.ellipse(0, 0, s * 0.9, s * 0.7, 0, 0, TAU);
    const g = c.createLinearGradient(0, -s * 0.7, 0, s * 0.7); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#7C8698'); g.addColorStop(1, '#D7DDE6');
    c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    gooBlob(c, -s * 0.3, -s * 0.1, s * 0.28, 4, t); gooBlob(c, s * 0.35, s * 0.15, s * 0.22, 8, t);
  }
  c.restore();
}
// Centre-wrapped small text in up to two lines.
function wrapLabel(c, text, cx, y, maxW, size, color) {
  const words = text.split(' '), lines = [''];
  for (const wd of words) { const tryLine = (lines[lines.length - 1] + ' ' + wd).trim(); if (labelWidth(c, tryLine, size) > maxW && lines[lines.length - 1]) lines.push(wd); else lines[lines.length - 1] = tryLine; }
  lines.slice(0, 2).forEach((ln, i) => label(c, ln, cx, y + i * (size + 4), size, color, { align: 'center' }));
}
