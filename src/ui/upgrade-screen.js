import { UPGRADE_DEFS } from '../systems/upgrade.js';

const CATEGORY_COLOR = {
  Speed: '#ffd54f',
  Laser: '#e040fb',
  AOE:   '#b39ddb',
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
    const cardW = 140, cardH = 120, gap = 16;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = (screenW - totalW) / 2;
    const centerY = screenH / 2;
    return this._choices.map((_, i) => ({
      x: startX + i * (cardW + gap),
      y: centerY - cardH / 2,
      w: cardW,
      h: cardH,
    }));
  }

  draw(ctx, screenW, screenH) {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 20, 0.88)';
    ctx.fillRect(0, 0, screenW, screenH);

    ctx.textAlign = 'center';
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('UPGRADE', screenW / 2, screenH / 2 - 100);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText('Choose one to enhance', screenW / 2, screenH / 2 - 74);

    const cards = this._getCardRects(screenW, screenH);
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
