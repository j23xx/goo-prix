// GOO PRIX · src/core/util.js — Seeded random numbers and the small maths helpers everything shares.
'use strict';

// ============================================================================================
// RNG — seeded random numbers, so tracks, AI noise and screenshot poses are reproducible
// ============================================================================================
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rand = mulberry32(1);
function reseed(seed) { rand = mulberry32(seed); }
function rnd(lo, hi) { return lo + (hi - lo) * rand(); }
function rndInt(lo, hi) { return Math.floor(rnd(lo, hi + 1)); }
function pick(list) { return list[Math.floor(rand() * list.length)]; }
function weighted(table) {
  // table: [[value, weight], ...]
  let total = 0;
  for (const row of table) total += row[1];
  let r = rand() * total;
  for (const row of table) { r -= row[1]; if (r <= 0) return row[0]; }
  return table[table.length - 1][0];
}

// ============================================================================================
// MATH — small helpers shared by physics, camera and drawing
// ============================================================================================
const TAU = Math.PI * 2;
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function approach(v, target, rate) { return v < target ? Math.min(target, v + rate) : Math.max(target, v - rate); }
function damp(a, b, lambda, dt) { return lerp(a, b, 1 - Math.exp(-lambda * dt)); }
function smooth01(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function easeOutBack(t) { const c = 1.70158; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; }
function wrap(v, m) { return ((v % m) + m) % m; }
