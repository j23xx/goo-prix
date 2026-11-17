// GOO PRIX · src/ui/achievement-badges.js — The row of badges on the run card.
'use strict';

// ============================================================================================
// BADGES — earned ones in gold with a star, the rest dimmed so you can see what to chase
// ============================================================================================
function drawBadges(c, badges, cx, y, h) {
  const size = Math.round(h * 0.5), gap = 10;
  const ws = badges.map((b) => labelWidth(c, '★ ' + b.name, size) + 22);
  const total = ws.reduce((a, b) => a + b + gap, -gap);
  let x = cx - total / 2;
  badges.forEach((b, i) => {
    c.save();
    c.beginPath(); c.roundRect(x, y, ws[i], h, h / 2);
    c.fillStyle = b.earned ? 'rgba(255,194,26,0.16)' : 'rgba(11,9,30,0.7)'; c.fill();
    c.lineWidth = 2; c.strokeStyle = b.earned ? YEL : 'rgba(255,246,224,0.18)'; c.stroke();
    c.restore();
    label(c, (b.earned ? '★ ' : '☆ ') + b.name, x + ws[i] / 2, y + (h - size) / 2 - 1, size, b.earned ? YEL : '#6E6A8C', { align: 'center' });
    x += ws[i] + gap;
  });
}
