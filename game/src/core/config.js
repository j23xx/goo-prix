// GOO PRIX · src/core/config.js — Every tuning number, the colour grammar and the screenshot switches.
'use strict';

// ============================================================================================
// CONFIG — every tuning number in one place (world units: 1 u is about a metre)
// ============================================================================================
const PARAMS = new URLSearchParams(location.search);
const SHOT = PARAMS.get('shot');
const SHOT_SEED = parseInt(PARAMS.get('seed') || '1', 10) || 1;
if (SHOT) document.body.classList.add('shot');

const CFG = {
  halfW: 12, ceil: 14, hit: 0.7,
  gravity: 34, flapV: 11.5, maxFall: 16, diveG: 30, diveMaxFall: 24, flapBuffer: 0.08,
  latAccel: 70, latMax: 16, latDamp: 8, curvePushMax: 5,
  cruise: [54, 60, 66], accel: 40, decel: 70,
  laps: 3, racers: 8,
  focal: 763, focalBoost: 690, horizon: 331, near: 1.2, far: 260,
  camBack: 2.4, camUp: 0.7, camFollowU: 12, camFollowV: 9,
  tank: 100, shotCost: 12, tankRegen: 10, shotCd: 0.2,
  globSpeed: 160, globGrav: 6, globLife: 0.75, globR: 0.5,
  goopMul: 0.5, goopFlap: 0.72, goopTime: 1.8, goopMax: 3.6, goopPlayerMul: 0.62,
  bonkMul: 0.35, stun: 0.6, flapLock: 0.35, invuln: 1.2,
  swoopTiers: [[0.35, 1.25, 0.7], [0.8, 1.42, 1.0]], swoopWindow: 0.15,
  ringMul: 1.45, ringTime: 1.2, ringR: 2.2,
  slipMul: 1.12, rocketMul: 1.5,
  rubberBehind: [0.08, 0.12, 0.14], rubberAhead: [0.12, 0.08, 0.04],
  points: [15, 12, 10, 8, 6, 4, 2, 1],
  windowAdj: [0.8, 0, -0.8],
  aiSkill: [[0.5, 0.66], [0.6, 0.8], [0.72, 0.9]],
  tokens: 3,
};
const DIFFS = ['CHILL', 'ZESTY', 'FERAL'];
const GREYS = ['#ffffff', '#c8c8c8', '#909090', '#585858', '#303030'];
const GOO_C = '#7cff3a';
// The colour grammar: cream icing rims = fly here, tomato red = hurts, aqua = helps, gold = coins and
// highlights, lime = goo only. PNK is the hot orange used for drop shadows and extrudes.
const YEL = '#FFC21A', PNK = '#FF5A1F', CYN = '#19E0D0', ORG = '#FF8A3D', INK = '#0B0B12', WHT = '#F4F4F4';
const CREAM = '#FFF6E0', RED = '#FF2D3A', AQUA = CYN, MAG = '#FF4FD8', GOLD = YEL;
const DT = 1 / 60;
const ORD = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH'];
