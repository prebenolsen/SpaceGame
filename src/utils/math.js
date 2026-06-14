export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function normalizeVector(x, y) {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function circlesOverlap(ax, ay, ar, bx, by, br) {
  return distance(ax, ay, bx, by) < ar + br;
}

export function pointInCircle(px, py, cx, cy, r) {
  return distance(px, py, cx, cy) <= r;
}

// Returns angle in degrees from a vector
export function vectorToAngleDeg(x, y) {
  return Math.atan2(y, x) * (180 / Math.PI);
}

// Checks if a point is within a cone defined by origin, direction angle (rad), half-angle (rad), and max distance
export function pointInCone(px, py, ox, oy, dirAngle, halfAngle, maxDist) {
  const d = distance(px, py, ox, oy);
  if (d > maxDist) return false;
  const toTarget = Math.atan2(py - oy, px - ox);
  let diff = toTarget - dirAngle;
  // Normalize to [-PI, PI]
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) <= halfAngle;
}
