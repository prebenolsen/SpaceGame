export function drawProjectiles(ctx, laser, arc, laserAim, arcAim, camera, screenW, screenH) {
  if (laserAim.active && !laser.active) {
    drawLaserAim(ctx, laserAim, camera, screenW, screenH);
  }
  if (laser.active) {
    drawLaser(ctx, laser, camera, screenW, screenH);
  }

  if (arcAim.active && !arc.active) {
    drawArcAim(ctx, arcAim, camera, screenW, screenH);
  }
  if (arc.active) {
    drawArc(ctx, arc, camera, screenW, screenH);
  }
}

function drawLaserAim(ctx, aim, camera, screenW, screenH) {
  const origin = camera.worldToScreen(aim.ox, aim.oy, screenW, screenH);
  const tx = aim.ox + Math.cos(aim.angle) * aim.range;
  const ty = aim.oy + Math.sin(aim.angle) * aim.range;
  const target = camera.worldToScreen(tx, ty, screenW, screenH);

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = aim.width;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.restore();
}

function drawLaser(ctx, laser, camera, screenW, screenH) {
  const origin = camera.worldToScreen(laser.ox, laser.oy, screenW, screenH);
  const target = camera.worldToScreen(laser.tx, laser.ty, screenW, screenH);

  ctx.save();
  ctx.globalAlpha = laser.alpha;
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = laser.width;
  ctx.shadowColor = '#42a5f5';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.restore();
}

function drawArcAim(ctx, aim, camera, screenW, screenH) {
  const origin = camera.worldToScreen(aim.ox, aim.oy, screenW, screenH);
  const startAngle = aim.angle - aim.halfAngle;
  const endAngle   = aim.angle + aim.halfAngle;

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = '#ce93d8';
  ctx.fillStyle = 'rgba(206, 147, 216, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.arc(origin.x, origin.y, aim.range, startAngle, endAngle);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawArc(ctx, arc, camera, screenW, screenH) {
  const origin = camera.worldToScreen(arc.ox, arc.oy, screenW, screenH);

  ctx.save();
  ctx.globalAlpha = arc.alpha * 0.8;
  ctx.strokeStyle = '#ce93d8';
  ctx.fillStyle = 'rgba(206, 147, 216, 0.18)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ce93d8';
  ctx.shadowBlur = 16;

  const startAngle = arc.angle - arc.halfAngle;
  const endAngle   = arc.angle + arc.halfAngle;

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.arc(origin.x, origin.y, arc.range, startAngle, endAngle);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
