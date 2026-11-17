// GOO PRIX · src/play/items.js — Jelly-cube items and their effects on the targets.
'use strict';

// ============================================================================================
// ITEMS — the jelly-cube roulette and the nine items: weapons aim at targets, the rest help you
// ============================================================================================
const ITEMS = {
  burp: { name: 'TURBO BURP', glyph: 'B' }, bazooka: { name: 'GOO BAZOOKA', glyph: 'Z' }, sock: { name: 'HOMING SOCK', glyph: 'S' },
  bubble: { name: 'BUBBLE WRAP', glyph: 'W' }, ghost: { name: 'GHOST PEPPER', glyph: 'G' }, geyser: { name: 'GOO GEYSER', glyph: 'Y' },
  sneeze: { name: 'MEGA SNEEZE', glyph: 'X' }, autogun: { name: 'AUTO-GOO', glyph: 'A' }, bomb: { name: 'STUN BOMB', glyph: 'K' },
};
// Roll weights; the gold cube leaves out the two least exciting.
const ODDS = { burp: 10, bazooka: 14, sock: 12, bubble: 12, ghost: 8, geyser: 12, sneeze: 7, autogun: 14, bomb: 11 };
function startRoll(r, gold) {
  const table = Object.keys(ODDS).filter((k) => !gold || (k !== 'burp' && k !== 'bubble')).map((k) => [k, ODDS[k]]);
  r.rollItem = weighted(table);
  r.roll = r.isPlayer ? 0.9 : 0.4;
  r.rollTick = 0;
}

function useItem(r) {
  const it = r.item;
  if (!it || r.roll > 0) return;
  r.item = null;
  const P = r.isPlayer && !world.attract;
  const p = world.player;
  switch (it) {
    case 'burp':
      giveBoost(r, 1.6, 1.5);
      burst(r.dist - 1, r.u, r.v, 16, 'dust');
      if (P) { sfx.burp(); popup('BUUURP!', 'big'); say('Burp!', 1); }
      break;
    case 'bazooka': {
      const tg = aimTargetFor(r);
      fireGlob(r, tg ? tg.u : r.u, tg ? tg.v : r.v, true);
      if (P) { sfx.launch(); say('Bazooka!', 1); }
      break;
    }
    case 'sock':
      world.ents.push({ kind: 'sock', dist: r.dist + 2, u: r.u, v: r.v, target: null, owner: r, hp: 3, life: 8, vu: 0, vv: 0, hits: 3 });
      if (P) { sfx.launch(); popup('HOMING SOCK!', 'small'); }
      break;
    case 'bubble':
      r.shield = 10;
      if (P) { sfx.shield(); popup('BUBBLE WRAP!', 'small'); }
      break;
    case 'ghost':
      r.ghost = 4;
      if (P) { sfx.swoop(1); popup('GHOST PEPPER!', 'mid'); }
      break;
    case 'geyser':
      r.geyser = 6; r.tank = tankMax(r);
      if (P) { sfx.itemGet(); popup('GOO GEYSER!', 'mid'); }
      break;
    case 'sneeze': {
      // everything ahead within 120 u takes two hits
      for (const tg of world.targets) { const d = gap(p.dist, tg.dist); if (d > 0 && d < 120) hitTarget(tg, 2, null); }
      if (world.boss) bossDamage(6, null);
      world.flash = 0.08; shake(16);
      if (P) { sfx.sneeze(); popup('AAAH-CHOO!', 'big'); say('Ah choo!', 2); }
      break;
    }
    case 'autogun':
      r.autogun = 5; r.autoCd = 0;
      if (P) { sfx.itemGet(); popup('AUTO-GOO!', 'mid'); say('Auto goo!', 2); }
      break;
    case 'bomb': {
      // the stun bomb: a shockwave that knocks three hits off everything near, and stuns the boss
      world.blasts.push({ dist: r.dist, u: r.u, v: r.v, t: 0 });
      for (const tg of world.targets) { const d = gap(p.dist, tg.dist); if (d > -10 && d < 80) hitTarget(tg, 3, null); }
      world.bolts.length = 0;
      if (world.boss) { world.boss.stun = 2; bossDamage(5, null); }
      world.flash2 = 0.3; shake(16); sfx.bomb();
      if (P) { popup('STUN BOMB!', 'big'); say('Kaboom!', 2); }
      break;
    }
  }
}

// AUTO-GOO: while it runs, the craft sprays a glob at its target every 0.09 s for free.
function updateAutogun(r, dt) {
  if (!(r.autogun > 0)) return;
  r.autogun -= dt; r.autoCd -= dt;
  if (r.autoCd > 0) return;
  r.autoCd = 0.09;
  const t = aimTargetFor(r);
  fireGlob(r, t ? t.u : r.u, t ? t.v : r.v + 0.4, false, rnd(-1.5, 1.5), true);
}

