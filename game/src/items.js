// GOO PRIX · src/items.js — Jelly-cube items and their effects.
'use strict';

// ============================================================================================
// ITEMS — jelly-cube roulette (rank weighted), the eight items and their world entities
// ============================================================================================
const ITEMS = {
  burp: { name: 'TURBO BURP', glyph: 'B' }, bazooka: { name: 'GOO BAZOOKA', glyph: 'Z' }, sock: { name: 'HOMING SOCK', glyph: 'S' },
  balloon: { name: 'SLUDGE BALLOON', glyph: 'O' }, bubble: { name: 'BUBBLE WRAP', glyph: 'W' }, ghost: { name: 'GHOST PEPPER', glyph: 'G' },
  geyser: { name: 'GOO GEYSER', glyph: 'Y' }, sneeze: { name: 'MEGA SNEEZE', glyph: 'X' },
  autogun: { name: 'AUTO-GOO', glyph: 'A' }, bomb: { name: 'STUN BOMB', glyph: 'K' },
};
// Drop odds (%) by rank band: 1st, 2-3, 4-5, 6-8.
const ODDS = {
  balloon: [35, 20, 10, 5], bubble: [30, 20, 12, 8], geyser: [20, 15, 12, 10], burp: [10, 20, 22, 22],
  bazooka: [5, 15, 18, 15], sock: [0, 10, 16, 15], ghost: [0, 0, 8, 15], sneeze: [0, 0, 2, 10],
  autogun: [6, 12, 14, 14], bomb: [0, 6, 10, 12],
};
function startRoll(r, gold) {
  const place = Math.min(7, r.place + (gold ? 2 : 0));
  const band = place === 0 ? 0 : place <= 2 ? 1 : place <= 4 ? 2 : 3;
  const table = Object.keys(ODDS).map((k) => [k, ODDS[k][band]]).filter((row) => row[1] > 0);
  r.rollItem = weighted(table);
  r.roll = r.isPlayer ? 0.9 : 0.5;
  r.rollTick = 0;
}

function useItem(r) {
  const it = r.item;
  if (!it || r.roll > 0) return;
  r.item = null;
  const P = r.isPlayer;
  switch (it) {
    case 'burp':
      giveBoost(r, 1.6, 1.5);
      for (const o of world.racers) { const d = gap(r.dist, o.dist); if (o !== r && d < 0 && d > -4 && Math.abs(o.u - r.u) < 4) { o.speed *= 0.6; o.vv += 6; } }
      burst(r.dist - 1, r.u, r.v, 16, 'dust');
      if (P || near(r)) sfx.burp();
      if (P) popup('BUUURP!', 'big');
      break;
    case 'bazooka': {
      const tgt = aimTargetFor(r);
      fireGlob(r, tgt ? tgt.u : r.u, tgt ? tgt.v : r.v, true);
      if (P || near(r)) sfx.launch();
      break;
    }
    case 'sock': {
      const ahead = r.place > 0 ? world.order[r.place - 1] : null;   // the racer one place ahead in the race
      world.ents.push({ kind: 'sock', dist: r.dist + 2, u: r.u, v: r.v, target: ahead, owner: r, hp: 2, life: 9, vu: 0, vv: 0 });
      if (P || near(r)) sfx.launch();
      if (ahead && ahead.isPlayer) sfx.sock();
      break;
    }
    case 'balloon':
      world.ents.push({ kind: 'balloon', dist: r.dist - 3, u: r.u, v: r.v, owner: r, hp: 1, life: 20, phase: rnd(0, TAU) });
      if (P) sfx.pop();
      break;
    case 'bubble':
      r.shield = 8;
      if (P) { sfx.shield(); popup('BUBBLE WRAP!', 'small'); }
      break;
    case 'ghost':
      r.ghost = 3;
      if (P) { sfx.swoop(1); popup('GHOST PEPPER!', 'mid'); }
      break;
    case 'geyser':
      r.geyser = 6; r.tank = CFG.tank;
      if (P) { sfx.itemGet(); popup('GOO GEYSER!', 'mid'); }
      break;
    case 'sneeze':
      for (const o of world.racers) {
        if (o === r || o.dist < r.dist || o.dist - r.dist > 300) continue;
        o.vv += rnd(-1, 1) > 0 ? 9 : -9; o.vu += rnd(-8, 8);
        goopRacer(o, r, 1.2);
        if (P) addScore(r, 100, 'item');
      }
      if (P || world.player.dist > r.dist) { world.flash = 0.08; shake(16); sfx.sneeze(); }
      if (P) popup('AAAH-CHOO!', 'big');
      break;
    case 'autogun':
      // five seconds of free, automatic rapid fire at whoever is ahead
      r.autogun = 5; r.autoCd = 0;
      if (P) { sfx.itemGet(); popup('AUTO-GOO!', 'mid'); }
      break;
    case 'bomb': {
      // a shockwave: every other racer is stunned for a second (bubble wrap saves you)
      world.blasts.push({ dist: r.dist, u: r.u, v: r.v, t: 0 });
      for (const o of world.racers) {
        if (o === r) continue;
        if (o.shield > 0) { popShield(o); continue; }
        o.stun = Math.max(o.stun, 1); o.flapLock = Math.max(o.flapLock, 0.6);
        o.speed *= 0.55; o.vv += 4;
        if (o.isPlayer) { popup('STUNNED!', 'big'); world.playerHitCd = 1.5; }
      }
      if (P) { popup('STUN BOMB!', 'big'); addScore(r, 300, 'item'); }
      world.flash2 = 0.3;
      shake(P ? 16 : 10);
      sfx.bomb();
      break;
    }
  }
}

