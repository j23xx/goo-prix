// GOO PRIX · src/save.js — Best scores and settings kept in localStorage.
'use strict';

// ============================================================================================
// SAVE — best scores, run grades and settings in localStorage (silently skipped when blocked)
// ============================================================================================
const SAVE_KEY = 'gooprix.v2';
const save = {
  bestRace: {},       // `lvl${level}:${difficulty}` -> best level score
  bestCup: 0,         // best full-run total
  trophies: {},       // `run:${difficulty}` -> the best run grade, 'S' to 'D'
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
