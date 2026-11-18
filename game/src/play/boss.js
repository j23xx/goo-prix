// GOO PRIX · src/play/boss.js — The final boss, Mister Spotless: a chrome cleaning mech you defeat with filth.
'use strict';

// ============================================================================================
// BOSS — three phases, a FILTH bar to fill, turrets to jam, squeegee walls to thread, a maw to feed
// ============================================================================================
// Boss-local coordinates are in track units around the boss's centre (u right, v up).
const BOSS = {
  body: [6.6, 5.2],
  turrets: [[-7.6, 1.2], [7.6, 1.2]],
  stains: [[-4.2, 0.0], [4.2, -0.1], [-3.0, -3.1], [3.1, -3.0]],   // cheeks and jowls, clear of the face
  maw: [0, -1.5],
  time: 150,
};

// What he says while you fight him: prim, then rattled, then desperate.
const BOSS_TAUNTS = [
  ['Wipe your feet!', 'Disgusting!', 'This is a clean zone!', 'Not on my tiles!'],
  ['Stop that at once!', 'I just polished that!', 'You absolute smear!'],
  ['My finish!', 'I am not a doormat!', 'Somebody fetch a mop!'],
];

function setupBoss() {
  world.boss = {
    dist: 70, u: 0, v: 7, filth: 0, phase: 1, time: BOSS.time, stun: 0, hitT: 0,
    turrets: BOSS.turrets.map(([x, y], i) => ({ x, y, hp: 6, fireT: 1.6 + i * 0.7 })),
    wipeT: 6, sweepT: 4, spitT: 3, spinT: 3, maw: 0, splats: [], dead: false, deadT: 0, bleach: 0, armT: 0,
  };
}

function bossStainsExposed() {
  const b = world.boss;
  if (b.phase >= 3) return [0, 1, 2, 3];
  return [Math.floor(world.t / 5) % 4];   // one stain at a time, moving round every 5 s
}

// The best place for the auto-aim on the boss: an exposed stain, else a live turret, else the core.
function bossAimPoint() {
  const b = world.boss;
  if (!b || b.dead) return null;
  const p = world.player;
  if (gap(p.dist, b.dist) > 100) return null;
  let best = null;
  const consider = (x, y) => { const d = Math.hypot(b.u + x - p.u, b.v + y - p.v); if (!best || d < best.d) best = { u: b.u + x, v: b.v + y, d }; };
  for (const i of bossStainsExposed()) consider(BOSS.stains[i][0], BOSS.stains[i][1]);
  if (!best) for (const tr of b.turrets) if (tr.hp > 0) consider(tr.x, tr.y);
  if (b.maw > 0.5) consider(BOSS.maw[0], BOSS.maw[1]);
  if (!best) consider(0, 0);
  return { u: best.u, v: best.v, dist: b.dist };
}

// Does glob g hit the boss? Works out which part it hit and what that does.
function bossCatch(g) {
  const b = world.boss;
  if (!b || b.dead || Math.abs(gap(g.dist, b.dist)) > 2.2 + g.vs * 0.02) return false;
  const x = g.u - b.u, y = g.v - b.v;
  const near = (px, py, r) => Math.abs(x - px) < r && Math.abs(y - py) < r;
  for (const tr of b.turrets) {
    if (tr.hp > 0 && near(tr.x, tr.y, 1.5)) {
      tr.hp -= g.dmg;
      bossSplat(x, y, 0.5);
      if (tr.hp <= 0) { award(1000, 'TURRET'); bossDamage(2, g); popup('TURRET JAMMED!', 'mid'); say('Jammed!', 2); burst(b.dist, b.u + tr.x, b.v + tr.y, 20, 'goo'); sfx.bonk(); }
      else sfx.wallSplat();
      return true;
    }
  }
  for (const i of bossStainsExposed()) {
    const [sx0, sy0] = BOSS.stains[i];
    if (near(sx0, sy0, 1.5)) { bossSplat(x, y, 0.8); bossDamage(1.5 * g.dmg * (hasMix('turpentine') ? 1.5 : 1), g); worldPopup('STAIN!', b.dist, b.u + sx0, b.v + sy0 + 1.2); return true; }
  }
  if (b.maw > 0.5 && near(BOSS.maw[0], BOSS.maw[1], 1.8)) { bossSplat(x, y, 0.65); bossDamage(1.5 * g.dmg * (hasMix('turpentine') ? 1.5 : 1), g); return true; }
  if ((x / BOSS.body[0]) ** 2 + (y / BOSS.body[1]) ** 2 < 1) { bossSplat(x, y, 0.55); bossDamage(0.5 * g.dmg, g); return true; }
  return false;
}
function bossSplat(x, y, r) {
  const b = world.boss;
  b.splats.push({ x, y, r: r * rnd(0.8, 1.3), seed: rndInt(1, 99999), t0: world.t });
  if (b.splats.length > 22) b.splats.shift();
  b.hitT = 0.12;
}

