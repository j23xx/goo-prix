// GOO PRIX · src/input.js — Keyboard and mouse state with per-frame edge detection.
'use strict';

// ============================================================================================
// INPUT — keyboard and mouse state with per-frame edge detection, plus the shell's buttons
// ============================================================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 1280, H = 720;

const input = {
  down: new Set(),        // keys held (KeyboardEvent.code)
  hit: new Set(),         // keys pressed since the last frame
  mx: W / 2, my: H / 2,   // mouse in canvas pixels
  mouseIn: false,
  lmb: false, rmb: false,
  click: false, rclick: false,  // pressed since last frame
  moved: false,
  lastDevice: 'keys',
};
const GAME_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);

window.addEventListener('keydown', (e) => {
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  AU.resume();
  input.lastDevice = 'keys';
  if (!e.repeat) input.hit.add(e.code);
  input.down.add(e.code);
});
window.addEventListener('keyup', (e) => { input.down.delete(e.code); });
window.addEventListener('blur', () => { input.down.clear(); input.lmb = input.rmb = false; onBlurPause(); });

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
}
canvas.addEventListener('mousemove', (e) => {
  const p = canvasPoint(e);
  input.mx = p[0]; input.my = p[1]; input.mouseIn = true; input.moved = true;
  input.lastDevice = 'mouse';
});
canvas.addEventListener('mouseleave', () => { input.mouseIn = false; });
canvas.addEventListener('mousedown', (e) => {
  AU.resume();
  canvas.focus();
  const p = canvasPoint(e);
  input.mx = p[0]; input.my = p[1];
  input.lastDevice = 'mouse';
  if (e.button === 0) { input.lmb = true; input.click = true; }
  if (e.button === 2) { input.rmb = true; input.rclick = true; }
  e.preventDefault();
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) input.lmb = false;
  if (e.button === 2) input.rmb = false;
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function keyHit(...codes) { for (const c of codes) if (input.hit.has(c)) return true; return false; }
function keyDown(...codes) { for (const c of codes) if (input.down.has(c)) return true; return false; }
function endInputFrame() { input.hit.clear(); input.click = false; input.rclick = false; input.moved = false; }
