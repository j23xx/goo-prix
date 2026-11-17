// GOO PRIX · src/ui/win-lose-pills.js — The goal of the level in words: a WIN pill and a LOSE pill.
'use strict';

// ============================================================================================
// WIN_LOSE — every level says how you win and how you lose, right under the stage bar
// ============================================================================================
// A pill: a coloured tag ("WIN") then the rule in cream. Returns its width.
function pill(c, x, y, tag, text, tagColor, h) {
  h = h || 26;
  const size = Math.round(h * 0.6);
  const tw = labelWidth(c, tag, size) + 16, xw = labelWidth(c, text, size) + 18;
  c.save();
  c.beginPath(); c.roundRect(x, y, tw + xw, h, h / 2); c.fillStyle = 'rgba(11,9,30,0.85)'; c.fill();
  c.lineWidth = 1.5; c.strokeStyle = tagColor; c.stroke();
  c.beginPath(); c.roundRect(x, y, tw, h, h / 2); c.fillStyle = tagColor; c.fill();
  c.restore();
  label(c, tag, x + tw / 2, y + (h - size) / 2 - 1, size, INK, { align: 'center' });
  label(c, text, x + tw + 9, y + (h - size) / 2 - 1, size, CREAM);
  return tw + xw;
}
function pillWidth(c, tag, text, h) { const size = Math.round((h || 26) * 0.6); return labelWidth(c, tag, size) + 16 + labelWidth(c, text, size) + 18; }

// The two rules for the level being flown, worded from the run it belongs to.
function winLoseText() {
  const w = world, L = w.level, run = game.run;
  if (L.boss) return ['GOO HIM 100% BEFORE 0:00', 'TIME RUNS OUT · KNOCKS COST 3 S'];
  const win = 'BEAT THE QUOTA ' + fmtScore(w.quota) + ' · 3x = S';
  if (!run || run.mode === 'practice') return [win, 'FINISH UNDER THE QUOTA'];
  if (run.mode === 'endless') return [win, 'MISS IT: THE RUN IS OVER'];
  return [win, 'UNDER QUOTA · ' + run.continues + ' CONTINUE' + (run.continues === 1 ? '' : 'S') + ' LEFT'];
}
// Both pills side by side, centred at cx.
function drawWinLosePills(c, cx, y, h) {
  const [win, lose] = winLoseText();
  const gap = 12, ww = pillWidth(c, 'WIN', win, h), lw = pillWidth(c, 'LOSE', lose, h);
  const x0 = cx - (ww + gap + lw) / 2;
  pill(c, x0, y, 'WIN', win, GOO_C, h);
  pill(c, x0 + ww + gap, y, 'LOSE', lose, RED, h);
}
