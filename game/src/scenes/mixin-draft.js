// GOO PRIX · src/scenes/mixin-draft.js — Between levels: pick 1 of 3 Mix-ins (or reroll), then on to the next world.
'use strict';

// The draft: what you just cleared, three paint cans to pick from, and the whole run as a route
// map with YOU ARE HERE on the next stage.
function drawDraft(c, t) {
  const run = game.run, d = game.draft;
  applyCamera(); renderWorld(c); groundWash(c, 0.86);
  const nextL = LEVELS[run.level];
  const last = run.stages.filter(Boolean).slice(-1)[0];
  const done = run.mode === 'endless' ? 'LOOP ' + (run.loop + 1) + ' · ' + run.cleared + ' STAGES CLEARED' : 'STAGE ' + run.level + ' CLEARED';
  label(c, done + (last ? ' · GRADE ' + last.grade : '') + ' — NEXT: ' + (nextL.boss ? 'THE FINAL BOSS' : nextL.name), W / 2, 12, 20, AQUA, { align: 'center' });
  blockText(c, 'PICK A MIX-IN', W / 2, 40, 6, { align: 'center', color: YEL, outline: 4, outlineColor: INK, shadow: 7, shadowColor: PNK });
  const cw = 270, chh = 320, gap0 = 40, x0 = W / 2 - (cw * 3 + gap0 * 2) / 2, y0 = 100;
  d.offer.forEach((id, j) => {
    const x = x0 + j * (cw + gap0);
    uiRect('can' + j, x, y0, cw, chh);
    c.save();
    if (d.pickT >= 0 && j === d.i) { const k = clamp(d.pickT / 0.5, 0, 1); c.translate(x + cw / 2, y0 + chh); c.rotate(k * 0.5); c.translate(-(x + cw / 2), -(y0 + chh)); }
    else if (d.pickT >= 0) c.globalAlpha = clamp(1 - d.pickT * 2, 0, 1);
    drawMixinCard(c, id, x, y0, cw, chh, j === d.i, t);
    keycap(c, String(j + 1), x + 12, y0 + 30, 26, j === d.i);
    c.restore();
  });
  if (run.mixins.length) { label(c, 'YOUR MIX-INS', 40, 440, 15, MAG); drawMixinRow(c, run.mixins, 40, 478, 34, 'left'); }
  label(c, 'RUN TOTAL ' + fmtScore(run.total), W - 40, 440, 20, YEL, { align: 'right' });
  label(c, 'EVERY MIX-IN RAISES LATER QUOTAS 20%', W - 40, 466, 14, '#B9B4D8', { align: 'right' });
  label(c, 'THE RUN SO FAR', W / 2, 500, 15, AQUA, { align: 'center' });
  drawRouteMap(c, 170, 580, W - 340, run, run.mode === 'endless' ? run.level : run.level);
  if (d.pickT >= 0) {
    const k = clamp((d.pickT - 0.3) / 0.6, 0, 1), r = mulberry32(12);
    for (let i = 0; i < 16; i++) { const x = r() * W, wd = 40 + r() * 70, len = k * (H + 100) * (0.7 + r() * 0.5); c.beginPath(); c.roundRect(x - wd / 2, -20, wd, len, wd / 2); gooShade(c, x, len / 2, wd); }
  }
  drawKeyLegend(c, [[['←', '→'], 'CHOOSE'], [['1', '2', '3'], 'PICK'], [['ENTER'], 'CONFIRM'], [['R'], run.rerolledThis ? 'REROLLED' : 'REROLL -1,000']], W / 2, 672, 28, 'center');
}

// ---- MIX-IN DRAFT: pick 1 of 3 perks before the next level (R rerolls for 1,000 points)
SCENES.draft = {
  enter() { const run = game.run; const offer = drawMixinOffer(run); game.draft = { i: Math.min(1, offer.length - 1), offer, pickT: -1 }; MUSIC.play(SONGS.results); say('Pick a mix in!', 2); },
  update(dt) {
    const d = game.draft, run = game.run;
    world.t += dt;
    if (d.pickT >= 0) {
      d.pickT += dt;
      if (d.pickT > 0.9 && !d.left) { d.left = true; goTo('intro', () => startLevelScene(run.level)); }
      return;
    }
    const n = d.offer.length;
    if (keyHit('ArrowLeft', 'KeyA')) { d.i = (d.i + n - 1) % n; sfx.uiMove(); }
    if (keyHit('ArrowRight', 'KeyD')) { d.i = (d.i + 1) % n; sfx.uiMove(); }
    ['Digit1', 'Digit2', 'Digit3'].forEach((k, j) => { if (keyHit(k) && j < n) { d.i = j; pick(); } });
    if (input.moved) for (let j = 0; j < n; j++) if (uiOver('can' + j) && d.i !== j) { d.i = j; sfx.uiMove(); }
    if (input.click) for (let j = 0; j < n; j++) if (uiOver('can' + j)) { d.i = j; pick(); }
    if (keyHit('KeyR') && run.total >= 1000 && !run.rerolledThis) {
      run.rerolls++; run.rerolledThis = true; run.adjust = (run.adjust || 0) - 1000; run.total -= 1000;
      d.offer = drawMixinOffer(run); d.i = Math.min(d.i, d.offer.length - 1); sfx.wipe();
    }
    if (keyHit('Enter', 'Space')) pick();
    function pick() {
      if (d.pickT >= 0 || !d.offer[d.i]) return;
      takeMixin(run, d.offer[d.i]); run.rerolledThis = false;
      d.pickT = 0; sfx.itemGet(); sfx.splat();
    }
  },
  draw(c) { drawDraft(c, game.sceneT); },
};
