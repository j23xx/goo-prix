// GOO PRIX · src/main.js — The fixed-step main loop, layout, shell buttons and boot.
'use strict';

// ============================================================================================
// MAIN_LOOP — fixed 1/60 s steps with an accumulator, render, resize, shell buttons and boot
// ============================================================================================
canvas.addEventListener('wheel', (e) => { if (game.scene === 'race') { input.wheel = true; e.preventDefault(); } }, { passive: false });
canvas.addEventListener('auxclick', (e) => { if (e.button === 1) input.mclick = true; });

function tick(dt) {
  game.sceneT += dt;
  if (game.wipe) {
    updateWipe(dt);
    if ((game.scene === 'title' || game.scene === 'select' || game.scene === 'howto') && world) { raceStep(dt); updateCamera(dt); }
    return;
  }
  SCENES[game.scene].update(dt);
}

function render() {
  UI.rects.clear();
  ctx.save();
  SCENES[game.scene].draw(ctx);
  ctx.restore();
  drawWipe(ctx);
}

let lastTs = 0, acc = 0;
function loop(ts) {
  const now = ts / 1000;
  const dt = lastTs ? Math.min(0.1, now - lastTs) : DT;
  lastTs = now;
  let scale = 1;
  if (game.scene === 'race' && world && world.slowmo > 0 && !game.paused) { world.slowmo -= dt; scale = 0.35; }
  acc += dt * scale;
  let steps = 0;
  while (acc >= DT && steps < 5) {
    tick(DT);
    acc -= DT; steps++;
    if (steps === 1) { endInputFrame(); input.wheel = false; input.mclick = false; }
  }
  if (steps === 5) acc = 0;
  render();
  requestAnimationFrame(loop);
}

const frameEl = document.getElementById('frame');
function layout() {
  if (SHOT) {
    frameEl.style.width = innerWidth + 'px'; frameEl.style.height = innerHeight + 'px';
    return;
  }
  const fs = document.fullscreenElement === frameEl;
  const availW = innerWidth - (fs ? 0 : 32);
  const availH = innerHeight - (fs ? 0 : 44 + 16 + 12 + 40 + 12 + 22);
  const w = Math.max(320, Math.floor(Math.min(availW, availH * 16 / 9)));
  const h = Math.floor(w * 9 / 16);
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  if (fs) { frameEl.style.width = '100%'; frameEl.style.height = '100%'; frameEl.style.display = 'grid'; frameEl.style.placeItems = 'center'; }
  else { frameEl.style.width = w + 'px'; frameEl.style.height = h + 'px'; frameEl.style.display = 'block'; }
}

function wireShell() {
  const btn = (id, fn) => {
    const b = document.getElementById(id);
    b.addEventListener('click', () => { AU.resume(); fn(); b.blur(); canvas.focus(); });
  };
  btn('b-restart', () => { if (game.scene === 'race') restartRace(); else if (game.scene !== 'title') goTo('title'); });
  btn('b-pause', () => togglePause());
  btn('b-sound', () => AU.setMuted(!save.muted));
  btn('b-full', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (frameEl.requestFullscreen) frameEl.requestFullscreen();
  });
  document.addEventListener('fullscreenchange', layout);
  const use = document.getElementById('i-sound-use');
  if (use) use.setAttribute('href', save.muted ? '#i-mute' : '#i-sound');
}

function boot() {
  loadSave();
  game.diff = clamp(save.difficulty | 0, 0, 2);
  game.racer = clamp(save.racer | 0, 0, 7);
  game.scheme = save.scheme === 'mouse' ? 'mouse' : 'keys';
  layout();
  window.addEventListener('resize', layout);
  if (SHOT) { runShot(SHOT); return; }
  wireShell();
  enterScene('title');
  canvas.focus();
  requestAnimationFrame(loop);
}
boot();
