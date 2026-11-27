// Turkey Run — the farmer: the chaser who never gives up.
// One job: the gap between farmer and turkey, and the farmer's look —
// overalls, straw hat, pitchfork — as he closes in or falls behind.

import { GROUND_Y, FARMER_START_GAP, FARMER_CATCH_GAP } from './config.js';

/** The pursuing farmer. `gap` is pixels behind the turkey; 0 means caught. */
export class Farmer {
  constructor() {
    this.gap = FARMER_START_GAP;
    this.runCycle = 0;
    this.shoutTimer = 0;
    this.shout = '';
  }

  /** How close the farmer is, 0 (far) to 1 (about to grab the turkey). */
  get closeness() {
    return 1 - Math.max(0, this.gap - FARMER_CATCH_GAP) / (FARMER_START_GAP - FARMER_CATCH_GAP);
  }

  /** The farmer has caught the turkey when the gap closes to the catch line. */
  get hasCaught() {
    return this.gap <= FARMER_CATCH_GAP;
  }

  /** The farmer closes in by `pixels` (a hit, a stumble). */
  gainGround(pixels) {
    this.gap = Math.max(FARMER_CATCH_GAP, this.gap - pixels);
    this.shout = 'GOTCHA!';
    this.shoutTimer = 1.1;
  }

  /** The turkey pulls away by `pixels` (corn eaten, clean stretch). */
  fallBehind(pixels) {
    this.gap = Math.min(FARMER_START_GAP, this.gap + pixels);
  }

  /** Advance the chase by dt seconds; the farmer creeps closer on his own. */
  update(dt, scrollSpeed, gainPerSecond) {
    this.runCycle += dt * (scrollSpeed / 24);
    this.gap = Math.max(FARMER_CATCH_GAP, this.gap - gainPerSecond * dt);
    if (this.shoutTimer > 0) this.shoutTimer -= dt;
    if (this.gap > FARMER_START_GAP * 0.55 && this.shout === 'GOTCHA!') this.shout = '';
  }

  /** Back to the starting gap for a fresh run. */
  reset() {
    this.gap = FARMER_START_GAP;
    this.shout = '';
    this.shoutTimer = 0;
  }

  /** Draw the farmer at his position behind the turkey. */
  draw(ctx, turkeyX) {
    const x = turkeyX - this.gap - 46;
    const bob = Math.sin(this.runCycle) * 2;
    const legSwing = Math.sin(this.runCycle) * 11;

    ctx.save();
    ctx.translate(x, GROUND_Y - 96 + bob);

    // Pitchfork, carried high and waving.
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-6, 88);
    ctx.lineTo(-22, -18);
    ctx.stroke();
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-22 + i * 8, -18);
      ctx.lineTo(-22 + i * 8, -34);
      ctx.stroke();
    }

    // Legs in overalls.
    ctx.strokeStyle = '#2e4a6b';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(14, 62);
    ctx.lineTo(8 + legSwing, 94);
    ctx.moveTo(28, 62);
    ctx.lineTo(34 - legSwing, 94);
    ctx.stroke();

    // Body: red shirt, blue overalls.
    ctx.fillStyle = '#b83226';
    ctx.fillRect(4, 18, 40, 46);
    ctx.fillStyle = '#2e4a6b';
    ctx.fillRect(8, 44, 32, 22);
    ctx.fillStyle = '#e8c33a';
    ctx.fillRect(20, 44, 8, 8);

    // Arm reaching for the turkey.
    ctx.strokeStyle = '#b83226';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(40, 28);
    ctx.lineTo(56 + Math.sin(this.runCycle * 0.5) * 3, 12);
    ctx.stroke();

    // Head with straw hat and angry moustache.
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(24, 8, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c33a';
    ctx.beginPath();
    ctx.ellipse(24, -2, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(24, -8, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(14, 10, 20, 4);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(20, 6, 1.8, 0, Math.PI * 2);
    ctx.arc(29, 6, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Shout bubble when he gains ground.
    if (this.shoutTimer > 0 && this.shout) {
      ctx.font = 'bold 20px system-ui, sans-serif';
      const width = ctx.measureText(this.shout).width + 18;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(6, -52, width, 28, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b83226';
      ctx.fillText(this.shout, 15, -32);
    }

    ctx.restore();
  }
}