// AUTO-GOO: while it runs, the racer sprays a glob at its target every 0.09 s for free.
function updateAutogun(r, dt) {
  if (!(r.autogun > 0)) return;
  r.autogun -= dt; r.autoCd -= dt;
  if (r.autoCd > 0) return;
  r.autoCd = 0.09;
  const t = aimTargetFor(r);
  fireGlob(r, t ? t.u : r.u, t ? t.v : r.v + 0.4, false, rnd(-1.5, 1.5), true);
}

// Nearest rival ahead within a forward cone (used by auto-aim and the bazooka).
function aimTargetFor(r) {
  let best = null;
  for (const o of world.racers) {
    if (o === r) continue;
    const dd = gap(r.dist, o.dist);
    if (dd < 3 || dd > 70) continue;
    const off = Math.hypot(o.u - r.u, o.v - r.v);
    if (off > dd * 0.32 + 1.5) continue;
    const score = dd + off * 4;
    if (!best || score < best.score) best = { o, score };
  }
  if (!best) return null;
  const o = best.o;
  const tt = gap(r.dist, o.dist) / CFG.globSpeed;
  return { u: o.u + o.vu * tt, v: o.v + o.vv * tt * 0.5, o };
}

function updateEnts(dt) {
  for (const e of world.ents) {
    e.life -= dt;
    if (e.kind === 'sock') {
      const tg = e.target && !e.target.finished ? e.target : null;
      const sp = tg ? Math.max(tg.speed * 1.5, 80) : 90;
      e.dist += sp * dt;
      if (tg) {
        const d = gap(e.dist, tg.dist);
        if (d < -2) e.dist += (d + 2);   // never overshoot: the sock waits just behind its victim
        e.vu = damp(e.vu, (tg.u - e.u) * 4, 6, dt); e.vv = damp(e.vv, (tg.v - e.v) * 4, 6, dt);
        e.u += e.vu * dt; e.v += e.vv * dt;
        if (Math.abs(gap(e.dist, tg.dist)) < 1.6 && Math.abs(tg.u - e.u) < 1.6 && Math.abs(tg.v - e.v) < 1.6) {
          hitRacer(tg, e.owner, 'sock'); e.life = 0;
          burst(e.dist, e.u, e.v, 16, 'dust');
        }
      }
    } else if (e.kind === 'balloon') {
      e.phase += dt;
      e.uu = e.u + Math.sin(e.phase * 0.9) * 2;
      for (const o of world.racers) {
        if (o === e.owner && e.life > 19) continue;
        if (Math.abs(gap(e.dist, o.dist)) < 1.5 && Math.abs(o.u - e.uu) < 1.6 && Math.abs(o.v - e.v) < 1.6) {
          if (goopRacer(o, e.owner, 1.5, 0.5) && o.isPlayer) popup('SLUDGED!', 'mid');
          e.life = 0; burst(e.dist, e.uu, e.v, 18, 'goo');
          if (o.isPlayer || near(o)) sfx.pop();
          break;
        }
      }
    }
    if (e.hp <= 0) e.life = 0;
  }
  world.ents = world.ents.filter((e) => e.life > 0);
}

function drawEnt(c, e, dz) {
  projectDz(dz, e.kind === 'balloon' ? e.uu : e.u, e.v, PT);
  const k = PT.k, lvl = fogLevel(dz);
  if (e.kind === 'sock') {
    // a stinky sock with fly wings: an L shape and two flicking wing lines
    c.save(); c.translate(PT.x, PT.y);
    const s = Math.max(4, k * 0.9);
    c.strokeStyle = INK; c.fillStyle = col(WHT, dz); c.lineWidth = Math.max(2, s * 0.16);
    c.beginPath(); c.moveTo(-s * 0.3, -s); c.lineTo(s * 0.2, -s); c.lineTo(s * 0.2, s * 0.2); c.lineTo(s * 0.7, s * 0.2); c.lineTo(s * 0.7, s * 0.6); c.lineTo(-s * 0.3, s * 0.6); c.closePath(); c.fill(); c.stroke();
    const w = Math.sin(world.t * 60) * s * 0.4;
    c.beginPath(); c.moveTo(-s * 0.3, -s * 0.6); c.lineTo(-s * 1.0, -s * 0.9 - w); c.moveTo(s * 0.2, -s * 0.6); c.lineTo(s * 0.9, -s * 0.9 - w); c.stroke();
    c.fillStyle = GOO_C; c.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++) c.fillRect(-s * 0.5 + i * s * 0.4, -s * 1.5 - ((world.t * 2 + i * 0.3) % 1) * s, s * 0.12, s * 0.12);
    c.restore();
  } else {
    const r = Math.max(3, k * 1.2);
    gooBlob(c, PT.x, PT.y, r, 7, world.t * 0.5, '#000');
    c.strokeStyle = GOO_C; c.lineWidth = Math.max(1.5, r * 0.12); c.stroke();
    c.beginPath(); c.moveTo(PT.x, PT.y + r); c.lineTo(PT.x, PT.y + r * 1.8); c.strokeStyle = GREYS[lvl]; c.lineWidth = 1.5; c.stroke();
    gooBlob(c, PT.x - r * 0.3, PT.y - r * 0.3, r * 0.25, 2, world.t, '#fff');
  }
}
