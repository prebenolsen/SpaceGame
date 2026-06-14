import { normalizeVector } from '../../utils/math.js';

export class BaseEnemy {
  constructor({ wx, wy, hp, speed, radius, scoreValue, healthMult = 1, speedMult = 1 }) {
    this.wx = wx;
    this.wy = wy;
    this.hp = hp * healthMult;
    this.maxHp = this.hp;
    this.speed = speed * speedMult;
    this.radius = radius;
    this.scoreValue = scoreValue;
    this.active = true;
    this._hitFlash = 0;
  }

  // Move toward the player (camera position = player world position)
  update(dt, camera) {
    const dx = camera.playerWorldX - this.wx;
    const dy = camera.playerWorldY - this.wy;
    const dir = normalizeVector(dx, dy);
    this.wx += dir.x * this.speed * dt;
    this.wy += dir.y * this.speed * dt;
    if (this._hitFlash > 0) this._hitFlash -= dt;
  }

  // Returns true if the enemy died
  takeDamage(amount) {
    this.hp -= amount;
    this._hitFlash = 0.12;
    if (this.hp <= 0) {
      this.hp = 0;
      this.active = false;
      return true;
    }
    return false;
  }

  get hitFlashing() {
    return this._hitFlash > 0;
  }

  get hpFraction() {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0;
  }
}
