// GOO PRIX · src/controls.js — The player's keyboard controls, auto-aim, on-beat shots and lock-on.
'use strict';

// ============================================================================================
// CONTROLS — ↑ flap, ← → steer, ↓ dive, SPACE shoot (auto-aim), X item; each level may bend them
// ============================================================================================
function flapKeyHit() { return keyHit('ArrowUp', 'KeyW'); }

function unproject(dz, x, y) {
  const S = slabAt(dz);
  const det = S.ax * S.by - S.bx * S.ay;
  const dx = x - S.ox, dy = y - S.oy;
  return { u: (dx * S.by - S.bx * dy) / det, v: (S.ax * dy - dx * S.ay) / det };
}

function playerControl(p, dt) {
  if (p.finished) return aiControl(p, dt);
  const twist = world.level.twist;
  const ctl = { steer: 0, targetU: null, flap: false, dive: false, thrust: 0 };
  ctl.steer = (keyDown('ArrowRight', 'KeyD') ? 1 : 0) - (keyDown('ArrowLeft', 'KeyA') ? 1 : 0);
  if (twist === 'zerog') {
    // Lock 'n' Slop: no gravity, ↑ and ↓ are direct thrust
    ctl.thrust = (keyDown('ArrowUp', 'KeyW') ? 1 : 0) - (keyDown('ArrowDown', 'KeyS') ? 1 : 0);
  } else {
    ctl.flap = keyHit('ArrowUp', 'KeyW');
    ctl.dive = keyDown('ArrowDown', 'KeyS');
  }
  updateAim(p, dt);
  if (twist === 'zerog') lockOn(p, dt);
  else if (keyDown('Space') && p.shotCd <= 0) {
    const a = world.aim.lock ? world.aim : { u: p.u, v: p.v + 0.6 };
    // Beat Drop: a shot fired on the beat is fat and scores double
    const beat = twist === 'rhythm' && beatOffset() < 0.09;
    shootAt(p, a, beat);
  }
  if (keyHit('KeyX', 'ShiftLeft', 'ShiftRight', 'KeyE')) useItem(p);
  return ctl;
}

// One trigger pull: a single glob, or three in a fan while the Goo Geyser runs.
function shootAt(r, a, beat) {
  if (r.geyser > 0) for (const sp of [-6, 0, 6]) fireGlob(r, a.u, a.v, false, sp);
  else fireGlob(r, a.u, a.v, false, 0, false, beat ? { beat: true } : null);
  if (beat && r.isPlayer) { world.beatFlash = 0.15; if ((world.onBeatStreak || 0) > 0 && world.onBeatStreak % 6 === 5) say('On the beat!', 1); }
}

// Lock 'n' Slop: hold SPACE to paint up to six locks, let go to fire a homing volley (+50% a lock).
function lockOn(p, dt) {
  const w = world;
  w.locks = w.locks.filter((t) => !t.dead);
  if (keyDown('Space')) {
    w.lockCd -= dt;
    if (w.lockCd <= 0 && w.locks.length < 6) {
      let best = null;
      for (const o of w.targets) {
        if (o.dead || w.locks.includes(o)) continue;
        const dd = gap(p.dist, o.dist);
        if (dd < 6 || dd > 110) continue;
        if (!best || dd < best.dd) best = { o, dd };
      }
      if (best) {
        w.locks.push(best.o); w.lockCd = 0.16; sfx.tick();
        if (w.locks.length === 6) { popup('SIX PACK!', 'small'); say('Six pack!', 1); }
      } else w.lockCd = 0.05;
    }
  } else if (w.locks.length) {
    const n = w.locks.length, bonus = 1 + 0.5 * (n - 1);
    for (const tg of w.locks) fireGlob(p, tg.u, tg.v, false, rnd(-3, 3), true, { homing: tg, lockBonus: bonus });
    sfx.launch();
    if (n >= 3) popup('VOLLEY x' + n + '!', 'small');
    w.locks = [];
  }
}

function updateAim(p, dt) {
  // auto-aim: lock onto the best target in a forward cone, else aim straight ahead
  const a = world.aim;
  const t = aimTargetFor(p);
  a.lock = t ? t.o || t : null;
  if (t) { a.u = t.u; a.v = t.v; } else { a.u = p.u; a.v = p.v + 0.6; }
  const dz = t && t.o ? relDz(t.o.dist) : t && t.dist != null ? relDz(t.dist) : 40;
  projectDz(Math.max(3, dz), a.u, a.v, PT);
  a.x = damp(a.x, PT.x, 18, dt); a.y = damp(a.y, PT.y, 18, dt);
  a.lockT = a.lock ? a.lockT + dt : 0;
}
