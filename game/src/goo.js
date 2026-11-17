// GOO PRIX · src/goo.js — Goo globs in flight: hits on targets, bolts and the boss, and wall splats.
'use strict';

// ============================================================================================
// GOO — globs in flight, hits on targets, shooting down bolts, splat decals that run, jams
// ============================================================================================
// Fire from craft r toward the point (aimU, aimV) about 60 u ahead. big = Goo Bazooka; free = no
// tank cost (auto-gun, geyser); opts: beat (an on-beat fat shot), homing target, lock bonus.
function fireGlob(r, aimU, aimV, big, spreadU, free, opts) {
  if (!big && r.geyser <= 0 && !free) {
    if (r.tank < CFG.shotCost || r.shotCd > 0) return false;
    r.tank -= CFG.shotCost;
  }
  if (!free) r.shotCd = CFG.shotCd;
  const o = opts || {};
  const sp = big ? 200 : CFG.globSpeed;
  const D = 60;
  const tt = D / sp;
  const g = {
    dist: r.dist + 1.5, u: r.u, v: r.v + 0.2, vs: r.speed + sp,
    vu: (aimU - r.u) / tt + (spreadU || 0), vv: (aimV - r.v) / tt + 0.5 * CFG.globGrav * tt,
    owner: r, life: big ? 1.2 : CFG.globLife + (o.homing ? 0.6 : 0), big, r: big ? 1.5 : o.beat ? 0.85 : CFG.globR,
    seed: rndInt(1, 9999), hit: [], beat: !!o.beat, homing: o.homing || null, lockBonus: o.lockBonus || 0, dmg: big ? 3 : o.beat ? 2 : 1,
  };
  world.globs.push(g);
  if (r.isPlayer && !world.attract) { world.shots++; sfx.shoot(); }
  return true;
}

function updateGlobs(dt) {
  const T = TRACK;
  for (const g of world.globs) {
    const prev = g.dist;
    if (g.homing && !g.homing.dead) {
      // a locked-on glob curves onto its target
      const tg = g.homing, tt = Math.max(0.05, gap(g.dist, tg.dist) / Math.max(30, g.vs - world.player.speed * 0.2));
      g.vu = damp(g.vu, (tg.u - g.u) / tt, 10, dt); g.vv = damp(g.vv, (tg.v - g.v) / tt, 10, dt);
    }
    g.dist += g.vs * dt; g.u += g.vu * dt; g.v += g.vv * dt; if (!g.homing) g.vv -= CFG.globGrav * dt;
    g.life -= dt;
    if (g.v < 0 || g.v > CFG.ceil + 1) { g.life = 0; burst(g.dist, g.u, clamp(g.v, 0.1, CFG.ceil), 5, 'goo'); continue; }
    if (Math.abs(g.u) > CFG.halfW) { g.life = 0; burst(g.dist, clamp(g.u, -CFG.halfW, CFG.halfW), g.v, 5, 'goo'); continue; }
    // targets
    for (const tg of world.targets) {
      if (tg.dead || g.hit.includes(tg)) continue;
      const reach = (g.big ? 1.2 : 0.55) + tg.r;
      if (Math.abs(gap(g.dist, tg.dist)) < reach + g.vs * dt * 0.5 && Math.abs(tg.u - g.u) < reach && Math.abs(tg.v - g.v) < reach) {
        g.hit.push(tg);
        hitTarget(tg, g.dmg, g);
        if (!g.big) { g.life = 0; break; }
      }
    }
    if (g.life <= 0) continue;
    // goo knocks enemy bolts out of the air
    for (const b of world.bolts) {
      if (b.life > 0 && Math.abs(gap(g.dist, b.dist)) < 1.4 + g.vs * dt && Math.abs(b.u - g.u) < 1.2 && Math.abs(b.v - g.v) < 1.2) {
        b.life = 0; burst(b.dist, b.u, b.v, 6, 'spark'); award(25);
        if (!g.big) { g.life = 0; break; }
      }
    }
    if (g.life <= 0) continue;
    // the boss
    if (world.boss && bossCatch(g)) { g.life = 0; continue; }
    // world things crossed this frame
    const sPrev = wrap(prev, T.L), step = g.dist - prev;
    for (const th of T.things) {
      const ahead = wrap(th.s - sPrev, T.L);
      if (ahead > step) continue;
      if (th.kind === 'blocks') {
        for (const b of th.blocks) {
          if (b.hp > 0 && Math.abs(g.u - b.u) < 1.2 && Math.abs(g.v - b.v) < 1.2) {
            b.hp = 0;
            burst(g.dist, b.u, b.v, 10, 'shard');
            g.owner.coins = Math.min(99, g.owner.coins + 1);
            if (g.owner.isPlayer) { sfx.coin(5); award(75, 'BLOCK'); }
            if (!g.big) g.life = 0;
          }
        }
        if (g.life <= 0) break;
        continue;
      }
      if (th.kind === 'gate' || th.kind === 'pillars' || th.kind === 'rotor' || th.kind === 'ball') {
        if (thingBlocks(th, g.u, g.v, world.t) === 'bonk') {
          addDecal(th, g.u, g.v, g.big ? 1.6 : 0.9);
          if (th.kind === 'rotor' && !(th.jam > 0)) { th.jam = 3; if (g.owner.isPlayer) { popup('JAMMED!', 'small'); award(75, 'JAM'); } }
          if (g.owner.isPlayer && relDz(th.s) < 80) sfx.wallSplat();
          burst(g.dist, g.u, g.v, 6, 'goo');
          g.life = 0; break;
        }
      }
    }
  }
  world.globs = world.globs.filter((g) => g.life > 0);
  if (world.globs.length > 80) world.globs.splice(0, world.globs.length - 80);
}

// A splat left on a wall, pillar or spinner; it remembers when it landed so its drips can run.
function addDecal(th, u, v, r) {
  th.decals.push({ u, v, r: r * rnd(0.8, 1.25), seed: rndInt(1, 99999), t0: world.t });
  world.decalList.push(th);
  if (world.decalList.length > 80) { const old = world.decalList.shift(); old.decals.shift(); }
}
