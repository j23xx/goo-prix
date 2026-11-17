// GOO PRIX · src/play/run-progress.js — The run through all six stages: continues, level scores, grades, totals.
'use strict';

// ============================================================================================
// CAMPAIGN — five levels and the boss in a row, 3 continues; ENDLESS SLOP loops them until one
// quota is missed; or practise any level on its own
// ============================================================================================
function startRun(mode, levelIdx) {
  game.run = {
    mode, level: levelIdx || 0, continues: 3, scores: [], grades: [], total: 0, newHigh: false,
    mixins: [], drafts: 0, rerolls: 0, adjust: 0, seed: Math.floor(rand() * 1e6) + 1,
    loop: 0, cleared: 0, over: false,
  };
  if (mode === 'endless') game.run.continues = 0;
}
// The stage after this one: the next level, or round again (a loop faster) after the boss.
function advanceRun() {
  const run = game.run;
  run.level++;
  if (run.level >= LEVELS.length) { run.level = 0; run.loop++; }
}
// Endless ends on the first missed quota: keep the run in the local top 5.
function endEndless() {
  const run = game.run;
  run.over = true;
  const entry = { score: run.total, loop: run.loop + 1, stage: run.level + 1, ship: game.racer };
  save.endless = (save.endless || []).concat([entry]).sort((a, b) => b.score - a.score).slice(0, 5);
  run.newHigh = save.endless[0] === entry;
  writeSave();
}
function recordLevel(res) {
  const run = game.run;
  if (run.mode === 'endless') {
    if (res.pass) { run.total += res.score; run.cleared++; run.grades[res.levelIdx] = res.grade; }   // each stage's latest grade
    else endEndless();
    return;
  }
  if (!res.pass) return;
  run.scores[res.levelIdx] = res.score;
  run.grades[res.levelIdx] = res.grade;
  run.total = run.scores.reduce((a, b) => a + (b || 0), 0) + (run.adjust || 0);
  if (run.mode === 'campaign' && res.levelIdx === LEVELS.length - 1) {
    run.newHigh = run.total > save.bestCup;
    if (run.newHigh) save.bestCup = run.total;
    const key = 'run:' + game.diff;
    const order = ['S', 'A', 'B', 'C', 'D'];
    const worst = run.grades.reduce((a, g) => (order.indexOf(g) > order.indexOf(a) ? g : a), 'S');
    if (!save.trophies[key] || order.indexOf(worst) < order.indexOf(save.trophies[key])) save.trophies[key] = worst;
    writeSave();
  }
}
// An overall grade for the whole run: the average of the stage grades.
function runGrade() {
  const order = ['S', 'A', 'B', 'C', 'D'];
  const gs = game.run.grades.filter(Boolean);
  if (!gs.length) return 'D';
  const avg = gs.reduce((a, g) => a + order.indexOf(g), 0) / gs.length;
  return order[Math.round(avg)];
}
