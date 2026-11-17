// GOO PRIX · src/scenes/mixin-draft.js — Between levels: pick 1 of 3 Mix-ins (or reroll), then on to the next world.
'use strict';

// The draft: three paint cans over the dimmed next world, the run's Mix-ins along the bottom.
function drawDraft(c, t) {
  const run = game.run, d = game.draft;
  applyCamera(); renderWorld(c); dim(c, 0.55);
  const nextL = LEVELS[run.level];
  blockText(c, 'PICK A MIX-IN', W / 2, 26, 8, { align: 'center', color: YEL, outline: 5, outlineColor: INK, shadow: 9, shadowColor: PNK });
  hudText(c, (run.mode === 'endless' ? 'LOOP ' + (run.loop + 1) + ' · DRAFT ' + (run.drafts + 1) : 'DRAFT ' + (run.drafts + 1) + '/5') + ' · ' + (nextL.boss ? 'NEXT: THE FINAL BOSS' : 'NEXT: ' + nextL.name), W / 2, 98, 3, CYN, 'center');
  const cw = 300, chh = 380, gap0 = 46, x0 = W / 2 - (cw * 3 + gap0 * 2) / 2, y0 = 140;
  d.offer.forEach((id, j) => {
    const x = x0 + j * (cw + gap0);
    uiRect('can' + j, x, y0, cw, chh);
    const chosen = d.pickT >= 0 && j === d.i;
    c.save();
    if (chosen) {
      // the chosen can tips over and pours
      const k = clamp(d.pickT / 0.5, 0, 1);
      c.translate(x + cw / 2, y0 + chh); c.rotate(k * 0.5); c.translate(-(x + cw / 2), -(y0 + chh));
    } else if (d.pickT >= 0) c.globalAlpha = clamp(1 - d.pickT * 2, 0, 1);
    drawMixinCard(c, id, x, y0, cw, chh, j === d.i, t);
    blockText(c, String(j + 1), x + 18, y0 + 34, 3, { color: INK });
    c.restore();
  });
  if (d.pickT >= 0) {
    // a goo wipe pouring out of the chosen can
    const k = clamp((d.pickT - 0.3) / 0.6, 0, 1);
    const r = mulberry32(12);
    for (let i = 0; i < 16; i++) {
      const x = r() * W, wd = 40 + r() * 70, len = k * (H + 100) * (0.7 + r() * 0.5);
      c.beginPath(); c.roundRect(x - wd / 2, -20, wd, len, wd / 2);
      gooShade(c, x, len / 2, wd);
    }
  }
  // owned Mix-ins, the reroll and the controls
  if (run.mixins.length) { hudText(c, 'YOUR MIX-INS', 60, 552, 2, CYN); drawMixinRow(c, run.mixins, 60, 596, 44, 'left'); }
  hudText(c, 'RUN TOTAL ' + fmtScore(run.total), W - 60, 552, 3, YEL, 'right');
  hudText(c, run.rerolledThis ? 'REROLLED' : 'R: REROLL (-1,000)', W - 60, 590, 2, run.total >= 1000 && !run.rerolledThis ? WHT : '#6a6a76', 'right');
  c.fillStyle = '#000'; c.fillRect(0, 664, W, 56);
  blockText(c, '← → CHOOSE    1 2 3 PICK    ENTER CONFIRM', W / 2, 684, 2, { align: 'center', color: '#fff' });
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
