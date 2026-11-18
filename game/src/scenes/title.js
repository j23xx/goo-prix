// GOO PRIX · src/scenes/title.js — The start screen: logo, START RUN, the other modes, and a live demo flight.
'use strict';

// The start screen, built to read even as a thumbnail: on the left the logo, the pitch, the
// three difficulties, one big START RUN, the other modes and HOW A RUN GOES; on the right the
// key art, a ship hosing goo up at Mister Spotless; underneath, how you win and lose and the keys.
const DIFF_RULES = ['SLOWER · QUOTAS -25%', 'THE GAME AS MEANT', 'FASTER · QUOTAS +25%'];
const TITLE_LX = 352;   // the menu column's centre
function drawTitle(c, t) {
  applyCamera();
  renderWorld(c);
  groundWash(c, 0.86);
  drawTitleArt(c, 975, 262, t);
  const sel = TITLE_ITEMS[game.menu.i];
  drawLogo(c, TITLE_LX, 20, 13, t);
  label(c, 'A FLAP-AND-SPLAT SCORE ATTACK', TITLE_LX, 126, 27, AQUA, { align: 'center', outline: 3 });
  label(c, '5 WORLDS · 12 MIX-INS · 8 SHIPS · 1 BOSS', TITLE_LX, 162, 19, CREAM, { align: 'center', outline: 3 });
  // the three difficulties
  const cw = 184, x0 = TITLE_LX - (cw * 3 + 24) / 2;
  DIFFS.forEach((d, i) => {
    const x = x0 + i * (cw + 12), y = 196, on = game.diff === i;
    uiRect('diff' + i, x, y, cw, 54);
    c.save(); c.beginPath(); c.roundRect(x, y, cw, 54, 10); c.fillStyle = on ? 'rgba(255,194,26,0.16)' : 'rgba(11,9,30,0.85)'; c.fill();
    c.lineWidth = on ? 3 : 1.5; c.strokeStyle = on ? YEL : sel === 'diff' ? CREAM : 'rgba(255,246,224,0.25)'; c.stroke(); c.restore();
    label(c, (on && sel === 'diff' ? '< ' : '') + d + (on && sel === 'diff' ? ' >' : ''), x + cw / 2, y + 6, 22, on ? YEL : CREAM, { align: 'center' });
    label(c, DIFF_RULES[i], x + cw / 2, y + 33, 13, '#B9B4D8', { align: 'center', maxW: cw - 12 });
  });
  keyButton(c, 'start', 'ENTER', 'START RUN', x0, 266, cw * 3 + 24, 96, sel === 'start');
  const small = [['endless', 'ENDLESS SLOP'], ['practice', 'PRACTICE ' + (game.practiceLevel + 1) + ': ' + LEVELS[game.practiceLevel].name], ['howto', 'HOW TO PLAY']];
  small.forEach(([id, text], i) => {
    const x = x0 + i * (cw + 12), arrows = sel === id && id === 'practice';
    drawButton(c, id, '', x, 378, cw, 44, sel === id);
    label(c, (arrows ? '< ' : '') + text + (arrows ? ' >' : ''), x + cw / 2, 390, 17, sel === id ? INK : CREAM, { align: 'center', maxW: cw - 14 });
  });
  label(c, 'HOW A RUN GOES', x0, 434, 15, AQUA, { outline: 2 });
  drawHowARunGoes(c, x0, 456, cw * 3 + 24, 112, t);
  // how you win and lose, and the keys, across the bottom
  const win = 'CLEAR 5 WORLDS, THEN THE BOSS', lose = 'MISS A QUOTA WITH NO CONTINUES LEFT';
  const ww = pillWidth(c, 'WIN', win, 32), lw = pillWidth(c, 'LOSE', lose, 32);
  pill(c, W / 2 - (ww + 14 + lw) / 2, 590, 'WIN', win, GOO_C, 32);
  pill(c, W / 2 - (ww + 14 + lw) / 2 + ww + 14, 590, 'LOSE', lose, RED, 32);
  drawKeyLegend(c, FLIGHT_KEYS.concat([[['M'], save.muted ? 'SOUND OFF' : 'SOUND'], [['ESC'], 'PAUSE']]), W / 2, 640, 32, 'center');
  // best scores, top right
  label(c, save.bestCup ? 'BEST RUN ' + fmtScore(save.bestCup) : 'NO RUN FINISHED YET', W - 24, 16, 18, YEL, { align: 'right', outline: 2 });
  DIFFS.forEach((d, k) => drawGradeBadge(c, W - 128 + k * 42, 56, 16, save.trophies['run:' + k] || null));
  const top = (save.endless || [])[0];
  label(c, top ? 'ENDLESS BEST ' + fmtScore(top.score) : 'ENDLESS: NO RUN YET', W - 24, 80, 14, MAG, { align: 'right', outline: 2 });
}

