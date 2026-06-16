import { VERSION } from '../version.js';

const TAGLINE =
  'You are the ship at the center of the void. Steer, blast, and outlast relentless waves. How long can you survive?';

// Geometric roster used as the brand's icon set (mirrors src/rendering/*).
const ROSTER = ['drone', 'rusher', 'tank', 'miniboss', 'boss'];

// Entry landing page: hero + two cards (Tutorial / Start) + enemy roster legend.
export class LandingScreen {
  constructor() {
    this._onTutorial = null;
    this._onCampaign = null;
    this._maxClearedLevel = 0;
    this._touchStart = null;
    this._tutorialRect = null;
    this._startRect = null;
    this._stars = null; // cached starfield, generated once per size
    this._starsSize = null;
  }

  show(onTutorial, onCampaign, maxClearedLevel) {
    this._onTutorial = onTutorial;
    this._onCampaign = onCampaign;
    this._maxClearedLevel = maxClearedLevel ?? 0;
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
      if (this._onCampaign) this._onCampaign();
      return;
    }
  }

  draw(ctx, screenW, screenH) {
    ctx.save();

    // ── Background: the void + a layered, parallax-feel starfield ─────────────
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, screenW, screenH);
    this._drawStarfield(ctx, screenW, screenH);

    ctx.textAlign = 'center';

    // Version, top-right (matches the design's faint caption).
    ctx.textBaseline = 'alphabetic';
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(170,170,200,0.55)';
    ctx.textAlign = 'right';
    ctx.fillText(`v${VERSION}`, screenW - 20, 28);
    ctx.textAlign = 'center';

    // Scale the whole composition down on small screens, then shrink further
    // if it would overflow the available height (landscape is short).
    const baseScale = Math.min(1, screenW / 720, screenH / 380);

    // Height of the stacked layout for a given scale + tagline line count.
    const layoutH = (s, lineCount) =>
      56 * s + 14 * s + 40 * s + 14 * s + lineCount * 21 * s + // hero block
      30 * s + 188 * s + 30 * s + 26 * s;                     // gaps + cards + legend

    ctx.font = `${14 * baseScale}px monospace`;
    let taglineLines = this._wrap(ctx, TAGLINE, Math.min(460 * baseScale, screenW - 48));
    const scale = baseScale * Math.min(1, (screenH - 24) / layoutH(baseScale, taglineLines.length));

    // ── Measure the stacked layout so we can vertically center it ─────────────
    const shipSize = 56 * scale;
    const titleSize = 40 * scale;
    const cardH = 188 * scale;
    const legendH = 26 * scale;

    ctx.font = `${14 * scale}px monospace`;
    taglineLines = this._wrap(ctx, TAGLINE, Math.min(460 * scale, screenW - 48));
    const taglineLineH = 21 * scale;
    const taglineBlockH = taglineLines.length * taglineLineH;

    const gapHeroCards = 30 * scale;
    const gapCardsLegend = 30 * scale;
    const heroH = shipSize + 14 * scale + titleSize + 14 * scale + taglineBlockH;
    const totalH = heroH + gapHeroCards + cardH + gapCardsLegend + legendH;

    let y = Math.max(8, (screenH - totalH) / 2);
    const cx = screenW / 2;

    // ── Hero: glowing ship glyph ──────────────────────────────────────────────
    this._drawGlyph(ctx, 'ship', cx, y + shipSize / 2, shipSize, true);
    y += shipSize + 14 * scale;

    // Title with the ship-blue glow.
    ctx.textBaseline = 'alphabetic';
    ctx.font = `bold ${titleSize}px monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.save();
    ctx.shadowColor = 'rgba(144,202,249,0.7)';
    ctx.shadowBlur = 18 * scale;
    this._tracked(ctx, 'SPACE SURVIVOR', cx, y + titleSize * 0.82, 0.08);
    ctx.restore();
    y += titleSize + 14 * scale;

    // Tagline.
    ctx.font = `${14 * scale}px monospace`;
    ctx.fillStyle = '#aaaacc';
    for (let i = 0; i < taglineLines.length; i++) {
      ctx.fillText(taglineLines[i], cx, y + (i + 0.8) * taglineLineH);
    }
    y += taglineBlockH + gapHeroCards;

    // ── Choice cards ──────────────────────────────────────────────────────────
    const gap = 18 * scale;
    const cardW = Math.min(230 * scale, (screenW - 48 - gap) / 2);
    const totalCardsW = cardW * 2 + gap;
    const leftX = cx - totalCardsW / 2;

    this._tutorialRect = { x: leftX, y, w: cardW, h: cardH };
    this._startRect = { x: leftX + cardW + gap, y, w: cardW, h: cardH };

    this._drawCard(ctx, this._tutorialRect, scale, {
      accent: '#42a5f5', // laser blue
      glyph: 'drone',
      title: 'TUTORIAL',
      desc: 'Learn the controls at your own pace',
      badge: { text: 'New players', color: '#aaaacc', solid: false },
    });
    const hasProgress = this._maxClearedLevel > 0;
    this._drawCard(ctx, this._startRect, scale, {
      accent: '#69f0ae',
      glyph: 'ship',
      glyphGlow: true,
      title: hasProgress ? 'CAMPAIGN' : 'START',
      desc: hasProgress
        ? `${this._maxClearedLevel} level${this._maxClearedLevel > 1 ? 's' : ''} cleared — replay or push on`
        : 'Jump straight into Level 1',
      badge: hasProgress
        ? { text: `Level ${this._maxClearedLevel + 1} next`, color: '#69f0ae', solid: true }
        : { text: 'Skip tutorial', color: '#69f0ae', solid: true },
    });
    y += cardH + gapCardsLegend;

    // ── Roster legend: "what hunts you" ───────────────────────────────────────
    this._drawLegend(ctx, cx, y + legendH / 2, scale);

    ctx.restore();
  }

  // ── Card ────────────────────────────────────────────────────────────────────
  _drawCard(ctx, rect, scale, opts) {
    const { x, y, w, h } = rect;
    const cx = x + w / 2;

    // Translucent deep-blue fill + solid accent border with a soft glow.
    ctx.save();
    ctx.fillStyle = 'rgba(10,10,46,0.55)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12 * scale);
    ctx.fill();
    ctx.shadowColor = opts.accent;
    ctx.shadowBlur = 14 * scale;
    ctx.strokeStyle = opts.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Glyph icon
    const glyphSize = 40 * scale;
    this._drawGlyph(ctx, opts.glyph, cx, y + 22 * scale + glyphSize / 2, glyphSize, !!opts.glyphGlow);

    // Title (display)
    ctx.font = `bold ${22 * scale}px monospace`;
    ctx.fillStyle = '#ffffff';
    this._tracked(ctx, opts.title, cx, y + 92 * scale, 0.04);

    // Description (wrapped)
    ctx.font = `${13 * scale}px monospace`;
    ctx.fillStyle = '#c8c8e0';
    const descLines = this._wrap(ctx, opts.desc, w - 28 * scale);
    const descLineH = 17 * scale;
    for (let i = 0; i < descLines.length; i++) {
      ctx.fillText(descLines[i], cx, y + 116 * scale + i * descLineH);
    }

    // Badge pill near the bottom
    this._drawBadge(ctx, cx, y + h - 24 * scale, scale, opts.badge);
  }

  // ── Pill badge ────────────────────────────────────────────────────────────
  _drawBadge(ctx, cx, cy, scale, badge) {
    ctx.font = `bold ${10 * scale}px monospace`;
    const label = badge.text.toUpperCase();
    const tracking = 0.06;
    const textW = this._trackedWidth(ctx, label, tracking);
    const padX = 11 * scale;
    const w = textW + padX * 2;
    const h = 20 * scale;
    const x = cx - w / 2;
    const y = cy - h / 2;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    if (badge.solid) {
      ctx.fillStyle = badge.color;
      ctx.fill();
    } else {
      ctx.fillStyle = this._rgba(badge.color, 0.16);
      ctx.fill();
      ctx.strokeStyle = this._rgba(badge.color, 0.45);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = badge.solid ? '#05050f' : badge.color;
    ctx.textBaseline = 'middle';
    this._tracked(ctx, label, cx, cy + 0.5 * scale, tracking);
    ctx.textBaseline = 'alphabetic';
  }

  // ── Roster legend ───────────────────────────────────────────────────────────
  _drawLegend(ctx, cx, cy, scale) {
    const glyphSize = 22 * scale;
    const gap = 16 * scale;
    ctx.font = `${10 * scale}px monospace`;
    const label = 'WHAT HUNTS YOU';
    const labelW = this._trackedWidth(ctx, label, 0.14);
    const totalW = labelW + gap + ROSTER.length * glyphSize + (ROSTER.length - 1) * gap;

    ctx.save();
    ctx.globalAlpha = 0.85;
    let x = cx - totalW / 2;

    ctx.fillStyle = 'rgba(170,170,200,0.55)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    this._trackedLeft(ctx, label, x, cy, 0.14);
    x += labelW + gap;

    for (const type of ROSTER) {
      this._drawGlyph(ctx, type, x + glyphSize / 2, cy, glyphSize, false);
      x += glyphSize + gap;
    }
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
  }

  // ── Geometric glyphs (mirror src/rendering/draw-player & draw-enemies) ───────
  _drawGlyph(ctx, type, cx, cy, size, glow) {
    const r = size / 2;
    ctx.save();
    ctx.translate(cx, cy);
    if (glow) {
      const glowColor = {
        ship: 'rgba(100,180,255,0.6)',
        drone: '#4fc3f7',
        rusher: '#ff7043',
        tank: '#78909c',
        miniboss: '#ab47bc',
        boss: '#f44336',
      }[type] || '#90caf9';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = size * 0.35;
    }

    switch (type) {
      case 'ship': {
        const s = size / 34;
        ctx.fillStyle = '#90caf9';
        ctx.strokeStyle = '#bbdefb';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -18 * s);
        ctx.lineTo(14 * s, 14 * s);
        ctx.lineTo(0, 8 * s);
        ctx.lineTo(-14 * s, 14 * s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#e3f2fd';
        ctx.beginPath();
        ctx.ellipse(0, -4 * s, 5 * s, 8 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'drone': {
        ctx.fillStyle = '#4fc3f7';
        ctx.strokeStyle = '#b3e5fc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0d47a1';
        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'rusher': {
        ctx.fillStyle = '#ff7043';
        ctx.strokeStyle = '#ffccbc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.8, r * 0.7);
        ctx.lineTo(-r * 0.8, r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'tank': {
        ctx.fillStyle = '#78909c';
        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-r, -r, r * 2, r * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#546e7a';
        const bw = r * 0.3;
        const bh = r * 0.5;
        ctx.fillRect(-bw / 2, -r - bh * 0.6, bw, bh);
        break;
      }
      case 'miniboss': {
        ctx.fillStyle = '#ab47bc';
        ctx.strokeStyle = '#e1bee7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
          const x = Math.cos(a) * r;
          const yy = Math.sin(a) * r;
          i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'boss': {
        ctx.fillStyle = '#f44336';
        ctx.strokeStyle = '#ffcdd2';
        ctx.lineWidth = 2;
        const inner = r * 0.55;
        ctx.beginPath();
        for (let sq = 0; sq < 2; sq++) {
          ctx.save();
          ctx.rotate((sq * Math.PI) / 4);
          ctx.rect(-inner, -r, inner * 2, r * 2);
          ctx.restore();
        }
        ctx.fill();
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }

  // ── Starfield ─────────────────────────────────────────────────────────────
  _drawStarfield(ctx, screenW, screenH) {
    const sizeKey = `${screenW}x${screenH}`;
    if (this._starsSize !== sizeKey) {
      this._starsSize = sizeKey;
      // ~1 star per 3000px², a few parallax brightness depths.
      const count = Math.min(420, Math.floor((screenW * screenH) / 3000));
      const stars = [];
      // Deterministic PRNG so the field is stable across frames.
      let seed = 1337;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      for (let i = 0; i < count; i++) {
        stars.push({
          x: rand() * screenW,
          y: rand() * screenH,
          r: 0.5 + rand() * 1.7,
          a: 0.3 + rand() * 0.7,
        });
      }
      this._stars = stars;
    }
    ctx.save();
    ctx.fillStyle = '#ffffff';
    for (const s of this._stars) {
      ctx.globalAlpha = s.a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Text helpers ────────────────────────────────────────────────────────────
  _wrap(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // Pixel size of the current font (handles "bold 40px monospace").
  _fontPx(ctx) {
    const m = /(\d+(?:\.\d+)?)px/.exec(ctx.font);
    return m ? parseFloat(m[1]) : 14;
  }

  // Draw centered text with letter-spacing as a fraction of font size.
  _tracked(ctx, text, cx, y, tracking) {
    const space = this._fontPx(ctx) * tracking;
    const total = this._trackedWidth(ctx, text, tracking);
    this._trackedLeftRaw(ctx, text, cx - total / 2, y, space);
  }

  _trackedLeft(ctx, text, x, y, tracking) {
    this._trackedLeftRaw(ctx, text, x, y, this._fontPx(ctx) * tracking);
  }

  _trackedLeftRaw(ctx, text, x, y, space) {
    const prevAlign = ctx.textAlign;
    ctx.textAlign = 'left';
    let cursor = x;
    for (const ch of text) {
      ctx.fillText(ch, cursor, y);
      cursor += ctx.measureText(ch).width + space;
    }
    ctx.textAlign = prevAlign;
  }

  _trackedWidth(ctx, text, tracking) {
    const space = this._fontPx(ctx) * tracking;
    let w = 0;
    for (const ch of text) w += ctx.measureText(ch).width + space;
    return w - space; // no trailing space
  }

  _rgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
