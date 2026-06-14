import { BaseEnemy } from './base-enemy.js';

export class Tank extends BaseEnemy {
  constructor(opts) {
    super({ hp: 150, speed: 40, radius: 28, scoreValue: 30, ...opts });
    this.type = 'tank';
    this.color = '#78909c';
  }
}