// ---- the key art: Mister Spotless under a spotlight, a ship below hosing a stream of goo into his cheek
// (built on first use: boss.js loads after this file)
let TITLE_BOSS = null;
function titleBoss() {
  return TITLE_BOSS || (TITLE_BOSS = bossDummy({
    filth: 12, phase: 2, maw: 0.75,
    splats: [[-5.4, 1.8, 0.7], [-4.4, 3.1, 0.5], [-5.1, -1.6, 0.55], [5.3, -1.5, 0.6], [5.2, 2.4, 0.5], [-2.9, -4.1, 0.45], [2.8, -4.2, 0.45]]
      .map(([x, y, r], i) => ({ x, y, r, seed: 60 + i, t0: -9 })),
  }));
}
function drawTitleArt(c, x, y, t) {
  const k = 21, b = titleBoss();
  // a spotlight behind him
  const g = c.createRadialGradient(x, y, 20, x, y, 340);
  g.addColorStop(0, 'rgba(255,79,216,0.55)'); g.addColorStop(0.5, 'rgba(255,79,216,0.3)'); g.addColorStop(0.78, 'rgba(127,242,255,0.12)'); g.addColorStop(1, 'rgba(127,242,255,0)');
  c.fillStyle = g; c.fillRect(x - 360, y - 360, 720, 720);
  b.armT = t;
  drawBossAt(c, b, x, y + Math.sin(t * 1.3) * 6, k, t, Math.sin(t * 0.7) * 0.03);
  // the ship, from behind, and its goo arcing up into his left cheek
  const sx = x - 120, sy = 500 + Math.sin(t * 2.1) * 5;
  const [cu, cv] = BOSS.stains[0], ex = x + cu * k, ey = y - cv * k;
  for (let i = 0; i < 7; i++) {
    const f = ((i + t * 2.2) % 7) / 7;
    const px = lerp(lerp(sx, sx - 70, f), lerp(sx - 70, ex, f), f), py = lerp(lerp(sy - 50, sy - 170, f), lerp(sy - 170, ey, f), f);
    gooBlob(c, px, py, 17 - f * 9, i * 3, t);
  }
  gooSplat(c, ex, ey, 26, 7, 0.95, 0.6);
  drawShip(c, RACERS[1], sx, sy, 200, { t, thrust: 1 });
  label(c, 'MISTER SPOTLESS', x + 150, y + 118, 20, CREAM, { align: 'center', outline: 3 });
  label(c, 'THE BOSS', x + 150, y + 142, 14, MAG, { align: 'center', outline: 2 });
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
const TITLE_ITEMS = ['diff', 'start', 'endless', 'practice', 'howto'];
function makeAttract() { reseed(4242); setupLevel(0, { attract: true }); world.state = 'run'; startGo(); }

SCENES.title = {
  enter() { makeAttract(); MUSIC.play(SONGS.title); game.menu.i = 1; },
  update(dt) {
    raceStep(dt); updateCamera(dt);
    const sel = menuNav(game.menu, TITLE_ITEMS);
    const cur = TITLE_ITEMS[game.menu.i];
    const lr = keyHit('ArrowLeft', 'KeyA') ? -1 : keyHit('ArrowRight', 'KeyD') ? 1 : 0;
    if (lr && cur === 'diff') { game.diff = (game.diff + 3 + lr) % 3; save.difficulty = game.diff; writeSave(); sfx.uiMove(); }
    if (lr && cur === 'practice') { game.practiceLevel = (game.practiceLevel + LEVELS.length + lr) % LEVELS.length; sfx.uiMove(); }
    if (input.click) for (let i = 0; i < 3; i++) if (uiOver('diff' + i)) { game.diff = i; save.difficulty = i; writeSave(); sfx.uiMove(); }
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
