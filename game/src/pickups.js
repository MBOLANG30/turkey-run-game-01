// Turkey Run — corn pickups: the grain that keeps the turkey going.
// One job: spawn arcs of corn, draw the golden kernels, and hand the game
// the ones the turkey eats (each one pushes the farmer back a step).

import { GROUND_Y, VIEW_WIDTH, CORN_MIN_GAP, CORN_MAX_GAP } from './config.js';
import { randomRange, randomInt } from './random.js';

/** One ear of corn on the track. */
export class Corn {
  constructor(x, y, bobPhase) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.bobPhase = bobPhase;
    this.width = 26;
    this.height = 34;
    this.eaten = false;
  }

  /** The collision box. */
  get hitbox() {
    return { x: this.x - 4, y: this.y - 4, width: this.width + 8, height: this.height + 8 };
  }

  /** Drift left with the world, bobbing gently. */
  update(dt, scrollSpeed, timeSec) {
    this.x -= scrollSpeed * dt;
    this.y = this.baseY + Math.sin(timeSec * 3 + this.bobPhase) * 5;
  }

  /** Off the left edge and gone. */
  get isGone() {
    return this.x + this.width < -20;
  }

  /** Draw a golden ear of corn with green husk leaves. */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Husk leaves.
    ctx.fillStyle = '#4e8f3a';
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(-12, 18, -6, 2);
    ctx.quadraticCurveTo(2, 14, 4, 30);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(26, 30);
    ctx.quadraticCurveTo(38, 18, 32, 2);
    ctx.quadraticCurveTo(24, 14, 22, 30);
    ctx.closePath();
    ctx.fill();
    // Golden kernels.
    ctx.fillStyle = '#f2b705';
    ctx.beginPath();
    ctx.ellipse(13, 16, 11, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d99600';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.beginPath();
        ctx.arc(7 + col * 6, 6 + row * 7, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

/** Spawns and manages the corn arcs the turkey can collect. */
export class CornManager {
  constructor(random) {
    this.random = random;
    this.corns = [];
    this.spawnTimer = 0.8;
  }

  /** Reset for a fresh run. */
  reset() {
    this.corns = [];
    this.spawnTimer = 0.8;
  }

  /** Spawn a small arc of corn now and then, high or low. */
  update(dt, scrollSpeed, timeSec) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = randomRange(this.random, CORN_MIN_GAP, CORN_MAX_GAP);
      const count = randomInt(this.random, 3, 5);
      const high = this.random() < 0.4;
      const baseY = high ? GROUND_Y - 190 : GROUND_Y - 60;
      const startX = VIEW_WIDTH + 60;
      for (let i = 0; i < count; i++) {
        const arcLift = Math.sin((i / Math.max(1, count - 1)) * Math.PI) * 46;
        this.corns.push(
          new Corn(startX + i * 44, baseY - arcLift, this.random() * Math.PI * 2),
        );
      }
    }
    for (const corn of this.corns) corn.update(dt, scrollSpeed, timeSec);
    this.corns = this.corns.filter((corn) => !corn.isGone && !corn.eaten);
  }

  /** The corn overlapping a hitbox, or null (marks it eaten). */
  collectOverlapping(hitbox) {
    for (const corn of this.corns) {
      const box = corn.hitbox;
      const overlap =
        hitbox.x < box.x + box.width &&
        hitbox.x + hitbox.width > box.x &&
        hitbox.y < box.y + box.height &&
        hitbox.y + hitbox.height > box.y;
      if (overlap) {
        corn.eaten = true;
        return corn;
      }
    }
    return null;
  }

  /** Draw every ear of corn. */
  draw(ctx) {
    for (const corn of this.corns) corn.draw(ctx);
  }
}
