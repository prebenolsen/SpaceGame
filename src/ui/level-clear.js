export class LevelClearScreen {
  constructor() {
    this._onContinue = null;
  }

  show(levelNumber, score, onContinue) {
    this._levelNumber = levelNumber;
    this._score = score;
    this._onContinue = onContinue;
  }

  handleTap() {
    if (this._onContinue) this._onContinue();
  }

  draw(ctx, screenW, screenH) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 20, 0, 0.85)';
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.textAlign = 'center';
    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = '#69f0ae';
    ctx.fillText('LEVEL CLEAR', screenW / 2, screenH / 2 - 30);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText(`Score: ${this._score}`, screenW / 2, screenH / 2 + 10);

    // Continue tap hint
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Tap to continue', screenW / 2, screenH / 2 + 50);
    ctx.restore();
  }
}
