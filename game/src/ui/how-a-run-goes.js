// GOO PRIX · src/ui/how-a-run-goes.js — Four numbered tiles on the title: how a run plays out.
'use strict';

// ============================================================================================
// HOW_A_RUN_GOES — flap and thread, splat and chain, draft a Mix-in, make the boss filthy
// ============================================================================================
const RUN_STEPS = ['FLAP & THREAD', 'SPLAT & CHAIN', 'DRAFT A MIX-IN', 'MAKE HIM FILTHY'];
// Four tiles in a row, each a number, a picture and a few words, with arrows between them.
function drawHowARunGoes(c, x, y, w, h, t) {
  const gap = 12, cw = (w - gap * 3) / 4;
  RUN_STEPS.forEach((title, i) => {
    const cx = x + i * (cw + gap);
    panel(c, cx, y, cw, h, null, WORLD_COLORS[i]);
    c.beginPath(); c.arc(cx + 18, y + 18, 12, 0, TAU); c.fillStyle = WORLD_COLORS[i]; c.fill();
    label(c, String(i + 1), cx + 18, y + 9, 17, INK, { align: 'center' });
    drawStepArt(c, i, cx + cw / 2, y + h * 0.44, Math.min(cw, h) * 0.3, t);
    label(c, title, cx + cw / 2, y + h - 26, 15, CREAM, { align: 'center', maxW: cw - 12 });
    if (i < 3) { c.beginPath(); c.moveTo(cx + cw + 2, y + h * 0.4); c.lineTo(cx + cw + gap - 2, y + h * 0.44); c.lineTo(cx + cw + 2, y + h * 0.48); c.fillStyle = CREAM; c.fill(); }
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
    drawBossAt(c, titleBoss(), 0, s * 0.15, s * 0.13, t);
  }
  c.restore();
}
