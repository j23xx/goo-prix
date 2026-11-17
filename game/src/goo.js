// GOO PRIX · src/goo.js — Goo globs in flight, hits and wall splats.
'use strict';

// ============================================================================================
// GOO — globs in flight, hits on racers, splat decals on walls, jams, block bursts
// ============================================================================================
// Fire from racer r toward the point (aimU, aimV) ~60 u ahead; big = Goo Bazooka.
function fireGlob(r, aimU, aimV, big, spreadU, free) {
  if (!big && r.geyser <= 0 && !free) {
    if (r.tank < CFG.shotCost || r.shotCd > 0) return false;
    r.tank -= CFG.shotCost;
  }
  if (!free) r.shotCd = CFG.shotCd;
  const sp = big ? 200 : CFG.globSpeed;
  const D = 60;
  const tt = D / sp;
  const g = {
    dist: r.dist + 1.5, u: r.u, v: r.v + 0.2, vs: r.speed + sp,
    vu: (aimU - r.u) / tt + (spreadU || 0), vv: (aimV - r.v) / tt + 0.5 * CFG.globGrav * tt,
    owner: r, life: big ? 1.2 : CFG.globLife, big, r: big ? 1.5 : CFG.globR, seed: rndInt(1, 9999), hit: [],
  };
  world.globs.push(g);
  if (r.isPlayer) sfx.shoot();
  return true;
}

function updateGlobs(dt) {
  const T = TRACK;
  for (const g of world.globs) {
    const prev = g.dist;
    g.dist += g.vs * dt; g.u += g.vu * dt; g.v += g.vv * dt; g.vv -= CFG.globGrav * dt;
    g.life -= dt;
    if (g.v < 0) { g.life = 0; burst(g.dist, g.u, 0.1, 5, 'goo'); continue; }
    if (Math.abs(g.u) > CFG.halfW) { g.life = 0; burst(g.dist, clamp(g.u, -CFG.halfW, CFG.halfW), g.v, 5, 'goo'); continue; }
    // racers
    for (const o of world.racers) {
      if (o === g.owner || g.hit.includes(o)) continue;
      const reach = g.big ? 2.4 : 1.6;
      if (Math.abs(gap(g.dist, o.dist)) < reach + g.vs * dt * 0.5 && Math.abs(o.u - g.u) < reach && Math.abs(o.v - g.v) < reach) {
        g.hit.push(o);
        hitRacer(o, g.owner, g.big ? 'bazooka' : 'goo');
        if (!g.big) { g.life = 0; break; }
      }
    }
    if (g.life <= 0) continue;
    // sock and balloon entities can be shot down
    for (const e of world.ents) {
      if (e.owner === g.owner && e.kind === 'sock') continue;
      if (Math.abs(gap(g.dist, e.dist)) < 1.5 + g.vs * dt && Math.abs(e.u - g.u) < 1.4 && Math.abs(e.v - g.v) < 1.4) {
        e.hp--; if (!g.big) g.life = 0;
        burst(e.dist, e.u, e.v, 8, 'goo');
        if (g.owner.isPlayer) { sfx.wallSplat(); if (e.hp <= 0) popup(e.kind === 'sock' ? 'SOCK DOWN!' : 'POP!', 'small'); }
      }
    }
    if (g.life <= 0) continue;
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
            if (g.owner.isPlayer) { sfx.coin(5); popup('+1 COIN', 'small'); addScore(g.owner, 30, 'coin'); }
            if (!g.big) g.life = 0;
          }
        }
        if (g.life <= 0) break;
        continue;
      }
      if (th.kind === 'gate' || th.kind === 'pillars' || th.kind === 'rotor' || th.kind === 'ball') {
        if (thingBlocks(th, g.u, g.v, world.t) === 'bonk') {
          addDecal(th, g.u, g.v, g.big ? 1.6 : 0.9);
          if (th.kind === 'rotor') { th.jam = 3; if (g.owner.isPlayer) popup('JAMMED!', 'small'); }
          if (g.owner.isPlayer && relDz(th.s) < 80) sfx.wallSplat();
          burst(g.dist, g.u, g.v, 6, 'goo');
          g.life = 0; break;
        }
      }
    }
  }
  world.globs = world.globs.filter((g) => g.life > 0);
  if (world.globs.length > 60) world.globs.splice(0, world.globs.length - 60);
}

function addDecal(th, u, v, r) {
  th.decals.push({ u, v, r: r * rnd(0.8, 1.25), seed: rndInt(1, 99999) });
  world.decalList.push(th);
  if (world.decalList.length > 80) { const old = world.decalList.shift(); old.decals.shift(); }
}

function hitRacer(o, by, kind) {
  if (o.isPlayer && world.playerHitCd > 0 && !by.isPlayer) return;
  if (o.shield > 0) { popShield(o); return; }
  if (kind === 'bazooka') { o.stun = Math.max(o.stun, 0.8); o.speed *= 0.6; }
  if (kind === 'sock') { o.stun = Math.max(o.stun, 1.2); o.speed *= 0.5; }
  if (kind === 'goo' && !o.isPlayer) { o.speed *= 0.72; o.vv = Math.min(o.vv, -3); }   // the splat knocks them back and down
  goopRacer(o, by, kind === 'goo' ? CFG.goopTime : 2);
  o.wasHit = true;
  burst(o.dist, o.u, o.v, kind === 'goo' ? 10 : 22, 'goo');
  if (o.isPlayer) {
    world.playerHitCd = 1.5;
    shake(kind === 'goo' ? 5 : 12);
    if (kind !== 'goo') popup(kind === 'sock' ? 'SOCKED!' : 'BAZOOKA\'D!', 'big');
    if (kind !== 'goo') world.flash = 0.06;
  }
  if (by && by.isPlayer) {
    by.hitsGiven++;
    if (kind !== 'goo') by.itemHits++;
    const now = world.t;
    world.combo = now - world.comboT < 2 ? Math.min(5, world.combo + 1) : 1;
    world.comboT = now;
    const pts = (kind === 'goo' ? 100 : 250) * world.combo;
    addScore(by, pts, kind === 'goo' ? 'splat' : 'item');
    const words = ['SPLAT!', 'SPLAT x2!', 'SPLAT x3!', 'SPLAT x4!', 'SPLAT x5!'];
    worldPopup(words[world.combo - 1] + ' +' + pts, o.dist, o.u, o.v + 1.8);
    sfx.splat();
    if (o.def.bark && rand() < 0.35) bark(o, o.def.bark);
  } else if (near(o)) sfx.wallSplat();
}
