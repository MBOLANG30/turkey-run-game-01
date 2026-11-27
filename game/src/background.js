// Turkey Run — the farm backdrop: parallax sky, hills, barn, fence and trees.
// One job: paint the autumn farm scrolling past, with the palette shifting
// as the turkey runs from the farmyard toward the kitchen yard.

import { VIEW_WIDTH, VIEW_HEIGHT, GROUND_Y, stageAt } from './config.js';

/** Paints the layered farm background for a given scroll distance. */
export class FarmBackground {
  constructor(random) {
    this.random = random;
    // Fixed scatter of trees, hay bales and clouds so the world feels placed.
    this.trees = [];
    for (let i = 0; i < 26; i++) {
      this.trees.push({ x: i * 340 + random() * 200, size: 0.8 + random() * 0.7 });
    }
    this.hayBales = [];
    for (let i = 0; i < 14; i++) {
      this.hayBales.push({ x: i * 520 + random() * 260 });
    }
    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: i * 320 + random() * 180,
        y: 50 + random() * 110,
        scale: 0.7 + random() * 0.9,
        speed: 6 + random() * 10,
      });
    }
  }

  /** Draw the whole backdrop: sky, sun, clouds, hills, barn, trees, fence, ground. */
  draw(ctx, distancePx, distanceM, timeSec) {
    const stage = stageAt(distanceM);
    const width = VIEW_WIDTH;
    const height = VIEW_HEIGHT;

    // Sky.
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, stage.skyTop);
    sky.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, GROUND_Y);

    // Low autumn sun.
    ctx.fillStyle = '#ffdf6b';
    ctx.beginPath();
    ctx.arc(1060, 110, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 223, 107, 0.35)';
    ctx.beginPath();
    ctx.arc(1060, 110, 78, 0, Math.PI * 2);
    ctx.fill();

    // Clouds drifting slowly.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (const cloud of this.clouds) {
      const cx = (((cloud.x - distancePx * 0.05 - timeSec * cloud.speed) % 1500) + 1500) % 1500 - 110;
      this.drawCloud(ctx, cx, cloud.y, cloud.scale);
    }

    // Far hills.
    ctx.fillStyle = stage.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 60);
    for (let x = 0; x <= width; x += 40) {
      const worldX = x + distancePx * 0.15;
      ctx.lineTo(x, GROUND_Y - 90 - Math.sin(worldX * 0.004) * 42);
    }
    ctx.lineTo(width, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Near hills.
    ctx.fillStyle = stage.hill;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 20);
    for (let x = 0; x <= width; x += 40) {
      const worldX = x + distancePx * 0.35;
      ctx.lineTo(x, GROUND_Y - 46 - Math.sin(worldX * 0.006 + 2) * 26);
    }
    ctx.lineTo(width, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // The red barn, far off, scrolling slowly.
    const barnX = (((-distancePx * 0.4) % 1900) + 1900) % 1900 - 320;
    this.drawBarn(ctx, barnX, GROUND_Y - 118, stage);

    // Autumn trees.
    for (const tree of this.trees) {
      const tx = (((tree.x - distancePx * 0.55) % 1500) + 1500) % 1500 - 110;
      this.drawTree(ctx, tx, GROUND_Y, tree.size, stage);
    }

    // Ground.
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GROUND_Y, width, height - GROUND_Y);
    ctx.fillStyle = stage.groundDark;
    ctx.fillRect(0, GROUND_Y, width, 10);
    // Scuffed dirt and grass tufts scrolling with the world.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let i = 0; i < 22; i++) {
      const gx = (((i * 173 - distancePx) % 1400) + 1400) % 1400 - 60;
      ctx.beginPath();
      ctx.ellipse(gx, GROUND_Y + 46 + (i % 5) * 14, 26, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#6f9e4a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      const gx = (((i * 211 - distancePx) % 1400) + 1400) % 1400 - 60;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y + 8);
      ctx.lineTo(gx - 4, GROUND_Y - 4);
      ctx.moveTo(gx + 6, GROUND_Y + 8);
      ctx.lineTo(gx + 10, GROUND_Y - 3);
      ctx.stroke();
    }

    // Fence posts and rails, scrolling with the world.
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(0, GROUND_Y - 52, width, 6);
    ctx.fillRect(0, GROUND_Y - 30, width, 6);
    for (let i = 0; i < 16; i++) {
      const fx = (((i * 96 - distancePx) % 1400) + 1400) % 1400 - 60;
      ctx.fillRect(fx, GROUND_Y - 62, 10, 62);
    }

    // Hay bales resting by the fence.
    ctx.fillStyle = '#d9a441';
    for (const bale of this.hayBales) {
      const bx = (((bale.x - distancePx * 0.9) % 1500) + 1500) % 1500 - 110;
      ctx.beginPath();
      ctx.arc(bx, GROUND_Y - 14, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a87c22';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, GROUND_Y - 14, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawCloud(ctx, x, y, scale) {
    ctx.beginPath();
    ctx.arc(x, y, 26 * scale, 0, Math.PI * 2);
    ctx.arc(x + 28 * scale, y - 8 * scale, 22 * scale, 0, Math.PI * 2);
    ctx.arc(x + 56 * scale, y, 24 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBarn(ctx, x, y, stage) {
    ctx.fillStyle = '#a83226';
    ctx.fillRect(x, y + 30, 150, 88);
    ctx.fillStyle = '#7e241b';
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 34);
    ctx.lineTo(x + 75, y - 22);
    ctx.lineTo(x + 158, y + 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2e6c9';
    ctx.fillRect(x + 60, y + 66, 30, 52);
    ctx.strokeStyle = '#f2e6c9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 60, y + 66);
    ctx.lineTo(x + 90, y + 118);
    ctx.moveTo(x + 90, y + 66);
    ctx.lineTo(x + 60, y + 118);
    ctx.stroke();
    ctx.fillStyle = stage.leaf;
    ctx.beginPath();
    ctx.arc(x + 75, y - 34, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTree(ctx, x, groundY, size, stage) {
    const trunkH = 52 * size;
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(x - 5 * size, groundY - trunkH, 10 * size, trunkH);
    ctx.fillStyle = stage.leaf;
    ctx.beginPath();
    ctx.arc(x, groundY - trunkH - 26 * size, 34 * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d95f2b';
    ctx.beginPath();
    ctx.arc(x - 22 * size, groundY - trunkH - 8 * size, 20 * size, 0, Math.PI * 2);
    ctx.arc(x + 22 * size, groundY - trunkH - 10 * size, 22 * size, 0, Math.PI * 2);
    ctx.fill();
  }
}
