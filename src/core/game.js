import { SCENE } from './scene.js';
import { Camera } from './camera.js';
import { Timer } from './timer.js';
import { Spawner } from '../systems/spawner.js';
import { CombatSystem } from '../systems/combat.js';
import { LivesSystem } from '../systems/lives.js';
import { getPlayerStats, pickUpgradeChoices, applyUpgrade } from '../systems/upgrade.js';
import { getLevelConfig } from '../levels/level-config.js';
import { Player } from '../entities/player.js';
import { HUD } from '../ui/hud.js';
import { LevelIntroScreen } from '../ui/level-intro.js';
import { LevelClearScreen } from '../ui/level-clear.js';
import { UpgradeScreen } from '../ui/upgrade-screen.js';
import { GameOverScreen } from '../ui/game-over.js';
import { Joystick } from '../ui/joystick.js';
import { Renderer, GAME_ZOOM } from '../rendering/renderer.js';
import { SoundManager } from '../audio/sound-manager.js';
import { saveGame, loadGame, clearSave, defaultSave } from '../utils/storage.js';
import { clamp } from '../utils/math.js';

export class Game {
  constructor(canvas) {
    this._renderer = new Renderer(canvas);
    this._sound = new SoundManager();
    this._camera = new Camera();
    this._livesSystem = new LivesSystem(5, 3);
    this._player = new Player();
    this._hud = new HUD();
    this._levelIntro = new LevelIntroScreen();
    this._levelClear = new LevelClearScreen();
    this._upgradeScreen = new UpgradeScreen();
    this._gameOver = new GameOverScreen();

    this._enemies = [];
    this._scene = SCENE.LEVEL_INTRO;
    this._levelTimer = new Timer(60);
    this._bossLevel = false;
    this._hitFlashTimer = 0;
    this._levelNumber = 1;
    this._upgrades = defaultSave().upgrades;
    this._score = 0;
    this._totalScore = 0;

    this._moveJoystick = null;
    this._laserJoystick = null;
    this._arcJoystick = null;
    this._freezeButton = null;
    this._freezeCharges = 1;
    this._spawner = null;
    this._combat = null;
    this._keys = {};

    this._lastTime = 0;
    this._raf = null;
  }

  init() {
    this._sound.init();
    this._resize();

    // Restore save if available
    const save = loadGame();
    if (save) {
      this._levelNumber = save.level;
      this._livesSystem.lives = save.lives;
      this._upgrades = save.upgrades;
      this._totalScore = save.totalScore;
    }

    this._combat = new CombatSystem(this._livesSystem, this._sound);
    this._applyUpgrades();
    this._startLevelIntro();
    this._bindInput();
    this._bindResize();

    this._lastTime = performance.now();
    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  _resize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    this._renderer.resize(W, H);
    this._layoutJoysticks(W, H);
  }

  _layoutJoysticks(W, H) {
    const pad = 60;
    const r = 55;
    if (!this._moveJoystick) {
      this._moveJoystick = new Joystick(pad + r, H - pad - r, r);
      this._laserJoystick = new Joystick(W - pad - r * 3 - 20, H - pad - r, r);
      this._arcJoystick = new Joystick(W - pad - r, H - pad - r, r);
    } else {
      this._moveJoystick.reposition(pad + r, H - pad - r);
      this._laserJoystick.reposition(W - pad - r * 3 - 20, H - pad - r);
      this._arcJoystick.reposition(W - pad - r, H - pad - r);
    }
    // Freeze button centered above the two right joysticks
    const btnR = 28;
    const btnX = (W - pad - r * 3 - 20 + W - pad - r) / 2;
    const btnY = H - pad - r - r - 24 - btnR;
    this._freezeButton = { x: btnX, y: btnY, radius: btnR };

    if (!this._spawner) {
      this._spawner = new Spawner(this._camera, W, H, GAME_ZOOM);
    } else {
      this._spawner.screenW = W;
      this._spawner.screenH = H;
    }
  }

  _bindResize() {
    window.addEventListener('resize', () => this._resize());
    screen.orientation?.addEventListener('change', () => this._resize());
  }

