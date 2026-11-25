// Kuali Rush — the hand-in program, Node 22 with the standard library only. It takes the
// finished game (the static files under game/ next to this file) and the four browser renders
// in screenshots/, copies both into the output directory, and writes dossier.json there: the
// judge's summary of the entry, built by the kit's vendored library. Nothing else is written.
//
// To run it outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root (this file's directory) and the directory the entry is handed in to.
const entryRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Hand the game in: the whole game/ tree, then the screenshots beside it.
mkdirSync(outputDir, { recursive: true });
cpSync(join(entryRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(entryRoot, 'screenshots'))) {
  cpSync(join(entryRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The gate's own caps, passed along so this program refuses exactly what the scorer refuses:
// at most four screenshots of 256 KiB each, game/ at most 993 entries and 48 MiB in all, and
// no path under game/ longer than 1000 bytes.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, dossierCaps));
