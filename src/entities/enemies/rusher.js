import { BaseEnemy } from './base-enemy.js';

export class Rusher extends BaseEnemy {
  constructor(opts) {
    super({ hp: 12, speed: 150, radius: 14, scoreValue: 15, ...opts });
    this.type = 'rusher';
    this.color = '#ff7043';
  }
}
