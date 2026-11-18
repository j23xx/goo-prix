// GOO PRIX · src/scenes/pause.js — Pause, restart and quit from inside a level.
'use strict';

// ---- PAUSE overlay inside a level
const PAUSE_ITEMS = ['resume', 'restart', 'quit'];
function togglePause() {
  if (game.scene !== 'race') return;
  game.paused = !game.paused;
  game.pauseMenu.i = 0;
  MUSIC.duck = game.paused ? 0.45 : 1;
  VOICE.stop();
  sfx.uiMove();
}
function onBlurPause() { if (game.scene === 'race' && !game.paused && !SHOT) togglePause(); }
// Restarting a level in a full run costs a continue once you are a quarter of the way in.
function restartCost() { return game.run && (game.run.mode === 'campaign' || game.run.mode === 'endless') && world.player.dist > world.length * 0.25; }
function restartLevel() {
  if (game.scene !== 'race' || game.wipe) return;
  if (restartCost()) { if (game.run.continues <= 0) { popup('NO CONTINUES LEFT', 'mid'); return; } game.run.continues--; }
  const idx = world.levelIdx;
  goTo('intro', () => startLevelScene(idx));
}
function pauseUpdate() {
  const sel = menuNav(game.pauseMenu, PAUSE_ITEMS);
  if (sel < 0) return;
  const id = PAUSE_ITEMS[sel];
  sfx.uiSelect();
  if (id === 'resume') togglePause();
  else if (id === 'restart') { game.paused = false; MUSIC.duck = 1; restartLevel(); }
  else if (id === 'quit') { game.paused = false; MUSIC.duck = 1; goTo('title'); }
}
function drawPause(c) {
  groundWash(c, 0.86);
  hudText(c, 'PAUSED', W / 2, 150, 10, CREAM, 'center');
  const labels = {
    resume: 'RESUME',
    restart: 'RESTART LEVEL' + (restartCost() ? ' (1 CONTINUE)' : ''),
    quit: 'QUIT TO TITLE',
  };
  PAUSE_ITEMS.forEach((id, i) => drawButton(c, id, labels[id], W / 2 - 270, 300 + i * 62, 540, 48, game.pauseMenu.i === i));
  drawKeyLegend(c, FLIGHT_KEYS, W / 2, 506, 28, 'center');
  drawKeyLegend(c, [[['R'], 'RESTART'], [['M'], 'SOUND'], [['H'], 'HIDE PANELS'], [['ESC'], 'RESUME']], W / 2, 548, 28, 'center');
  drawTargetsPanel(c, W - 236, 150, 212);
  if (game.run && game.run.mixins.length) { label(c, 'YOUR MIX-INS', W / 2, 596, 15, MAG, { align: 'center' }); drawMixinRow(c, game.run.mixins, W / 2, 640, 34, 'center'); }
}
