// GOO PRIX · src/race.js — A level's run: setup, countdown, progress, finish and results.
'use strict';

// ============================================================================================
// RACE — setup and grid, countdown and rocket starts, laps, positions, finish and race results
// ============================================================================================
const game = {
  scene: 'title', diff: 1, racer: 0, scheme: 'keys', mirror: false, cup: null, lastResults: null,
  wipe: null, sceneT: 0, paused: false, menu: { i: 0 }, pauseMenu: { i: 0 }, quickTrack: 0, selRow: 0,
};

function setupRace(trackIdx, opts) {
  opts = opts || {};
  TRACK = buildTrack(trackIdx, { mirror: game.mirror, diff: game.diff });
  THEME = TRACK.def.theme;
  world = {
    t: 0, racers: [], globs: [], ents: [], parts: [], popups: [], wind: [], barks: [], decalList: [], blasts: [], flash2: 0,
    state: 'countdown', countdown: 3.2, lastBeep: 4, score: 0, scoreBy: {}, gateStreak: 0, coinStreak: 0, combo: 0, comboT: -9,
    shake: 0, flash: 0, hitstop: 0, playerHitCd: 0, playerShotBudget: 2, bumpCd: 0, incoming: 0, warnSide: 0, warnCd: 0,
    doneT: 0, slowmo: 0, player: null, attract: !!opts.attract, camU: 0, camV: 6, camRoll: 0, camF: CFG.focal, camHz: CFG.horizon,
    preFlap: null, goT: 0, raceIndex: game.cup && !opts.attract ? game.cup.race : 0, trackIdx, lastPlace: 7, introT: 0,
    order: [], aim: { x: W / 2, y: CFG.horizon, u: 0, v: 6, lock: null, lockT: 0 }, cleanLaps: 0,
  };
  const order = gridOrder(!!opts.attract);
  const [lo, hi] = CFG.aiSkill[game.diff];
  order.forEach((defIdx, slot) => {
    const isPlayer = !opts.attract && defIdx === game.racer;
    const r = makeRacer(defIdx, isPlayer, slot);
    r.ai.skill = clamp(lerp(lo, hi, world.raceIndex / 4) + (r.def.ai.precise ? 0.06 : 0) - (r.def.ai.sloppy ? 0.08 : 0) + rnd(-0.03, 0.03), 0.4, 0.95);
    world.racers.push(r);
    if (isPlayer) world.player = r;
  });
  if (!world.player) world.player = world.racers[2];
  const nemIdx = game.racer === 7 ? 0 : 7;
  for (const r of world.racers) r.nemesis = !opts.attract && r.idx === nemIdx;
  world.camU = world.player.u; world.camV = world.player.v + CFG.camUp;
  updatePlaces();
  world.lastPlace = world.player.place;
}

function gridOrder(attract) {
  const all = [0, 1, 2, 3, 4, 5, 6, 7];
  if (!attract && game.cup && game.cup.race > 0) {
    // reverse standings: the leader starts at the back
    return all.slice().sort((a, b) => (game.cup.pts[a] - game.cup.pts[b]) || (b - a));
  }
  const others = all.filter((i) => attract || i !== game.racer);
  for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
  if (!attract) others.push(game.racer);
  return others;
}

function updatePlaces() {
  const rs = world.racers.slice().sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.dist - a.dist;
  });
  rs.forEach((r, i) => { r.prevPlace = r.place; r.place = i; });
  world.order = rs;
}

function raceTime() { return world.state === 'countdown' ? 0 : world.t - world.goT; }

