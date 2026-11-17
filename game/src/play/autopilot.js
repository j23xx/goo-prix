// GOO PRIX · src/play/autopilot.js — The autopilot that flies the title screen's demo and the screenshot poses.
'use strict';

// ============================================================================================
// AUTOPILOT — aims at the next window, flaps with a short reaction delay, shoots what it sees
// ============================================================================================
function aiControl(r, dt) {
  const ai = r.ai;
  const ctl = { steer: 0, targetU: null, flap: false, dive: false, thrust: 0 };
  const T = TRACK;
  ai.noiseT -= dt;
  if (ai.noiseT <= 0) { ai.noiseT = rnd(0.8, 1.6); ai.noiseU = rnd(-1, 1) * 0.6; ai.noiseV = rnd(-1, 1) * 0.4; }
  // the next thing that blocks the way, and where to pass it
  let aim = null;
  const n = T.things.length;
  let idx = r.ti, base = r.tBase;
  for (let k = 0; k < 14 && n; k++) {
    const th = T.things[idx];
    const ahead = base + th.s - r.dist;
    if (ahead > 110) break;
    if (ahead > -1 && (th.kind === 'gate' || th.kind === 'pillars' || th.kind === 'blocks' || th.kind === 'ball' || th.kind === 'rotor' || th.kind === 'laser' || th.kind === 'curtain')) {
      const a = thingAim(th, r.u, r.v, world.t + ahead / Math.max(20, r.speed));
      if (a) { aim = { u: a[0], v: a[1], ahead }; break; }
    }
    idx++; if (idx >= n) { idx = 0; base += T.L; }
  }
  // the boss's squeegee walls and spinners are not track things: dodge the nearest one ahead
  for (const wl of world.walls) {
    const ahead = gap(r.dist, wl.dist);
    if (wl.passed || ahead < -1 || ahead > 70 || (aim && aim.ahead < ahead)) continue;
    const a = thingAim(wl, r.u, r.v, world.t + ahead / Math.max(20, r.speed - wl.vs));
    if (a) aim = { u: a[0], v: a[1], ahead };
  }
  let tu = aim ? aim.u : lineUAt(r.dist + 25), tv = aim ? aim.v : lineVAt(r.dist + 25);
  for (const b of world.bolts) {
    const dd = gap(r.dist, b.dist);
    if (dd > 2 && dd < 30 && Math.abs(b.u - r.u) < 2.5 && Math.abs(b.v - r.v) < 2.5) { tu = r.u + (b.u > r.u ? -5 : 5); break; }
  }
  tu += ai.noiseU; tv = clamp(tv + ai.noiseV, 1.2, CFG.ceil - 1.2);
  const desired = clamp((tu - r.u) * 3.2, -CFG.latMax, CFG.latMax);
  ctl.steer = clamp((desired - r.vu) * 0.22, -1, 1);
  const gs = world.gsign || 1;
  const below = gs > 0 ? r.v < tv - 0.45 && r.vv < 2.2 : r.v > tv + 0.45 && r.vv > -2.2;
  if (below) {
    ai.react -= dt;
    if (ai.react <= 0) { ctl.flap = true; ai.react = rnd(0.07, 0.12); }
  } else ai.react = Math.min(ai.react, 0.1);
  ctl.thrust = clamp((tv - r.v) * 0.6 - r.vv * 0.15, -1, 1);
  // shoot whatever is in the cone, and use an item once there is something worth using it on
  const t = aimTargetFor(r);
  if (t && r.shotCd <= 0 && r.tank > 30) shootAt(r, t);
  if (r.item && rand() < dt * 0.5 && world.state === 'run') useItem(r);
  return ctl;
}
