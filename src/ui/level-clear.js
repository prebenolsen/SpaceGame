export class LevelClearScreen {
  constructor() {
    this._onContinue = null;
    this._onMenu = null;
    this._continueRect = null;
    this._menuRect = null;
    this._touchStart = null;
  }

  // levelScore  — points earned this level only
  // totalScore  — running cumulative total
  // bestScore   — previous best for this level (or new best if newBest=true)
  // newBest     — true when this run set a new per-level record
  // replayMode  — true when replaying a cleared level
  show(levelNumber, levelScore, totalScore, bestScore, newBest, replayMode, onContinue, onMenu) {
    this._levelNumber = levelNumber;
    this._levelScore = levelScore;
    this._totalScore = totalScore;
    this._bestScore = bestScore;
    this._newBest = newBest;
    this._replayMode = replayMode;
    this._onContinue = onContinue;
    this._onMenu = onMenu;
    this._touchStart = null;
  }

  handleTouchStart(x, y) {
    this._touchStart = { x, y };
  }

  handleTouchEnd(x, y) {
    if (!this._touchStart) return;
    this._touchStart = null;
    const inside = (r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (inside(this._continueRect) && this._onContinue) {
      this._onContinue();
    } else if (inside(this._menuRect) && this._onMenu) {
      this._onMenu();
    }
  }

  draw(ctx, screenW, screenH) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 20, 0, 0.85)';
    ctx.fillRect(0, 0, screenW, screenH);

    const cx = screenW / 2;
    const midY = screenH / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = '#69f0ae';
    ctx.fillText('LEVEL CLEAR', cx, midY - 60);

    if (this._replayMode) {
      ctx.font = '16px monospace';
      ctx.fillStyle = '#ffd54f';
      ctx.fillText(`Level Score: ${this._levelScore}`, cx, midY - 18);

      ctx.font = '13px monospace';
      ctx.fillStyle = this._newBest ? '#69f0ae' : 'rgba(255,255,255,0.45)';
      ctx.fillText(
        this._newBest ? `NEW BEST!` : `Best: ${this._bestScore}`,
        cx, midY + 8,
      );
    } else {
      ctx.font = '16px monospace';
      ctx.fillStyle = '#ffd54f';
      ctx.fillText(`Total Score: ${this._totalScore}`, cx, midY - 18);

      if (this._newBest && this._levelScore > 0) {
        ctx.font = '13px monospace';
        ctx.fillStyle = '#69f0ae';
        ctx.fillText(`NEW BEST: ${this._levelScore}`, cx, midY + 8);
      }
    }

    const btnW = 130;
    const btnH = 44;
    const gap = 16;
    const totalBtnsW = btnW * 2 + gap;
    const btnY = midY + 34;

    this._continueRect = { x: cx - totalBtnsW / 2, y: btnY, w: btnW, h: btnH };
    this._menuRect = { x: cx - totalBtnsW / 2 + btnW + gap, y: btnY, w: btnW, h: btnH };

    this._drawBtn(ctx, this._continueRect, 'CONTINUE', '#69f0ae');
    this._drawBtn(ctx, this._menuRect, 'MENU', '#90caf9');

    ctx.restore();
  }

  _drawBtn(ctx, rect, label, color) {
    ctx.save();
    ctx.fillStyle = 'rgba(10,10,46,0.8)';
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
  }
}
