// GOO PRIX · src/play/targets.js — Things to shoot: six target classes, reskinned for every world, in waves.
'use strict';

// ============================================================================================
// TARGETS — floaters, zippers, armoured tanks, splitters, rival aces that shoot back, goldies
// ============================================================================================
const TARGET_CLASSES = {
  floater: { hp: 1, pts: 50, r: 1.15 },
  zipper: { hp: 1, pts: 120, r: 0.95 },
  tank: { hp: 3, pts: 250, r: 1.7 },
  splitter: { hp: 1, pts: 80, r: 1.35 },
  ace: { hp: 4, pts: 400, r: 1.3 },
  goldie: { hp: 2, pts: 1000, r: 1.05 },
};
// What each class looks like in each world.
const SKINS = {
  breakfast: { floater: 'toastmoth', zipper: 'eggsaucer', tank: 'hooptank', splitter: 'jamblob', goldie: 'butterfly' },
  disco: { floater: 'mirrordrone', zipper: 'glowworm', tank: 'speaker', splitter: 'discoball', goldie: 'goldrecord' },
  freezer: { floater: 'snowflake', zipper: 'popsiclerocket', tank: 'icecube', splitter: 'peapod', goldie: 'goldcone' },
  lava: { floater: 'waxbubble', zipper: 'lavaeel', tank: 'bulb', splitter: 'waxblob', goldie: 'goldblob' },
  cosmic: { floater: 'tvjunk', zipper: 'satdart', tank: 'satellite', splitter: 'canjunk', goldie: 'goldduck' },
  showroom: { floater: 'dustbunny', zipper: 'dustbunny', tank: 'soapmine', splitter: 'dustbunny', goldie: 'goldduck' },
};
const ACE_BARKS = ['MY PAINTWORK!', 'RUDE!', 'CRUMBS!', 'HOW DARE YOU!', 'NOT THE HULL!'];

function spawnTarget(cls, dist, u, v, opts) {
  const def = TARGET_CLASSES[cls];
  const o = opts || {};
  const tg = {
    cls, skin: o.skin || SKINS[THEME.id][cls], dist, u, v, bu: u, bv: v,
    hp: o.hp || def.hp, maxHp: o.hp || def.hp, r: (o.r || def.r) * (o.scale || 1), pts: o.pts || (cls === 'goldie' && hasMix('goldleaf') ? 1500 : def.pts),
    ph: rnd(0, TAU), born: world.t, hitT: 0, gen: o.gen || 0, fireT: rnd(1.0, 1.8), flee: cls === 'goldie' ? 6 : 0,
    giant: !!o.giant, keep: 0, wave: o.wave == null ? -1 : o.wave, splats: [], dead: null, refill: !!o.refill, mine: !!o.mine,
  };
  if (cls === 'ace') {
    const others = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => i !== game.racer && !world.targets.some((t) => t.cls === 'ace' && t.ace === i));
    tg.ace = o.ace != null ? o.ace : pick(others);
    tg.skin = 'ace';
    tg.keep = rnd(28, 46);
    tg.dist = world.player.dist + tg.keep + 30;
  }
  if ((cls === 'tank' || cls === 'ace') && !tg.giant && hasMix('turpentine')) { tg.hp = Math.max(1, tg.hp - 1); tg.maxHp = tg.hp; }
  world.targets.push(tg);
  return tg;
}

