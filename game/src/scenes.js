// GOO PRIX · src/scenes.js — Title, select, how-to, intro, level, pause, results and end screens.
'use strict';

// ============================================================================================
// SCENES — title, select, how-to, intro, race (+pause), results, standings, podium, game over
// ============================================================================================
const UI = { rects: new Map() };
function uiRect(id, x, y, w, h) { UI.rects.set(id, [x, y, w, h]); }
function uiOver(id) {
  const r = UI.rects.get(id);
  return !!r && input.mouseIn && input.mx >= r[0] && input.mx <= r[0] + r[2] && input.my >= r[1] && input.my <= r[1] + r[3];
}
function menuNav(state, ids) {
  const n = ids.length;
  if (keyHit('ArrowUp', 'KeyW')) { state.i = (state.i + n - 1) % n; sfx.uiMove(); }
  if (keyHit('ArrowDown', 'KeyS')) { state.i = (state.i + 1) % n; sfx.uiMove(); }
  if (input.moved) for (let k = 0; k < n; k++) if (uiOver(ids[k]) && state.i !== k) { state.i = k; sfx.uiMove(); }
  if (keyHit('Enter', 'Space', 'NumpadEnter')) return state.i;
  if (input.click) for (let k = 0; k < n; k++) if (uiOver(ids[k])) { state.i = k; return k; }
  return -1;
}
function drawButton(c, id, label, x, y, w, h, selected, opts) {
  uiRect(id, x, y, w, h);
  const o = opts || {};
  if (selected) {
    c.fillStyle = PNK; c.fillRect(x + 5, y + 5, w, h);   // hard pink offset shadow
    c.fillStyle = YEL; c.fillRect(x, y, w, h);
    strokeBox(c, x, y, w, h, 3, INK);
  } else { c.fillStyle = 'rgba(11,11,18,0.88)'; c.fillRect(x, y, w, h); strokeBox(c, x, y, w, h, 2, o.dim ? '#3a3a44' : CREAM); }
  const px = o.px || 3;
  blockText(c, label, x + w / 2, y + h / 2 - px * 3.5, px, { align: 'center', color: selected ? INK : o.dim ? '#5a5a66' : WHT });
  if (selected && o.arrows) {
    blockText(c, '<', x + 14, y + h / 2 - px * 3.5, px, { color: INK });
    blockText(c, '>', x + w - 14, y + h / 2 - px * 3.5, px, { align: 'right', color: INK });
  }
}
function smallText(c, text, x, y, size, color, align) {
  c.font = '600 ' + size + 'px "Chakra Petch", "Bahnschrift", "DIN Alternate", "Avenir Next Condensed", "Trebuchet MS", sans-serif';
  c.fillStyle = color || '#909090'; c.textAlign = align || 'left'; c.textBaseline = 'top';
  c.fillText(text, x, y);
}
function dim(c, a) { c.fillStyle = 'rgba(0,0,0,' + a + ')'; c.fillRect(0, 0, W, H); }

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

function startRaceScene(trackIdx) {
  reseed(1000 + trackIdx * 31 + (game.cup ? game.cup.race * 7 : 0) + Math.floor(rand() * 1000));
  setupRace(trackIdx);
  MUSIC.play(TRACK.def.song);
}

// ---- TITLE: a live attract race behind a giant logo and the main menu
const TITLE_ITEMS = ['start', 'quick', 'diff', 'howto'];
function makeAttract() { reseed(4242); setupRace(3, { attract: true }); world.state = 'run'; startGo(); }

