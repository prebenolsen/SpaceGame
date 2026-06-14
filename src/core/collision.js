import { circlesOverlap, pointInCone } from '../utils/math.js';

// Check projectile vs enemies, returns list of hit enemies
export function checkLaserHits(laser, enemies) {
  if (!laser.active || !laser.justFired) return [];
  const hits = [];
  for (const enemy of enemies) {
    if (!enemy.active) continue;
    if (laserHitsEnemy(laser, enemy)) {
      hits.push(enemy);
    }
  }
  // Laser only hits the closest enemy in its path
  if (hits.length === 0) return [];
  hits.sort((a, b) => {
    const da = Math.hypot(a.wx - laser.ox, a.wy - laser.oy);
    const db = Math.hypot(b.wx - laser.ox, b.wy - laser.oy);
    return da - db;
  });
  return [hits[0]];
}

function laserHitsEnemy(laser, enemy) {
  // Laser is a line segment from (ox,oy) to (tx,ty) in world space.
  // Include the beam's half-width so the hitbox matches the drawn lineWidth.
  return distPointToSegment(enemy.wx, enemy.wy, laser.ox, laser.oy, laser.tx, laser.ty)
    < enemy.radius + laser.width / 2;
}

function distPointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Check ARC vs enemies — cone collision
export function checkArcHits(arc, enemies) {
  if (!arc.active || !arc.justFired) return [];
  const hits = [];
  for (const enemy of enemies) {
    if (!enemy.active) continue;
    if (pointInCone(enemy.wx, enemy.wy, arc.ox, arc.oy, arc.angle, arc.halfAngle, arc.range)) {
      hits.push(enemy);
    }
  }
  return hits;
}

// Check enemy vs player (player is always at world 0,0 — camera position)
export function checkEnemyPlayerHit(enemy, camera) {
  return circlesOverlap(enemy.wx, enemy.wy, enemy.radius, camera.x, camera.y, 20);
}
