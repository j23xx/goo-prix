// GOO PRIX · src/ui/hud-panels.js — The side panels of the play HUD: ship, Mix-ins, score, targets.
'use strict';

// ============================================================================================
// HUD_PANELS — the left panel says who you are flying as, the right one what you are scoring
// ============================================================================================
const SKIN_NAMES = {
  toastmoth: 'TOAST MOTH', eggsaucer: 'EGG SAUCER', hooptank: 'HOOP TANK', jamblob: 'JAM BLOB', butterfly: 'BUTTERFLY',
  mirrordrone: 'MIRROR DRONE', glowworm: 'GLOW WORM', speaker: 'SPEAKER', discoball: 'DISCO BALL', goldrecord: 'GOLD RECORD',
  snowflake: 'SNOWFLAKE', popsiclerocket: 'ICE ROCKET', icecube: 'ICE CUBE', peapod: 'PEA POD', goldcone: 'GOLD CONE',
  waxbubble: 'WAX BUBBLE', lavaeel: 'LAVA EEL', bulb: 'LAVA BULB', waxblob: 'WAX BLOB', goldblob: 'GOLD BLOB',
  tvjunk: 'SPACE TELLY', satdart: 'SAT DART', satellite: 'SATELLITE', canjunk: 'SPACE CAN', goldduck: 'GOLD DUCK',
  dustbunny: 'DUST BUNNY', soapmine: 'SOAP MINE',
};

// Who you are and what you have drafted: the ship by name, the continues left, then each Mix-in.
function drawRunPanel(c, x, y, w) {
  const d = world.player.def, run = game.run;
  const ids = run ? run.mixins : [];
  const shown = ids.slice(0, 7);
  const h = 54 + Math.max(1, shown.length) * 22 + (ids.length > shown.length ? 18 : 0);
  panel(c, x, y, w, h, null, d.color);
  const cont = run && run.mode === 'campaign' ? 'CONTINUES ' + run.continues : '';
  label(c, d.name, x + 10, y + 8, 18, d.color, { maxW: w - 24 - (cont ? labelWidth(c, cont, 12) : 0) });
  if (cont) label(c, cont, x + w - 10, y + 12, 12, CREAM, { align: 'right' });
  label(c, 'MIX-INS ' + ids.length + '/12', x + 10, y + 32, 13, MAG);
  if (!ids.length) label(c, 'DRAFT ONE AFTER EACH LEVEL', x + 10, y + 54, 13, '#B9B4D8', { maxW: w - 20 });
  shown.forEach((id, i) => {
    const m = MIXIN_BY_ID[id], yy = y + 52 + i * 22;
    c.beginPath(); c.arc(x + 20, yy + 9, 9, 0, TAU); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fill();
    drawMixinIcon(c, id, x + 20, yy + 9, 16, 0);
    label(c, m.name, x + 36, yy + 1, 15, m.risk ? RED : CREAM, { maxW: w - 46 });
  });
  if (ids.length > shown.length) label(c, '+' + (ids.length - shown.length) + ' MORE', x + 36, y + 52 + shown.length * 22, 13, '#B9B4D8');
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
// It shows for the first seconds of a level, then gets out of the way (pause shows it again).
const TARGETS_SHOWN = 11;
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
