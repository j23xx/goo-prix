// GOO PRIX · src/render/projection.js — Track coordinates to screen: the camera on the track tangent.
'use strict';

// ============================================================================================
// PROJECTION — track coordinates (s along, u lateral, v height) to screen, camera on the tangent
// ============================================================================================
const cam = { s: 0, u: 0, v: 6, f: CFG.focal, roll: 0, X: 0, Xd: 0, Y: 0, Yd: 0, cos: 1, sin: 0, hz: CFG.horizon, ox: 0, oy: 0 };
const PT = { x: 0, y: 0, k: 0, dz: 0 };
const PT2 = { x: 0, y: 0, k: 0, dz: 0 };

function setCamera(s, u, v) {
  cam.s = wrap(s, TRACK.L); cam.u = u; cam.v = v;
  cam.X = cxAt(cam.s) + u; cam.Xd = cxD(cam.s);
  cam.Y = cyAt(cam.s) + v; cam.Yd = cyD(cam.s);
  cam.cos = Math.cos(cam.roll); cam.sin = Math.sin(cam.roll);
}
// Distance ahead of the camera along the track, wrapped to [-120, L-120).
function relDz(s) { let d = wrap(s - cam.s, TRACK.L); if (d > TRACK.L - 120) d -= TRACK.L; return d; }
function projectDz(dz, u, v, out) {
  const sa = cam.s + dz;
  const x = cxAt(sa) + u - cam.X - cam.Xd * dz;
  const y = cyAt(sa) + v - cam.Y - cam.Yd * dz;
  const k = cam.f / dz;
  const px = x * k, py = -y * k;
  out.x = W / 2 + px * cam.cos - py * cam.sin + cam.ox;
  out.y = cam.hz + px * cam.sin + py * cam.cos + cam.oy;
  out.k = k; out.dz = dz;
  return out;
}
// A cross-section of the track at one dz is an affine map: origin + u*A + v*B.
const SLAB = { ox: 0, oy: 0, ax: 0, ay: 0, bx: 0, by: 0, k: 0, dz: 0 };
function slabAt(dz) {
  projectDz(dz, 0, 0, PT);
  SLAB.ox = PT.x; SLAB.oy = PT.y; SLAB.k = PT.k; SLAB.dz = dz;
  SLAB.ax = PT.k * cam.cos; SLAB.ay = PT.k * cam.sin;
  SLAB.bx = PT.k * cam.sin; SLAB.by = -PT.k * cam.cos;
  return SLAB;
}
function sx(S, u, v) { return S.ox + u * S.ax + v * S.bx; }
function sy(S, u, v) { return S.oy + u * S.ay + v * S.by; }
function slabRect(c, S, u0, v0, u1, v1) {
  c.moveTo(sx(S, u0, v0), sy(S, u0, v0));
  c.lineTo(sx(S, u1, v0), sy(S, u1, v0));
  c.lineTo(sx(S, u1, v1), sy(S, u1, v1));
  c.lineTo(sx(S, u0, v1), sy(S, u0, v1));
  c.closePath();
}
// A 3D segment with near-plane clipping, drawn in one stroke.
function seg3(c, dz0, u0, v0, dz1, u1, v1) {
  const n = CFG.near;
  if (dz0 < n && dz1 < n) return false;
  if (dz0 < n) { const t = (n - dz0) / (dz1 - dz0); dz0 = n; u0 = lerp(u0, u1, t); v0 = lerp(v0, v1, t); }
  if (dz1 < n) { const t = (n - dz1) / (dz0 - dz1); dz1 = n; u1 = lerp(u1, u0, t); v1 = lerp(v1, v0, t); }
  projectDz(dz0, u0, v0, PT); projectDz(dz1, u1, v1, PT2);
  c.moveTo(PT.x, PT.y); c.lineTo(PT2.x, PT2.y);
  return true;
}
