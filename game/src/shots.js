// GOO PRIX · src/shots.js — Deterministic poses for the screenshots.
'use strict';

// ============================================================================================
// SHOTS — deterministic poses for the screenshots: ?shot=title | race | results | podium
// ============================================================================================
function simulate(seconds) {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) { SCENES[game.scene].update(DT); endInputFrame(); }
}

// The gate with the most going on in front of it: cubes, coins and rings, more gates behind.
function showcaseGate() {
  const T = TRACK;
  let best = null;
  for (const th of T.things) {
    if (th.kind !== 'gate' || th.paddle || th.slide) continue;
    let score = 0;
    for (const o of T.things) {
      const d = wrap(o.s - (th.s - 42), T.L);
      if (d > 220) continue;
      if (d > 8 && d < 60) { if (o.kind === 'cube') score += 3; if (o.kind === 'coin') score += 1; if (o.kind === 'ring') score += 2; }
      if (d > 60 && (o.kind === 'gate' || o.kind === 'pillars')) score += 1;
    }
    if (!best || score > best.score) best = { th, score };
  }
  return best.th;
}

function poseRace() {
  const trk = clamp(parseInt(PARAMS.get('track') || '0', 10) || 0, 0, 4);   // ?track=N previews any world
  startCup('cup');
  game.cup.race = trk;
  game.cup.tokens = 3;
  setupRace(trk);
  enterScene('race');
  world.state = 'run'; world.goT = 0;
  world.autopilot = true;
  simulate(12);
  world.autopilot = false;
  const L = TRACK.L, p = world.player, g = showcaseGate();
  const at = (idx) => world.racers.find((r) => r.idx === idx);
  world.t = 47.36 + world.goT;
  for (const th of TRACK.things) { th.back = 0; if (th.blocks) for (const b of th.blocks) b.hp = 1; }
  p.dist = L + g.s - 36; p.u = g.u - 1.4; p.v = g.v - 0.4; p.vu = 3; p.vv = 2; p.lap = 1; p.lapTimes = [33.91]; p.lapStart = world.t - 13.45;
  p.speed = 82; p.boostT = 0.7; p.boostMul = 1.42; p.coins = 7; p.tank = 62; p.item = 'sock'; p.flapAnim = 0.6; p.stun = 0; p.invuln = 0; p.goop = 0; p.splats = [];
  world.score = 12450;
  const place = (idx, d, du, dv, extra) => {
    const r = at(idx);
    Object.assign(r, { dist: p.dist + d, u: clamp(g.u + du, -10.5, 10.5), v: clamp(g.v + dv, 1.2, 12.8), vu: 0, vv: 0, stun: 0, invuln: 0, goop: 0, shield: 0, splats: [], finished: false, flapAnim: 0 }, extra || {});
    return r;
  };
  place(2, 150, 1, 0.5);                                            // Sprocket: the true leader, far ahead
  const crumb = place(7, 13 - L, 2.8, 0.2, { flapAnim: 1 });         // Count Crumb, being lapped, about to be splatted
  place(3, 21 - L, -4.6, -1.6, { shield: 5 });                      // Nana Fang in Bubble Wrap
  place(6, 29 - L, 4.4, 2.6, { goop: 1.2, splats: [{ x: -0.2, y: -0.1, seed: 33, t: 3 }] });
  place(5, 52 - L, -0.4, 0.2, { flapAnim: 1 });                     // Zippy Pickle, seen through the window
  place(4, -24, 3, 0.5);                                            // Moldy Greg right behind (rear strip)
  place(1, -66, -5, 1);                                             // Dame Custard
  // the shot that is landing
  crumb.goop = 1.3; crumb.splats = [{ x: 0.1, y: -0.25, seed: 91, t: 4 }];
  world.globs = [
    { dist: crumb.dist - 0.9, u: crumb.u - 0.5, v: crumb.v - 0.2, vs: 240, vu: 4, vv: 1, owner: p, life: 0.3, big: false, r: CFG.globR, seed: 7, hit: [] },
    { dist: p.dist + 9, u: p.u + 0.6, v: p.v + 0.4, vs: 240, vu: 3, vv: 1, owner: p, life: 0.6, big: false, r: CFG.globR, seed: 12, hit: [] },
    { dist: p.dist - 10, u: p.u - 3.5, v: p.v, vs: 230, vu: 0, vv: 0, owner: at(4), life: 0.6, big: false, r: CFG.globR, seed: 19, hit: [] },
  ];
  world.parts = [];
  reseed(SHOT_SEED + 5);
  burst(crumb.dist, crumb.u, crumb.v, 16, 'goo');
  for (const pt of world.parts) { pt.dist += pt.vd * 0.08; pt.u += pt.vu * 0.08; pt.v += pt.vv * 0.08; }
  world.popups = [];
  worldPopup('SPLAT x2! +200', crumb.dist, crumb.u, crumb.v + 1.7);
  world.popups[0].t = 0.3;
  for (const [du, dv, r] of [[-3.2, 2.1, 1.1], [3.6, -1.8, 0.9], [-4.4, -2.4, 1.3]]) addDecal(g, g.u + du + (du > 0 ? g.w / 2 : -g.w / 2), g.v + dv, r);
  world.ents = [];
  world.wind = [];
  world.barks = [];
  for (const r of world.racers) syncCrossings(r);
  updatePlaces();
  world.lastPlace = p.place;
  world.camU = p.u - 0.5; world.camV = p.v + CFG.camUp - 0.25; world.camRoll = -0.045; world.camF = 720; world.camHz = CFG.horizon + 6;
  world.shake = 0; world.flash = 0;
  input.lastDevice = 'keys';
  applyCamera();
  updateAim(p, 1);
}