const WAVE_PATTERNS = ['line', 'vee', 'ring', 'column', 'scatter'];
function spawnWave() {
  const w = world, L = w.level, p = w.player;
  const cls = weighted(Object.entries(L.mix).filter((e) => e[1] > 0));
  const pattern = pick(WAVE_PATTERNS);
  const base = p.dist + 125;
  const cu = clamp(lineUAt(base) + rnd(-3, 3), -8, 8), cv = clamp(lineVAt(base) + rnd(-1.5, 2), 3, 11);
  const n = cls === 'tank' ? 2 : cls === 'splitter' ? 3 : 5;
  const id = ++w.waveId;
  w.waves[id] = { n, killed: 0, spoiled: false };
  for (let i = 0; i < n; i++) {
    const k = i - (n - 1) / 2;
    let du = 0, dv = 0, dd = 0;
    if (pattern === 'line') du = k * 3.2;
    else if (pattern === 'vee') { du = k * 2.8; dd = Math.abs(k) * 5; }
    else if (pattern === 'ring') { const a = i / n * TAU; du = Math.cos(a) * 3.6; dv = Math.sin(a) * 2.6; }
    else if (pattern === 'column') { dv = k * 2.3; dd = i * 3; }
    else { du = rnd(-7, 7); dv = rnd(-3.5, 3.5); dd = rnd(0, 22); }
    spawnTarget(cls, base + dd, clamp(cu + du, -10.5, 10.5), clamp(cv + dv, 1.6, 12.4), { wave: id });
  }
  if (rand() < L.goldie * (hasMix('goldleaf') ? 2 : 1)) spawnTarget('goldie', base + 20, clamp(cu + rnd(-5, 5), -9, 9), clamp(cv + 2, 2, 12));
  const aces = w.targets.filter((t) => t.cls === 'ace').length;
  if (aces < L.aces && rand() < 0.35) {
    spawnTarget('ace', base, 0, 7);
    if (!w.attract) { popup('RIVAL ACE!', 'small'); say('Rival ace!', 1, { cooldown: 6000 }); }
  }
}

function targetAlive(tg) { return !tg.dead; }

function updateTargets(dt) {
  const w = world, p = w.player, t = w.t;
  for (const tg of w.targets) {
    if (tg.dead) continue;
    tg.hitT = Math.max(0, tg.hitT - dt);
    for (const sp of tg.splats) sp.t += dt;
    switch (tg.cls) {
      case 'floater': case 'splitter':
        tg.u = clamp(tg.bu + Math.sin(t * 0.8 + tg.ph) * 2, -10.8, 10.8);
        tg.v = clamp(tg.bv + Math.cos(t * 0.6 + tg.ph) * 1.2, 1.2, 12.8);
        break;
      case 'tank':
        tg.u = tg.bu + Math.sin(t * 0.5 + tg.ph) * (tg.giant ? 3 : 1);
        tg.v = tg.bv + Math.sin(t * 0.7 + tg.ph) * 0.6;
        if (tg.giant) tg.dist = Math.max(tg.dist, p.dist + 30);   // the giant keeps its distance until beaten
        break;
      case 'zipper':
        tg.u = clamp(tg.bu + Math.sin(t * 3 + tg.ph) * 6, -10.5, 10.5);
        tg.v = clamp(tg.bv + Math.sin(t * 2.1 + tg.ph) * 2.5, 1.5, 12.5);
        tg.dist += 8 * dt;
        break;
      case 'goldie':
        tg.flee -= dt;
        tg.u = clamp(tg.bu + Math.sin(t * 4 + tg.ph) * 5, -10, 10);
        tg.v = clamp(tg.bv + Math.cos(t * 3.3 + tg.ph) * 2.5, 1.5, 12.5);
        tg.dist += (tg.flee > 3 ? p.speed * 0.8 : p.speed + 25) * dt;
        if (tg.flee <= 0) tg.dead = 'escaped';
        break;
      case 'ace': {
        const want = p.dist + tg.keep + Math.sin(t * 0.7 + tg.ph) * 6;
        tg.dist = damp(tg.dist, want, 1.6, dt) + p.speed * dt * 0.02;
        tg.u = clamp(Math.sin(t * 0.9 + tg.ph) * 7, -10, 10);
        tg.v = clamp(6.5 + Math.sin(t * 1.3 + tg.ph) * 3.5, 2, 12);
        tg.fireT -= dt;
        if (tg.fireT <= 0 && w.state === 'run') {
          tg.fireT = rnd(1.1, 1.9) * (w.levelIdx >= 4 ? 0.75 : 1);
          fireBolt(tg.dist - 1.5, tg.u, tg.v);
        }
        break;
      }
    }
    if (tg.mine && Math.abs(gap(p.dist, tg.dist)) < tg.r + 0.6 && Math.abs(p.u - tg.u) < tg.r + 0.6 && Math.abs(p.v - tg.v) < tg.r + 0.6) {
      tg.dead = 'popped'; burst(tg.dist, tg.u, tg.v, 14, 'spark');
      if (knock('hazard', 'SOAP MINE')) { shake(10); sfx.bonk(); popup('BLEACHED!', 'mid'); }
    }
    if (gap(p.dist, tg.dist) < -6) tg.dead = 'passed';
  }
  for (const tg of w.targets) if (tg.dead && tg.dead !== 'killed' && tg.wave >= 0 && w.waves[tg.wave]) w.waves[tg.wave].spoiled = true;
  w.targets = w.targets.filter(targetAlive);
  // enemy bolts fly back at you; goo can shoot them down
  for (const b of w.bolts) {
    b.dist += b.vs * dt; b.u += b.vu * dt; b.v += b.vv * dt; b.life -= dt;
    if (Math.abs(gap(p.dist, b.dist)) < 1.3 && Math.abs(b.u - p.u) < 1.1 && Math.abs(b.v - p.v) < 1.1) {
      b.life = 0;
      if (p.shield > 0) popShield(p);
      else if (knock('bolt', 'HIT')) { shake(8); sfx.bonk(); windscreenGoo(1); world.flash2 = 0.12; }
    }
  }
  w.bolts = w.bolts.filter((b) => b.life > 0);
  // a fresh wave every few seconds
  if (w.state === 'run' && !w.boss) {
    w.waveT -= dt;
    if (w.waveT <= 0 && w.player.dist < w.length - 140) { spawnWave(); w.waveT = w.level.waveGap * rnd(0.85, 1.15); }
  }
}

