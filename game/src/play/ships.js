// GOO PRIX · src/play/ships.js — The eight spacecraft: stats, and their manga-style art in pure canvas.
'use strict';

// ============================================================================================
// CRAFT_DEFS — eight ships (and their pilots): stats are speed / handling / goo / armour, 1-5
// ============================================================================================
const RACERS = [
  { name: 'DOLLOP', pilot: 'BLORP', shape: 'dollop', stats: [3, 3, 3, 3], color: '#F4F4F4', trim: '#FF5A5F', engine: '#7FF2FF', bio: 'A CHEERFUL ROOKIE IN A TEARDROP HULL. BALANCED IN EVERY WAY.', bark: 'BLORP!' },
  { name: 'CREME ROYALE', pilot: 'DAME CUSTARD', shape: 'needle', stats: [5, 2, 2, 3], color: '#FFD23F', trim: '#FFF6E0', engine: '#FFB01F', bio: 'A HAUGHTY NEEDLE WITH ONE ENORMOUS ENGINE. FAST, BUT STIFF.', bark: 'HOW RUDE!' },
  { name: 'TOASTMASTER', pilot: 'SPROCKET', shape: 'twinboom', stats: [2, 5, 3, 3], color: '#FF7A1A', trim: '#4A4F5C', engine: '#FFE66B', bio: 'A BOXY TWIN-BOOM WITH FOUR THRUSTERS. TURNS ON A CRUMB.', bark: 'DING!' },
  { name: 'KNIT-WING', pilot: 'NANA FANG', shape: 'batwing', stats: [3, 4, 5, 1], color: '#A45BFF', trim: '#25202E', engine: '#FF4FD8', bio: 'FORWARD-SWEPT BAT WINGS, A BOTTOMLESS GOO TANK, PAPER ARMOUR.', bark: 'MIND YOUR MANNERS!' },
  { name: 'SPOREHAWK', pilot: 'MOLDY GREG', shape: 'dome', stats: [3, 3, 4, 3], color: '#19D3C5', trim: '#7A8090', engine: '#9BFFEA', bio: 'A SLIM HULL UNDER A RADAR DOME. SLEEPY, STEADY, STICKY.', bark: 'SPORE YOU LATER.' },
  { name: 'DILL-9', pilot: 'ZIPPY PICKLE', shape: 'dart', stats: [4, 5, 2, 1], color: '#18A558', trim: '#BFFFE0', engine: '#FFFFFF', bio: 'A CAPSULE DART WITH X-FINS. HYPER, TWITCHY, FRAGILE.', bark: 'BRINE TIME!' },
  { name: 'PUFFER', pilot: 'EL BUBBLO', shape: 'sphere', stats: [3, 2, 3, 5], color: '#2E9BFF', trim: '#FFFFFF', engine: '#7FF2FF', bio: 'A FAT SPHERE WITH SPIKE FINS AND A RING ENGINE. TOUGH AS NAILS.', bark: 'OLE!' },
  { name: 'CRUMB BARON', pilot: 'COUNT CRUMB', shape: 'saucer', stats: [4, 3, 4, 2], color: '#FF3B4E', trim: '#25202E', engine: '#FF8A3D', bio: 'A SAUCER WITH A SPLIT CAPE TAIL. THEATRICAL, AND YOUR RIVAL.', bark: 'CRUMBLED!' },
];
const STAT_NAMES = ['SPEED', 'HANDLING', 'GOO', 'ARMOUR'];
function statMul(def) {
  const [sp, hd, go, ar] = def.stats;
  return { spd: 1 + (sp - 3) * 0.025, flap: 1 + (hd - 3) * 0.04, steer: 1 + (hd - 3) * 0.08, goo: 1 + (go - 3) * 0.12, wt: ar };
}

// ============================================================================================
// CRAFT_ART — manga spacecraft seen from behind: cel shading, screentone, glints, panel lines,
// a glass canopy, glowing thrusters and speed lines. Units: s is half the ship's width.
// ============================================================================================
// A polygon from normalised points, scaled by s; mirror: also add the mirror image (for wings).
function polyPath(k, pts, s) { pts.forEach(([x, y], i) => (i ? k.lineTo(x * s, y * s) : k.moveTo(x * s, y * s))); k.closePath(); }
function mirrorPts(pts) { return pts.map(([x, y]) => [-x, y]).reverse(); }
// Wing points rotate about their root when the craft flaps (tips snap down).
function flapPts(pts, flap, side) {
  return pts.map(([x, y]) => [x, y + flap * 0.32 * Math.max(0, Math.abs(x) - 0.25) * (side ? 1 : 1)]);
}

