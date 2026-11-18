// GOO PRIX · src/scenes/level-results.js — After a level: the score breakdown, the grade stamp, NEXT / RETRY / TITLE.
'use strict';

function resultOptions(res) {
  const run = game.run, opts = [];
  const L = LEVELS[res.levelIdx];
  const nextIdx = res.levelIdx + 1;
  if (run.mode === 'practice') {
    opts.push({ id: 'retry', label: 'RETRY ' + L.name, go: () => goTo('intro', () => startLevelScene(res.levelIdx)) });
    if (nextIdx < LEVELS.length) opts.push({ id: 'next', label: 'NEXT: ' + LEVELS[nextIdx].name, go: () => { game.practiceLevel = nextIdx; goTo('intro', () => startLevelScene(nextIdx)); } });
    opts.push({ id: 'title', label: 'TITLE', go: () => goTo('title') });
    return opts;
  }
  if (run.mode === 'endless') {
    if (res.pass) {
      const after = run.level + 1 >= LEVELS.length ? 0 : run.level + 1;
      opts.push({ id: 'next', label: 'PICK A MIX-IN, THEN ' + (LEVELS[after].boss ? 'THE BOSS' : LEVELS[after].name), go: () => { advanceRun(); goTo(drawMixinOffer(run).length ? 'draft' : 'intro', () => { if (!drawMixinOffer(run).length) startLevelScene(run.level); }); } });
    } else opts.push({ id: 'next', label: 'SEE YOUR ENDLESS RUN', go: () => goTo('final') });
    opts.push({ id: 'title', label: 'QUIT TO TITLE', go: () => goTo('title') });
    return opts;
  }
  if (!res.pass) {
    if (run.continues > 0) opts.push({ id: 'retry', label: 'CONTINUE (' + run.continues + ' LEFT)', go: () => { run.continues--; goTo('intro', () => startLevelScene(res.levelIdx)); } });
    else opts.push({ id: 'over', label: 'GAME OVER', go: () => goTo('gameover') });
    opts.push({ id: 'title', label: 'QUIT', go: () => goTo('title') });
    return opts;
  }
  if (nextIdx < LEVELS.length) opts.push({ id: 'next', label: 'PICK A MIX-IN, THEN ' + (LEVELS[nextIdx].boss ? 'THE BOSS' : LEVELS[nextIdx].name), go: () => { run.level = nextIdx; goTo('draft'); } });
  else opts.push({ id: 'next', label: 'FINAL RESULTS', go: () => goTo('final') });
  // a cleared level can be flown again for a better grade (the new score replaces the old)
  opts.push({ id: 'retry', label: 'RETRY FOR A BETTER GRADE', go: () => goTo('intro', () => startLevelScene(res.levelIdx)) });
  opts.push({ id: 'title', label: 'QUIT TO TITLE', go: () => goTo('title') });
  return opts;
}

function drawResults(c, res, t) {
  const L = LEVELS[res.levelIdx];
  hudText(c, res.pass ? (L.boss ? 'STAIN SUPREME!' : 'QUOTA SMASHED!') : (L.boss ? 'TIME UP' : 'REJECTED'), 60, 30, 6, res.pass ? YEL : RED);
  hudText(c, (L.boss ? 'FINAL BOSS' : 'LEVEL ' + (res.levelIdx + 1) + '/5') + ' · ' + L.name + ' · ' + DIFFS[game.diff], 60, 82, 2, CYN);
  // the score breakdown, line by line, counting up
  const px0 = 60, pw = 640;
  plate(c, px0 - 16, 108, pw + 32, 64 + res.lines.length * 34 + 70);
  res.lines.forEach((ln, i) => {
    const y = 126 + i * 34;
    const a = clamp((t - 0.25 - i * 0.12) / 0.2, 0, 1);
    c.globalAlpha = a;
    blockText(c, ln[0], px0, y, 2, { color: WHT });
    const v = ln[1];
    blockText(c, (v < 0 ? '-' : '+') + fmtScore(Math.abs(v)), px0 + pw, y, 2, { align: 'right', color: v < 0 ? RED : v ? GOO_C : '#5a5a66' });
    c.globalAlpha = 1;
  });
  const yT = 126 + res.lines.length * 34 + 6;
  c.fillStyle = PNK; c.fillRect(px0, yT, pw, 3);
  const shown = Math.round(res.score * clamp((t - 0.5) / 1.1, 0, 1));
  blockText(c, 'LEVEL SCORE', px0, yT + 22, 2, { color: CYN });
  hudText(c, fmtScore(shown), px0 + pw, yT + 14, 7, YEL, 'right');
  if (!L.boss) {
    const k = clamp(res.score / Math.max(1, res.quota), 0, 3);
    blockText(c, 'QUOTA ' + fmtScore(res.quota) + ' · x' + k.toFixed(2), px0, yT + 46, 2, { color: res.pass ? GOO_C : RED });
  } else blockText(c, res.pass ? 'GRADED ON TIME LEFT' : 'HE IS STILL SPOTLESS', px0, yT + 46, 2, { color: res.pass ? GOO_C : RED });
  // the grade stamp slams down once the score has counted
  if (t > 1.6) drawGradeStamp(c, 960, 250, res.grade, t - 1.6, 1);
  if (res.newBest && res.pass && t > 2.0) {
    c.save(); c.translate(960, 400); c.rotate(-0.08);
    c.fillStyle = INK; c.fillRect(-106, -18, 220, 44);
    c.fillStyle = PNK; c.fillRect(-112, -24, 220, 44);
    blockText(c, 'NEW BEST!', -2, -14, 4, { align: 'center', color: WHT });
    c.restore();
  }
  // run so far
  const run = game.run;
  if (run && run.mode === 'campaign') {
    plate(c, 780, 440, 440, 90, CYN);
    blockText(c, 'RUN TOTAL ' + fmtScore(run.total) + ' · CONTINUES ' + run.continues, 800, 454, 2, { color: WHT });
    LEVELS.forEach((lv, i) => drawGradeBadge(c, 816 + i * 66, 500, 20, run.grades[i] || null));
  }
  const opts = resultOptions(res);
  opts.forEach((o, i) => drawButton(c, o.id, o.label, 780, 556 + i * 52, 440, 42, game.resMenu.i === i, { px: 2 }));
}

SCENES.results = {
  enter() {
    game.resMenu = { i: 0 };
    MUSIC.play(SONGS.results);
    const res = game.lastResults;
    if (res.pass) sfx.fanfare(); else sfx.sad();
    game.resSaid = false;
  },
  update(dt) {
    world.t += dt; updateParts(dt);
    const res = game.lastResults;
    if (!game.resSaid && game.sceneT > 1.7) {
      game.resSaid = true;
      say(res.pass ? (res.grade === 'S' ? 'Ess rank! Masterpiece!' : 'Grade ' + res.grade + '!') : 'Rejected!', 3);
    }
    const opts = resultOptions(res);
    const sel = menuNav(game.resMenu, opts.map((o) => o.id));
    if (sel < 0) return;
    sfx.uiSelect();
    opts[sel].go();
  },
  draw(c) {
    applyCamera(); renderWorld(c); dim(c, 0.6);
    drawResults(c, game.lastResults, game.sceneT);
  },
};
