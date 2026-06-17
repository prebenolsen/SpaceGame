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
| Miniboss | 600 | Exactly one spawns per odd level after 5 via once(); always slow (speedMult 0.5, not boosted); HP is 8× drone HP for the level |
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
| Miniboss | 55 px/s | Always spawned with speedMult 0.5 → effective 27.5 px/s; level speed boost does not apply |
| Boss | 45 px/s | Slow but huge HP pool |

## Handcrafted levels (1–10)

HealthMult curve is roughly exponential so each level feels meaningfully harder at baseline laser damage (50 dmg/shot).

| Level | Duration | isBoss | Enemy mix |
|-------|----------|--------|-----------|
| 1 | 25 s | — | Drones only (interval 3 s, 1× stats, fills full 25 s) — one-shot kills |
| 2 | 25 s | — | Drones (interval 4 s, **1.0× HP**, 1.1× speed — one-shot kills) + rushers from t=5 (interval 15 s, 1.1× speed) |
| 3 | 30 s | — | Drones (interval 3 s, **2.0× HP**, 1.2× speed) + rushers (interval 8 s, 1.2× speed) |
| 4 | 30 s | — | Drones (interval 2.5 s, **3.0× HP**, 1.4×) + rushers (**1.2× HP**, interval 5.5 s, 1.4×) + tanks (interval 20 s) |
| 5 | ∞ | Boss | Boss (**1.8× HP**, 1.2× speed) + drone support (**2.5× HP**) + rusher support (**1.5× HP**) |
| 6 | 45 s | — | Level 4 mix with **rusherCluster** replacing rushers — drones (**3.0× HP**, 1.4×) + rusherClusters (**3.0× HP**, interval 5.5 s) + tanks (interval 20 s) |
| 7 | 45 s | — | Drones (interval 2 s, **5.5× HP**, 1.6×) + tanks (**2.5× HP**, interval 14 s) + 1 miniboss at t=10 (**2.9× HP**, very slow) |
| 8 | 45 s | — | Drones (interval 1.8 s, **7.0× HP**, 1.8×) + rushers (**3.5× HP**, interval 12 s) + **rusherClusters** (**7.0× HP**, interval 12 s, from t=18) + tanks (**3.8× HP**, interval 12 s) |
| 9 | 45 s | — | Drones (interval 1.5 s, **9.0× HP**, 2.0×) + tanks (**5.5× HP**, interval 10 s) + 1 miniboss at t=12 (**4.8× HP**, very slow) |
| 10 | ∞ | Boss | Boss (**14× HP**, **2.44× speed**, laser attack every 5 s, **no phase 2 speed increase**) + drone support (**7.0× HP**) + rusher support (**4.0× HP**, interval 18 s) + **rusherCluster** support (**7.0× HP**, interval 14 s, from t=12) |

## Auto-scaling beyond level 10

`getLevelConfig(levelIndex)` handles all levels past the handcrafted 10. Level 11 starts 25% harder than level 9 (the last hand-authored non-boss level) and ramps continuously from there.

- `extra = levelIndex - LEVELS.length` (0 = level 11)
- `enemyScale = 11.25 × 1.20^extra` — 25% harder than L9's 9.0× at L11, then +20% per level
- `interval   = max(0.5, 1.2 / 1.15^extra)` — 25% more mobs than L9's 1.5 s at L11, then +15% more per level; floor 0.5 s
- `speedMult  = 2.1 × 1.075^extra` — 5% faster than L9's 2.0× at L11, then +7.5% per level; spawner stacks `1.1^(level-5)` on top, then caps the result at a level-specific limit (see speed cap table below)
- `bossScale  = 5 + extra × 0.5` — continues from level-10 boss, grows more gently
- Boss levels every 5th level (`(levelIndex + 1) % 5 === 0`), using `once('boss')` with `healthMult: bossScale` — aligns with predefined bosses at levels 5 and 10
- Normal levels: drones + tanks (interval × 5, 60% enemy scale); all use the computed `speedMult`
- Even-numbered normal levels also add **rushers** (interval × 2.5, 50% enemy scale) + **rusherClusters** (interval × 3, 100% enemy scale = same as drones, from t=8)
- Odd-numbered normal levels add 1 **miniboss** at t=15 (HP = 8× drone HP for that scale, speedMult 0.5)

| Level | extra | enemyScale | interval | speedMult (config) |
|-------|-------|-----------|----------|--------------------|
| 11 | 0 | 11.25 | 1.20 s | 2.10 |
| 12 | 1 | 13.50 | 1.04 s | 2.26 |
| 13 | 2 | 16.20 | 0.91 s | 2.43 |
| 14 | 3 | 19.44 | 0.79 s | 2.61 |
| **15** | 4 | **Boss** — special case | — | 2.81 |
| 16 | 5 | 27.99 | 0.60 s | 3.02 |
| 17 | 6 | 33.59 | 0.52 s | 3.24 |
| 18 | 7 | 40.31 | 0.50 s (floor) | 3.49 |
| 19 | 8 | 48.37 | 0.50 s (floor) | 3.75 |
| **20** | 9 | **Boss** — special case | — | 4.03 |
| 21+ | ≥ 10 | See post-level-20 section | — | — |

