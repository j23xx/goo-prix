# goo-prix

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/j23xx/goo-prix/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/j23xx/goo-prix/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

GOO PRIX is a first-person flap-and-splat **score attack**. You fly a goo-firing ship down a corridor through five worlds, shooting everything for points, chaining hits into a multiplier and threading the window in every wall, while every crash, bolt and drip of goop costs you. Each world breaks the rules a little more than the last, between worlds you draft one of twelve **Mix-ins** that bend the rules in your favour, and the sixth stage is a boss fight against **Mister Spotless**, a chrome cleaning robot you beat by making him filthy. Then there is **Endless Slop**.

Everything is drawn in code on a 2D canvas: its own 3D projection, cel-shaded manga ships with screentone and glints, wet goo with specular highlights and running drips, comic halftone and onomatopoeia when your multiplier climbs, synthesized music and sound effects, and an announcer voiced by the browser's own offline speech voices. No images, no libraries, no network.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Any static file server pointed at `game/` works too.

## How to play

| Do | Key |
| --- | --- |
| Flap (in zero-G: thrust up) | ↑ (or W) |
| Steer | ← → (or A / D) |
| Dive, then flap for a Swoop boost (in zero-G: thrust down) | Hold ↓ |
| Shoot goo (auto-aims; in zero-G hold to lock up to six, release to fire) | Space |
| Use item | X (or Shift) |
| Pause / restart / mute | Esc / R / M |

**Scoring.** Floaters 50, splitters 80 (they split), zippers 120, armoured tanks 250, rival aces that shoot back 400, fleeing goldies 1000. Threading a window is +100, a bullseye through its middle +250, clearing a whole wave +300. Every hit grows your chain; every five hits add x1 to the multiplier, up to x8, and the world gets a new coat of paint at x3 (POP: halftone and comic bursts) and x6 (WET PAINT: paint running down the screen). Stop hitting for 2.5 seconds and it drains.

**Knocks.** Hitting a wall costs 500, a hazard 300, an enemy bolt 200, a goop curtain 150, and every knock wipes your multiplier. Grinding the side rails bleeds 50 a second.

**The run.** Beat each level's quota to move on; 3x the quota is an S. You get 3 continues for the whole run, and Practice lets you play any stage on its own. A cleared level can be retried for a better grade.

**Mix-ins.** After each cleared level, pick 1 of 3 (or press R to reroll for 1,000 points). Every Mix-in you own raises the next quotas by 20%.

| Mix-in | Effect |
| --- | --- |
| THICK COAT | Hits splash anything within 2.5 m for 1 |
| TWIN NOZZLE | Fire two globs; shots cost 25% more |
| BOTTOMLESS BUCKET | Goo tank 160, refills 30% faster |
| STICKY CHAIN | The chain lasts 4.5 s instead of 2.5 s |
| PRIMER | Never below x2; a knock halves the chain instead of ending it |
| NON-STICK HULL | Knocks cost half, and the first one each level is free |
| NEEDLE THREADER | Windows +250, bullseyes +600 and a full tank |
| OVERSPILL | The multiplier cap goes from x8 to x10 |
| GOLD LEAF | Goldies twice as often, worth 1,500 |
| DRIBBLE | Every kill drips a homing droplet at the next target |
| HOT SAUCE | All points +50%, but knocks cost double |
| TURPENTINE | Tanks and aces lose an armour pip; boss stains +50% |

**Endless Slop.** The six stages loop with a Mix-in draft after every one; each loop flies 10% faster and asks 50% more. Miss one quota and the run is over. The best five runs are kept.

| # | Level | World | The new rule |
| --- | --- | --- | --- |
| 1 | ORDER UP | Breakfast Bay | The basics. Halfway through, the toast sun comes down to fight. |
| 2 | BEAT DROP | Drain Disco | Shots on the beat score double. The pipe sways to the music, then barrel-rolls. |
| 3 | WHITE-OUT | Freezer Burn | Blizzards frost the walls over until you goo them. Steering slides. Then the lights go out. |
| 4 | UPSIDE DROWN | Lava Lamp Lagoon | Gravity flips every 12 seconds. Then the lamp tips onto its side. |
| 5 | LOCK 'N' SLOP | Cosmic Dumpster | Zero-G thrust flight and lock-on volleys, then a junk storm. |
| 6 | MISTER SPOTLESS | The Showroom | The boss: fill his FILTH bar. Jam his spray turrets to stop the squeegee, feed his maw, hit the gold stains. |

Fly into **Jelly Cubes** for items: Turbo Burp, Goo Bazooka, Homing Sock, Bubble Wrap, Ghost Pepper, Goo Geyser, Mega Sneeze, Auto-Goo and the Stun Bomb.

Pick from eight ships, each with its own pilot, hull, stats (speed, handling, goo, armour) and catchphrase.

## What is in here

- `game/index.html` is the page shell. The game is plain scripts in `game/src/`, one job per file, loaded screens and rules first, then the engine:
  - `scenes/`: `scene-flow`, `title`, `how-to-play`, `ship-select`, `level-intro`, `stage-play`, `pause`, `level-results`, `mixin-draft`, `run-complete`, `game-over`
  - `play/`: `levels`, `mixins`, `run-progress`, `scoring`, `stage-run` (a level and its twist), `controls`, `boss`, `targets`, `items`, `goo-shots`, `ships`, `flight`, `autopilot`
  - `ui/`: `hud`, `menu-widgets`
  - `audio/`: `sound` (synth and music), `announcer` (offline speech)
  - `world/`: `worlds`, `skies`, `corridor`, `gates`
  - `render/`: `projection`, `camera`, `world-render`, `goo-paint`, `effects`, `block-font`
  - `core/`: `util`, `config`, `save`, `input`
  - `dev/shot-poses` and `main`
- `main.ts` hands the entry in: it copies `game/` and `screenshots/` and writes the dossier with `vendor/makefun-game.ts`.
- `?shot=boss`, `?shot=title`, `?shot=draft`, `?shot=final`, `?shot=play`, `?shot=zerog`, `?shot=results`, `?shot=select`, `?shot=howto` and `?shot=level&l=2&t=30` jump to the deterministic poses used for the screenshots.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ryahtpp8&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
