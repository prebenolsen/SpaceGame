import { BaseEnemy } from './base-enemy.js';

const BEHIND_DIST = 28; // px behind leader, toward-player axis
const SIDE_DIST   = 15; // px left/right of center — wings are 30px apart (radius 14 each, ~2px gap)

export class RusherClusterMember extends BaseEnemy {
  constructor(opts, role, leader = null) {
    super({ hp: 40, speed: 80, radius: 14, scoreValue: 10, ...opts });
    this.type   = 'rusherCluster';
    this.color  = '#4fc3f7'; // drone color
    this.role   = role;      // 'lead' | 'wingLeft' | 'wingRight'
    this.leader = leader;    // null for lead; reference to lead for wings
  }

  update(dt, camera) {
    // Freeze bookkeeping
    if (this._freezeTimer > 0) {
      this._freezeTimer = Math.max(0, this._freezeTimer - dt);
    }
    if (this._hitFlash > 0) this._hitFlash -= dt;

    // Lead (or orphaned wing after leader dies): normal homing behavior
    if (this.role === 'lead' || !this.leader || !this.leader.active) {
      if (this._freezeTimer > 0) return;
      const dx = camera.playerWorldX - this.wx;
      const dy = camera.playerWorldY - this.wy;
      const d  = Math.hypot(dx, dy);
      if (d > 0.001) {
        this.wx += (dx / d) * this.speed * dt;
        this.wy += (dy / d) * this.speed * dt;
      }
      return;
    }

    // Wings: maintain rigid formation behind leader
    if (this._freezeTimer > 0) return;

    const toPlayerX = camera.playerWorldX - this.leader.wx;
    const toPlayerY = camera.playerWorldY - this.leader.wy;
    const dist = Math.hypot(toPlayerX, toPlayerY);
    if (dist < 0.001) return;

    const fwdX = toPlayerX / dist;
    const fwdY = toPlayerY / dist;
    // Perpendicular (90° CCW from forward = left of travel)
    const perpX = -fwdY;
    const perpY =  fwdX;

    const side = this.role === 'wingLeft' ? -1 : 1;
    this.wx = this.leader.wx - fwdX * BEHIND_DIST + perpX * side * SIDE_DIST;
    this.wy = this.leader.wy - fwdY * BEHIND_DIST + perpY * side * SIDE_DIST;
  }
}

export function createRusherCluster(opts) {
  const lead      = new RusherClusterMember(opts, 'lead');
  const wingLeft  = new RusherClusterMember(opts, 'wingLeft',  lead);
  const wingRight = new RusherClusterMember(opts, 'wingRight', lead);
  return [lead, wingLeft, wingRight];
}
