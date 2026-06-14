import { BaseEnemy } from './base-enemy.js';

export class Drone extends BaseEnemy {
  constructor(opts) {
    super({ hp: 60, speed: 80, radius: 18, scoreValue: 10, ...opts });
    this.type = 'drone';
    this.color = '#4fc3f7';
  }
}
