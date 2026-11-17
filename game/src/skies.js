// GOO PRIX · src/skies.js — Each world's sky, fog colour and set pieces.
'use strict';

// ============================================================================================
// THEMES — the goo world's looks: fog toward each track's horizon colour, skies, grounds, props
// ============================================================================================
let THEME = null;
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const COLS = new Map();
// A theme colour seen dz ahead: mixed toward the theme's fog colour with distance (cached strings).
function col(hex, dz, alpha) {
  const k12 = dz == null ? 0 : Math.round(clamp(Math.pow(clamp(dz / CFG.far, 0, 1), 1.3) * THEME.fogAmt, 0, 1) * 12);
  const a = alpha == null ? 1 : alpha;
  const key = THEME.id + hex + '|' + k12 + '|' + a;
  let s = COLS.get(key);
  if (s) return s;
  const c0 = hexRgb(hex), f = hexRgb(THEME.fog), k = k12 / 12;
  s = 'rgba(' + Math.round(c0[0] + (f[0] - c0[0]) * k) + ',' + Math.round(c0[1] + (f[1] - c0[1]) * k) + ',' + Math.round(c0[2] + (f[2] - c0[2]) * k) + ',' + a + ')';
  COLS.set(key, s);
  return s;
}
// Stroke the current path with a soft wide halo, then a solid core.
function neon(c, color, lw, core) {
  c.lineJoin = 'round';
  c.globalAlpha = 0.3; c.lineWidth = lw * 3; c.strokeStyle = color; c.stroke();
  c.globalAlpha = 1; c.lineWidth = lw; c.strokeStyle = core || color; c.stroke();
}
// Stroke the current path as a fat ink-edged band: the cartoon outline everything here uses.
function inkStroke(c, color, lw) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.lineWidth = lw + 4; c.strokeStyle = INK; c.stroke();
  c.lineWidth = lw; c.strokeStyle = color; c.stroke();
}

// ---- Lava Lamp Lagoon: six wax blobs rising and sinking, a metaball field on a 192x108 canvas
const PL = { w: 256, h: 144, cv: null, cx: null, img: null };
function drawLava(c, sky, t) {
  if (!PL.cv) {
    PL.cv = document.createElement('canvas'); PL.cv.width = PL.w; PL.cv.height = PL.h;
    PL.cx = PL.cv.getContext('2d'); PL.img = PL.cx.createImageData(PL.w, PL.h);
  }
  const d = PL.img.data, cols = sky.cols.map(hexRgb);
  const shift = cam.s ? cxD(cam.s) * 60 : 0;
  const blobs = [];
  for (let i = 0; i < 6; i++) {
    const ph = i * 1.7;
    blobs.push([wrap(18 + i * 44 + Math.sin(t * 0.3 + ph) * 18 + shift, PL.w), PL.h * (0.5 + 0.45 * Math.sin(t * (0.21 + i * 0.045) + ph)), 12 + (i % 3) * 7]);
  }
  for (let y = 0; y < PL.h; y++) {
    const shade = 0.55 + 0.45 * (y / PL.h);
    for (let x = 0; x < PL.w; x++) {
      let f = 0;
      for (const b of blobs) {
        let dx = Math.abs(x - b[0]); if (dx > PL.w / 2) dx = PL.w - dx;
        const dy = y - b[1];
        f += (b[2] * b[2]) / (dx * dx + dy * dy + 1);
      }
      const ci = f > 2.4 ? 3 : f > 1.5 ? 2 : f > 0.85 ? 1 : 0;
      const cc = cols[ci], k = ci === 0 ? shade : 1;
      const o = (y * PL.w + x) * 4;
      d[o] = cc[0] * k; d[o + 1] = cc[1] * k; d[o + 2] = cc[2] * k; d[o + 3] = 255;
    }
  }
  PL.cx.putImageData(PL.img, 0, 0);
  c.imageSmoothingEnabled = true;
  c.drawImage(PL.cv, 0, 0, W, H);
}

