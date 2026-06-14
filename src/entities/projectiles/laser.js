export class Laser {
  constructor() {
    this.active = false;
    this.ox = 0; // origin world x
    this.oy = 0;
    this.tx = 0; // target world x (end of beam)
    this.ty = 0;
    this.damage = 0;
    this.width = 3;
    this._life = 0;
    this.DURATION = 0.1; // visible for 100ms
  }

  fire(ox, oy, angle, range, damage, width = 3) {
    this.active = true;
    this.ox = ox;
    this.oy = oy;
    this.tx = ox + Math.cos(angle) * range;
    this.ty = oy + Math.sin(angle) * range;
    this.damage = damage;
    this.width = width;
    this._life = this.DURATION;
  }

  update(dt) {
    if (!this.active) return;
    this._life -= dt;
    if (this._life <= 0) this.active = false;
  }

  get alpha() {
    return Math.max(0, this._life / this.DURATION);
  }
}
