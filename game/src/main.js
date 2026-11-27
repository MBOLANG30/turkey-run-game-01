// Turkey Run — bootstrap: canvas setup, the frame loop and shot hooks.
// One job: wire the canvas to the game, run requestAnimationFrame, and
// honour ?shot= poses for screenshots (window.__shotReady signals capture).

import { TurkeyRunGame } from './game.js';
import { VIEW_WIDTH, VIEW_HEIGHT } from './config.js';
import { applyShotPose } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

const game = new TurkeyRunGame(canvas);
window.__turkeyRun = game;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '1');

let lastTime = performance.now();

/** One animation frame: advance the game and paint it. */
function frame(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  if (!shot) {
    game.update(dt);
  }
  game.render();
  if (shot) {
    window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

if (shot) {
  // Pose once from a clean state, then hold the frame for the camera.
  applyShotPose(game, shot, seed);
  game.render();
  window.__shotReady = true;
  requestAnimationFrame(frame);
} else {
  requestAnimationFrame(frame);
}
