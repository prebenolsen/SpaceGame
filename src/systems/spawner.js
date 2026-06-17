import { Drone } from '../entities/enemies/drone.js';
import { Rusher } from '../entities/enemies/rusher.js';
import { Tank } from '../entities/enemies/tank.js';
import { Miniboss } from '../entities/enemies/miniboss.js';
import { Boss } from '../entities/enemies/boss.js';
import { createRusherCluster } from '../entities/enemies/rusher-cluster.js';

const FACTORY = {
  drone:         (opts) => new Drone(opts),
  rusher:        (opts) => new Rusher(opts),
  rusherCluster: (opts) => createRusherCluster(opts),
  tank:          (opts) => new Tank(opts),
  miniboss:      (opts) => new Miniboss(opts),
  boss:          (opts) => new Boss(opts),
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
    // +10 % speed per level beyond level 5 (compounding); minibosses are always slow
    const levelSpeedBoost = (this._levelNumber > 5 && entry.type !== 'miniboss')
      ? Math.pow(1.1, this._levelNumber - 5) : 1;
    // Max effective speed (px/s); ramps up as player levels and upgrades speed
    // Player max speed (rank-6 moveSpeed) = 440 px/s; thresholds are % of that
    // Minibosses are always slow (spawned with speedMult 0.5, no cap needed)
    const speedCap =
      entry.type === 'miniboss' ? Infinity :
      entry.type === 'boss'     ? (this._levelNumber >= 16 ? 484 : Infinity) :  // 110% — bosses from L16+
      this._levelNumber >= 21   ? 484 :  // 110% — L21+, hard stop
      this._levelNumber >= 18   ? 462 :  // 105% — L18-20
      this._levelNumber >= 17   ? 440 :  // 100% — L17
      this._levelNumber >= 11   ? 418 :  // 95%  — L11-16
                                  528;   // 120% — L1-10 (actual speeds never reach this)
    return factory({
      wx: spawnPos.x,
      wy: spawnPos.y,
      healthMult: entry.healthMult ?? 1,
      speedMult: (entry.speedMult ?? 1) * levelSpeedBoost,
      speedCap,
      enableLaser:        entry.enableLaser        ?? false,
      enablePhase2Speed:  entry.enablePhase2Speed  ?? true,
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
