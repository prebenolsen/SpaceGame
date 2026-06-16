import { submitScore } from '../utils/supabase.js';

export class GameOverScreen {
  constructor() {
    this._onRestart = null;
    this._onScoreboard = null;
    this._score = 0;
    this._highestLevel = 0;
    this._state = 'entry';   // 'entry' | 'submitting' | 'done'
    this._submitMsg = '';
    this._restartRect = null;
    this._scoreboardRect = null;
    this._submitRect = null;
    this._skipRect = null;
    this._touchStart = null;

    this._input = this._createInput();
  }

  _createInput() {
    const el = document.createElement('input');
    el.type = 'text';
    el.maxLength = 20;
    el.placeholder = 'Your name';
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('autocapitalize', 'words');
    Object.assign(el.style, {
      display: 'none',
      position: 'fixed',
      zIndex: '1000',
      background: 'rgba(10,10,46,0.97)',
      color: '#ffffff',
      border: '2px solid #90caf9',
      borderRadius: '8px',
      fontFamily: 'monospace',
      padding: '0 12px',
      outline: 'none',
      textAlign: 'center',
      boxSizing: 'border-box',
    });
    document.body.appendChild(el);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._doSubmit();
    });
    return el;
  }

  show(score, highestLevel, onRestart, onScoreboard) {
    this._score = score;
    this._highestLevel = highestLevel;
    this._onRestart = onRestart;
    this._onScoreboard = onScoreboard;
    this._state = 'entry';
    this._submitMsg = '';
    this._touchStart = null;
    this._input.value = '';
    this._input.style.display = 'block';
    setTimeout(() => this._input.focus(), 150);
  }

  _hideInput() {
    this._input.style.display = 'none';
  }

  async _doSubmit() {
    const name = (this._input.value.trim() || 'Anonymous').substring(0, 20);
    this._hideInput();
    this._state = 'submitting';
    try {
      await submitScore(name, this._score, this._highestLevel);
      this._submitMsg = 'Score saved!';
    } catch {
      this._submitMsg = 'Could not save score';
    }
    this._state = 'done';
  }

  _doSkip() {
    this._hideInput();
    this._state = 'done';
    this._submitMsg = '';
  }

  handleTouchStart(x, y) {
    this._touchStart = { x, y };
  }

  handleTouchEnd(x, y) {
    if (!this._touchStart) return;
    this._touchStart = null;
    const inside = (r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (this._state === 'entry') {
      if (inside(this._submitRect)) { this._doSubmit(); return; }
      if (inside(this._skipRect)) { this._doSkip(); return; }
    }
    if (this._state === 'done') {
      if (inside(this._restartRect) && this._onRestart) { this._onRestart(); return; }
      if (inside(this._scoreboardRect) && this._onScoreboard) { this._onScoreboard(); return; }
    }
  }

  draw(ctx, screenW, screenH) {
    const cx = screenW / 2;
    const cy = screenH / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(20,0,0,0.92)';
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.textAlign = 'center';

    // Title
    ctx.font = 'bold 38px monospace';
    ctx.fillStyle = '#f44336';
    ctx.save();
    ctx.shadowColor = 'rgba(244,67,54,0.6)';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', cx, cy - 90);
    ctx.restore();

    // Score
    ctx.font = '17px monospace';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText(`Final Score: ${this._score}`, cx, cy - 54);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText(`Highest Level: ${this._highestLevel}`, cx, cy - 30);

    if (this._state === 'entry') {
      ctx.font = '14px monospace';
      ctx.fillStyle = '#ccccdd';
      ctx.fillText('Enter your name:', cx, cy + 8);

      // Input background drawn on canvas (DOM input overlaps this)
      const iw = Math.min(280, screenW - 80);
      const ih = 42;
      const ix = cx - iw / 2;
      const iy = cy + 16;
      ctx.fillStyle = 'rgba(10,10,46,0.5)';
      ctx.beginPath();
      ctx.roundRect(ix, iy, iw, ih, 8);
      ctx.fill();
      ctx.strokeStyle = '#90caf9';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Position the DOM input to overlap the canvas rectangle
      Object.assign(this._input.style, {
        left:     `${ix}px`,
        top:      `${iy}px`,
        width:    `${iw}px`,
        height:   `${ih}px`,
        fontSize: `${Math.min(18, ih * 0.42)}px`,
        lineHeight: `${ih}px`,
      });

      // Submit button
      const bw = Math.min(200, screenW * 0.5);
      const bh = 42;
      const by1 = cy + 72;
      this._submitRect = { x: cx - bw / 2, y: by1, w: bw, h: bh };
      ctx.fillStyle = '#1565c0';
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, by1, bw, bh, 8);
      ctx.fill();
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('SUBMIT SCORE', cx, by1 + 28);

      // Skip link
      const sy = cy + 132;
      this._skipRect = { x: cx - 60, y: sy - 16, w: 120, h: 28 };
      ctx.font = '13px monospace';
      ctx.fillStyle = 'rgba(180,180,200,0.55)';
      ctx.fillText('Skip', cx, sy);

    } else if (this._state === 'submitting') {
      ctx.font = '15px monospace';
      ctx.fillStyle = '#aaaacc';
      ctx.fillText('Saving…', cx, cy + 30);

    } else {
      // done
      if (this._submitMsg) {
        ctx.font = '14px monospace';
        ctx.fillStyle = '#69f0ae';
        ctx.fillText(this._submitMsg, cx, cy + 10);
      }

      const bw = Math.min(200, screenW * 0.5);
      const bh = 46;

      // Play Again
      const by1 = cy + (this._submitMsg ? 32 : 20);
      this._restartRect = { x: cx - bw / 2, y: by1, w: bw, h: bh };
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, by1, bw, bh, 8);
      ctx.fill();
      ctx.font = 'bold 17px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PLAY AGAIN', cx, by1 + 30);

      // Scoreboard
      const by2 = by1 + bh + 14;
      this._scoreboardRect = { x: cx - bw / 2, y: by2, w: bw, h: bh };
      ctx.fillStyle = 'rgba(100,160,255,0.14)';
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, by2, bw, bh, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,160,255,0.38)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#90caf9';
      ctx.fillText('SCOREBOARD', cx, by2 + 29);
    }

    ctx.restore();
  }
}
