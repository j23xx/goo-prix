// GOO PRIX · src/scenes/how-to-play.js — The how-to card: controls, scoring and what each target is worth.
'use strict';

// One target class drawn on its own (the how-to card), in the current world's skin.
function drawTargetIcon(c, cls, x, y, s, t) {
  const fake = { cls, skin: SKINS[THEME.id][cls], ph: cls.length, hp: 1, maxHp: 1, r: 1, splats: [], hitT: 0, gen: 0, flee: 6, giant: false };
  if (cls === 'ace') { drawShip(c, RACERS[(game.racer + 3) % 8], x, y, s * 2.6, { t, thrust: 1 }); return; }
  c.save(); c.translate(x, y);
  drawSkin(c, fake.skin, s, clamp(s * 0.09, 1.2, 5), t, fake);
  c.restore();
}

SCENES.howto = {
  update() {
    if (keyHit('Escape', 'Enter', 'Space', 'Backspace') || input.click) { sfx.uiBack(); goTo('title'); }
  },
  draw(c) {
    applyCamera(); renderWorld(c); groundWash(c, 0.9);
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
};
