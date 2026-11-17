// GOO PRIX · src/scenes.js — Title, select, how-to, intro, level, pause, results and end screens.
'use strict';

// ============================================================================================
// SCENES — title, select, how-to, intro, level (+pause), results, final card, game over
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

function startLevelScene(levelIdx) {
  reseed(1000 + levelIdx * 31 + Math.floor(rand() * 1000));
  setupLevel(levelIdx);
  MUSIC.play(TRACK.def.song);
}

// ---- TITLE: a live attract flight behind a giant logo and the main menu
const TITLE_ITEMS = ['start', 'practice', 'diff', 'howto'];
function makeAttract() { reseed(4242); setupLevel(0, { attract: true }); world.state = 'run'; startGo(); }

const SCENES = {
  title: {
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
      else if (id === 'practice') { game.mode = 'practice'; goTo('select'); }
      else if (id === 'diff') { game.diff = (game.diff + 1) % 3; save.difficulty = game.diff; writeSave(); }
      else if (id === 'howto') goTo('howto');
    },
    draw(c) {
      applyCamera();
      renderWorld(c);
      dim(c, 0.34);
      drawLogo(c, W / 2, 56, 17, game.sceneT);
      hudText(c, 'A FLAP-AND-SPLAT SCORE ATTACK', W / 2, 220, 3, WHT, 'center');
      hudText(c, 'SHOOT EVERYTHING · CHAIN YOUR HITS · DON\'T GET KNOCKED · 5 WORLDS + 1 BOSS', W / 2, 254, 2, CYN, 'center');
      const labels = {
        start: 'START RUN',
        practice: 'PRACTICE: ' + (game.practiceLevel + 1) + ' ' + LEVELS[game.practiceLevel].name,
        diff: 'DIFFICULTY: ' + DIFFS[game.diff],
        howto: 'HOW TO PLAY',
      };
      const bw = 460, bh = 44, bx = W / 2 - bw / 2;
      TITLE_ITEMS.forEach((id, i) => drawButton(c, id, labels[id], bx, 306 + i * 56, bw, bh, game.menu.i === i, { arrows: id === 'diff' || id === 'practice', px: id === 'practice' ? 2 : 3 }));
      // best run and the best grade on each difficulty
      const best = save.bestCup ? 'BEST RUN ' + fmtScore(save.bestCup) : 'NO RUN FINISHED YET';
      hudText(c, best, W / 2, 548, 3, YEL, 'center');
      DIFFS.forEach((d, k) => {
        const g = save.trophies['run:' + k];
        const x = W / 2 - 220 + k * 160;
        drawGradeBadge(c, x + 20, 612, 24, g || null);
        hudText(c, d, x + 52, 604, 2, g ? WHT : '#6a6a76');
      });
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
      applyCamera(); renderWorld(c); dim(c, 0.84);
      blockText(c, 'HOW TO PLAY', W / 2, 30, 7, { align: 'center', color: YEL, outline: 4, outlineColor: INK, shadow: 9, shadowColor: PNK });
      const rows = [
        ['FLY', '↑ FLAP  ← → STEER  ↓ DIVE', 'THREAD THE ICING WINDOWS FOR +100, A BULLSEYE FOR +250. DIVE THEN FLAP TO BOOST.'],
        ['SHOOT', 'SPACE (AUTO-AIMS)', 'EVERY HIT GROWS YOUR CHAIN. EVERY 5 HITS ADD x1, UP TO x8. STOP HITTING AND IT DRAINS.'],
        ['KNOCKS', 'WALLS, BOLTS, GOOP', 'A KNOCK COSTS POINTS AND WIPES YOUR MULTIPLIER. GRINDING THE RAILS BLEEDS POINTS.'],
        ['ITEMS', 'X  (OR SHIFT)', 'FLY INTO JELLY CUBES. AUTO-GOO, STUN BOMB, HOMING SOCK, BAZOOKA AND MORE.'],
        ['LEVELS', 'BEAT THE QUOTA', 'EACH WORLD BENDS THE RULES: RHYTHM, BLIZZARDS, FLIPPED GRAVITY, ZERO-G. THEN THE BOSS.'],
      ];
      rows.forEach((r, i) => {
        const y = 108 + i * 64;
        blockText(c, r[0], 70, y, 4, { color: '#fff' });
        blockText(c, r[1], 290, y, 2, { color: CYN });
        smallText(c, r[2], 290, y + 22, 18, '#c8c8c8');
      });
      // the targets and what they are worth, wearing this world's skins
      const cls = ['floater', 'splitter', 'zipper', 'tank', 'ace', 'goldie'];
      const t = game.sceneT;
      cls.forEach((k, i) => {
        const x = 110 + i * 212, y = 470;
        plate(c, x - 86, y - 56, 172, 158, k === 'goldie' ? YEL : k === 'ace' ? RED : CYN);
        drawTargetIcon(c, k, x, y + 4, 34, t);
        blockText(c, k === 'ace' ? 'RIVAL ACE' : k.toUpperCase(), x, y + 52, 2, { align: 'center', color: WHT });
        hudText(c, '+' + TARGET_CLASSES[k].pts, x, y + 72, 2, k === 'goldie' ? YEL : GOO_C, 'center');
      });
      blockText(c, 'S GRADE = 3x THE QUOTA. 3 CONTINUES PER RUN. MAKE THE BOSS FILTHY.', W / 2, 660, 2, { align: 'center', color: '#909090' });
    },
  },

  select: {
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
      applyCamera(); renderWorld(c); dim(c, 0.55);
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
  },

  intro: {
    enter() { world.introT = 0; world.introSaid = false; },
    update(dt) {
      world.introT += dt;
      world.t += dt; updateThings(TRACK, world.t, dt);
      if (!world.introSaid && world.introT > 0.4) { world.introSaid = true; say(world.level.say, 3); }
      if (world.introT > 3.4 || keyHit('Enter', 'Space', 'Escape') || input.click) enterScene('race');
    },
    draw(c) {
      const w = world, p = w.player, L = w.level;
      const e = smooth01(w.introT / 3.2);
      w.camU = lerp(0, p.u, e); w.camV = lerp(12.5, p.v + CFG.camUp, e);
      applyCamera(p.dist - lerp(52, CFG.camBack, e));
      renderWorld(c);
      if (e > 0.85) drawPlayerCraft(c);
      const k = smooth01(w.introT / 0.35);
      c.save(); c.translate((1 - k) * -700, 0);
      c.fillStyle = PNK; c.fillRect(0, 196, W * 0.8, 112);
      c.fillStyle = L.boss ? RED : YEL; c.fillRect(0, 188, W * 0.8, 112);
      blockText(c, L.boss ? 'FINAL BOSS' : 'LEVEL ' + (w.levelIdx + 1) + ' OF 5', 70, 200, 3, { color: L.boss ? WHT : INK });
      blockText(c, L.name, 70, 228, 9, { color: L.boss ? WHT : INK, skew: 0.12 });
      c.restore();
      const k2 = smooth01((w.introT - 0.3) / 0.35);
      c.save(); c.translate((1 - k2) * 900, 0);
      hudText(c, TRACK.def.name + (L.boss ? '' : ' · QUOTA ' + fmtScore(w.quota)), 70, 322, 3, WHT);
      plate(c, 56, 360, Math.min(W - 112, 40 + textWidth(L.blurb, 2)), 44, CYN);
      blockText(c, L.blurb, 76, 374, 2, { color: WHT });
      c.restore();
      if (L.boss) drawBossPortrait(c, W - 250, 520, w.introT);
      hudText(c, 'ENTER TO SKIP', W - 40, H - 40, 2, CYN, 'right');
    },
  },

  race: {
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
  },

  results: {
    enter() {
      game.resMenu = { i: 0 };
      MUSIC.play(SONGS.results);
      const res = game.lastResults;
      if (res.pass) sfx.fanfare(); else sfx.sad();
      game.resSaid = false;
    },
    update(dt) {
      world.t += dt; updateParts(dt);
      const res = game.lastResults;
      if (!game.resSaid && game.sceneT > 1.7) {
        game.resSaid = true;
        say(res.pass ? (res.grade === 'S' ? 'Ess rank! Masterpiece!' : 'Grade ' + res.grade + '!') : 'Rejected!', 3);
      }
      const opts = resultOptions(res);
      const sel = menuNav(game.resMenu, opts.map((o) => o.id));
      if (sel < 0) return;
      sfx.uiSelect();
      opts[sel].go();
    },
    draw(c) {
      applyCamera(); renderWorld(c); dim(c, 0.6);
      drawResults(c, game.lastResults, game.sceneT);
    },
  },

  final: {
    enter() { game.finMenu = { i: 0 }; MUSIC.play(SONGS.podium); sfx.fanfare(); game.finSaid = false; },
    update(dt) {
      if (!game.finSaid && game.sceneT > 2.2) { game.finSaid = true; const g = runGrade(); say(g === 'S' ? 'Masterpiece! Ess rank!' : g === 'A' ? 'Filthy work! A rank!' : 'Grade ' + g + '. Not bad!', 3); }
      const sel = menuNav(game.finMenu, ['again', 'title']);
      if (sel === 0) { sfx.uiSelect(); startRun('campaign', 0); goTo('intro', () => startLevelScene(0)); }
      if (sel === 1) { sfx.uiSelect(); goTo('title'); }
    },
    draw(c) { drawFinal(c, game.sceneT); },
  },

  gameover: {
    enter() { game.goMenu = { i: 0 }; MUSIC.play(SONGS.over); say('Game over!', 3); },
    update(dt) {
      const sel = menuNav(game.goMenu, ['retry', 'title']);
      if (sel === 0) { sfx.uiSelect(); startRun('campaign', 0); goTo('intro', () => startLevelScene(0)); }
      if (sel === 1) { sfx.uiSelect(); goTo('title'); }
    },
    draw(c) { drawGameOver(c, game.sceneT); },
  },
};