  _bindInput() {
    const canvas = this._renderer.canvas;
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._sound.resume();
      for (const t of e.changedTouches) {
        this._onTouchStart(t);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        this._moveJoystick.onTouchMove(t);
        this._laserJoystick.onTouchMove(t);
        this._arcJoystick.onTouchMove(t);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        this._onTouchEnd(t);
      }
    }, { passive: false });

    canvas.addEventListener('touchcancel', (e) => {
      for (const t of e.changedTouches) {
        this._onTouchEnd(t);
      }
    });

    // Mouse fallback for desktop testing
    let mouseDown = false;
    canvas.addEventListener('mousedown', (e) => {
      mouseDown = true;
      this._sound.resume();
      const fakeTouch = { identifier: 0, clientX: e.clientX, clientY: e.clientY };
      this._onTouchStart(fakeTouch);
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!mouseDown) return;
      const fakeTouch = { identifier: 0, clientX: e.clientX, clientY: e.clientY };
      this._laserJoystick.onTouchMove(fakeTouch);
      this._arcJoystick.onTouchMove(fakeTouch);
      this._moveJoystick.onTouchMove(fakeTouch);
    });
    canvas.addEventListener('mouseup', (e) => {
      mouseDown = false;
      const fakeTouch = { identifier: 0, clientX: e.clientX, clientY: e.clientY };
      this._onTouchEnd(fakeTouch);
    });

    // WASD + arrow key movement for desktop
    const MOVE_KEYS = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
    window.addEventListener('keydown', (e) => {
      if (!MOVE_KEYS.has(e.code)) return;
      this._keys[e.code] = true;
      this._sound.resume();
      e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      if (MOVE_KEYS.has(e.code)) this._keys[e.code] = false;
    });
  }

  _onTouchStart(touch) {
    // Overlay tap handling
    if (this._scene === SCENE.LEVEL_INTRO) {
      this._levelIntro.handleTouchStart(touch.clientX, touch.clientY);
      return;
    }
    if (this._scene === SCENE.LEVEL_CLEAR) {
      this._levelClear.handleTap();
      return;
    }
    if (this._scene === SCENE.GAME_OVER) {
      this._gameOver.handleTap();
      return;
    }
    if (this._scene === SCENE.UPGRADE) {
      const W = this._renderer.screenW;
      const H = this._renderer.screenH;
      this._upgradeScreen.handleTap(touch.clientX, touch.clientY, W, H);
      return;
    }
    // Freeze button (only during active play)
    if (this._scene === SCENE.PLAYING && this._freezeButton) {
      const d = Math.hypot(touch.clientX - this._freezeButton.x, touch.clientY - this._freezeButton.y);
      if (d <= this._freezeButton.radius * 1.5 && this._freezeCharges > 0) {
        this._activateFreeze();
        return;
      }
    }
    // Game joysticks — activate the one closest to the touch point
    const joysticks = [this._moveJoystick, this._laserJoystick, this._arcJoystick];
    let best = null, bestDist = Infinity;
    for (const j of joysticks) {
      const dist = Math.hypot(touch.clientX - j.baseX, touch.clientY - j.baseY);
      if (dist <= j.radius * 2 && dist < bestDist) {
        best = j;
        bestDist = dist;
      }
    }
    if (best) best.onTouchStart(touch);
  }

  _onTouchEnd(touch) {
    if (this._scene === SCENE.LEVEL_INTRO) {
      this._levelIntro.handleTouchEnd(touch.clientX, touch.clientY);
      return;
    }
    this._moveJoystick.onTouchEnd(touch);
    this._laserJoystick.onTouchEnd(touch);
    this._arcJoystick.onTouchEnd(touch);
  }

  _applyUpgrades() {
    const stats = getPlayerStats(this._upgrades);
    this._player.applyStats(stats);
  }

  _startLevelIntro() {
    this._scene = SCENE.LEVEL_INTRO;
    this._freezeCharges = 1;
    const config = getLevelConfig(this._levelNumber - 1);
    this._levelIntro.show(this._levelNumber, config.isBoss, () => this._startLevel(), (n) => {
      this._levelNumber = n;
      this._startLevelIntro();
    }, () => this._resetGame());
  }

  _startLevel() {
    this._scene = SCENE.PLAYING;
    const config = getLevelConfig(this._levelNumber - 1);
    this._bossLevel = config.isBoss && config.duration == null;
    this._levelTimer.reset(config.duration ?? Infinity);
    this._enemies = [];
    this._score = 0;
    this._livesSystem.resetHits();
    this._spawner.loadLevel(config);
    this._sound.resume();
  }

  _onLevelClear() {
    this._sound.play('levelClear');
    this._totalScore += this._score;
    this._scene = SCENE.LEVEL_CLEAR;
    this._levelClear.show(this._levelNumber, this._score, () => this._onLevelClearContinue());
    this._save();
  }

  _onLevelClearContinue() {
    const choices = pickUpgradeChoices(this._upgrades, this._levelNumber);
    if (choices.length === 0) {
      this._advanceLevel();
      return;
    }
    this._scene = SCENE.UPGRADE;
    this._upgradeScreen.show(choices, this._upgrades, (id) => this._onUpgradePick(id));
  }

  _onUpgradePick(id) {
    this._upgrades = applyUpgrade(this._upgrades, id);
    this._applyUpgrades();
    this._advanceLevel();
  }

  _advanceLevel() {
    this._levelNumber++;
    this._save();
    this._startLevelIntro();
  }

  _activateFreeze() {
    if (this._freezeCharges <= 0) return;
    this._freezeCharges--;
    for (const enemy of this._enemies) {
      if (enemy.active) enemy.freeze(5);
    }
  }

  _onPlayerDied(result) {
    if (result === 'game_over') {
      this._sound.play('gameOver');
      this._scene = SCENE.GAME_OVER;
      this._gameOver.show(this._totalScore, () => this._restartGame());
    } else {
      // Lost a life — earn 1 freeze charge, retry the level after brief pause
      this._freezeCharges++;
      this._scene = SCENE.DIED;
      setTimeout(() => this._startLevel(), 1500);
    }
  }

  _restartGame() {
    this._levelNumber = 1;
    this._livesSystem.reset();
    this._upgrades = defaultSave().upgrades;
    this._totalScore = 0;
    this._applyUpgrades();
    this._save();
    this._startLevelIntro();
  }

  _resetGame() {
    clearSave();
    this._levelNumber = 1;
    this._livesSystem.reset();
    this._upgrades = defaultSave().upgrades;
    this._totalScore = 0;
    this._score = 0;
    this._applyUpgrades();
    this._startLevelIntro();
  }

  _save() {
    saveGame({
      level: this._levelNumber,
      lives: this._livesSystem.lives,
      upgrades: this._upgrades,
      totalScore: this._totalScore,
    });
  }

  _drawFreezeButton(ctx) {
    const btn = this._freezeButton;
    if (!btn) return;
    const available = this._freezeCharges > 0;
    ctx.save();
    ctx.globalAlpha = available ? 0.85 : 0.35;
    ctx.fillStyle = available ? '#1565c0' : '#333';
    ctx.beginPath();
    ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = available ? '#90caf9' : '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = available ? 1 : 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.font = `${btn.radius}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❄', btn.x, btn.y + 1);
    if (this._freezeCharges > 1) {
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`×${this._freezeCharges}`, btn.x + btn.radius, btn.y - btn.radius + 2);
    }
    ctx.restore();
  }

  _loop(now) {
    const dt = clamp((now - this._lastTime) / 1000, 0, 0.1); // cap at 100ms
    this._lastTime = now;
    this._update(dt);
    this._draw();
    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  _update(dt) {
    if (this._scene !== SCENE.PLAYING) return;

    // Move camera by joystick or WASD/arrow keys
    const stats = this._player.stats;
    if (this._moveJoystick.active) {
      this._camera.move(
        this._moveJoystick.dx * stats.moveSpeed * dt,
        this._moveJoystick.dy * stats.moveSpeed * dt
      );
    } else {
      let kx = 0, ky = 0;
      if (this._keys['KeyW']     || this._keys['ArrowUp'])    ky -= 1;
      if (this._keys['KeyS']     || this._keys['ArrowDown'])  ky += 1;
      if (this._keys['KeyA']     || this._keys['ArrowLeft'])  kx -= 1;
      if (this._keys['KeyD']     || this._keys['ArrowRight']) kx += 1;
      if (kx !== 0 || ky !== 0) {
        const len = Math.hypot(kx, ky);
        this._camera.move((kx / len) * stats.moveSpeed * dt, (ky / len) * stats.moveSpeed * dt);
      }
    }

    this._livesSystem.update(dt);
    this._spawner.update(dt, this._enemies);

    // Update enemies
    for (const enemy of this._enemies) {
      if (enemy.active) enemy.update(dt, this._camera);
    }

    // Remove dead enemies
    this._enemies = this._enemies.filter((e) => e.active);

    // Boss-must-die: clear level as soon as the boss is dead
    if (this._bossLevel && !this._enemies.some((e) => e.type === 'boss')) {
      this._onLevelClear();
      return;
    }

    // Update player weapons
    this._player.update(dt, this._laserJoystick, this._arcJoystick, this._camera);

    // Combat resolution
    this._combat.score = this._score;
    this._combat.resolveLaser(this._player.laser, this._enemies);
    this._combat.resolveArc(this._player.arc, this._enemies);
    this._score = this._combat.score;

    const hitResult = this._combat.resolveEnemyPlayerCollisions(this._enemies, this._camera);
    if (hitResult) {
      this._hitFlashTimer = 0.3;
      if (hitResult === 'died' || hitResult === 'game_over') {
        this._onPlayerDied(hitResult);
      }
    }

    if (this._hitFlashTimer > 0) this._hitFlashTimer -= dt;

    // Level timer
    this._levelTimer.update(dt);
    if (this._levelTimer.done) {
      this._onLevelClear();
    }
  }

  _draw() {
    const renderer = this._renderer;

    if (this._scene === SCENE.PLAYING || this._scene === SCENE.DIED) {
      renderer.drawGame({
        camera: this._camera,
        enemies: this._enemies,
        player: this._player,
        livesSystem: this._livesSystem,
        hud: this._hud,
        levelTimer: this._levelTimer,
        levelNumber: this._levelNumber,
        score: this._score,
        hitFlashTimer: this._hitFlashTimer,
      });
      renderer.drawUI((ctx) => {
        this._moveJoystick.draw(ctx);
        this._laserJoystick.draw(ctx);
        this._arcJoystick.draw(ctx);
        this._drawFreezeButton(ctx);
      });
      return;
    }

    // For overlay scenes, still render the game world behind as backdrop
    if (this._scene !== SCENE.LEVEL_INTRO) {
      renderer.drawGame({
        camera: this._camera,
        enemies: this._enemies,
        player: this._player,
        livesSystem: this._livesSystem,
        hud: this._hud,
        levelTimer: this._levelTimer,
        levelNumber: this._levelNumber,
        score: this._score,
        hitFlashTimer: 0,
      });
    } else {
      // Black background for intro
      renderer.drawUI((ctx, W, H) => {
        ctx.fillStyle = '#05050f';
        ctx.fillRect(0, 0, W, H);
      });
    }

    switch (this._scene) {
      case SCENE.LEVEL_INTRO:
        renderer.drawOverlay((ctx, W, H) => this._levelIntro.draw(ctx, W, H));
        break;
      case SCENE.LEVEL_CLEAR:
        renderer.drawOverlay((ctx, W, H) => this._levelClear.draw(ctx, W, H));
        break;
      case SCENE.UPGRADE:
        renderer.drawOverlay((ctx, W, H) => this._upgradeScreen.draw(ctx, W, H));
        break;
      case SCENE.GAME_OVER:
        renderer.drawOverlay((ctx, W, H) => this._gameOver.draw(ctx, W, H));
        break;
    }
  }
}
