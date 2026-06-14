import { BaseEnemy } from './base-enemy.js';

export class Boss extends BaseEnemy {
  constructor(opts) {
    super({ hp: 1500, speed: 45, radius: 60, scoreValue: 300, ...opts });
    this.type = 'boss';
    this.color = '#f44336';
    this._phase = 1;
  }

  // Bosses are immune to freeze
  freeze(_duration) {}

  get isFrozen() { return false; }

  update(dt, camera) {
    // Phase 2 at 50% HP: speed boost
    if (this.hp <= this.maxHp * 0.5 && this._phase === 1) {
      this._phase = 2;
      this.speed *= 1.5;
    }
    super.update(dt, camera);
  }
}
