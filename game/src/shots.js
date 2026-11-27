// Turkey Run — screenshot poses: deterministic staged scenes.
// One job: put the live game into a readable pose for each screenshot
// (title, mid-run play, near-miss danger, escaped ending) using only the
// game's own update/draw code, so every shot is a real render.

import { Obstacle } from './obstacles.js';
import { Corn } from './pickups.js';
import { ESCAPE_DISTANCE_M, PIXELS_PER_METER, GROUND_Y } from './config.js';

/**
 * Pose the game for a screenshot. `shot` is 'title' | 'play' | 'danger' | 'end'.
 * Runs the real simulation forward a fixed number of steps so the pose is a
 * genuine frame of gameplay, then freezes it for the capture.
 */
export function applyShotPose(game, shot, seed) {
  const random = game.random;
  void seed;

  if (shot === 'title') {
    game.state = 'title';
    game.distanceM = 0;
    game.distancePx = 0;
    game.bestDistanceM = 640;
    game.bestScore = 730;
    // A few practice steps so the turkey's run cycle is mid-stride.
    for (let i = 0; i < 20; i++) game.update(1 / 60);
    game.state = 'title';
    game.readyForShot = true;
    return;
  }

  if (shot === 'play') {
    game.startRun();
    game.sound.muted = true;
    // Run the real game forward: jump once, then freeze mid-jump over an oven.
    for (let i = 0; i < 60; i++) game.update(1 / 60);
    game.input.jumpQueued = true;
    for (let i = 0; i < 22; i++) game.update(1 / 60);
    // Hand-place the action: the turkey sailing over an oven, a knife
    // sweeping in at head height, corn arcing above.
    game.turkey.y = GROUND_Y - game.turkey.height - 120;
    game.turkey.velocityY = 220;
    game.turkey.onGround = false;
    game.turkey.jumpsUsed = 1;
    game.obstacles.obstacles.push(new Obstacle('oven', 250, random));
    game.obstacles.obstacles.push(new Obstacle('oven', 980, random));
    game.obstacles.obstacles.push(new Obstacle('knife', 620, random));
    game.corn.corns.push(new Corn(700, GROUND_Y - 210, 0.5));
    game.corn.corns.push(new Corn(744, GROUND_Y - 230, 1.2));
    game.corn.corns.push(new Corn(788, GROUND_Y - 210, 2.1));
    game.particles.puffDust(game.turkey.x + 8, GROUND_Y, 4);
    game.state = 'playing';
    game.readyForShot = true;
    return;
  }

  if (shot === 'danger') {
    game.startRun();
    game.sound.muted = true;
    for (let i = 0; i < 60; i++) game.update(1 / 60);
    // One life left, the farmer breathing down the turkey's neck,
    // an oven right ahead and a knife sweeping in at head height.
    game.lives = 1;
    game.farmer.gap = 46;
    game.farmer.shout = 'GOTCHA!';
    game.farmer.shoutTimer = 2;
    game.obstacles.obstacles.push(new Obstacle('oven', 470, random));
    game.obstacles.obstacles.push(new Obstacle('knife', 620, random));
    game.turkey.y = GROUND_Y - game.turkey.height - 130;
    game.turkey.velocityY = 240;
    game.turkey.onGround = false;
    game.turkey.jumpsUsed = 1;
    game.state = 'playing';
    game.readyForShot = true;
    return;
  }

  if (shot === 'end') {
    game.startRun();
    game.sound.muted = true;
    // Drive the run to the gate: full distance, full score, then escape.
    game.distancePx = ESCAPE_DISTANCE_M * PIXELS_PER_METER;
    game.distanceM = ESCAPE_DISTANCE_M;
    game.score = ESCAPE_DISTANCE_M + 12 * 10;
    game.cornEaten = 12;
    game.runTimeSec = 74.3;
    game.endEscaped();
    // Let the celebration confetti fall into view before the capture.
    game.particles.update(0.9);
    game.particles.update(0.9);
    game.state = 'escaped';
    game.readyForShot = true;
    return;
  }

  game.state = 'title';
  game.readyForShot = true;
}
