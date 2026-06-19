import { Drone } from '../entities/enemies/drone.js';
import { Rusher } from '../entities/enemies/rusher.js';
import { Tank } from '../entities/enemies/tank.js';
import { Miniboss } from '../entities/enemies/miniboss.js';
import { Boss } from '../entities/enemies/boss.js';
import { createRusherCluster } from '../entities/enemies/rusher-cluster.js';
import { mobSpeedCapForLevel } from '../levels/level-config.js';

const FACTORY = {
  drone:         (opts) => new Drone(opts),
  rusher:        (opts) => new Rusher(opts),
  rusherCluster: (opts) => createRusherCluster(opts),
  tank:          (opts) => new Tank(opts),
  miniboss:      (opts) => new Miniboss(opts),
  boss:          (opts) => new Boss(opts),
};

// North (270°) and South (90°) each get a 10° exclusion zone on both sides.
// Allowed ranges: [0°,80°) + [100°,260°) + [280°,360°) = 320° total.
function randomSpawnAngle() {
  const r = Math.random() * 320;
  let deg;
  if (r < 80) {
    deg = r;
  } else if (r < 240) {
    deg = r + 20; // skip south exclusion [80°,100°]
  } else {
    deg = r + 40; // skip south [80°-100°] and north [260°-280°]
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
    this._levelNumber = 1;
  }

  loadLevel(levelConfig, levelNumber = 1) {
    this._waves = [...levelConfig.waves].sort((a, b) => a.time - b.time);
    this._elapsed = 0;
    this._levelNumber = levelNumber;
  }

  reset() {
    this._waves = [];
    this._elapsed = 0;
  }

  spawnPreset(presetEnemies, wx, wy, enemies) {
    for (const p of presetEnemies) {
      const factory = FACTORY[p.type];
      if (!factory) continue;
      const result = factory({ wx: wx + p.dx, wy: wy + p.dy, speedMult: 0 });
      if (Array.isArray(result)) enemies.push(...result);
      else if (result) enemies.push(result);
    }
  }

  get isDone() {
    return this._waves.length === 0;
  }

  update(dt, enemies, maxCompanions = Infinity) {
    this._elapsed += dt;
    while (this._waves.length > 0 && this._waves[0].time <= this._elapsed) {
      const entry = this._waves.shift();
      if (entry.type !== 'boss' && maxCompanions !== Infinity) {
        const companions = enemies.filter(e => e.active && e.type !== 'boss').length;
        if (companions >= maxCompanions) continue;
      }
      const result = this._createEnemy(entry);
      if (Array.isArray(result)) enemies.push(...result);
      else if (result) enemies.push(result);
    }
  }

  _createEnemy(entry) {
    const factory = FACTORY[entry.type];
    if (!factory) return null;
    const spawnPos = this._randomCirclePosition();
    // Speed is fully defined by the level config's per-level speedMult. Every
    // enemy except the boss is held to the per-level mob speed cap (a flat 92.5 %
    // of the player's max speed across all levels). Bosses use
    // authored speeds and manage their own pace, unless the entry opts into the
    // mob cap (capSpeed) so it matches the level's enemies.
    const levelCap = mobSpeedCapForLevel(this._levelNumber);
    const speedCap = entry.type === 'boss'
      ? (entry.capSpeed ? levelCap : Infinity)
      : levelCap;
    return factory({
      wx: spawnPos.x,
      wy: spawnPos.y,
      healthMult: entry.healthMult ?? 1,
      speedMult: entry.speedMult ?? 1,
      speedCap,
      enableLaser:        entry.enableLaser        ?? false,
      enablePhase2Speed:  entry.enablePhase2Speed  ?? true,
      laserRateMult:      entry.laserRateMult       ?? 1,
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