// An enemy bolt, aimed to meet the player.
function fireBolt(dist, u, v, opts) {
  const p = world.player, o = opts || {};
  const vs = o.vs || -26;
  const tt = Math.max(0.3, gap(p.dist, dist) / Math.max(10, p.speed - vs));
  const lead = o.lead != null ? o.lead : 0.5;   // aces lead their shots; the boss fires where you are
  world.bolts.push({ dist, u, v, vs, vu: (p.u + p.vu * tt * lead - u) / tt, vv: (p.v - v) / tt, life: 4, kind: o.kind || 'bolt' });
  if (near({ dist })) sfx.laser();
}

// DRIBBLE: a kill drips one homing droplet at the nearest live target within 12 u.
function dribbleFrom(tg) {
  let best = null;
  for (const o of world.targets) {
    if (o === tg || o.dead) continue;
    const d = Math.hypot(gap(tg.dist, o.dist), o.u - tg.u, o.v - tg.v);
    if (d < 12 && (!best || d < best.d)) best = { o, d };
  }
  if (!best) return;
  world.globs.push({ dist: tg.dist, u: tg.u, v: tg.v, vs: world.player.speed + 40, vu: 0, vv: 0, owner: world.player, life: 0.9, big: false, r: 0.36, seed: rndInt(1, 9999), hit: [tg], beat: false, homing: best.o, lockBonus: 0, dmg: 1 });
}

// A glob (or an item) lands on a target.
function hitTarget(tg, dmg, g) {
  if (tg.dead) return;
  tg.hp -= dmg; tg.hitT = 0.15;
  tg.splats.push({ x: rnd(-0.5, 0.5), y: rnd(-0.5, 0.4), seed: rndInt(1, 9999), t: 0 });
  if (tg.splats.length > 4) tg.splats.shift();
  burst(tg.dist, tg.u, tg.v, 6, 'goo');
  if (tg.hp <= 0) killTarget(tg, g);
  else if (!world.attract) { sfx.wallSplat(); if (tg.cls === 'ace') bark(null, pick(ACE_BARKS), tg); }
}

