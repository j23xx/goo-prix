// GOO PRIX · src/scenes/run-complete.js — The end of a run: total, a grade per stage, PLAY AGAIN / ENDLESS / TITLE.
'use strict';

// The end of a run: the verdict, the total, a tile per stage with its grade, three big buttons.
function drawFinal(c, t) {
  drawSpaceBackdrop(c, t);
  const run = game.run || { mode: 'campaign', scores: [], grades: [], total: 0, newHigh: false, mixins: [], loop: 0, cleared: 0 };
  const endless = run.mode === 'endless';
  blockText(c, endless ? 'SLOPPED OUT!' : 'RUN COMPLETE!', W / 2, 18, 9, { align: 'center', color: YEL, outline: 6, outlineColor: INK, shadow: 11, shadowColor: PNK });
  // the total, as big as it gets
  c.fillStyle = 'rgba(5,10,46,0.72)'; c.beginPath(); c.roundRect(56, 100, 680, 176, 16); c.fill();
  hudText(c, endless ? 'LOOP ' + (run.loop + 1) + ' · ' + run.cleared + ' STAGES CLEARED' : 'TOTAL SCORE', 80, 112, 3, CYN);
  hudText(c, fmtScore(Math.round(run.total * clamp((t - 0.6) / 1.0, 0, 1))), 80, 146, 13, YEL);
  if (run.newHigh && t > 1.8) {
    c.save(); c.translate(250, 262); c.rotate(-0.05);
    c.fillStyle = INK; c.fillRect(-160, -16, 330, 44);
    c.fillStyle = CYN; c.fillRect(-166, -22, 330, 44);
    blockText(c, 'NEW HIGH SCORE!', -2, -12, 3, { align: 'center', color: INK });
    c.restore();
  }
  // the run grade stamp, or the endless top 5
  if (endless) {
    plate(c, 820, 104, 400, 176, MAG);
    hudText(c, 'ENDLESS TOP 5', 840, 118, 2, MAG);
    (save.endless || []).forEach((e, i) => blockText(c, (i + 1) + '. ' + fmtScore(e.score) + '  LOOP ' + e.loop, 840, 148 + i * 24, 2, { color: e.score === run.total ? YEL : WHT }));
  } else if (t > 1.4) drawGradeStamp(c, 1070, 196, runGrade(), t - 1.4, 0.92);
  // one tile per stage: the world, its name and the grade earned there
  const n = LEVELS.length, tw = 180, th = 170, gap0 = 16, x0 = W / 2 - (n * tw + (n - 1) * gap0) / 2, y0 = 300;
  for (let i = 0; i < n; i++) {
    const k = smooth01(clamp((t - 0.2 - i * 0.12) / 0.3, 0, 1));
    const grade = run.grades[i];
    c.save(); c.translate(0, (1 - k) * 60); c.globalAlpha = k;
    drawWorldTile(c, i, x0 + i * (tw + gap0), y0, tw, th, grade);
    c.restore();
  }
  if (run.mixins && run.mixins.length) { hudText(c, 'MIX-INS', 80, 506, 2, CYN); drawMixinRow(c, run.mixins, 190, 516, 40, 'left'); }
  // three big ways out
  const opts = endless ? [['again', 'PLAY AGAIN'], ['endless', 'FULL RUN'], ['title', 'TITLE']] : [['again', 'PLAY AGAIN'], ['endless', 'ENDLESS'], ['title', 'TITLE']];
  opts.forEach(([id, label], i) => drawButton(c, id, label, 60 + i * 400, 584, 360, 76, game.finMenu.i === i, { px: 5 }));
}

// A stage tile: a swatch of the world's sky and ground, its name, and a big grade letter.
function drawWorldTile(c, i, x, y, w, h, grade) {
  const th = THEMES[i], sky = th.sky;
  c.save();
  c.beginPath(); c.roundRect(x, y, w, h, 14); c.clip();
  const g = c.createLinearGradient(0, y, 0, y + h * 0.62);
  (sky.stops || sky.cols).forEach((s, k, a) => g.addColorStop(k / (a.length - 1), s));
  c.fillStyle = g; c.fillRect(x, y, w, h);
  const gr = th.ground;
  c.fillStyle = gr.a || gr.base || (gr.kind === 'ice' ? '#DDF6FF' : gr.kind === 'lanes' ? '#1B1464' : '#FF3D9A');
  c.fillRect(x, y + h * 0.62, w, h * 0.38);
  c.fillStyle = 'rgba(11,11,18,0.55)'; c.fillRect(x, y + h - 34, w, 34);
  c.restore();
  c.beginPath(); c.roundRect(x, y, w, h, 14); c.lineWidth = 5; c.strokeStyle = grade ? GRADE_COLORS[grade] : '#3a3a44'; c.stroke();
  blockText(c, LEVELS[i].boss ? 'BOSS' : LEVELS[i].name, x + w / 2, y + h - 24, 2, { align: 'center', color: WHT });
  blockText(c, grade || '-', x + w / 2, y + 26, 11, { align: 'center', color: grade ? GRADE_COLORS[grade] : '#5a5a66', outline: 5, outlineColor: INK, shadow: 6, shadowColor: INK });
}

// The final card's backdrop: the Cosmic Dumpster's airglow sky, confetti stars, planet and duck.
function drawSpaceBackdrop(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#050A2E'); g.addColorStop(0.6, '#1B1464'); g.addColorStop(1, '#0B5D7A');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2, 470);
  drawConfettiStars(c, 0, t);
  c.translate(-120, 40);
  drawTrashPlanet(c, 0, t);
  drawDuckMoon(c, 0, t);
  c.restore();
  // goo confetti falling over everything
  const rng = mulberry32(9);
  for (let i = 0; i < 40; i++) {
    const x = rng() * W, sp = 40 + rng() * 80, y = (rng() * H + t * sp) % (H + 40) - 20;
    gooBlob(c, x + Math.sin(t * 2 + i) * 12, y, 4 + rng() * 5, i, t, ['#7CFF3A', '#FF4FD8', '#FFC21A', '#19E0D0'][i % 4]);
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
