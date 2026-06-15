// Web Audio API sound manager — all sounds are generated procedurally
// so there's no audio file dependency and it works fully offline.
//
// A DynamicsCompressor sits at the master output so simultaneous sounds
// (rapid laser fire, many hits) never stack into loudness. Per-sound
// cooldowns add a second layer: redundant calls within the window are
// silently dropped rather than queued, keeping the mix clean.
export class SoundManager {
  constructor() {
    this._ctx = null;
    this._master = null;
    this._enabled = true;
    this._lastPlay = {};
  }

  init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain — keep headroom below clipping
      this._master = this._ctx.createGain();
      this._master.gain.value = 0.35;

      // Brick-wall limiter: high ratio, fast attack
      const comp = this._ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 4;
      comp.ratio.value = 20;
      comp.attack.value = 0.001;
      comp.release.value = 0.08;

      this._master.connect(comp);
      comp.connect(this._ctx.destination);
    } catch (_) {
      this._enabled = false;
    }
  }

  // Resume context (required after user gesture on mobile)
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  // Cooldown in seconds per sound id — drop calls that arrive too soon
  static _COOLDOWN = {
    laserFire: 0.06,
    laserHit:  0.06,
    arcFire:   0.12,
    arcHit:    0.10,
  };

  play(id) {
    if (!this._enabled || !this._ctx) return;

    const now = this._ctx.currentTime;
    const cd = SoundManager._COOLDOWN[id] ?? 0;
    if (cd > 0 && now - (this._lastPlay[id] ?? -Infinity) < cd) return;
    this._lastPlay[id] = now;

    switch (id) {
      case 'laserFire': this._tone(880, 0.08, 'sawtooth', 0.10); break;
      case 'laserHit':  this._tone(440, 0.06, 'square',   0.07); break;
      case 'arcFire':   this._noise(0.05, 0.16); break;
      case 'arcHit':    this._tone(220, 0.07, 'sawtooth', 0.09); break;
      case 'playerHit': this._tone(120, 0.12, 'sawtooth', 0.25); break;
      case 'levelClear':this._tone(660, 0.12, 'sine',     0.35); break;
      case 'gameOver':  this._tone(80,  0.14, 'sawtooth', 0.70); break;
    }
  }

  _tone(freq, gain, type, duration) {
    if (!this._ctx || !this._master) return;
    const osc = this._ctx.createOscillator();
    const amp = this._ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, this._ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    osc.connect(amp);
    amp.connect(this._master);
    osc.start();
    osc.stop(this._ctx.currentTime + duration);
  }

  _noise(gain, duration) {
    if (!this._ctx || !this._master) return;
    const bufferSize = this._ctx.sampleRate * duration;
    const buffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this._ctx.createBufferSource();
    src.buffer = buffer;
    const amp = this._ctx.createGain();
    amp.gain.setValueAtTime(gain, this._ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    src.connect(amp);
    amp.connect(this._master);
    src.start();
  }
}
