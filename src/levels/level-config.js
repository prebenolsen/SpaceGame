// ─── Spawn helpers ───────────────────────────────────────────────────────────
// wave()  — fills `duration` seconds with spawn entries of the given `type`.
//           Each entry gets a random ± time offset so spawns feel fluid rather
//           than metronomic; entries are returned sorted by actual spawn time.
//
//   type       — 'drone' | 'rusher' | 'rusherCluster' | 'tank' | 'miniboss' | 'boss'
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
function once(type, time, { healthMult = 1, speedMult = 1, ...rest } = {}) {
  return [{ type, time, healthMult, speedMult, ...rest }];
}

// Companion waves during boss fights are pre-scheduled for this long;
// the boss dying ends the level long before this elapses.
const BOSS_FILL = 300;

// ─── Health multiplier reference (base HP: drone 40 · rusher 12 · tank 150 · miniboss 600 · boss 1500) ──
// Curve is roughly exponential so each level feels meaningfully harder at baseline laser damage (50 dmg/shot).
// Expected shots-to-kill a drone at rank-0 laser per level:
//   L1: 1  L2: 1  L3: 2  L4: 3  L6: 3  L7: 5  L8: 6  L9: ~8

// ─── Level list ──────────────────────────────────────────────────────────────
// duration  — seconds (or null = no timer, boss must die to advance)
// isBoss    — true shows "BOSS" on intro screen and disables the HUD timer
// waves     — mix of once() and wave() entries; enemies spawn for the full
//             level duration so the player always has targets to fight
export const LEVELS = [
  // ── Level 1 ─────────────────────────────────────────────────────────────────
  // Drone base HP 40 < laser 50 dmg → one-shot kills
  {
    duration: 25,
    isBoss: false,
    waves: [
      ...wave('drone', 25, { startTime: 0, interval: 3, speedMult: 1.0 }),
    ],
  },

  // ── Level 2 ─────────────────────────────────────────────────────────────────
  // Drone 1.0× → 40 HP → 1 shot
  {
    duration: 25,
    isBoss: false,
    waves: [
      ...wave('drone',  30, { startTime: 0,  interval: 4,  healthMult: 1.0, speedMult: 1.1 }),
      ...wave('rusher', 30, { startTime: 5, interval: 15, speedMult: 1.1 }),
    ],
  },

  // ── Level 3 ─────────────────────────────────────────────────────────────────
  // Drone 2.0× → 80 HP → ~2 shots
  {
    duration: 40,
    isBoss: false,
    waves: [
      ...wave('drone',  45, { startTime: 0, interval: 3,  healthMult: 2.0, speedMult: 1.2 }),
      ...wave('rusher', 45, { startTime: 8, interval: 8,  speedMult: 1.2 }),
    ],
  },

  // ── Level 4 ─────────────────────────────────────────────────────────────────
  // Drone 3.0× → 120 HP → ~3 shots
  {
    duration: 40,
    isBoss: false,
    waves: [
      ...wave('drone',  60, { startTime: 0,  interval: 2.5, healthMult: 3.0, speedMult: 1.4 }),
      ...wave('rusher', 60, { startTime: 5,  interval: 5.5, healthMult: 1.2, speedMult: 1.4 }),
      ...wave('tank',   60, { startTime: 15, interval: 20,  speedMult: 1.4 }),
    ],
  },

  // ── Level 5 — Boss ──────────────────────────────────────────────────────────
  // Boss 1.8× → 2700 HP
  {
    duration: null,
    isBoss: true,
    waves: [
      ...once('boss', 3, { healthMult: 4, speedMult: 1.2 }),
      ...wave('drone',  BOSS_FILL, { startTime: 10, interval: 8,  healthMult: 2.5, speedMult: 1.2 }),
      ...wave('rusher', BOSS_FILL, { startTime: 0,  interval: 12, healthMult: 1.5, speedMult: 1.2 }),
    ],
  },

  // ── Level 6 ─────────────────────────────────────────────────────────────────
  // Level 4 enemy mix with rusherCluster replacing rushers — first cluster encounter
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone',         60, { startTime: 0,  interval: 2.5, healthMult: 3.0, speedMult: 1.4 }),
      ...wave('rusherCluster', 60, { startTime: 5,  interval: 5.5, healthMult: 3.0, speedMult: 1.4 }),
      ...wave('tank',          60, { startTime: 15, interval: 20,  speedMult: 1.4 }),
    ],
  },

  // ── Level 7 ─────────────────────────────────────────────────────────────────
  // Drone 5.5× → 220 HP → ~5 shots
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone',  75, { startTime: 0,  interval: 2,  healthMult: 5.5, speedMult: 1.6 }),
      ...wave('tank',   75, { startTime: 12, interval: 14, healthMult: 2.5, speedMult: 1.6 }),
      ...once('miniboss', 10, { healthMult: 2.9, speedMult: 0.5 }),
    ],
  },

  // ── Level 8 ─────────────────────────────────────────────────────────────────
  // Drone 7.0× → 280 HP → ~6 shots
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone',         75, { startTime: 0,  interval: 1.8, healthMult: 7.0, speedMult: 1.8 }),
      ...wave('rusher',        75, { startTime: 3,  interval: 12,  healthMult: 3.5, speedMult: 1.8 }),
      ...wave('rusherCluster', 75, { startTime: 18, interval: 12,  healthMult: 7.0, speedMult: 1.8 }),
      ...wave('tank',          75, { startTime: 10, interval: 12,  healthMult: 3.8, speedMult: 1.8 }),
    ],
  },

  // ── Level 9 ─────────────────────────────────────────────────────────────────
  // Drone 9.0× → 360 HP → ~8 shots; manageable with weapon upgrades
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone',  90, { startTime: 0,  interval: 1.5, healthMult: 9.0, speedMult: 2.0 }),
      ...wave('tank',   90, { startTime: 8,  interval: 10,  healthMult: 5.5, speedMult: 2.0 }),
      ...once('miniboss', 12, { healthMult: 4.8, speedMult: 0.5 }),
    ],
  },

  // ── Level 10 — Boss + companions ────────────────────────────────────────────
  // Boss 14× HP; +25% speed vs previous (1.95 → 2.44); laser attack every 5 s
  {
    duration: null,
    isBoss: true,
    waves: [
      ...once('boss', 3, { healthMult: 14, speedMult: 2.44, enableLaser: true }),
      ...wave('drone',         BOSS_FILL, { startTime: 5,  interval: 6,  healthMult: 7.0, speedMult: 1.5 }),
      ...wave('rusher',        BOSS_FILL, { startTime: 8,  interval: 18, healthMult: 4.0, speedMult: 1.5 }),
      ...wave('rusherCluster', BOSS_FILL, { startTime: 12, interval: 14, healthMult: 7.0, speedMult: 1.5 }),
    ],
  },
];

