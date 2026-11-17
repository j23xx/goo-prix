// GOO PRIX · src/scenes/stage-play.js — The level as you fly it: one frame of world, ship, effects and HUD.
'use strict';

// The level as you fly it: world, ship, screen FX, HUD, popups, countdown, crosshair, flashes.
function drawLevelFrame(c) {
  const w = world;
  applyCamera();
  renderWorld(c);
  drawPlayerCraft(c);
  drawSpeedDashes(c);
  drawScreenFx(c);
  drawWindscreen(c);
  drawVignette(c);
  drawHUD(c);
  drawPopups(c);
  if (w.state === 'countdown') {
    const n = Math.ceil(w.countdown);
    if (n <= 3 && n >= 1) {
      const f = w.countdown - Math.floor(w.countdown);
      c.save(); c.translate(W / 2, 330); const sc = 0.8 + f * 0.5; c.scale(sc, sc);
      blockText(c, String(n), 0, -84, 24, { align: 'center', color: YEL, outline: 8, outlineColor: INK, shadow: 14, shadowColor: PNK });
      c.restore();
    }
  }
  if (!game.paused && w.state !== 'done') drawCrosshair(c);
  if (w.flash > 0) { c.globalCompositeOperation = 'difference'; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
  if (w.flash2 > 0) { c.globalAlpha = Math.min(1, w.flash2 * 1.2); c.fillStyle = CREAM; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
}

SCENES.race = {
  enter() { if (world.state === 'countdown') world.countdown = 3.2; world.lastBeep = 4; },
  update(dt) {
    if (keyHit('Escape', 'KeyP')) togglePause();
    if (keyHit('KeyM')) AU.setMuted(!save.muted);
    if (game.paused) { pauseUpdate(); return; }
    if (keyHit('KeyR')) { restartLevel(); return; }
    if (world.hitstop > 0) { world.hitstop -= dt; return; }
    raceStep(dt);
    updateCamera(dt);
    world.beatFlash = Math.max(0, (world.beatFlash || 0) - dt);
  },
  draw(c) { drawLevelFrame(c); if (game.paused) drawPause(c); },
};
