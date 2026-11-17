# goo-prix

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/j23xx/goo-prix/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/j23xx/goo-prix/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

GOO PRIX is a first-person flying kart racer drawn in original-Pong black and white: flap through the window in every wall, follow the dashed net line, and splat seven rival idiots with goo across a five-race grand prix. One self-contained HTML file: its own 3D projection on a 2D canvas, synthesized sound, no libraries, no network.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Any static file server pointed at `game/` works too.

## How to play

| Do | Keys | Mouse |
| --- | --- | --- |
| Flap | Space / W | Left click (MOUSE controls) |
| Steer | A / D | Crosshair (MOUSE controls) |
| Dive (then flap for a Swoop boost) | Hold S | Hold right button (MOUSE controls) |
| Shoot goo | F (auto-aim) | Left click at the crosshair |
| Use item | E / Shift | Right click (KEYS) / wheel (MOUSE) |
| Pause / restart / mute | Esc / R / M | Control bar under the game |

- Every wall has one window. Miss it and you **BONK**: you lose speed and coins. The dashed "net" line on the floor is the racing line, and the diamond marker shows where you will cross the next wall.
- Fly into **Jelly Cubes** for one of 8 items: Turbo Burp, Goo Bazooka, Homing Sock, Sludge Balloon, Bubble Wrap, Ghost Pepper, Goo Geyser or Mega Sneeze. The further back you are, the better the roll.
- **Splat** rivals with goo to slow them. Goo also jams spinning bars and smashes blocks for coins.
- Diamond **rings** boost you, square **coins** add top speed, and a dive followed by a flap gives a **Swoop** boost.
- Win the **Gloop Cup**: five races (Centre Court, Checker Chute, Bar Code, Wireframe City, Null Void) for points, finishing top 5 every time. A finish of 6th or worse costs one of your 3 retries, and losing them all ends the cup. A podium unlocks the mirrored **Regloop Cup**.

## What is in here

- `game/index.html` is the whole game, split into named sections: CONFIG, AUDIO, MUSIC, BLOCKFONT, TRACK_BUILDER, PROJECTION, CORRIDOR_RENDER, GATES_HAZARDS, RACER_ART, RACER_PHYSICS, AI, GOO, ITEMS, RACE, HUD, CUP, SCENES, SHOTS and MAIN_LOOP.
- `main.ts` hands the entry in: it copies `game/` and `screenshots/` and writes the dossier with `vendor/makefun-game.ts`.
- `?shot=race`, `?shot=title`, `?shot=results` and `?shot=podium` jump to the deterministic poses used for the screenshots.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ryahtpp8&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
