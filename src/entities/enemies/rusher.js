import { BaseEnemy } from './base-enemy.js';

export class Rusher extends BaseEnemy {
  constructor(opts) {
    super({ hp: 30, speed: 220, radius: 14, scoreValue: 15, ...opts });
    this.type = 'rusher';
    this.color = '#ff7043';
  }
}
