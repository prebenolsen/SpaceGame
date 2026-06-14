import { Background } from './background.js';
import { drawPlayer } from './draw-player.js';
import { drawEnemies } from './draw-enemies.js';
import { drawProjectiles } from './draw-projectiles.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._bg = null;
    this._screenW = 0;
    this._screenH = 0;
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this._screenW = w;
    this._screenH = h;
    if (this._bg) {
      this._bg.resize(w, h);
    } else {
      this._bg = new Background(w, h);
    }
  }

  drawGame(state) {
    const { ctx, _screenW: W, _screenH: H } = this;
    const { camera, enemies, player, livesSystem, hud, levelTimer, levelNumber, score, hitFlashTimer } = state;

    this._bg.draw(ctx, W, H, camera);
    drawEnemies(ctx, enemies, camera, W, H);
    drawProjectiles(ctx, player.laser, player.arc, player.laserAim, player.arcAim, camera, W, H);
    drawPlayer(ctx, W, H, livesSystem);

    if (hitFlashTimer > 0) {
      hud.drawHitFlash(ctx, W, H);
    }

    hud.draw(ctx, W, H, livesSystem, levelTimer, levelNumber, score);
  }

  drawOverlay(drawFn) {
    drawFn(this.ctx, this._screenW, this._screenH);
  }

  get screenW() { return this._screenW; }
  get screenH() { return this._screenH; }
}