// ─── Auto-scale beyond level 10 ──────────────────────────────────────────────
// Level 11 starts 25% harder than level 9 (the last hand-authored non-boss level):
//   - enemyScale: 9.0 × 1.25 = 11.25  (+20% per level after)
//   - interval:   1.5 s ÷ 1.25 = 1.2 s (+15% more mobs per level, floor 0.5 s)
//   - speedMult:  2.0 × 1.20 = 2.4     (+7.5% per level; spawner stacks a 1.1^(level-5) boost and
//                then caps the result: 418 px/s L11-16, 440 L17, 462 L18-20, 484 L21+)
// bossScale continues from the level-10 boss (5×) and grows more gently.
// From level 21 (extra ≥ 10): no more boss levels. Drone HP grows +5% per level;
//   rusherCluster HP scales with drone HP; rusher HP frozen at the level-21 base; drone spawn
//   interval shrinks 10% per level (floor 0.3 s).
export function getLevelConfig(levelIndex) {
  if (levelIndex < LEVELS.length) return LEVELS[levelIndex];

  const extra      = levelIndex - LEVELS.length;
  const enemyScale = 11.25 * Math.pow(1.20, extra);
  const bossScale  = 5 + extra * 0.5;
  const isBoss     = (levelIndex + 1) % 5 === 0;
  const dur        = 60;
  const interval   = Math.max(0.5, 1.2 / Math.pow(1.15, extra));
  const speedMult  = 2.4 * Math.pow(1.075, extra);

  // ── Level 21+: no more boss levels ───────────────────────────────────────
  if (extra >= 10) {
    const postExtra  = extra - 10;
    const droneBase  = 11.25 * Math.pow(1.20, 10); // level-21 drone health base (~69.66)
    const droneScale = droneBase * Math.pow(1.05, postExtra);
    const droneInt   = Math.max(0.3, 0.5 * Math.pow(0.9, postExtra));
    const rusherMult = Math.round(droneBase * 0.5);   // frozen at level-21 value (~35)
    const rClustMult = droneScale;                     // scales with drone HP (same healthMult)
    const tankMult   = Math.round(droneScale * 0.6);
    const mbMult     = Math.round((8 * 40 / 600) * droneScale * 100) / 100;
    const isEven     = (levelIndex + 1) % 2 === 0;
    return {
      duration: dur,
      isBoss: false,
      waves: [
        ...wave('drone',  dur, { startTime: 0,  interval: droneInt, healthMult: droneScale, speedMult }),
        ...wave('tank',   dur, { startTime: 12, interval: 2.5,      healthMult: tankMult,   speedMult }),
        ...(isEven
          ? [
              ...wave('rusher',        dur, { startTime: 5, interval: 1.25, healthMult: rusherMult,  speedMult }),
              ...wave('rusherCluster', dur, { startTime: 8, interval: 1.5,  healthMult: rClustMult,  speedMult }),
            ]
          : once('miniboss', 15, { healthMult: mbMult, speedMult: 0.5 })),
      ],
    };
  }

  if (isBoss) {
    // ── Level 15 — mirrors level 10: laser + drone/rusher/rusherCluster companions ──
    // Boss HP = 100 × a level-14 drone (40 × 19.44 × 100 = 77 760 HP → healthMult 51.84).
    if (extra === 4) {
      const l14DroneHP     = 40 * (11.25 * Math.pow(1.20, 3)); // 777.6
      const bossHealthMult = (l14DroneHP * 100) / 1500;        // 51.84
      return {
        duration: null,
        isBoss: true,
        waves: [
          ...once('boss', 3, { healthMult: bossHealthMult, speedMult, enableLaser: true }),
          ...wave('drone',         BOSS_FILL, { startTime: 5,  interval: 6,  healthMult: Math.round(enemyScale),       speedMult }),
          ...wave('rusher',        BOSS_FILL, { startTime: 8,  interval: 18, healthMult: Math.round(enemyScale * 0.5), speedMult }),
          ...wave('rusherCluster', BOSS_FILL, { startTime: 12, interval: 14, healthMult: Math.round(enemyScale),       speedMult }),
        ],
      };
    }

    // ── Level 20 — dual boss: two laser bosses, no companions ──
    // Each boss HP = 75 × a level-19 drone (40 × 48.37 × 75 ≈ 145 119 HP → healthMult ≈ 96.75).
    // Second boss spawns 2.5 s after the first so their laser cycles are offset.
    if (extra === 9) {
      const l19DroneHP     = 40 * (11.25 * Math.pow(1.20, 8)); // ≈ 1934.9
      const bossHealthMult = (l19DroneHP * 75) / 1500;         // ≈ 96.75
      return {
        duration: null,
        isBoss: true,
        waves: [
          ...once('boss', 3,   { healthMult: bossHealthMult, speedMult, enableLaser: true }),
          ...once('boss', 5.5, { healthMult: bossHealthMult, speedMult, enableLaser: true }),
        ],
      };
    }

    return {
      duration: null,
      isBoss: true,
      waves: [
        ...once('boss', 3, { healthMult: bossScale }),
        ...wave('drone', BOSS_FILL, {
          startTime:  12,
          interval:   Math.max(5, 12 - extra),
          healthMult: enemyScale,
          speedMult,
        }),
      ],
    };
  }

  const isEven = (levelIndex + 1) % 2 === 0;
  const minibossHealthMult = Math.round((8 * 40 / 600) * enemyScale * 100) / 100;
  return {
    duration: dur,
    isBoss: false,
    waves: [
      ...wave('drone',  dur, { startTime: 0,  interval,               healthMult: enemyScale,                    speedMult }),
      ...wave('tank',   dur, { startTime: 12, interval: interval * 5,  healthMult: Math.round(enemyScale * 0.6), speedMult }),
      ...(isEven ? wave('rusher',        dur, { startTime: 5, interval: interval * 2.5, healthMult: Math.round(enemyScale * 0.5), speedMult }) : []),
      ...(isEven ? wave('rusherCluster', dur, { startTime: 8, interval: interval * 3,   healthMult: enemyScale,                    speedMult }) : []),
      ...(!isEven ? once('miniboss', 15, { healthMult: minibossHealthMult, speedMult: 0.5 }) : []),
    ],
  };
}
