import { checkLaserHits, checkArcHits, checkEnemyPlayerHit } from '../core/collision.js';

export class CombatSystem {
  constructor(livesSystem, soundManager) {
    this.lives = livesSystem;
    this.sound = soundManager;
    this.score = 0;
  }

  reset() {
    this.score = 0;
  }

  // Returns list of destroyed enemies
  resolveLaser(laser, enemies, stunChance = 0) {
    const hits = checkLaserHits(laser, enemies);
    const destroyed = [];
    for (const enemy of hits) {
      const dead = enemy.takeDamage(laser.damage);
      this.sound.play('laserHit');
      if (dead) {
        this.score += enemy.scoreValue;
        enemy.active = false;
        destroyed.push(enemy);
      } else if (stunChance > 0 && enemy.type !== 'boss' && enemy.type !== 'miniboss' && Math.random() < stunChance) {
        enemy.freeze(2);
      }
    }
    return destroyed;
  }

  resolveArc(arc, enemies, stunChance = 0) {
    const hits = checkArcHits(arc, enemies);
    const destroyed = [];
    for (const enemy of hits) {
      const dead = enemy.takeDamage(arc.damage);
      this.sound.play('arcHit');
      if (dead) {
        this.score += enemy.scoreValue;
        enemy.active = false;
        destroyed.push(enemy);
      } else if (stunChance > 0 && enemy.type !== 'boss' && enemy.type !== 'miniboss' && Math.random() < stunChance) {
        enemy.freeze(2);
      }
    }
    return destroyed;
  }

  // Returns result string or null
  resolveEnemyPlayerCollisions(enemies, camera) {
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (checkEnemyPlayerHit(enemy, camera)) {
        if (enemy.type === 'boss' || enemy.type === 'miniboss') {
          enemy.stun(1); // bounces off player, frozen 1 second
        } else {
          enemy.active = false; // regular enemies crash on contact
        }
        const result = this.lives.takeHit();
        if (result) {
          this.sound.play('playerHit');
          return result;
        }
      }
    }
    return null;
  }

  // Returns result string or null
  resolveBossLasers(enemies, camera) {
    for (const enemy of enemies) {
      if (!enemy.active || enemy.type !== 'boss') continue;
      if (enemy.laserPhase !== 'firing' || enemy._laserDamaged) continue;
      if (this._bossLaserHitsPlayer(enemy, camera)) {
        enemy._laserDamaged = true;
        const result = this.lives.takeHit();
        if (result) {
          this.sound.play('playerHit');
          return result;
        }
      }
    }
    return null;
  }

  _bossLaserHitsPlayer(boss, camera) {
    const px = camera.playerWorldX;
    const py = camera.playerWorldY;
    const ox = boss.wx;
    const oy = boss.wy;
    const cdx = Math.cos(boss.laserAngle);
    const cdy = Math.sin(boss.laserAngle);
    const t = (px - ox) * cdx + (py - oy) * cdy;
    if (t < 0 || t > boss.laserRange) return false;
    const perpDist = Math.abs((px - ox) * cdy - (py - oy) * cdx);
    return perpDist < 30;
  }
}
