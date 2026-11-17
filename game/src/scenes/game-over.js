// GOO PRIX · src/scenes/game-over.js — Out of continues: the ship frozen in an ice cube, NEW RUN / TITLE.
'use strict';

// Game over: a white-out, your ship frozen solid in an ice cube.
function drawGameOver(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#CFF3FF'); g.addColorStop(1, '#7FC8FF');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const rng = mulberry32(8);
  c.fillStyle = '#FFFFFF';
  for (let i = 0; i < 90; i++) { const x = (rng() * W + t * 40 * (0.5 + rng())) % W, y = (rng() * H + t * 70 * (0.5 + rng())) % H; c.fillRect(x, y, 4, 4); }
  blockText(c, 'GAME OVER', W / 2, 70, 12, { align: 'center', color: '#2F6BD9', outline: 6, outlineColor: INK, shadow: 10, shadowColor: '#FFFFFF' });
  hudText(c, 'OUT OF CONTINUES. THE WORLD STAYS SPOTLESS.', W / 2, 180, 3, CREAM, 'center');
  const x = W / 2, y = 400;
  c.save(); c.translate(x, y); c.rotate(-0.06);
  drawShip(c, RACERS[game.racer], 0, 6, 150, { t: 0 });
  c.beginPath(); c.roundRect(-120, -110, 240, 230, 22);
  c.fillStyle = 'rgba(190,235,255,0.55)'; c.fill();
  c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
  c.lineWidth = 4; c.strokeStyle = '#FFFFFF'; c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(-96, -88, 26, 120); c.fillRect(-60, -88, 12, 60);
  c.restore();
  drawButton(c, 'retry', 'NEW RUN', W / 2 - 250, 600, 240, 50, game.goMenu.i === 0);
  drawButton(c, 'title', 'TITLE', W / 2 + 10, 600, 240, 50, game.goMenu.i === 1);
}

SCENES.gameover = {
  enter() { game.goMenu = { i: 0 }; MUSIC.play(SONGS.over); say('Game over!', 3); },
  update(dt) {
    const sel = menuNav(game.goMenu, ['retry', 'title']);
    if (sel === 0) { sfx.uiSelect(); startRun('campaign', 0); goTo('intro', () => startLevelScene(0)); }
    if (sel === 1) { sfx.uiSelect(); goTo('title'); }
  },
  draw(c) { drawGameOver(c, game.sceneT); },
};