const SCENES = {
  title: {
    enter() { makeAttract(); MUSIC.play(SONGS.title); game.menu.i = Math.min(game.menu.i, TITLE_ITEMS.length - 1); },
    update(dt) {
      raceStep(dt); updateCamera(dt);
      if (world.player.dist > CFG.laps * TRACK.L + 200) makeAttract();
      const sel = menuNav(game.menu, TITLE_ITEMS);
      const cur = TITLE_ITEMS[game.menu.i];
      const lr = keyHit('ArrowLeft', 'KeyA') ? -1 : keyHit('ArrowRight', 'KeyD') ? 1 : 0;
      if (lr && cur === 'diff') { game.diff = (game.diff + 3 + lr) % 3; save.difficulty = game.diff; writeSave(); sfx.uiMove(); }
      if (sel < 0) return;
      const id = TITLE_ITEMS[sel];
      sfx.uiSelect();
      if (id === 'start') { game.cupMode = 'cup'; goTo('select'); }
      else if (id === 'quick') { game.cupMode = 'quick'; goTo('select'); }
      else if (id === 'diff') { game.diff = (game.diff + 1) % 3; save.difficulty = game.diff; writeSave(); }
      else if (id === 'howto') goTo('howto');
    },
    draw(c) {
      applyCamera();
      renderWorld(c);
      dim(c, 0.38);
      // the logo: giant yellow blocks with a pink extrude, one goo drip off the second O
      const lx = W / 2, ly = 62, px = 17;
      blockText(c, 'GOO PRIX', lx, ly, px, { align: 'center', color: CREAM, outline: 7, outlineColor: INK, shadow: 13, shadowColor: PNK, skew: 0.08 });
      const w0 = textWidth('GOO PRIX', px);
      const ox = lx - w0 / 2 + 2 * 6 * px + 2.5 * px - 7 * px * 0.08 * 0;
      const drip = 8 + 14 * (0.5 + 0.5 * Math.sin(game.sceneT * 1.6));
      c.fillStyle = GOO_C;
      c.fillRect(ox - px * 0.6, ly + 7 * px - 2, px * 1.2, drip);
      c.beginPath(); c.arc(ox, ly + 7 * px + drip, px * 0.75, 0, TAU); c.fill();
      hudText(c, 'A FLAP-AND-SPLAT GRAND PRIX', lx, ly + 7 * px + 38, 3, WHT, 'center');
      hudText(c, 'FLAP THROUGH EVERY WINDOW · SPLAT RIVALS · WIN 5 RACES', lx, ly + 7 * px + 74, 2, CYN, 'center');
      const labels = {
        start: game.mirror || save.unlockedMirror ? 'START CUP' : 'START CUP',
        quick: 'QUICK RACE',
        diff: 'DIFFICULTY: ' + DIFFS[game.diff],
        howto: 'HOW TO PLAY',
      };
      const bw = 420, bh = 44, bx = W / 2 - bw / 2;
      TITLE_ITEMS.forEach((id, i) => drawButton(c, id, labels[id], bx, 318 + i * 58, bw, bh, game.menu.i === i, { arrows: id === 'diff' }));
      // best line and trophies
      const best = save.bestCup ? 'BEST CUP ' + save.bestCup.toLocaleString('en-US') : 'NO CUP WON YET';
      hudText(c, best, W / 2, 582, 3, YEL, 'center');
      let tx = W / 2 - 3.2 * 48;
      let won = 0;
      for (const cupName of ['gloop', 'regloop']) for (let d = 0; d < 3; d++) {
        const tr = save.trophies[cupName + ':' + d];
        if (tr) won++;
        drawTrophy(c, tx, 628, 26, tr ? 4 - tr : 0);
        tx += 48;
      }
      hudText(c, 'CUPS ' + won + '/6', tx - 10, 620, 2, CYN);
      // the controls strip, on its own solid band
      c.fillStyle = '#000'; c.fillRect(0, 664, W, 56);
      c.fillStyle = '#262626'; c.fillRect(0, 664, W, 2);
      blockText(c, '↑ FLAP    ← → STEER    ↓ DIVE    SPACE SHOOT    X ITEM    ESC PAUSE', W / 2, 684, 2, { align: 'center', color: '#fff' });
    },
  },

  howto: {
    update() {
      if (keyHit('Escape', 'Enter', 'Space', 'Backspace') || input.click) { sfx.uiBack(); goTo('title'); }
    },
    draw(c) {
      applyCamera(); renderWorld(c); dim(c, 0.82);
      blockText(c, 'HOW TO PLAY', W / 2, 40, 7, { align: 'center', color: YEL, outline: 4, outlineColor: INK, shadow: 9, shadowColor: PNK });
      const rows = [
        ['FLAP', '↑  (OR W)', 'FLY THROUGH THE ICING-RIMMED WINDOW IN EVERY WALL. MISS AND YOU BONK.'],
        ['STEER', '← →  (OR A / D)', 'THE DASHED LINE ON THE FLOOR IS THE RACING LINE.'],
        ['DIVE', 'HOLD ↓', 'DIVE, THEN FLAP RIGHT AFTER: SWOOP BOOST. LONGER DIVE, BIGGER BOOST.'],
        ['SHOOT', 'SPACE  (HOLD TO KEEP FIRING)', 'AUTO-AIMS AT THE RIVAL AHEAD. GOO SLOWS THEM RIGHT DOWN.'],
        ['ITEM', 'X  (OR SHIFT)', 'FLY INTO JELLY CUBES FOR ITEMS. THE GOLD ONE ROLLS BETTER.'],
        ['RINGS', 'FLY THROUGH', 'DIAMOND RINGS BOOST YOU. SQUARE BALLS ARE COINS: +1% TOP SPEED EACH.'],
      ];
      rows.forEach((r, i) => {
        const y = 130 + i * 62;
        blockText(c, r[0], 120, y, 4, { color: '#fff' });
        blockText(c, r[1], 330, y, 2, { color: CYN });
        smallText(c, r[2], 330, y + 22, 18, '#c8c8c8');
      });
      const items = Object.keys(ITEMS);
      items.forEach((it, i) => {
        const x = 60 + (i % 5) * 236, y = 516 + Math.floor(i / 5) * 70;
        strokeBox(c, x, y, 54, 54, 2, '#585858');
        drawItemIcon(c, it, x + 27, y + 27, 46);
        blockText(c, ITEMS[it].name, x + 66, y + 20, 2, { color: '#fff' });
      });
      blockText(c, 'TOP 5 TO QUALIFY. 6TH OR WORSE COSTS A RETRY. RUN OUT AND IT IS GAME OVER.', W / 2, 676, 2, { align: 'center', color: '#909090' });
    },
  },

  select: {
    enter() { game.selRow = 0; if (!world || !world.attract) makeAttract(); },
    update(dt) {
      raceStep(dt); updateCamera(dt);
      const quick = game.cupMode === 'quick';
      let i = game.racer;
      if (keyHit('ArrowRight', 'KeyD')) { if (game.selRow === 0) i = (i + 1) % 8; else if (game.selRow === 1 && quick) game.quickTrack = (game.quickTrack + 1) % 5; else if (game.selRow === 1) game.mirror = save.unlockedMirror ? !game.mirror : false; sfx.uiMove(); }
      if (keyHit('ArrowLeft', 'KeyA')) { if (game.selRow === 0) i = (i + 7) % 8; else if (game.selRow === 1 && quick) game.quickTrack = (game.quickTrack + 4) % 5; else if (game.selRow === 1) game.mirror = save.unlockedMirror ? !game.mirror : false; sfx.uiMove(); }
      if (keyHit('ArrowDown', 'KeyS')) { if (game.selRow === 0 && i < 4) i += 4; else game.selRow = Math.min(2, game.selRow + 1); sfx.uiMove(); }
      if (keyHit('ArrowUp', 'KeyW')) { if (game.selRow > 0) game.selRow--; else if (i >= 4) i -= 4; sfx.uiMove(); }
      if (input.moved) for (let k = 0; k < 8; k++) if (uiOver('card' + k) && i !== k) { i = k; game.selRow = 0; sfx.uiMove(); }
      if (input.click) {
        for (let k = 0; k < 8; k++) if (uiOver('card' + k)) { i = k; game.selRow = 0; }
        if (uiOver('opt')) { if (quick) game.quickTrack = (game.quickTrack + 1) % 5; else game.mirror = save.unlockedMirror ? !game.mirror : false; sfx.uiMove(); }
      }
      game.racer = i;
      if (keyHit('Escape', 'Backspace')) { sfx.uiBack(); goTo('title'); return; }
      if (keyHit('Enter', 'Space') || (input.click && uiOver('go'))) {
        save.racer = game.racer; writeSave(); sfx.uiSelect();
        startCup(game.cupMode);
        goTo('intro', () => startRaceScene(game.cup.tracks[0]));
      }
    },
    draw(c) {
      applyCamera(); renderWorld(c); dim(c, 0.5);
      blockText(c, 'PICK YOUR IDIOT', W / 2, 34, 6, { align: 'center', color: YEL, outline: 4, outlineColor: INK, shadow: 8, shadowColor: PNK });
      const cw = 262, ch = 196, gx = W / 2 - (cw * 4 + 18 * 3) / 2, gy = 110;
      for (let k = 0; k < 8; k++) {
        const x = gx + (k % 4) * (cw + 18), y = gy + Math.floor(k / 4) * (ch + 18);
        const sel = k === game.racer;
        uiRect('card' + k, x, y, cw, ch);
        if (sel) { c.fillStyle = PNK; c.fillRect(x + 7, y + 7, cw, ch); }
        c.fillStyle = 'rgba(11,11,18,0.9)'; c.fillRect(x, y, cw, ch);
        strokeBox(c, x, y, cw, ch, sel ? 5 : 3, sel ? YEL : RACERS[k].color);
        drawRacerArt(c, RACERS[k], x + cw / 2, y + 82, sel ? 118 : 96, { color: INK, fill: RACERS[k].color, flap: sel ? (Math.sin(game.sceneT * 8) > 0.6 ? 1 : 0) : 0, t: game.sceneT, mini: false });
        blockText(c, String(k + 1), x + 14, y + 12, 3, { color: RACERS[k].color });
        blockText(c, RACERS[k].name, x + cw / 2, y + ch - 34, 3, { align: 'center', color: sel ? YEL : WHT });
      }
      // stats and bio of the highlighted racer
      const d = RACERS[game.racer];
      const sy0 = gy + 2 * (ch + 18) + 6;
      plate(c, gx - 12, sy0 - 12, cw * 4 + 18 * 3 + 24, 92, d.color);
      ['SPEED', 'FLAP', 'GOO', 'WEIGHT'].forEach((nm, j) => {
        const x = gx + j * 230;
        blockText(c, nm, x, sy0, 2, { color: CYN });
        for (let b = 0; b < 5; b++) { c.fillStyle = b < d.stats[j] ? d.color : '#22222C'; c.fillRect(x + b * 34, sy0 + 20, 28, 14); }
      });
      smallText(c, d.bio, W / 2, sy0 + 50, 18, WHT, 'center');
      const quick = game.cupMode === 'quick';
      const optLabel = quick ? 'TRACK: ' + TRACKS[game.quickTrack].name : (game.mirror ? 'REGLOOP CUP (MIRROR)' : 'THE GLOOP CUP · 5 RACES') + (save.unlockedMirror ? '' : '');
      drawButton(c, 'opt', optLabel, W / 2 - 300, 632, 360, 44, game.selRow === 1, { arrows: quick || save.unlockedMirror, px: 2 });
      drawButton(c, 'go', 'RACE!', W / 2 + 80, 632, 220, 44, game.selRow === 2, { px: 3 });
      hudText(c, DIFFS[game.diff] + ' · ESC BACK', W / 2, 688, 2, CYN, 'center');
    },
  },

  intro: {
    enter() { world.introT = 0; },
    update(dt) {
      world.introT += dt;
      world.t += dt; updateThings(TRACK, world.t, dt);
      if (world.introT > 2.8 || keyHit('Enter', 'Space', 'Escape') || input.click) enterScene('race');
    },
    draw(c) {
      const p = world.player;
      const e = smooth01(world.introT / 2.6);
      world.camU = lerp(0, p.u, e); world.camV = lerp(12.5, p.v + CFG.camUp, e);
      applyCamera(p.dist - lerp(46, CFG.camBack, e));
      renderWorld(c);
      if (e > 0.85) drawPlayerCraft(c);
      const k = smooth01(world.introT / 0.35);
      const def = TRACK.def;
      const cup = game.cup;
      c.save(); c.translate((1 - k) * -600, 0);
      c.fillStyle = PNK; c.fillRect(0, 222, W * 0.78, 96);
      c.fillStyle = YEL; c.fillRect(0, 214, W * 0.78, 96);
      blockText(c, (TRACK.mirror < 0 ? 'MIRROR ' : '') + def.name, 70, 228, 10, { color: INK, skew: 0.12 });
      c.restore();
      hudText(c, cup.mode === 'cup' ? 'RACE ' + (cup.race + 1) + '/5' : 'QUICK RACE', 70, 336, 4, WHT);
      plate(c, 56, 372, Math.min(W - 112, 40 + def.tip.length * 11), 40, CYN);
      smallText(c, def.tip, 72, 382, 20, WHT);
      hudText(c, 'ENTER TO SKIP', W - 40, H - 40, 2, CYN, 'right');
    },
  },

  race: {
    enter() { if (world.state === 'countdown') world.countdown = 3.2; world.lastBeep = 4; },
    update(dt) {
      if (keyHit('Escape', 'KeyP')) togglePause();
      if (keyHit('KeyM')) AU.setMuted(!save.muted);
      if (game.paused) { pauseUpdate(); return; }
      if (keyHit('KeyR')) { restartRace(); return; }
      if (world.hitstop > 0) { world.hitstop -= dt; return; }
      raceStep(dt);
      updateCamera(dt);
    },
    draw(c) {
      applyCamera();
      renderWorld(c);
      drawPlayerCraft(c);
      drawSpeedDashes(c);
      drawWindscreen(c);
      drawHUD(c);
      drawPopups(c);
      if (world.state === 'countdown') {
        const n = Math.ceil(world.countdown);
        if (n <= 3 && n >= 1) {
          const f = world.countdown - Math.floor(world.countdown);
          c.save(); c.translate(W / 2, 300); const sc = 0.8 + f * 0.5; c.scale(sc, sc);
          blockText(c, String(n), 0, -84, 24, { align: 'center', color: YEL, outline: 8, outlineColor: INK, shadow: 14, shadowColor: PNK });
          c.restore();
        }
      }
      if (!game.paused) drawCrosshair(c);
      if (world.flash > 0) { c.globalCompositeOperation = 'difference'; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
      if (world.flash2 > 0) { c.globalAlpha = world.flash2 * 1.2; c.fillStyle = CREAM; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      if (game.paused) drawPause(c);
    },
  },

  results: {
    enter() { game.resMenu = { i: 0 }; MUSIC.play(SONGS.results); if (!game.lastResults.dnq && game.lastResults.pos < 3) sfx.fanfare(); else if (game.lastResults.dnq) sfx.sad(); },
    update(dt) {
      world.t += dt; updateParts(dt);
      const res = game.lastResults, cup = game.cup;
      const opts = resultOptions(res, cup);
      const sel = menuNav(game.resMenu, opts.map((o) => o.id));
      if (sel < 0) return;
      sfx.uiSelect();
      opts[sel].go();
    },
    draw(c) {
      applyCamera(); renderWorld(c); dim(c, 0.55);
      drawResults(c, game.lastResults, game.sceneT);
    },
  },

  standings: {
    enter() { game.standMenu = { i: 0 }; },
    update(dt) {
      world.t += dt;
      const sel = menuNav(game.standMenu, ['next']);
      if (sel === 0) { sfx.uiSelect(); game.cup.race++; goTo('intro', () => startRaceScene(game.cup.tracks[game.cup.race])); }
    },
    draw(c) {
      applyCamera(); renderWorld(c); dim(c, 0.85);
      drawStandings(c, game.sceneT);
    },
  },

  podium: {
    enter() { game.podMenu = { i: 0 }; MUSIC.play(SONGS.podium); sfx.fanfare(); game.podPlace = finishCup(); },
    update(dt) {
      const sel = menuNav(game.podMenu, ['again', 'title']);
      if (sel === 0) { sfx.uiSelect(); startCup('cup'); goTo('intro', () => startRaceScene(0)); }
      if (sel === 1) { sfx.uiSelect(); goTo('title'); }
    },
    draw(c) { drawPodium(c, game.sceneT); },
  },

  gameover: {
    enter() { game.goMenu = { i: 0 }; MUSIC.play(SONGS.over); },
    update(dt) {
      const sel = menuNav(game.goMenu, ['retry', 'title']);
      if (sel === 0) { sfx.uiSelect(); startCup('cup'); goTo('intro', () => startRaceScene(0)); }
      if (sel === 1) { sfx.uiSelect(); goTo('title'); }
    },
    draw(c) { drawGameOver(c, game.sceneT); },
  },
};

function resultOptions(res, cup) {
  const opts = [];
  if (cup.mode === 'quick') {
    opts.push({ id: 'retry', label: 'RACE AGAIN', go: () => goTo('intro', () => startRaceScene(res.trackIdx)) });
    opts.push({ id: 'title', label: 'TITLE', go: () => goTo('title') });
    return opts;
  }
  if (res.dnq) {
    if (cup.tokens > 0) opts.push({ id: 'retry', label: 'RETRY (' + cup.tokens + ' LEFT)', go: () => { cup.tokens--; goTo('intro', () => startRaceScene(res.trackIdx)); } });
    else opts.push({ id: 'over', label: 'GAME OVER', go: () => goTo('gameover') });
    opts.push({ id: 'title', label: 'QUIT', go: () => goTo('title') });
    return opts;
  }
  if (cup.race < cup.tracks.length - 1) opts.push({ id: 'next', label: 'STANDINGS', go: () => goTo('standings') });
  else opts.push({ id: 'next', label: 'TO THE PODIUM', go: () => goTo('podium') });
  return opts;
}

function drawResults(c, res, t) {
  const cup = game.cup;
  hudText(c, res.dnq ? 'DID NOT QUALIFY' : 'RESULTS', 60, 34, 6, res.dnq ? PNK : YEL);
  hudText(c, TRACKS[res.trackIdx].name + (cup.mode === 'cup' ? '  ·  RACE ' + (cup.race + 1) + '/5' : ''), 60, 86, 2, CYN);
  // the table
  plate(c, 44, 108, 672, 8 * 58 + 14);
  res.order.forEach((row, i) => {
    const k = clamp((t - i * 0.06) / 0.25, 0, 1);
    const y = 120 + i * 58, x = 60 - (1 - smooth01(k)) * 500;
    const me = row.isPlayer;
    c.fillStyle = me ? YEL : 'rgba(255,255,255,0.05)'; c.fillRect(x, y, 640, 50);
    if (!me) { c.fillStyle = RACERS[row.idx].color; c.fillRect(x, y, 5, 50); }
    const ink = me ? INK : WHT;
    blockText(c, String(i + 1), x + 34, y + 11, 4, { align: 'center', color: ink });
    drawRacerArt(c, RACERS[row.idx], x + 98, y + 26, 40, { color: INK, fill: RACERS[row.idx].color, mini: true, t: 0 });
    blockText(c, RACERS[row.idx].name, x + 140, y + 18, 2, { color: ink });
    blockText(c, fmtTime(row.time), x + 470, y + 18, 2, { align: 'right', color: me ? INK : '#C8C8D0' });
    if (cup.mode === 'cup' && !res.dnq) blockText(c, '+' + row.pts, x + 620, y + 15, 3, { align: 'right', color: me ? INK : CYN });
  });
  // splat score breakdown, counting up
  const px0 = 740;
  plate(c, px0 - 16, 106, W - 60 - px0 + 32, 360);
  hudText(c, 'SPLAT SCORE', px0, 120, 3, YEL);
  res.lines.forEach((ln, i) => {
    const y = 156 + i * 30;
    const a = clamp((t - 0.4 - i * 0.12) / 0.2, 0, 1);
    c.globalAlpha = a;
    blockText(c, ln[0], px0, y, 2, { color: WHT });
    blockText(c, '+' + ln[1], W - 60, y, 2, { align: 'right', color: ln[1] ? CYN : '#5a5a66' });
    c.globalAlpha = 1;
  });
  const shown = Math.round(res.raceScore * clamp((t - 0.5) / 1.2, 0, 1));
  c.fillStyle = PNK; c.fillRect(px0, 156 + res.lines.length * 30 - 4, W - 60 - px0, 2);
  blockText(c, 'RACE TOTAL', px0, 156 + res.lines.length * 30 + 14, 2, { color: CYN });
  hudText(c, String(shown), W - 60, 156 + res.lines.length * 30 + 6, 7, YEL, 'right');
  if (res.newBestRace && !res.dnq && t > 1.6) {
    c.save(); c.translate(px0 + 112, 512); c.rotate(-0.12);
    const s = 1 + Math.max(0, 0.4 - (t - 1.6)) * 2;
    c.scale(s, s);
    c.fillStyle = INK; c.fillRect(-106, -22, 220, 52);
    c.fillStyle = PNK; c.fillRect(-112, -28, 220, 52);
    blockText(c, 'NEW BEST!', -2, -16, 4, { align: 'center', color: WHT });
    c.restore();
  }
  // mini standings
  if (cup.mode === 'cup' && !res.dnq) {
    const st = cupStandings().slice(0, 4);
    plate(c, px0 + 250, 476, W - 60 - px0 - 234, 102, CYN);
    blockText(c, 'CUP POINTS', px0 + 262, 484, 2, { color: CYN });
    st.forEach((idx, i) => blockText(c, (i + 1) + ' ' + RACERS[idx].name.split(' ').pop() + ' ' + cup.pts[idx], px0 + 262, 503 + i * 18, 2, { color: idx === game.racer ? YEL : WHT }));
  }
  const opts = resultOptions(res, cup);
  opts.forEach((o, i) => {
    let label = o.label;
    if (o.id === 'next' && cup.race < cup.tracks.length - 1) label = 'NEXT: ' + TRACKS[cup.tracks[cup.race + 1]].name + ' (' + (cup.race + 2) + '/5)';
    drawButton(c, o.id, label, px0, 584 + i * 56, W - 60 - px0, 46, game.resMenu.i === i, { px: 2 });
  });
}

function drawStandings(c, t) {
  const cup = game.cup;
  hudText(c, 'CUP STANDINGS', W / 2, 40, 6, YEL, 'center');
  hudText(c, 'AFTER RACE ' + (cup.race + 1) + ' OF 5', W / 2, 96, 2, CYN, 'center');
  const st = cupStandings();
  const maxPts = Math.max(15, ...cup.pts);
  plate(c, 160, 126, 960, 8 * 56 + 20);
  st.forEach((idx, i) => {
    const y = 140 + i * 56;
    const me = idx === game.racer;
    blockText(c, String(i + 1), 210, y + 10, 4, { align: 'right', color: me ? YEL : WHT });
    drawRacerArt(c, RACERS[idx], 262, y + 22, 40, { color: INK, fill: RACERS[idx].color, mini: true, t: 0 });
    blockText(c, RACERS[idx].name, 300, y + 14, 2, { color: me ? YEL : WHT });
    const bw = (cup.pts[idx] / maxPts) * 480 * smooth01(clamp((t - i * 0.05) / 0.6, 0, 1));
    c.fillStyle = INK; c.fillRect(538, y + 6, bw + 4, 30);
    c.fillStyle = me ? YEL : RACERS[idx].color; c.fillRect(540, y + 8, bw, 26);
    blockText(c, String(cup.pts[idx]), 540 + bw + 14, y + 12, 3, { color: WHT });
  });
  const next = TRACKS[cup.tracks[cup.race + 1]];
  drawButton(c, 'next', 'NEXT: ' + next.name, W / 2 - 240, 610, 480, 50, true, { px: 3 });
}

function drawTrophy(c, x, y, s, tier) {
  // tier 3 gold, 2 silver, 1 bronze, 0 empty slot
  c.save(); c.translate(x, y);
  c.lineWidth = Math.max(2, s * 0.08);
  c.strokeStyle = tier ? '#fff' : '#3a3a3a';
  c.fillStyle = tier === 3 ? '#fff' : tier === 2 ? '#909090' : tier === 1 ? '#585858' : '#000';
  c.beginPath(); c.moveTo(-s * 0.4, -s * 0.5); c.lineTo(s * 0.4, -s * 0.5); c.lineTo(s * 0.3, -s * 0.05); c.quadraticCurveTo(0, s * 0.2, -s * 0.3, -s * 0.05); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(-s * 0.42, -s * 0.3, s * 0.14, Math.PI * 0.5, Math.PI * 1.5); c.arc(s * 0.42, -s * 0.3, s * 0.14, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
  c.fillRect(-s * 0.06, s * 0.1, s * 0.12, s * 0.22); c.strokeRect(-s * 0.06, s * 0.1, s * 0.12, s * 0.22);
  c.fillRect(-s * 0.28, s * 0.32, s * 0.56, s * 0.14); c.strokeRect(-s * 0.28, s * 0.32, s * 0.56, s * 0.14);
  c.restore();
}

function drawStarfield(c, t) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const rng = mulberry32(55);
  c.fillStyle = '#fff';
  for (let i = 0; i < 180; i++) {
    const x = rng() * W, y = rng() * H, z = rng();
    c.globalAlpha = 0.2 + z * 0.8;
    const s = z > 0.85 ? 3 : 2;
    c.fillRect((x - t * 20 * z + W) % W, y, s, s);
  }
  c.globalAlpha = 1;
}

// The podium floats in the Cosmic Dumpster: airglow sky, confetti stars, the trash planet, the duck.
function drawSpaceBackdrop(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#050A2E'); g.addColorStop(0.6, '#1B1464'); g.addColorStop(1, '#0B5D7A');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2, 470);
  drawConfettiStars(c, 0, t);
  c.translate(-120, 40);
  drawTrashPlanet(c, 0, t);
  drawDuckMoon(c, 0, t);
  c.restore();
}

function drawPodium(c, t) {
  drawSpaceBackdrop(c, t);
  const cup = game.cup;
  const st = cupStandings();
  const place = st.indexOf(game.racer);
  blockText(c, place === 0 ? 'CHAMPION!' : place < 3 ? 'ON THE PODIUM!' : 'PARTICIPATION STICKER', W / 2, 30, 7, { align: 'center', color: YEL, outline: 5, outlineColor: INK, shadow: 10, shadowColor: PNK });
  // podium blocks: 2 | 1 | 3, in the three neons
  const cx = 470;
  // the podium: three dumpsters stacked in gold, silver and bronze
  const blocks = [[1, cx - 190, 150, '#D9DDEA'], [0, cx, 220, '#FFC21A'], [2, cx + 190, 110, '#FF8A3D']];
  for (const [rank, x, h, colr] of blocks) {
    const y = 620 - h;
    c.fillStyle = INK; c.fillRect(x - 81, y + 6, 170, h);
    c.fillStyle = colr; c.fillRect(x - 85, y, 170, h);
    strokeBox(c, x - 85, y, 170, h, 4, INK);
    c.fillStyle = INK; c.fillRect(x - 92, y - 4, 184, 12);                       // the lid
    for (let k = 0; k < 4; k++) c.fillRect(x - 60 + k * 40, y + h - 26, 8, 14);  // ridges
    blockText(c, String(rank + 1), x, y + 26, 8, { align: 'center', color: INK });
    const idx = st[rank];
    const bob = Math.sin(t * 3 + rank) * 6;
    drawRacerArt(c, RACERS[idx], x, y - 70 + bob, rank === 0 ? 130 : 108, { color: INK, fill: RACERS[idx].color, flap: Math.sin(t * 6 + rank) > 0.7 ? 1 : 0, t, splats: rank === 1 && idx !== game.racer ? [{ x: 0.1, y: -0.2, seed: 5, t: 4 }] : null });
    hudText(c, RACERS[idx].name, x, 640, 2, idx === game.racer ? YEL : WHT, 'center');
  }
  if (place === 0) drawTrophy(c, cx, 200 + Math.sin(t * 2) * 6, 110, 3);
  // goo confetti
  const rng = mulberry32(9);
  c.fillStyle = GOO_C;
  for (let i = 0; i < 70; i++) {
    const x = rng() * W, sp = 40 + rng() * 80, y = (rng() * H + t * sp) % (H + 40) - 20;
    const s = 4 + rng() * 6;
    c.save(); c.translate(x + Math.sin(t * 2 + i) * 12, y); c.rotate(t * 3 + i); c.fillRect(-s / 2, -s / 2, s, s * 0.6); c.restore();
  }
  // standings column
  const sx0 = 840;
  plate(c, sx0 - 22, 124, 428, 410);
  hudText(c, 'FINAL STANDINGS', sx0, 140, 3, YEL);
  st.forEach((idx, i) => {
    const y = 180 + i * 29;
    const me = idx === game.racer;
    if (me) { c.fillStyle = YEL; c.fillRect(sx0 - 8, y - 6, 400, 26); }
    else { c.fillStyle = RACERS[idx].color; c.fillRect(sx0 - 8, y - 4, 4, 20); }
    blockText(c, (i + 1) + '  ' + RACERS[idx].name, sx0, y, 2, { color: me ? INK : WHT });
    blockText(c, String(cup.pts[idx]), sx0 + 380, y, 2, { align: 'right', color: me ? INK : CYN });
  });
  blockText(c, 'CUP SCORE', sx0, 420, 2, { color: CYN });
  hudText(c, cup.score.toLocaleString('en-US'), sx0, 440, 6, YEL);
  blockText(c, 'SPLATS x' + cup.splats + '   RETRIES LEFT ' + cup.tokens, sx0, 494, 2, { color: WHT });
  blockText(c, 'BEST LAP ' + (cup.bestLap ? fmtTime(cup.bestLap) : '-'), sx0, 516, 2, { color: WHT });
  if (cup.unlocked || (SHOT && place < 3)) {
    c.fillStyle = INK; c.fillRect(sx0 - 4, 546, 400, 32);
    c.fillStyle = CYN; c.fillRect(sx0 - 8, 542, 400, 32);
    blockText(c, 'REGLOOP CUP UNLOCKED!', sx0 + 192, 551, 2, { align: 'center', color: INK });
  }
  drawButton(c, 'again', 'PLAY AGAIN', sx0 - 8, 590, 190, 44, game.podMenu.i === 0, { px: 2 });
  drawButton(c, 'title', 'TITLE', sx0 + 202, 590, 190, 44, game.podMenu.i === 1, { px: 2 });
  hudText(c, 'ENTER: PLAY AGAIN', sx0 + 192, 650, 2, CYN, 'center');
}

// Game over: a Freezer Burn white-out, your racer frozen solid in an ice cube.
function drawGameOver(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#CFF3FF'); g.addColorStop(1, '#7FC8FF');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const rng = mulberry32(8);
  c.fillStyle = '#FFFFFF';
  for (let i = 0; i < 90; i++) { const x = (rng() * W + t * 40 * (0.5 + rng())) % W, y = (rng() * H + t * 70 * (0.5 + rng())) % H; c.fillRect(x, y, 4, 4); }
  blockText(c, 'GAME OVER', W / 2, 70, 12, { align: 'center', color: '#2F6BD9', outline: 6, outlineColor: INK, shadow: 10, shadowColor: '#FFFFFF' });
  hudText(c, 'YOUR CUP RUNNETH OVER. WITH FAILURE.', W / 2, 180, 3, CREAM, 'center');
  const x = W / 2, y = 400;
  c.save(); c.translate(x, y); c.rotate(-0.06);
  drawRacerArt(c, RACERS[game.racer], 0, 6, 130, { color: INK, fill: RACERS[game.racer].color, t: 0 });
  c.beginPath(); c.roundRect(-120, -110, 240, 230, 22);
  c.fillStyle = 'rgba(190,235,255,0.55)'; c.fill();
  c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
  c.lineWidth = 4; c.strokeStyle = '#FFFFFF'; c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(-96, -88, 26, 120); c.fillRect(-60, -88, 12, 60);
  c.restore();
  drawButton(c, 'retry', 'RETRY CUP', W / 2 - 250, 600, 240, 50, game.goMenu.i === 0);
  drawButton(c, 'title', 'TITLE', W / 2 + 10, 600, 240, 50, game.goMenu.i === 1);
}


// ---- PAUSE overlay inside the race
const PAUSE_ITEMS = ['resume', 'restart', 'quit'];
function togglePause() {
  if (game.scene !== 'race') return;
  game.paused = !game.paused;
  game.pauseMenu.i = 0;
  MUSIC.duck = game.paused ? 0.45 : 1;
  sfx.uiMove();
}
function onBlurPause() { if (game.scene === 'race' && !game.paused && !SHOT) togglePause(); }
function restartCost() { return game.cup && game.cup.mode === 'cup' && world.player.dist > TRACK.L; }
function restartRace() {
  if (game.scene !== 'race' || game.wipe) return;
  if (restartCost()) { if (game.cup.tokens <= 0) { popup('NO RETRIES LEFT', 'mid'); return; } game.cup.tokens--; }
  goTo('intro', () => startRaceScene(world.trackIdx));
}
function pauseUpdate() {
  const sel = menuNav(game.pauseMenu, PAUSE_ITEMS);
  if (sel < 0) return;
  const id = PAUSE_ITEMS[sel];
  sfx.uiSelect();
  if (id === 'resume') togglePause();
  else if (id === 'restart') { game.paused = false; MUSIC.duck = 1; restartRace(); }
  else if (id === 'quit') { game.paused = false; MUSIC.duck = 1; goTo('title'); }
}
function drawPause(c) {
  dim(c, 0.7);
  hudText(c, 'PAUSED', W / 2, 150, 10, CREAM, 'center');
  const labels = {
    resume: 'RESUME',
    restart: 'RESTART RACE' + (restartCost() ? ' (1 RETRY)' : ''),
    quit: 'QUIT TO TITLE',
  };
  PAUSE_ITEMS.forEach((id, i) => drawButton(c, id, labels[id], W / 2 - 220, 300 + i * 62, 440, 48, game.pauseMenu.i === i));
  hudText(c, '↑ FLAP   ← → STEER   ↓ DIVE   SPACE SHOOT   X ITEM   R RESTART   M MUTE', W / 2, 520, 2, AQUA, 'center');
}