// The level as you fly it: world, ship, screen FX, HUD, popups, countdown, crosshair, flashes.
function drawLevelFrame(c) {
  const w = world;
  applyCamera();
  renderWorld(c);
  drawPlayerCraft(c);
  drawSpeedDashes(c);
  drawScreenFx(c);
  drawWindscreen(c);
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
// A letter grade in a stamped roundel (null: an empty slot).
function drawGradeBadge(c, x, y, r, g) {
  c.beginPath(); c.arc(x, y, r, 0, TAU);
  c.fillStyle = g ? GRADE_COLORS[g] : '#15151E'; c.fill();
  c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.lineWidth = 2; c.strokeStyle = g ? WHT : '#3a3a44'; c.beginPath(); c.arc(x, y, r - 5, 0, TAU); c.stroke();
  blockText(c, g || '-', x + r * 0.03, y - r * 0.42, r * 0.12, { align: 'center', color: g ? INK : '#3a3a44' });
}
// A big rubber-stamp grade, slammed down at an angle.
function drawGradeStamp(c, x, y, g, t, size) {
  const s = size || 1;
  const k = clamp(t / 0.22, 0, 1);
  const sc = (1 + (1 - k) * 2.2) * s;
  c.save(); c.translate(x, y); c.rotate(-0.18); c.scale(sc, sc); c.globalAlpha = k;
  c.beginPath(); c.roundRect(-82, -82, 164, 164, 22);
  c.fillStyle = 'rgba(11,11,18,0.85)'; c.fill();
  c.lineWidth = 10; c.strokeStyle = GRADE_COLORS[g]; c.stroke();
  c.lineWidth = 3; c.strokeStyle = WHT; c.beginPath(); c.roundRect(-70, -70, 140, 140, 16); c.stroke();
  blockText(c, g, 0, -50, 15, { align: 'center', color: GRADE_COLORS[g], outline: 4, outlineColor: INK, shadow: 6, shadowColor: g === 'S' ? PNK : INK });
  c.restore();
  if (g === 'S' && k >= 1) { glint(c, x + 60 * s, y - 70 * s, 22 * s * (0.6 + 0.4 * Math.sin(t * 8)), 0.95); glint(c, x - 70 * s, y + 50 * s, 14 * s * (0.6 + 0.4 * Math.sin(t * 6 + 1)), 0.9); }
}
// One target class drawn on its own (the how-to card), in the current world's skin.
function drawTargetIcon(c, cls, x, y, s, t) {
  const fake = { cls, skin: SKINS[THEME.id][cls], ph: cls.length, hp: 1, maxHp: 1, r: 1, splats: [], hitT: 0, gen: 0, flee: 6, giant: false };
  if (cls === 'ace') { drawShip(c, RACERS[(game.racer + 3) % 8], x, y, s * 2.6, { t, thrust: 1 }); return; }
  c.save(); c.translate(x, y);
  drawSkin(c, fake.skin, s, clamp(s * 0.09, 1.2, 5), t, fake);
  c.restore();
}
// Mister Spotless leaning into the boss intro card.
function drawBossPortrait(c, x, y, t) {
  const k = smooth01((t - 0.6) / 0.5);
  if (k <= 0) return;
  const b = { u: 0, v: 0, dist: 0, filth: 0, phase: 1, maw: 0.2 + 0.2 * Math.sin(t * 3), turrets: BOSS.turrets.map(([tx, ty]) => ({ x: tx, y: ty, hp: 6 })), splats: [], dead: false, stun: 0, hitT: 0, armT: t, bleach: 0 };
  c.save(); c.translate(x + (1 - k) * 500, y);
  c.scale(0.55, 0.55);
  drawBossAt(c, b, 0, 0, 60, t);
  c.restore();
  hudText(c, '"YOU\'RE TRACKING GOO ON MY FLOOR."', x, y + 170, 2, CYN, 'center');
}

function resultOptions(res) {
  const run = game.run, opts = [];
  const L = LEVELS[res.levelIdx];
  const nextIdx = res.levelIdx + 1;
  if (run.mode === 'practice') {
    opts.push({ id: 'retry', label: 'RETRY ' + L.name, go: () => goTo('intro', () => startLevelScene(res.levelIdx)) });
    if (nextIdx < LEVELS.length) opts.push({ id: 'next', label: 'NEXT: ' + LEVELS[nextIdx].name, go: () => { game.practiceLevel = nextIdx; goTo('intro', () => startLevelScene(nextIdx)); } });
    opts.push({ id: 'title', label: 'TITLE', go: () => goTo('title') });
    return opts;
  }
  if (!res.pass) {
    if (run.continues > 0) opts.push({ id: 'retry', label: 'CONTINUE (' + run.continues + ' LEFT)', go: () => { run.continues--; goTo('intro', () => startLevelScene(res.levelIdx)); } });
    else opts.push({ id: 'over', label: 'GAME OVER', go: () => goTo('gameover') });
    opts.push({ id: 'title', label: 'QUIT', go: () => goTo('title') });
    return opts;
  }
  if (nextIdx < LEVELS.length) opts.push({ id: 'next', label: LEVELS[nextIdx].boss ? 'FACE THE FINAL BOSS' : 'NEXT: ' + LEVELS[nextIdx].name + ' (' + (nextIdx + 1) + '/5)', go: () => { run.level = nextIdx; goTo('intro', () => startLevelScene(nextIdx)); } });
  else opts.push({ id: 'next', label: 'FINAL RESULTS', go: () => goTo('final') });
  return opts;
}

function drawResults(c, res, t) {
  const L = LEVELS[res.levelIdx];
  hudText(c, res.pass ? (L.boss ? 'STAIN SUPREME!' : 'QUOTA SMASHED!') : (L.boss ? 'TIME UP' : 'REJECTED'), 60, 30, 6, res.pass ? YEL : RED);
  hudText(c, (L.boss ? 'FINAL BOSS' : 'LEVEL ' + (res.levelIdx + 1) + '/5') + ' · ' + L.name + ' · ' + DIFFS[game.diff], 60, 82, 2, CYN);
  // the score breakdown, line by line, counting up
  const px0 = 60, pw = 640;
  plate(c, px0 - 16, 108, pw + 32, 64 + res.lines.length * 34 + 70);
  res.lines.forEach((ln, i) => {
    const y = 126 + i * 34;
    const a = clamp((t - 0.25 - i * 0.12) / 0.2, 0, 1);
    c.globalAlpha = a;
    blockText(c, ln[0], px0, y, 2, { color: WHT });
    const v = ln[1];
    blockText(c, (v < 0 ? '-' : '+') + fmtScore(Math.abs(v)), px0 + pw, y, 2, { align: 'right', color: v < 0 ? RED : v ? GOO_C : '#5a5a66' });
    c.globalAlpha = 1;
  });
  const yT = 126 + res.lines.length * 34 + 6;
  c.fillStyle = PNK; c.fillRect(px0, yT, pw, 3);
  const shown = Math.round(res.score * clamp((t - 0.5) / 1.1, 0, 1));
  blockText(c, 'LEVEL SCORE', px0, yT + 22, 2, { color: CYN });
  hudText(c, fmtScore(shown), px0 + pw, yT + 14, 7, YEL, 'right');
  if (!L.boss) {
    const k = clamp(res.score / Math.max(1, res.quota), 0, 3);
    blockText(c, 'QUOTA ' + fmtScore(res.quota) + ' · x' + k.toFixed(2), px0, yT + 46, 2, { color: res.pass ? GOO_C : RED });
  } else blockText(c, res.pass ? 'GRADED ON TIME LEFT' : 'HE IS STILL SPOTLESS', px0, yT + 46, 2, { color: res.pass ? GOO_C : RED });
  // the grade stamp slams down once the score has counted
  if (t > 1.6) drawGradeStamp(c, 960, 250, res.grade, t - 1.6, 1);
  if (res.newBest && res.pass && t > 2.0) {
    c.save(); c.translate(960, 400); c.rotate(-0.08);
    c.fillStyle = INK; c.fillRect(-106, -18, 220, 44);
    c.fillStyle = PNK; c.fillRect(-112, -24, 220, 44);
    blockText(c, 'NEW BEST!', -2, -14, 4, { align: 'center', color: WHT });
    c.restore();
  }
  // run so far
  const run = game.run;
  if (run && run.mode === 'campaign') {
    plate(c, 780, 452, 440, 90, CYN);
    blockText(c, 'RUN TOTAL ' + fmtScore(run.total) + ' · CONTINUES ' + run.continues, 800, 466, 2, { color: WHT });
    LEVELS.forEach((lv, i) => drawGradeBadge(c, 816 + i * 66, 512, 20, run.grades[i] || null));
  }
  const opts = resultOptions(res);
  opts.forEach((o, i) => drawButton(c, o.id, o.label, 780, 566 + i * 54, 440, 44, game.resMenu.i === i, { px: 2 }));
}

// The end of a full run: every stage's score and grade, the total and the run grade.
function drawFinal(c, t) {
  drawSpaceBackdrop(c, t);
  const run = game.run || { scores: [], grades: [], total: 0, newHigh: false };
  blockText(c, 'RUN COMPLETE!', W / 2, 26, 7, { align: 'center', color: YEL, outline: 5, outlineColor: INK, shadow: 10, shadowColor: PNK });
  hudText(c, 'MISTER SPOTLESS IS FILTHY. THE WORLD IS PAINTED.', W / 2, 96, 2, CREAM, 'center');
  plate(c, 60, 132, 640, LEVELS.length * 62 + 120);
  LEVELS.forEach((L, i) => {
    const y = 150 + i * 62;
    const k = smooth01(clamp((t - i * 0.15) / 0.3, 0, 1));
    c.save(); c.translate((1 - k) * -500, 0);
    blockText(c, L.boss ? 'BOSS' : String(i + 1), 84, y + 14, 3, { color: L.boss ? RED : CYN });
    blockText(c, L.name, 170, y + 16, 3, { color: WHT });
    blockText(c, fmtScore(run.scores[i] || 0), 590, y + 16, 3, { align: 'right', color: YEL });
    drawGradeBadge(c, 646, y + 26, 22, run.grades[i] || null);
    c.restore();
  });
  const yT = 150 + LEVELS.length * 62 + 6;
  c.fillStyle = PNK; c.fillRect(84, yT, 590, 3);
  blockText(c, 'TOTAL', 84, yT + 24, 3, { color: CYN });
  hudText(c, fmtScore(Math.round(run.total * clamp((t - 0.9) / 1.2, 0, 1))), 674, yT + 16, 7, YEL, 'right');
  // your ship, gooed and proud, and the run grade
  drawShip(c, RACERS[game.racer], 990, 310 + Math.sin(t * 2) * 8, 250, { t, thrust: 1, speed: true, flap: Math.sin(t * 5) > 0.7 ? 1 : 0 });
  if (t > 2.0) drawGradeStamp(c, 990, 500, runGrade(), t - 2.0, 0.8);
  if (run.newHigh && t > 2.4) {
    c.save(); c.translate(990, 176); c.rotate(-0.06);
    c.fillStyle = INK; c.fillRect(-150, -18, 310, 44);
    c.fillStyle = CYN; c.fillRect(-156, -24, 310, 44);
    blockText(c, 'NEW HIGH SCORE!', -2, -14, 3, { align: 'center', color: INK });
    c.restore();
  }
  drawButton(c, 'again', 'PLAY AGAIN', 60, 640, 300, 46, game.finMenu.i === 0, { px: 3 });
  drawButton(c, 'title', 'TITLE', 380, 640, 300, 46, game.finMenu.i === 1, { px: 3 });
}

// The final card's backdrop: the Cosmic Dumpster's airglow sky, confetti stars, planet and duck.
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
  // goo confetti falling over everything
  const rng = mulberry32(9);
  for (let i = 0; i < 40; i++) {
    const x = rng() * W, sp = 40 + rng() * 80, y = (rng() * H + t * sp) % (H + 40) - 20;
    gooBlob(c, x + Math.sin(t * 2 + i) * 12, y, 4 + rng() * 5, i, t, ['#7CFF3A', '#FF4FD8', '#FFC21A', '#19E0D0'][i % 4]);
  }
}

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
function restartCost() { return game.run && game.run.mode === 'campaign' && world.player.dist > world.length * 0.25; }
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
  dim(c, 0.7);
  hudText(c, 'PAUSED', W / 2, 150, 10, CREAM, 'center');
  const labels = {
    resume: 'RESUME',
    restart: 'RESTART LEVEL' + (restartCost() ? ' (1 CONTINUE)' : ''),
    quit: 'QUIT TO TITLE',
  };
  PAUSE_ITEMS.forEach((id, i) => drawButton(c, id, labels[id], W / 2 - 220, 300 + i * 62, 440, 48, game.pauseMenu.i === i));
  hudText(c, '↑ FLAP   ← → STEER   ↓ DIVE   SPACE SHOOT   X ITEM   R RESTART   M MUTE', W / 2, 520, 2, AQUA, 'center');
}
