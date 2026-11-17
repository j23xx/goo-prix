// GOO PRIX · src/play/flight.js — Flight physics: flap, dive, steer, boosts, bonks and goop.
'use strict';

// ============================================================================================
// RACER_PHYSICS — flap, dive, steer, boosts, bonks, goop, crossings and racer-vs-racer shoves
// ============================================================================================
let world = null;

// The goo tank's size: BOTTOMLESS BUCKET takes the player's from 100 to 160.
function tankMax(r) { return r && r.isPlayer && hasMix('bucket') ? 160 : CFG.tank; }
function makeRacer(defIndex, isPlayer, slot) {
  const def = RACERS[defIndex];
  const row = Math.floor(slot / 2), col = slot % 2;
  return {
    def, idx: defIndex, isPlayer, stats: statMul(def),
    dist: -10 - row * 6, u: col ? 3.2 : -3.2, v: 3 + (slot % 3) * 0.6, vu: 0, vv: 0, speed: 0,
    lap: 0, finished: false, finishTime: 0, place: slot, prevPlace: slot,
    stun: 0, flapLock: 0, invuln: 0, goop: 0, boostT: 0, boostMul: 1, shield: 0, ghost: 0, geyser: 0,
    coins: 0, tank: CFG.tank, shotCd: 0, item: null, roll: 0, rollItem: null, rollTick: 0, autogun: 0, autoCd: 0,
    diveT: 0, swoopReady: 0, swoopTier: 0, flapAnim: 0, flapBuf: 0, slipT: 0, slipAfter: 0,
    floorSlow: 0, onRail: false, splats: [], ti: 0, tBase: 0,
    lapStart: 0, lapTimes: [], bonks: 0, lapBonks: 0, hitsGiven: 0, itemHits: 0, overtakes: 0, swoops: 0, gatesClean: 0,
    stalled: 0,
    ai: { react: 0.1, noiseU: 0, noiseV: 0, noiseT: 0, shootT: rnd(0.5, 1.5), itemT: rnd(1, 3), skill: 0.7, aimT: 0 },
  };
}
function cruiseSpeed() { return world && world.level ? levelSpeed(world.level) : 60; }

function giveBoost(r, mul, time) {
  if (mul >= r.boostMul || r.boostT <= 0) { r.boostMul = mul; r.boostT = time; }
  else r.boostT = Math.max(r.boostT, time * 0.5);
  r.speed += cruiseSpeed() * (mul - 1) * 0.55;
}

function zoneAt(s, u, kind) {
  for (const z of TRACK.zones) {
    if (z.kind !== kind) continue;
    if (wrap(s - z.s0, TRACK.L) < z.s1 - z.s0 && (z.u0 == null || (u > z.u0 && u < z.u1))) return z;
  }
  return null;
}

function goopRacer(r, by, time, mul) {
  if (r.shield > 0) { popShield(r); return false; }
  const base = mul || CFG.goopMul;
  if (r.goop > 0) {
    // stacking: every extra splat while gooped adds time and slows them a little more
    r.goop = Math.min(CFG.goopMax, r.goop + 0.7);
    r.goopMul = Math.max(0.36, Math.min(r.goopMul || base, base) - 0.06);
  } else { r.goop = time; r.goopMul = base; }
  if (r.isPlayer) r.goopMul = Math.max(r.goopMul, CFG.goopPlayerMul);   // gentler on you: fair, not frustrating
  r.splats.push({ x: rnd(-0.5, 0.5), y: rnd(-0.5, 0.3), seed: rndInt(1, 9999), t: 4 });
  if (r.splats.length > 4) r.splats.shift();
  if (r.isPlayer) {
    windscreenGoo(rndInt(2, 3));
    sfx.splat();
  }
  return true;
}

function popShield(r) {
  r.shield = 0;
  r.invuln = Math.max(r.invuln, 0.4);
  burst(r.dist, r.u, r.v, 14, 'spark');
  // the pop shoves everyone close by
  for (const o of world.racers) if (o !== r && Math.abs(gap(r.dist, o.dist)) < 4 && Math.abs(o.u - r.u) < 4) { o.vu += Math.sign(o.u - r.u || 1) * 9; o.vv += 4; }
  if (r.isPlayer || near(r)) sfx.pop();
}

function near(r) { return !world.attract && Math.abs(gap(world.player.dist, r.dist)) < 40; }