### Level 15 boss (special case)

Mirrors level 10: laser attack every 5 s, companion waves of drones + rushers + rusherClusters.

- **Boss HP:** 100 × a level-14 drone = 40 × 19.44 × 100 = **77 760 HP** (healthMult 51.84)
- **Boss speed:** speedMult 2.81 (auto-scale formula); phase 2 (below 50% HP) multiplies speed by 1.5×
- Companion drones: healthMult ≈ 23, interval 6 s, from t=5
- Companion rushers: healthMult ≈ 12, interval 18 s, from t=8
- Companion rusherClusters: healthMult ≈ 23 (= drones), interval 14 s, from t=12

`BOSS_FILL = 300` s is used as the companion-wave duration in boss levels; the boss dying ends the level long before this elapses.

### Level 20 boss (special case)

Dual-boss encounter — no companion enemies. Both bosses fire lasers; the second spawns 2.5 s after the first to stagger their laser cycles.

- **Boss count:** 2 (boss 1 at t=3 s, boss 2 at t=5.5 s)
- **Each boss HP:** 75 × a level-19 drone = 40 × 48.37 × 75 ≈ **145 119 HP** (healthMult ≈ 96.75)
- **Boss speed:** 484 px/s (110% player max — capped by spawner); phase 2 (below 50% HP) ×1.5 = 726 px/s
- No companion waves

## Post-level-20 scaling (levels 21+)

From level 21 (`extra ≥ 10`) there are **no more boss levels**. A separate scaling regime takes over:

- `postExtra = extra − 10` (0 at level 21, 1 at level 22, …)
- `droneBase = 11.25 × 1.20^10 ≈ 69.66` — level-21 drone health base
- **Drone health:** `droneBase × 1.05^postExtra` — +5% per level, compounding
- **Rusher health:** frozen at `round(droneBase × 0.5) = 35`
- **RusherCluster health:** `droneScale` — scales with drone HP (same healthMult; was previously frozen)
- **Tank health:** `round(droneScale × 0.6)` — scales with drones
- **Miniboss health:** `8 × 40 / 600 × droneScale` — scales with drones (odd levels only)
- **Drone spawn interval:** `max(0.3, 0.5 × 0.9^postExtra)` — 10% more frequent each level
- **Rusher interval:** frozen at 1.25 s (= level-21 base)
- **RusherCluster interval:** frozen at 1.5 s (= level-21 base)
- **Tank interval:** frozen at 2.5 s (= level-21 base)
- **speedMult:** continues as `2.1 × 1.075^extra` (unchanged formula)
- Even-numbered levels: drones + tanks + rushers + rusherClusters
- Odd-numbered levels: drones + tanks + 1 miniboss at t=15

| Level | postExtra | Drone healthMult | Drone interval |
|-------|-----------|-----------------|----------------|
| 21 | 0 | 69.66 | 0.50 s |
| 22 | 1 | 73.14 | 0.45 s |
| 23 | 2 | 76.80 | 0.41 s |
| 24 | 3 | 80.64 | 0.36 s |
| 25 | 4 | 84.67 | 0.33 s |
| 30 | 9 | 108.0 | 0.30 s (floor) |

## Progressive speed scaling and caps (levels 6+)

Implemented in `src/systems/spawner.js`. For every level beyond 5 the spawner multiplies all `speedMult` values by `1.1^(levelNumber − 5)` before passing them to enemy constructors. After applying the boost, the spawner clamps the effective speed to a level-specific maximum. Minibosses are exempt from the boost (always slow) and have no cap.

| Level range | Spawner boost | Effective speed cap (regular enemies) | Boss speed cap |
|-------------|--------------|---------------------------------------|----------------|
| 1–5 | × 1.0 | — | — |
| 6–10 | × 1.1^(level−5) | 528 px/s (120%) | — |
| 11–16 | × 1.1^(level−5) | 418 px/s (95%) | **484 px/s (110%)** |
| 17 | × 1.1^12 | 440 px/s (100%) | **484 px/s (110%)** |
| 18–20 | × 1.1^(level−5) | 462 px/s (105%) | **484 px/s (110%)** |
| 21+ | × 1.1^(level−5) | **484 px/s (110%) — hard stop** | **484 px/s (110%)** |

All percentages are of player max speed (440 px/s at rank-6 moveSpeed upgrade). The cap is applied in `BaseEnemy` via a `speedCap` parameter. Drone and rusher constructors also carry a secondary hard cap at 484 px/s. RusherCluster members rely solely on the `speedCap` passed from the spawner.
