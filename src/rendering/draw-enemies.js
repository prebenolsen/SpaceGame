export function drawEnemies(ctx, enemies, camera, screenW, screenH) {
  for (const enemy of enemies) {
    if (!enemy.active) continue;
    const screen = camera.worldToScreen(enemy.wx, enemy.wy, screenW, screenH);
    // Only draw if roughly on screen (with margin)
    const margin = enemy.radius + 20;
    if (
      screen.x < -margin || screen.x > screenW + margin ||
      screen.y < -margin || screen.y > screenH + margin
    ) continue;
    drawEnemy(ctx, enemy, screen.x, screen.y);
  }
}

function drawEnemy(ctx, enemy, sx, sy) {
  ctx.save();
  ctx.translate(sx, sy);

  const flash = enemy.hitFlashing;

  switch (enemy.type) {
    case 'drone': drawDrone(ctx, enemy, flash); break;
    case 'rusher': drawRusher(ctx, enemy, flash); break;
    case 'tank': drawTank(ctx, enemy, flash); break;
    case 'miniboss': drawMiniboss(ctx, enemy, flash); break;
    case 'boss': drawBoss(ctx, enemy, flash); break;
  }

  drawHpBar(ctx, enemy);
  ctx.restore();
}

function drawHpBar(ctx, enemy) {
  if (enemy.hpFraction >= 1) return;
  const w = enemy.radius * 2.2;
  const h = 4;
  const x = -w / 2;
  const y = enemy.radius + 6;
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = enemy.hpFraction > 0.5 ? '#4caf50' : enemy.hpFraction > 0.25 ? '#ff9800' : '#f44336';
  ctx.fillRect(x, y, w * enemy.hpFraction, h);
}

function drawDrone(ctx, enemy, flash) {
  ctx.fillStyle = flash ? '#ffffff' : enemy.color;
  ctx.strokeStyle = '#b3e5fc';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Eye
  ctx.fillStyle = '#0d47a1';
  ctx.beginPath();
  ctx.arc(0, -4, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawRusher(ctx, enemy, flash) {
  ctx.fillStyle = flash ? '#ffffff' : enemy.color;
  ctx.strokeStyle = '#ffccbc';
  ctx.lineWidth = 1.5;
  // Pointy triangle
  ctx.beginPath();
  ctx.moveTo(0, -enemy.radius);
  ctx.lineTo(enemy.radius * 0.8, enemy.radius * 0.7);
  ctx.lineTo(-enemy.radius * 0.8, enemy.radius * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawTank(ctx, enemy, flash) {
  ctx.fillStyle = flash ? '#ffffff' : enemy.color;
  ctx.strokeStyle = '#cfd8dc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
  ctx.fill();
  ctx.stroke();
  // Barrel
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(-4, -enemy.radius - 10, 8, 14);
}

function drawMiniboss(ctx, enemy, flash) {
  ctx.fillStyle = flash ? '#ffffff' : enemy.color;
  ctx.strokeStyle = '#e1bee7';
  ctx.lineWidth = 2;
  // Hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const x = Math.cos(a) * enemy.radius;
    const y = Math.sin(a) * enemy.radius;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBoss(ctx, enemy, flash) {
  const phase = enemy._phase;
  ctx.fillStyle = flash ? '#ffffff' : (phase === 2 ? '#ff1744' : enemy.color);
  ctx.strokeStyle = '#ffcdd2';
  ctx.lineWidth = 3;
  // Star/skull shape — 8-pointed via two squares
  ctx.save();
  ctx.beginPath();
  for (let sq = 0; sq < 2; sq++) {
    ctx.save();
    ctx.rotate((sq * Math.PI) / 4);
    const r = enemy.radius;
    const inner = r * 0.55;
    ctx.rect(-inner, -r, inner * 2, r * 2);
    ctx.restore();
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Phase 2 aura
  if (phase === 2) {
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 150);
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
