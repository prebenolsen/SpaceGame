export class HUD {
  constructor() {}

  draw(ctx, screenW, screenH, livesSystem, levelTimer, levelNumber, score, safeTop = 0, hudTitle = null) {
    this._drawHpBar(ctx, livesSystem, safeTop);
    this._drawLives(ctx, livesSystem, safeTop);
    this._drawTimer(ctx, screenW, levelTimer, levelNumber, safeTop, hudTitle);
    this._drawScore(ctx, screenW, score, safeTop);
  }

  _drawHpBar(ctx, lives, safeTop = 0) {
    const x = 16, y = 16 + safeTop, w = 120, h = 12;
    const hitsMax = lives.hitsPerLife;
    const hitsLeft = hitsMax - lives.hits;
    const fraction = hitsLeft / hitsMax;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, w, h);

    // Fill
    const barColor = fraction > 0.5 ? '#4caf50' : fraction > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillStyle = barColor;
    ctx.fillRect(x, y, w * fraction, h);

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('HP', x + w + 6, y + h - 1);
    ctx.restore();
  }

  _drawLives(ctx, lives, safeTop = 0) {
    ctx.save();
    ctx.font = '13px monospace';
    ctx.fillStyle = '#fff';
    let hearts = '';
    for (let i = 0; i < lives.maxLives; i++) {
      hearts += i < lives.lives ? '♥ ' : '♡ ';
    }
    ctx.fillText(hearts.trim(), 16, 46 + safeTop);
    ctx.restore();
  }

  _drawTimer(ctx, screenW, levelTimer, levelNumber, safeTop = 0, hudTitle = null) {
    const remaining = levelTimer.remaining;
    const isBoss = !hudTitle && remaining === Infinity;
    let line;
    if (hudTitle) {
      line = remaining === Infinity ? hudTitle : `${hudTitle}  ${Math.ceil(remaining)}s`;
    } else {
      line = isBoss ? `BOSS  LVL ${levelNumber}` : `LVL ${levelNumber}  ${Math.ceil(remaining)}s`;
    }
    ctx.save();
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    const bw = Math.max(120, ctx.measureText(line).width + 24);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(screenW / 2 - bw / 2, 10 + safeTop, bw, 30);
    ctx.fillStyle = isBoss ? '#f44336' : (remaining <= 10 && remaining !== Infinity ? '#ff5252' : '#fff');
    ctx.fillText(line, screenW / 2, 30 + safeTop);
    ctx.restore();
  }

  _drawScore(ctx, screenW, score, safeTop = 0) {
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = '13px monospace';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText(`${score}`, screenW - 16, 28 + safeTop);
    ctx.restore();
  }

  // Flashing "HIT" indicator when player takes damage
  drawHitFlash(ctx, screenW, screenH) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.18)';
    ctx.fillRect(0, 0, screenW, screenH);
    ctx.restore();
  }

  // Arrow around the player pointing toward the boss when it's off-screen
  drawBossArrow(ctx, screenW, screenH, boss, camera, gameZoom) {
    if (!boss || !boss.active) return;

    const cx = screenW / 2;
    const cy = screenH / 2;
    const screen = camera.worldToScreen(boss.wx, boss.wy, screenW, screenH);

    // Visible half-extents in unzoomed screen coordinates (gameZoom shrinks scale → bigger world visible)
    const halfVW = cx / gameZoom;
    const halfVH = cy / gameZoom;

    const dx = screen.x - cx;
    const dy = screen.y - cy;

    // Only show arrow when boss is outside 85% of the visible area
    if (Math.abs(dx) <= halfVW * 0.85 && Math.abs(dy) <= halfVH * 0.85) return;

    const angle = Math.atan2(dy, dx);
    const orbitR = 72;
    const ax = cx + Math.cos(angle) * orbitR;
    const ay = cy + Math.sin(angle) * orbitR;

    const size = 14;
    const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 280);

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.globalAlpha = pulse;

    // Arrow triangle pointing toward boss
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.55, -size * 0.55);
    ctx.lineTo(-size * 0.55, size * 0.55);
    ctx.closePath();
    ctx.fillStyle = '#f44336';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}
