// GOO PRIX · src/play/achievements.js — The badges a run can earn, judged from its stats.
'use strict';

// ============================================================================================
// ACHIEVEMENTS — eight badges per run; the run card shows them all, the earned ones lit
// ============================================================================================
const ACHIEVEMENTS = [
  { id: 'slain', name: () => 'SPOTLESS SLAIN', test: (r) => !!r.grades[LEVELS.length - 1] },
  { id: 'alls', name: () => 'ALL S', test: (r) => LEVELS.every((L, i) => r.grades[i] === 'S') },
  { id: 'noknock', name: (r) => 'NO-KNOCK x' + r.stats.noKnock, test: (r) => r.stats.noKnock >= 1 },
  { id: 'chain', name: (r) => r.stats.bestChain >= 100 ? 'CHAIN 100' : 'CHAIN 50', test: (r) => r.stats.bestChain >= 50 },
  { id: 'sharp', name: () => 'SHARPSHOOTER 75%', test: (r) => runAccuracy(r) >= 0.75 },
  { id: 'bulls', name: (r) => 'BULLSEYE x' + r.stats.bullseyes, test: (r) => r.stats.bullseyes >= 10 },
  { id: 'build', name: () => 'FULL BUILD', test: (r) => r.mixins.length >= 5 },
  { id: 'gold', name: (r) => 'GOLD DIGGER x' + r.stats.goldies, test: (r) => r.stats.goldies >= 3 },
];
function runBadges(run) { return ACHIEVEMENTS.map((a) => ({ name: a.name(run), earned: !!a.test(run) })); }
