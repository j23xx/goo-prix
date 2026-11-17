// GOO PRIX · src/save.js — Best scores and settings kept in localStorage.
'use strict';

// ============================================================================================
// SAVE — best times, trophies and settings in localStorage (silently skipped when blocked)
// ============================================================================================
const SAVE_KEY = 'gooprix.v1';
const save = {
  bestLap: {},        // `${track}:${difficulty}` -> seconds
  bestRace: {},       // `${track}:${difficulty}` -> seconds
  bestCup: 0,         // best cup splat score
  trophies: {},       // `${cup}:${difficulty}` -> 1 gold, 2 silver, 3 bronze
  unlockedMirror: false,
  racer: 0,
  difficulty: 1,
  muted: false,
  wallet: 0,
};
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) Object.assign(save, JSON.parse(raw));
  } catch (err) { /* private mode or blocked storage: play without saving */ }
}
function writeSave() {
  if (SHOT) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (err) { /* ignore */ }
}
