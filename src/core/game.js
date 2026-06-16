import { SCENE } from './scene.js';
import { Camera } from './camera.js';
import { Timer } from './timer.js';
import { Spawner } from '../systems/spawner.js';
import { CombatSystem } from '../systems/combat.js';
import { LivesSystem } from '../systems/lives.js';
import { getPlayerStats, pickUpgradeChoices, applyUpgrade } from '../systems/upgrade.js';
import { getLevelConfig } from '../levels/level-config.js';
import { Player } from '../entities/player.js';
import { Drone } from '../entities/enemies/drone.js';
import { HUD } from '../ui/hud.js';
import { LandingScreen } from '../ui/landing.js';
import { LevelIntroScreen } from '../ui/level-intro.js';
import { LevelClearScreen } from '../ui/level-clear.js';
import { LevelSelectScreen } from '../ui/level-select.js';
import { UpgradeScreen } from '../ui/upgrade-screen.js';
import { GameOverScreen } from '../ui/game-over.js';
import { Joystick } from '../ui/joystick.js';
import { Renderer, GAME_ZOOM } from '../rendering/renderer.js';
import { SoundManager } from '../audio/sound-manager.js';
import { saveGame, loadGame, clearSave, defaultSave } from '../utils/storage.js';
import { clamp } from '../utils/math.js';

const SCORE_MILESTONES = [500, 1500, 3000, 5000];

export class Game {
  constructor(canvas) {
    this._renderer = new Renderer(canvas);
    this._sound = new SoundManager();
    this._camera = new Camera();
    this._livesSystem = new LivesSystem(5, 3);
    this._player = new Player();
    this._hud = new HUD();
    this._landing = new LandingScreen();
    this._levelIntro = new LevelIntroScreen();
    this._levelClear = new LevelClearScreen();
    this._levelSelect = new LevelSelectScreen();
    this._upgradeScreen = new UpgradeScreen();
    this._gameOver = new GameOverScreen();

    this._enemies = [];
    this._scene = SCENE.LEVEL_INTRO;
    this._levelTimer = new Timer(60);
    this._bossLevel = false;
    this._bossHasSpawned = false;
    this._hitFlashTimer = 0;
    this._levelNumber = 0;
    this._upgrades = defaultSave().upgrades;
    this._score = 0;
    this._scoreUpgradeMilestones = 0;
    this._levelStartScore = 0;

    // Replay state
    this._replayMode = false;
    this._replaySavedState = null;
    this._maxClearedLevel = 0;
    this._levelHighScores = {};

    // Tutorial state — _tutorialPhase 0=none, 1=Tutorial1, 2=Tutorial2
    this._tutorialPhase = 0;
    this._tut1Step = 0;       // 1=laser phase, 2=arc phase, 3=2s wait, 4=complete overlay
    this._tut1WaitTimer = 0;
    this._tut1CompleteRect = null;
    this._tut2Step = 0;       // 1=tooltip visible, 2=drone chasing
    this._tut2TooltipTimer = 0;

    this._moveJoystick = null;
    this._laserJoystick = null;
    this._arcJoystick = null;
    this._freezeButton = null;
    this._freezeCharges = 1;
    this._spawner = null;
    this._combat = null;
    this._keys = {};
    this._shipAngle = -Math.PI / 2;

    this._lastTime = 0;
    this._raf = null;
    this._safeTop = 0;
    this._safeBottom = 0;
  }