function killTarget(tg, g) {
  const w = world;
  tg.dead = 'killed';
  w.kills = (w.kills || 0) + 1;
  if (tg.cls === 'goldie') w.goldies = (w.goldies || 0) + 1;
  registerHit();
  let pts = tg.pts;
  if (g && g.beat) pts *= 2;
  if (g && g.lockBonus) pts = Math.round(pts * g.lockBonus);
  const got = pts * w.mult;
  award(got);
  w.killPts += got;
  if (tg.refill) w.player.tank = tankMax(w.player);
  worldPopup('+' + got, tg.dist, tg.u, tg.v + tg.r + 0.6);
  burst(tg.dist, tg.u, tg.v, tg.giant ? 40 : 18, 'goo');
  burst(tg.dist, tg.u, tg.v, 8, 'spark');
  if (hasMix('dribble')) dribbleFrom(tg);
  if (!w.attract) {
    sfx.splat();
    if (tg.cls === 'goldie') { say('Jackpot!', 2); popup('JACKPOT!', 'big'); sfx.fanfare(); }
    if (tg.cls === 'ace') { popup('ACE DOWN!', 'mid'); say('Ace down!', 2); }
    if (tg.giant) { popup('GIANT DOWN!', 'big'); say('Giant down!', 3); shake(12); }
    if (g && g.beat) w.onBeatStreak = (w.onBeatStreak || 0) + 1;
  }
  // splitters break into smaller copies of themselves
  if (tg.cls === 'splitter' && tg.gen < (w.level.splitGens || 1)) {
    for (const side of [-1, 1]) {
      const kid = spawnTarget('splitter', tg.dist + 2, clamp(tg.u + side * 1.6, -10.5, 10.5), tg.v + rnd(-0.6, 0.6), { gen: tg.gen + 1, scale: 0.72, pts: 60, wave: tg.wave });
      kid.skin = tg.skin;
      if (tg.wave >= 0 && w.waves[tg.wave]) w.waves[tg.wave].n++;
    }
  }
  // clearing a whole wave earns a sweep bonus
  const wv = tg.wave >= 0 ? w.waves[tg.wave] : null;
  if (wv && !wv.spoiled) {
    wv.killed++;
    if (wv.killed >= wv.n) {
      w.sweeps++;
      award(300, 'SWEEP');
      if (!w.attract) { popup('CLEAN SWEEP!', 'small'); say('Clean sweep!', 1, { cooldown: 5000 }); }
      delete w.waves[tg.wave];
    }
  }
}

