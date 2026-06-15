// ─── Spawn helpers ───────────────────────────────────────────────────────────
// wave()  — fills `duration` seconds with spawn entries of the given `type`.
//           Each entry gets a random ± time offset so spawns feel fluid rather
//           than metronomic; entries are returned sorted by actual spawn time.
//
//   type       — 'drone' | 'rusher' | 'tank' | 'miniboss' | 'boss'
//   duration   — total seconds to fill with spawns
//   startTime  — delay before the first spawn
//   interval   — base cadence in seconds between spawns
//   jitter     — ± fraction of interval applied as a random offset (0.35 = ±35 %)
//   healthMult — HP multiplier (1 = base HP)
//   speedMult  — speed multiplier (1 = base speed)
//
function wave(type, duration, { startTime = 2, interval = 6, jitter = 0.35, healthMult = 1, speedMult = 1 } = {}) {
  const entries = [];
  for (let t = startTime; t < duration; t += interval) {
    const offset = (Math.random() * 2 - 1) * jitter * interval;
    entries.push({
      type,
      time: Math.max(startTime, t + offset),
      healthMult,
      speedMult,
    });
  }
  return entries.sort((a, b) => a.time - b.time);
}

// once()  — single spawn entry (boss, surprise miniboss, etc.)
function once(type, time, { healthMult = 1, speedMult = 1 } = {}) {
  return [{ type, time, healthMult, speedMult }];
}

// Companion waves during boss fights are pre-scheduled for this long;
// the boss dying ends the level long before this elapses.
const BOSS_FILL = 300;

// ─── Health multiplier reference (base HP: drone 40 · rusher 30 · tank 150 · miniboss 300 · boss 1500) ──
// Curve is roughly exponential so each level feels meaningfully harder at baseline laser damage (50 dmg/shot).
// Expected shots-to-kill a drone at rank-0 laser per level:
//   L1: 1  L2: 2  L3: 3  L4: 4  L6: 5  L7: 7  L8: 9  L9: ~11

