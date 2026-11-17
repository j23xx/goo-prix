// GOO PRIX · src/render/block-font.js — The chunky block font every number and label is drawn with.
'use strict';

// ============================================================================================
// BLOCKFONT — the chunky Pong-scoreboard lettering: a 5x7 glyph table drawn as solid blocks
// ============================================================================================
const GLYPHS = {
  'A': [14, 17, 17, 31, 17, 17, 17], 'B': [30, 17, 17, 30, 17, 17, 30], 'C': [14, 17, 16, 16, 16, 17, 14],
  'D': [28, 18, 17, 17, 17, 18, 28], 'E': [31, 16, 16, 30, 16, 16, 31], 'F': [31, 16, 16, 30, 16, 16, 16],
  'G': [14, 17, 16, 23, 17, 17, 15], 'H': [17, 17, 17, 31, 17, 17, 17], 'I': [14, 4, 4, 4, 4, 4, 14],
  'J': [7, 2, 2, 2, 2, 18, 12], 'K': [17, 18, 20, 24, 20, 18, 17], 'L': [16, 16, 16, 16, 16, 16, 31],
  'M': [17, 27, 21, 21, 17, 17, 17], 'N': [17, 17, 25, 21, 19, 17, 17], 'O': [14, 17, 17, 17, 17, 17, 14],
  'P': [30, 17, 17, 30, 16, 16, 16], 'Q': [14, 17, 17, 17, 21, 18, 13], 'R': [30, 17, 17, 30, 20, 18, 17],
  'S': [15, 16, 16, 14, 1, 1, 30], 'T': [31, 4, 4, 4, 4, 4, 4], 'U': [17, 17, 17, 17, 17, 17, 14],
  'V': [17, 17, 17, 17, 17, 10, 4], 'W': [17, 17, 17, 21, 21, 21, 10], 'X': [17, 17, 10, 4, 10, 17, 17],
  'Y': [17, 17, 10, 4, 4, 4, 4], 'Z': [31, 1, 2, 4, 8, 16, 31],
  '0': [14, 17, 19, 21, 25, 17, 14], '1': [4, 12, 4, 4, 4, 4, 14], '2': [14, 17, 1, 2, 4, 8, 31],
  '3': [31, 2, 4, 2, 1, 17, 14], '4': [2, 6, 10, 18, 31, 2, 2], '5': [31, 16, 30, 1, 1, 17, 14],
  '6': [6, 8, 16, 30, 17, 17, 14], '7': [31, 1, 2, 4, 8, 8, 8], '8': [14, 17, 17, 14, 17, 17, 14],
  '9': [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0], '!': [4, 4, 4, 4, 4, 0, 4], '?': [14, 17, 1, 2, 4, 0, 4],
  '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8], ':': [0, 12, 12, 0, 12, 12, 0],
  '/': [1, 1, 2, 4, 8, 16, 16], '-': [0, 0, 0, 14, 0, 0, 0], '+': [0, 4, 4, 31, 4, 4, 0],
  "'": [4, 4, 8, 0, 0, 0, 0], '%': [24, 25, 2, 4, 8, 19, 3], '#': [10, 10, 31, 10, 31, 10, 10],
  '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8], '&': [12, 18, 20, 8, 21, 18, 13],
  '=': [0, 0, 31, 0, 31, 0, 0], '<': [2, 4, 8, 16, 8, 4, 2], '>': [8, 4, 2, 1, 2, 4, 8],
  '_': [0, 0, 0, 0, 0, 0, 31], '*': [0, 4, 21, 14, 21, 4, 0], '"': [10, 10, 0, 0, 0, 0, 0], '·': [0, 0, 0, 4, 0, 0, 0],
  '×': [0, 0, 17, 10, 4, 10, 17], '^': [4, 10, 17, 0, 0, 0, 0], '|': [4, 4, 4, 4, 4, 4, 4],
  '↑': [4, 14, 21, 4, 4, 4, 4], '↓': [4, 4, 4, 4, 21, 14, 4], '←': [0, 4, 8, 31, 8, 4, 0], '→': [0, 4, 2, 31, 2, 4, 0],
};

function textWidth(text, px) {
  return text.length ? (text.length * 6 - 1) * px : 0;
}

// Draws text as solid blocks. opts: align ('left'|'center'|'right'), color, alpha,
// skew (italic lean), shadow (dark block offset in px, or 0), outline (dark border in px).
function blockText(ctx, text, x, y, px, opts) {
  const o = opts || {};
  text = String(text).toUpperCase();
  const w = textWidth(text, px);
  const align = o.align || 'left';
  let x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const path = new Path2D();
  for (let i = 0; i < text.length; i++) {
    const g = GLYPHS[text[i]] || GLYPHS['?'];
    const gx = x0 + i * 6 * px;
    for (let row = 0; row < 7; row++) {
      const bits = g[row];
      if (!bits) continue;
      // merge horizontal runs into one rect each
      let col = 0;
      while (col < 5) {
        if (bits & (16 >> col)) {
          let end = col;
          while (end + 1 < 5 && (bits & (16 >> (end + 1)))) end++;
          path.rect(gx + col * px, y + row * px, (end - col + 1) * px, px);
          col = end + 1;
        } else col++;
      }
    }
  }
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.skew) { ctx.translate(x, y + 3.5 * px); ctx.transform(1, 0, -o.skew, 1, 0, 0); ctx.translate(-x, -(y + 3.5 * px)); }
  if (o.shadow) {
    ctx.save(); ctx.translate(o.shadow, o.shadow); ctx.fillStyle = o.shadowColor || '#000'; ctx.fill(path); ctx.restore();
  }
  if (o.outline) {
    ctx.lineJoin = 'miter'; ctx.lineWidth = o.outline * 2; ctx.strokeStyle = o.outlineColor || '#000'; ctx.stroke(path);
  }
  ctx.fillStyle = o.color || '#fff';
  ctx.fill(path);
  ctx.restore();
  return w;
}
