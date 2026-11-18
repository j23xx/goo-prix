// GOO PRIX · src/scenes/level-intro.js — The fly-in card before each level: its name, its rule and its quota.
'use strict';

// Mister Spotless leaning into the boss intro card.
function drawBossPortrait(c, x, y, t) {
  const k = smooth01((t - 0.6) / 0.5);
  if (k <= 0) return;
  const b = bossDummy({ maw: 0.2 + 0.2 * Math.sin(t * 3), armT: t });
  c.save(); c.translate(x + (1 - k) * 500, y);
  c.scale(0.55, 0.55);
  drawBossAt(c, b, 0, 0, 60, t);
  c.restore();
  hudText(c, '"YOU\'RE TRACKING GOO ON MY FLOOR."', x, y + 170, 2, CYN, 'center');
}

SCENES.intro = {
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
    blockText(c, (loopOf() ? 'LOOP ' + (loopOf() + 1) + ' · ' : '') + (L.boss ? 'FINAL BOSS' : 'LEVEL ' + (w.levelIdx + 1) + ' OF 5'), 70, 200, 3, { color: L.boss ? WHT : INK });
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
};
