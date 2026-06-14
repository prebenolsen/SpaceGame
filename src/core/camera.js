// The camera tracks the world offset.
// Player is always at screen center; moving shifts the world.
export class Camera {
  constructor() {
    this.x = 0; // world offset x (world coords = screen coords + camera)
    this.y = 0;
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  // Convert world position to screen position
  worldToScreen(wx, wy, screenW, screenH) {
    return {
      x: wx - this.x + screenW / 2,
      y: wy - this.y + screenH / 2,
    };
  }

  // Convert screen position to world position
  screenToWorld(sx, sy, screenW, screenH) {
    return {
      x: sx + this.x - screenW / 2,
      y: sy + this.y - screenH / 2,
    };
  }

  // Player world position always equals camera position
  get playerWorldX() { return this.x; }
  get playerWorldY() { return this.y; }
}
