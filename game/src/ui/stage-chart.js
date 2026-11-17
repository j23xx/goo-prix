// GOO PRIX · src/ui/stage-chart.js — The run, stage by stage: a bar chart of score against quota.
'use strict';

// ============================================================================================
// STAGE_CHART — one bar per stage in its world's colour, the quota as a tick, the grade on top,
// and a star where the stage was flown without a knock
// ============================================================================================
function drawStageChart(c, x, y, w, h, run) {
  const stages = chartStages(run);
  panel(c, x, y, w, h, 'THE RUN, STAGE BY STAGE', AQUA);
  const top = Math.max(1, ...stages.map((s) => Math.max(s.score, s.quota)));
  const gx = x + 16, gy = y + h - 40, gh = h - 128, bw = (w - 32) / stages.length;
  stages.forEach((s, i) => {
    const bx = gx + i * bw + bw * 0.18, bwid = bw * 0.64;
    const bh = gh * s.score / top;
    const g = c.createLinearGradient(0, gy - bh, 0, gy);
    g.addColorStop(0, WORLD_COLORS[s.idx]); g.addColorStop(1, shade(WORLD_COLORS[s.idx], 0.55));
    c.fillStyle = g; c.beginPath(); c.roundRect(bx, gy - bh, bwid, Math.max(2, bh), [5, 5, 0, 0]); c.fill();
    if (s.quota) { const qy = gy - gh * s.quota / top; c.fillStyle = CREAM; c.fillRect(bx - 4, qy - 1, bwid + 8, 3); }
    if (s.grade) blockText(c, s.grade, bx + bwid / 2, gy - bh - 26, 2.5, { align: 'center', color: GRADE_COLORS[s.grade], outline: 1.5, outlineColor: INK });
    if (s.grade && s.knocks === 0) label(c, '★', bx + bwid / 2, gy - bh - 46, 16, YEL, { align: 'center' });
    label(c, LEVELS[s.idx].boss ? 'BOSS' : String(s.idx + 1), bx + bwid / 2, gy + 6, 14, CREAM, { align: 'center' });
  });
  label(c, '▬ QUOTA   ★ NO KNOCKS', x + w - 12, y + 7, 12, '#B9B4D8', { align: 'right' });
}
