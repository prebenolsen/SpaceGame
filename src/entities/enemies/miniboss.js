import { BaseEnemy } from './base-enemy.js';

export class Miniboss extends BaseEnemy {
  constructor(opts) {
    super({ hp: 300, speed: 55, radius: 38, scoreValue: 75, ...opts });
    this.type = 'miniboss';
    this.color = '#ab47bc';
  }

  _getFreezeSpeedMult() {
    return 0.5;
  }
}
