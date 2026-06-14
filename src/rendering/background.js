import { randomRange } from '../utils/math.js';

export class Background {
  constructor(screenW, screenH) {
    this._stars = [];
    this._rebuild(screenW, screenH);
  }

  _rebuild(screenW, screenH) {
    this._stars = [];
    const count = Math.floor((screenW * screenH) / 3000);
    for (let i = 0; i < count; i++) {
      this._stars.push({
        x: randomRange(0, screenW),
        y: randomRange(0, screenH),
        r: randomRange(0.5, 2.2),
        brightness: randomRange(0.3, 1),
        parallax: randomRange(0.05, 0.35), // slower stars = further away
      });
    }
  }

  resize(screenW, screenH) {
    this._rebuild(screenW, screenH);
  }

  draw(ctx, screenW, screenH, camera) {
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, screenW, screenH);

    for (const star of this._stars) {
      // Parallax: offset based on camera position and parallax factor
      const sx = ((star.x - camera.x * star.parallax) % screenW + screenW) % screenW;
      const sy = ((star.y - camera.y * star.parallax) % screenH + screenH) % screenH;

      ctx.globalAlpha = star.brightness;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
