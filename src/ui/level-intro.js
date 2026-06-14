export class LevelIntroScreen {
  constructor() {
    this._onContinue = null;
    this._touchActive = false;
  }

  show(levelNumber, isBoss, onContinue) {
    this._levelNumber = levelNumber;
    this._isBoss = isBoss;
    this._onContinue = onContinue;
    this._touchActive = false;
  }

  handleTouchStart() {
    this._touchActive = true;
  }

  handleTouchEnd() {
    if (this._touchActive && this._onContinue) {
      this._touchActive = false;
      this._onContinue();
    }
  }

  draw(ctx, screenW, screenH) {
    ctx.save();

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 30, 0.85)';
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.textAlign = 'center';

    // Boss label
    if (this._isBoss) {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#f44336';
      ctx.fillText('⚠  BOSS LEVEL  ⚠', screenW / 2, screenH / 2 - 70);
    }

    // Level number
    ctx.font = `bold 40px monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`LEVEL ${this._levelNumber}`, screenW / 2, screenH / 2 - 20);

    // Sub-label
    ctx.font = '16px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText('Survive 60 seconds', screenW / 2, screenH / 2 + 20);

    // Continue button
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    const bw = 200, bh = 50;
    const bx = screenW / 2 - bw / 2;
    const by = screenH / 2 + 55;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CONTINUE', screenW / 2, by + 32);

    ctx.restore();
  }
}
