// GOO PRIX · src/scenes/title.js — The start screen: logo, START RUN, the other modes, and a live demo flight.
'use strict';

// The start screen: logo and premise, the three difficulties, one big START RUN, the other
// modes, HOW A RUN GOES in four cards, how you win and lose, and every control as a key.
const DIFF_RULES = ['SLOWER · QUOTAS -25%', 'THE GAME AS MEANT', 'FASTER · QUOTAS +25%'];
function drawTitle(c, t) {
  applyCamera();
  renderWorld(c);
  groundWash(c, 0.88);
  const sel = TITLE_ITEMS[game.menu.i];
  drawLogo(c, W / 2, 12, 12, t);
  label(c, 'A FLAP-AND-SPLAT SCORE ATTACK', W / 2, 104, 22, AQUA, { align: 'center' });
  label(c, 'FLY A GOO-FIRING SHIP THROUGH FIVE WORLDS THAT BREAK THEIR OWN RULES, THEN MAKE MISTER SPOTLESS FILTHY', W / 2, 132, 16, CREAM, { align: 'center' });
  // the three difficulties
  DIFFS.forEach((d, i) => {
    const cw = 236, x = W / 2 - (cw * 3 + 28) / 2 + i * (cw + 14), y = 160, on = game.diff === i;
    uiRect('diff' + i, x, y, cw, 58);
    c.save(); c.beginPath(); c.roundRect(x, y, cw, 58, 10); c.fillStyle = on ? 'rgba(255,194,26,0.14)' : 'rgba(11,9,30,0.82)'; c.fill();
    c.lineWidth = on ? 3 : 1.5; c.strokeStyle = on ? YEL : sel === 'diff' ? CREAM : 'rgba(255,246,224,0.25)'; c.stroke(); c.restore();
    label(c, d, x + cw / 2, y + 7, 22, on ? YEL : CREAM, { align: 'center' });
    label(c, DIFF_RULES[i], x + cw / 2, y + 34, 14, '#B9B4D8', { align: 'center' });
  });
  if (sel === 'diff') label(c, '← →', W / 2 + 380, 178, 18, YEL);
  keyButton(c, 'start', 'ENTER', 'START RUN', W / 2 - 280, 230, 560, 74, sel === 'start');
  const small = [['endless', 'ENDLESS SLOP'], ['practice', 'PRACTICE ' + (game.practiceLevel + 1) + ': ' + LEVELS[game.practiceLevel].name], ['howto', 'HOW TO PLAY']];
  small.forEach(([id, text], i) => {
    const bw = 300, x = W / 2 - (bw * 3 + 24) / 2 + i * (bw + 12);
    drawButton(c, id, '', x, 316, bw, 42, sel === id);
    label(c, (sel === id && id === 'practice' ? '< ' : '') + text + (sel === id && id === 'practice' ? ' >' : ''), x + bw / 2, 327, 18, sel === id ? INK : CREAM, { align: 'center', maxW: bw - 16 });
  });
  label(c, 'HOW A RUN GOES', 40, 372, 16, AQUA);
  drawHowARunGoes(c, 40, 394, W - 80, 168, t);
  // how you win and lose, and the keys
  const win = 'CLEAR 5 WORLDS, THEN THE BOSS', lose = 'MISS A QUOTA WITH NO CONTINUES LEFT';
  const ww = pillWidth(c, 'WIN', win, 28), lw = pillWidth(c, 'LOSE', lose, 28);
  pill(c, W / 2 - (ww + 12 + lw) / 2, 574, 'WIN', win, GOO_C, 28);
  pill(c, W / 2 - (ww + 12 + lw) / 2 + ww + 12, 574, 'LOSE', lose, RED, 28);
  drawKeyLegend(c, FLIGHT_KEYS, W / 2, 618, 30, 'center');
  label(c, '8 SHIPS · 12 MIX-INS · 3 DIFFICULTIES · ENDLESS MODE · M SOUND · ESC PAUSE', W / 2, 664, 15, '#9D97C4', { align: 'center' });
  // best scores, top right; sound, top left
  label(c, save.bestCup ? 'BEST RUN ' + fmtScore(save.bestCup) : 'NO RUN FINISHED YET', W - 24, 16, 18, YEL, { align: 'right' });
  DIFFS.forEach((d, k) => drawGradeBadge(c, W - 128 + k * 42, 56, 16, save.trophies['run:' + k] || null));
  const top = (save.endless || [])[0];
  label(c, top ? 'ENDLESS BEST ' + fmtScore(top.score) : 'ENDLESS: NO RUN YET', W - 24, 80, 14, MAG, { align: 'right' });
  keycap(c, 'M', 24, 16, 26); label(c, save.muted ? 'SOUND OFF' : 'SOUND ON', 58, 21, 15, CREAM);
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
