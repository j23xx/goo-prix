// GOO PRIX · src/scenes/run-complete.js — The end of a run: total, a grade per stage, PLAY AGAIN / ENDLESS / TITLE.
'use strict';

// The end of a run: the verdict and grade, the final score and its numbers, your build, the run
// stage by stage, the badges earned, and PLAY AGAIN / ENDLESS / TITLE on keys.
function drawFinal(c, t) {
  drawGround(c, t);
  drawGooConfetti(c, t);
  const run = game.run || null;
  if (!run || !run.stats) return;
  const endless = run.mode === 'endless';
  blockText(c, endless ? 'SLOPPED OUT!' : 'RUN COMPLETE!', W / 2, 14, 8, { align: 'center', color: YEL, outline: 5, outlineColor: INK, shadow: 9, shadowColor: PNK });
  label(c, endless ? 'ENDLESS SLOP · LOOP ' + (run.loop + 1) + ' · ' + run.cleared + ' STAGES CLEARED' : 'MISTER SPOTLESS IS FILTHY · THE WORLD IS PAINTED', W / 2, 78, 20, CREAM, { align: 'center' });
  // ---- left: the run grade (or the Endless top 5) and the ship you flew
  panel(c, 40, 112, 290, 384, endless ? 'ENDLESS TOP 5' : 'RUN GRADE', YEL);
  if (endless) (save.endless || []).forEach((e, i) => label(c, (i + 1) + '.  ' + fmtScore(e.score) + '  · LOOP ' + e.loop, 56, 146 + i * 30, 19, e.score === run.total ? YEL : CREAM));
  else if (t > 1.0) drawGradeStamp(c, 185, 236, runGrade(), t - 1.0, 0.82);
  drawShip(c, RACERS[game.racer], 185, 410, 150, { t, thrust: 1, flap: Math.sin(t * 5) > 0.7 ? 1 : 0 });
  label(c, RACERS[game.racer].name, 185, 462, 18, CREAM, { align: 'center' });
  // ---- middle: the final score, six numbers, and the build
  panel(c, 346, 112, 446, 384, 'FINAL SCORE', YEL);
  blockText(c, fmtScore(Math.round(run.total * clamp((t - 0.4) / 0.9, 0, 1))), 362, 140, 7, { color: YEL, outline: 3, outlineColor: INK });
  if (run.newHigh) label(c, '★ NEW BEST', 776, 118, 18, YEL, { align: 'right' });
  const st = run.stats;
  const cells = [
    [endless ? String(run.cleared) : run.stages.filter(Boolean).length + '/6', 'STAGES'], [fmtScore(st.kills), 'TARGETS SPLATTED'], [String(st.bestChain), 'BEST CHAIN'],
    [Math.round(runAccuracy(run) * 100) + '%', 'ACCURACY'], [String(st.bullseyes), 'BULLSEYES'], [String(st.knocks), 'KNOCKS'],
  ];
  cells.forEach(([v, k], i) => {
    const cx = 362 + (i % 3) * 142, cy = 210 + Math.floor(i / 3) * 70;
    c.fillStyle = 'rgba(255,255,255,0.05)'; c.beginPath(); c.roundRect(cx, cy, 132, 62, 8); c.fill();
    blockText(c, v, cx + 10, cy + 8, 3.5, { color: k === 'KNOCKS' && st.knocks ? RED : WHT });
    label(c, k, cx + 10, cy + 40, 13, '#B9B4D8');
  });
  label(c, 'YOUR BUILD', 362, 356, 15, MAG);
  const ids = run.mixins.slice(0, 8);
  if (!ids.length) label(c, 'NO MIX-INS', 362, 380, 16, '#B9B4D8');
  ids.forEach((id, i) => {
    const bx = 362 + (i % 2) * 212, by = 380 + Math.floor(i / 2) * 26;
    drawMixinIcon(c, id, bx + 10, by + 10, 18, t);
    label(c, MIXIN_BY_ID[id].name, bx + 26, by + 1, 17, MIXIN_BY_ID[id].risk ? RED : CREAM, { maxW: 180 });
  });
  // ---- right: the run, stage by stage
  drawStageChart(c, 808, 112, 432, 384, run);
  // ---- the badges, then three ways out
  drawBadges(c, runBadges(run), W / 2, 512, 34);
  const opts = endless ? [['again', 'ENTER', 'PLAY AGAIN'], ['endless', 'F', 'FULL RUN'], ['title', 'T', 'TITLE']] : [['again', 'ENTER', 'PLAY AGAIN'], ['endless', 'E', 'ENDLESS'], ['title', 'T', 'TITLE']];
  opts.forEach(([id, key, text], i) => keyButton(c, id, key, text, 40 + i * 410, 576, 380, 84, game.finMenu.i === i));
}
// A big menu button that shows the key that presses it.
function keyButton(c, id, key, text, x, y, w, h, selected) {
  drawButton(c, id, '', x, y, w, h, selected);
  const kh = Math.round(h * 0.42);
  const tw = labelWidth(c, text, Math.round(h * 0.42));
  const kw = Math.max(kh, labelWidth(c, key, Math.round(kh * 0.56)) + kh * 0.5);
  const x0 = x + w / 2 - (kw + 14 + tw) / 2;
  keycap(c, key, x0, y + (h - kh) / 2, kh, selected);
  label(c, text, x0 + kw + 14, y + h / 2 - h * 0.24, Math.round(h * 0.42), selected ? INK : WHT);
}
// Goo confetti falling over the run card.
function drawGooConfetti(c, t) {
  const rng = mulberry32(9);
  for (let i = 0; i < 34; i++) {
    const x = rng() * W, sp = 40 + rng() * 80, y = (rng() * H + t * sp) % (H + 40) - 20;
    gooBlob(c, x + Math.sin(t * 2 + i) * 12, y, 3 + rng() * 4, i, t, ['#7CFF3A', '#FF4FD8', '#FFC21A', '#19E0D0'][i % 4]);
  }
}

SCENES.final = {
  enter() { game.finMenu = { i: 0 }; MUSIC.play(SONGS.podium); sfx.fanfare(); game.finSaid = false; },
  update(dt) {
    if (!game.finSaid && game.sceneT > 2.2 && game.run && game.run.mode === 'endless') { game.finSaid = true; say(game.run.newHigh ? 'New high score!' : 'Slopped out!', 3); }
    if (!game.finSaid && game.sceneT > 2.2) { game.finSaid = true; const g = runGrade(); say(g === 'S' ? 'Masterpiece! Ess rank!' : g === 'A' ? 'Filthy work! A rank!' : 'Grade ' + g + '. Not bad!', 3); }
    const sel = menuNav(game.finMenu, ['again', 'endless', 'title']);
    const again = (mode) => { sfx.uiSelect(); game.mode = mode; startRun(mode, 0); goTo('intro', () => startLevelScene(0)); };
    if (sel === 0) again(game.run && game.run.mode === 'endless' ? 'endless' : 'campaign');
    if (sel === 1) again(game.run && game.run.mode === 'endless' ? 'campaign' : 'endless');
    if (sel === 2) { sfx.uiSelect(); goTo('title'); }
  },
  draw(c) { drawFinal(c, game.sceneT); },
};
