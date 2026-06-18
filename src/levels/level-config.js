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

// ═══════════════════════════════════════════════════════════════════════════
//  ENEMY SCALING MODEL  (see enemy_scaling.md for the full per-level tables)
// ═══════════════════════════════════════════════════════════════════════════
//
// Health is tuned against the *assumed* upgrade path: the player spends every
// pick on laser damage / laser fire-rate, alternating (damage first), until both
// are maxed. Picks are earned by clearing levels (1 per level, 2 per boss), so
// the per-shot damage the player has when *entering* a level is fixed and known.
//
//   • laserDamage   +25/shot per rank, max rank 10  → 50 … 300 dmg/shot
//   • laserFireRate +0.5 shots/s per rank, max rank 8 → 1 … 5 shots/s
//
// Each enemy's HP is set so a drone dies in a target number of shots *at the
// damage the player has on that level*:  droneHP = shots × damage(level).
// HP is expressed as a healthMult over the entity base HP (drone 40, rusher 12,
// boss 1500), which is what the spawner/entities consume.

const DRONE_BASE_HP  = 40;
const RUSHER_BASE_HP = 12;
const BOSS_BASE_HP   = 1500;

const PLAYER_MAX_SPEED = 440;                    // maxed moveSpeed: 200 × (1 + 6×0.2)
export const MOB_SPEED_CAP = PLAYER_MAX_SPEED * 0.925; // 407 px/s — absolute enemy speed ceiling (92.5 % of player max)

// Base move speeds (px/s) used to keep enemy types in sync (see entity classes).
const DRONE_BASE_SPEED    = 80;
const MINIBOSS_BASE_SPEED = 55;

const BOSS_LEVELS = new Set([5, 10, 15, 20]);    // the only boss levels; none beyond 20

// Target "shots to kill a drone" per level (1-based). Boss-level entries describe
// that level's *companion* drones. Levels 21+ are a flat 4 shots.
const DRONE_SHOTS = {
  1: 1.0,  2: 1.15, 3: 1.25, 4: 1.35, 5: 1.4,
  6: 1.5,  7: 1.75, 8: 2.0,  9: 2.0, 10: 2.0,
  11: 2.2, 12: 2.4, 13: 2.6, 14: 2.8, 15: 3.0,
  16: 3.0, 17: 3.25, 18: 3.5, 19: 3.75,
};
function droneShots(level) {
  return DRONE_SHOTS[level] ?? 4.0; // level 21+
}

// Boss "shots to kill" (against the player's damage on that level).
const BOSS_SHOTS = { 5: 25, 10: 50, 15: 60, 20: 60 };

// Upgrade picks earned before *entering* `level` (1 per cleared level, 2 per boss).
function picksBeforeLevel(level) {
  let picks = 0;
  for (let l = 1; l < level; l++) picks += BOSS_LEVELS.has(l) ? 2 : 1;
  return picks;
}

// Per-shot laser damage the player has when entering `level`, following the
// alternating damage/fire-rate build (damage first; a maxed stat is skipped).
function laserDamageAtLevel(level) {
  const picks = picksBeforeLevel(level);
  let dmg = 0, fire = 0;
  for (let i = 0; i < picks; i++) {
    const wantDamage = i % 2 === 0;
    if (wantDamage) { if (dmg < 10) dmg++; else if (fire < 8) fire++; }
    else            { if (fire < 8) fire++; else if (dmg < 10) dmg++; }
  }
  return 50 + dmg * 25;
}

// healthMult helpers — HP = (shots × damage) expressed over each entity's base HP.
function droneHealthMult(level)  { return droneShots(level) * laserDamageAtLevel(level) / DRONE_BASE_HP; }
function bossHealthMult(level)   { return BOSS_SHOTS[level] * laserDamageAtLevel(level) / BOSS_BASE_HP; }
// A rusher is a lighter skirmisher: half a drone's shots-to-kill.
function rusherHealthMult(level) { return 0.5 * droneShots(level) * laserDamageAtLevel(level) / RUSHER_BASE_HP; }
// Derived from the drone: a cluster member is a drone (same base HP); a tank is
// 3 drones' worth of HP; a miniboss is 8 drones' worth.
function clusterHealthMult(level) { return droneHealthMult(level); }
function tankHealthMult(level)     { return 3 * droneHealthMult(level) * DRONE_BASE_HP / 150; }
function minibossHealthMult(level) { return 8 * droneHealthMult(level) * DRONE_BASE_HP / 600; }

// Mob speed: base speed through level 10, then +10 % per level from level 11.
// (Bumped from +7.5 %: levels 11-19 trade slightly thinner spawn density for
// faster enemies.) The spawner clamps the resulting px/s to MOB_SPEED_CAP.
function speedMultForLevel(level) {
  return level <= 10 ? 1.0 : Math.pow(1.10, level - 10);
}

