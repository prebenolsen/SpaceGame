import { Drone } from '../entities/enemies/drone.js';
import { Rusher } from '../entities/enemies/rusher.js';
import { Tank } from '../entities/enemies/tank.js';
import { Miniboss } from '../entities/enemies/miniboss.js';
import { Boss } from '../entities/enemies/boss.js';

const FACTORY = {
  drone: (opts) => new Drone(opts),
  rusher: (opts) => new Rusher(opts),
  tank: (opts) => new Tank(opts),
  miniboss: (opts) => new Miniboss(opts),
  boss: (opts) => new Boss(opts),
};

// North (270°) and South (90°) each get a 15° exclusion zone on both sides.
// Allowed ranges: [0°,75°) + [105°,255°) + [285°,360°) = 300° total.
function randomSpawnAngle() {
  const r = Math.random() * 300;
  let deg;
  if (r < 75) {
    deg = r;
  } else if (r < 225) {
    deg = r + 30; // skip south exclusion [75°,105°]
  } else {
    deg = r + 60; // skip south [75°-105°] and north [255°-285°]
  }
  return deg * (Math.PI / 180);
}

export class Spawner {
  constructor(camera, screenW, screenH, zoom = 1) {
    this.camera = camera;
    this.screenW = screenW;
    this.screenH = screenH;
    this.zoom = zoom;
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
    while (this._waves.length > 0 && this._waves[0].time <= this._elapsed) {
      const entry = this._waves.shift();
      const enemy = this._createEnemy(entry);
      if (enemy) enemies.push(enemy);
    }
  }

  _createEnemy(entry) {
    const factory = FACTORY[entry.type];
    if (!factory) return null;
    const spawnPos = this._randomCirclePosition();
    return factory({
      wx: spawnPos.x,
      wy: spawnPos.y,
      healthMult: entry.healthMult ?? 1,
      speedMult: entry.speedMult ?? 1,
    });
  }

  // Spawn on a circle around the screen center, avoiding 15° zones around
  // north (top/270°) and south (bottom/90°) since the game is landscape.
  _randomCirclePosition() {
    const { camera, screenW, screenH } = this;
    // Radius just outside the visible area (screen half-diagonal + buffer)
    const R = Math.hypot(screenW, screenH) / 2 + 80;
    const angle = randomSpawnAngle();
    const sx = screenW / 2 + Math.cos(angle) * R;
    const sy = screenH / 2 + Math.sin(angle) * R;
    return camera.screenToWorld(sx, sy, screenW, screenH);
  }
}
