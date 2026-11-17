// GOO PRIX · src/play/run-stats.js — What a run adds up to: targets, accuracy, chains, a stage log.
'use strict';

// ============================================================================================
// RUN_STATS — every cleared stage is logged (score, quota, grade, knocks) and its numbers summed
// ============================================================================================
function newRunStats() {
  return { kills: 0, goldies: 0, shots: 0, hits: 0, bullseyes: 0, threads: 0, knocks: 0, bestChain: 0, noKnock: 0, time: 0 };
}
// Log a cleared stage: a full run keeps the latest clear of each stage, Endless keeps them all.
function logStage(run, res) {
  const entry = { idx: res.levelIdx, score: res.score, quota: res.quota, grade: res.grade, knocks: res.knocks, loop: run.loop || 0 };
  if (run.mode === 'endless') run.stages.push(entry);
  else run.stages[res.levelIdx] = entry;
  const s = run.stats;
  s.kills += res.kills; s.goldies += res.goldies; s.shots += res.shots; s.hits += res.hits;
  s.bullseyes += res.bullseyes; s.threads += res.threads; s.knocks += res.knocks; s.time += res.time;
  s.bestChain = Math.max(s.bestChain, res.bestChain);
  if (res.knocks === 0) s.noKnock++;
}
function runAccuracy(run) { return run.stats.shots ? Math.min(1, run.stats.hits / run.stats.shots) : 0; }
// The stages to chart: the six of a full run, or the last six of an Endless run.
function chartStages(run) { return run.mode === 'endless' ? run.stages.slice(-6) : LEVELS.map((L, i) => run.stages[i] || { idx: i, score: 0, quota: 0, grade: null, knocks: 0 }); }
