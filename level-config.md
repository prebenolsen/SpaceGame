# Level Configuration

## Source file

`src/levels/level-config.js`

## Spawn helpers

Two helper functions build the `waves` arrays inside each level:

### `wave(type, duration, options)`

Fills `duration` seconds with repeated spawns of `type`. Each entry gets a random ±jitter offset so spawns feel fluid rather than metronomic. Entries are returned sorted by actual spawn time.

| Option | Default | Description |
|--------|---------|-------------|
| `startTime` | 2 | Seconds before the first spawn |
| `interval` | 6 | Base cadence in seconds between spawns |
| `jitter` | 0.35 | ± fraction of `interval` applied as random offset |
| `healthMult` | 1 | HP multiplier relative to enemy base HP |
| `speedMult` | 1 | Speed multiplier relative to enemy base speed |

### `once(type, time, options)`

Single spawn entry — used for bosses and surprise minibosses. Takes the same `healthMult` / `speedMult` options. Any additional options (e.g. `enableLaser: true`) are passed through to the enemy constructor.

## Enemy types

`'drone'` | `'rusher'` | `'rusherCluster'` | `'tank'` | `'miniboss'` | `'boss'`

**`rusherCluster`** spawns three enemies at once: one lead and two wings that maintain a V-formation behind the lead. Wings share the lead's speed and health multipliers. Each member scores independently.

## Level structure

Each entry in `LEVELS` has:

| Field | Description |
|-------|-------------|
| `duration` | Seconds the level runs. `null` = no timer; boss must die to advance. |
| `isBoss` | `true` shows "BOSS" on the intro screen and hides the HUD timer. |
| `waves` | Array of spawn entries produced by `wave()` and `once()` calls. |

## Base HP per enemy type

| Enemy | Base HP | Notes |
|-------|---------|-------|
| Drone | 40 | Below baseline laser (50 dmg) → one-shot in level 1 |
| RusherCluster | 40 | Drone HP and speed; rusher shape and size; spawns as a trio (lead + 2 wings) |
| Rusher | 12 | Fast; low HP is intentional |
| Tank | 150 | Scaled down from 300; heavy healthMult compensates |
| Miniboss | 600 | Exactly one spawns per odd level after 5 via once(); now keeps pace with the level's drones (speedMult from `minibossSpeedMult()`, no longer a flat 0.5); HP is 8× drone HP for the level |
| Boss | 1500 | Unchanged |

## Level structure fields

| Field | Description |
|-------|-------------|
| `duration` | Seconds the level runs. `null` = no timer; boss must die to advance. |
| `isBoss` | `true` shows "BOSS" on the intro screen and hides the HUD timer. |
| `waves` | Array of spawn entries produced by `wave()` and `once()` calls. |

## Tutorials (separate from LEVELS)

Tutorials run before Level 1 on every fresh start (`defaultSave().level === 0`). They bypass the normal level-intro/clear/upgrade flow entirely and are managed by `_tutorialPhase` + `_tut1Step` / `_tut2Step` in `game.js`.

| Tutorial | What happens |
|----------|-------------|
| Tutorial 1 | Phase 1: one stationary drone far right, laser joystick only, bottom tooltip. Phase 2 (drone dead): two close drones, arc joystick only, arc tooltip. Phase 3 (both dead): 2 s wait. Phase 4: "Tutorial 1 completed!" overlay, tap to continue. |
| Tutorial 2 | Move joystick only. Top tooltip (7 s) explaining outrunning. Then one chasing drone spawns; player survives 20 s to finish. |

After Tutorial 2 completes, `_levelNumber` is set to 1 and the player is returned to the **landing/home screen** to choose whether to begin Level 1 or not.

## Base speed per enemy type

| Enemy | Base speed | Notes |
|-------|-----------|-------|
| Drone | 80 px/s | Baseline chaser |
| Rusher | 110 px/s | ~37% faster than drone; still manageable to dodge |
| RusherCluster (members) | 80 px/s | Same as drone; danger is the formation count |
| Tank | 40 px/s | Slow but tanky |
| Miniboss | 55 px/s | speedMult from `minibossSpeedMult(level)` so its effective speed matches the level's drones; held to the absolute speed cap |
| Boss | 45 px/s | Slow but huge HP pool |