const SHIP_SHAPES = {
  dollop: {
    wings: [[0.3, -0.02], [0.82, 0.05], [0.84, 0.2], [0.3, 0.22]],
    hull: (k, s) => { k.moveTo(0, -s * 0.62); k.bezierCurveTo(s * 0.5, -s * 0.5, s * 0.52, s * 0.3, 0, s * 0.42); k.bezierCurveTo(-s * 0.52, s * 0.3, -s * 0.5, -s * 0.5, 0, -s * 0.62); },
    pods: [[-0.66, 0.12, 0.24], [0.66, 0.12, 0.24]],
    engines: [[-0.66, 0.12, 0.13], [0.66, 0.12, 0.13], [0, 0.22, 0.12]],
    canopy: [0, -0.3, 0.22, 0.14], panels: [[-0.38, 0.0, 0.38, 0.0]],
  },
  needle: {
    wings: [[0.12, 0.0], [1.0, 0.3], [0.96, 0.38], [0.12, 0.3]],
    hull: (k, s) => k.ellipse(0, 0, s * 0.22, s * 0.6, 0, 0, TAU),
    fins: [[[0, -0.55], [0.06, -0.95], [0.12, -0.5]]],
    engines: [[0, 0.3, 0.2]],
    canopy: [0, -0.28, 0.12, 0.16], panels: [[-0.2, 0.05, 0.2, 0.05]],
  },
  twinboom: {
    wings: [[0.2, -0.1], [0.9, -0.08], [0.9, 0.08], [0.2, 0.06]],
    booms: [[-0.72, -0.4, 0.3, 0.8], [0.42, -0.4, 0.3, 0.8]],
    hull: (k, s) => k.roundRect(-s * 0.24, -s * 0.38, s * 0.48, s * 0.62, s * 0.1),
    engines: [[-0.62, 0.28, 0.08], [-0.48, 0.28, 0.08], [0.48, 0.28, 0.08], [0.62, 0.28, 0.08]],
    canopy: [0, -0.22, 0.16, 0.11], panels: [[-0.24, 0.0, 0.24, 0.0], [-0.72, 0.0, -0.42, 0.0], [0.42, 0.0, 0.72, 0.0]],
  },
  batwing: {
    wings: [[0.18, -0.06], [1.02, -0.5], [0.86, -0.08], [0.66, 0.14], [0.44, 0.0], [0.18, 0.2]],
    hull: (k, s) => k.arc(0, 0, s * 0.3, 0, TAU),
    fins: [[[-0.12, -0.25], [-0.2, -0.55], [-0.02, -0.28]], [[0.12, -0.25], [0.2, -0.55], [0.02, -0.28]]],
    engines: [[0, 0.18, 0.13]],
    canopy: [0, -0.1, 0.16, 0.11], panels: [],
  },
  dome: {
    wings: [[0.16, 0.05], [0.72, 0.16], [0.7, 0.28], [0.16, 0.26]],
    hull: (k, s) => k.roundRect(-s * 0.18, -s * 0.36, s * 0.36, s * 0.8, s * 0.16),
    dome: [0, -0.36, 0.5, 0.26],
    engines: [[-0.09, 0.36, 0.08], [0.09, 0.36, 0.08]],
    canopy: [0, -0.08, 0.1, 0.12], panels: [[-0.18, 0.16, 0.18, 0.16]],
  },
  dart: {
    wings: [[0.1, 0.18], [0.62, 0.62], [0.52, 0.7], [0.08, 0.32]],
    upfins: [[0.1, -0.2], [0.6, -0.62], [0.5, -0.7], [0.08, -0.34]],
    hull: (k, s) => k.roundRect(-s * 0.17, -s * 0.62, s * 0.34, s * 1.18, s * 0.17),
    engines: [[0, 0.5, 0.13]],
    canopy: [0, -0.4, 0.12, 0.16], panels: [[-0.17, 0.0, 0.17, 0.0], [-0.17, 0.2, 0.17, 0.2]],
  },
  sphere: {
    spikes: true,
    hull: (k, s) => k.arc(0, 0, s * 0.56, 0, TAU),
    ring: [0, 0.1, 0.27],
    engines: [[0, 0.1, 0.18]],
    canopy: [0, -0.34, 0.18, 0.11], panels: [[-0.5, -0.12, 0.5, -0.12]],
  },
  saucer: {
    cape: [[0.12, 0.08], [0.46, 0.72], [0.3, 0.74], [0.04, 0.2]],
    hull: (k, s) => k.ellipse(0, 0, s, s * 0.3, 0, 0, TAU),
    engines: [[-0.48, 0.12, 0.09], [0, 0.16, 0.1], [0.48, 0.12, 0.09]],
    canopy: [0, -0.24, 0.32, 0.22], panels: [[-0.9, 0.0, 0.9, 0.0]],
  },
};

