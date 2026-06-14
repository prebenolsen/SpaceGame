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

// ─── Level list ──────────────────────────────────────────────────────────────
// duration  — seconds (or null = no timer, boss must die to advance)
// isBoss    — true shows "BOSS" on intro screen and disables the HUD timer
// waves     — mix of once() and wave() entries; enemies spawn for the full
//             level duration so the player always has targets to fight
export const LEVELS = [
  // ── Level 1 — Tutorial ──────────────────────────────────────────────────────
  {
    duration: 15,
    isBoss: false,
    waves: [
      ...wave('drone', 15, { startTime: 2, interval: 8, speedMult: 1.0 }),
    ],
  },

  // ── Level 2 — Tutorial ──────────────────────────────────────────────────────
  {
    duration: 20,
    isBoss: false,
    waves: [
      ...wave('drone', 20, { startTime: 2, interval: 5, speedMult: 1.0 }),
    ],
  },

  // ── Level 3 ─────────────────────────────────────────────────────────────────
  {
    duration: 30,
    isBoss: false,
    waves: [
      ...wave('drone',  10, { startTime: 2,  interval: 5,  speedMult: 1.15 }),
      ...wave('rusher', 15, { startTime: 12, interval: 18, speedMult: 1.15 }),
    ],
  },

  // ── Level 4 ─────────────────────────────────────────────────────────────────
  {
    duration: 30,
    isBoss: false,
    waves: [
      ...wave('drone',    60, { startTime: 2,  interval: 5 }),
      ...wave('rusher',   60, { startTime: 8,  interval: 14, speedMult: 1.2 }),
      ...wave('miniboss', 60, { startTime: 10, interval: 25 }),
    ],
  },

  // ── Level 5 — Boss ──────────────────────────────────────────────────────────
  // duration: null  →  no timer; the boss must die to advance
  {
    duration: null,
    isBoss: true,
    waves: [
      ...once('boss', 3, { speedMult: 1.30 }),
      ...wave('drone', BOSS_FILL, { startTime: 15, interval: 15, speedMult: 1.30 }),
    ],
  },

  // ── Level 6 ─────────────────────────────────────────────────────────────────
  {
    duration: 60,
    isBoss: false,
    waves: [
      ...wave('drone',  60, { startTime: 2, interval: 4,  healthMult: 1.2 }),
      ...wave('rusher', 60, { startTime: 6, interval: 10 }),
    ],
  },

  // ── Level 7 ─────────────────────────────────────────────────────────────────
  {
    duration: 60,
    isBoss: false,
    waves: [
      ...wave('drone', 60, { startTime: 2,  interval: 4,  healthMult: 1.5, speedMult: 1.45 }),
      ...wave('tank',  60, { startTime: 12, interval: 20, speedMult: 1.45 }),
    ],
  },

  // ── Level 8 ─────────────────────────────────────────────────────────────────
  {
    duration: 75,
    isBoss: false,
    waves: [
      ...wave('drone',  75, { startTime: 2,  interval: 3.5, healthMult: 1.5, speedMult: 1.2 }),
      ...wave('rusher', 75, { startTime: 4,  interval: 8 }),
      ...wave('tank',   75, { startTime: 18, interval: 25 }),
    ],
  },

  // ── Level 9 ─────────────────────────────────────────────────────────────────
  {
    duration: 75,
    isBoss: false,
    waves: [
      ...wave('drone',    75, { startTime: 2, interval: 3,  healthMult: 1.5, speedMult: 1.60 }),
      ...wave('rusher',   75, { startTime: 5, interval: 8,                   speedMult: 1.60 }),
      ...wave('miniboss', 75, { startTime: 8, interval: 22, healthMult: 1.2, speedMult: 1.60 }),
    ],
  },

  // ── Level 10 — Boss + companions ────────────────────────────────────────────
  // duration: null  →  no timer; the boss must die to advance
  {
    duration: null,
    isBoss: true,
    waves: [
      ...once('boss', 3, { healthMult: 2 }),
      ...wave('drone', BOSS_FILL, { startTime: 12, interval: 10 }),
    ],
  },
];

// ─── Auto-scale beyond level 10 ──────────────────────────────────────────────
// Each extra level tightens the spawn interval so more enemies are on screen
// simultaneously. The floor of 1.5 s prevents the game from becoming a wall of
// enemies even at very high levels.
export function getLevelConfig(levelIndex) {
  if (levelIndex < LEVELS.length) return LEVELS[levelIndex];

  const extra   = levelIndex - LEVELS.length;
  const scale   = 1 + extra * 0.15;
  const isBoss  = (levelIndex + 1) % 5 === 0;
  const dur     = 60;
  const interval = Math.max(1.5, 5 / scale);

  if (isBoss) {
    return {
      duration: null,
      isBoss: true,
      waves: [
        ...once('boss', 3, { healthMult: scale }),
        ...wave('drone', BOSS_FILL, {
          startTime:  12,
          interval:   Math.max(5, 12 - extra),
          healthMult: scale,
        }),
      ],
    };
  }

  return {
    duration: dur,
    isBoss: false,
    waves: [
      ...wave('drone',  dur, { startTime: 2,  interval,              healthMult: scale, speedMult: Math.min(Math.max(1, scale * 0.8), 2.5) }),
      ...wave('rusher', dur, { startTime: 5,  interval: interval * 2.5 }),
      ...wave('tank',   dur, { startTime: 12, interval: interval * 5 }),
    ],
  };
}
