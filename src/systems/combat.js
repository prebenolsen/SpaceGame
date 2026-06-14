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
  resolveLaser(laser, enemies) {
    const hits = checkLaserHits(laser, enemies);
    const destroyed = [];
    for (const enemy of hits) {
      const dead = enemy.takeDamage(laser.damage);
      this.sound.play('laserHit');
      if (dead) {
        this.score += enemy.scoreValue;
        enemy.active = false;
        destroyed.push(enemy);
      }
    }
    return destroyed;
  }

  resolveArc(arc, enemies) {
    const hits = checkArcHits(arc, enemies);
    const destroyed = [];
    for (const enemy of hits) {
      const dead = enemy.takeDamage(arc.damage);
      this.sound.play('arcHit');
      if (dead) {
        this.score += enemy.scoreValue;
        enemy.active = false;
        destroyed.push(enemy);
      }
    }
    return destroyed;
  }

  // Returns result string or null
  resolveEnemyPlayerCollisions(enemies, camera) {
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (checkEnemyPlayerHit(enemy, camera)) {
        enemy.active = false; // enemy crashes on contact
        const result = this.lives.takeHit();
        if (result) {
          this.sound.play('playerHit');
          return result;
        }
      }
    }
    return null;
  }
}
