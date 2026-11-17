// GOO PRIX · src/play/stage-run.js — A level's run: setup, countdown, the level's twist and set piece, finish.
'use strict';

// ============================================================================================
// LEVEL_RUN — one flight through a world: shoot for points, thread windows, avoid knocks
// ============================================================================================
const game = {
  scene: 'title', diff: 1, racer: 0, run: null, lastResults: null,
  wipe: null, sceneT: 0, paused: false, menu: { i: 0 }, pauseMenu: { i: 0 }, selRow: 0, practiceLevel: 0,
};

function setupLevel(levelIdx, opts) {
  opts = opts || {};
  const L = LEVELS[levelIdx];
  TRACK = buildTrack(L.track, { mirror: false, diff: game.diff });
  THEME = TRACK.def.theme;
  world = {
    t: 0, racers: [], globs: [], ents: [], parts: [], popups: [], wind: [], barks: [], decalList: [], blasts: [], flash: 0, flash2: 0,
    targets: [], bolts: [], walls: [], waves: {}, waveId: 0, waveT: 2.2, locks: [], lockCd: 0, tags: [],
    state: 'countdown', countdown: 3.2, lastBeep: 4, shake: 0, hitstop: 0, playerHitCd: 0, bumpCd: 0,
    incoming: 0, warnSide: 0, warnCd: 0, doneT: 0, slowmo: 0, player: null, attract: !!opts.attract,
    camU: 0, camV: 6, camRoll: 0, camF: CFG.focal, camHz: CFG.horizon, rollExtra: 0,
    preFlap: null, goT: 0, level: L, levelIdx, length: levelSpeed(L) * LEVEL_SECONDS, quota: levelQuota(L), introT: 0,
    aim: { x: W / 2, y: CFG.horizon, u: 0, v: 6, lock: null, lockT: 0 },
    gsign: 1, flipT: 12, flipWarned: false, sideT: 0, sideDir: 1, blizz: 0, blizzT: 0, blizzDone: 0,
    darkT: 0, stormT: 0, setpieceDone: false, flipping: false, onBeatStreak: 0, gateStreak: 0, coinStreak: 0,
    boss: null, autopilot: !!opts.attract, lost: 0, windowPts: 0,
  };
  resetScore(world);
  const p = makeRacer(game.racer, !opts.attract, 0);
  p.dist = -14; p.u = 0; p.v = 5;
  world.racers.push(p);
  world.player = p;
  p.tank = tankMax(p);
  primeChain(world);
  world.camU = p.u; world.camV = p.v + CFG.camUp;
  if (L.boss) setupBoss();
}

function raceTime() { return world.state === 'countdown' ? 0 : world.t - world.goT; }

function startGo() {
  const w = world;
  w.state = 'run'; w.goT = w.t;
  const p = w.player;
  if (w.attract) { p.speed = cruiseSpeed() * 0.9; return; }
  sfx.beep(true);
  popup('GOO!', 'big');
  say('Goo!', 3);
  MUSIC.play(TRACK.def.song);
  if (w.preFlap != null && w.preFlap <= 0.12) rocket(p);
  else if (w.preFlap != null && w.preFlap <= 0.6) { p.stalled = 0.5; popup('STALLED!', 'mid'); }
}
function rocket(r) {
  giveBoost(r, CFG.rocketMul, 1.2);
  r.rocketed = true;
  if (r.isPlayer) { popup('ROCKET START!', 'mid'); award(200, 'ROCKET'); sfx.swoop(1); }
}

// The music's beat position (in beats since GO), taken from the audio clock when it is running.
function beatPos() {
  const bpm = TRACK.def.song.bpm;
  if (AU.ready && MUSIC.t0 != null && MUSIC.song) return (AU.now() - MUSIC.t0) * bpm / 60;
  return (world.t - world.goT) * bpm / 60;
}
// How far the current moment is from the nearest beat, in seconds.
function beatOffset() {
  const b = beatPos();
  return Math.abs(b - Math.round(b)) * 60 / TRACK.def.song.bpm;
}