  init() {
    this._sound.init();
    this._resize();

    const save = loadGame();
    if (save) {
      this._levelNumber = save.level;
      this._livesSystem.lives = save.lives;
      this._upgrades = save.upgrades;
      this._score = save.score ?? save.totalScore ?? 0;
      this._scoreUpgradeMilestones = save.scoreUpgradeMilestones ?? 0;
      this._maxClearedLevel = save.maxClearedLevel ?? Math.max(0, (save.level || 0) - 1);
      this._levelHighScores = save.levelHighScores ?? {};
    }

    this._combat = new CombatSystem(this._livesSystem, this._sound);
    this._applyUpgrades();

    if (this._levelNumber === 0) {
      this._showLanding();
    } else {
      this._startLevelIntro();
    }

    this._bindInput();
    this._bindResize();
    this._lastTime = performance.now();
    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  _getSafeInset(side) {
    const val = getComputedStyle(document.documentElement).getPropertyValue(`--sai-${side}`).trim();
    return parseInt(val) || 0;
  }

  _resize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    this._safeTop = this._getSafeInset('top');
    this._safeBottom = this._getSafeInset('bottom');
    this._renderer.resize(W, H);
    this._layoutJoysticks(W, H);
  }

  _layoutJoysticks(W, H) {
    const pad = 16;
    const r = 55;
    const bottomY = H - pad - r - this._safeBottom;
    if (!this._moveJoystick) {
      this._moveJoystick = new Joystick(pad + r * 3, bottomY, r);
      this._laserJoystick = new Joystick(W - pad - r * 5 - 20, bottomY, r);
      this._arcJoystick = new Joystick(W - pad - r * 3, bottomY, r);
    } else {
      this._moveJoystick.reposition(pad + r * 3, bottomY);
      this._laserJoystick.reposition(W - pad - r * 5 - 20, bottomY);
      this._arcJoystick.reposition(W - pad - r * 3, bottomY);
    }
    const btnR = 28;
    const btnX = (W - pad - r * 5 - 20 + W - pad - r * 3) / 2;
    const btnY = bottomY - r - 24 - btnR;
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
        for (const j of this._activeJoysticks()) j.onTouchMove(t);
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
      for (const j of this._activeJoysticks()) j.onTouchMove(fakeTouch);
    });
    canvas.addEventListener('mouseup', (e) => {
      mouseDown = false;
      const fakeTouch = { identifier: 0, clientX: e.clientX, clientY: e.clientY };
      this._onTouchEnd(fakeTouch);
    });

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

  // Returns which joysticks are interactive in the current state
  _activeJoysticks() {
    if (this._tutorialPhase === 1) {
      if (this._tut1Step === 1) return [this._laserJoystick];
      if (this._tut1Step === 2) return [this._arcJoystick];
      return [];
    }
    if (this._tutorialPhase === 2) return [this._moveJoystick];
    return [this._moveJoystick, this._laserJoystick, this._arcJoystick];
  }

  _onTouchStart(touch) {
    // Tutorial 1 complete overlay — any tap advances to Tutorial 2
    if (this._tutorialPhase === 1 && this._tut1Step === 4) {
      this._startTutorial2();
      return;
    }

    // Overlay scene handlers
    if (this._scene === SCENE.LANDING) {
      this._landing.handleTouchStart(touch.clientX, touch.clientY);
      return;
    }
    if (this._scene === SCENE.LEVEL_INTRO) {
      this._levelIntro.handleTouchStart(touch.clientX, touch.clientY);
      return;
    }
    if (this._scene === SCENE.LEVEL_CLEAR) {
      this._levelClear.handleTouchStart(touch.clientX, touch.clientY);
      return;
    }
    if (this._scene === SCENE.LEVEL_SELECT) {
      this._levelSelect.handleTouchStart(touch.clientX, touch.clientY);
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

    // During tutorials: only route to the active joystick(s)
    if (this._tutorialPhase > 0) {
      const joysticks = this._activeJoysticks();
      let best = null, bestDist = Infinity;
      for (const j of joysticks) {
        const dist = Math.hypot(touch.clientX - j.baseX, touch.clientY - j.baseY);
        if (dist <= j.radius * 2 && dist < bestDist) { best = j; bestDist = dist; }
      }
      if (best) best.onTouchStart(touch);
      return;
    }

    // Freeze button (level 4+, normal play only)
    if (this._scene === SCENE.PLAYING && this._freezeButton && this._levelNumber >= 4) {
      const d = Math.hypot(touch.clientX - this._freezeButton.x, touch.clientY - this._freezeButton.y);
      if (d <= this._freezeButton.radius * 1.5 && this._freezeCharges > 0) {
        this._activateFreeze();
        return;
      }
    }

    // Normal joystick activation
    const joysticks = [this._moveJoystick, this._laserJoystick, this._arcJoystick];
    let best = null, bestDist = Infinity;
    for (const j of joysticks) {
      const dist = Math.hypot(touch.clientX - j.baseX, touch.clientY - j.baseY);
      if (dist <= j.radius * 2 && dist < bestDist) { best = j; bestDist = dist; }
    }
    if (best) best.onTouchStart(touch);
  }

  _onTouchEnd(touch) {
    if (this._scene === SCENE.LANDING) {
      this._landing.handleTouchEnd(touch.clientX, touch.clientY);
      return;
    }
    if (this._scene === SCENE.LEVEL_INTRO) {
      this._levelIntro.handleTouchEnd(touch.clientX, touch.clientY);
      return;
    }
    if (this._scene === SCENE.LEVEL_CLEAR) {
      this._levelClear.handleTouchEnd(touch.clientX, touch.clientY);
      return;
    }
    if (this._scene === SCENE.LEVEL_SELECT) {
      this._levelSelect.handleTouchEnd(touch.clientX, touch.clientY);
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

  // ── Landing page ─────────────────────────────────────────────────────────────

  _showLanding() {
    this._tutorialPhase = 0;
    this._scene = SCENE.LANDING;
    this._enemies = [];
    this._landing.show(
      () => this._startTutorial1(),
      () => this._onCampaignButton(),
      this._maxClearedLevel,
    );
  }

  _onCampaignButton() {
    if (this._maxClearedLevel > 0) {
      this._showLevelSelect();
    } else {
      if (this._levelNumber === 0) this._levelNumber = 1;
      this._save();
      this._startLevelIntro();
    }
  }

  _showLevelSelect() {
    this._scene = SCENE.LEVEL_SELECT;
    this._levelSelect.show(
      this._maxClearedLevel,
      this._maxClearedLevel + 1,
      this._levelHighScores,
      (level) => this._onLevelSelected(level),
      () => this._showLanding(),
    );
  }

  _onLevelSelected(level) {
    if (level <= this._maxClearedLevel) {
      this._replayMode = true;
      this._replaySavedState = {
        level: this._levelNumber,
        lives: this._livesSystem.lives,
        score: this._score,
        upgrades: { ...this._upgrades },
        scoreUpgradeMilestones: this._scoreUpgradeMilestones,
      };
      this._livesSystem.lives = 3;
      this._levelNumber = level;
    } else {
      this._replayMode = false;
      this._levelNumber = level;
      this._save();
    }
    this._startLevelIntro();
  }

  _exitReplay(keepProgress) {
    if (!this._replayMode) return;
    this._replayMode = false;
    this._livesSystem.lives = this._replaySavedState.lives;
    if (!keepProgress) {
      this._score = this._replaySavedState.score;
      this._upgrades = this._replaySavedState.upgrades;
      this._scoreUpgradeMilestones = this._replaySavedState.scoreUpgradeMilestones;
      this._levelNumber = this._replaySavedState.level;
      this._applyUpgrades();
    }
  }

  // ── Tutorial 1 ─────────────────────────────────────────────────────────────

  _resetInputState() {
    this._moveJoystick.reset();
    this._laserJoystick.reset();
    this._arcJoystick.reset();
    this._keys = {};
  }

  _startTutorial1() {
    this._tutorialPhase = 1;
    this._tut1Step = 1;
    this._tut1WaitTimer = 0;
    this._resetInputState();
    this._scene = SCENE.PLAYING;
    this._enemies = [];
    this._score = 0;
    this._hitFlashTimer = 0;
    this._livesSystem.resetHits();
    this._spawner.reset();
    this._levelTimer.reset(Infinity); // not used for clearing

    // One stationary drone placed to the right — clearly on screen
    const cx = this._camera.playerWorldX;
    const cy = this._camera.playerWorldY;
    this._enemies.push(new Drone({ wx: cx + 270, wy: cy - 60, speedMult: 0 }));

    this._sound.resume();
  }

  _updateTutorial1(dt) {
    if (this._tut1Step === 3) {
      this._tut1WaitTimer -= dt;
      if (this._tut1WaitTimer <= 0) this._tut1Step = 4;
      return;
    }
    if (this._tut1Step === 4) return;

    this._livesSystem.update(dt);

    for (const enemy of this._enemies) {
      if (enemy.active) enemy.update(dt, this._camera);
    }
    this._enemies = this._enemies.filter(e => e.active);

    if (this._tut1Step === 1) {
      if (this._laserJoystick.active) this._shipAngle = this._laserJoystick.angle;
      this._player.update(dt, this._laserJoystick, null, this._camera);
      this._combat.score = this._score;
      this._combat.resolveLaser(this._player.laser, this._enemies);
      this._score = this._combat.score;

      if (this._enemies.length === 0) {
        this._tut1Step = 2;
        // Two drones close together so both fit in the default arc cone
        const cx = this._camera.playerWorldX;
        const cy = this._camera.playerWorldY;
        this._enemies.push(
          new Drone({ wx: cx + 70, wy: cy - 40, speedMult: 0 }),
          new Drone({ wx: cx + 70, wy: cy + 40, speedMult: 0 }),
        );
      }
    } else if (this._tut1Step === 2) {
      if (this._arcJoystick.active) this._shipAngle = this._arcJoystick.angle;
      this._player.update(dt, null, this._arcJoystick, this._camera);
      this._combat.score = this._score;
      this._combat.resolveArc(this._player.arc, this._enemies);
      this._score = this._combat.score;

      if (this._enemies.length === 0) {
        this._tut1Step = 3;
        this._tut1WaitTimer = 2.0;
      }
    }

    if (this._hitFlashTimer > 0) this._hitFlashTimer -= dt;
  }

  // ── Tutorial 2 ─────────────────────────────────────────────────────────────

  _startTutorial2() {
    this._tutorialPhase = 2;
    this._tut2Step = 1;
    this._tut2TooltipTimer = 7; // seconds to show the top tooltip
    this._resetInputState();
    this._scene = SCENE.PLAYING;
    this._enemies = [];
    this._score = 0;
    this._hitFlashTimer = 0;
    this._livesSystem.resetHits();
    this._spawner.reset();
    this._levelTimer.reset(20);

    // Clear any lingering weapon visuals from Tutorial 1 — the player never fires
    // in Tutorial 2, so their update() (which decays these) won't run. This covers
    // both the fired projectiles AND the aim cones/lines (arcAim/laserAim), which
    // stay drawn while their `.active` flag is true.
    this._player.arc.active = false;
    this._player.laser.active = false;
    this._player.arcAim.active = false;
    this._player.laserAim.active = false;

    this._sound.resume();
  }

  _updateTutorial2(dt) {
    this._livesSystem.update(dt);

    // Movement via joystick or WASD
    const stats = this._player.stats;
    if (this._moveJoystick.active) {
      this._camera.move(
        this._moveJoystick.dx * stats.moveSpeed * dt,
        this._moveJoystick.dy * stats.moveSpeed * dt
      );
      this._shipAngle = this._moveJoystick.angle;
    } else {
      let kx = 0, ky = 0;
      if (this._keys['KeyW']     || this._keys['ArrowUp'])    ky -= 1;
      if (this._keys['KeyS']     || this._keys['ArrowDown'])  ky += 1;
      if (this._keys['KeyA']     || this._keys['ArrowLeft'])  kx -= 1;
      if (this._keys['KeyD']     || this._keys['ArrowRight']) kx += 1;
      if (kx !== 0 || ky !== 0) {
        const len = Math.hypot(kx, ky);
        this._camera.move((kx / len) * stats.moveSpeed * dt, (ky / len) * stats.moveSpeed * dt);
        this._shipAngle = Math.atan2(ky, kx);
      }
    }

    // Tooltip countdown → then spawn the chasing drone
    if (this._tut2Step === 1) {
      this._tut2TooltipTimer -= dt;
      if (this._tut2TooltipTimer <= 0) {
        this._tut2Step = 2;
        this._enemies.push(
          new Drone({
            wx: this._camera.playerWorldX + 420,
            wy: this._camera.playerWorldY - 80,
            speedMult: 1.1,
          }),
          new Drone({
            wx: this._camera.playerWorldX + 420,
            wy: this._camera.playerWorldY + 80,
            speedMult: 1.1,
          }),
        );
      }
    }

    if (this._tut2Step === 2) {
      for (const enemy of this._enemies) {
        if (enemy.active) enemy.update(dt, this._camera);
      }
      this._enemies = this._enemies.filter(e => e.active);
      // No weapon fire, no damage — player only needs to outrun
    }

    this._levelTimer.update(dt);
    if (this._levelTimer.done) {
      this._completeTutorial2();
    }
  }

  _completeTutorial2() {
    this._tutorialPhase = 0;
    this._levelNumber = 1;
    this._enemies = [];
    this._sound.play('levelClear');
    this._save();
    this._showLanding();
  }

  // ── Normal level flow ───────────────────────────────────────────────────────

  _startLevelIntro() {
    this._scene = SCENE.LEVEL_INTRO;
    this._freezeCharges = 1;
    const config = getLevelConfig(this._levelNumber - 1);
    this._levelIntro.show(this._levelNumber, config.isBoss, () => this._startLevel(), null, null);
  }

  _startLevel() {
    this._levelStartScore = this._score;
    this._resetInputState();
    this._scene = SCENE.PLAYING;
    const config = getLevelConfig(this._levelNumber - 1);
    this._bossLevel = config.isBoss && config.duration == null;
    this._bossHasSpawned = false;
    this._levelTimer.reset(config.duration ?? Infinity);
    this._enemies = [];
    this._livesSystem.resetHits();
    this._spawner.loadLevel(config, this._levelNumber);
    this._sound.resume();
  }

  _onLevelClear() {
    this._sound.play('levelClear');
    this._scene = SCENE.LEVEL_CLEAR;

    const levelScore = this._score - this._levelStartScore;
    const prevBest = this._levelHighScores[this._levelNumber] ?? 0;
    const newBest = levelScore > prevBest;
    if (newBest) this._levelHighScores[this._levelNumber] = levelScore;

    if (!this._replayMode && this._levelNumber > this._maxClearedLevel) {
      this._maxClearedLevel = this._levelNumber;
    }
    this._save();

    this._levelClear.show(
      this._levelNumber, levelScore, this._score,
      newBest ? levelScore : prevBest, newBest, this._replayMode,
      () => this._replayMode ? this._onReplayLevelClearContinue() : this._onLevelClearContinue(),
      () => this._onLevelClearMenu(),
    );
  }

  _onLevelClearContinue() {
    const basePicks = this._levelNumber >= 8 ? 2 : 1;
    const earned = SCORE_MILESTONES.filter(m => this._score >= m).length;
    const extraPicks = Math.max(0, earned - this._scoreUpgradeMilestones);
    this._scoreUpgradeMilestones = earned;
    const totalPicks = basePicks + extraPicks;
    this._startUpgradePhase(totalPicks, totalPicks);
  }

  _onReplayLevelClearContinue() {
    const nextLevel = this._levelNumber + 1;
    if (nextLevel > this._maxClearedLevel) {
      // Stepping into new territory — exit replay and continue as a real run
      this._exitReplay(true);
      const basePicks = this._levelNumber >= 8 ? 2 : 1;
      const earned = SCORE_MILESTONES.filter(m => this._score >= m).length;
      const extraPicks = Math.max(0, earned - this._scoreUpgradeMilestones);
      this._scoreUpgradeMilestones = earned;
      this._startUpgradePhase(basePicks + extraPicks, basePicks + extraPicks);
    } else {
      // Still replaying cleared levels — give one pick, upgrades reset on exit anyway
      const basePicks = this._levelNumber >= 8 ? 2 : 1;
      this._startUpgradePhase(basePicks, basePicks);
    }
  }

  _onLevelClearMenu() {
    if (this._replayMode) {
      this._exitReplay(false);
    } else {
      // Advance past cleared level without upgrades; player chose menu over picks
      this._levelNumber++;
    }
    this._save();
    this._showLanding();
  }

  _startUpgradePhase(picksRemaining, totalPicks) {
    const choices = pickUpgradeChoices(this._upgrades, this._levelNumber);
    if (choices.length === 0 || picksRemaining === 0) {
      this._advanceLevel();
      return;
    }
    this._scene = SCENE.UPGRADE;
    this._upgradeScreen.show(choices, this._upgrades, picksRemaining, totalPicks, (id) => {
      this._upgrades = applyUpgrade(this._upgrades, id);
      this._applyUpgrades();
      this._startUpgradePhase(picksRemaining - 1, totalPicks);
    });
  }

  _advanceLevel() {
    this._levelNumber++;
    if (!this._replayMode && this._levelNumber - 1 > this._maxClearedLevel) {
      this._maxClearedLevel = this._levelNumber - 1;
    }
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
      if (this._replayMode) {
        this._exitReplay(false);
        this._save();
        this._showLanding();
        return;
      }
      this._sound.play('gameOver');
      this._scene = SCENE.GAME_OVER;
      this._gameOver.show(this._score, () => this._restartGame());
    } else {
      this._freezeCharges++;
      this._scene = SCENE.DIED;
      setTimeout(() => this._startLevel(), 1500);
    }
  }

  _restartGame() {
    this._levelNumber = 0;
    this._tutorialPhase = 0;
    this._maxClearedLevel = 0;
    this._replayMode = false;
    this._replaySavedState = null;
    this._livesSystem.reset();
    this._upgrades = defaultSave().upgrades;
    this._score = 0;
    this._scoreUpgradeMilestones = 0;
    // _levelHighScores preserved across runs
    this._applyUpgrades();
    this._save();
    this._showLanding();
  }

  _resetGame() {
    clearSave();
    this._levelNumber = 0;
    this._tutorialPhase = 0;
    this._maxClearedLevel = 0;
    this._replayMode = false;
    this._replaySavedState = null;
    this._livesSystem.reset();
    this._upgrades = defaultSave().upgrades;
    this._score = 0;
    this._scoreUpgradeMilestones = 0;
    this._levelHighScores = {};
    this._applyUpgrades();
    this._showLanding();
  }

  _save() {
    const r = this._replayMode ? this._replaySavedState : null;
    saveGame({
      level:                  r ? r.level                  : this._levelNumber,
      maxClearedLevel:        this._maxClearedLevel,
      lives:                  r ? r.lives                  : this._livesSystem.lives,
      upgrades:               r ? r.upgrades               : this._upgrades,
      score:                  r ? r.score                  : this._score,
      scoreUpgradeMilestones: r ? r.scoreUpgradeMilestones : this._scoreUpgradeMilestones,
      levelHighScores:        this._levelHighScores,
    });
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────

  _drawFreezeButton(ctx) {
    const btn = this._freezeButton;
    if (!btn || this._levelNumber < 4) return;
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
    ctx.globalAlpha = available ? 0.85 : 0.4;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = available ? '#90caf9' : '#888';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Emergency button!', btn.x, btn.y - btn.radius - 4);
    ctx.restore();
  }

  _drawJoystickTooltips(ctx) {
    const r = this._moveJoystick.radius;
    const gap = 10;

    const drawLabel = (joy, color, lines) => {
      const x = joy.baseX;
      const y = joy.baseY - r - gap;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      if (lines.length === 1) {
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(lines[0], x, y);
      } else {
        ctx.font = '11px sans-serif';
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.65;
        ctx.fillText(lines[1], x, y);
        ctx.globalAlpha = 0.85;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(lines[0], x, y - 14);
      }
      ctx.restore();
    };

    drawLabel(this._moveJoystick, '#ffffff', ['Move']);
    drawLabel(this._laserJoystick, '#42a5f5', ['Laser', 'High dmg']);
    drawLabel(this._arcJoystick, '#ce93d8', ['Arc', 'Wide cone']);
  }

  // Tutorial-specific UI: which joystick(s) to draw and which tooltip to show
  _drawTutorialUI(ctx, W, H) {
    if (this._tutorialPhase === 1) {
      if (this._tut1Step === 1) {
        this._laserJoystick.draw(ctx, '#42a5f5');
        this._drawTutBottomTooltip(ctx, W, H, [
          'Win by killing all your enemies.',
          'Shoot them with your laser!',
        ]);
      } else if (this._tut1Step === 2) {
        this._arcJoystick.draw(ctx, '#ce93d8');
        this._drawTutBottomTooltip(ctx, W, H, [
          'The Arc is effective at shorter range,',
          'and can hit targets that are spread.',
        ]);
      }
      // Steps 3 and 4: no joystick drawn
    } else if (this._tutorialPhase === 2) {
      this._moveJoystick.draw(ctx, '#ffffff');
      if (this._tut2Step === 1) {
        this._drawTut2TopTooltip(ctx, W, H);
      }
    }
  }

  // Yellow info box centered at the bottom, nested between the steer and laser joysticks
  _drawTutBottomTooltip(ctx, W, H, lines) {
    const lineH = 22;
    const padX = 16, padY = 10;
    const font = '14px sans-serif';

    ctx.save();
    ctx.font = font;
    // Hug the widest line so the box never grows wider than its text needs.
    let textW = 0;
    for (const line of lines) textW = Math.max(textW, ctx.measureText(line).width);

    const boxH = lines.length * lineH + padY * 2;
    // Hug the text (never narrower than it — that would clip), centered on screen.
    const boxW = Math.min(textW + padX * 2, W - 24);
    const boxX = (W - boxW) / 2;
    // Sit low, down in the joystick band: anchor the box bottom a short way into the
    // top of the joystick circles so it reads as the bottom of the screen, not mid-screen.
    const steer = this._moveJoystick;
    const boxBottom = (steer.baseY - steer.radius) + steer.radius * 0.75;
    const boxY = boxBottom - boxH;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,224,130,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffe082';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], W / 2, boxY + padY + i * lineH);
    }
    ctx.restore();
  }

  // White info box just below the HUD timer (Tutorial 2)
  _drawTut2TopTooltip(ctx, W, H) {
    const lines = [
      "If you can't kill all your enemies, you can outrun them!",
      'Use the left joystick to steer and avoid the enemies.',
      'Run out the clock, and you win!',
    ];
    const lineH = 20;
    const padX = 16, padY = 10;
    const boxH = lines.length * lineH + padY * 2;
    const boxW = Math.min(W * 0.92, 520);
    const boxX = (W - boxW) / 2;
    const boxY = 46 + this._safeTop; // just below the HUD timer

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,30,0.82)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], W / 2, boxY + padY + i * lineH);
    }
    ctx.restore();
  }

  // "Tutorial 1 completed!" full-screen overlay
  _drawTut1CompleteScreen(ctx, W, H) {
    const cy = H / 2;
    ctx.save();

    ctx.fillStyle = 'rgba(0,0,20,0.82)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';

    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#a5d6a7';
    ctx.fillText('Tutorial 1', W / 2, cy - 44);

    ctx.font = '22px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('completed!', W / 2, cy - 4);

    // Continue button
    const bw = 200, bh = 50;
    const bx = W / 2 - bw / 2;
    const by = cy + 28;
    this._tut1CompleteRect = { x: bx, y: by, w: bw, h: bh };

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CONTINUE', W / 2, by + 32);

    ctx.restore();
  }

  _loop(now) {
    const dt = clamp((now - this._lastTime) / 1000, 0, 0.1);
    this._lastTime = now;
    this._update(dt);
    this._draw();
    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  _update(dt) {
    if (this._scene !== SCENE.PLAYING) return;

    // Tutorial updates — fully self-contained, skip normal game logic
    if (this._tutorialPhase === 1) { this._updateTutorial1(dt); return; }
    if (this._tutorialPhase === 2) { this._updateTutorial2(dt); return; }

    // Normal play
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
        this._shipAngle = Math.atan2(ky, kx);
      }
    }

    this._livesSystem.update(dt);
    this._spawner.update(dt, this._enemies);

    for (const enemy of this._enemies) {
      if (enemy.active) enemy.update(dt, this._camera);
    }

    this._enemies = this._enemies.filter((e) => e.active);

    if (this._bossLevel && this._enemies.some((e) => e.type === 'boss')) {
      this._bossHasSpawned = true;
    }
    if (this._bossLevel && this._bossHasSpawned && !this._enemies.some((e) => e.type === 'boss')) {
      this._onLevelClear();
      return;
    }

    if (this._laserJoystick.active) {
      this._shipAngle = this._laserJoystick.angle;
    } else if (this._arcJoystick.active) {
      this._shipAngle = this._arcJoystick.angle;
    } else if (this._moveJoystick.active) {
      this._shipAngle = this._moveJoystick.angle;
    }

    this._player.update(dt, this._laserJoystick, this._arcJoystick, this._camera);

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

    const laserHitResult = this._combat.resolveBossLasers(this._enemies, this._camera);
    if (laserHitResult) {
      this._hitFlashTimer = 0.3;
      if (laserHitResult === 'died' || laserHitResult === 'game_over') {
        this._onPlayerDied(laserHitResult);
      }
    }

    if (this._hitFlashTimer > 0) this._hitFlashTimer -= dt;

    this._levelTimer.update(dt);
    if (this._levelTimer.done) {
      this._onLevelClear();
    }
  }

  _draw() {
    const renderer = this._renderer;

    // ── Tutorial rendering ──────────────────────────────────────────────────
    if (this._tutorialPhase > 0) {
      const hudTitle = this._tutorialPhase === 1 ? 'TUTORIAL 1' : 'TUTORIAL 2';
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
        safeTop: this._safeTop,
        shipAngle: this._shipAngle,
        hudTitle,
      });
      renderer.drawUI((ctx, W, H) => this._drawTutorialUI(ctx, W, H));
      if (this._tutorialPhase === 1 && this._tut1Step === 4) {
        renderer.drawOverlay((ctx, W, H) => this._drawTut1CompleteScreen(ctx, W, H));
      }
      return;
    }

    // ── Landing page ────────────────────────────────────────────────────────
    if (this._scene === SCENE.LANDING) {
      renderer.drawOverlay((ctx, W, H) => this._landing.draw(ctx, W, H));
      return;
    }

    // ── Level select ─────────────────────────────────────────────────────────
    if (this._scene === SCENE.LEVEL_SELECT) {
      renderer.drawOverlay((ctx, W, H) => this._levelSelect.draw(ctx, W, H));
      return;
    }

    // ── Normal rendering ────────────────────────────────────────────────────
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
        safeTop: this._safeTop,
        shipAngle: this._shipAngle,
      });
      renderer.drawUI((ctx) => {
        this._moveJoystick.draw(ctx, '#ffffff');
        this._laserJoystick.draw(ctx, '#42a5f5');
        this._arcJoystick.draw(ctx, '#ce93d8');
        this._drawFreezeButton(ctx);
        if (this._levelNumber === 1) this._drawJoystickTooltips(ctx);
      });
      return;
    }

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
        safeTop: this._safeTop,
        shipAngle: this._shipAngle,
      });
    } else {
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