// ---- sky features, drawn in the camera-rolled frame with the origin on the horizon
function drawToastSun(c, hx, t) {
  const x = wrap(hx * 0.4 + 1240, 1800) - 900, y = -215;
  c.save(); c.translate(x, y);
  c.save(); c.rotate(t * 0.12);
  for (let i = 0; i < 12; i++) {   // butter drips for rays
    c.rotate(TAU / 12);
    c.beginPath(); c.roundRect(-8, 112, 16, 34 + (i % 3) * 10, 8);
    c.fillStyle = '#FFE45C'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  }
  c.restore();
  c.rotate(-0.08);
  c.beginPath(); c.roundRect(-100, -96, 200, 192, [60, 60, 22, 22]); c.fillStyle = '#B36B2C'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.roundRect(-82, -78, 164, 158, [48, 48, 14, 14]); c.fillStyle = '#E8A65A'; c.fill();
  c.fillStyle = '#C8843E';
  for (let i = 0; i < 14; i++) c.fillRect(-60 + ((i * 37) % 120), -50 + ((i * 53) % 110), 6, 4);
  c.rotate(0.3);
  c.beginPath(); c.roundRect(-34, -30, 68, 56, 8); c.fillStyle = '#FFE45C'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  const drip = 18 + Math.sin(t * 1.4) * 8;
  c.beginPath(); c.roundRect(10, 20, 14, drip, 7); c.fill(); c.stroke();
  c.restore();
}
function drawEggClouds(c, hx, t) {
  for (let i = 0; i < 4; i++) {
    const x = wrap(i * 560 + hx * 0.2 + t * 14, 2240) - 1120, y = -360 + (i % 2) * 70;
    c.save(); c.translate(x, y);
    c.beginPath();
    c.arc(-40, 6, 34, 0, TAU); c.arc(0, -8, 44, 0, TAU); c.arc(44, 6, 32, 0, TAU); c.arc(8, 18, 36, 0, TAU);
    c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.arc(6, 2, 20, 0, TAU); c.fillStyle = '#FFB400'; c.fill(); c.lineWidth = 3; c.stroke();
    c.fillStyle = '#FFE9A8'; c.beginPath(); c.arc(0, -4, 6, 0, TAU); c.fill();
    c.restore();
  }
}
function drawDiscoBall(c, hx, t) {
  const x = wrap(hx * 0.3 + 1060, 1600) - 800, y = -175;
  // sweeping light beams first
  const beamCols = ['rgba(255,79,216,0.16)', 'rgba(25,224,208,0.16)', 'rgba(255,194,26,0.14)'];
  for (let i = 0; i < 6; i++) {
    const a = t * 0.7 + i * TAU / 6;
    c.beginPath(); c.moveTo(x, y);
    c.lineTo(x + Math.cos(a - 0.09) * 1400, y + Math.sin(a - 0.09) * 1400);
    c.lineTo(x + Math.cos(a + 0.09) * 1400, y + Math.sin(a + 0.09) * 1400);
    c.closePath(); c.fillStyle = beamCols[i % 3]; c.fill();
  }
  c.strokeStyle = '#D9DDEA'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 90); c.lineTo(x, -H); c.stroke();
  c.save(); c.beginPath(); c.arc(x, y, 90, 0, TAU); c.clip();
  c.fillStyle = '#5A5AD0'; c.fillRect(x - 90, y - 90, 180, 180);
  const spin = t * 0.8;
  for (let row = -5; row <= 5; row++) {
    const lat = row / 5.5 * (Math.PI / 2), yy = y + Math.sin(lat) * 90, rr = Math.cos(lat) * 90;
    for (let k = 0; k < 14; k++) {
      const lon = spin + k * TAU / 14;
      const cx0 = Math.sin(lon);
      if (Math.cos(lon) < 0) continue;
      const xx = x + cx0 * rr;
      const tw = Math.max(2, Math.cos(lon) * rr * 0.4);
      const flick = (k * 7 + row * 3 + Math.floor(t * 8)) % 9;
      c.fillStyle = flick === 0 ? '#FFFFFF' : (k + row) % 2 ? '#D9DDEA' : '#8C8CFF';
      c.fillRect(xx - tw / 2, yy - 6, tw, 12);
    }
  }
  c.restore();
  c.beginPath(); c.arc(x, y, 90, 0, TAU); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
}
function drawFridgeBulb(c, t) {
  const x = 0, y = -cam.hz + 40;
  const flick = 0.85 + 0.15 * Math.sin(t * 37) * Math.sin(t * 11);
  const g = c.createRadialGradient(x, y, 10, x, y, 330);
  g.addColorStop(0, 'rgba(255,255,240,' + (0.9 * flick) + ')'); g.addColorStop(1, 'rgba(255,255,240,0)');
  c.fillStyle = g; c.fillRect(x - 340, y - 60, 680, 400);
  c.strokeStyle = 'rgba(255,255,255,' + (0.6 * flick) + ')'; c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i < 16; i++) { const a = Math.PI * (0.05 + i / 17 * 0.9); c.moveTo(x + Math.cos(a) * 70, y + Math.sin(a) * 70); c.lineTo(x + Math.cos(a) * 140, y + Math.sin(a) * 140); }
  c.stroke();
  c.beginPath(); c.ellipse(x, y + 18, 34, 44, 0, 0, TAU); c.fillStyle = '#FFFBE0'; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
}
function drawShelves(c, hx) {
  c.strokeStyle = '#B8D8E8'; c.lineCap = 'round';
  for (const [y, w] of [[-70, 4], [-170, 3], [-280, 2]]) {
    c.lineWidth = w; c.beginPath(); c.moveTo(-W, y); c.lineTo(W, y);
    const off = wrap(hx * (0.2 - y * 0.0006), 46);
    for (let x = -W + off; x < W; x += 46) { c.moveTo(x, y); c.lineTo(x - 10, y - 26); }
    c.stroke();
  }
}
function drawTrashPlanet(c, hx, t) {
  const x = wrap(hx * 0.25 + 520, 1800) - 900, y = -250, r = 110;
  const ring = (front) => {
    c.save(); c.translate(x, y); c.rotate(-0.25);
    c.beginPath(); c.ellipse(0, 0, r * 1.9, r * 0.45, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
    c.lineWidth = 16; c.strokeStyle = INK; c.stroke(); c.lineWidth = 10; c.strokeStyle = '#3D7BFF'; c.stroke();
    for (let i = 0; i < 18; i++) {
      const a = (front ? 0 : Math.PI) + (i / 18) * Math.PI + t * 0.05;
      c.fillStyle = [MAG, YEL, AQUA, '#FFFFFF'][i % 4];
      c.fillRect(Math.cos(a) * r * 1.9 - 4, Math.sin(a) * r * 0.45 - 4, 8, 8);
    }
    c.restore();
  };
  ring(false);
  c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
  c.fillStyle = '#FF8A3D'; c.fillRect(x - r, y - r, r * 2, r * 2);
  c.fillStyle = '#D96A1F';
  for (let k = -3; k <= 3; k++) c.fillRect(x - r, y + k * 30 - 6, r * 2, 10);
  c.restore();
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  ring(true);
}
function drawDuckMoon(c, hx, t) {
  const a = t * 0.25;
  const x = wrap(hx * 0.25 + 520, 1800) - 900 + Math.cos(a) * 330, y = -300 + Math.sin(a) * 70;
  c.save(); c.translate(x, y); c.scale(Math.cos(a) > 0 ? 1 : -1, 1);
  c.lineWidth = 4; c.strokeStyle = INK; c.fillStyle = '#FFD21A';
  c.beginPath(); c.ellipse(0, 10, 46, 30, 0, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.arc(26, -22, 22, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = '#FF8A3D'; c.beginPath(); c.moveTo(44, -22); c.lineTo(66, -16); c.lineTo(44, -10); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(32, -28, 4, 0, TAU); c.fill();
  c.restore();
}
function drawConfettiStars(c, hx, t) {
  const rng = mulberry32(404);
  const cols = [MAG, AQUA, YEL, '#FFFFFF', ORG];
  for (let i = 0; i < 90; i++) {
    const x = wrap(rng() * 2400 + hx * 0.1, 2400) - 1200, y = -rng() * 420 - 20;
    const s = 3 + rng() * 4, tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
    c.globalAlpha = 0.4 + 0.6 * tw;
    c.fillStyle = cols[i % cols.length]; c.fillRect(x, y, s, s);
  }
  c.globalAlpha = 1;
}

function drawSky(c, T) {
  const sky = THEME.sky, t = world ? world.t : 0;
  if (sky.lava) { drawLava(c, sky, t); return; }
  const hz = cam.hz + cam.oy;
  const hx = -Math.atan(cxD(cam.s)) * cam.f * 0.6;
  c.save();
  c.translate(W / 2 + cam.ox, hz); c.rotate(cam.roll);
  const g = c.createLinearGradient(0, -hz, 0, 0);
  sky.stops.forEach((s, i) => g.addColorStop(i / (sky.stops.length - 1), s));
  c.fillStyle = g; c.fillRect(-W, -H * 1.5, W * 2, H * 1.5 + 1);
  c.fillStyle = sky.below; c.fillRect(-W, 0, W * 2, H * 1.5);
  if (sky.confetti) drawConfettiStars(c, hx, t);
  if (sky.disco) drawDiscoBall(c, hx, t);
  if (sky.bulb) drawFridgeBulb(c, t);
  if (sky.shelves) drawShelves(c, hx);
  if (sky.toast) drawToastSun(c, hx, t);
  if (sky.eggs) drawEggClouds(c, hx, t);
  if (sky.planet) drawTrashPlanet(c, hx, t);
  if (sky.duck) drawDuckMoon(c, hx, t);
  c.restore();
}
