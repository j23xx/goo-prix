// GOO PRIX · src/craft.js — The eight craft: definitions and their art.
'use strict';

// ============================================================================================
// RACER_DEFS — the eight idiots: stats (speed / flap / goo / weight, 1-5) and AI personality
// ============================================================================================
const RACERS = [
  { name: 'BLORP', shape: 'bucket', stats: [3, 3, 3, 3], bio: 'A LIME SLIME IN A TIN BUCKET. POLITE. STICKY.', ai: { aggr: 0.45, greed: 0.5, swoop: 0.4 }, bark: 'BLORP!' },
  { name: 'DAME CUSTARD', shape: 'teacup', stats: [5, 2, 2, 4], bio: 'PUDDING WITH A MONOCLE. FAST, CLUMSY, NEVER SHOOTS FIRST.', ai: { aggr: 0.2, greed: 0.3, swoop: 0.2 }, bark: 'HOW RUDE!' },
  { name: 'SPROCKET', shape: 'toaster', stats: [2, 4, 3, 3], bio: 'A TOASTER-BOT WITH TOAST WINGS. TAKES EVERY RING.', ai: { aggr: 0.5, greed: 0.9, swoop: 0.5, precise: 1 }, bark: 'DING!' },
  { name: 'NANA FANG', shape: 'bat', stats: [3, 4, 5, 1], bio: 'A BAT GRANNY. KNITS. SHOOTS ANYTHING THAT MOVES.', ai: { aggr: 1.0, greed: 0.4, swoop: 0.4 }, bark: 'MIND YOUR MANNERS!' },
  { name: 'MOLDY GREG', shape: 'mushroom', stats: [3, 3, 4, 3], bio: 'A MUSHROOM ON A LAWNMOWER-COPTER. HOARDS ITEMS.', ai: { aggr: 0.6, greed: 0.6, swoop: 0.3, hoard: 1 }, bark: 'SPORE YOU LATER.' },
  { name: 'ZIPPY PICKLE', shape: 'pickle', stats: [4, 5, 2, 1], bio: 'A PICKLE IN A JAR-JET. PERFECT STARTS. MANY BONKS.', ai: { aggr: 0.4, greed: 0.5, swoop: 1.0, sloppy: 1 }, bark: 'BRINE TIME!' },
  { name: 'EL BUBBLO', shape: 'puffer', stats: [3, 2, 3, 5], bio: 'A PUFFERFISH LUCHADOR. LOVES A GOOD SHOVE.', ai: { aggr: 0.6, greed: 0.3, swoop: 0.3, bully: 1 }, bark: 'OLE!' },
  { name: 'COUNT CRUMB', shape: 'cookie', stats: [4, 3, 4, 3], bio: 'A VAMPIRE COOKIE. YOUR NEMESIS. TOUGH COOKIE.', ai: { aggr: 0.8, greed: 0.5, swoop: 0.5 }, bark: 'CRUMBLED!' },
];
// One vivid colour each, never lime (lime is goo). Blorp is the leftover white Pong pixel.
const RACER_COLORS = ['#F4F4F4', '#FFD23F', '#FF7A1A', '#A45BFF', '#19D3C5', '#18A558', '#2E9BFF', '#FF3B4E'];
RACERS.forEach((r, i) => { r.color = RACER_COLORS[i]; });
function statMul(def) {
  const [sp, fl, go, wt] = def.stats;
  return { spd: 1 + (sp - 3) * 0.02, flap: 1 + (fl - 3) * 0.04, goo: 1 + (go - 3) * 0.1, wt };
}

