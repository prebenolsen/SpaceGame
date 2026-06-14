export class Timer {
  constructor(duration) {
    this.duration = duration;
    this.elapsed = 0;
    this.done = false;
  }

  reset(duration) {
    this.duration = duration ?? this.duration;
    this.elapsed = 0;
    this.done = false;
  }

  update(dt) {
    if (this.done) return;
    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.elapsed = this.duration;
      this.done = true;
    }
  }

  get remaining() {
    return Math.max(0, this.duration - this.elapsed);
  }

  get fraction() {
    return this.duration > 0 ? this.elapsed / this.duration : 1;
  }
}

// A repeating cooldown timer. Call ready() to check and consume.
export class Cooldown {
  constructor(interval) {
    this.interval = interval;
    this._elapsed = 0;
    this._ready = false;
  }

  setInterval(interval) {
    this.interval = interval;
  }

  update(dt) {
    this._elapsed += dt;
    if (this._elapsed >= this.interval) {
      this._elapsed -= this.interval;
      this._ready = true;
    }
  }

  ready() {
    if (this._ready) {
      this._ready = false;
      return true;
    }
    return false;
  }

  reset() {
    this._elapsed = 0;
    this._ready = false;
  }
}
