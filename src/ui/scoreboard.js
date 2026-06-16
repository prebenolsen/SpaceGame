import { fetchTopScores, fetchVersions } from '../utils/supabase.js';

const MEDAL = ['#ffd700', '#c0c0c0', '#cd7f32'];

export class ScoreboardScreen {
  constructor() {
    this._onBack = null;
    this._scores = [];
    this._loading = true;
    this._backRect = null;
    this._touchStart = null;
    this._versions = [];    // sorted newest-first; empty = no version data
    this._versionIndex = 0; // index into _versions (0 = newest)
    this._prevRect = null;  // older version arrow hit area
    this._nextRect = null;  // newer version arrow hit area
  }

  show(onBack) {
    this._onBack = onBack;
    this._scores = [];
    this._loading = true;
    this._touchStart = null;
    this._versions = [];
    this._versionIndex = 0;

    fetchVersions()
      .then(versions => {
        this._versions = versions;
        return fetchTopScores(10, versions[0] ?? null);
      })
      .then(scores => {
        this._scores = scores;
        this._loading = false;
      });
  }

  _loadCurrentVersion() {
    this._loading = true;
    this._scores = [];
    const version = this._versions[this._versionIndex] ?? null;
    fetchTopScores(10, version).then(scores => {
      this._scores = scores;
      this._loading = false;
    });
  }

  handleTouchStart(x, y) {
    this._touchStart = { x, y };
  }

  handleTouchEnd(x, y) {
    if (!this._touchStart) return;
    this._touchStart = null;

    const inside = (r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

    if (inside(this._prevRect) && this._versionIndex < this._versions.length - 1) {
      this._versionIndex++;
      this._loadCurrentVersion();
      return;
    }
    if (inside(this._nextRect) && this._versionIndex > 0) {
      this._versionIndex--;
      this._loadCurrentVersion();
      return;
    }
    if (inside(this._backRect)) {
      if (this._onBack) this._onBack();
    }
  }

  draw(ctx, W, H) {
    ctx.save();

    // Background
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.save();
    ctx.shadowColor = 'rgba(144,202,249,0.6)';
    ctx.shadowBlur = 16;
    ctx.fillText('SCOREBOARD', W / 2, 54);
    ctx.restore();

    // Separator
    ctx.strokeStyle = 'rgba(144,202,249,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.1, 68);
    ctx.lineTo(W * 0.9, 68);
    ctx.stroke();

    // ── Version selector ───────────────────────────────────────────────────────
    const verY = 84;
    const arrowW = 36;
    const arrowH = 24;
    const scale = Math.min(1, W / 480);

    if (this._versions.length > 0) {
      const currentVer = this._versions[this._versionIndex];
      const canPrev = this._versionIndex < this._versions.length - 1;
      const canNext = this._versionIndex > 0;

      // Prev (older) arrow — left side
      const prevX = W / 2 - 70;
      this._prevRect = { x: prevX - arrowW / 2, y: verY - arrowH / 2, w: arrowW, h: arrowH };
      ctx.font = `bold ${Math.round(16 * scale)}px monospace`;
      ctx.fillStyle = canPrev ? '#90caf9' : 'rgba(144,202,249,0.25)';
      ctx.textAlign = 'center';
      ctx.fillText('‹', prevX, verY + 6);

      // Version label
      ctx.font = `${Math.round(13 * scale)}px monospace`;
      ctx.fillStyle = '#ccccdd';
      ctx.fillText(`v${currentVer}`, W / 2, verY + 6);

      // Next (newer) arrow — right side
      const nextX = W / 2 + 70;
      this._nextRect = { x: nextX - arrowW / 2, y: verY - arrowH / 2, w: arrowW, h: arrowH };
      ctx.fillStyle = canNext ? '#90caf9' : 'rgba(144,202,249,0.25)';
      ctx.fillText('›', nextX, verY + 6);
    } else {
      this._prevRect = null;
      this._nextRect = null;
    }

    const tableTop = this._versions.length > 0 ? 108 : 92;
    const rowH = Math.min(34, (H - 160 - tableTop) / 11);

    // Column positions (as fractions of W)
    const col = {
      rank:  W * 0.08,
      name:  W * 0.17,
      score: W * 0.72,
      level: W * 0.90,
    };

    // Table header
    ctx.font = `bold ${11 * scale}px monospace`;
    ctx.fillStyle = '#90caf9';
    ctx.textAlign = 'left';
    ctx.fillText('#', col.rank, tableTop);
    ctx.fillText('NAME', col.name, tableTop);
    ctx.textAlign = 'right';
    ctx.fillText('SCORE', col.score, tableTop);
    ctx.fillText('LEVEL', col.level, tableTop);

    ctx.strokeStyle = 'rgba(144,202,249,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.06, tableTop + 6);
    ctx.lineTo(W * 0.94, tableTop + 6);
    ctx.stroke();

    if (this._loading) {
      ctx.textAlign = 'center';
      ctx.font = `${14 * scale}px monospace`;
      ctx.fillStyle = '#666688';
      ctx.fillText('Loading…', W / 2, H / 2);
    } else if (this._scores.length === 0) {
      ctx.textAlign = 'center';
      ctx.font = `${14 * scale}px monospace`;
      ctx.fillStyle = '#666688';
      ctx.fillText('No scores yet — be the first!', W / 2, H / 2);
    } else {
      this._scores.forEach((s, i) => {
        const y = tableTop + rowH * (i + 1) + 4;
        if (y > H - 90) return;

        const isMedal = i < 3;
        ctx.fillStyle = isMedal ? MEDAL[i] : (i % 2 === 0 ? '#ccccdd' : '#aaaacc');
        ctx.font = `${isMedal ? 'bold ' : ''}${Math.round(13 * scale)}px monospace`;

        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}.`, col.rank, y);

        const maxNameChars = Math.floor((col.score - col.name - 10) / (7.5 * scale));
        const name = (s.name || 'Anonymous').substring(0, Math.max(8, maxNameChars));
        ctx.fillText(name, col.name, y);

        ctx.textAlign = 'right';
        ctx.fillText(Number(s.score).toLocaleString(), col.score, y);
        ctx.fillText(s.highest_level ?? '—', col.level, y);
      });
    }

    // Back button
    const bw = Math.min(160, W * 0.38);
    const bh = 42;
    const bx = W / 2 - bw / 2;
    const by = H - 66;
    this._backRect = { x: bx, y: by, w: bw, h: bh };

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('BACK', W / 2, by + 28);

    ctx.restore();
  }
}