// A miniboss is no longer a deliberate crawler — it keeps pace with the level's
// drones. Given the drones' speedMult, the miniboss (lighter base speed) needs
// (drone base / miniboss base) × that to match the drones' effective speed.
function minibossSpeedMult(droneSpeedMult) {
  return droneSpeedMult * DRONE_BASE_SPEED / MINIBOSS_BASE_SPEED;
}

// Spawn frequency: flat through level 11 (the baseline cadence), then grows
// gently — slightly slower than before (doubles by ~level 23 rather than 20) so
// levels 11-19 lean on enemy speed rather than spawn density.
function spawnFreqForLevel(level) {
  return level <= 11 ? 1.0 : Math.pow(2, (level - 11) / 12);
}

// ─── Level list ──────────────────────────────────────────────────────────────
// duration  — seconds (or null = no timer, boss must die to advance)
// isBoss    — true shows "BOSS" on intro screen and disables the HUD timer
// waves     — mix of once() and wave() entries; enemies spawn for the full
//             level duration so the player always has targets to fight
//
// Levels 1-10 keep base mob speed (speedMult 1.0) per the "mobs only speed up
// from level 11" rule. Boss speed is authored separately (bosses are not mobs).
export const LEVELS = [
  // ── Level 1 — drone dies in 1 shot (50 HP vs 50 dmg) ─────────────────────────
  {
    duration: 25,
    isBoss: false,
    waves: [
      ...wave('drone', 25, { startTime: 0, interval: 3, healthMult: droneHealthMult(1) }),
    ],
  },

  // ── Level 2 ─────────────────────────────────────────────────────────────────
  {
    duration: 25,
    isBoss: false,
    waves: [
      ...wave('drone',  30, { startTime: 0, interval: 4,  healthMult: droneHealthMult(2) }),
      ...wave('rusher', 30, { startTime: 5, interval: 15, healthMult: rusherHealthMult(2) }),
    ],
  },

  // ── Level 3 ─────────────────────────────────────────────────────────────────
  {
    duration: 40,
    isBoss: false,
    waves: [
      ...wave('drone',  45, { startTime: 0, interval: 3, healthMult: droneHealthMult(3) }),
      ...wave('rusher', 45, { startTime: 8, interval: 8, healthMult: rusherHealthMult(3) }),
    ],
  },

  // ── Level 4 ─────────────────────────────────────────────────────────────────
  {
    duration: 40,
    isBoss: false,
    waves: [
      ...wave('drone',  60, { startTime: 0,  interval: 2.5, healthMult: droneHealthMult(4) }),
      ...wave('rusher', 60, { startTime: 5,  interval: 5.5, healthMult: rusherHealthMult(4) }),
      ...wave('tank',   60, { startTime: 15, interval: 20,  healthMult: tankHealthMult(4) }),
    ],
  },

  // ── Level 5 — Boss (25 shots) ────────────────────────────────────────────────
  {
    duration: null,
    isBoss: true,
    waves: [
      ...once('boss', 3, { healthMult: bossHealthMult(5), speedMult: 1.2 }),
      // Adds spawn twice as often as before (drone interval 8→4, rusher 12→6).
      ...wave('drone',  BOSS_FILL, { startTime: 10, interval: 4, healthMult: droneHealthMult(5) }),
      ...wave('rusher', BOSS_FILL, { startTime: 0,  interval: 6, healthMult: rusherHealthMult(5) }),
    ],
  },

  // ── Level 6 — first rusherCluster encounter ──────────────────────────────────
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone',         60, { startTime: 0,  interval: 2.5, healthMult: droneHealthMult(6), speedMult: 1.10 }),
      ...wave('rusherCluster', 60, { startTime: 5,  interval: 5.5, healthMult: clusterHealthMult(6), speedMult: 1.10 }),
      ...wave('tank',          60, { startTime: 15, interval: 20,  healthMult: tankHealthMult(6), speedMult: 1.10 }),
    ],
  },

  // ── Level 7 ─────────────────────────────────────────────────────────────────
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone', 75, { startTime: 0,  interval: 2,  healthMult: droneHealthMult(7), speedMult: 1.15 }),
      ...wave('tank',  75, { startTime: 12, interval: 14, healthMult: tankHealthMult(7), speedMult: 1.15 }),
      ...once('miniboss', 10, { healthMult: minibossHealthMult(7), speedMult: minibossSpeedMult(1.15) }),
    ],
  },

  // ── Level 8 ─────────────────────────────────────────────────────────────────
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone',         75, { startTime: 0,  interval: 1.8, healthMult: droneHealthMult(8), speedMult: 1.20 }),
      ...wave('rusher',        75, { startTime: 3,  interval: 12,  healthMult: rusherHealthMult(8), speedMult: 1.20 }),
      ...wave('rusherCluster', 75, { startTime: 18, interval: 12,  healthMult: clusterHealthMult(8), speedMult: 1.20 }),
      ...wave('tank',          75, { startTime: 10, interval: 12,  healthMult: tankHealthMult(8), speedMult: 1.20 }),
    ],
  },

  // ── Level 9 ─────────────────────────────────────────────────────────────────
  {
    duration: 45,
    isBoss: false,
    waves: [
      ...wave('drone', 90, { startTime: 0, interval: 1.5, healthMult: droneHealthMult(9), speedMult: 1.25 }),
      ...wave('tank',  90, { startTime: 8, interval: 10,  healthMult: tankHealthMult(9), speedMult: 1.25 }),
      ...once('miniboss', 12, { healthMult: minibossHealthMult(9), speedMult: minibossSpeedMult(1.25) }),
    ],
  },

  // ── Level 10 — Boss + companions (50 shots; laser attack) ────────────────────
  {
    duration: null,
    isBoss: true,
    waves: [
      ...once('boss', 3, { healthMult: bossHealthMult(10) * 2, speedMult: 2.0, enableLaser: true, enablePhase2Speed: false }),
      ...wave('drone',         BOSS_FILL, { startTime: 5,  interval: 6,  healthMult: droneHealthMult(10) }),
      ...wave('rusher',        BOSS_FILL, { startTime: 8,  interval: 18, healthMult: rusherHealthMult(10) }),
      ...wave('rusherCluster', BOSS_FILL, { startTime: 12, interval: 14, healthMult: clusterHealthMult(10) }),
    ],
  },
];

