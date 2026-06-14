export function drawPlayer(ctx, screenW, screenH, livesSystem) {
  const cx = screenW / 2;
  const cy = screenH / 2;

  ctx.save();

  // Invulnerability flicker
  if (livesSystem.isInvulnerable) {
    const flicker = Math.sin(Date.now() / 60) > 0;
    if (!flicker) {
      ctx.restore();
      return;
    }
  }

  // Ship body — simple triangle pointing up
  ctx.translate(cx, cy);

  // Glow
  const grd = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
  grd.addColorStop(0, 'rgba(100, 180, 255, 0.4)');
  grd.addColorStop(1, 'rgba(100, 180, 255, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fill();

  // Hull
  ctx.fillStyle = '#90caf9';
  ctx.strokeStyle = '#bbdefb';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(14, 14);
  ctx.lineTo(0, 8);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit
  ctx.fillStyle = '#e3f2fd';
  ctx.beginPath();
  ctx.ellipse(0, -4, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
