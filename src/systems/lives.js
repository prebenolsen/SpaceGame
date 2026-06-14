export class LivesSystem {
  constructor(maxLives = 5, hitsPerLife = 3) {
    this.maxLives = maxLives;
    this.lives = maxLives;
    this.hitsPerLife = hitsPerLife;
    this.hits = 0;
    this._invulnTimer = 0;
    this.INVULN_DURATION = 2; // seconds of invincibility after a hit
  }

  reset() {
    this.lives = this.maxLives;
    this.hits = 0;
    this._invulnTimer = 0;
  }

  resetHits() {
    this.hits = 0;
    this._invulnTimer = 0;
  }

  update(dt) {
    if (this._invulnTimer > 0) {
      this._invulnTimer -= dt;
    }
  }

  get isInvulnerable() {
    return this._invulnTimer > 0;
  }

  // Returns 'hit' | 'died' | 'game_over' | null
  takeHit() {
    if (this.isInvulnerable) return null;
    this._invulnTimer = this.INVULN_DURATION;
    this.hits++;
    if (this.hits >= this.hitsPerLife) {
      this.hits = 0;
      this.lives--;
      if (this.lives <= 0) {
        return 'game_over';
      }
      return 'died';
    }
    return 'hit';
  }

  get isDead() {
    return this.lives <= 0;
  }
}
