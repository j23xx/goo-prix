// GOO PRIX · src/ui/hud-panels.js — The side panels of the play HUD: ship, Mix-ins, score, targets.
'use strict';

// ============================================================================================
// HUD_PANELS — the left column says who you are flying as, the right one what you are scoring
// ============================================================================================
const SKIN_NAMES = {
  toastmoth: 'TOAST MOTH', eggsaucer: 'EGG SAUCER', hooptank: 'HOOP TANK', jamblob: 'JAM BLOB', butterfly: 'BUTTERFLY',
  mirrordrone: 'MIRROR DRONE', glowworm: 'GLOW WORM', speaker: 'SPEAKER', discoball: 'DISCO BALL', goldrecord: 'GOLD RECORD',
  snowflake: 'SNOWFLAKE', popsiclerocket: 'ICE ROCKET', icecube: 'ICE CUBE', peapod: 'PEA POD', goldcone: 'GOLD CONE',
  waxbubble: 'WAX BUBBLE', lavaeel: 'LAVA EEL', bulb: 'LAVA BULB', waxblob: 'WAX BLOB', goldblob: 'GOLD BLOB',
  tvjunk: 'SPACE TELLY', satdart: 'SAT DART', satellite: 'SATELLITE', canjunk: 'SPACE CAN', goldduck: 'GOLD DUCK',
  dustbunny: 'DUST BUNNY', soapmine: 'SOAP MINE',
};

// Who you are: the ship, its pilot and its four stat bars, and the continues left.
function drawShipPanel(c, x, y, w) {
  const d = world.player.def, run = game.run;
  panel(c, x, y, w, 120, 'SHIP', d.color);
  label(c, d.name, x + 10, y + 24, 20, WHT, { maxW: w - 20 });
  label(c, 'PILOT ' + d.pilot, x + 10, y + 46, 13, '#B9B4D8', { maxW: w - 20 });
  STAT_NAMES.forEach((nm, j) => {
    const yy = y + 66 + j * 12;
    label(c, nm, x + 10, yy - 2, 11, '#B9B4D8');
    for (let b = 0; b < 5; b++) { c.fillStyle = b < d.stats[j] ? d.color : 'rgba(255,255,255,0.12)'; c.fillRect(x + 92 + b * 22, yy, 18, 7); }
  });
  if (run && run.mode === 'campaign') label(c, 'CONTINUES ' + run.continues, x + w - 10, y + 7, 13, CREAM, { align: 'right' });
}
// What you have drafted: each Mix-in by name with its icon.
function drawMixinPanel(c, x, y, w) {
  const ids = game.run ? game.run.mixins : [];
  const shown = ids.slice(0, 7);
  const h = 32 + Math.max(1, shown.length) * 22 + (ids.length > shown.length ? 18 : 0);
  panel(c, x, y, w, h, 'MIX-INS ' + ids.length + '/12', MAG);
  if (!ids.length) label(c, 'DRAFT ONE AFTER EACH LEVEL', x + 10, y + 30, 13, '#B9B4D8', { maxW: w - 20 });
  shown.forEach((id, i) => {
    const m = MIXIN_BY_ID[id], yy = y + 30 + i * 22;
    c.beginPath(); c.arc(x + 20, yy + 9, 9, 0, TAU); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fill();
    drawMixinIcon(c, id, x + 20, yy + 9, 16, 0);
    label(c, m.name, x + 36, yy + 1, 15, m.risk ? RED : CREAM, { maxW: w - 46 });
  });
  if (ids.length > shown.length) label(c, '+' + (ids.length - shown.length) + ' MORE', x + 36, y + 30 + shown.length * 22, 13, '#B9B4D8');
  return h;
}
// The score, the best for this level, and the chain with its multiplier and draining bar.
function drawScorePanel(c, x, y, w) {
  const wd = world;
  panel(c, x, y, w, 120, 'SCORE', YEL);
  wd.shownScore = wd.shownScore == null ? wd.score : damp(wd.shownScore, wd.score, 12, DT);
  blockText(c, fmtScore(Math.round(wd.shownScore)), x + w - 10, y + 24, 4, { align: 'right', color: YEL, outline: 2, outlineColor: INK });
  const best = save.bestRace['lvl' + wd.levelIdx + ':' + game.diff] || 0;
  label(c, 'BEST ' + fmtScore(Math.max(best, wd.score)), x + w - 10, y + 7, 13, '#B9B4D8', { align: 'right' });
  const mcol = wd.mult >= 6 ? MAG : wd.mult >= 3 ? YEL : CREAM;
  label(c, 'CHAIN ' + wd.chain, x + 10, y + 62, 16, WHT);
  label(c, COAT_NAMES[wd.coat], x + 10, y + 82, 13, wd.coat === 2 ? MAG : wd.coat === 1 ? YEL : AQUA);
  blockText(c, 'x' + wd.mult, x + w - 10, y + 60, 5, { align: 'right', color: mcol, outline: 2, outlineColor: INK });
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x + 10, y + 106, w - 20, 5);
  c.fillStyle = mcol; c.fillRect(x + 10, y + 106, (w - 20) * clamp(wd.chainT / chainLife(), 0, 1), 5);
}
// What is worth what on this level: the targets in play, the windows, and what knocks cost.
function targetLines() {
  const L = world.level, sk = SKINS[THEME.id];
  if (L.boss) return [['GOLD STAIN', 'FILTH x3', YEL], ['TURRET JAMMED', '+1,000', GOO_C], ['DUST BUNNY', '80 + REFILL', CREAM], ['SOAP MINE', '150', CREAM], ['BLEACH BOLT', '-200', RED], ['SQUEEGEE WALL', '-500', RED]];
  const rows = Object.keys(L.mix).filter((k) => L.mix[k] > 0).map((k) => [SKIN_NAMES[sk[k]] || k.toUpperCase(), fmtScore(TARGET_CLASSES[k].pts), CREAM]);
  if (L.aces) rows.push(['RIVAL ACE', '400', ORG]);
  rows.push([SKIN_NAMES[sk.goldie] || 'GOLDIE', hasMix('goldleaf') ? '1,500' : '1,000', YEL]);
  rows.push(['WINDOW · BULLSEYE', (hasMix('needle') ? '250 · 600' : '100 · 250'), GOO_C]);
  rows.push(['WALL KNOCK', '-500', RED]);
  return rows;
}
function drawTargetsPanel(c, x, y, w) {
  const rows = targetLines();
  const h = 32 + rows.length * 20 + 22;
  panel(c, x, y, w, h, 'TARGETS', GOO_C);
  rows.forEach(([nm, v, colr], i) => {
    const yy = y + 28 + i * 20;
    label(c, nm, x + 10, yy, 14, CREAM, { maxW: w - 90 });
    label(c, v, x + w - 10, yy, 14, colr, { align: 'right' });
  });
  label(c, 'KNOCKS ' + world.knocks + (world.lost ? ' · -' + fmtScore(world.lost) : ''), x + 10, y + h - 22, 14, world.knocks ? RED : GOO_C);
  return h;
}