function bonk(r, th) {
  if (r.invuln > 0 || r.ghost > 0) return;
  if (r.shield > 0) { popShield(r); return; }
  // a knock costs points: walls cost the most, red hazards a little less
  if (r.isPlayer) knock(th && (th.kind === 'gate' || th.kind === 'pillars' || th.kind === 'blocks') ? 'wall' : 'hazard', 'BONK');
  r.speed *= CFG.bonkMul;
  r.stun = CFG.stun; r.flapLock = CFG.flapLock; r.invuln = CFG.invuln;
  r.bonks++; r.lapBonks++;
  const lost = Math.min(3, r.coins);
  r.coins -= lost;
  burst(r.dist, r.u, r.v, 12, 'shard');
  for (let i = 0; i < lost; i++) burst(r.dist, r.u, r.v, 1, 'coin');
  // shunt to the nearest open point so the racer is never stuck behind a wall
  if (th) {
    const aim = th.kind === 'gate'
      ? [clamp(r.u, gateCentreU(th, world.t) - th.w / 2 + 1, gateCentreU(th, world.t) + th.w / 2 - 1), clamp(r.v, th.v - th.h / 2 + 1, th.v + th.h / 2 - 1)]
      : thingAim(th, r.u, r.v, world.t);
    if (aim) { r.u = lerp(r.u, aim[0], 0.85); r.v = lerp(r.v, aim[1], 0.85); r.vu *= 0.2; r.vv = 2; }
  }
  if (r.isPlayer) {
    shake(10); world.hitstop = 0.06; sfx.bonk();
    popup('BONK!', 'big');
    world.gateStreak = 0;
  } else if (near(r)) sfx.bonk();
}

function processCrossings(r) {
  const T = TRACK;
  const n = T.things.length;
  let guard = 0;
  while (n && r.dist >= r.tBase + T.things[r.ti].s && guard++ < 20) {
    crossThing(r, T.things[r.ti]);
    r.ti++;
    if (r.ti >= n) { r.ti = 0; r.tBase += T.L; }
  }
}

// After a racer is moved by hand (screenshot poses), point it at the next thing ahead again.
function syncCrossings(r) {
  const T = TRACK;
  r.tBase = Math.floor(r.dist / T.L) * T.L;
  r.ti = T.things.findIndex((th) => r.tBase + th.s > r.dist);
  if (r.ti < 0) { r.ti = 0; r.tBase += T.L; }
}

function crossThing(r, th) {
  const t = world.t;
  switch (th.kind) {
    case 'gate': case 'pillars': case 'blocks': case 'ball': case 'rotor': case 'laser': case 'curtain': {
      if (r.ghost > 0) break;
      const res = thingBlocks(th, r.u, r.v, t);
      if (res === 'bonk') bonk(r, th);
      else if (res === 'goop') { if (r.isPlayer && r.invuln <= 0) { knock('goop', 'GOOPED'); goopRacer(r, null, 1.5, 0.6); popup('GOOPED!', 'mid'); } }
      else if (r.isPlayer && (th.kind === 'gate' || th.kind === 'pillars' || th.kind === 'rotor' || th.kind === 'laser')) {
        world.gateStreak++; sfx.gate(world.gateStreak); r.gatesClean++;
        if (th.kind === 'gate') threadWindow(th, r.u, r.v);
      }
      break;
    }
    case 'ring':
      if ((r.u - th.u) ** 2 + (r.v - th.v) ** 2 < th.r * th.r) {
        giveBoost(r, CFG.ringMul, CFG.ringTime);
        if (r.isPlayer) { sfx.ring(); popup('BOOST!', 'small'); award(25); burst(r.dist + 2, th.u, th.v, 10, 'spark'); }
      }
      break;
    case 'cube':
      if (!(th.back > 0) && Math.abs(r.u - th.u) < 1.9 && Math.abs(r.v - th.v) < 1.9) {
        th.back = 4;
        if (!r.item && r.roll <= 0) startRoll(r, th.gold);
        burst(r.dist + 1, th.u, th.v, 8, 'spark');
      }
      break;
    case 'coin': {
      const magnet = r.geyser > 0 ? 4 : 1.4;
      if (!(th.back > 0) && Math.abs(r.u - th.u) < magnet && Math.abs(r.v - th.v) < magnet) {
        th.back = 6;
        r.coins = Math.min(99, r.coins + 1);
        if (r.isPlayer) { world.coinStreak++; sfx.coin(world.coinStreak); award(10); }
      }
      break;
    }
  }
}