// ---- drawing: each skin is a few cel-shaded shapes with an ink outline
function drawTarget(c, tg, dz) {
  projectDz(dz, tg.u, tg.v, PT);
  const x = PT.x, y = PT.y, s = Math.max(3, tg.r * PT.k);
  if (s > 260) return;
  const lw = clamp(s * 0.09, 1.2, 5);
  const t = world.t;
  if (THEME.ground.kind !== 'none' && dz > 4) {
    projectDz(dz, tg.u, 0.03, PT2);
    c.fillStyle = 'rgba(11,11,18,0.3)'; c.beginPath(); c.ellipse(PT2.x, PT2.y, s * 0.8, s * 0.18, cam.roll, 0, TAU); c.fill();
  }
  c.save();
  c.translate(x, y); c.rotate(cam.roll);
  if (tg.cls === 'ace') {
    c.restore();
    drawShip(c, RACERS[tg.ace], x, y, s * 2.4, { flap: Math.sin(t * 9 + tg.ph) > 0.6 ? 1 : 0, roll: cam.roll + Math.sin(t * 0.9 + tg.ph) * 0.25, t, splats: tg.splats, thrust: 1 });
    world.tags.push({ dz, x, y: y - s * 1.7, px: clamp(s * 0.12, 1, 4), text: 'ACE', color: WHT, border: RED, place: null });
    drawHpPips(c, tg, x, y + s * 1.25, s);
    return;
  }
  drawSkin(c, tg.skin, s, lw, t, tg);
  for (const sp of tg.splats) gooSplat(c, sp.x * s, sp.y * s, s * 0.32, sp.seed, 0.95, sp.t);
  if (tg.hitT > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = tg.hitT * 4; c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, s * 1.1, 0, TAU); c.fill(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  c.restore();
  if (tg.maxHp > 1) drawHpPips(c, tg, x, y + s * 1.25, s);
  if (tg.cls === 'goldie' && dz < 120) glint(c, x + s * 0.6, y - s * 0.6, s * 0.5 * (0.6 + 0.4 * Math.sin(t * 12)), 0.9);
}
function drawHpPips(c, tg, x, y, s) {
  if (s < 8) return;
  const n = tg.maxHp, w = Math.min(14, s * 0.3);
  for (let i = 0; i < n; i++) {
    const px = x + (i - (n - 1) / 2) * (w + 3);
    c.fillStyle = INK; c.fillRect(px - w / 2 - 1, y - 1, w + 2, 7);
    c.fillStyle = i < tg.hp ? (tg.cls === 'ace' ? RED : YEL) : '#3a3a44'; c.fillRect(px - w / 2, y, w, 5);
  }
}

function drawSkin(c, skin, s, lw, t, tg) {
  const flap = Math.sin(t * 22 + tg.ph);
  switch (skin) {
    case 'toastmoth': {
      c.fillStyle = 'rgba(255,255,255,0.75)';
      for (const d of [-1, 1]) { c.beginPath(); c.ellipse(d * s * 0.85, -s * 0.2, s * 0.7, s * (0.25 + 0.2 * flap), d * 0.5, 0, TAU); c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = INK; c.stroke(); }
      cel(c, (k) => k.roundRect(-s * 0.7, -s * 0.75, s * 1.4, s * 1.4, [s * 0.5, s * 0.5, s * 0.12, s * 0.12]), '#B36B2C', s, lw);
      cel(c, (k) => k.roundRect(-s * 0.52, -s * 0.56, s * 1.04, s * 1.06, [s * 0.38, s * 0.38, s * 0.08, s * 0.08]), '#E8A65A', s * 0.8, lw * 0.5, { noTone: true });
      c.fillStyle = INK; c.beginPath(); c.arc(-s * 0.2, -s * 0.12, s * 0.09, 0, TAU); c.arc(s * 0.2, -s * 0.12, s * 0.09, 0, TAU); c.fill();
      break;
    }
    case 'eggsaucer':
      cel(c, (k) => k.ellipse(0, s * 0.1, s * 1.1, s * 0.5, 0, 0, TAU), '#FFFFFF', s, lw);
      cel(c, (k) => k.arc(0, -s * 0.05, s * 0.48, 0, TAU), '#FFB400', s * 0.5, lw * 0.8);
      for (let i = 0; i < 5; i++) { c.fillStyle = (Math.floor(t * 8) + i) % 2 ? AQUA : MAG; c.fillRect(-s * 0.85 + i * s * 0.42, s * 0.32, s * 0.12, s * 0.1); }
      break;
    case 'hooptank':
      c.beginPath(); c.arc(0, 0, s * 0.72, 0, TAU); c.lineWidth = s * 0.5 + 4; c.strokeStyle = INK; c.stroke();
      c.lineWidth = s * 0.5; c.strokeStyle = '#FF8A3D'; c.stroke();
      c.lineWidth = s * 0.14; c.strokeStyle = '#FFC48A'; c.beginPath(); c.arc(-s * 0.06, -s * 0.06, s * 0.72, Math.PI * 1.05, Math.PI * 1.6); c.stroke();
      c.fillStyle = '#9AA0B4';
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t * 0.6; c.fillRect(Math.cos(a) * s * 0.72 - s * 0.12, Math.sin(a) * s * 0.72 - s * 0.12, s * 0.24, s * 0.24); }
      drawCracks(c, tg, s);
      break;
    case 'jamblob': case 'waxblob': case 'goldblob': {
      const base = skin === 'jamblob' ? '#E0234E' : skin === 'waxblob' ? '#FF3D9A' : '#FFC21A';
      const pts = [];
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; const rr = s * (0.9 + 0.12 * Math.sin(t * 4 + i * 2 + tg.ph)); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      cel(c, (k) => smoothPath(k, pts), base, s, lw);
      if (skin === 'jamblob') { c.fillStyle = '#FFE9A8'; for (let i = 0; i < 5; i++) c.fillRect(Math.cos(i * 1.3) * s * 0.45, Math.sin(i * 2.1) * s * 0.4, s * 0.08, s * 0.13); }
      glint(c, -s * 0.35, -s * 0.4, s * 0.22);
      break;
    }
    case 'butterfly': case 'goldrecord': case 'goldcone': case 'goldduck':
      drawGoldie(c, skin, s, lw, t, flap);
      break;
    case 'mirrordrone': case 'discoball':
      c.beginPath(); c.moveTo(-s * 0.8, -s * 1.05); c.lineTo(s * 0.8, -s * 1.05); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#D9DDEA'; c.fillRect(-s * 0.8 * Math.abs(Math.cos(t * 25)), -s * 1.12, s * 1.6 * Math.abs(Math.cos(t * 25)), s * 0.12);
      cel(c, (k) => k.arc(0, 0, s * 0.85, 0, TAU), '#8C8CFF', s, lw);
      for (let row = -2; row <= 2; row++) for (let k2 = -2; k2 <= 2; k2++) {
        if (row * row + k2 * k2 > 5) continue;
        c.fillStyle = (row + k2 + Math.floor(t * 6)) % 3 === 0 ? '#FFFFFF' : '#D9DDEA';
        c.fillRect(k2 * s * 0.3 - s * 0.11, row * s * 0.3 - s * 0.11, s * 0.22, s * 0.22);
      }
      glint(c, -s * 0.3, -s * 0.35, s * 0.35, 0.6 + 0.4 * Math.sin(t * 9));
      break;
    case 'glowworm': case 'lavaeel': {
      const col0 = skin === 'glowworm' ? MAG : '#FF7A1A', col1 = skin === 'glowworm' ? AQUA : '#FFE66B';
      for (let i = 3; i >= 0; i--) {
        const px = -i * s * 0.55, py = Math.sin(t * 8 - i * 0.9 + tg.ph) * s * 0.35, rr = s * (0.55 - i * 0.08);
        cel(c, (k) => k.arc(px, py, rr, 0, TAU), i % 2 ? col1 : col0, rr, lw * 0.8, { noTone: true });
      }
      c.fillStyle = INK; c.beginPath(); c.arc(s * 0.15, -s * 0.1, s * 0.09, 0, TAU); c.fill();
      break;
    }
    case 'speaker':
      cel(c, (k) => k.roundRect(-s * 0.8, -s, s * 1.6, s * 2, s * 0.12), '#2B2B3A', s, lw);
      for (const [cy, rr] of [[-s * 0.45, 0.38], [s * 0.4, 0.5]]) {
        const pulse = 1 + 0.12 * Math.max(0, Math.sin(t * Math.PI * 2 * (TRACK.def.song.bpm / 60)));
        c.beginPath(); c.arc(0, cy, s * rr * pulse, 0, TAU); c.fillStyle = '#9AA0B4'; c.fill(); c.lineWidth = lw * 0.7; c.strokeStyle = INK; c.stroke();
        c.beginPath(); c.arc(0, cy, s * rr * 0.35, 0, TAU); c.fillStyle = INK; c.fill();
      }
      drawCracks(c, tg, s);
      break;
    case 'snowflake':
      c.rotate(t * 0.8 + tg.ph);
      c.lineCap = 'round';
      for (const [w2, col0] of [[s * 0.36 + 4, INK], [s * 0.36, '#FFFFFF'], [s * 0.12, '#9FE3FF']]) {
        c.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          c.moveTo(0, 0); c.lineTo(Math.cos(a) * s, Math.sin(a) * s);
          c.moveTo(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55); c.lineTo(Math.cos(a + 0.5) * s * 0.8, Math.sin(a + 0.5) * s * 0.8);
        }
        c.lineWidth = w2; c.strokeStyle = col0; c.stroke();
      }
      break;
    case 'popsiclerocket':
      c.rotate(-0.4);
      c.fillStyle = 'rgba(255,138,61,0.85)'; c.beginPath(); c.moveTo(-s * 0.3, s * 0.8); c.lineTo(0, s * (1.5 + 0.3 * flap)); c.lineTo(s * 0.3, s * 0.8); c.fill();
      cel(c, (k) => k.roundRect(-s * 0.4, -s * 1.1, s * 0.8, s * 1.9, [s * 0.38, s * 0.38, s * 0.1, s * 0.1]), '#FF6FAE', s, lw);
      c.fillStyle = '#E8C88A'; c.fillRect(-s * 0.08, s * 0.8, s * 0.16, s * 0.4);
      break;
    case 'icecube':
      cel(c, (k) => k.roundRect(-s * 0.9, -s * 0.9, s * 1.8, s * 1.8, s * 0.2), '#BFEFFF', s, lw);
      c.globalAlpha = 0.9; cel(c, (k) => k.arc(0, s * 0.1, s * 0.42, 0, TAU), '#18A558', s * 0.4, lw * 0.7, { noTone: true }); c.globalAlpha = 1;
      glint(c, -s * 0.5, -s * 0.55, s * 0.4);
      drawCracks(c, tg, s);
      break;
    case 'peapod':
      c.rotate(Math.sin(t * 2 + tg.ph) * 0.3);
      cel(c, (k) => k.ellipse(0, 0, s * 1.15, s * 0.55, 0, 0, TAU), '#2E9B4E', s, lw);
      for (let i = -1; i <= 1; i++) cel(c, (k) => k.arc(i * s * 0.55, 0, s * 0.3, 0, TAU), '#7BD86A', s * 0.3, lw * 0.6, { noTone: true });
      break;
    case 'waxbubble':
      c.globalAlpha = 0.85; cel(c, (k) => k.arc(0, 0, s, 0, TAU), '#FF9A3C', s, lw, { noTone: true }); c.globalAlpha = 1;
      c.beginPath(); c.arc(0, 0, s * 0.72, Math.PI * 1.1, Math.PI * 1.45); c.lineWidth = s * 0.12; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke();
      break;
    case 'bulb':
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,230,107,0.25)'; c.beginPath(); c.arc(0, -s * 0.2, s * 1.5, 0, TAU); c.fill();
      c.globalCompositeOperation = 'source-over';
      cel(c, (k) => k.arc(0, -s * 0.25, s * 0.85, 0, TAU), '#FFE66B', s, lw, { noTone: true });
      cel(c, (k) => k.rect(-s * 0.4, s * 0.5, s * 0.8, s * 0.55), '#D9DDEA', s * 0.6, lw);
      drawCracks(c, tg, s);
      break;
    case 'tvjunk': case 'satdart': case 'satellite': case 'canjunk':
      drawJunk(c, skin, s, lw, t, tg);
      break;
    case 'dustbunny':
      c.rotate(Math.sin(t * 3 + tg.ph) * 0.3);
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.fillStyle = i % 2 ? '#B9BDC8' : '#9EA3B0'; c.beginPath(); c.arc(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.7, s * 0.38, 0, TAU); c.fill(); }
      cel(c, (k) => k.arc(0, 0, s * 0.75, 0, TAU), '#C9CDD8', s, lw, { noTone: true });
      c.fillStyle = INK; c.beginPath(); c.arc(-s * 0.25, -s * 0.1, s * 0.12, 0, TAU); c.arc(s * 0.25, -s * 0.1, s * 0.12, 0, TAU); c.fill();
      break;
    case 'soapmine':
      c.globalAlpha = 0.8;
      cel(c, (k) => k.arc(0, 0, s, 0, TAU), '#E8F4FF', s, lw, { noTone: true });
      c.globalAlpha = 1;
      c.beginPath(); c.arc(0, 0, s * 0.8, Math.PI * 1.1, Math.PI * 1.5); c.lineWidth = s * 0.1; c.strokeStyle = MAG; c.stroke();
      c.fillStyle = RED; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t; c.fillRect(Math.cos(a) * s - s * 0.1, Math.sin(a) * s - s * 0.1, s * 0.2, s * 0.2); }
      break;
    default:
      cel(c, (k) => k.arc(0, 0, s, 0, TAU), RED, s, lw);
  }
}