function startGo() {
  const w = world;
  w.state = 'run'; w.goT = w.t;
  for (const r of w.racers) r.lapStart = w.t;
  if (w.attract) { for (const r of w.racers) r.speed = cruiseSpeed() * 0.9; return; }
  sfx.beep(true);
  popup('GO!', 'big');
  const p = w.player;
  if (w.preFlap != null && w.preFlap <= 0.12) rocket(p);
  else if (w.preFlap != null && w.preFlap <= 0.6) { p.stalled = 0.5; popup('STALLED!', 'mid'); }
  // rivals: perfect starters and the rest by luck and skill
  for (const r of w.racers) if (!r.isPlayer && (r.def.ai.sloppy || rand() < r.ai.skill * 0.45)) giveBoost(r, CFG.rocketMul, 1.0);
}
function rocket(r) {
  giveBoost(r, CFG.rocketMul, 1.2);
  r.rocketed = true;
  if (r.isPlayer) { popup('ROCKET START!', 'mid'); addScore(r, 100, 'stunt'); sfx.swoop(1); }
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
    for (const r of w.racers) { r.flapAnim = Math.max(0, r.flapAnim - dt * 6); if (rand() < 0.02) r.flapAnim = 1; }
    if (w.countdown <= 0) startGo();
    updateThings(TRACK, w.t, dt); updateParts(dt);
    return;
  }
  if (!w.attract && w.t - w.goT < 0.12 && !p.rocketed && w.preFlap == null && flapKeyHit()) rocket(p);
  w.playerShotBudget = Math.min(2, w.playerShotBudget + 2 * dt);
  w.playerHitCd = Math.max(0, w.playerHitCd - dt);
  w.bumpCd = Math.max(0, w.bumpCd - dt);
  w.warnCd = Math.max(0, w.warnCd - dt);
  for (const r of w.racers) {
    const ctl = r.isPlayer && !w.autopilot ? playerControl(r, dt) : aiControl(r, dt);
    updateRacer(r, ctl, dt);
    const lap = Math.floor(Math.max(0, r.dist) / TRACK.L);
    if (lap > r.lap && !r.finished) {
      r.lapTimes.push(w.t - r.lapStart); r.lapStart = w.t; r.lap = lap;
      if (r.isPlayer) playerLap(r);   // also scores the clean final lap as the player crosses the line
      r.lapBonks = 0;
    }
    if (!r.finished && r.dist >= CFG.laps * TRACK.L) {
      r.finished = true; r.finishTime = w.t - w.goT;
      if (r.isPlayer) playerFinished(r);
    }
  }
  racerInteractions(dt);
  updateGlobs(dt);
  updateEnts(dt);
  updateThings(TRACK, w.t, dt);
  updateParts(dt);
  updatePlaces();
  if (!w.attract && w.state === 'run') {
    if (p.place < w.lastPlace) { sfx.posUp(); p.overtakes += w.lastPlace - p.place; addScore(p, 50, 'stunt'); popup('OVERTAKE!', 'small'); }
    else if (p.place > w.lastPlace) sfx.posDown();
    w.lastPlace = p.place;
    incomingCheck(p);
  }
  if (w.state === 'done') {
    w.doneT += dt;
    if (w.doneT > 3.2 && !w.leaving) { w.leaving = true; finalizeRace(); goTo('results'); }
  }
}

function playerLap(p) {
  const w = world;
  if (p.lapBonks === 0) { w.cleanLaps++; addScore(p, 300, 'clean'); if (p.lap < CFG.laps) popup('CLEAN LAP!', 'small'); }
  if (p.lap >= CFG.laps) return;   // that was the finish line, not a new lap
  if (p.lap === CFG.laps - 1) {
    popup('FINAL LAP!', 'big'); sfx.fanfare();
    MUSIC.tempoMul = 1.08; MUSIC.transpose = 1;
  } else popup('LAP ' + (p.lap + 1), 'mid');
}

function playerFinished(p) {
  const w = world;
  w.state = 'done'; w.doneT = 0;
  const close = w.racers.some((o) => o !== p && Math.abs(o.dist - p.dist) < 9);
  if (close) { w.slowmo = 0.6; popup('PHOTO FINISH!', 'mid'); }
  popup(ORD[p.place] + ' PLACE!', 'big');
  sfx.finish();
  MUSIC.tempoMul = 1; MUSIC.transpose = 0;
}