// Filth goes on, the chain grows, and the phases turn over at 40% and 75%.
function bossDamage(amt, g) {
  const b = world.boss;
  if (!b || b.dead) return;
  // a run that arrives loaded with Mix-ins finds him a little tougher to dirty
  b.filth = Math.min(100, b.filth + amt * [1.25, 1, 0.8][game.diff] / (1 + 0.1 * mixinCount()));
  registerHit();
  award(Math.round(20 * amt) * world.mult);
  if (!world.attract && g) sfx.splat();
  const phase = b.filth >= 75 ? 3 : b.filth >= 40 ? 2 : 1;
  if (phase > b.phase) {
    b.phase = phase;
    award(5000, 'PHASE');
    popup(phase === 2 ? 'HE\'S FILTHY!' : 'STAINS EXPOSED!', 'big');
    popup(phase === 2 ? 'THE MAW OPENS: FEED IT GOO' : 'FINAL PHASE: HIT THE GOLD', 'small');
    say(phase === 2 ? 'He\'s filthy!' : 'Finish him!', 3);
    shake(14); world.flash2 = 0.2;
  }
  if (b.filth >= 100) {
    b.dead = true; b.deadT = 0;
    world.slowmo = 1.2;
    for (let i = 0; i < 4; i++) world.blasts.push({ dist: b.dist, u: b.u + rnd(-4, 4), v: b.v + rnd(-3, 3), t: -i * 0.12 });
    windscreenGoo(4); world.flash2 = 0.5; shake(22); sfx.bomb();
  }
}

