export class GameOverScreen {
  constructor() {
    this._onRestart = null;
  }

  show(totalScore, onRestart) {
    this._totalScore = totalScore;
    this._onRestart = onRestart;
  }

  handleTap() {
    if (this._onRestart) this._onRestart();
  }

  draw(ctx, screenW, screenH) {
    ctx.save();
    ctx.fillStyle = 'rgba(20, 0, 0, 0.90)';
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.textAlign = 'center';

    ctx.font = 'bold 38px monospace';
    ctx.fillStyle = '#f44336';
    ctx.fillText('GAME OVER', screenW / 2, screenH / 2 - 30);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText(`Final Score: ${this._totalScore}`, screenW / 2, screenH / 2 + 10);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    const bw = 200, bh = 50;
    const bx = screenW / 2 - bw / 2;
    const by = screenH / 2 + 45;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PLAY AGAIN', screenW / 2, by + 32);
    ctx.restore();
  }
}