// ============================================================================================
// RACER_ART — rear-view silhouettes in white wireframe, used for rivals, the player and icons
// ============================================================================================
// Draws racer def at screen (x, y) with width `size`. o: flap (0..1 wing snap), alpha, stun, goo,
// shield, ghost, num (show number), white (fill colour), mini (thin lines for icons).
function drawRacerArt(c, def, x, y, size, o) {
  o = o || {};
  const s = size / 2;
  const lw = Math.max(1.5, size * (o.mini ? 0.05 : 0.055));
  const ink = o.color || '#fff';
  const t = o.t != null ? o.t : (world ? world.t : 0);
  c.save();
  c.translate(x, y);
  if (o.roll) c.rotate(o.roll);
  if (o.stun) c.rotate(Math.sin(t * 30) * 0.6);
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  c.lineWidth = o.fill ? lw * 1.15 : lw; c.strokeStyle = ink; c.fillStyle = o.fill || '#000';
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (o.ghost) c.setLineDash([size * 0.08, size * 0.06]);
  const flap = o.flap || 0;
  // wings: two slabs that snap down on a flap
  const wingY = -s * 0.05 + flap * s * 0.35;
  const wingTip = -s * 0.35 + flap * s * 0.75;
  const wing = (dir) => {
    c.beginPath();
    c.moveTo(dir * s * 0.45, -s * 0.05);
    c.lineTo(dir * s * 1.05, wingTip);
    c.lineTo(dir * s * 1.0, wingTip + s * 0.18);
    c.lineTo(dir * s * 0.45, wingY + s * 0.2);
    c.closePath(); c.fill(); c.stroke();
  };
  if (def.shape !== 'bat') { wing(-1); wing(1); }
  const body = () => { c.fill(); c.stroke(); };
  switch (def.shape) {
    case 'bucket': { // Blorp: slime blob in a tin bucket, pinwheel on top
      c.beginPath(); c.moveTo(-s * 0.5, -s * 0.15); c.lineTo(s * 0.5, -s * 0.15); c.lineTo(s * 0.38, s * 0.55); c.lineTo(-s * 0.38, s * 0.55); c.closePath(); body();
      c.beginPath(); c.moveTo(-s * 0.44, s * 0.12); c.lineTo(s * 0.44, s * 0.12); c.stroke();
      c.beginPath(); c.arc(0, -s * 0.32, s * 0.3, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); body();
      c.beginPath(); c.moveTo(0, -s * 0.62); c.lineTo(0, -s * 0.85); c.stroke();
      const a = t * 12;
      c.beginPath();
      for (let i = 0; i < 4; i++) { const aa = a + i * Math.PI / 2; c.moveTo(0, -s * 0.88); c.lineTo(Math.cos(aa) * s * 0.3, -s * 0.88 + Math.sin(aa) * s * 0.1); }
      c.stroke();
      break;
    }
    case 'teacup': { // Dame Custard: teacup under an umbrella arc
      c.beginPath(); c.moveTo(-s * 0.55, -s * 0.2); c.lineTo(s * 0.55, -s * 0.2); c.lineTo(s * 0.38, s * 0.45); c.lineTo(-s * 0.38, s * 0.45); c.closePath(); body();
      c.beginPath(); c.arc(s * 0.58, s * 0.05, s * 0.16, -Math.PI / 2, Math.PI / 2); c.stroke();
      c.beginPath(); c.ellipse(0, -s * 0.28, s * 0.36, s * 0.16, 0, Math.PI, 0); body();
      c.beginPath(); c.moveTo(0, -s * 0.4); c.lineTo(0, -s * 0.72); c.stroke();
      c.beginPath(); c.arc(0, -s * 0.72, s * 0.62, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.58, -s * 0.92); c.quadraticCurveTo(-s * 0.3, -s * 0.78, 0, -s * 0.92); c.quadraticCurveTo(s * 0.3, -s * 0.78, s * 0.58, -s * 0.92); c.stroke();
      break;
    }
    case 'toaster': { // Sprocket: a rounded toaster with two slots
      c.beginPath(); c.roundRect(-s * 0.5, -s * 0.5, s, s * 0.95, s * 0.18); body();
      c.beginPath(); c.moveTo(-s * 0.3, -s * 0.38); c.lineTo(-s * 0.08, -s * 0.38); c.moveTo(s * 0.08, -s * 0.38); c.lineTo(s * 0.3, -s * 0.38); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.35, s * 0.2); c.lineTo(s * 0.35, s * 0.2); c.stroke();
      c.beginPath(); c.arc(s * 0.32, -s * 0.05, s * 0.06, 0, TAU); c.stroke();
      break;
    }
    case 'bat': { // Nana Fang: zigzag bat wings, a round body with a bun
      const tip = -s * 0.5 + flap * s * 0.9;
      c.beginPath();
      c.moveTo(0, -s * 0.1);
      c.lineTo(-s * 1.1, tip); c.lineTo(-s * 0.85, tip + s * 0.35); c.lineTo(-s * 0.6, tip + s * 0.2); c.lineTo(-s * 0.4, s * 0.25);
      c.lineTo(s * 0.4, s * 0.25); c.lineTo(s * 0.6, tip + s * 0.2); c.lineTo(s * 0.85, tip + s * 0.35); c.lineTo(s * 1.1, tip);
      c.closePath(); body();
      c.beginPath(); c.arc(0, -s * 0.05, s * 0.32, 0, TAU); body();
      c.beginPath(); c.arc(0, -s * 0.45, s * 0.14, 0, TAU); body();
      c.beginPath(); c.moveTo(-s * 0.08, -s * 0.36); c.lineTo(s * 0.1, -s * 0.54); c.stroke(); // knitting needle in the bun
      break;
    }
    case 'mushroom': { // Moldy Greg: dome cap on a stem, copter rotor above
      c.beginPath(); c.rect(-s * 0.16, -s * 0.05, s * 0.32, s * 0.55); body();
      c.beginPath(); c.arc(0, -s * 0.05, s * 0.6, Math.PI, 0); c.closePath(); body();
      c.beginPath(); c.arc(-s * 0.25, -s * 0.28, s * 0.07, 0, TAU); c.arc(s * 0.2, -s * 0.38, s * 0.06, 0, TAU); c.stroke();
      const a = Math.cos(t * 14);
      c.beginPath(); c.moveTo(0, -s * 0.65); c.lineTo(0, -s * 0.8); c.moveTo(-s * 0.9 * a, -s * 0.82); c.lineTo(s * 0.9 * a, -s * 0.82); c.stroke();
      break;
    }
    case 'pickle': { // Zippy Pickle: tall capsule in a jar-jet with a flame
      c.beginPath(); c.roundRect(-s * 0.32, -s * 0.75, s * 0.64, s * 1.3, s * 0.12); body();
      c.beginPath(); c.rect(-s * 0.36, -s * 0.88, s * 0.72, s * 0.14); body();
      c.beginPath(); c.roundRect(-s * 0.16, -s * 0.6, s * 0.32, s * 0.95, s * 0.16); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.04, -s * 0.3); c.lineTo(-s * 0.04, -s * 0.22); c.moveTo(s * 0.05, 0); c.lineTo(s * 0.05, s * 0.08); c.stroke();
      break;
    }
    case 'puffer': { // El Bubblo: spiked puffer with a luchador mask stripe
      c.beginPath();
      const n = 14;
      for (let i = 0; i <= n * 2; i++) {
        const a = (i / (n * 2)) * TAU;
        const rr = (i % 2 ? 0.48 : 0.62) * s;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr - s * 0.05;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath(); body();
      c.beginPath(); c.moveTo(-s * 0.45, -s * 0.1); c.quadraticCurveTo(0, -s * 0.32, s * 0.45, -s * 0.1); c.stroke();
      c.beginPath(); c.moveTo(0, -s * 0.5); c.lineTo(0, s * 0.38); c.stroke();
      break;
    }
    case 'cookie': { // Count Crumb: cookie disc with chips and a triangular cape
      c.beginPath(); c.moveTo(-s * 0.55, -s * 0.35); c.lineTo(s * 0.55, -s * 0.35); c.lineTo(s * 0.75, s * 0.6); c.lineTo(-s * 0.75, s * 0.6); c.closePath(); body();
      c.beginPath(); c.arc(0, -s * 0.15, s * 0.45, 0, TAU); body();
      c.fillStyle = ink;
      for (const [px, py] of [[-0.2, -0.3], [0.15, -0.05], [-0.1, 0.1], [0.22, -0.32], [-0.25, -0.02]]) c.fillRect(px * s - s * 0.05, py * s - s * 0.05, s * 0.1, s * 0.1);
      c.beginPath(); c.moveTo(-s * 0.4, -s * 0.48); c.lineTo(-s * 0.25, -s * 0.72); c.lineTo(-s * 0.1, -s * 0.52); c.moveTo(s * 0.4, -s * 0.48); c.lineTo(s * 0.25, -s * 0.72); c.lineTo(s * 0.1, -s * 0.52); c.stroke();
      break;
    }
  }
  c.setLineDash([]);
  // thruster: a short white flicker under the craft
  if (!o.mini) {
    c.fillStyle = ink;
    const fl = 0.5 + 0.5 * Math.sin(t * 50 + size);
    c.fillRect(-s * 0.1, s * 0.62, s * 0.2, s * (0.12 + 0.18 * fl));
  }
  // goo stickers stuck on the craft
  if (o.splats) for (const sp of o.splats) gooSplat(c, sp.x * s, sp.y * s, s * 0.28 * Math.min(1, sp.t * 2), sp.seed, Math.min(1, sp.t));
  if (o.goo) {
    c.fillStyle = GOO_C;
    for (let i = 0; i < 3; i++) { const dy = ((t * 1.3 + i * 0.37) % 1) * s * 0.9; c.fillRect(-s * 0.3 + i * s * 0.3, s * 0.2 + dy, s * 0.07, s * 0.16); }
  }
  if (o.shield) {
    c.setLineDash([size * 0.1, size * 0.07]);
    c.lineDashOffset = -t * 40;
    c.beginPath(); c.arc(0, -s * 0.1, s * 1.25, 0, TAU);
    c.strokeStyle = o.fill ? CYN : ink; c.lineWidth = Math.max(1, lw * (o.fill ? 1 : 0.7)); c.stroke();
    c.setLineDash([]);
  }
  c.restore();
}
