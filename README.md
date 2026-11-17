# goo-prix

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/j23xx/goo-prix/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/j23xx/goo-prix/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

GOO PRIX is a first-person flying kart racer through a world made of breakfast, sewers, freezers and rubbish. Flap through the icing-rimmed window in every wall, follow the dashed racing line, and splat seven rival idiots with goo across a five-race grand prix: Breakfast Bay (a toast sun over a jam sea), Drain Disco (a nightclub in a sewer pipe), Freezer Burn (inside a fridge), Lava Lamp Lagoon (inside a lava lamp) and Cosmic Dumpster (an orbital rubbish heap). One self-contained HTML file: its own 3D projection on a 2D canvas, a metaball lava sky, synthesized sound, no libraries, no network.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Any static file server pointed at `game/` works too.

## How to play

| Do | Key |
| --- | --- |
| Flap | ↑ (or W) |
| Steer | ← → (or A / D) |
| Dive (then flap for a Swoop boost) | Hold ↓ |
| Shoot goo (auto-aims at the rival ahead, hold to keep firing) | Space |
| Use item | X (or Shift) |
| Pause / restart / mute | Esc / R / M |

- Every wall has one window with a cream **icing rim**. Miss it and you **BONK**: you lose speed and coins. The dashed line on the floor is the racing line, and the diamond marker shows where you will cross the next wall.
- **Splat** rivals with goo: each hit halves their speed for a couple of seconds and knocks them down, and repeat hits stack. Goo also jams spinning fans and smashes blocks for coins.
- Fly into **Jelly Cubes** for one of 10 items: Turbo Burp, Goo Bazooka, Homing Sock, Sludge Balloon, Bubble Wrap, Ghost Pepper, Goo Geyser, Mega Sneeze, **Auto-Goo** (five seconds of automatic rapid fire) and the **Stun Bomb** (a shockwave that stuns every other racer for a second). The further back you are, the better the roll.
- Aqua donut **rings** boost you, gold droplet **coins** add top speed, and a dive followed by a flap gives a **Swoop** boost.
- Colour means the same thing everywhere: a **cream rim** is where to fly, **tomato red** hurts, **aqua** helps, **gold** is coins, and **lime** is always goo.
- Win the **Gloop Cup**: five races for points, finishing top 5 every time. A finish of 6th or worse costs one of your 3 retries, and losing them all ends the cup. A podium unlocks the mirrored **Regloop Cup**.


## What is in here

- `game/index.html` is the whole game, split into named sections: CONFIG, AUDIO, MUSIC, BLOCKFONT, TRACK_BUILDER, THEMES, PROJECTION, CORRIDOR_RENDER, GATES_HAZARDS, RACER_ART, RACER_PHYSICS, AI, GOO, ITEMS, RACE, HUD, CUP, SCENES, SHOTS and MAIN_LOOP.
- `main.ts` hands the entry in: it copies `game/` and `screenshots/` and writes the dossier with `vendor/makefun-game.ts`.
- `?shot=race`, `?shot=hazard`, `?shot=title`, `?shot=podium`, `?shot=results` and `?shot=select` jump to the deterministic poses used for the screenshots.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ryahtpp8&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