function raceStep(dt) {
  const w = world;
  w.t += dt;
  const p = w.player;
  if (w.state === 'countdown') {
    w.countdown -= dt;
    const n = Math.ceil(w.countdown);
    if (!w.attract && n < w.lastBeep && n >= 1 && n <= 3) { w.lastBeep = n; sfx.beep(false); }
    if (!w.attract && flapKeyHit()) w.preFlap = w.countdown;
    p.flapAnim = Math.max(0, p.flapAnim - dt * 6);
    if (w.countdown <= 0) startGo();
    updateThings(TRACK, w.t, dt); updateParts(dt);
    return;
  }
  if (!w.attract && w.t - w.goT < 0.12 && !p.rocketed && w.preFlap == null && flapKeyHit()) rocket(p);
  w.playerHitCd = Math.max(0, w.playerHitCd - dt);
  w.warnCd = Math.max(0, w.warnCd - dt);
  if (w.state === 'run') updateTwists(dt);
  const ctl = w.autopilot || p.finished ? aiControl(p, dt) : playerControl(p, dt);
  updateRacer(p, ctl, dt);
  updateGlobs(dt);
  updateEnts(dt);
  updateTargets(dt);
  if (w.boss) updateBoss(dt);
  updateThings(TRACK, w.t, dt);
  updateParts(dt);
  updateScore(dt);
  if (!w.attract && w.state === 'run') incomingCheck(p);
  if (w.state === 'run' && !w.boss && p.dist >= w.length) {
    if (w.attract) { p.dist -= TRACK.L * 2; syncCrossings(p); for (const tg of w.targets) tg.dist -= TRACK.L * 2; }
    else finishLevel(true);
  }
  if (w.state === 'done') {
    w.doneT += dt;
    if (w.doneT > 3 && !w.leaving) { w.leaving = true; goTo('results'); }
  }
}

// ---- the twists: every level changes the rules of the game a little more
function updateTwists(dt) {
  const w = world, L = w.level, p = w.player;
  if (w.attract) return;
  const prog = clamp(p.dist / w.length, 0, 1);
  if (!w.setpieceDone && L.setpiece && prog >= 0.5) { w.setpieceDone = true; startSetpiece(L.setpiece); }
  w.darkT = Math.max(0, w.darkT - dt);
  w.sideT = Math.max(0, w.sideT - dt);
  if (w.stormT > 0) {
    w.stormT -= dt;
    if (Math.random() < dt * 6) spawnTarget(pick(['floater', 'zipper']), p.dist + rnd(70, 120), rnd(-10, 10), rnd(2, 12));
    if (Math.random() < dt * 2) fireBolt(p.dist + rnd(60, 90), rnd(-9, 9), rnd(2, 12), { vs: -40 });
  }
  if (L.twist === 'rhythm') {
    // the pipe sways to the music, and every third phrase it flips upside down for half a phrase
    const b = beatPos();
    const inFlip = Math.floor(b / 16) % 3 === 2 && b % 16 < 8;
    w.rollExtra = (inFlip ? TAU * smooth01((b % 16) / 8) : 0) + Math.sin(b * Math.PI / 8) * 0.32;
    if (inFlip && !w.flipping) { w.flipping = true; popup('BARREL ROLL!', 'big'); say('Drop!', 2); sfx.swoop(1); }
    else if (!inFlip) w.flipping = false;
  } else if (L.twist === 'whiteout') {
    // three blizzards: the world goes white and the gates turn to frost glass until you goo them
    if (w.blizzT > 0) { w.blizzT -= dt; w.blizz = Math.min(1, w.blizz + dt * 0.8); if (w.blizzT <= 0) say('Clearing!', 1); }
    else {
      w.blizz = Math.max(0, w.blizz - dt * 0.6);
      const marks = [0.18, 0.66, 0.84];
      if (w.blizzDone < marks.length && prog >= marks[w.blizzDone]) { w.blizzDone++; w.blizzT = 8; popup('BLIZZARD!', 'big'); say('White out!', 2); }
    }
  } else if (L.twist === 'gravity') {
    w.flipT -= dt;
    if (w.flipT < 2 && !w.flipWarned) { w.flipWarned = true; popup('GRAVITY FLIP IN 2', 'mid'); sfx.warn(); }
    if (w.flipT <= 0) {
      w.gsign *= -1; w.flipT = 12; w.flipWarned = false;
      popup(w.gsign < 0 ? 'UPSIDE DOWN!' : 'RIGHT WAY UP!', 'big'); say('Flip!', 2); shake(8); sfx.swoop(1);
    }
  }
}

