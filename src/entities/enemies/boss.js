import { BaseEnemy } from './base-enemy.js';

const LASER_INTERVAL  = 5;    // seconds between attacks
const LASER_WARMUP    = 1.0;  // seconds tracking player
const LASER_PRE_FIRE  = 0.5;  // seconds locked before firing
const LASER_FIRE_DUR  = 0.15; // seconds beam is visible
export const LASER_RANGE = 1400; // world units

export class Boss extends BaseEnemy {
  constructor(opts) {
    super({ hp: 1500, speed: 45, radius: 60, scoreValue: 300, ...opts });
    this.type  = 'boss';
    this.color = '#f44336';
    this._phase = 1;

    this._phase2SpeedEnabled = opts.enablePhase2Speed ?? true;
    this._laserEnabled    = opts.enableLaser ?? false;
    // laserRateMult > 1 fires more often (shorter interval); default 1.
    this._laserInterval   = LASER_INTERVAL / (opts.laserRateMult ?? 1);
    this._laserTimer      = this._laserInterval;
    this._laserState      = 'idle'; // 'idle' | 'warmup' | 'preFire' | 'firing'
    this._laserPhaseTimer = 0;
    this._laserDamaged    = false;  // one hit per firing phase
    this.laserAngle       = 0;
    this.laserRange       = LASER_RANGE;
  }

  // Bosses are immune to freeze
  freeze(_duration) {}
  get isFrozen() { return false; }

  get laserPhase() { return this._laserEnabled ? this._laserState : 'idle'; }

  _isStopped() {
    return (this._laserEnabled && this._laserState !== 'idle') || this._stunTimer > 0;
  }

  update(dt, camera) {
    if (this._phase2SpeedEnabled && this.hp <= this.maxHp * 0.5 && this._phase === 1) {
      this._phase = 2;
      this.speed *= 1.5;
    }

    if (this._laserEnabled) {
      this._updateLaser(dt, camera);
    }

    // Tick stun timer here so it counts down even when laser-stopped
    if (this._stunTimer > 0) {
      this._stunTimer = Math.max(0, this._stunTimer - dt);
    }

    if (!this._isStopped()) {
      super.update(dt, camera);
    } else if (this._hitFlash > 0) {
      this._hitFlash -= dt;
    }
  }

  _updateLaser(dt, camera) {
    if (this._laserState === 'idle') {
      this._laserTimer -= dt;
      if (this._laserTimer <= 0) {
        this._laserState = 'warmup';
        this._laserPhaseTimer = LASER_WARMUP;
      }
    } else if (this._laserState === 'warmup') {
      const dx = camera.playerWorldX - this.wx;
      const dy = camera.playerWorldY - this.wy;
      this.laserAngle = Math.atan2(dy, dx);
      this._laserPhaseTimer -= dt;
      if (this._laserPhaseTimer <= 0) {
        this._laserState = 'preFire';
        this._laserPhaseTimer = LASER_PRE_FIRE;
      }
    } else if (this._laserState === 'preFire') {
      this._laserPhaseTimer -= dt;
      if (this._laserPhaseTimer <= 0) {
        this._laserState = 'firing';
        this._laserPhaseTimer = LASER_FIRE_DUR;
        this._laserDamaged = false;
      }
    } else if (this._laserState === 'firing') {
      this._laserPhaseTimer -= dt;
      if (this._laserPhaseTimer <= 0) {
        this._laserState = 'idle';
        this._laserTimer = this._laserInterval;
      }
    }
  }
}
