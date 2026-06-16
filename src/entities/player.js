import { Laser } from './projectiles/laser.js';
import { Arc } from './projectiles/arc.js';
import { Cooldown } from '../core/timer.js';

export class Player {
  constructor() {
    this.laser = new Laser();
    this.arc = new Arc();
    this._laserCooldown = new Cooldown(1);
    this._arcCooldown = new Cooldown(1);
    this.stats = null; // set externally from upgrade system
    this.LASER_RANGE = 1200;

    this.laserAim = { active: false, angle: 0, ox: 0, oy: 0, range: this.LASER_RANGE, width: 6 };
    this.arcAim   = { active: false, angle: 0, ox: 0, oy: 0, range: 150, halfAngle: Math.PI / 5 };
  }

  applyStats(stats) {
    this.stats = stats;
    this._laserCooldown.setInterval(stats.laserInterval);
    this._arcCooldown.setInterval(stats.arcInterval);
  }

  update(dt, laserJoystick, arcJoystick, camera) {
    this._laserCooldown.update(dt);
    this._arcCooldown.update(dt);
    this.laser.update(dt);
    this.arc.update(dt);

    const px = camera.playerWorldX;
    const py = camera.playerWorldY;

    // A joystick may be null during tutorials (only one weapon enabled at a time)
    const laserActive = !!(laserJoystick && laserJoystick.active);
    const arcActive   = !!(arcJoystick && arcJoystick.active);

    this.laserAim.active = laserActive;
    if (laserActive) {
      this.laserAim.angle  = laserJoystick.angle;
      this.laserAim.ox     = px;
      this.laserAim.oy     = py;
      this.laserAim.range  = this.LASER_RANGE;
      this.laserAim.width  = this.stats.laserWidth;
    }

    this.arcAim.active = arcActive;
    if (arcActive) {
      this.arcAim.angle     = arcJoystick.angle;
      this.arcAim.ox        = px;
      this.arcAim.oy        = py;
      this.arcAim.range     = this.stats.arcRange;
      this.arcAim.halfAngle = this.stats.arcHalfAngle;
    }

    // Fire laser if joystick active and cooldown ready
    if (laserActive && this._laserCooldown.ready()) {
      this.laser.fire(px, py, laserJoystick.angle, this.LASER_RANGE, this.stats.laserDamage, this.stats.laserWidth);
    }

    // Fire arc if joystick active and cooldown ready
    if (arcActive && this._arcCooldown.ready()) {
      this.arc.fire(px, py, arcJoystick.angle, this.stats.arcRange, this.stats.arcDamage, this.stats.arcHalfAngle);
    }
  }
}
