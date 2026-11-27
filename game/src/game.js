// Turkey Run — the game itself: state machine, scoring, HUD and screens.
// One job: tie the turkey, farmer, hazards, corn, particles and backdrop
// together into a complete run — title, play, caught, escaped, restart.

import {
  VIEW_WIDTH,
  VIEW_HEIGHT,
  GROUND_Y,
  ESCAPE_DISTANCE_M,
  PIXELS_PER_METER,
  SCROLL_START_SPEED,
  SCROLL_MAX_SPEED,
  SCROLL_ACCELERATION,
  FARMER_GAIN_PER_SECOND,
  FARMER_GAIN_PER_HIT,
  FARMER_PUSHBACK_PER_CORN,
  START_LIVES,
  INVULNERABLE_SECONDS,
  CORN_SCORE,
  METER_SCORE,
  stageAt,
} from './config.js';
import { mulberry32 } from './random.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { ObstacleManager } from './obstacles.js';
import { CornManager } from './pickups.js';
import { ParticleSystem } from './particles.js';
import { FarmBackground } from './background.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';

/** The whole game: states 'title' | 'playing' | 'caught' | 'escaped'. */
export class TurkeyRunGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.sound = new SoundEngine();
    this.random = mulberry32(20261127);
    this.background = new FarmBackground(this.random);
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.obstacles = new ObstacleManager(this.random);
    this.corn = new CornManager(this.random);
    this.particles = new ParticleSystem();

    this.state = 'title';
    this.timeSec = 0;
    this.runTimeSec = 0;
    this.distancePx = 0;
    this.distanceM = 0;
    this.scrollSpeed = SCROLL_START_SPEED;
    this.score = 0;
    this.cornEaten = 0;
    this.lives = START_LIVES;
    this.invulnerableTimer = 0;
    this.shakeTimer = 0;
    this.shakeStrength = 0;
    this.bestDistanceM = 0;
    this.bestScore = 0;
    this.endReason = '';
    this.flashTimer = 0;
    this.flashColor = '#fff';
    this.shotMode = null;
    this.readyForShot = false;
    this.dustTimer = 0;
  }

  /** Distance in whole meters. */
  get distanceWholeM() {
    return Math.floor(this.distanceM);
  }

  /** Start a fresh run from the title or an end screen. */
  startRun() {
    this.state = 'playing';
    this.runTimeSec = 0;
    this.distancePx = 0;
    this.distanceM = 0;
    this.scrollSpeed = SCROLL_START_SPEED;
    this.score = 0;
    this.cornEaten = 0;
    this.lives = START_LIVES;
    this.invulnerableTimer = 0;
    this.shakeTimer = 0;
    this.endReason = '';
    this.turkey.reset();
    this.farmer.reset();
    this.obstacles.reset();
    this.corn.reset();
    this.particles.reset();
    this.input.clearQueues();
    this.sound.unlock();
    this.sound.gobble();
  }

  /** The run ends with the turkey caught: the farmer grabs it or lives run out. */
  endCaught(reason) {
    this.state = 'caught';
    this.endReason = reason;
    this.shakeTimer = 0.5;
    this.shakeStrength = 12;
    this.particles.burstFeathers(this.turkey.x + 30, this.turkey.y + 30, 22);
    this.sound.caught();
    this.bestDistanceM = Math.max(this.bestDistanceM, this.distanceWholeM);
    this.bestScore = Math.max(this.bestScore, this.score);
  }

  /** The run ends with the turkey escaping through the farm gate. */
  endEscaped() {
    this.state = 'escaped';
    this.particles.rainConfetti(VIEW_WIDTH, 110);
    this.sound.escaped();
    this.bestDistanceM = Math.max(this.bestDistanceM, this.distanceWholeM);
    this.bestScore = Math.max(this.bestScore, this.score);
  }

  /** One hit: lose a life, the farmer lunges closer, feathers fly. */
  takeHit(obstacle) {
    if (this.invulnerableTimer > 0 || this.state !== 'playing') return;
    this.lives -= 1;
    this.invulnerableTimer = INVULNERABLE_SECONDS;
    this.shakeTimer = 0.35;
    this.shakeStrength = 10;
    this.flashTimer = 0.18;
    this.flashColor = 'rgba(194, 59, 34, 0.35)';
    this.farmer.gainGround(FARMER_GAIN_PER_HIT);
    this.particles.burstFeathers(this.turkey.x + 30, this.turkey.y + 30, 16);
    this.sound.hit();
    if (this.lives <= 0) {
      this.endCaught('Out of lives — the farmer finally grabbed you!');
    } else if (this.farmer.hasCaught) {
      this.endCaught('The farmer caught up and grabbed you!');
    }
  }

  /** Advance the game one frame (dt seconds, capped for tab-switch hiccups). */
  update(dt) {
    dt = Math.min(dt, 0.05);
    this.timeSec += dt;
    if (this.input.takeMute()) this.sound.toggleMute();

    if (this.state === 'title') {
      this.turkey.update(dt, 0);
      this.particles.update(dt);
      if (this.input.takeStart()) this.startRun();
      return;
    }

    if (this.state === 'caught' || this.state === 'escaped') {
      this.particles.update(dt);
      if (this.input.takeRestart() || this.input.takeStart()) this.startRun();
      return;
    }

    // Playing.
    this.runTimeSec += dt;
    this.scrollSpeed = Math.min(
      SCROLL_MAX_SPEED,
      SCROLL_START_SPEED + this.runTimeSec * SCROLL_ACCELERATION,
    );
    this.distancePx += this.scrollSpeed * dt;
    this.distanceM = this.distancePx / PIXELS_PER_METER;
    this.score = Math.floor(this.distanceM) * METER_SCORE + this.cornEaten * CORN_SCORE;

    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;

    // Jump / duck from the player.
    if (this.input.takeJump()) {
      const result = this.turkey.jump();
      if (result === 'jump') this.sound.jump();
      if (result === 'double') {
        this.sound.doubleJump();
        this.particles.puffDust(this.turkey.x + 20, this.turkey.feetY, 5);
      }
    }
    this.turkey.setDucking(this.input.duckHeld);
    this.turkey.update(dt, this.scrollSpeed);

    // Running dust.
    this.dustTimer -= dt;
    if (this.turkey.onGround && this.dustTimer <= 0) {
      this.dustTimer = 0.22;
      this.particles.puffDust(this.turkey.x + 8, GROUND_Y, 2);
    }

    this.farmer.update(dt, this.scrollSpeed, FARMER_GAIN_PER_SECOND);
    this.obstacles.update(dt, this.scrollSpeed, this.timeSec, this.distanceM);
    this.corn.update(dt, this.scrollSpeed, this.timeSec);
    this.particles.update(dt);

    // Eating corn pushes the farmer back and scores.
    const eaten = this.corn.collectOverlapping(this.turkey.hitbox);
    if (eaten) {
      this.cornEaten += 1;
      this.farmer.fallBehind(FARMER_PUSHBACK_PER_CORN);
      this.particles.burstSparks(eaten.x + 13, eaten.y + 16, 7);
      this.sound.corn();
    }

    // Hitting a hazard costs a life.
    const hit = this.obstacles.collidingWith(this.turkey.hitbox);
    if (hit) this.takeHit(hit);

    // The farmer catches the turkey on his own slow creep.
    if (this.state === 'playing' && this.farmer.hasCaught) {
      this.endCaught('The farmer caught up and grabbed you!');
    }

    // Reaching the farm gate ends the run in escape.
    if (this.state === 'playing' && this.distanceM >= ESCAPE_DISTANCE_M) {
      this.endEscaped();
    }
  }

  /** Draw one frame: world, actors, HUD, then the state screens. */
  render() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shakeTimer > 0) {
      const strength = this.shakeStrength * (this.shakeTimer / 0.35);
      ctx.translate((Math.random() - 0.5) * strength, (Math.random() - 0.5) * strength);
    }

    this.background.draw(ctx, this.distancePx, this.distanceM, this.timeSec);

    // The farm gate at the end of the track, visible as the goal nears (play only).
    if (this.state === 'playing' && this.distanceM > ESCAPE_DISTANCE_M - 120) {
      this.drawFarmGate(ctx);
    }

    this.corn.draw(ctx);
    this.obstacles.draw(ctx, this.timeSec);
    this.particles.draw(ctx);
    this.farmer.draw(ctx, this.turkey.x);
    this.turkey.draw(ctx, this.timeSec, this.invulnerableTimer > 0);

    ctx.restore();

    if (this.flashTimer > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    }

    if (this.state === 'playing') this.drawHud(ctx);
    else if (this.state === 'title') this.drawTitleScreen(ctx);
    else if (this.state === 'caught') this.drawEndScreen(ctx, false);
    else if (this.state === 'escaped') this.drawEndScreen(ctx, true);

    if (this.shotMode) this.readyForShot = true;
  }

  /** The wooden farm gate: the finish line the turkey is running for. */
  drawFarmGate(ctx) {
    const progress = Math.min(1, (this.distanceM - (ESCAPE_DISTANCE_M - 120)) / 120);
    // The gate slides in from the right edge as the turkey nears the goal.
    const gateX = VIEW_WIDTH + 120 - progress * (VIEW_WIDTH + 240 - this.turkey.x - 260);
    const gx = Math.max(this.turkey.x + 320, gateX);
    ctx.save();
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(gx, GROUND_Y - 150, 12, 150);
    ctx.fillRect(gx + 130, GROUND_Y - 150, 12, 150);
    ctx.fillRect(gx, GROUND_Y - 150, 142, 12);
    ctx.fillRect(gx, GROUND_Y - 96, 142, 12);
    ctx.fillRect(gx, GROUND_Y - 42, 142, 12);
    ctx.fillStyle = '#4e8f3a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FREEDOM GATE', gx + 71, GROUND_Y - 162);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  /** A small heart shape for the lives display. */
  drawHeart(ctx, x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.bezierCurveTo(x - 14, y - 4, x - 6, y - 14, x, y - 6);
    ctx.bezierCurveTo(x + 6, y - 14, x + 14, y - 4, x, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /** The HUD: score, distance bar, lives, corn and the farmer meter. */
  drawHud(ctx) {
    const stage = stageAt(this.distanceM);
    ctx.save();

    // Top bar.
    ctx.fillStyle = 'rgba(20, 20, 16, 0.55)';
    ctx.beginPath();
    ctx.roundRect(14, 12, 560, 86, 12);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`SCORE ${this.score}`, 30, 48);
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = '#ffd23a';
    ctx.fillText(`CORN ${this.cornEaten}  •  ${stage.name}`, 30, 78);

    // Lives as drawn hearts (no emoji font dependency in headless renders).
    for (let i = 0; i < START_LIVES; i++) {
      this.drawHeart(ctx, 436 + i * 42, 38, i < this.lives ? '#ff4d6d' : '#3a3a3a');
    }

    // Distance bar to the farm gate, top right.
    const barX = 700;
    const barW = 520;
    ctx.fillStyle = 'rgba(20, 20, 16, 0.55)';
    ctx.beginPath();
    ctx.roundRect(barX - 14, 12, barW + 28, 86, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(
      `DISTANCE  ${this.distanceWholeM} m / ${ESCAPE_DISTANCE_M} m`,
      barX,
      40,
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(barX, 52, barW, 18, 9);
    ctx.fill();
    ctx.fillStyle = '#4e8f3a';
    const filled = (barW * Math.min(1, this.distanceM / ESCAPE_DISTANCE_M));
    ctx.beginPath();
    ctx.roundRect(barX, 52, Math.max(18, filled), 18, 9);
    ctx.fill();
    // Little gate marker at the end of the distance bar.
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(barX + barW - 2, 48, 4, 26);
    ctx.fillRect(barX + barW + 8, 48, 4, 26);
    ctx.fillRect(barX + barW - 2, 48, 14, 4);
    ctx.fillRect(barX + barW - 2, 60, 14, 4);

    // Farmer proximity warning along the bottom.
    const closeness = this.farmer.closeness;
    ctx.fillStyle = 'rgba(20, 20, 16, 0.55)';
    ctx.beginPath();
    ctx.roundRect(14, VIEW_HEIGHT - 46, 340, 32, 10);
    ctx.fill();
    ctx.fillStyle = closeness > 0.75 ? '#ff5a3c' : '#fff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    const warning = closeness > 0.75 ? '! THE FARMER IS RIGHT BEHIND YOU!' : 'Farmer distance';
    ctx.fillText(warning, 26, VIEW_HEIGHT - 24);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(360, VIEW_HEIGHT - 38, 180, 12);
    ctx.fillStyle = closeness > 0.75 ? '#ff5a3c' : '#e8a13a';
    ctx.fillRect(360, VIEW_HEIGHT - 38, 180 * closeness, 12);

    // Controls hint, fading after the first seconds (clear of the farmer meter).
    if (this.runTimeSec < 6) {
      ctx.fillStyle = 'rgba(20, 20, 16, 0.6)';
      ctx.beginPath();
      ctx.roundRect(560, VIEW_HEIGHT - 52, 430, 38, 10);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText('SPACE / CLICK: jump (x2)   •   ↓: duck under knives', 574, VIEW_HEIGHT - 27);
    }

    ctx.restore();
  }

  /** The title screen: name, story, controls and the start prompt. */
  drawTitleScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(30, 18, 8, 0.45)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 92px system-ui, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 18;
    ctx.fillText('TURKEY RUN', VIEW_WIDTH / 2, 190);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd23a';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText('The Great Thanksgiving Escape', VIEW_WIDTH / 2, 245);

    ctx.fillStyle = '#fff';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('The farmer is coming for dinner — and you are dinner.', VIEW_WIDTH / 2, 305);
    ctx.fillText('Outrun him to the Freedom Gate, 1000 m away.', VIEW_WIDTH / 2, 340);
    ctx.fillText('Jump the ovens. Duck the carving knives. Eat the corn.', VIEW_WIDTH / 2, 375);

    ctx.fillStyle = 'rgba(20, 20, 16, 0.6)';
    ctx.beginPath();
    ctx.roundRect(VIEW_WIDTH / 2 - 300, 410, 600, 116, 14);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText('SPACE / CLICK — jump (press twice for double-jump)', VIEW_WIDTH / 2, 446);
    ctx.fillText('↓ ARROW — duck under flying knives', VIEW_WIDTH / 2, 478);
    ctx.fillText('R — restart    •    M — mute', VIEW_WIDTH / 2, 510);

    const pulse = 0.65 + Math.sin(this.timeSec * 4) * 0.35;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd23a';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('PRESS SPACE OR CLICK TO RUN!', VIEW_WIDTH / 2, 580);
    ctx.globalAlpha = 1;

    if (this.bestScore > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '20px system-ui, sans-serif';
      ctx.fillText(
        `Best escape so far: ${this.bestDistanceM} m  •  best score ${this.bestScore}`,
        VIEW_WIDTH / 2,
        630,
      );
    }
    ctx.textAlign = 'left';
    ctx.restore();
  }

  /** The end screen: ESCAPED! or CAUGHT!, with stats and restart. */
  drawEndScreen(ctx, escaped) {
    ctx.save();
    ctx.fillStyle = escaped ? 'rgba(20, 60, 20, 0.5)' : 'rgba(60, 10, 5, 0.55)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = escaped ? '#8dff6a' : '#ff6a4d';
    ctx.font = 'bold 96px system-ui, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW_WIDTH / 2, 220);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '28px system-ui, sans-serif';
    if (escaped) {
      ctx.fillText('You made it through the Freedom Gate —', VIEW_WIDTH / 2, 285);
      ctx.fillText('no Thanksgiving dinner for you this year!', VIEW_WIDTH / 2, 322);
    } else {
      ctx.fillText(this.endReason, VIEW_WIDTH / 2, 285);
      ctx.fillText('The farmer is already sharpening the carving knife…', VIEW_WIDTH / 2, 322);
    }

    ctx.fillStyle = 'rgba(20, 20, 16, 0.6)';
    ctx.beginPath();
    ctx.roundRect(VIEW_WIDTH / 2 - 260, 360, 520, 130, 14);
    ctx.fill();
    ctx.fillStyle = '#ffd23a';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`FINAL SCORE  ${this.score}`, VIEW_WIDTH / 2, 405);
    ctx.fillStyle = '#fff';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText(
      `Distance ${this.distanceWholeM} m  •  Corn ${this.cornEaten}  •  Time ${this.runTimeSec.toFixed(1)} s`,
      VIEW_WIDTH / 2,
      448,
    );
    ctx.fillText(`Best: ${this.bestDistanceM} m / ${this.bestScore} pts`, VIEW_WIDTH / 2, 478 - 4);

    const pulse = 0.65 + Math.sin(this.timeSec * 4) * 0.35;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd23a';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', VIEW_WIDTH / 2, 560);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    ctx.restore();
  }
}
