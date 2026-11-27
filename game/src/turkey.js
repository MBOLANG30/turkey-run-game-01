// Turkey Run — the turkey: physics, drawing and animation.
// One job: how the bird moves (run, jump, double-jump, duck) and what it
// looks like, drawn in code with an autumn palette — no image assets.

import {
  TURKEY_X,
  TURKEY_WIDTH,
  TURKEY_HEIGHT,
  TURKEY_DUCK_HEIGHT,
  TURKEY_GRAVITY,
  TURKEY_JUMP_SPEED,
  TURKEY_DOUBLE_JUMP_SPEED,
  TURKEY_MAX_FALL_SPEED,
  GROUND_Y,
} from './config.js';

/** The player bird: a plump brown turkey with a red wattle, drawn in canvas. */
export class Turkey {
  constructor() {
    this.x = TURKEY_X;
    this.width = TURKEY_WIDTH;
    this.height = TURKEY_HEIGHT;
    this.y = GROUND_Y - this.height;
    this.velocityY = 0;
    this.jumpsUsed = 0;
    this.ducking = false;
    this.onGround = true;
    this.runCycle = 0;
    this.blinkTimer = 0;
  }

  /** The turkey's feet line, for ground contact and landing. */
  get feetY() {
    return this.y + this.height;
  }

  /** The collision box, shorter while ducking. */
  get hitbox() {
    const height = this.ducking ? TURKEY_DUCK_HEIGHT : TURKEY_HEIGHT;
    return {
      x: this.x + 8,
      y: this.y + (this.height - height),
      width: this.width - 16,
      height,
    };
  }

  /** Try to jump (first jump, or a double-jump in the air). Returns 'jump', 'double' or null. */
  jump() {
    if (this.onGround) {
      this.velocityY = -TURKEY_JUMP_SPEED;
      this.jumpsUsed = 1;
      this.onGround = false;
      return 'jump';
    }
    if (this.jumpsUsed < 2) {
      this.velocityY = -TURKEY_DOUBLE_JUMP_SPEED;
      this.jumpsUsed = 2;
      return 'double';
    }
    return null;
  }

  /** Set the ducking pose (only matters on the ground). */
  setDucking(ducking) {
    this.ducking = ducking && this.onGround;
  }

  /** Advance physics by dt seconds; scrollSpeed drives the run cycle. */
  update(dt, scrollSpeed) {
    this.runCycle += dt * (this.onGround ? scrollSpeed / 28 : 6);
    this.blinkTimer += dt;
    if (!this.onGround) {
      this.velocityY = Math.min(TURKEY_MAX_FALL_SPEED, this.velocityY + TURKEY_GRAVITY * dt);
      this.y += this.velocityY * dt;
      if (this.feetY >= GROUND_Y) {
        this.y = GROUND_Y - this.height;
        this.velocityY = 0;
        this.onGround = true;
        this.jumpsUsed = 0;
      }
    }
  }

  /** Put the turkey back on the ground at the start of a run. */
  reset() {
    this.y = GROUND_Y - this.height;
    this.velocityY = 0;
    this.jumpsUsed = 0;
    this.ducking = false;
    this.onGround = true;
    this.runCycle = 0;
  }

  /** Draw the turkey: body, fanned tail, wing, head, beak, wattle and legs. */
  draw(ctx, timeSec, invulnerable) {
    if (invulnerable && Math.floor(timeSec * 14) % 2 === 0) return;
    const duck = this.ducking;
    const bodyY = duck ? this.y + 26 : this.y;
    const bodyH = duck ? TURKEY_DUCK_HEIGHT + 6 : this.height;
    const bob = this.onGround ? Math.sin(this.runCycle) * 2 : 0;
    const legSwing = this.onGround ? Math.sin(this.runCycle) * 10 : 6;

    ctx.save();
    ctx.translate(this.x, bodyY + bob);

    // Fanned tail feathers behind the body.
    ctx.fillStyle = '#8a5a2b';
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(6, 26);
      ctx.rotate(i * 0.32 - 0.5);
      ctx.beginPath();
      ctx.ellipse(0, -26, 9, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i % 2 === 0 ? '#c98a3f' : '#8a5a2b';
      ctx.beginPath();
      ctx.ellipse(0, -44, 5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Plump body.
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.ellipse(34, 34, 32, duck ? 20 : 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(38, 40, 24, duck ? 14 : 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing, flapping a little in the air.
    const flap = this.onGround ? Math.sin(this.runCycle) * 3 : -8;
    ctx.fillStyle = '#5a3a1e';
    ctx.beginPath();
    ctx.ellipse(30, 32 + flap, 18, 12, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Neck and head.
    const headX = duck ? 66 : 58;
    const headY = duck ? 8 : -6;
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(48, 22);
    ctx.lineTo(headX - 4, headY + 10);
    ctx.stroke();
    ctx.fillStyle = '#a86a35';
    ctx.beginPath();
    ctx.arc(headX, headY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Beak, wattle and eye.
    ctx.fillStyle = '#e8a13a';
    ctx.beginPath();
    ctx.moveTo(headX + 10, headY - 2);
    ctx.lineTo(headX + 24, headY + 3);
    ctx.lineTo(headX + 10, headY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c23b22';
    ctx.beginPath();
    ctx.ellipse(headX + 6, headY + 12, 4, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    const eyeOpen = this.blinkTimer % 3.4 < 3.25;
    ctx.beginPath();
    ctx.arc(headX + 4, headY - 3, eyeOpen ? 2.6 : 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Legs, scrambling.
    ctx.strokeStyle = '#e8a13a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(26, bodyH - 4);
    ctx.lineTo(22 + legSwing, bodyH + 12);
    ctx.moveTo(42, bodyH - 4);
    ctx.lineTo(46 - legSwing, bodyH + 12);
    ctx.stroke();

    ctx.restore();
  }
}