function updateRacer(r, ctl, dt) {
  const st = r.stats;
  const s = wrap(r.dist, TRACK.L);
  r.stun = Math.max(0, r.stun - dt); r.flapLock = Math.max(0, r.flapLock - dt); r.invuln = Math.max(0, r.invuln - dt);
  r.goop = Math.max(0, r.goop - dt); r.boostT = Math.max(0, r.boostT - dt); r.shield = Math.max(0, r.shield - dt);
  r.ghost = Math.max(0, r.ghost - dt); r.geyser = Math.max(0, r.geyser - dt); r.floorSlow = Math.max(0, r.floorSlow - dt);
  r.slipAfter = Math.max(0, r.slipAfter - dt); r.swoopReady = Math.max(0, r.swoopReady - dt);
  r.flapAnim = Math.max(0, r.flapAnim - dt * 6); r.stalled = Math.max(0, r.stalled - dt);
  for (const sp of r.splats) sp.t -= dt;
  while (r.splats.length && r.splats[0].t <= 0) r.splats.shift();
  if (r.boostT <= 0) r.boostMul = 1;
  if (r.roll > 0) {
    r.roll -= dt;
    if (r.isPlayer) { r.rollTick -= dt; if (r.rollTick <= 0) { r.rollTick = 0.07; sfx.tick(); } }
    if (r.roll <= 0) { r.item = r.rollItem; r.rollItem = null; if (r.isPlayer) sfx.itemGet(); }
  }
  const finished = r.finished;
  const lowG = zoneAt(s, r.u, 'lowg');
  // ---- vertical: gravity, flap, dive and the swoop boost
  const diving = ctl.dive && r.stun <= 0;
  if (diving) {
    r.diveT += dt;
    if (r.isPlayer && (Math.abs(r.diveT - 0.35) < dt / 2 || Math.abs(r.diveT - 0.8) < dt / 2)) sfx.charge(r.diveT);
  } else {
    if (r.diveT >= CFG.swoopTiers[0][0]) { r.swoopReady = CFG.swoopWindow; r.swoopTier = r.diveT >= CFG.swoopTiers[1][0] ? 1 : 0; }
    r.diveT = 0;
  }
  // the level's twist bends the rules: gravity can flip, or vanish altogether (zero-G thrust)
  const twist = world.level && !world.attract ? world.level.twist : null;
  const zeroG = twist === 'zerog';
  const gs = world.gsign || 1;
  let g = CFG.gravity * (lowG ? 0.55 : 1) * (1 + clamp(cyDD(s) * r.speed * r.speed * 0.02, -0.1, 0.1));
  if (diving) g += CFG.diveG;
  if (zeroG) { r.vv += (ctl.thrust || 0) * 40 * dt; r.vv = damp(r.vv, 0, 1.4, dt); }
  else r.vv -= g * gs * dt;
  const up = zoneAt(s, r.u, 'updraft');
  if (up) r.vv += up.lift * dt;
  if (ctl.flap && !zeroG) r.flapBuf = CFG.flapBuffer;
  if (r.flapBuf > 0 && r.flapLock <= 0 && r.stalled <= 0) {
    r.vv = CFG.flapV * st.flap * (r.goop > 0 ? CFG.goopFlap : 1) * (lowG ? 0.8 : 1) * gs;
    r.flapBuf = 0; r.flapAnim = 1;
    if (r.swoopReady > 0) {
      const tier = CFG.swoopTiers[r.swoopTier];
      giveBoost(r, tier[1], tier[2]);
      r.swoopReady = 0; r.swoops++;
      if (r.isPlayer) { sfx.swoop(r.swoopTier); popup(r.swoopTier ? 'MEGA SWOOP!' : 'SWOOP!', r.swoopTier ? 'mid' : 'small'); award(r.swoopTier ? 50 : 25); }
    }
    if (r.isPlayer) sfx.flap(1 + (r.idx - 3) * 0.04);
  }
  r.flapBuf -= dt;
  const fall = diving ? CFG.diveMaxFall : CFG.maxFall;
  r.vv = gs > 0 ? Math.max(r.vv, -fall) : Math.min(r.vv, fall);
  if (zeroG) r.vv = clamp(r.vv, -14, 14);
  r.v += r.vv * dt;
  const lo = 0.7, hi = CFG.ceil - 0.7;
  if (r.v < lo) {
    r.v = lo;
    if (r.vv < 0) { r.vv = gs > 0 && !zeroG ? 7 : 2; r.floorSlow = 0.3; if (r.isPlayer) { burst(r.dist + 1.5, r.u, 0.2, 6, 'dust'); sfx.scrape(); } }
  }
  if (r.v > hi) { r.v = hi; if (r.vv > 0) { r.vv = gs < 0 && !zeroG ? -7 : -3; r.speed *= 0.95; } }
  // ---- lateral: steering, curve push, crosswind and the side rails
  let steer = 0;
  if (r.stun <= 0) {
    if (ctl.targetU != null) steer = clamp((ctl.targetU - r.u) * 0.55 - r.vu * 0.07, -1, 1);
    else steer = ctl.steer || 0;
  }
  if (steer) r.vu += steer * CFG.latAccel * st.steer * dt;
  else r.vu = damp(r.vu, 0, twist === 'whiteout' ? 2.5 : CFG.latDamp, dt);   // White-Out: steering slides
  if (world.sideT > 0) r.vu += world.sideDir * 22 * dt;                       // the lamp tips sideways
  r.vu += clamp(-cxDD(s) * r.speed * r.speed * 0.5, -CFG.curvePushMax, CFG.curvePushMax) * dt;
  const wind = zoneAt(s, r.u, 'wind');
  if (wind) r.vu += wind.dir * wind.accel * dt;
  r.vu = clamp(r.vu, -CFG.latMax, CFG.latMax);
  r.u += r.vu * dt;
  const edge = CFG.halfW - 0.7;
  if (Math.abs(r.u) > edge) {
    r.u = Math.sign(r.u) * edge;
    r.vu *= -0.4;
    if (!r.onRail) { r.speed *= 0.9; if (r.isPlayer) { sfx.scrape(); burst(r.dist + 1.5, r.u, r.v, 4, 'spark'); } }
    r.onRail = true;
  } else r.onRail = false;
  // ---- forward speed
  let target = cruiseSpeed() * st.spd * (1 + 0.01 * Math.min(r.coins, 10));
  if (r.boostT > 0) target *= r.boostMul;
  if (r.ghost > 0) target *= 1.3;
  if (r.goop > 0) target *= r.goopMul || CFG.goopMul;
  if (r.floorSlow > 0) target *= 0.8;
  if (r.slipAfter > 0) target *= CFG.slipMul;
  if (r.stun > 0) target *= 0.5;
  if (finished) target = cruiseSpeed() * 0.85;
  if (world.state === 'countdown') target = 0;
  r.speed = r.speed < target ? Math.min(target, r.speed + CFG.accel * dt * (r.boostT > 0 ? 2.5 : 1)) : Math.max(target, r.speed - CFG.decel * dt);
  r.dist += r.speed * dt;
  processCrossings(r);
  // ---- goo tank and the auto-gun
  r.tank = Math.min(tankMax(r), r.tank + CFG.tankRegen * st.goo * (world.boss ? 1.6 : 1) * (r.isPlayer && hasMix('bucket') ? 1.3 : 1) * dt);   // the boss fight runs hot
  r.shotCd = Math.max(0, r.shotCd - dt);
  if (world.state === 'run') updateAutogun(r, dt);
}

