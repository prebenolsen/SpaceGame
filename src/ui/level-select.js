export class LevelSelectScreen {
  constructor() {
    this._onSelectLevel = null;
    this._onBack = null;
    this._buttons = [];
    this._backRect = null;
    this._touchStart = null;
    this._maxClearedLevel = 0;
    this._nextLevel = 1;
    this._levelHighScores = {};
    this._godmodeMode = false;
  }

  // maxClearedLevel — highest level the player has beaten
  // nextLevel       — the next unplayed campaign level (maxClearedLevel + 1)
  // levelHighScores — { [level]: pts } map of per-level bests
  // godmodeMode     — if true, shows all 21 levels with gold godmode styling
  show(maxClearedLevel, nextLevel, levelHighScores, onSelectLevel, onBack, godmodeMode = false) {
    this._maxClearedLevel = maxClearedLevel;
    this._nextLevel = nextLevel;
    this._levelHighScores = levelHighScores;
    this._onSelectLevel = onSelectLevel;
    this._onBack = onBack;
    this._godmodeMode = godmodeMode;
    this._touchStart = null;
  }

  handleTouchStart(x, y) {
    this._touchStart = { x, y };
  }

  handleTouchEnd(x, y) {
    if (!this._touchStart) return;
    this._touchStart = null;
    const inside = (r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (inside(this._backRect)) {
      if (this._onBack) this._onBack();
      return;
    }
    for (const btn of this._buttons) {
      if (inside(btn.rect)) {
        if (this._onSelectLevel) this._onSelectLevel(btn.level);
        return;
      }
    }
  }

  draw(ctx, screenW, screenH) {
    ctx.save();
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = this._godmodeMode ? '#ff6f00' : '#ffffff';
    ctx.fillText(this._godmodeMode ? 'GODMODE — CHOOSE LEVEL' : 'SELECT LEVEL', screenW / 2, 50);

    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(170,170,200,0.55)';
    ctx.fillText(
      this._godmodeMode
        ? 'Pick a starting level — then choose your upgrades'
        : 'Cleared levels can be replayed',
      screenW / 2, 70,
    );

    const totalLevels = this._godmodeMode ? 21 : this._nextLevel; // show 1..totalLevels
    const cols = Math.min(4, totalLevels);
    const pad = 24;
    const gapX = 10;
    const gapY = 10;
    const btnW = Math.min(110, (screenW - pad * 2 - gapX * (cols - 1)) / cols);
    const btnH = 62;
    const gridW = cols * btnW + (cols - 1) * gapX;
    const gridStartX = (screenW - gridW) / 2;
    const gridStartY = 86;

    this._buttons = [];
    for (let i = 0; i < totalLevels; i++) {
      const level = i + 1;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = gridStartX + col * (btnW + gapX);
      const by = gridStartY + row * (btnH + gapY);
      const rect = { x: bx, y: by, w: btnW, h: btnH };
      this._buttons.push({ level, rect });

      const isNext = !this._godmodeMode && level === this._nextLevel;
      const accent = this._godmodeMode ? '#ff6f00' : isNext ? '#69f0ae' : '#90caf9';
      const best = this._godmodeMode ? null : this._levelHighScores[level];

      ctx.save();
      ctx.fillStyle = this._godmodeMode ? 'rgba(40,10,0,0.7)' : 'rgba(10,10,46,0.7)';
      ctx.beginPath();
      ctx.roundRect(bx, by, btnW, btnH, 8);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = isNext ? 2 : 1.5;
      ctx.shadowColor = accent;
      ctx.shadowBlur = isNext ? 14 : 5;
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold 20px monospace`;
      ctx.fillStyle = accent;
      ctx.fillText(String(level), bx + btnW / 2, by + btnH / 2 - 11);

      ctx.font = '10px monospace';
      if (this._godmodeMode) {
        ctx.fillStyle = 'rgba(255,111,0,0.6)';
        ctx.fillText('SELECT', bx + btnW / 2, by + btnH / 2 + 10);
      } else if (isNext) {
        ctx.fillStyle = '#69f0ae';
        ctx.fillText('NEXT', bx + btnW / 2, by + btnH / 2 + 10);
      } else if (best != null) {
        ctx.fillStyle = '#ffd54f';
        ctx.fillText(`${best} pts`, bx + btnW / 2, by + btnH / 2 + 10);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText('no record', bx + btnW / 2, by + btnH / 2 + 10);
      }
    }

    const rows = Math.ceil(totalLevels / cols);
    const backY = gridStartY + rows * (btnH + gapY) + 4;
    const backW = 100;
    const backH = 36;
    this._backRect = { x: (screenW - backW) / 2, y: backY, w: backW, h: backH };

    ctx.save();
    ctx.fillStyle = 'rgba(10,10,46,0.7)';
    ctx.beginPath();
    ctx.roundRect(this._backRect.x, backY, backW, backH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('BACK', this._backRect.x + backW / 2, backY + backH / 2);

    ctx.restore();
  }
}
