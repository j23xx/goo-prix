// GOO PRIX · src/scenes/ship-select.js — Pick one of eight ships, see its stats, pick a practice level.
'use strict';

SCENES.select = {
  enter() { game.selRow = 0; if (!world || !world.attract) makeAttract(); },
  update(dt) {
    raceStep(dt); updateCamera(dt);
    const practice = game.mode === 'practice';
    let i = game.racer;
    const lr = keyHit('ArrowRight', 'KeyD') ? 1 : keyHit('ArrowLeft', 'KeyA') ? -1 : 0;
    if (lr) {
      if (game.selRow === 0) i = (i + 8 + lr) % 8;
      else if (game.selRow === 1 && practice) game.practiceLevel = (game.practiceLevel + LEVELS.length + lr) % LEVELS.length;
      sfx.uiMove();
    }
    if (keyHit('ArrowDown', 'KeyS')) { if (game.selRow === 0 && i < 4) i += 4; else game.selRow = Math.min(2, game.selRow + 1); sfx.uiMove(); }
    if (keyHit('ArrowUp', 'KeyW')) { if (game.selRow > 0) game.selRow--; else if (i >= 4) i -= 4; sfx.uiMove(); }
    if (input.moved) for (let k = 0; k < 8; k++) if (uiOver('card' + k) && i !== k) { i = k; game.selRow = 0; sfx.uiMove(); }
    if (input.click) {
      for (let k = 0; k < 8; k++) if (uiOver('card' + k)) { i = k; game.selRow = 0; }
      if (uiOver('opt') && practice) { game.practiceLevel = (game.practiceLevel + 1) % LEVELS.length; sfx.uiMove(); }
    }
    if (i !== game.racer) say(RACERS[i].pilot, 0, { cooldown: 300 });
    game.racer = i;
    if (keyHit('Escape', 'Backspace')) { sfx.uiBack(); goTo('title'); return; }
    if (keyHit('Enter', 'Space') || (input.click && uiOver('go'))) {
      save.racer = game.racer; writeSave(); sfx.uiSelect();
      const lvl = practice ? game.practiceLevel : 0;
      startRun(game.mode, lvl);
      goTo('intro', () => startLevelScene(lvl));
    }
  },
  draw(c) {
    applyCamera(); renderWorld(c); groundWash(c, 0.78);
    blockText(c, 'PICK YOUR SHIP', W / 2, 26, 6, { align: 'center', color: YEL, outline: 4, outlineColor: INK, shadow: 8, shadowColor: PNK });
    const cw = 262, ch = 196, gx = W / 2 - (cw * 4 + 18 * 3) / 2, gy = 96;
    for (let k = 0; k < 8; k++) {
      const x = gx + (k % 4) * (cw + 18), y = gy + Math.floor(k / 4) * (ch + 18);
      const sel = k === game.racer;
      const d = RACERS[k];
      uiRect('card' + k, x, y, cw, ch);
      if (sel) { c.fillStyle = PNK; c.fillRect(x + 7, y + 7, cw, ch); }
      // each card is a manga panel: a speed-line burst behind the ship
      c.save(); c.beginPath(); c.rect(x, y, cw, ch); c.clip();
      const g = c.createRadialGradient(x + cw / 2, y + 86, 10, x + cw / 2, y + 86, cw * 0.7);
      g.addColorStop(0, sel ? shade(d.color, 0.55) : '#1A1A26'); g.addColorStop(1, '#07070C');
      c.fillStyle = g; c.fillRect(x, y, cw, ch);
      if (sel) {
        c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2;
        const r = mulberry32(k * 31 + Math.floor(game.sceneT * 12));
        c.beginPath();
        for (let j = 0; j < 40; j++) { const a = r() * TAU, r0 = 40 + r() * 40; c.moveTo(x + cw / 2 + Math.cos(a) * r0, y + 86 + Math.sin(a) * r0); c.lineTo(x + cw / 2 + Math.cos(a) * 300, y + 86 + Math.sin(a) * 300); }
        c.stroke();
      }
      c.restore();
      strokeBox(c, x, y, cw, ch, sel ? 5 : 3, sel ? YEL : d.color);
      drawShip(c, d, x + cw / 2, y + 84 + (sel ? Math.sin(game.sceneT * 3) * 4 : 0), sel ? 150 : 124, { flap: sel ? (Math.sin(game.sceneT * 8) > 0.6 ? 1 : 0) : 0, t: game.sceneT + k, thrust: sel ? 1 : 0.4, speed: sel });
      blockText(c, String(k + 1), x + 14, y + 12, 3, { color: d.color });
      blockText(c, d.name, x + cw / 2, y + ch - 50, 3, { align: 'center', color: sel ? YEL : WHT });
      blockText(c, 'PILOT ' + d.pilot, x + cw / 2, y + ch - 24, 2, { align: 'center', color: CYN });
    }
    const d = RACERS[game.racer];
    const sy0 = gy + 2 * (ch + 18) + 4;
    plate(c, gx - 12, sy0 - 12, cw * 4 + 18 * 3 + 24, 92, d.color);
    STAT_NAMES.forEach((nm, j) => {
      const x = gx + j * 230;
      blockText(c, nm, x, sy0, 2, { color: CYN });
      for (let b = 0; b < 5; b++) { c.fillStyle = b < d.stats[j] ? d.color : '#22222C'; c.fillRect(x + b * 34, sy0 + 20, 28, 14); }
    });
    blockText(c, '"' + d.bark + '"', gx + 4 * 230 + 10, sy0 + 8, 2, { color: YEL });
    smallText(c, d.bio, W / 2, sy0 + 50, 18, WHT, 'center');
    const practice = game.mode === 'practice';
    const optLabel = practice ? 'PRACTICE: ' + (game.practiceLevel + 1) + ' ' + LEVELS[game.practiceLevel].name : 'FULL RUN: 5 LEVELS + BOSS';
    drawButton(c, 'opt', optLabel, W / 2 - 330, 626, 400, 44, game.selRow === 1, { arrows: practice, px: 2 });
    drawButton(c, 'go', 'FLY!', W / 2 + 90, 626, 240, 44, game.selRow === 2, { px: 3 });
    hudText(c, DIFFS[game.diff] + ' · ENTER TO FLY · ESC BACK', W / 2, 684, 2, CYN, 'center');
  },
};
