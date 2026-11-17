// GOO PRIX · src/ai.js — The other pilots' brains.
'use strict';

// ============================================================================================
// AI — rivals aim at the next window, flap with a reaction delay, shoot, use items, rubber-band
// ============================================================================================
function aiControl(r, dt) {
  const ai = r.ai;
  const ctl = { steer: 0, targetU: null, flap: false, dive: false };
  const T = TRACK;
  ai.noiseT -= dt;
  if (ai.noiseT <= 0) {
    ai.noiseT = rnd(0.8, 1.6);
    const spread = (1 - ai.skill) * 2.0 * (r.def.ai.sloppy ? 1.5 : 1) * (r.def.ai.precise ? 0.5 : 1);
    ai.noiseU = rnd(-1, 1) * spread * 1.4; ai.noiseV = rnd(-1, 1) * spread;
  }
  // look ahead for the next thing that blocks, and the next pickup worth a detour
  let aim = null, pickupAim = null;
  const n = T.things.length;
  let idx = r.ti, base = r.tBase;
  for (let k = 0; k < 14 && n; k++) {
    const th = T.things[idx];
    const ahead = base + th.s - r.dist;
    if (ahead > 110) break;
    const tArrive = world.t + ahead / Math.max(20, r.speed);
    if (!aim && ahead > -1) {
      if (th.kind === 'gate' || th.kind === 'pillars' || th.kind === 'blocks' || th.kind === 'ball' || th.kind === 'rotor' || th.kind === 'laser' || th.kind === 'curtain') {
        const a = thingAim(th, r.u, r.v, tArrive);
        if (a) aim = { u: a[0], v: a[1], ahead };
      }
    }
    if (!pickupAim && ahead > 3 && ahead < 45 && (th.kind === 'ring' || th.kind === 'cube' || th.kind === 'coin') && !(th.back > 0)) {
      if (th.kind !== 'cube' || !r.item) if (rnd(0, 1) < r.def.ai.greed * 0.06 + (th.kind === 'ring' && r.def.ai.precise ? 0.2 : 0)) pickupAim = { u: th.u, v: th.v, ahead };
    }
    idx++; if (idx >= n) { idx = 0; base += T.L; }
  }
  if (pickupAim) ai.pick = pickupAim;
  if (ai.pick && (ai.pick.ahead -= r.speed * dt) < 0) ai.pick = null;
  let tu, tv;
  if (aim && (!ai.pick || ai.pick.ahead > aim.ahead - 4)) { tu = aim.u; tv = aim.v; }
  else if (ai.pick) { tu = ai.pick.u; tv = ai.pick.v; }
  else { tu = lineUAt(r.dist + 25); tv = lineVAt(r.dist + 25); }
  if (r.def.ai.bully && !aim) { const p = world.player; if (Math.abs(gap(r.dist, p.dist)) < 10) { tu = p.u; tv = p.v; } }
  tu += ai.noiseU; tv += ai.noiseV * 0.7;
  tv = clamp(tv, 1.2, CFG.ceil - 1.2);
  const desired = clamp((tu - r.u) * 3.2, -CFG.latMax, CFG.latMax);
  ctl.steer = clamp((desired - r.vu) * 0.22, -1, 1);
  const want = r.v < tv - 0.45 && r.vv < 2.2;
  if (want) {
    ai.react -= dt;
    if (ai.react <= 0) { ctl.flap = true; ai.react = lerp(0.2, 0.06, ai.skill) * rnd(0.8, 1.2); }
  } else ai.react = Math.min(ai.react, lerp(0.2, 0.06, ai.skill));
  ctl.dive = r.v > tv + 3.2 && (!aim || aim.ahead > 18);
  // ---- shooting: anyone a little way ahead inside a narrow cone
  ai.shootT -= dt;
  if (ai.shootT <= 0 && world.state === 'run') {
    ai.shootT = 1 / (r.def.ai.aggr * 1.2 + 0.05) * rnd(0.6, 1.4);
    let best = null;
    for (const o of world.racers) {
      if (o === r) continue;
      const dd = gap(r.dist, o.dist);
      if (dd < 5 || dd > 45) continue;
      if (Math.abs(o.u - r.u) > dd * 0.07 + 1.2 || Math.abs(o.v - r.v) > dd * 0.07 + 1.2) continue;
      if (!best || dd < best.dd) best = { o, dd };
    }
    const nannyFirst = r.def.name === 'DAME CUSTARD' && !r.wasHit;
    if (best && r.tank >= CFG.shotCost && !nannyFirst) {
      if (!best.o.isPlayer || world.playerShotBudget > 0) {
        if (best.o.isPlayer) world.playerShotBudget -= 1;
        fireGlob(r, best.o.u + best.o.vu * 0.2, best.o.v, false);
      }
    }
  }
  // ---- items
  if (r.item) {
    ai.itemT -= dt;
    const lastLap = r.dist > (CFG.laps - 1) * T.L;
    if (ai.itemT <= 0 && (!r.def.ai.hoard || lastLap || r.item === 'bubble')) {
      ai.itemT = rnd(1, 3);
      const it = r.item;
      let use = true;
      if (it === 'bazooka') use = world.racers.some((o) => { const d = gap(r.dist, o.dist); return o !== r && d > 0 && d < 60; });
      if (it === 'sock') use = r.place > 0;
      if (it === 'autogun') use = world.racers.some((o) => { const d = gap(r.dist, o.dist); return o !== r && d > 0 && d < 60; });
      if (it === 'bomb') use = world.racers.filter((o) => o !== r && Math.abs(gap(r.dist, o.dist)) < 35).length >= 2;
      if (it === 'balloon') use = world.racers.some((o) => { const d = gap(r.dist, o.dist); return o !== r && d < 0 && d > -40; });
      if (use) useItem(r);
    }
  }
  return ctl;
}
