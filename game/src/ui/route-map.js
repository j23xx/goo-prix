// GOO PRIX · src/ui/route-map.js — The run as a map: six stages, their twists, grades and the boss.
'use strict';

// ============================================================================================
// ROUTE_MAP — one node per stage in that world's colour, the grade earned, YOU ARE HERE
// ============================================================================================
const WORLD_COLORS = ['#FFC21A', '#B04CFF', '#5AA8FF', '#FF3D9A', '#19E0D0', '#E9EDF2'];
const TWIST_NAMES = ['THE BASICS', 'RHYTHM', 'BLIZZARD', 'GRAVITY FLIP', 'ZERO-G', 'THE BOSS'];

// A world's badge: a disc in its colour with a tiny emblem.
function drawWorldNode(c, i, x, y, r, done) {
  c.beginPath(); c.arc(x, y, r, 0, TAU);
  c.fillStyle = done ? WORLD_COLORS[i] : 'rgba(11,9,30,0.9)'; c.fill();
  c.lineWidth = 3; c.strokeStyle = WORLD_COLORS[i]; c.stroke();
  const k = done ? INK : WORLD_COLORS[i];
  if (LEVELS[i].boss) { c.fillStyle = k; c.beginPath(); c.ellipse(x, y + r * 0.1, r * 0.55, r * 0.42, 0, 0, TAU); c.fill(); c.fillStyle = done ? WORLD_COLORS[i] : INK; c.fillRect(x - r * 0.35, y - r * 0.12, r * 0.7, r * 0.16); }
  else label(c, String(i + 1), x, y - r * 0.55, Math.round(r * 1.05), k, { align: 'center' });
}
// The whole route at (x, y), w wide: here = the stage about to be flown.
function drawRouteMap(c, x, y, w, run, here) {
  const n = LEVELS.length, step = w / (n - 1), r = 22;
  c.save(); c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,246,224,0.25)'; c.lineWidth = 6;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke();
  const doneUpTo = Math.min(here, n) - 1;
  if (doneUpTo >= 0) { c.strokeStyle = GOO_C; c.beginPath(); c.moveTo(x, y); c.lineTo(x + step * doneUpTo, y); c.stroke(); }
  c.restore();
  for (let i = 0; i < n; i++) {
    const nx = x + i * step, g = run.grades[i];
    drawWorldNode(c, i, nx, y, r, !!g);
    label(c, LEVELS[i].boss ? 'MISTER SPOTLESS' : LEVELS[i].name, nx, y + r + 8, 15, CREAM, { align: 'center' });
    label(c, TWIST_NAMES[i], nx, y + r + 27, 12, WORLD_COLORS[i], { align: 'center' });
    if (g) blockText(c, g, nx, y - r - 34, 3, { align: 'center', color: GRADE_COLORS[g], outline: 2, outlineColor: INK });
    if (i === here) {
      const b = Math.sin(world ? world.t * 5 : 0) * 3;
      label(c, 'YOU ARE HERE', nx, y - r - 30 + b, 13, YEL, { align: 'center', outline: 2 });
      c.fillStyle = YEL; c.beginPath(); c.moveTo(nx - 7, y - r - 12 + b); c.lineTo(nx + 7, y - r - 12 + b); c.lineTo(nx, y - r - 4 + b); c.closePath(); c.fill();
    }
  }
}
