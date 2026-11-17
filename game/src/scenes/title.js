// GOO PRIX · src/scenes/title.js — The start screen: logo, START RUN, the other modes, and a live demo flight.
'use strict';

// The start screen: a live flight through Breakfast Bay, the logo, one big START RUN, the
// other modes beneath it, what is in the game, and the keys.
function drawTitle(c, t) {
  applyCamera();
  renderWorld(c);
  drawPlayerCraft(c);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(11,11,18,0.55)'); g.addColorStop(0.45, 'rgba(11,11,18,0.15)'); g.addColorStop(1, 'rgba(11,11,18,0.6)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  drawLogo(c, W / 2, 30, 16, t);
  hudText(c, 'A FLAP-AND-SPLAT SCORE ATTACK', W / 2, 166, 3, WHT, 'center');
  // the big one, then the rest smaller underneath
  const labels = {
    start: 'START RUN', endless: 'ENDLESS SLOP',
    practice: 'PRACTICE ' + (game.practiceLevel + 1) + ': ' + LEVELS[game.practiceLevel].name,
    diff: DIFFS[game.diff], howto: 'HOW TO PLAY',
  };
  const sel = game.menu.i;
  drawButton(c, 'start', labels.start, W / 2 - 290, 214, 580, 84, sel === 0, { px: 7 });
  const small = [['endless', W / 2 - 290, 314, 284], ['practice', W / 2 + 6, 314, 284], ['diff', W / 2 - 290, 370, 284], ['howto', W / 2 + 6, 370, 284]];
  small.forEach(([id, x, y, w]) => drawButton(c, id, (id === 'diff' ? 'DIFFICULTY: ' : '') + labels[id], x, y, w, 46, TITLE_ITEMS[sel] === id, { px: 2, arrows: id === 'diff' || id === 'practice' }));
  // what is inside, in one line
  plate(c, W / 2 - 400, 444, 800, 54, CYN);
  hudText(c, '5 WORLDS · 1 BOSS · 8 SHIPS · 12 MIX-INS · ENDLESS', W / 2, 460, 3, CREAM, 'center');
  // best scores, small, in the corner
  hudText(c, save.bestCup ? 'BEST RUN ' + fmtScore(save.bestCup) : 'NO RUN FINISHED YET', 24, 528, 2, YEL);
  DIFFS.forEach((d, k) => drawGradeBadge(c, 40 + k * 46, 576, 18, save.trophies['run:' + k] || null));
  const top = (save.endless || [])[0];
  hudText(c, top ? 'ENDLESS BEST ' + fmtScore(top.score) : 'ENDLESS: NO RUN YET', W - 24, 528, 2, MAG, 'right');
  // the keys, on their own band
  c.fillStyle = '#000'; c.fillRect(0, 648, W, 72);
  c.fillStyle = YEL; c.fillRect(0, 648, W, 3);
  blockText(c, '↑ FLAP   ← → STEER   SPACE GOO   X ITEM', W / 2, 668, 4, { align: 'center', color: '#fff' });
}

// ---- the logo: giant cream blocks with an orange extrude and a goo drip off the second O
function drawLogo(c, lx, ly, px, t) {
  blockText(c, 'GOO PRIX', lx, ly, px, { align: 'center', color: CREAM, outline: 7, outlineColor: INK, shadow: 13, shadowColor: PNK, skew: 0.08 });
  const w0 = textWidth('GOO PRIX', px);
  const ox = lx - w0 / 2 + 2 * 6 * px + 2.5 * px;
  const drip = 8 + 14 * (0.5 + 0.5 * Math.sin(t * 1.6));
  c.beginPath(); c.roundRect(ox - px * 0.6, ly + 7 * px - 4, px * 1.2, drip + 4, px * 0.5);
  gooShade(c, ox, ly + 7 * px + drip / 2, px * 1.2);
  gooBlob(c, ox, ly + 7 * px + drip, px * 0.8, 7, t);
}

// ---- TITLE: a live attract flight behind a giant logo and the main menu
const TITLE_ITEMS = ['start', 'endless', 'practice', 'diff', 'howto'];
function makeAttract() { reseed(4242); setupLevel(0, { attract: true }); world.state = 'run'; startGo(); }

SCENES.title = {
  enter() { makeAttract(); MUSIC.play(SONGS.title); game.menu.i = Math.min(game.menu.i, TITLE_ITEMS.length - 1); },
  update(dt) {
    raceStep(dt); updateCamera(dt);
    const sel = menuNav(game.menu, TITLE_ITEMS);
    const cur = TITLE_ITEMS[game.menu.i];
    const lr = keyHit('ArrowLeft', 'KeyA') ? -1 : keyHit('ArrowRight', 'KeyD') ? 1 : 0;
    if (lr && cur === 'diff') { game.diff = (game.diff + 3 + lr) % 3; save.difficulty = game.diff; writeSave(); sfx.uiMove(); }
    if (lr && cur === 'practice') { game.practiceLevel = (game.practiceLevel + LEVELS.length + lr) % LEVELS.length; sfx.uiMove(); }
    if (sel < 0) return;
    const id = TITLE_ITEMS[sel];
    sfx.uiSelect();
    if (id === 'start') { game.mode = 'campaign'; goTo('select'); }
    else if (id === 'endless') { game.mode = 'endless'; goTo('select'); }
    else if (id === 'practice') { game.mode = 'practice'; goTo('select'); }
    else if (id === 'diff') { game.diff = (game.diff + 1) % 3; save.difficulty = game.diff; writeSave(); }
    else if (id === 'howto') goTo('howto');
  },
  draw(c) { drawTitle(c, game.sceneT); },
};