// ─── Auto-scale beyond level 10 ──────────────────────────────────────────────
// Everything is driven by the scaling helpers above:
//   • health  — droneShots() × laserDamageAtLevel() (drones 2.2→4 shots; rushers
//               half a drone; tanks ×3, clusters ×1, minibosses ×8 vs a drone).
//   • speed   — speedMultForLevel(): +7.5 %/level from L11, capped at 418 px/s.
//   • cadence — spawnFreqForLevel(): doubles from L11 to L20 (continues after,
//               drone interval floored at 0.3 s).
// Boss levels exist only at 15 and 20; from level 21 on there are no more bosses.
export function getLevelConfig(levelIndex) {
  if (levelIndex < LEVELS.length) return LEVELS[levelIndex];

  const level     = levelIndex + 1; // 1-based
  const dur       = 60;
  const speedMult = speedMultForLevel(level);
  const freq      = spawnFreqForLevel(level);
  const di        = Math.max(0.3, 1.2 / freq); // drone interval

  // ── Level 15 — boss (60 shots): laser + drone/rusher/cluster companions ──
  if (level === 15) {
    return {
      duration: null,
      isBoss: true,
      waves: [
        ...once('boss', 3, { healthMult: bossHealthMult(15) * 4, speedMult: 2.5, enableLaser: true }),
        ...wave('drone',         BOSS_FILL, { startTime: 5,  interval: 6,  healthMult: droneHealthMult(15),   speedMult }),
        ...wave('rusher',        BOSS_FILL, { startTime: 8,  interval: 18, healthMult: rusherHealthMult(15),  speedMult }),
        ...wave('rusherCluster', BOSS_FILL, { startTime: 12, interval: 14, healthMult: clusterHealthMult(15), speedMult }),
      ],
    };
  }

  // ── Level 20 — dual boss (60 shots each): two laser bosses + companions ──
  // Second boss spawns 2.5 s later so their laser cycles stay offset. Each boss
  // has 3× the base HP and fires its laser 50 % more often (laserRateMult 1.5).
  // Companion adds spawn at the same cadence as level 10.
  if (level === 20) {
    return {
      duration: null,
      isBoss: true,
      waves: [
        ...once('boss', 3,   { healthMult: bossHealthMult(20) * 3, speedMult: 2.5, enableLaser: true, laserRateMult: 1.5 }),
        ...once('boss', 5.5, { healthMult: bossHealthMult(20) * 3, speedMult: 2.5, enableLaser: true, laserRateMult: 1.5 }),
        ...wave('drone',         BOSS_FILL, { startTime: 5,  interval: 6,  healthMult: droneHealthMult(20),   speedMult }),
        ...wave('rusher',        BOSS_FILL, { startTime: 8,  interval: 18, healthMult: rusherHealthMult(20),  speedMult }),
        ...wave('rusherCluster', BOSS_FILL, { startTime: 12, interval: 14, healthMult: clusterHealthMult(20), speedMult }),
      ],
    };
  }

  // ── Normal levels 11+ ────────────────────────────────────────────────────
  const isEven = level % 2 === 0;
  return {
    duration: dur,
    isBoss: false,
    waves: [
      ...wave('drone', dur, { startTime: 0,  interval: di,      healthMult: droneHealthMult(level), speedMult }),
      ...wave('tank',  dur, { startTime: 12, interval: di * 4,  healthMult: tankHealthMult(level),  speedMult }),
      ...(isEven
        ? [
            ...wave('rusher',        dur, { startTime: 5, interval: di * 2,   healthMult: rusherHealthMult(level),  speedMult }),
            ...wave('rusherCluster', dur, { startTime: 8, interval: di * 2.5, healthMult: clusterHealthMult(level), speedMult }),
          ]
        : once('miniboss', 15, { healthMult: minibossHealthMult(level), speedMult: minibossSpeedMult(speedMult) })),
    ],
  };
}
