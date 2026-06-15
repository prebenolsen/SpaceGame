import { VERSION } from '../version.js';

export class LevelIntroScreen {
  constructor() {
    this._onContinue = null;
    this._onSelectLevel = null;
    this._onReset = null;
    this._touchStart = null;
    this._levelButtons = [];
    this._continueRect = null;
    this._resetRect = null;
    this._resetConfirm = false;
  }

  show(levelNumber, isBoss, onContinue, onSelectLevel = null, onReset = null) {
    this._levelNumber = levelNumber;
    this._isBoss = isBoss;
    this._onContinue = onContinue;
    this._onSelectLevel = onSelectLevel;
    this._onReset = onReset;
    this._touchStart = null;
    this._resetConfirm = false;
  }

  handleTouchStart(x, y) {
    this._touchStart = { x, y };
  }

  handleTouchEnd(x, y) {
    if (!this._touchStart) return;
    this._touchStart = null;

    // Reset button
    if (this._resetRect) {
      const r = this._resetRect;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        if (this._resetConfirm) {
          this._resetConfirm = false;
          if (this._onReset) this._onReset();
        } else {
          this._resetConfirm = true;
        }
        return;
      }
    }

    // Any other tap cancels confirm mode
    this._resetConfirm = false;

    // Check level selector buttons first
    for (const btn of this._levelButtons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        if (this._onSelectLevel) this._onSelectLevel(btn.n);
        return;
      }
    }

    if (this._onContinue) this._onContinue();
  }

  draw(ctx, screenW, screenH) {
    ctx.save();

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 30, 0.85)';
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.textAlign = 'center';

    const cy = screenH / 2;

    // Boss label
    if (this._isBoss) {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#f44336';
      ctx.fillText('⚠  BOSS LEVEL  ⚠', screenW / 2, cy - 70);
    }

    // Version + level number
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(170,170,200,0.55)';
    ctx.fillText(`v${VERSION}`, screenW / 2, cy - 48);

    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`LEVEL ${this._levelNumber}`, screenW / 2, cy - 20);

    // Sub-label
    ctx.font = '16px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText('Survive the wave', screenW / 2, cy + 20);

    // Continue button
    const bw = 200, bh = 50;
    const bx = screenW / 2 - bw / 2;
    const by = cy + 55;
    this._continueRect = { x: bx, y: by, w: bw, h: bh };

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CONTINUE', screenW / 2, by + 32);

    // ── Reset button ─────────────────────────────────────────────────────────
    if (this._onReset) {
      const rw = 160, rh = 36;
      const rx = screenW / 2 - rw / 2;
      const ry = by + bh + 18;
      this._resetRect = { x: rx, y: ry, w: rw, h: rh };

      ctx.fillStyle = this._resetConfirm ? 'rgba(244,67,54,0.5)' : 'rgba(244,67,54,0.18)';
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 6);
      ctx.fill();
      ctx.strokeStyle = this._resetConfirm ? '#f44336' : 'rgba(244,67,54,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = this._resetConfirm ? '#ffffff' : '#ef9a9a';
      ctx.fillText(this._resetConfirm ? 'TAP AGAIN TO CONFIRM' : 'RESET EVERYTHING', screenW / 2, ry + 24);
    }

    // ── Level selector (dev/testing) ──────────────────────────────────────────
    if (this._onSelectLevel) {
      const TOTAL = 10;
      const btnW = 38, btnH = 32, gap = 5;
      const rowW = TOTAL * btnW + (TOTAL - 1) * gap;
      let lx = screenW / 2 - rowW / 2;
      const ly = by + bh + (this._onReset ? 70 : 22);

      ctx.font = '11px monospace';
      ctx.fillStyle = 'rgba(170,170,200,0.7)';
      ctx.fillText('jump to level', screenW / 2, ly - 8);

      this._levelButtons = [];
      for (let i = 1; i <= TOTAL; i++) {
        const isActive = i === this._levelNumber;
        ctx.fillStyle = isActive ? 'rgba(100,180,255,0.5)' : 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(lx, ly, btnW, btnH, 5);
        ctx.fill();
        ctx.strokeStyle = isActive ? 'rgba(100,180,255,0.9)' : 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = `bold 13px monospace`;
        ctx.fillStyle = isActive ? '#ffffff' : '#aaaacc';
        ctx.fillText(String(i), lx + btnW / 2, ly + btnH / 2 + 5);

        this._levelButtons.push({ n: i, x: lx, y: ly, w: btnW, h: btnH });
        lx += btnW + gap;
      }
    }

    ctx.restore();
  }
}
