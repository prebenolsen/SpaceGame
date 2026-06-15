import { Background } from './background.js';
import { drawPlayer } from './draw-player.js';
import { drawEnemies } from './draw-enemies.js';
import { drawProjectiles } from './draw-projectiles.js';

export const GAME_ZOOM = 0.68; // 25 % extra visible area in each direction

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._bg = null;
    this._screenW = 0;
    this._screenH = 0;
    this._dpr = 1;
  }

  resize(w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this._dpr = dpr;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this._screenW = w;
    this._screenH = h;
    if (this._bg) {
      this._bg.resize(w, h);
    } else {
      this._bg = new Background(w, h);
    }
  }

  // Apply scale transform: DPR sharpness + optional zoom centered on screen center
  _applyTransform(zoom) {
    const { ctx, _dpr: dpr, _screenW: W, _screenH: H } = this;
    const cx = W / 2;
    const cy = H / 2;
    ctx.setTransform(
      dpr * zoom, 0,
      0, dpr * zoom,
      dpr * cx * (1 - zoom),
      dpr * cy * (1 - zoom)
    );
  }

  drawGame(state) {
    const { ctx, _screenW: W, _screenH: H } = this;
    const { camera, enemies, player, livesSystem, hud, levelTimer, levelNumber, score, hitFlashTimer, safeTop = 0 } = state;

    // Game world — drawn with zoom-out so player sees more of the area
    ctx.save();
    this._applyTransform(GAME_ZOOM);
    this._bg.draw(ctx, W, H, camera);
    drawEnemies(ctx, enemies, camera, W, H);
    drawProjectiles(ctx, player.laser, player.arc, player.laserAim, player.arcAim, camera, W, H);
    drawPlayer(ctx, W, H, livesSystem);
    ctx.restore();

    // HUD and hit flash at full scale — not zoomed so text stays crisp and flash fills screen
    ctx.save();
    this._applyTransform(1);
    if (hitFlashTimer > 0) {
      hud.drawHitFlash(ctx, W, H);
    }
    hud.draw(ctx, W, H, livesSystem, levelTimer, levelNumber, score, safeTop);
    ctx.restore();
  }

  drawOverlay(drawFn) {
    const { ctx, _screenW: W, _screenH: H } = this;
    ctx.save();
    this._applyTransform(1);
    drawFn(ctx, W, H);
    ctx.restore();
  }

  // For UI elements drawn directly (joysticks, buttons) — DPR scale only, no zoom
  drawUI(drawFn) {
    const { ctx, _screenW: W, _screenH: H } = this;
    ctx.save();
    this._applyTransform(1);
    drawFn(ctx, W, H);
    ctx.restore();
  }

  get screenW() { return this._screenW; }
  get screenH() { return this._screenH; }
  get zoom() { return GAME_ZOOM; }
}
