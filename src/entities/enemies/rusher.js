import { BaseEnemy } from './base-enemy.js';

// Max player move speed at rank 6: 200 * (1 + 6*0.2) = 440 px/s
const MAX_RUSHER_SPEED = 440 * 1.2; // rushers capped at 20% faster than fully-upgraded player

export class Rusher extends BaseEnemy {
  constructor(opts) {
    super({ hp: 12, speed: 110, radius: 14, scoreValue: 15, ...opts });
    this.speed = Math.min(this.speed, MAX_RUSHER_SPEED);
    this.type = 'rusher';
    this.color = '#ff7043';
  }
}
