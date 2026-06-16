// Virtual joystick — tracks a single touch
export class Joystick {
  constructor(baseX, baseY, radius = 55) {
    this.baseX = baseX;
    this.baseY = baseY;
    this.radius = radius;
    this.knobX = baseX;
    this.knobY = baseY;
    this.dx = 0;
    this.dy = 0;
    this.active = false;
    this._touchId = null;
  }

  reposition(baseX, baseY) {
    this.baseX = baseX;
    this.baseY = baseY;
    if (!this.active) {
      this.knobX = baseX;
      this.knobY = baseY;
    }
  }

  onTouchStart(touch) {
    if (this._touchId !== null) return false;
    const dx = touch.clientX - this.baseX;
    const dy = touch.clientY - this.baseY;
    if (Math.hypot(dx, dy) > this.radius * 2) return false;
    this._touchId = touch.identifier;
    this._update(touch.clientX, touch.clientY);
    return true;
  }

  onTouchMove(touch) {
    if (touch.identifier !== this._touchId) return;
    this._update(touch.clientX, touch.clientY);
  }

  onTouchEnd(touch) {
    if (touch.identifier !== this._touchId) return;
    this.reset();
  }

  reset() {
    this._touchId = null;
    this.active = false;
    this.dx = 0;
    this.dy = 0;
    this.knobX = this.baseX;
    this.knobY = this.baseY;
  }

  _update(cx, cy) {
    let dx = cx - this.baseX;
    let dy = cy - this.baseY;
    const dist = Math.hypot(dx, dy);
    if (dist > this.radius) {
      dx = (dx / dist) * this.radius;
      dy = (dy / dist) * this.radius;
    }
    this.knobX = this.baseX + dx;
    this.knobY = this.baseY + dy;
    this.dx = dx / this.radius;
    this.dy = dy / this.radius;
    this.active = dist > 8; // dead zone
  }

  // Angle in radians of current direction
  get angle() {
    return Math.atan2(this.dy, this.dx);
  }

  draw(ctx, color = '#ffffff') {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.baseX, this.baseY, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = this.active ? 0.65 : 0.32;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.knobX, this.knobY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
