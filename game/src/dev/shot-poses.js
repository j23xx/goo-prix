// GOO PRIX · src/dev/shot-poses.js — Deterministic poses for the screenshots.
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
// The cover: the boss fight in phase 2, close up, with a goo stream hitting a gold stain.
function poseBoss() {
  game.racer = 7;
  flyLevel(5, 14);
  const w = world, b = w.boss, p = w.player;
  game.run.mixins = ['thick', 'sticky', 'goldleaf', 'hotsauce'];
  w.popups = []; w.wind = []; w.bolts = []; w.walls = []; w.globs = []; w.targets = [];
  b.filth = 58; b.phase = 2; b.maw = 1; b.time = 96; b.turrets[0].hp = 0; b.stun = 0; b.hitT = 0;
  b.off = 25; b.u = 0.6; b.v = 7.6; b.dist = p.dist + b.off;
  p.u = -0.4; p.v = 5.2; p.vu = 2; p.vv = 1; p.ghost = 0; p.invuln = 0; p.shield = 0; p.stun = 0; p.flapAnim = 0.4; p.boostT = 0; p.item = 'bomb';
  w.camU = p.u; w.camV = p.v + CFG.camUp; w.camRoll = 0; w.camSpin = 0;
  const r = mulberry32(3);
  b.splats = [];
  for (let i = 0; i < 12; i++) b.splats.push({ x: r() * 11 - 5.5, y: r() * 8 - 4, r: 0.5 + r() * 0.5, seed: 100 + i, t0: w.t - 1 - r() * 2 });
  // a stream of goo arcing into the exposed gold stain
  const si = Math.floor(w.t / 5) % 4, [sx0, sy0] = BOSS.stains[si];
  for (let k = 1; k <= 5; k++) {
    const f = k / 6;
    w.globs.push({ dist: p.dist + 3 + f * (b.off - 3), u: lerp(p.u, b.u + sx0, f), v: lerp(p.v + 0.3, b.v + sy0, f) + Math.sin(f * Math.PI) * 0.8, vs: 200, vu: 0, vv: 0, owner: p, life: 1, big: false, r: CFG.globR, seed: 40 + k, hit: [], beat: false, homing: null, lockBonus: 0, dmg: 1 });
  }
  worldPopup('+1,200 STAIN!', b.dist, b.u + sx0, b.v + sy0 + 1.6); w.popups[w.popups.length - 1].t = 0.35;
  // two bleach bolts on their way in, and dust bunnies spat from the maw
  w.bolts.push({ dist: p.dist + 14, u: p.u + 3.2, v: p.v + 2.4, vs: 6, vu: -2, vv: -1, life: 3, kind: 'bleach' });
  w.bolts.push({ dist: p.dist + 19, u: p.u - 4.2, v: p.v + 3.4, vs: 6, vu: 2, vv: -1, life: 3, kind: 'bleach' });
  spawnTarget('floater', p.dist + 17, 5.5, 4.2, { skin: 'dustbunny', refill: true, pts: 80 });
  spawnTarget('floater', p.dist + 20, -6.2, 9.6, { skin: 'dustbunny', refill: true, pts: 80 });
  w.score = 18240; w.shownScore = 18240; w.knocks = 1;
  dressCoat(27, 'SPLOOSH!');
  w.onos = [];
  w.deltas = [{ text: '+1,200', good: true, t: 0.2 }];
}
// The start screen, with the attract flight under way.
function poseTitle() {
  enterScene('title'); simulate(6.5); game.menu.i = 1; game.sceneT = 1.2;
  world.popups = [];
}
// The Mix-in draft between levels 3 and 4, over the dimmed Drain Disco.
function poseDraft() {
  flyLevel(1, 24);
  const run = game.run;
  run.mixins = ['thick', 'sticky']; run.drafts = 2; run.level = 3; run.total = 52040; run.grades = ['A', 'S', 'A'];
  run.stages = [{ idx: 0, score: 9880, quota: 5000, grade: 'A', knocks: 1 }, { idx: 1, score: 21140, quota: 7200, grade: 'S', knocks: 0 }, { idx: 2, score: 21020, quota: 11200, grade: 'A', knocks: 0 }];
  world.popups = []; world.wind = [];
  enterScene('draft');
  game.draft.offer = ['twin', 'hotsauce', 'needle']; game.draft.i = 1;
  game.sceneT = 1.4;
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
  const run = game.run;
  const grades = ['A', 'S', 'S', 'A', 'S', 'S'], scores = [9880, 21140, 31020, 33400, 52800, 41300], quotas = [5000, 7200, 11200, 14400, 21600, 0], knocks = [1, 0, 0, 2, 0, 1];
  Object.assign(run, { grades, scores, continues: 2, newHigh: true, mixins: ['thick', 'sticky', 'twin', 'needle', 'turpentine'] });
  run.total = scores.reduce((a, b) => a + b, 0);
  run.stages = grades.map((g, i) => ({ idx: i, score: scores[i], quota: quotas[i], grade: g, knocks: knocks[i] }));
  Object.assign(run.stats, { kills: 581, goldies: 4, shots: 702, hits: 588, bullseyes: 31, threads: 140, knocks: 4, bestChain: 117, noKnock: 3, time: 470 });
  enterScene('final');
  game.finMenu.i = 0;
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
  else if (name === 'title') poseTitle();
  else if (name === 'draft') poseDraft();
  else if (name === 'level') { flyLevel(+(PARAMS.get('l') || 0), +(PARAMS.get('t') || 20)); }
  else if (name === 'howto') { enterScene('title'); simulate(3); enterScene('howto'); }
  else if (name === 'select') { enterScene('title'); simulate(3); game.mode = 'campaign'; enterScene('select'); game.racer = 7; game.sceneT = 0.6; }
  else if (name === 'gameover') { game.racer = 5; enterScene('gameover'); game.sceneT = 1; }
  else { enterScene('title'); simulate(7); game.menu.i = 1; game.sceneT = 1.2; }
  render();
}
