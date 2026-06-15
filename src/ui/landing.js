import { VERSION } from '../version.js';

// Entry landing page: two cards — Tutorial (left) and Start Level 1 (right).
export class LandingScreen {
  constructor() {
    this._onTutorial = null;
    this._onStartLevel1 = null;
    this._touchStart = null;
    this._tutorialRect = null;
    this._startRect = null;
  }

  show(onTutorial, onStartLevel1) {
    this._onTutorial = onTutorial;
    this._onStartLevel1 = onStartLevel1;
    this._touchStart = null;
  }

  handleTouchStart(x, y) {
    this._touchStart = { x, y };
  }

  handleTouchEnd(x, y) {
    if (!this._touchStart) return;
    this._touchStart = null;

    const inside = (r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (inside(this._tutorialRect)) {
      if (this._onTutorial) this._onTutorial();
      return;
    }
    if (inside(this._startRect)) {
      if (this._onStartLevel1) this._onStartLevel1();
      return;
    }
  }

  draw(ctx, screenW, screenH) {
    ctx.save();

    // Background
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.textAlign = 'center';

    // Title
    const titleY = screenH * 0.26;
    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SPACE SURVIVOR', screenW / 2, titleY);

    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(170,170,200,0.55)';
    ctx.fillText(`v${VERSION}`, screenW / 2, titleY + 22);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText('Choose how to begin', screenW / 2, titleY + 50);

    // ── Two cards side by side ────────────────────────────────────────────────
    const gap = 16;
    const maxCardW = 220;
    const sideMargin = 20;
    const cardW = Math.min(maxCardW, (screenW - sideMargin * 2 - gap) / 2);
    const cardH = Math.min(cardW * 1.15, 240);
    const cy = screenH * 0.58;
    const totalW = cardW * 2 + gap;
    const leftX = screenW / 2 - totalW / 2;
    const cardY = cy - cardH / 2;

    this._tutorialRect = { x: leftX, y: cardY, w: cardW, h: cardH };
    this._startRect = { x: leftX + cardW + gap, y: cardY, w: cardW, h: cardH };

    this._drawCard(ctx, this._tutorialRect, {
      accent: '#42a5f5',
      icon: '🎓',
      title: 'TUTORIAL',
      lines: ['Learn the', 'controls'],
      tag: 'New players',
    });
    this._drawCard(ctx, this._startRect, {
      accent: '#66bb6a',
      icon: '🚀',
      title: 'START',
      lines: ['Jump into', 'Level 1'],
      tag: 'Skip tutorial',
    });

    ctx.restore();
  }

  _drawCard(ctx, rect, opts) {
    const { x, y, w, h } = rect;
    const cx = x + w / 2;

    // Card body
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = opts.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';

    // Icon
    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(opts.icon, cx, y + 60);

    // Title
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = opts.accent;
    ctx.fillText(opts.title, cx, y + 98);

    // Description lines
    ctx.font = '14px monospace';
    ctx.fillStyle = '#c8c8e0';
    for (let i = 0; i < opts.lines.length; i++) {
      ctx.fillText(opts.lines[i], cx, y + 128 + i * 20);
    }

    // Tag pill near the bottom
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(170,170,200,0.7)';
    ctx.fillText(opts.tag, cx, y + h - 18);
  }
}
