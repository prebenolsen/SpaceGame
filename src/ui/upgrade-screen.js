import { UPGRADE_DEFS } from '../systems/upgrade.js';

const CATEGORY_COLOR = {
  Speed: '#ffd54f',
  Laser: '#e040fb',
  AOE:   '#bCrea9ddb',
};

export class UpgradeScreen {
  constructor() {
    this._choices = [];
    this._onPick = null;
  }

  show(choices, upgrades, onPick) {
    this._choices = choices;
    this._upgrades = upgrades;
    this._onPick = onPick;
  }

  handleTap(x, y, screenW, screenH) {
    const cards = this._getCardRects(screenW, screenH);
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        if (this._onPick) this._onPick(this._choices[i].id);
        return;
      }
    }
  }
  
  _getCardRects(screenW, screenH) {
    const count = this._choices.length;
    if (count === 0) return [];

    const gap = 12;
    const padding = 24;
    const cardH = 110;
    const rowGap = 10;

    // Use 2 rows when there are more than 4 choices
    const cols = count > 4 ? Math.ceil(count / 2) : count;
    const rows = Math.ceil(count / cols);

    const cardW = Math.min(140, (screenW - padding * 2 - gap * (cols - 1)) / cols);
    const totalW = cols * cardW + (cols - 1) * gap;
    const totalH = rows * cardH + (rows - 1) * rowGap;
    const startX = (screenW - totalW) / 2;
    const startY = screenH / 2 - totalH / 2;

    return this._choices.map((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        x: startX + col * (cardW + gap),
        y: startY + row * (cardH + rowGap),
        w: cardW,
        h: cardH,
      };
    });
  }

  draw(ctx, screenW, screenH) {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 20, 0.88)';
    ctx.fillRect(0, 0, screenW, screenH);

    const cards = this._getCardRects(screenW, screenH);
    const topY = cards.length > 0 ? cards[0].y : screenH / 2;

    ctx.textAlign = 'center';
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('UPGRADE', screenW / 2, topY - 36);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText('Choose one to enhance', screenW / 2, topY - 16);
    this._choices.forEach((choice, i) => {
      const rank = this._upgrades[choice.id] ?? 0;
      const def = UPGRADE_DEFS.find((d) => d.id === choice.id);
      const { x, y, w, h } = cards[i];
      const catColor = CATEGORY_COLOR[def?.category] ?? '#aaaacc';

      // Card bg
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();

      // Category color strip at top
      ctx.fillStyle = catColor;
      ctx.beginPath();
      ctx.roundRect(x, y, w, 5, [8, 8, 0, 0]);
      ctx.fill();

      // Category label
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = catColor;
      ctx.textAlign = 'center';
      ctx.fillText((def?.category ?? '').toUpperCase(), x + w / 2, y + 22);

      // Rank pips
      const maxRank = def?.maxRank ?? 10;
      const pipW = Math.min(8, (w - 20) / maxRank - 2);
      for (let p = 0; p < maxRank; p++) {
        ctx.fillStyle = p < rank ? catColor : 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 10 + p * (pipW + 2), y + 34, pipW, 4);
      }

      ctx.textAlign = 'center';
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(choice.label, x + w / 2, y + 58);

      // Description — wrap at ~22 chars
      ctx.font = '11px monospace';
      ctx.fillStyle = '#aaaacc';
      const words = choice.description.split(' ');
      let line = '';
      let lineY = y + 76;
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > w - 16 && line) {
          ctx.fillText(line, x + w / 2, lineY);
          line = word;
          lineY += 14;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x + w / 2, lineY);
    });

    ctx.restore();
  }
}