function drawCracks(c, tg, s) {
  const dmg = tg.maxHp - tg.hp;
  if (dmg <= 0) return;
  const r = mulberry32(Math.floor(tg.ph * 1000));
  c.beginPath();
  for (let k = 0; k < dmg * 2; k++) {
    let x = (r() - 0.5) * s, y = (r() - 0.5) * s;
    c.moveTo(x, y);
    for (let j = 0; j < 3; j++) { x += (r() - 0.5) * s * 0.6; y += (r() - 0.5) * s * 0.6; c.lineTo(x, y); }
  }
  c.lineWidth = Math.max(1, s * 0.05); c.strokeStyle = INK; c.stroke();
}

function drawGoldie(c, skin, s, lw, t, flap) {
  if (skin === 'butterfly') {
    c.fillStyle = 'rgba(255,240,170,0.85)';
    for (const d of [-1, 1]) { c.beginPath(); c.ellipse(d * s * 0.8, -s * 0.15, s * 0.7, s * (0.3 + 0.25 * flap), d * 0.4, 0, TAU); c.fill(); c.lineWidth = lw * 0.6; c.strokeStyle = INK; c.stroke(); }
    cel(c, (k) => k.roundRect(-s * 0.55, -s * 0.45, s * 1.1, s * 0.9, s * 0.12), '#FFE45C', s, lw);
  } else if (skin === 'goldrecord') {
    c.rotate(t * 6);
    cel(c, (k) => k.arc(0, 0, s, 0, TAU), '#FFC21A', s, lw);
    c.beginPath(); c.arc(0, 0, s * 0.65, 0, TAU); c.arc(0, 0, s * 0.4, 0, TAU); c.lineWidth = 1.5; c.strokeStyle = 'rgba(11,11,18,0.5)'; c.stroke();
    c.fillStyle = RED; c.beginPath(); c.arc(0, 0, s * 0.25, 0, TAU); c.fill();
  } else if (skin === 'goldcone') {
    cel(c, (k) => { k.moveTo(-s * 0.5, -s * 0.1); k.lineTo(0, s * 1.1); k.lineTo(s * 0.5, -s * 0.1); k.closePath(); }, '#E8A65A', s, lw);
    cel(c, (k) => k.arc(0, -s * 0.35, s * 0.6, 0, TAU), '#FFE45C', s * 0.6, lw);
  } else {
    cel(c, (k) => k.ellipse(0, s * 0.2, s * 0.95, s * 0.6, 0, 0, TAU), '#FFC21A', s, lw);
    cel(c, (k) => k.arc(s * 0.45, -s * 0.45, s * 0.45, 0, TAU), '#FFC21A', s * 0.45, lw);
    c.fillStyle = ORG; c.beginPath(); c.moveTo(s * 0.85, -s * 0.45); c.lineTo(s * 1.25, -s * 0.35); c.lineTo(s * 0.85, -s * 0.25); c.fill();
  }
}

