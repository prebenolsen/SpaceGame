import { BaseEnemy } from './base-enemy.js';

// Max player move speed at rank 6: 200 * (1 + 6*0.2) = 440 px/s
const MAX_DRONE_SPEED = 440 * 1.2; // drones capped at 20% faster than fully-upgraded player

export class Drone extends BaseEnemy {
  constructor(opts) {
    super({ hp: 40, speed: 80, radius: 18, scoreValue: 10, ...opts });
    this.speed = Math.min(this.speed, MAX_DRONE_SPEED);
    this.type = 'drone';
    this.color = '#4fc3f7';
  }
}