## Scaling model

Enemy health, speed, and spawn cadence are derived from a single set of helpers at
the top of `level-config.js`. **`enemy_scaling.md` is the source of truth for the
per-level numbers** — this section only summarises the mechanics.

- **Health** is tuned against the assumed upgrade path (every pick into laser
  damage / fire-rate, alternating, damage first). Each level's drone HP =
  `shotsToKill(level) × damagePerShot(level)`, where damage ramps 50→300 as picks
  accrue (maxed by L16). Helpers: `droneHealthMult`, `rusherHealthMult` (½ a drone),
  `clusterHealthMult` (= a drone), `tankHealthMult` (×3), `minibossHealthMult` (×8),
  `bossHealthMult`.
- **Speed:** authored as absolute px/s per type — `droneSpeedForLevel(level)` and
  `rusherSpeedForLevel(level)` — then converted to per-type speedMults
  (`droneSpeedMult`, `rusherSpeedMult`, `clusterSpeedMult` [rides the rusher curve],
  `tankSpeedMult` [= drone mult, ½-drone pace via base 40], `minibossSpeedMult` [matches
  drones]). Drones: base 80 through L5, 140 at L6 then +10 %/level to L9, base on the L10
  boss level, 200 at L11 then +7.5 %/level. Rushers: base 110, 150 at L6 (+10 %/level),
  215 at L11 (+7.5 %/level). Mobs are capped at `mobSpeedCapForLevel(level)` — a flat
  92.5 % of the 440 px/s player max (407 px/s) across all levels — which drones hit at
  L21 and rushers at L20. The cap applies to every enemy except bosses (minibosses
  included). Bosses are uncapped (authored speeds) — except the level-25+ laser bosses,
  which opt into the mob cap via the `capSpeed` entry flag.
- **Spawn rate:** `spawnFreqForLevel(level)` = 1.0 through level 11, then
  `2^((level−11)/12)` so spawns double from L11 to ~L23 (gentler than before;
  continuing past). The drone interval is `1.2 / freq` (floored at 0.30 s);
  tank/rusher/cluster intervals are multiples of it.

## Handcrafted levels (1–10)

Levels 1–10 keep bespoke enemy mixes / durations / intervals; their `healthMult` and
`speedMult` values come from the helpers. Levels 1–5 stay at base speed; levels 6–9 are
the hand-authored speed band (drones 140 / rushers 150 at L6, +10 %/level); level 10's
companions stay at base speed (boss level). See `enemy_scaling.md` for exact HP and speed.

| Level | Duration | isBoss | Enemy mix |
|-------|----------|--------|-----------|
| 1 | 25 s | — | Drones only (interval 3 s) — one-shot kills (50 HP vs 50 dmg) |
| 2 | 25 s | — | Drones (interval 4 s) + rushers from t=5 (interval 15 s) |
| 3 | 40 s | — | Drones (interval 3 s) + rushers (interval 8 s) |
| 4 | 40 s | — | Drones (interval 2.5 s) + rushers (interval 5.5 s) + tanks (interval 20 s) |
| 5 | ∞ | Boss | Boss (**50 shots** ⇒ 5000 HP, `bossHealthMult(5) × 2`, speedMult 1.2) + drone (interval **4 s**) + rusher (interval **6 s**) companions — adds spawn twice as often |
| 6 | 45 s | — | Drones (interval 2.5 s, **140 px/s**) + **rusherClusters** (interval 5.5 s, **150 px/s**) + tanks (interval 20 s, 70 px/s) |
| 7 | 45 s | — | Drones (interval 2 s, **154 px/s**) + tanks (interval 14 s) + 1 miniboss at t=10 (matches drone speed) |
| 8 | 45 s | — | Drones (interval 1.8 s, **169.4 px/s**) + rushers (interval 12 s, **181.5 px/s**) + **rusherClusters** (interval 12 s, t=18) + tanks (interval 12 s) |
| 9 | 45 s | — | Drones (interval 1.5 s, **186.3 px/s**) + tanks (interval 10 s) + 1 miniboss at t=12 (matches drone speed) |
| 10 | ∞ | Boss | Boss (**50 shots × 2 HP × 1.5**, **210 px/s**, laser, no phase-2 speed; +50 % HP) + drone + rusher + rusherCluster companions (base speed) |

