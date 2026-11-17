// GOO PRIX · src/shots.js — Deterministic poses for the screenshots.
'use strict';

// ============================================================================================
// SHOTS — ?shot=play | zerog | boss | results | final | select | howto | title | gameover
// ============================================================================================
function simulate(seconds) {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) { SCENES[game.scene].update(DT); endInputFrame(); }
}

// Fly a level on autopilot for a while, as if a good player had been at it.
function flyLevel(idx, seconds) {
  startRun('campaign', idx);
  game.run.continues = 2;
  startLevelScene(idx);
  enterScene('race');
  world.autopilot = true;
  world.countdown = 0.05;
  simulate(seconds);
}
// Pull a fresh wave in close so the frame shows what you are shooting at, and drop crash text.
function stageWave(near) {
  const w = world, p = w.player, before = w.targets.length;
  spawnWave();
  for (const tg of w.targets.slice(before)) { tg.dist += near - 125; if (tg.cls === 'ace') tg.keep = near + 10; }
  w.popups = w.popups.filter((pp) => !/BONK|STALLED|HIT/.test(pp.text));
}
// Dress the frame: a hot chain, the coat of paint it buys, a comic burst, a score just landed.
function dressCoat(chain, word) {
  const w = world;
  w.player.ghost = 0; w.player.invuln = 0; w.player.stun = 0;
  w.chain = chain; w.chainT = 2.1; w.mult = multFor(chain); w.coat = coatFor(w.mult); w.coatT = 2.5;
  w.bestChain = Math.max(w.bestChain, chain);
  w.seenHits = w.hits;
  w.onos = [{ text: word, x: 300, y: 250, t: 0.22, rot: -0.18, col: YEL }];
}

function posePlay() {
  game.racer = 1;
  flyLevel(0, +(PARAMS.get('t') || 40));
  stageWave(+(PARAMS.get('near') || 45));
  const w = world;
  w.score = 3860; w.shownScore = 3860; w.knocks = 1;
  dressCoat(19, 'SPLAT!');
  w.deltas = [{ text: '+480', good: true, t: 0.3 }, { text: '+250 BULLSEYE', good: true, t: 0.1 }];
  w.popups = w.popups.filter((pp) => pp.world);
}
function poseZeroG() {
  game.racer = 3;
  flyLevel(4, 21);
  stageWave(34);
  const w = world;
  w.score = 9420; w.shownScore = 9420; w.knocks = 2;
  dressCoat(33, 'GLORP!');
  // paint locks onto the nearest targets ahead, as if SPACE were held down
  const ahead = w.targets.filter((t) => !t.dead && gap(w.player.dist, t.dist) > 12 && gap(w.player.dist, t.dist) < 100).sort((a, b) => gap(w.player.dist, a.dist) - gap(w.player.dist, b.dist));
  w.locks = ahead.slice(0, 5);
  w.deltas = [{ text: '+1,560', good: true, t: 0.2 }];
}
function poseBoss() {
  game.racer = 7;
  flyLevel(5, 14);
  const w = world, b = w.boss;
  w.popups = w.popups.filter((pp) => !/BONK|HIT/.test(pp.text));
  b.filth = 58; b.phase = 2; b.maw = 1; b.time = 96; b.turrets[0].hp = 0;
  const r = mulberry32(3);
  b.splats = [];
  for (let i = 0; i < 9; i++) b.splats.push({ x: r() * 10 - 5, y: r() * 7 - 3.5, r: 0.5 + r() * 0.5, seed: 100 + i, t0: w.t - 1 - r() * 2 });
  w.score = 18240; w.shownScore = 18240;
  dressCoat(27, 'SPLOOSH!');
  w.onos[0].x = 250; w.onos[0].y = 420;
  w.popups = w.popups.filter((pp) => pp.world);
}
function poseResults() {
  flyLevel(1, 10);
  game.run.grades = ['A', 'S']; game.run.scores = [9880, 19140]; game.run.total = 29020; game.run.continues = 3;
  game.lastResults = {
    levelIdx: 1, name: LEVELS[1].name, score: 19140, quota: 6000, pass: true, grade: 'S', time: 80, newBest: true,
    lines: [['TARGETS', 11420], ['WINDOWS x23 (6 BULLSEYE)', 3200], ['CLEAN SWEEPS x7', 2100], ['RINGS, COINS, STUNTS', 1560], ['KNOCKS x1', -200], ['NO KNOCKS', 0], ['ACCURACY 82%', 1640], ['BEST CHAIN x41', 2050]].filter((l) => l[0] !== 'NO KNOCKS'),
  };
  world.state = 'done';
  enterScene('results');
  game.sceneT = 3.2;
}
function poseFinal() {
  game.racer = 3;
  startRun('campaign', 0);
  Object.assign(game.run, { grades: ['A', 'S', 'A', 'B', 'S', 'S'], scores: [9880, 19140, 17020, 16900, 38800, 41300], continues: 1, newHigh: true });
  game.run.total = game.run.scores.reduce((a, b) => a + b, 0);
  enterScene('final');
  game.sceneT = 3.4;
}

function runShot(name) {
  reseed(SHOT_SEED);
  game.diff = 1; game.racer = 0;
  save.bestCup = 142880; save.trophies = { 'run:0': 'S', 'run:1': 'A' };
  if (name === 'play') posePlay();
  else if (name === 'zerog') poseZeroG();
  else if (name === 'boss') poseBoss();
  else if (name === 'results') poseResults();
  else if (name === 'final') poseFinal();
  else if (name === 'level') { flyLevel(+(PARAMS.get('l') || 0), +(PARAMS.get('t') || 20)); }
  else if (name === 'howto') { enterScene('title'); simulate(3); enterScene('howto'); }
  else if (name === 'select') { enterScene('title'); simulate(3); game.mode = 'campaign'; enterScene('select'); game.racer = 7; game.sceneT = 0.6; }
  else if (name === 'gameover') { game.racer = 5; enterScene('gameover'); game.sceneT = 1; }
  else { enterScene('title'); simulate(7); game.menu.i = 0; game.sceneT = 1.2; }
  render();
}
