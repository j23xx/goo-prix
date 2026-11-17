// GOO PRIX · src/score.js — Score attack: points, the hit chain and multiplier, coats and knocks.
'use strict';

// ============================================================================================
// SCORE — every hit grows the chain (x1..x8), every knock costs flat points and resets it
// ============================================================================================
const KNOCK = { wall: 500, hazard: 300, bolt: 200, goop: 150, boss: 400 };
const COAT_NAMES = ['PRIMER', 'POP', 'WET PAINT'];

function resetScore(w) {
  Object.assign(w, {
    score: 0, chain: 0, chainT: 0, mult: 1, bestChain: 0, shots: 0, hits: 0, knocks: 0,
    deltas: [], coat: 0, coatT: 0, threads: 0, bullseyes: 0, killPts: 0, sweeps: 0, scrapeT: 0,
  });
}
function multFor(chain) { return Math.min(8, 1 + Math.floor(chain / 5)); }
function coatFor(m) { return m >= 6 ? 2 : m >= 3 ? 1 : 0; }

// A target was hit: the chain grows, and the multiplier (and the world's coat of paint) with it.
function registerHit() {
  const w = world;
  w.hits++; w.chain++; w.chainT = 2.5;
  if (w.chain > w.bestChain) w.bestChain = w.chain;
  const m = multFor(w.chain);
  if (m !== w.mult) {
    w.mult = m;
    if (!w.attract) {
      if (m === 3) { say('Second coat!', 2); popup('SECOND COAT!', 'mid'); }
      else if (m === 6) { say('Wet paint!', 2); popup('WET PAINT!', 'mid'); }
      else if (m === 8) { say('Masterpiece!', 2); popup('MASTERPIECE x8!', 'big'); }
      sfx.posUp();
    }
  }
  const coat = coatFor(m);
  if (coat !== w.coat) { w.coat = coat; w.coatT = 0; }
}

// Add points (already multiplied by the caller where the rules say so), float them in the HUD.
function award(pts, label) {
  const w = world;
  if (w.attract || pts <= 0) return;
  w.score += pts;
  w.deltas.push({ text: '+' + pts + (label ? ' ' + label : ''), good: true, t: 0 });
  if (w.deltas.length > 5) w.deltas.shift();
}

// A knock: flat points off (never below zero), the chain and the coat are gone, a moment of
// invulnerability so one crash is never charged twice. Armour above 3 softens the penalty.
function knock(kind, label) {
  const w = world, p = w.player;
  if (w.attract || p.invuln > 0 || w.state !== 'run') return false;
  const arm = p.def.stats[3];
  const pen = Math.round(KNOCK[kind] * (1 - Math.max(0, arm - 3) * 0.05) / 10) * 10;
  w.lost += Math.min(pen, w.score);
  w.score = Math.max(0, w.score - pen);
  w.knocks++;
  w.chain = 0; w.chainT = 0;
  if (w.mult > 1 || w.coat > 0) { w.mult = 1; w.coat = 0; w.coatT = 0; }
  w.deltas.push({ text: '-' + pen + (label ? ' ' + label : ''), good: false, t: 0 });
  if (w.deltas.length > 5) w.deltas.shift();
  p.invuln = Math.max(p.invuln, CFG.invuln);
  if (w.boss) w.boss.time = Math.max(0, w.boss.time - 3);   // the boss charges seconds too
  say(pick(['Bonk!', 'Ouch!', 'Points gone!']), 2, { cooldown: 1500 });
  return true;
}

function updateScore(dt) {
  const w = world;
  if (w.chainT > 0) {
    w.chainT -= dt;
    if (w.chainT <= 0) { w.chain = 0; w.mult = 1; if (w.coat) { w.coat = 0; w.coatT = 0; } }
  }
  w.coatT += dt;
  for (const d of w.deltas) d.t += dt;
  w.deltas = w.deltas.filter((d) => d.t < 1.6);
  // grinding a side rail bleeds 50 points a second (no chain reset: it is a scrape, not a crash)
  const p = w.player;
  if (p.onRail && w.state === 'run' && !w.attract) {
    w.scrapeT += dt;
    if (w.scrapeT >= 1) { w.scrapeT -= 1; w.lost += Math.min(50, w.score); w.score = Math.max(0, w.score - 50); w.deltas.push({ text: '-50 SCRAPE', good: false, t: 0 }); }
  } else w.scrapeT = 0;
}

// Threading a window: +100, or a bullseye through its middle 30% for +250.
function threadWindow(g, u, v) {
  const w = world;
  if (w.attract) return;
  w.threads++;
  const cu = gateCentreU(g, w.t);
  if (Math.abs(u - cu) < g.w * 0.15 && Math.abs(v - g.v) < g.h * 0.15) {
    w.bullseyes++;
    award(250, 'BULLSEYE'); w.windowPts += 250;
    popup('BULLSEYE!', 'small');
    say('Bullseye!', 1, { cooldown: 4000 });
  } else { award(100); w.windowPts += 100; }
}