## Auto-scaling beyond level 10

`getLevelConfig(levelIndex)` handles all levels past the handcrafted 10 using the
helpers above. For a 1-based `level`:

- drone interval `di = max(0.3, 1.2 / spawnFreqForLevel(level))`
- Normal levels: drones (`di`) + tanks (`di × 4`); even levels add rushers (`di × 2`)
  + rusherClusters (`di × 2.5`); odd levels add 1 miniboss at t=15 (matches drone speed
  via `minibossSpeedMult(level)`)
- Each mob type uses its own speedMult (`droneSpeedMult` / `rusherSpeedMult` /
  `clusterSpeedMult` / `tankSpeedMult`); health from the per-type helpers
- Boss levels: **15** and **20** only. Levels **25+** still field bosses but are regular
  timed levels, not boss levels (see below)
- Level 21+: drones are a flat 4 shots (1200 HP); difficulty rises via speed + density

### Level 15 boss (special case)

Mirrors level 10: laser attack, companion waves of drones + rushers + rusherClusters.

- **Boss:** 60 shots × **4 HP × 1.25** → 75 000 HP (healthMult 50.0), **275 px/s**
  (`275 / BOSS_BASE_SPEED`), laser enabled; phase 2 (below 50 % HP) ×1.5 speed; +25 % HP
- Companions use `droneHealthMult(15)` / `rusherHealthMult(15)` / `clusterHealthMult(15)`
  at their per-type speedMults (drone 267.1 / rusher 287.1 px/s)

`BOSS_FILL = 300` s is the companion-wave duration in boss levels; the boss dying ends
the level long before this elapses.

### Level 20 boss (special case)

Dual-boss encounter **with companions** (same cadence as level 10: drone interval 6 s,
rusher 18 s, rusherCluster 14 s, at their per-type speedMults). Both bosses fire lasers;
the second spawns 2.5 s after the first to stagger their laser cycles.

- **Boss count:** 2 (t=3 s and t=5.5 s)
- **Each boss:** 60 shots × **3 HP** → 54 000 HP (healthMult 36.0), speedMult 2.5;
  phase 2 ×1.5; fires its laser **50 % more often** (`laserRateMult: 1.5` → interval
  5 s → ~3.33 s)

### Levels 25+ (endless boss assault)

From level 25 every level fields bosses, but these are **regular 60-second timed levels**
(`duration: 60`, `isBoss: false`) — the HUD timer advances them, not killing the bosses.
The bosses are the same type as the level-15 boss (laser enabled) but tuned for the
endless game:

- **Boss count:** `level − 24` — **1 on L25, 2 on L26, 3 on L27**, … each one more
  than the last
- **Spawn timing:** first at **t = 10 s**, then **+4 s** per boss (10 s, 14 s, 18 s, …)
- **Each boss:** HP of **ten drones** (`lateBossHealthMult` = `10 × droneHP / 1500`;
  8.0 → 12 000 HP at L25), speed matched to the level's drones (`lateBossSpeedMult`,
  `capSpeed: true` so it honors `mobSpeedCapForLevel`), laser enabled, phase-2 speed
  **off** (stays in lockstep with the mobs)
- **Companions:** full drone (`di`) + tank (`di × 4`) + rusher (`di × 2`) +
  rusherCluster (`di × 2.5`) waves for the whole fight (`BOSS_FILL` duration)

## Speed cap

The spawner clamps every enemy's effective speed to `mobSpeedCapForLevel(level)` via the
`speedCap` parameter on `BaseEnemy`. The cap is a flat **92.5 %** of the 440 px/s player
max (407 px/s) across all levels (`mobSpeedCapPct` returns 0.925 for every level). Most
bosses pass `speedCap = Infinity` (they use authored
speeds); the level-25+ laser bosses instead opt into the per-level cap via the `capSpeed`
entry flag, so they match the level's mobs. Minibosses are subject to the cap. Drone and
rusher constructors also carry a secondary 484 px/s hard cap, which the enemy cap sits
below.