// The auto-aim: the best target inside a ~10 degree forward cone (or the boss's best weak point).
function aimTargetFor(r) {
  let best = null;
  if (r.isPlayer) {
    // a bolt about to hit you is the most urgent target of all: goo knocks it out of the air
    for (const b of world.bolts) {
      const dd = gap(r.dist, b.dist);
      if (b.life <= 0 || dd < 8 || dd > 34 || Math.abs(b.u - r.u) > 4 || Math.abs(b.v - r.v) > 4) continue;
      if (!best || dd < best.dd) best = { b, dd };
    }
    if (best) return { u: best.b.u + best.b.vu * best.dd / CFG.globSpeed, v: best.b.v, dist: best.b.dist };
  }
  for (const o of world.targets) {
    if (o.dead) continue;
    const dd = gap(r.dist, o.dist);
    if (dd < 3 || dd > 95) continue;
    const off = Math.hypot(o.u - r.u, o.v - r.v);
    if (off > dd * 0.2 + 2) continue;
    const score = dd + off * 3 - (o.cls === 'goldie' ? 30 : 0) - (o.cls === 'ace' ? 10 : 0);
    if (!best || score < best.score) best = { o, score };
  }
  if (!best && world.boss) {
    const bp = bossAimPoint();
    if (bp) return bp;
  }
  if (!best) return null;
  const o = best.o;
  const tt = gap(r.dist, o.dist) / CFG.globSpeed;
  return { u: o.u + (o.cls === 'zipper' ? Math.cos(world.t * 3 + o.ph) * 18 * tt : 0), v: o.v, o };
}

function updateEnts(dt) {
  for (const e of world.ents) {
    e.life -= dt;
    if (e.kind === 'sock') {
      // a homing sock: picks the nearest live target ahead and chews through three of them
      if (!e.target || e.target.dead) {
        let best = null;
        for (const o of world.targets) { const d = gap(e.dist, o.dist); if (!o.dead && d > 0 && d < 120 && (!best || d < best.d)) best = { o, d }; }
        e.target = best ? best.o : null;
      }
      const tg = e.target;
      e.dist += (tg ? 110 : 80) * dt;
      if (tg) {
        e.vu = damp(e.vu, (tg.u - e.u) * 5, 6, dt); e.vv = damp(e.vv, (tg.v - e.v) * 5, 6, dt);
        e.u += e.vu * dt; e.v += e.vv * dt;
        if (Math.abs(gap(e.dist, tg.dist)) < tg.r + 0.8 && Math.abs(tg.u - e.u) < tg.r + 0.8 && Math.abs(tg.v - e.v) < tg.r + 0.8) {
          hitTarget(tg, 3, null); burst(e.dist, e.u, e.v, 12, 'dust');
          e.hits--; e.target = null;
          if (e.hits <= 0) e.life = 0;
        }
      } else if (world.boss) {
        const bp = bossAimPoint();
        if (bp) { e.u = damp(e.u, bp.u, 3, dt); e.v = damp(e.v, bp.v, 3, dt); if (gap(e.dist, world.boss.dist) < 1) { bossDamage(4, null); e.life = 0; } }
      }
    }
    if (e.hp <= 0) e.life = 0;
  }
  world.ents = world.ents.filter((e) => e.life > 0);
}

function drawEnt(c, e, dz) {
  projectDz(dz, e.u, e.v, PT);
  const k = PT.k;
  if (e.kind === 'sock') {
    // a stinky sock with fly wings
    c.save(); c.translate(PT.x, PT.y);
    const s = Math.max(4, k * 0.9);
    c.strokeStyle = INK; c.fillStyle = col(WHT, dz); c.lineWidth = Math.max(2, s * 0.16);
    c.beginPath(); c.moveTo(-s * 0.3, -s); c.lineTo(s * 0.2, -s); c.lineTo(s * 0.2, s * 0.2); c.lineTo(s * 0.7, s * 0.2); c.lineTo(s * 0.7, s * 0.6); c.lineTo(-s * 0.3, s * 0.6); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = RED; c.fillRect(-s * 0.3, -s * 0.75, s * 0.5, s * 0.14);
    const w = Math.sin(world.t * 60) * s * 0.4;
    c.beginPath(); c.moveTo(-s * 0.3, -s * 0.6); c.lineTo(-s * 1.0, -s * 0.9 - w); c.moveTo(s * 0.2, -s * 0.6); c.lineTo(s * 0.9, -s * 0.9 - w); c.stroke();
    c.fillStyle = GOO_C; c.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++) c.fillRect(-s * 0.5 + i * s * 0.4, -s * 1.5 - ((world.t * 2 + i * 0.3) % 1) * s, s * 0.12, s * 0.12);
    c.restore();
  }
}
