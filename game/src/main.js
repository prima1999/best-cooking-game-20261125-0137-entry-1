// Kuali Rush: the entry point. One file, one job: own the canvas, the frame loop and the screen
// the page opens on. The rules live in world.js, the pictures in render.js, the staged screenshot
// scenes in shots.js; this file only wires them together and keeps time.

import { VIEW } from './config.js';
import { createInput, endStep } from './input.js';
import { createWorld, stepWorld } from './world.js';
import { renderWorld } from './render.js';
import { stageShot } from './shots.js';
import { unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const input = createInput(canvas);
const world = shot !== null ? stageShot(shot) : createWorld();

/** The one-line spoken status, for screen readers, updated when the game state changes. */
function announce() {
  const time = Math.max(0, Math.ceil(world.timeLeft));
  const mm = String(Math.floor(time / 60)).padStart(2, '0');
  const ss = String(time % 60).padStart(2, '0');
  statusLine.textContent =
    world.screen === 'title'
      ? 'Kuali Rush: tekan Enter untuk mulai memasak.'
      : world.screen === 'over'
        ? `Shift selesai. Koin ${world.coins}, ${world.served} hidangan disajikan.`
        : `Kuali Rush: ${mm}:${ss} tersisa, ${world.coins} koin, ${world.orders.length} pesanan, piring berisi ${world.plate.length} bahan.`;
}

window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });

let last = performance.now();

/** One frame: step the rules, paint the kitchen, and keep the spoken status fresh. */
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (shot === null) {
    stepWorld(world, input, dt);
  } else {
    endStep(input);
  }
  renderWorld(ctx, world, input);
  announce();
  requestAnimationFrame(frame);
}

announce();
renderWorld(ctx, world, input);
requestAnimationFrame(frame);