function updateBoss(dt) {
  const w = world, b = w.boss, p = w.player, t = w.t;
  b.hitT = Math.max(0, b.hitT - dt);
  // he hangs a fixed way ahead (drifting closer as he gets angrier), so the chase never ends
  b.off = damp(b.off == null ? 90 : b.off, 42 - b.phase * 3 + Math.sin(t * 0.5) * 3, 1.2, dt);
  b.dist = p.dist + b.off;
  b.u = Math.sin(t * 0.4) * 2.5;
  b.v = 7 + Math.sin(t * 0.6) * 1.4;
  b.maw = damp(b.maw, b.phase >= 2 ? 1 : 0, 3, dt);
  b.armT += dt;
  b.bleach = b.time < 30 && !b.dead ? (30 - b.time) / 30 * 0.7 : 0;   // the clock running out drains the colour
  if (b.dead) {
    b.deadT += dt;
    if (b.deadT > 1.6 && w.state === 'run') finishLevel(true);
    return;
  }
  if (w.state !== 'run' || w.attract) return;
  b.time -= dt;
  if (b.time <= 0) { b.time = 0; finishLevel(false); return; }
  b.tauntT = (b.tauntT == null ? 6 : b.tauntT) - dt;
  if (b.tauntT <= 0) {
    b.tauntT = rnd(9, 13);
    const line = pick(b.phase === 1 ? BOSS_TAUNTS[0] : b.phase === 2 ? BOSS_TAUNTS[1] : BOSS_TAUNTS[2]);
    say(line, 1, { cooldown: 4000, pitch: 0.6, rate: 0.9 }); popup('"' + line.toUpperCase() + '"', 'small');
  }
  if (b.stun > 0) { b.stun -= dt; return; }
  // the squeegee wipes some filth off every few seconds, unless a turret has been jammed
  b.wipeT -= dt;
  if (b.wipeT <= 0) {
    b.wipeT = 7;
    if (b.turrets.every((tr) => tr.hp > 0) && b.filth > 0) {
      b.filth = Math.max(b.phase >= 3 ? 75 : b.phase >= 2 ? 40 : 0, b.filth - 2); b.splats.splice(0, 4);
      popup('SQUEEGEE! -2%', 'small'); sfx.wipe();
    }
  }
  // spray-bottle turrets fire aimed bleach bolts
  for (const tr of b.turrets) {
    if (tr.hp <= 0) continue;
    tr.fireT -= dt;
    if (tr.fireT <= 0) { tr.fireT = (b.phase >= 3 ? rnd(1.5, 2.1) : rnd(2.1, 2.9)) * [1.25, 1, 0.85][game.diff]; fireBolt(b.dist - 2, b.u + tr.x, b.v + tr.y, { kind: 'bleach', vs: 6, lead: 0 }); }
  }
  // phase 1: the squeegee sweeps a full-width wall with one window
  b.sweepT -= dt;
  if (b.sweepT <= 0) {
    b.sweepT = b.phase >= 2 ? 9 : 6.5;
    w.walls.push({ kind: 'gate', dist: b.dist - 3, vs: -22, u: rnd(-6, 6), v: rnd(4, 10), w: 7, h: 5.2, slide: 0, period: 2.4, phase: 0, decals: [], s: 0, passed: false });
  }
  // phase 2: suction toward the maw, dust bunnies to shoot (they refill your goo) and soap mines
  if (b.phase >= 2) {
    p.vu += Math.sign(b.u - p.u) * 12 * dt;
    b.spitT -= dt;
    if (b.spitT <= 0) {
      b.spitT = rnd(1.4, 2.2);
      const mine = rand() < 0.4;
      const tg = spawnTarget(mine ? 'tank' : 'floater', b.dist - 3, clamp(b.u + rnd(-3, 3), -10, 10), clamp(b.v + BOSS.maw[1], 2, 12), mine ? { skin: 'soapmine', hp: 1, pts: 150, mine: true } : { skin: 'dustbunny', refill: true, pts: 80 });
      tg.bu = clamp(p.u + rnd(-4, 4), -10, 10); tg.bv = clamp(p.v + rnd(-2, 2), 2, 12);
    }
  }
  // phase 3: rotating laser-mop spinners come down the corridor
  if (b.phase >= 3) {
    b.spinT -= dt;
    if (b.spinT <= 0) { b.spinT = 5; w.walls.push({ kind: 'rotor', dist: b.dist - 3, vs: -20, u: rnd(-3, 3), v: 7, len: 6.4, w: 1.2, speed: rnd(1.4, 2) * (rand() < 0.5 ? -1 : 1), spun: rnd(0, TAU), angle: 0, jam: 0, decals: [], s: 0, passed: false }); }
  }
  // the walls the boss throws at you: thread them or take the knock
  for (const wl of w.walls) {
    wl.dist += wl.vs * dt;
    wl.s = wrap(wl.dist, TRACK.L);
    if (wl.kind === 'rotor') { if (wl.jam > 0) wl.jam -= dt; else wl.spun += wl.speed * dt; }
    if (!wl.passed && gap(p.dist, wl.dist) <= 0) {
      wl.passed = true;
      if (p.ghost <= 0 && thingBlocks(wl, p.u, p.v, t) === 'bonk') {
        if (p.shield > 0) popShield(p);
        else { knock(wl.kind === 'gate' ? 'wall' : 'hazard', 'BONK'); p.speed *= 0.6; p.stun = 0.4; shake(10); sfx.bonk(); popup('BONK!', 'big'); burst(p.dist, p.u, p.v, 12, 'shard'); }
      } else if (wl.kind === 'gate') { award(150, 'THREAD'); sfx.gate(4); }
    }
  }
  w.walls = w.walls.filter((wl) => gap(p.dist, wl.dist) > -12);
}

