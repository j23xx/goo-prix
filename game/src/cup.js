// GOO PRIX · src/cup.js — Progression across levels.
'use strict';

// ============================================================================================
// CUP — grand prix progression: points, retry tokens, standings, trophies and the mirror unlock
// ============================================================================================
function startCup(mode) {
  game.cup = { mode, race: 0, tracks: mode === 'quick' ? [game.quickTrack] : [0, 1, 2, 3, 4], pts: [0, 0, 0, 0, 0, 0, 0, 0], tokens: CFG.tokens, score: 0, lastWins: null, splats: 0, bestLap: 0 };
}
function cupStandings() {
  const cup = game.cup;
  return [0, 1, 2, 3, 4, 5, 6, 7].sort((a, b) => (cup.pts[b] - cup.pts[a]) || ((cup.lastWins ? cup.lastWins.indexOf(a) : a) - (cup.lastWins ? cup.lastWins.indexOf(b) : b)));
}
function finishCup() {
  const st = cupStandings();
  const place = st.indexOf(game.racer);
  const key = (game.mirror ? 'regloop' : 'gloop') + ':' + game.diff;
  if (place < 3 && (!save.trophies[key] || place + 1 < save.trophies[key])) save.trophies[key] = place + 1;
  game.cup.unlocked = place < 3 && !save.unlockedMirror;
  if (place < 3) save.unlockedMirror = true;
  game.cup.newBestCup = game.cup.score > save.bestCup;
  if (game.cup.newBestCup) save.bestCup = game.cup.score;
  writeSave();
  return place;
}
