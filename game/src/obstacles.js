// Turkey Run — hazards: the oven and the carving knife.
// One job: spawn, move, draw and collide the two dangers the turkey must
// dodge — ovens sit on the ground (jump them), knives fly at head height
// (duck under them).

import { GROUND_Y, VIEW_WIDTH, OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP } from './config.js';
import { randomRange, randomPick } from './random.js';

/** One hazard on the track. */
export class Obstacle {
  constructor(kind, x, random) {
    this.kind = kind; // 'oven' | 'knife'
    this.x = x;
    this.random = random;
    if (kind === 'oven') {
      this.width = 92;
      this.height = 78;
      this.y = GROUND_Y - this.height;
      this.flamePhase = random() * Math.PI * 2;
    } else {
      this.width = 76;
      this.height = 20;
      this.y = GROUND_Y - 96 - randomRange(random, 0, 26);
      this.bobPhase = random() * Math.PI * 2;
    }
    this.passed = false;
  }

  /** The collision box, slightly forgiving so near misses feel fair. */
  get hitbox() {
    if (this.kind === 'oven') {
      return { x: this.x + 10, y: this.y + 12, width: this.width - 20, height: this.height - 12 };
    }
    return { x: this.x + 8, y: this.y + 3, width: this.width - 16, height: this.height - 6 };
  }

  /** Move left with the scrolling world; knives bob as they fly. */
  update(dt, scrollSpeed, timeSec) {
    const speed = this.kind === 'knife' ? scrollSpeed * 1.35 : scrollSpeed;
    this.x -= speed * dt;
    if (this.kind === 'knife') {
      this.y += Math.sin(timeSec * 5 + this.bobPhase) * 14 * dt;
    }
  }

  /** Off the left edge and gone. */
  get isGone() {
    return this.x + this.width < -20;
  }

  /** Draw the oven (brick box, hot door, licking flames) or the knife. */
  draw(ctx, timeSec) {
    if (this.kind === 'oven') this.drawOven(ctx, timeSec);
    else this.drawKnife(ctx);
  }

  drawOven(ctx, timeSec) {
    const { x, y, width, height } = this;
    // Brick body.
    ctx.fillStyle = '#7a3b2e';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#93503c';
    ctx.fillRect(x + 4, y + 4, width - 8, 10);
    // Door with a hot glow.
    ctx.fillStyle = '#2b1a12';
    ctx.fillRect(x + 14, y + 22, width - 28, height - 30);
    ctx.fillStyle = '#ff7b24';
    ctx.fillRect(x + 20, y + 28, width - 40, height - 42);
    ctx.fillStyle = '#ffd23a';
    ctx.fillRect(x + 26, y + 34, width - 52, 10);
    // Chimney.
    ctx.fillStyle = '#5a2b20';
    ctx.fillRect(x + width - 26, y - 18, 18, 18);
    // Flames licking out of the top.
    for (let i = 0; i < 3; i++) {
      const flicker = Math.sin(timeSec * 11 + this.flamePhase + i * 2.1) * 5;
      const flameX = x + 16 + i * 28;
      ctx.fillStyle = i === 1 ? '#ff9d2e' : '#ff5a1f';
      ctx.beginPath();
      ctx.moveTo(flameX, y + 2);
      ctx.quadraticCurveTo(flameX + 8, y - 26 - flicker, flameX + 16, y + 2);
      ctx.closePath();
      ctx.fill();
    }
    // Warning chevron above the oven.
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', x + width / 2, y - 26);
    ctx.textAlign = 'left';
  }

  drawKnife(ctx) {
    const { x, y, width, height } = this;
    // Handle.
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x, y + 3, 20, height - 6);
    ctx.fillStyle = '#5a4028';
    ctx.fillRect(x + 4, y + 6, 3, height - 12);
    ctx.fillRect(x + 12, y + 6, 3, height - 12);
    // Blade, glinting.
    ctx.fillStyle = '#dfe6ea';
    ctx.beginPath();
    ctx.moveTo(x + 20, y);
    ctx.lineTo(x + width - 8, y + height / 2);
    ctx.lineTo(x + 20, y + height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 3);
    ctx.lineTo(x + width - 16, y + height / 2);
    ctx.lineTo(x + 24, y + height - 3);
    ctx.closePath();
    ctx.fill();
  }
}

/** Spawns and manages every hazard on the track. */
export class ObstacleManager {
  constructor(random) {
    this.random = random;
    this.obstacles = [];
    this.spawnTimer = 1.2;
    this.distanceM = 0;
  }

  /** Reset for a fresh run. */
  reset() {
    this.obstacles = [];
    this.spawnTimer = 1.2;
    this.distanceM = 0;
  }

  /** Spawn hazards on a timer that tightens as the run gets faster. */
  update(dt, scrollSpeed, timeSec, distanceM) {
    this.distanceM = distanceM;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const difficulty = Math.min(1, distanceM / 700);
      const gap = randomRange(
        this.random,
        OBSTACLE_MIN_GAP - difficulty * 0.25,
        OBSTACLE_MAX_GAP - difficulty * 0.55,
      );
      this.spawnTimer = Math.max(0.55, gap);
      const kind = randomPick(this.random, ['oven', 'oven', 'knife']);
      const x = VIEW_WIDTH + randomRange(this.random, 0, 120);
      this.obstacles.push(new Obstacle(kind, x, this.random));
      // Late in the run, sometimes deal two hazards at once.
      if (difficulty > 0.55 && this.random() < 0.3) {
        const secondKind = kind === 'oven' ? 'knife' : 'oven';
        this.obstacles.push(new Obstacle(secondKind, x + 190, this.random));
      }
    }
    for (const obstacle of this.obstacles) obstacle.update(dt, scrollSpeed, timeSec);
    this.obstacles = this.obstacles.filter((obstacle) => !obstacle.isGone);
  }

  /** The first hazard overlapping a hitbox, or null. */
  collidingWith(hitbox) {
    for (const obstacle of this.obstacles) {
      const box = obstacle.hitbox;
      const overlap =
        hitbox.x < box.x + box.width &&
        hitbox.x + hitbox.width > box.x &&
        hitbox.y < box.y + box.height &&
        hitbox.y + hitbox.height > box.y;
      if (overlap) return obstacle;
    }
    return null;
  }

  /** Draw every hazard. */
  draw(ctx, timeSec) {
    for (const obstacle of this.obstacles) obstacle.draw(ctx, timeSec);
  }
}