// A Mister Spotless that is only for show (title art, intro card, step tiles): no fight attached.
function bossDummy(o) {
  return Object.assign({ u: 0, v: 0, dist: 0, filth: 0, phase: 1, maw: 0.3, turrets: BOSS.turrets.map(([x, y]) => ({ x, y, hp: 6 })), splats: [], dead: false, stun: 0, hitT: 0, armT: 0, bleach: 0 }, o);
}
// ---- drawing Mister Spotless: a chrome body, mop crest, squeegee arms, spray-bottle turrets,
// a vacuum maw and gold stains, getting filthier with every hit
function drawBoss(c, b, dz) {
  projectDz(dz, b.u, b.v, PT);
  if (PT.k < 0.5) return;
  drawBossAt(c, b, PT.x, PT.y, PT.k, world.t, cam.roll);
}
function drawBossAt(c, b, x, y, k, t, roll) {
  const U = (u) => u * k, V = (v) => -v * k;
  const lw = clamp(k * 0.22, 2, 7);
  c.save();
  c.translate(x, y); if (roll) c.rotate(roll);
  if (b.dead) { c.rotate(Math.sin(b.deadT * 20) * 0.15); c.globalAlpha = clamp(1 - (b.deadT - 1) * 1.5, 0, 1); }
  if (b.stun > 0) c.rotate(Math.sin(t * 30) * 0.08);
  // squeegee arms behind the body
  for (const side of [-1, 1]) {
    const sw = Math.sin(b.armT * 1.3 + side) * 0.35;
    c.save(); c.translate(U(side * 4.8), V(0.6)); c.rotate(side * (0.25 + sw));
    c.beginPath(); c.roundRect(side > 0 ? 0 : -U(5.2), -U(0.45), U(5.2), U(0.9), U(0.3));
    const ag = c.createLinearGradient(0, -U(0.45), 0, U(0.45));
    ag.addColorStop(0, '#F2F5F9'); ag.addColorStop(0.5, '#8E98A8'); ag.addColorStop(1, '#C9D0DA');
    c.fillStyle = ag; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
    c.fillStyle = INK; c.fillRect(side > 0 ? U(4.6) : -U(5.4), -U(1.6), U(0.8), U(3.2));   // the rubber blade
    c.restore();
  }
  // the body: polished chrome with hard reflection bands
  const [bw, bh] = BOSS.body;
  c.beginPath(); c.ellipse(0, 0, U(bw), U(bh), 0, 0, TAU);
  const g = c.createLinearGradient(0, V(bh), 0, V(-bh));
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.18, '#D7DDE6'); g.addColorStop(0.42, '#7C8698'); g.addColorStop(0.5, '#4A5262');
  g.addColorStop(0.58, '#B5BDCA'); g.addColorStop(0.85, '#E9EDF2'); g.addColorStop(1, '#8D96A6');
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  // filth tint creeps over the chrome as it fills up
  c.fillStyle = 'rgba(70,90,20,' + (b.filth / 100 * 0.45).toFixed(3) + ')'; c.fillRect(-U(bw), V(bh), U(bw * 2), U(bh * 2));
  c.globalAlpha = 0.5; c.fillStyle = '#FFFFFF';
  c.beginPath(); c.ellipse(-U(4.5), V(2.3), U(1.2), U(0.42), -0.7, 0, TAU); c.fill();
  c.globalAlpha = 1;
  c.strokeStyle = 'rgba(11,11,18,0.45)'; c.lineWidth = Math.max(1, lw * 0.35);
  c.beginPath(); c.moveTo(0, V(bh)); c.lineTo(0, V(3.3)); c.stroke();
  c.restore();
  c.beginPath(); c.ellipse(0, 0, U(bw), U(bh), 0, 0, TAU); c.lineWidth = lw * 1.3; c.strokeStyle = INK; c.stroke();
  // the mop-head crest
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI * (0.15 + 0.7 * i / 25);
    const bx = Math.cos(a) * U(bw * 0.72), by = V(bh * 0.86) + Math.sin(a) * U(0.6);
    const sw = Math.sin(t * 3 + i) * U(0.4);
    c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + sw, by - U(1.4), bx + sw * 1.6, by - U(2.4 + (i % 3) * 0.3));
    c.lineCap = 'round'; c.lineWidth = U(0.42) + 2; c.strokeStyle = INK; c.stroke();
    c.lineWidth = U(0.42); c.strokeStyle = i % 2 ? '#F4F4F4' : '#C9CDD8'; c.stroke();
  }
  // the face, big enough to read from across the room: angry brows, a visor with two slanted
  // glowing eyes, a toothy vacuum mouth that gapes in phase 2, and a prim red bow tie
  const eyeCol = b.phase >= 3 ? '#FF2D3A' : '#7FF2FF';
  const quad = (pts) => { c.beginPath(); pts.forEach(([u, v], i) => (i ? c.lineTo(U(u), V(v)) : c.moveTo(U(u), V(v)))); c.closePath(); };
  for (const s of [-1, 1]) { quad([[s * 0.35, 2.6], [s * 0.35, 3.25], [s * 3.4, 4.05], [s * 3.55, 3.35]]); c.fillStyle = INK; c.fill(); }
  c.beginPath(); c.roundRect(-U(3.6), V(2.45), U(7.2), U(2.15), U(0.8)); c.fillStyle = '#10141F'; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
  for (const s of [-1, 1]) {
    quad([[s * 0.55, 1.7], [s * 3.05, 2.15], [s * 2.85, 0.7], [s * 0.7, 0.7]]);
    c.fillStyle = eyeCol; c.fill();
    c.save(); c.globalCompositeOperation = 'lighter';
    const eg = c.createRadialGradient(U(s * 1.8), V(1.35), 0, U(s * 1.8), V(1.35), U(2.2));
    eg.addColorStop(0, b.phase >= 3 ? 'rgba(255,45,58,0.55)' : 'rgba(127,242,255,0.5)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = eg; c.fillRect(U(s * 1.8) - U(2.2), V(1.35) - U(2.2), U(4.4), U(4.4));
    c.restore();
    c.fillStyle = '#FFFFFF'; c.fillRect(U(s * 1.55) - U(0.3), V(1.6), U(0.6), U(0.55));
  }
  // the vacuum mouth, gaping open in phase 2 with a gold core inside and a row of teeth
  const [mx, my] = BOSS.maw, mw = 2.4, mh = 0.3 + 1.6 * b.maw;
  c.beginPath(); c.ellipse(U(mx), V(my), U(mw), U(mh), 0, 0, TAU);
  c.fillStyle = '#05070D'; c.fill();
  c.save(); c.clip();
  if (b.maw > 0.3) {
    c.strokeStyle = 'rgba(127,242,255,0.6)'; c.lineWidth = 2;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(U(mx), V(my), U(mw - 0.1 - i * 0.42), U(mh * (1 - i * 0.18)), t * 2 + i, 0, TAU); c.stroke(); }
    c.save(); c.globalCompositeOperation = 'lighter';
    const cg = c.createRadialGradient(U(mx), V(my), 0, U(mx), V(my), U(1.1));
    cg.addColorStop(0, 'rgba(255,255,255,1)'); cg.addColorStop(0.4, 'rgba(255,194,26,0.9)'); cg.addColorStop(1, 'rgba(255,194,26,0)');
    c.fillStyle = cg; c.fillRect(U(mx - 2), V(my + 2), U(4), U(4));
    c.restore();
  }
  const tooth = Math.min(0.75, mh * 0.45);
  c.fillStyle = '#F4F6FA'; c.strokeStyle = INK; c.lineWidth = Math.max(1, lw * 0.45);
  for (let i = 0; i < 6; i++) {
    const tu = mx - 2.0 + i * 0.8;
    quad([[tu - 0.38, my + mh + 0.2], [tu + 0.38, my + mh + 0.2], [tu, my + mh * Math.sqrt(Math.max(0, 1 - (tu / mw) ** 2)) - tooth]]); c.fill(); c.stroke();
    if (i < 5) { const bu = tu + 0.4; quad([[bu - 0.34, my - mh - 0.2], [bu + 0.34, my - mh - 0.2], [bu, my - mh * Math.sqrt(Math.max(0, 1 - (bu / mw) ** 2)) + tooth * 0.8]]); c.fill(); c.stroke(); }
  }
  c.restore();
  c.beginPath(); c.ellipse(U(mx), V(my), U(mw), U(mh), 0, 0, TAU); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
  // the bow tie
  for (const s of [-1, 1]) { quad([[s * 0.2, -4.15], [s * 1.7, -3.5], [s * 1.7, -4.8]]); c.fillStyle = '#FF2D3A'; c.fill(); c.lineWidth = lw * 0.8; c.strokeStyle = INK; c.stroke(); }
  c.beginPath(); c.roundRect(-U(0.4), V(-3.8), U(0.8), U(0.7), U(0.2)); c.fillStyle = '#C8102E'; c.fill(); c.stroke();
  // the gold stains: weak points, pulsing when exposed
  const exposed = b.phase >= 3 ? [0, 1, 2, 3] : [Math.floor(t / 5) % 4];
  BOSS.stains.forEach(([sx0, sy0], i) => {
    const on = exposed.includes(i);
    const pulse = on ? 1 + 0.12 * Math.sin(t * 8 + i) : 0.85;
    c.save(); c.translate(U(sx0), V(sy0)); c.scale(pulse, pulse);
    const pts = [];
    for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; const rr = U(0.85 * (0.8 + ((i * 7 + j * 3) % 5) * 0.08)); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    c.beginPath(); smoothPath(c, pts);
    c.fillStyle = on ? '#FFC21A' : 'rgba(200,170,90,0.45)'; c.fill(); c.lineWidth = Math.max(1.5, lw * 0.6); c.strokeStyle = INK; c.stroke();
    if (on) glint(c, -U(0.25), -U(0.3), U(0.5) * (0.6 + 0.4 * Math.sin(t * 9 + i)), 0.95);
    c.restore();
  });
  // spray-bottle turrets on the shoulders
  for (const tr of b.turrets) {
    c.save(); c.translate(U(tr.x), V(tr.y));
    if (tr.hp <= 0) c.rotate(tr.x > 0 ? 0.7 : -0.7);
    c.beginPath(); c.roundRect(-U(0.75), -U(0.6), U(1.5), U(2.4), U(0.35)); c.fillStyle = tr.hp > 0 ? '#E8F7FF' : '#9AA6B8'; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(25,224,208,0.55)'; c.fillRect(-U(0.6), U(0.5), U(1.2), U(1.1));
    c.beginPath(); c.roundRect(-U(0.5), -U(1.4), U(1.0), U(0.85), U(0.15)); c.fillStyle = RED; c.fill(); c.stroke();
    c.fillStyle = INK; c.fillRect(-U(0.15), -U(1.6), U(0.3), U(0.3));
    if (tr.hp <= 0) gooBlob(c, 0, -U(0.9), U(0.9), 5, t);
    c.restore();
  }
  // the goo the player has thrown at him, running down the chrome
  for (const sp of b.splats) gooSplat(c, U(sp.x), V(sp.y), U(sp.r), sp.seed, 0.95, Math.min(0.6, t - sp.t0));
  if (b.hitT > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = b.hitT * 3; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, 0, U(bw), U(bh), 0, 0, TAU); c.fill(); }
  c.restore();
}

// Walls and spinners the boss throws: drawn with the same art as the track's own.
function drawBossWall(c, wl, dz) {
  if (wl.kind === 'gate') drawGate(c, wl, dz, true);
  else drawRotor(c, wl, dz);
}
