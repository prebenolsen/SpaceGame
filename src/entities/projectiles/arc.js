export class Arc {
  constructor() {
    this.active = false;
    this.ox = 0;
    this.oy = 0;
    this.angle = 0;   // direction in radians
    this.halfAngle = Math.PI / 5; // ~36° half-cone = 72° total
    this.range = 150;
    this.damage = 0;
    this._life = 0;
    this.DURATION = 0.15;
  }

  fire(ox, oy, angle, range, damage) {
    this.active = true;
    this.ox = ox;
    this.oy = oy;
    this.angle = angle;
    this.range = range;
    this.damage = damage;
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