function drawJunk(c, skin, s, lw, t, tg) {
  c.rotate(Math.sin(t * 0.7 + tg.ph) * 0.6);
  if (skin === 'tvjunk') {
    cel(c, (k) => k.roundRect(-s, -s * 0.75, s * 2, s * 1.5, s * 0.18), '#0FA3A3', s, lw);
    c.fillStyle = INK; c.fillRect(-s * 0.72, -s * 0.52, s * 1.1, s * 1.04);
    const r = mulberry32(Math.floor(t * 20 + tg.ph * 100));
    for (let i = 0; i < 14; i++) { c.fillStyle = r() < 0.5 ? '#FFFFFF' : '#8C8C94'; c.fillRect(-s * 0.7 + r() * s, -s * 0.5 + r() * s * 0.95, s * 0.12, s * 0.05); }
  } else if (skin === 'satdart' || skin === 'satellite') {
    const big = skin === 'satellite';
    for (const d of [-1, 1]) {
      cel(c, (k) => k.rect(d > 0 ? s * 0.45 : -s * (big ? 1.7 : 1.3), -s * 0.3, s * (big ? 1.25 : 0.85), s * 0.6), '#3D7BFF', s * 0.6, lw * 0.8, { noHi: true });
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1;
      c.beginPath(); for (let i = 1; i < 4; i++) { const xx = d > 0 ? s * 0.45 + i * s * (big ? 0.31 : 0.21) : -s * (big ? 1.7 : 1.3) + i * s * (big ? 0.31 : 0.21); c.moveTo(xx, -s * 0.3); c.lineTo(xx, s * 0.3); } c.stroke();
    }
    cel(c, (k) => k.roundRect(-s * 0.45, -s * 0.55, s * 0.9, s * 1.1, s * 0.15), '#D9DDEA', s * 0.6, lw);
    c.beginPath(); c.moveTo(0, -s * 0.55); c.lineTo(0, -s * 1.05); c.lineWidth = lw * 0.7; c.strokeStyle = INK; c.stroke();
    c.fillStyle = RED; c.beginPath(); c.arc(0, -s * 1.05, s * 0.12, 0, TAU); c.fill();
    if (big) drawCracks(c, tg, s);
  } else {
    cel(c, (k) => k.roundRect(-s * 0.55, -s * 0.85, s * 1.1, s * 1.7, s * 0.14), '#D9DDEA', s, lw);
    c.fillStyle = MAG; c.fillRect(-s * 0.55, -s * 0.3, s * 1.1, s * 0.6);
  }
}

// Enemy bolts: red-hot pellets with a short tail.
function drawBolt(c, b, dz) {
  projectDz(dz, b.u, b.v, PT);
  const r = Math.max(2, PT.k * (b.kind === 'bleach' ? 0.55 : 0.4));
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(PT.x, PT.y, 0, PT.x, PT.y, r * 2.4);
  g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.35, b.kind === 'bleach' ? 'rgba(130,200,255,0.8)' : 'rgba(255,45,58,0.85)'); g.addColorStop(1, 'rgba(255,45,58,0)');
  c.fillStyle = g; c.beginPath(); c.arc(PT.x, PT.y, r * 2.4, 0, TAU); c.fill();
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = b.kind === 'bleach' ? '#DDF2FF' : RED; c.beginPath(); c.arc(PT.x, PT.y, r, 0, TAU); c.fill();
  c.lineWidth = Math.max(1, r * 0.3); c.strokeStyle = INK; c.stroke();
}
