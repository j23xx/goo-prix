// GOO PRIX · src/play/levels.js — The campaign: five levels that each add a crazier rule, then the boss.
'use strict';

// ============================================================================================
// LEVELS — one world each, its new twist, pace, target mix, score quota and mid-level set piece
// ============================================================================================
// mix: relative weights of the wave target classes. goldie: chance per wave of a fleeing goldie.
// aces: how many rival aces may fly at once. Twists stack in spirit: every level is its own game.
const LEVELS = [
  {
    id: 'orderup', name: 'ORDER UP', track: 0, speed: 55, waveGap: 3.0, quota: 5000, twist: null,
    say: 'Order up!', blurb: 'SHOOT EVERYTHING. THREAD THE WINDOWS. DON\'T GET KNOCKED.',
    mix: { floater: 5, zipper: 2, tank: 1, splitter: 1 }, goldie: 0.25, aces: 0, splitGens: 1, setpiece: 'giant',
  },
  {
    id: 'beatdrop', name: 'BEAT DROP', track: 1, speed: 62, waveGap: 2.5, quota: 6000, twist: 'rhythm',
    say: 'Beat drop!', blurb: 'SHOTS ON THE BEAT SCORE DOUBLE. THE PIPE ROLLS... THEN FLIPS.',
    mix: { floater: 4, zipper: 3, tank: 1, splitter: 2 }, goldie: 0.3, aces: 1, splitGens: 1, setpiece: 'shower',
  },
  {
    id: 'whiteout', name: 'WHITE-OUT', track: 2, speed: 66, waveGap: 2.2, quota: 8000, twist: 'whiteout',
    say: 'White out!', blurb: 'BLIZZARDS HIDE THE GATES: GOO THEM TO SEE THEM. STEERING SLIDES.',
    mix: { floater: 3, zipper: 4, tank: 2, splitter: 2 }, goldie: 0.3, aces: 1, splitGens: 2, setpiece: 'dark',
  },
  {
    id: 'upsidedrown', name: 'UPSIDE DROWN', track: 3, speed: 70, waveGap: 2.0, quota: 9000, twist: 'gravity',
    say: 'Upside drown!', blurb: 'GRAVITY FLIPS EVERY 12 SECONDS. FLAP AWAY FROM IT.',
    mix: { floater: 3, zipper: 3, tank: 2, splitter: 4 }, goldie: 0.35, aces: 2, splitGens: 3, setpiece: 'sideways',
  },
  {
    id: 'locknslop', name: 'LOCK \'N\' SLOP', track: 4, speed: 78, waveGap: 1.6, quota: 12000, twist: 'zerog',
    say: 'Lock and slop!', blurb: 'ZERO-G: ↑ ↓ THRUST. HOLD SPACE TO LOCK UP TO SIX, LET GO TO FIRE.',
    mix: { floater: 4, zipper: 3, tank: 3, splitter: 2 }, goldie: 0.4, aces: 3, splitGens: 2, setpiece: 'storm',
  },
  {
    id: 'boss', name: 'MISTER SPOTLESS', track: 5, speed: 58, waveGap: 99, quota: 0, twist: 'boss', boss: true,
    say: 'Mister Spotless!', blurb: 'THE FINAL BOSS. MAKE HIM FILTHY. GOLD STAINS COUNT TRIPLE.',
    mix: { floater: 1 }, goldie: 0, aces: 0, splitGens: 1, setpiece: null,
  },
];
const LEVEL_SECONDS = 80;
const DIFF_SPEED = [0.92, 1, 1.08];
const DIFF_QUOTA = [0.75, 1, 1.25];
// ENDLESS SLOP loops the six stages: every loop flies 10% faster and asks 50% more.
function loopOf() { return game.run && game.run.mode === 'endless' ? game.run.loop : 0; }
function levelSpeed(L) { return L.speed * DIFF_SPEED[game.diff] * (1 + 0.1 * loopOf()); }
// Every Mix-in you own makes the bar 20% higher: the more you paint with, the more they ask.
function mixinCount() { return game.run && game.run.mixins ? game.run.mixins.length : 0; }
function levelQuota(L) { return Math.round(L.quota * DIFF_QUOTA[game.diff] * (1 + 0.5 * loopOf()) * (1 + 0.2 * mixinCount()) / 100) * 100; }
// Letter grade from score / quota (the boss grades on time left instead).
function gradeFor(ratio) { return ratio >= 3 ? 'S' : ratio >= 2.2 ? 'A' : ratio >= 1.6 ? 'B' : ratio >= 1 ? 'C' : 'D'; }
const GRADE_COLORS = { S: '#FFC21A', A: '#19E0D0', B: '#FF8A3D', C: '#FFF6E0', D: '#FF2D3A' };
