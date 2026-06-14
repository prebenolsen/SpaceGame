// Web Audio API sound manager — all sounds are generated procedurally
// so there's no audio file dependency and it works fully offline.
export class SoundManager {
  constructor() {
    this._ctx = null;
    this._enabled = true;
  }

  init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
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

  play(id) {
    if (!this._enabled || !this._ctx) return;
    switch (id) {
      case 'laserFire': this._tone(880, 0.05, 'sawtooth', 0.12); break;
      case 'laserHit':  this._tone(440, 0.08, 'square', 0.08); break;
      case 'arcFire':   this._noise(0.06, 0.18); break;
      case 'arcHit':    this._tone(220, 0.1, 'sawtooth', 0.1); break;
      case 'playerHit': this._tone(120, 0.2, 'sawtooth', 0.3); break;
      case 'levelClear':this._tone(660, 0.15, 'sine', 0.4); break;
      case 'gameOver':  this._tone(80, 0.3, 'sawtooth', 0.8); break;
    }
  }

  _tone(freq, gain, type, duration) {
    if (!this._ctx) return;
    const osc = this._ctx.createOscillator();
    const amp = this._ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, this._ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    osc.connect(amp);
    amp.connect(this._ctx.destination);
    osc.start();
    osc.stop(this._ctx.currentTime + duration);
  }

  _noise(gain, duration) {
    if (!this._ctx) return;
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
    amp.connect(this._ctx.destination);
    src.start();
  }
}