function startSetpiece(kind) {
  const w = world, p = w.player;
  switch (kind) {
    case 'giant':   // the toast sun comes down for a fight
      spawnTarget('tank', p.dist + 95, 0, 7, { giant: true, hp: 14, r: 4.4, pts: 1500, skin: 'toastmoth' });
      popup('THE TOAST SUN IS ANGRY!', 'mid'); say('Giant toast!', 3);
      break;
    case 'shower':  // the disco ball drops, a shower of splitting mirror balls
      for (let i = 0; i < 7; i++) spawnTarget('splitter', p.dist + 80 + i * 6, rnd(-9, 9), rnd(3, 12), { skin: 'discoball' });
      popup('MIRROR BALL SHOWER!', 'mid'); say('Mirror ball!', 3);
      break;
    case 'dark':    // the fridge door slams: darkness, lit only by your goo
      w.darkT = 6; popup('LIGHTS OUT!', 'big'); say('Lights out!', 3); sfx.bonk();
      break;
    case 'sideways':
      w.sideT = 10; w.sideDir = rand() < 0.5 ? -1 : 1; popup('THE LAMP TIPS OVER!', 'mid'); say('Sideways!', 3);
      break;
    case 'storm':
      w.stormT = 8; popup('JUNK STORM!', 'big'); say('Junk storm!', 3);
      break;
  }
}

function finishLevel(ok) {
  const w = world, L = w.level, p = w.player;
  w.state = 'done'; w.doneT = 0;
  const before = w.score;
  const acc = w.shots ? Math.min(1, w.hits / w.shots) : 0;
  const bonuses = [];
  if (L.boss) {
    if (ok) {
      bonuses.push(['STAIN SUPREME', 20000]);
      bonuses.push(['TIME LEFT ' + Math.ceil(w.boss.time) + 'S', Math.ceil(w.boss.time) * 100]);
    }
  } else {
    if (w.knocks === 0) bonuses.push(['NO KNOCKS', 2000]);
    bonuses.push(['ACCURACY ' + Math.round(acc * 100) + '%', Math.round(acc * 100) * 20]);
    bonuses.push(['BEST CHAIN x' + w.bestChain, w.bestChain * 50]);
  }
  for (const b of bonuses) w.score += b[1];
  const pass = L.boss ? !!ok : w.score >= w.quota;
  const grade = L.boss ? (ok ? (w.boss.time > 60 ? 'S' : w.boss.time > 35 ? 'A' : w.boss.time > 15 ? 'B' : 'C') : 'D') : gradeFor(w.score / Math.max(1, w.quota));
  const extras = Math.max(0, before - w.killPts - w.windowPts - w.sweeps * 300 + w.lost);
  const res = {
    levelIdx: w.levelIdx, name: L.name, score: w.score, quota: w.quota, pass, grade, time: raceTime(),
    lines: [
      ['TARGETS', w.killPts],
      ['WINDOWS x' + w.threads + (w.bullseyes ? ' (' + w.bullseyes + ' BULLSEYE)' : ''), w.windowPts],
      ['CLEAN SWEEPS x' + w.sweeps, w.sweeps * 300],
      [L.boss ? 'BOSS PHASES' : 'RINGS, COINS, STUNTS', extras],
      ['KNOCKS x' + w.knocks, -w.lost],
    ].concat(bonuses),
    knocks: w.knocks, accuracy: acc, bestChain: w.bestChain,
    kills: w.kills || 0, goldies: w.goldies || 0, shots: w.shots, hits: w.hits, bullseyes: w.bullseyes, threads: w.threads,
  };
  const key = 'lvl' + w.levelIdx + ':' + game.diff;
  res.newBest = !save.bestRace[key] || w.score > save.bestRace[key];
  if (res.newBest && pass) save.bestRace[key] = w.score;
  writeSave();
  game.lastResults = res;
  if (game.run) recordLevel(res);
  if (pass) {
    sfx.finish();
    if (L.boss) { popup('STAIN SUPREME!', 'big'); say('Stain supreme!', 3); }
    else { popup('QUOTA SMASHED!', 'big'); say(grade === 'S' ? 'Ess rank!' : 'Quota smashed!', 3); }
  } else { sfx.sad(); popup(L.boss ? 'TIME UP!' : 'REJECTED!', 'big'); say('Rejected!', 3); }
  MUSIC.tempoMul = 1; MUSIC.transpose = 0;
}

// Warn about bolts and socks closing in from behind.
function incomingCheck(p) {
  const w = world;
  w.incoming = 0;
  for (const b of w.bolts) {
    const dd = gap(p.dist, b.dist);
    if (dd > 0 && dd < 22 && Math.abs(b.u - p.u) < 2.5 && Math.abs(b.v - p.v) < 2.5) { w.incoming = 1; w.warnSide = Math.sign(b.u - p.u) || 1; }
  }
  if (w.incoming && w.warnCd <= 0) { sfx.warn(); w.warnCd = 0.6; }
}
