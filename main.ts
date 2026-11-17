// GOO PRIX hand-in program (Node 22, standard library only).
//
// The game is game/index.html plus the plain scripts in game/src/: canvas art, synthesized
// WebAudio sound, no libraries and no network requests. This program copies game/ and
// screenshots/ next to it into the output directory and writes dossier.json with the
// vendored make.fun library, so the grader can check the files and the judge can read them.
//
//   play locally:   node serve.ts            (then open http://localhost:8080)
//   hand in:        mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Caps the scorer enforces; buildDossier refuses anything over them so a bad entry fails here first.
const LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyGame(): void {
  const gameDir = join(repoDir, 'game');
  if (!existsSync(join(gameDir, 'index.html'))) throw new Error('game/index.html is missing');
  cpSync(gameDir, join(outDir, 'game'), { recursive: true });
}

function copyScreenshots(): number {
  const shotDir = join(repoDir, 'screenshots');
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (!existsSync(shotDir)) return 0;
  cpSync(shotDir, join(outDir, 'screenshots'), { recursive: true });
  return readdirSync(shotDir).filter((name) => !name.startsWith('.')).length;
}

mkdirSync(outDir, { recursive: true });
copyGame();
const shots = copyScreenshots();
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, LIMITS));
console.log(`GOO PRIX handed in: game/ + ${shots} screenshots + dossier.json -> ${outDir}`);
