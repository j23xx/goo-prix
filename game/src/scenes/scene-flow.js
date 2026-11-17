// GOO PRIX · src/scenes/scene-flow.js — The scene table, the goo wipe between scenes, and starting a level.
'use strict';

// ============================================================================================
// SCENE_FLOW — every screen is an entry in SCENES; goTo wipes from one to the next
// ============================================================================================
const SCENES = {};

function goTo(name, setup) {
  if (game.wipe) return;   // one transition at a time
  if (SHOT) { if (setup) setup(); enterScene(name); return; }
  game.wipe = { t: 0, name, setup: setup || null, switched: false };
  sfx.wipe();
}
function enterScene(name) {
  game.scene = name; game.sceneT = 0; game.paused = false;
  const sc = SCENES[name];
  if (sc.enter) sc.enter();
  canvas.style.cursor = name === 'race' ? 'none' : 'default';
  const st = document.getElementById('status');
  if (st) st.textContent = 'GOO PRIX: ' + name;
}
function updateWipe(dt) {
  const wp = game.wipe;
  if (!wp) return;
  wp.t += dt;
  if (wp.t >= 0.3 && !wp.switched) { wp.switched = true; if (wp.setup) wp.setup(); enterScene(wp.name); }
  if (wp.t >= 0.62) game.wipe = null;
}
function drawWipe(c) {
  const wp = game.wipe;
  if (!wp) return;
  const p = wp.t < 0.3 ? smooth01(wp.t / 0.3) : 1 - smooth01((wp.t - 0.32) / 0.3);
  const bands = 18, bh = H / bands;
  for (let i = 0; i < bands; i++) {
    const h = clamp(p * 1.25 - (i % 3) * 0.08, 0, 1) * bh;
    if (h <= 0) continue;
    c.fillStyle = '#000'; c.fillRect(0, i * bh, W, h);
    c.fillStyle = GOO_C;
    for (let x = (i * 37) % 80; x < W; x += 80) c.fillRect(x, i * bh + h - 3, 10, 3 + (x % 7));
  }
}

function startLevelScene(levelIdx) {
  reseed(1000 + levelIdx * 31 + Math.floor(rand() * 1000));
  setupLevel(levelIdx);
  MUSIC.play(TRACK.def.song);
}