function engineGlow(c, x, y, r, color, t, thrust) {
  const f = (1 + 0.15 * Math.sin(t * 47 + x)) * (1 + (thrust || 0) * 0.9);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r * 2.6 * f);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.3, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.6 * f, 0, TAU); c.fill();
  c.restore();
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = Math.max(1.5, r * 0.3); c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.arc(x, y, r * 0.55, 0, TAU); c.fillStyle = '#FFFFFF'; c.fill();
}

// Draw ship `def` from behind at (x, y), `size` px wide. o: flap (0..1), roll, stun, alpha, t,
// thrust (0..1 flame size), speed (speed lines), shield, ghost, goo (dripping), splats.
function drawShip(c, def, x, y, size, o) {
  o = o || {};
  const s = size / 2, t = o.t != null ? o.t : (world ? world.t : 0);
  const lw = Math.max(1.4, size * 0.024), lwi = Math.max(1, lw * 0.45);
  const sh = SHIP_SHAPES[def.shape];
  const flap = o.flap || 0;
  c.save();
  c.translate(x, y);
  if (o.roll) c.rotate(o.roll);
  if (o.stun) c.rotate(Math.sin(t * 30) * 0.5);
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  if (o.ghost) c.globalAlpha *= 0.55;
  // speed lines streaming back from the wingtips
  if (o.speed && size > 40) {
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineCap = 'round';
    const r = mulberry32(Math.floor(t * 30));
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1, yy = -s * 0.2 + r() * s * 0.6;
      c.lineWidth = 1 + r() * 2.5;
      c.beginPath(); c.moveTo(side * s * (0.9 + r() * 0.2), yy); c.lineTo(side * s * (1.6 + r() * 0.8), yy + s * (0.4 + r() * 0.5)); c.stroke();
    }
    c.restore();
  }
  // wings (drawn behind the hull), mirrored, snapping down on a flap
  if (sh.wings) for (const side of [-1, 1]) {
    const pts = flapPts(sh.wings, flap, side).map(([px, py]) => [px * side, py]);
    cel(c, (k) => polyPath(k, pts, s), def.trim === '#FFF6E0' || def.trim === '#FFFFFF' || def.trim === '#BFFFE0' ? shade(def.color, 0.85) : def.trim, s * 0.5, lw);
    // a stripe of the hull colour along each wing's leading edge
    c.beginPath(); c.moveTo(pts[0][0] * s, pts[0][1] * s); c.lineTo(pts[1][0] * s, pts[1][1] * s);
    c.lineWidth = lw * 1.4; c.strokeStyle = def.color; c.stroke();
  }
  if (sh.upfins) for (const side of [-1, 1]) cel(c, (k) => polyPath(k, sh.upfins.map(([px, py]) => [px * side, py]), s), def.trim === '#BFFFE0' ? shade(def.color, 0.8) : def.trim, s * 0.4, lw);
  if (sh.cape) for (const side of [-1, 1]) cel(c, (k) => polyPath(k, sh.cape.map(([px, py]) => [px * side, py + flap * 0.08]), s), def.trim, s * 0.5, lw);
  if (sh.booms) for (const [bx, by, bw, bh] of sh.booms) cel(c, (k) => k.roundRect(bx * s, by * s, bw * s, bh * s, s * 0.08), def.color, s * 0.5, lw);
  if (sh.spikes) {
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU + 0.3;
      cel(c, (k) => { k.moveTo(Math.cos(a - 0.18) * s * 0.5, Math.sin(a - 0.18) * s * 0.5); k.lineTo(Math.cos(a) * s * 0.86, Math.sin(a) * s * 0.86); k.lineTo(Math.cos(a + 0.18) * s * 0.5, Math.sin(a + 0.18) * s * 0.5); k.closePath(); }, def.trim, s * 0.2, lwi * 1.4, { noTone: true });
    }
  }
  if (sh.pods) for (const [px, py, pr] of sh.pods) cel(c, (k) => k.arc(px * s, py * s, pr * s, 0, TAU), def.color, pr * s, lw);
  // the hull itself
  cel(c, (k) => sh.hull(k, s), def.color, s * 0.55, lw);
  if (sh.dome) { const [dx, dy, dw, dh] = sh.dome; cel(c, (k) => { k.ellipse(dx * s, dy * s, dw * s, dh * s, 0, Math.PI, 0); k.closePath(); }, def.trim, s * 0.4, lw); }
  if (sh.fins) for (const f of sh.fins) cel(c, (k) => polyPath(k, f, s), def.trim === '#FFF6E0' ? shade(def.color, 0.8) : def.trim, s * 0.25, lw, { noTone: true });
  // panel lines and rivets
  if (size > 50) {
    c.save(); c.globalAlpha *= 0.6;
    c.strokeStyle = INK; c.lineWidth = lwi;
    c.beginPath();
    for (const [x0, y0, x1, y1] of sh.panels) { c.moveTo(x0 * s, y0 * s); c.lineTo(x1 * s, y1 * s); }
    c.stroke();
    c.fillStyle = INK;
    for (const [x0, y0, x1] of sh.panels) for (let k2 = 1; k2 < 4; k2++) c.fillRect(lerp(x0, x1, k2 / 4) * s - 1, y0 * s + lwi * 2, 2, 2);
    c.restore();
  }
  // the glass canopy: a deep blue dome with a white slash of reflection
  if (sh.canopy) {
    const [cx, cy, rx, ry] = sh.canopy;
    const g = c.createLinearGradient(0, (cy - ry) * s, 0, (cy + ry) * s);
    g.addColorStop(0, '#9FD8FF'); g.addColorStop(0.45, '#1F3B8C'); g.addColorStop(1, '#0B1240');
    c.beginPath(); c.ellipse(cx * s, cy * s, rx * s, ry * s, 0, 0, TAU); c.fillStyle = g; c.fill();
    c.lineWidth = lw * 0.8; c.strokeStyle = INK; c.stroke();
    c.save(); c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = Math.max(1, ry * s * 0.35);
    c.beginPath(); c.moveTo((cx - rx * 0.7) * s, (cy + ry * 0.2) * s); c.lineTo((cx - rx * 0.1) * s, (cy - ry * 0.8) * s); c.stroke();
    c.restore();
  }
  // ring engine (the Puffer) and the thrusters, all glowing back at the camera
  if (sh.ring) {
    const [rx, ry, rr] = sh.ring;
    c.beginPath(); c.arc(rx * s, ry * s, rr * s, 0, TAU); c.lineWidth = rr * s * 0.45 + 3; c.strokeStyle = INK; c.stroke();
    c.lineWidth = rr * s * 0.45; c.strokeStyle = '#D9DDEA'; c.stroke();
  }
  for (const [ex, ey, er] of sh.engines) engineGlow(c, ex * s, ey * s, er * s, def.engine, t, o.thrust);
  // a manga glint that sweeps the hull every couple of seconds
  const gl = (t * 0.5 + def.name.length * 0.13) % 2;
  if (gl < 0.35 && size > 40) glint(c, -s * 0.25, -s * 0.35, s * 0.22 * Math.sin(gl / 0.35 * Math.PI), 0.95);
  // goo on the ship: stuck splats and drips while gooped
  if (o.splats) for (const sp of o.splats) gooSplat(c, sp.x * s, sp.y * s, s * 0.24, sp.seed, Math.min(1, (sp.life == null ? 1 : sp.life)), sp.t);
  if (o.goo) {
    for (let i = 0; i < 3; i++) {
      const dy = ((t * 1.1 + i * 0.37) % 1) * s * 0.8;
      c.beginPath(); c.roundRect(-s * 0.3 + i * s * 0.3 - s * 0.04, s * 0.15, s * 0.08, dy + s * 0.1, s * 0.04);
      gooShade(c, -s * 0.3 + i * s * 0.3, s * 0.2 + dy / 2, s * 0.12);
    }
  }
  if (o.shield) {
    c.save();
    const g = c.createRadialGradient(0, 0, s * 0.8, 0, 0, s * 1.3);
    g.addColorStop(0, 'rgba(25,224,208,0)'); g.addColorStop(0.85, 'rgba(25,224,208,0.25)'); g.addColorStop(1, 'rgba(232,255,252,0.7)');
    c.fillStyle = g; c.beginPath(); c.arc(0, -s * 0.05, s * 1.3, 0, TAU); c.fill();
    c.setLineDash([size * 0.06, size * 0.05]); c.lineDashOffset = -t * 40;
    c.lineWidth = Math.max(1.5, lw * 0.8); c.strokeStyle = AQUA; c.stroke();
    c.restore();
  }
  c.restore();
}
// Older callers draw "racer art": it is the ship now.
function drawRacerArt(c, def, x, y, size, o) { drawShip(c, def, x, y, size * 1.15, Object.assign({}, o, { fill: undefined })); }
