// GOO PRIX · src/controls.js — The player's keyboard controls and auto-aim.
'use strict';

// ============================================================================================
// CONTROLS — the player's two schemes (KEYS: fly on keys, aim with the mouse; MOUSE: all mouse)
// ============================================================================================
function flapKeyHit() { return keyHit('ArrowUp', 'KeyW'); }
function setScheme(s) { if (game.scheme !== s) { game.scheme = s; save.scheme = s; writeSave(); } }

function unproject(dz, x, y) {
  const S = slabAt(dz);
  const det = S.ax * S.by - S.bx * S.ay;
  const dx = x - S.ox, dy = y - S.oy;
  return { u: (dx * S.by - S.bx * dy) / det, v: (S.ax * dy - dx * S.ay) / det };
}

function playerControl(p, dt) {
  if (p.finished) return aiControl(p, dt);
  // Keyboard only: UP flaps, LEFT / RIGHT steer, DOWN dives, SPACE shoots (auto-aim, hold to keep
  // firing), X or SHIFT uses the item. WASD works too for the flying.
  const ctl = { steer: 0, targetU: null, flap: false, dive: false };
  ctl.steer = (keyDown('ArrowRight', 'KeyD') ? 1 : 0) - (keyDown('ArrowLeft', 'KeyA') ? 1 : 0);
  ctl.flap = keyHit('ArrowUp', 'KeyW');
  ctl.dive = keyDown('ArrowDown', 'KeyS');
  updateAim(p, dt);
  if (keyDown('Space') && p.shotCd <= 0) shootAt(p, world.aim.lock ? world.aim : { u: p.u, v: p.v + 0.6 });
  if (keyHit('KeyX', 'ShiftLeft', 'ShiftRight', 'KeyE')) useItem(p);
  return ctl;
}

// One trigger pull: a single glob, or three in a fan while the Goo Geyser runs.
function shootAt(r, a) {
  if (r.geyser > 0) for (const sp of [-6, 0, 6]) fireGlob(r, a.u, a.v, false, sp);
  else fireGlob(r, a.u, a.v, false);
}

function updateAim(p, dt) {
  // auto-aim: lock onto the best rival in a forward cone, else aim straight ahead
  const a = world.aim;
  const t = aimTargetFor(p);
  a.lock = t ? t.o : null;
  if (t) { a.u = t.u; a.v = t.v; } else { a.u = p.u; a.v = p.v + 0.6; }
  const dz = a.lock ? relDz(a.lock.dist) : 40;
  projectDz(Math.max(3, dz), a.u, a.v, PT);
  a.x = damp(a.x, PT.x, 18, dt); a.y = damp(a.y, PT.y, 18, dt);
  a.lockT = a.lock ? a.lockT + dt : 0;
}