// Second gameplay pose: The Trip on the final lap, leading, a laser gate or spinner ahead, items flying.
function poseHazard() {
  startCup('cup');
  game.cup.race = 1;
  game.cup.pts = [15, 1, 8, 10, 2, 6, 4, 12];
  game.cup.score = 9800;
  game.cup.tokens = 3;
  game.racer = 0;
  setupRace(1);
  enterScene('race');
  world.state = 'run'; world.goT = 0;
  world.autopilot = true;
  simulate(10);
  world.autopilot = false;
  const T = TRACK, L = T.L, p = world.player;
  const blocking = (k) => k === 'gate' || k === 'pillars' || k === 'rotor' || k === 'laser' || k === 'blocks' || k === 'ball';
  let best = null;
  for (const th of T.things) {
    if (th.kind !== 'curtain' && th.kind !== 'rotor' && th.kind !== 'laser') continue;
    let score = th.kind === 'curtain' ? 6 : 0, clear = true;
    for (const o of T.things) {
      const d = wrap(o.s - (th.s - 34), L);
      if (d < 33 && blocking(o.kind)) clear = false;
    }
    for (const z of T.zones) if (z.kind === 'lowg' && wrap(th.s - z.s0, L) < z.s1 - z.s0 + 40) score += 3;
    if (clear) score += 10;
    if (!best || score > best.score) best = { th, score };
  }
  const hz = best ? best.th : T.things.find((th) => blocking(th.kind));
  for (const th of T.things) { th.back = 0; if (th.blocks) for (const b of th.blocks) b.hp = 1; }
  world.t = world.goT + 71.2;
  const cu = hz.kind === 'rotor' ? hz.u : hz.kind === 'curtain' ? (hz.u0 < 0 ? 5 : -5) : 0, cv = hz.kind === 'rotor' ? hz.v : (hz.split || 7);
  if (hz.kind === 'rotor') {
    hz.jam = 2.4; hz.spun = Math.PI / 5; hz.decals = [];
    addDecal(hz, hz.u + 0.4, hz.v - 0.3, 1.4);
    addDecal(hz, hz.u + 3.6, hz.v + 1.2, 0.9);
  } else if (hz.kind === 'curtain') { hz.phase = wrap(-world.t + 0.3, hz.on + hz.off); }
  else { hz.phase = wrap(-world.t + 0.4, hz.period * 2); }
  // bring a cube row, a ring and a coin arc into the stretch before it
  T.things.filter((th) => th.kind === 'cube').slice(0, 3).forEach((cb, i) => Object.assign(cb, { s: hz.s - 9, u: clamp(cu + (i - 1) * 5.5, -10.5, 10.5), v: 11.8, gold: i === 2 }));
  T.things.filter((th) => th.kind === 'ring').slice(0, 1).forEach((rg) => Object.assign(rg, { s: hz.s - 6, u: clamp(cu + 6.5, -9.5, 9.5), v: clamp(cv - 3, 2.5, 11) }));
  T.things.filter((th) => th.kind === 'coin').slice(0, 5).forEach((cn, i) => Object.assign(cn, { s: hz.s - 19 + i * 3, u: clamp(cu + 2.5 - i * 1.2, -10.5, 10.5), v: clamp(cv + 1.2 - i * 0.6, 1.5, 12) }));
  T.zones.push({ kind: 'updraft', s0: hz.s - 26, s1: hz.s + 8, u0: cu - 9.5, u1: cu - 5.5, lift: 50 });
  p.dist = 2 * L + hz.s - 34; p.u = clamp(cu + 5.4, -10, 10); p.v = clamp(cv + 2.6, 2, 12); p.vu = -2; p.vv = 3;
  p.lap = 2; p.lapTimes = [33.9, 32.4]; p.lapStart = world.t - 4.9;
  p.speed = 66; p.boostT = 0; p.coins = 9; p.tank = 84; p.item = 'bomb'; p.shield = 6.5; p.autogun = 3.2; p.flapAnim = 1; p.stun = 0; p.invuln = 0; p.goop = 0; p.splats = [];
  world.score = 18620;
  const at = (idx) => world.racers.find((r) => r.idx === idx);
  const place = (idx, d, u, v, extra) => Object.assign(at(idx), { dist: p.dist + d, u: clamp(u, -10.5, 10.5), v: clamp(v, 1.2, 12.8), vu: 0, vv: 0, stun: 0, invuln: 0, goop: 0, shield: 0, splats: [], finished: false, flapAnim: 0 }, extra || {});
  // you lead: everyone in view ahead is a lap down
  const pickle = place(5, 24 - L, cu - 5.5, cv + 3.8, { flapAnim: 1 });
  place(6, 16 - L, p.u - 7.5, p.v - 3.2, { goop: 1.1, splats: [{ x: 0.15, y: -0.2, seed: 61, t: 3 }] });
  place(3, 44 - L, cu + 2, cv - 2.5, { shield: 5 });
  place(7, -14, p.u - 2, p.v);                                                                  // Count Crumb right behind you
  place(2, -40, 3, 6);
  place(4, -70, -4, 5);
  place(1, -95, 4, 5);
  // the AUTO-GOO stream: a line of globs hosing toward the pickle ahead
  world.globs = [];
  for (let i = 0; i < 6; i++) {
    const k = (i + 1) / 7;
    world.globs.push({ dist: p.dist + 3 + k * 20, u: lerp(p.u, pickle.u, k) + Math.sin(i * 2.1) * 0.4, v: lerp(p.v, pickle.v, k) + Math.cos(i * 1.7) * 0.3, vs: 230, vu: 0, vv: 0, owner: p, life: 0.6, big: false, r: CFG.globR, seed: 30 + i, hit: [] });
  }
  world.ents = [
    { kind: 'sock', dist: pickle.dist - 7, u: pickle.u + 1.6, v: pickle.v - 1.1, target: pickle, owner: at(4), hp: 2, life: 6, vu: 0, vv: 0 },
    { kind: 'balloon', dist: p.dist + 30, u: p.u - 3.6, v: p.v - 1.6, uu: p.u - 3.6, owner: at(6), hp: 1, life: 12, phase: 0.4 },
  ];
  world.parts = []; world.wind = []; world.barks = [];
  world.popups = [];
  for (const r of world.racers) syncCrossings(r);
  updatePlaces();
  world.lastPlace = p.place;
  world.camU = p.u + 0.4; world.camV = p.v + CFG.camUp - 0.3; world.camRoll = 0.03; world.camF = CFG.focal; world.camHz = CFG.horizon - 4;
  world.shake = 0; world.flash = 0;
  input.lastDevice = 'keys';
  applyCamera();
  updateAim(p, 1);
}