function finalizeRace() {
  const w = world;
  const p = w.player;
  const L = TRACK.L;
  for (const r of w.racers) {
    if (!r.finished) {
      r.finishTime = (w.t - w.goT) + Math.max(0, CFG.laps * L - r.dist) / (cruiseSpeed() * 0.97 * r.stats.spd);
      r.finished = true;
    }
  }
  const order = w.racers.slice().sort((a, b) => a.finishTime - b.finishTime);
  const pos = order.indexOf(p);
  const bestLap = p.lapTimes.length ? Math.min(...p.lapTimes) : 0;
  let fastest = true;
  for (const r of w.racers) if (r !== p) for (const lt of r.lapTimes) if (lt < bestLap) fastest = false;
  const cup = game.cup;
  const dnq = cup && cup.mode === 'cup' && pos >= 5;
  const finishBonus = (8 - pos) * 500;
  const fastBonus = fastest && bestLap ? 500 : 0;
  const key = TRACK.index + ':' + game.diff + (game.mirror ? 'm' : '');
  const newBestRace = !save.bestRace[key] || p.finishTime < save.bestRace[key];
  const newBestLap = bestLap && (!save.bestLap[key] || bestLap < save.bestLap[key]);
  if (newBestRace) save.bestRace[key] = p.finishTime;
  if (newBestLap) save.bestLap[key] = bestLap;
  save.wallet += p.coins;
  writeSave();
  const sb = w.scoreBy;
  const res = {
    trackIdx: TRACK.index, pos, time: p.finishTime, bestLap, dnq,
    order: order.map((r, i) => ({ idx: r.idx, time: r.finishTime, isPlayer: r.isPlayer, pts: CFG.points[i] })),
    lines: [
      ['FINISH ' + ORD[pos], finishBonus],
      ['SPLATS x' + p.hitsGiven, sb.splat || 0],
      ['ITEM HITS x' + p.itemHits, sb.item || 0],
      ['SWOOPS x' + p.swoops, sb.swoop || 0],
      ['COINS x' + p.coins, sb.coin || 0],
      ['CLEAN LAPS x' + w.cleanLaps, sb.clean || 0],
      ['RINGS, PASSES, STUNTS', sb.stunt || 0],
      [fastest ? 'FASTEST LAP!' : 'FASTEST LAP: NOT YOURS', fastBonus],
    ],
    raceScore: w.score + finishBonus + fastBonus,
    newBestRace, newBestLap,
  };
  if (cup && !dnq) {
    order.forEach((r, i) => { cup.pts[r.idx] += CFG.points[i]; });
    cup.score += res.raceScore;
    cup.lastWins = order.map((r) => r.idx);
    cup.splats += p.hitsGiven;
    if (bestLap && (!cup.bestLap || bestLap < cup.bestLap)) cup.bestLap = bestLap;
  }
  game.lastResults = res;
}

function incomingCheck(p) {
  const w = world;
  w.incoming = 0;
  for (const g of w.globs) {
    if (g.owner === p) continue;
    const dd = gap(g.dist, p.dist);
    if (dd <= 0 || dd > 50) continue;
    const rel = g.vs - p.speed;
    if (rel <= 0) continue;
    if (dd / rel < 0.5 && Math.abs(g.u - p.u) < 2.6 && Math.abs(g.v - p.v) < 2.6) {
      w.incoming = 1; w.warnSide = Math.sign(g.u - p.u) || 1;
    }
  }
  for (const e of w.ents) if (e.kind === 'sock' && e.target === p && gap(e.dist, p.dist) < 40) { w.incoming = 1; w.warnSide = Math.sign(e.u - p.u) || 1; }
  if (w.incoming && w.warnCd <= 0) { sfx.warn(); w.warnCd = 0.6; }
}
