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
    this._freezeTimer = 0;
  }

  freeze(duration) {
    this._freezeTimer = duration;
  }

  // Returns speed multiplier while frozen (0 = fully stopped)
  _getFreezeSpeedMult() {
    return 0;
  }

  get isFrozen() {
    return this._freezeTimer > 0;
  }

  // Move toward the player (camera position = player world position)
  update(dt, camera) {
    if (this._freezeTimer > 0) {
      this._freezeTimer = Math.max(0, this._freezeTimer - dt);
    }
    const speedMult = this._freezeTimer > 0 ? this._getFreezeSpeedMult() : 1;
    if (speedMult > 0) {
      const dx = camera.playerWorldX - this.wx;
      const dy = camera.playerWorldY - this.wy;
      const dir = normalizeVector(dx, dy);
      this.wx += dir.x * this.speed * speedMult * dt;
      this.wy += dir.y * this.speed * speedMult * dt;
    }
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
