// GOO PRIX · src/render/camera.js — The chase camera.
'use strict';

// ============================================================================================
// CAMERA — chase-cockpit: lags the craft, banks with steering, widens while boosting, shakes
// ============================================================================================
function updateCamera(dt) {
  const w = world, p = w.player;
  w.camU = damp(w.camU, p.u, CFG.camFollowU, dt);
  w.camV = damp(w.camV, p.v + CFG.camUp, CFG.camFollowV, dt);
  w.camRoll = damp(w.camRoll, -clamp(p.vu / CFG.latMax, -1, 1) * 5 * Math.PI / 180, 8, dt);
  w.camF = damp(w.camF, p.boostT > 0 ? CFG.focalBoost : CFG.focal, 5, dt);
  w.camHz = damp(w.camHz, CFG.horizon + clamp(p.vv * 1.2, -22, 22), 6, dt);
  // the level twists turn the whole world: Beat Drop's swaying pipe and barrel rolls (already
  // smooth, so taken as is), and the lava lamp tipping onto its side
  if (w.level && w.level.twist === 'rhythm' && w.state === 'run') w.camSpin = w.rollExtra;
  else w.camSpin = damp(w.camSpin || 0, w.sideT > 0 ? w.sideDir * 0.85 : 0, 2.5, dt);
  w.gFlip = damp(w.gFlip == null ? 1 : w.gFlip, w.gsign || 1, 7, dt);
}
function applyCamera(sOverride, vOverride) {
  const w = world, p = w.player;
  cam.roll = w.camRoll + (w.camSpin || 0); cam.f = w.camF; cam.hz = w.camHz;
  const sh = w.shake;
  cam.ox = sh ? (rand() * 2 - 1) * sh : 0; cam.oy = sh ? (rand() * 2 - 1) * sh : 0;
  setCamera(sOverride != null ? sOverride : p.dist - CFG.camBack, w.camU, vOverride != null ? vOverride : w.camV);
}