function poseResults() {
  startCup('cup');
  game.cup.race = 3;
  game.cup.pts = [37, 9, 28, 30, 12, 20, 15, 39];
  game.cup.score = 31200;
  setupRace(3);
  world.state = 'run'; world.autopilot = true;
  game.scene = 'race';
  simulate(6);
  const order = [0, 7, 3, 2, 5, 6, 4, 1];
  const times = [94.27, 94.61, 95.88, 97.02, 98.4, 99.15, 101.3, 103.72];
  const res = {
    trackIdx: 3, pos: 0, time: times[0], bestLap: 30.84, dnq: false,
    order: order.map((idx, i) => ({ idx, time: times[i], isPlayer: idx === game.racer, pts: CFG.points[i] })),
    lines: [['FINISH 1ST', 4000], ['SPLATS x9', 1700], ['ITEM HITS x3', 1000], ['SWOOPS x6', 200], ['COINS x10', 160], ['CLEAN LAPS x2', 600], ['RINGS, PASSES, STUNTS', 3690], ['FASTEST LAP!', 500]],
    raceScore: 11850, newBestRace: true, newBestLap: true,
  };
  order.forEach((idx, i) => { game.cup.pts[idx] += CFG.points[i]; });
  game.cup.score += res.raceScore;
  game.cup.lastWins = order;
  game.lastResults = res;
  enterScene('results');
  game.sceneT = 3;
}

function posePodium() {
  startCup('cup');
  game.cup.race = 4;
  game.cup.pts = [66, 11, 44, 52, 18, 30, 24, 61];
  game.cup.score = 52900;
  game.cup.lastWins = [0, 7, 3, 2, 5, 6, 4, 1];
  game.cup.splats = 31; game.cup.bestLap = 30.84; game.cup.tokens = 2;
  enterScene('podium');
  game.sceneT = 2.4;
}

function runShot(name) {
  reseed(SHOT_SEED);
  game.diff = 1; game.racer = 0; game.scheme = 'keys'; game.mirror = false;
  save.bestCup = 48250; save.trophies = { 'gloop:0': 1, 'gloop:1': 1, 'gloop:2': 2, 'regloop:0': 3 }; save.unlockedMirror = name !== 'podium';
  if (name === 'race') poseRace();
  else if (name === 'hazard') poseHazard();
  else if (name === 'results') poseResults();
  else if (name === 'podium') posePodium();
  else if (name === 'howto') { enterScene('title'); simulate(3); enterScene('howto'); }
  else if (name === 'select') { enterScene('title'); simulate(3); game.cupMode = 'cup'; enterScene('select'); game.racer = 7; game.sceneT = 0.6; }
  else if (name === 'gameover') { game.racer = 5; enterScene('gameover'); game.sceneT = 1; }
  else { enterScene('title'); simulate(7); game.menu.i = 0; game.sceneT = 1.2; }
  render();
}
