// GOO PRIX · src/camera.js — The chase camera.
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
}
function applyCamera(sOverride, vOverride) {
  const w = world, p = w.player;
  cam.roll = w.camRoll; cam.f = w.camF; cam.hz = w.camHz;
  const sh = w.shake;
  cam.ox = sh ? (rand() * 2 - 1) * sh : 0; cam.oy = sh ? (rand() * 2 - 1) * sh : 0;
  setCamera(sOverride != null ? sOverride : p.dist - CFG.camBack, w.camU, vOverride != null ? vOverride : w.camV);
}