// ─── Level list ──────────────────────────────────────────────────────────────
// duration  — seconds (or null = no timer, boss must die to advance)
// isBoss    — true shows "BOSS" on intro screen and disables the HUD timer
// waves     — mix of once() and wave() entries; enemies spawn for the full
//             level duration so the player always has targets to fight
export const LEVELS = [
  // ── Level 1 — Tutorial ──────────────────────────────────────────────────────
  // Drone base HP 40 < laser 50 dmg → one-shot kills
  {
    duration: 20,
    isBoss: false,
    waves: [
      ...wave('drone', 15, { startTime: 0, interval: 8, speedMult: 1.0 }),
    ],
  },

  // ── Level 2 ─────────────────────────────────────────────────────────────────
  // Drone 1.8× → 72 HP → ~2 shots
  {
    duration: 25,
    isBoss: false,
    waves: [
      ...wave('drone',  30, { startTime: 0,  interval: 4,  healthMult: 1.8, speedMult: 1.25 }),
      ...wave('rusher', 30, { startTime: 10, interval: 15, speedMult: 1.25 }),
    ],
  },

  // ── Level 3 ─────────────────────────────────────────────────────────────────
  // Drone 3.0× → 120 HP → ~3 shots
  {
    duration: 30,
    isBoss: false,
    waves: [
      ...wave('drone',  45, { startTime: 0, interval: 3,  healthMult: 3.0, speedMult: 1.5 }),
      ...wave('rusher', 45, { startTime: 8, interval: 8,  speedMult: 1.5 }),
      ...once('miniboss', 20, { speedMult: 1.5 }),
    ],
  },

  // ── Level 4 ─────────────────────────────────────────────────────────────────
  // Drone 4.5× → 180 HP → ~4 shots
  {
    duration: 30,
    isBoss: false,
    waves: [
      ...wave('drone',  60, { startTime: 0,  interval: 2.5, healthMult: 4.5, speedMult: 1.7 }),
      ...wave('rusher', 60, { startTime: 5,  interval: 5.5, healthMult: 1.8, speedMult: 1.7 }),
      ...wave('tank',   60, { startTime: 15, interval: 20,  speedMult: 1.7 }),
    ],
  },

  // ── Level 5 — Boss ──────────────────────────────────────────────────────────
  // Boss 2.5× → 3750 HP
  {
    duration: null,
    isBoss: true,
    waves: [
      ...once('boss', 3, { healthMult: 2.5, speedMult: 1.5 }),
      ...wave('drone',  BOSS_FILL, { startTime: 10, interval: 8,  healthMult: 4.0, speedMult: 1.5 }),
      ...wave('rusher', BOSS_FILL, { startTime: 0,  interval: 12, healthMult: 2.5, speedMult: 1.5 }),
    ],
  },

  // ── Level 6 ─────────────────────────────────────────────────────────────────
  // Drone 6.0× → 240 HP → ~5 shots
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone',  60, { startTime: 0,  interval: 2.5, healthMult: 6.0,  speedMult: 1.8 }),
      ...wave('rusher', 60, { startTime: 5,  interval: 5,   healthMult: 2.5,  speedMult: 1.8 }),
      ...wave('tank',   60, { startTime: 15, interval: 18,  healthMult: 2.0,  speedMult: 1.8 }),
    ],
  },

  // ── Level 7 ─────────────────────────────────────────────────────────────────
  // Drone 8.0× → 320 HP → ~7 shots
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone',    75, { startTime: 0,  interval: 2,  healthMult: 8.0,  speedMult: 2.0 }),
      ...wave('rusher',   75, { startTime: 4,  interval: 4,  healthMult: 3.5,  speedMult: 2.0 }),
      ...wave('tank',     75, { startTime: 12, interval: 14, healthMult: 3.5,  speedMult: 2.0 }),
      ...wave('miniboss', 75, { startTime: 0,  interval: 30, healthMult: 2.0,  speedMult: 2.0 }),
    ],
  },

  // ── Level 8 ─────────────────────────────────────────────────────────────────
  // Drone 10.5× → 420 HP → ~9 shots
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone',    75, { startTime: 0,  interval: 1.8, healthMult: 10.5, speedMult: 2.2 }),
      ...wave('rusher',   75, { startTime: 3,  interval: 3.5, healthMult: 5.0,  speedMult: 2.2 }),
      ...wave('tank',     75, { startTime: 10, interval: 12,  healthMult: 5.5,  speedMult: 2.2 }),
      ...wave('miniboss', 75, { startTime: 15, interval: 22,  healthMult: 3.5,  speedMult: 2.2 }),
    ],
  },

  // ── Level 9 ─────────────────────────────────────────────────────────────────
  // Drone 13.0× → 520 HP → ~11 shots at baseline; manageable with weapon upgrades
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone',    90, { startTime: 0,  interval: 1.5, healthMult: 13.0, speedMult: 2.5 }),
      ...wave('rusher',   90, { startTime: 3,  interval: 3,   healthMult: 7.0,  speedMult: 2.5 }),
      ...wave('tank',     90, { startTime: 8,  interval: 10,  healthMult: 8.0,  speedMult: 2.5 }),
      ...wave('miniboss', 90, { startTime: 12, interval: 18,  healthMult: 5.0,  speedMult: 2.5 }),
    ],
  },

  // ── Level 10 — Boss + companions ────────────────────────────────────────────
  // Boss 5.0× → 7500 HP
  {
    duration: null,
    isBoss: true,
    waves: [
      ...once('boss', 3, { healthMult: 5.0, speedMult: 1.8 }),
      ...wave('drone',  BOSS_FILL, { startTime: 5,  interval: 6, healthMult: 10.0, speedMult: 1.8 }),
      ...wave('rusher', BOSS_FILL, { startTime: 8,  interval: 6, healthMult: 6.0,  speedMult: 1.8 }),
    ],
  },
];

// ─── Auto-scale beyond level 10 ──────────────────────────────────────────────
// Each extra level tightens the spawn interval so more enemies are on screen
// simultaneously. The floor of 1.5 s prevents the game from becoming a wall of
// enemies even at very high levels.
// enemyScale starts from level-9 territory (~13×) and grows linearly (+2 per level).
// bossScale continues from the level-10 boss (5×) and grows more gently.
export function getLevelConfig(levelIndex) {
  if (levelIndex < LEVELS.length) return LEVELS[levelIndex];

  const extra      = levelIndex - LEVELS.length;
  const enemyScale = 13 + extra * 2;
  const bossScale  = 5  + extra * 0.5;
  const isBoss     = (levelIndex + 1) % 5 === 0;
  const dur        = 45;
  const interval   = Math.max(1.5, 5 / (1 + extra * 0.15));

  if (isBoss) {
    return {
      duration: null,
      isBoss: true,
      waves: [
        ...once('boss', 3, { healthMult: bossScale }),
        ...wave('drone', BOSS_FILL, {
          startTime:  12,
          interval:   Math.max(5, 12 - extra),
          healthMult: enemyScale,
        }),
      ],
    };
  }

  return {
    duration: dur,
    isBoss: false,
    waves: [
      ...wave('drone',  dur, { startTime: 0,  interval,              healthMult: enemyScale, speedMult: Math.min(Math.max(1, enemyScale * 0.05), 2.5) }),
      ...wave('rusher', dur, { startTime: 5,  interval: interval * 2.5, healthMult: Math.round(enemyScale * 0.5) }),
      ...wave('tank',   dur, { startTime: 12, interval: interval * 5,   healthMult: Math.round(enemyScale * 0.6) }),
    ],
  };
}
