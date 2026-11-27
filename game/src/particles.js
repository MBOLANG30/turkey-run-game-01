// Turkey Run — particles: feathers, dust, flames and confetti.
// One job: the small bursts that make hits, landings and victories feel
// physical, all drawn as plain canvas shapes.

/** One particle: a feather, dust puff, spark or confetti scrap. */
export class Particle {
  constructor(x, y, velocityX, velocityY, lifeSec, size, color, kind) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.lifeSec = lifeSec;
    this.maxLifeSec = lifeSec;
    this.size = size;
    this.color = color;
    this.kind = kind; // 'feather' | 'dust' | 'spark' | 'confetti'
    this.rotation = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 8;
    this.gravity = kind === 'feather' ? 320 : kind === 'dust' ? -40 : 500;
  }

  /** Advance the particle; returns false when its life is spent. */
  update(dt) {
    this.lifeSec -= dt;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    this.velocityY += this.gravity * dt;
    this.rotation += this.spin * dt;
    return this.lifeSec > 0;
  }

  /** Draw the particle, fading as it dies. */
  draw(ctx) {
    const alpha = Math.max(0, this.lifeSec / this.maxLifeSec);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    if (this.kind === 'feather') {
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size, this.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind === 'confetti') {
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Owns every live particle and the burst helpers the game calls. */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  /** A burst of turkey feathers at (x, y) — a hit. */
  burstFeathers(x, y, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      this.particles.push(
        new Particle(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 120,
          0.7 + Math.random() * 0.6,
          5 + Math.random() * 5,
          Math.random() < 0.5 ? '#8a5a2b' : '#c98a3f',
          'feather',
        ),
      );
    }
  }

  /** A small dust puff at the turkey's feet — running and landing. */
  puffDust(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      this.particles.push(
        new Particle(
          x + (Math.random() - 0.5) * 20,
          y + (Math.random() - 0.5) * 6,
          -40 - Math.random() * 60,
          -20 - Math.random() * 40,
          0.4 + Math.random() * 0.3,
          4 + Math.random() * 5,
          '#d8c49a',
          'dust',
        ),
      );
    }
  }

  /** Golden sparks where corn was eaten. */
  burstSparks(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.particles.push(
        new Particle(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.4 + Math.random() * 0.3,
          2.5 + Math.random() * 2.5,
          '#ffd23a',
          'spark',
        ),
      );
    }
  }

  /** A celebration rain of confetti across the top of the screen. */
  rainConfetti(width, count = 90) {
    const colors = ['#e8a13a', '#c23b22', '#4e8f3a', '#f2b705', '#7ec8ee'];
    for (let i = 0; i < count; i++) {
      this.particles.push(
        new Particle(
          Math.random() * width,
          -20 - Math.random() * 160,
          (Math.random() - 0.5) * 60,
          90 + Math.random() * 140,
          2.2 + Math.random() * 1.4,
          7 + Math.random() * 6,
          colors[i % colors.length],
          'confetti',
        ),
      );
    }
  }

  /** Advance every particle, dropping the spent ones. */
  update(dt) {
    this.particles = this.particles.filter((particle) => particle.update(dt));
  }

  /** Draw every particle. */
  draw(ctx) {
    for (const particle of this.particles) particle.draw(ctx);
  }

  /** Clear everything (fresh run). */
  reset() {
    this.particles = [];
  }
}
