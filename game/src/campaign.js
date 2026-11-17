// GOO PRIX · src/campaign.js — The run through all six stages: continues, level scores, grades, totals.
'use strict';

// ============================================================================================
// CAMPAIGN — five levels and the boss in a row, 3 continues; or practise any level on its own
// ============================================================================================
function startRun(mode, levelIdx) {
  game.run = { mode, level: levelIdx || 0, continues: 3, scores: [], grades: [], total: 0, newHigh: false };
}
function recordLevel(res) {
  const run = game.run;
  if (!res.pass) return;
  run.scores[res.levelIdx] = res.score;
  run.grades[res.levelIdx] = res.grade;
  run.total = run.scores.reduce((a, b) => a + (b || 0), 0);
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
