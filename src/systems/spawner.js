import { Drone } from '../entities/enemies/drone.js';
import { Rusher } from '../entities/enemies/rusher.js';
import { Tank } from '../entities/enemies/tank.js';
import { Miniboss } from '../entities/enemies/miniboss.js';
import { Boss } from '../entities/enemies/boss.js';
import { randomRange } from '../utils/math.js';

const FACTORY = {
  drone: (opts) => new Drone(opts),
  rusher: (opts) => new Rusher(opts),
  tank: (opts) => new Tank(opts),
  miniboss: (opts) => new Miniboss(opts),
  boss: (opts) => new Boss(opts),
};

export class Spawner {
  constructor(camera, screenW, screenH) {
    this.camera = camera;
    this.screenW = screenW;
    this.screenH = screenH;
    this._waves = [];
    this._elapsed = 0;
  }

  loadLevel(levelConfig) {
    this._waves = [...levelConfig.waves].sort((a, b) => a.time - b.time);
    this._elapsed = 0;
  }

  reset() {
    this._waves = [];
    this._elapsed = 0;
  }

  get isDone() {
    return this._waves.length === 0;
  }

  update(dt, enemies) {
    this._elapsed += dt;
    // Spawn anything whose time has come
    while (this._waves.length > 0 && this._waves[0].time <= this._elapsed) {
      const entry = this._waves.shift();
      const enemy = this._createEnemy(entry);
      if (enemy) enemies.push(enemy);
    }
  }

  _createEnemy(entry) {
    const factory = FACTORY[entry.type];
    if (!factory) return null;
    const spawnPos = this._randomEdgePosition();
    return factory({
      wx: spawnPos.x,
      wy: spawnPos.y,
      healthMult: entry.healthMult ?? 1,
      speedMult: entry.speedMult ?? 1,
    });
  }

  // Spawn just outside screen edges in world space
  _randomEdgePosition() {
    const { camera, screenW, screenH } = this;
    const margin = 80;
    const edge = Math.floor(Math.random() * 4);
    let sx, sy;
    switch (edge) {
      case 0: sx = randomRange(0, screenW); sy = -margin; break;          // top
      case 1: sx = randomRange(0, screenW); sy = screenH + margin; break;  // bottom
      case 2: sx = -margin; sy = randomRange(0, screenH); break;           // left
      case 3: sx = screenW + margin; sy = randomRange(0, screenH); break;  // right
    }
    // Convert screen spawn position to world position
    return camera.screenToWorld(sx, sy, screenW, screenH);
  }
}