function rubberBand(r) {
  const p = world.player;
  const d = p.dist - r.dist;
  const nem = r.nemesis ? 1.5 : 1;
  if (d > 0) return 1 + Math.min(d / 300, 1) * CFG.rubberBehind[game.diff] * nem;
  const lastLap = p.dist > (CFG.laps - 1) * TRACK.L;
  return 1 - Math.min(-d / 250, 1) * CFG.rubberAhead[game.diff] * nem * (lastLap ? 0.5 : 1);
}

// Slipstream and racer-vs-racer shoves (weighted by the Weight stat).
function racerInteractions(dt) {
  const rs = world.racers;
  for (const a of rs) {
    let drafting = false;
    for (const b of rs) {
      if (a === b) continue;
      const dd = gap(a.dist, b.dist);
      if (dd > 4 && dd < 18 && Math.abs(b.u - a.u) < 1.5 && Math.abs(b.v - a.v) < 1.2) drafting = true;
    }
    a.slipT = drafting ? a.slipT + dt : 0;
    if (a.slipT > 0.8) { if (a.slipAfter <= 0 && a.isPlayer) popup('SLIPSTREAM!', 'small'); a.slipAfter = 0.5; }
  }
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    const a = rs[i], b = rs[j];
    if (Math.abs(gap(a.dist, b.dist)) > 1.4) continue;
    const du = b.u - a.u, dv = b.v - a.v;
    if (Math.abs(du) < 1.4 && Math.abs(dv) < 1.1) {
      const wa = a.stats.wt, wb = b.stats.wt;
      const pushA = wb / (wa + wb), pushB = wa / (wa + wb);
      const sgn = du === 0 ? (i % 2 ? 1 : -1) : Math.sign(du);
      a.vu -= sgn * 10 * pushA; b.vu += sgn * 10 * pushB;
      a.u -= sgn * 0.08; b.u += sgn * 0.08;
      if ((a.isPlayer || b.isPlayer) && world.bumpCd <= 0) { sfx.scrape(); world.bumpCd = 0.3; shake(3); }
    }
  }
}
