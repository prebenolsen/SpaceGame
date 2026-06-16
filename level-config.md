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
| 6 | 45 s | — | Level 4 mix with **rusherCluster** replacing rushers — drones (**3.0× HP**, 1.4×) + rusherClusters (**1.2× HP**, interval 5.5 s) + tanks (interval 20 s) |
| 7 | 45 s | — | Drones (interval 2 s, **5.5× HP**, 1.6×) + tanks (**2.5× HP**, interval 14 s) + 1 miniboss at t=10 (**2.9× HP**, very slow) |
| 8 | 45 s | — | Drones (interval 1.8 s, **7.0× HP**, 1.8×) + rushers (**3.5× HP**, interval 12 s) + **rusherClusters** (**2.8× HP**, interval 12 s, from t=18) + tanks (**3.8× HP**, interval 12 s) |
| 9 | 45 s | — | Drones (interval 1.5 s, **9.0× HP**, 2.0×) + tanks (**5.5× HP**, interval 10 s) + 1 miniboss at t=12 (**4.8× HP**, very slow) |
| 10 | ∞ | Boss | Boss (**14× HP**, **2.44× speed**, laser attack every 5 s) + drone support (**7.0× HP**) + rusher support (**4.0× HP**, interval 18 s) + **rusherCluster** support (**4.0× HP**, interval 14 s, from t=12) |

## Auto-scaling beyond level 10

`getLevelConfig(levelIndex)` handles all levels past the handcrafted 10. The logic:

- `extra = levelIndex - LEVELS.length` (how many levels past the hand-authored set of 10)
- `enemyScale = 13 + extra * 2` — continues from level-9 territory, grows +2 per level
- `bossScale  = 5 + extra * 0.5` — continues from level-10 boss, grows more gently
- `interval = max(1.5, 5 / (1 + extra * 0.15))` — spawn cadence tightens with level, floor at 1.5 s
- Boss levels every 5th level (`(levelIndex + 1) % 5 === 0`), using `once('boss')` with `healthMult: bossScale` — aligns with predefined bosses at levels 5 and 10
- Normal levels: drones + tanks (interval × 5, 60% enemy scale)
- Even-numbered normal levels also add **rushers** (interval × 2.5, 50% enemy scale) + **rusherClusters** (interval × 3, 40% enemy scale, from t=8)
- Odd-numbered normal levels add 1 **miniboss** at t=15 (HP = 8× drone HP for that scale, speedMult 0.5)
- Speed is capped at 2.5× to avoid enemies becoming impossible to dodge

`BOSS_FILL = 300` s is used as the companion-wave duration in boss levels; the boss dying ends the level long before this elapses.

## Progressive speed scaling (levels 6+)

Implemented in `src/systems/spawner.js`, not in level-config.js. For every level beyond 5 the spawner multiplies all `speedMult` values by `1.1^(levelNumber − 5)` before passing them to enemy constructors. This stacks on top of the per-wave `speedMult` already present in each level's config:

| Level | Boost factor (applied on top of wave speedMult) |
|-------|--------------------------------------------------|
| 6 | × 1.10 |
| 7 | × 1.21 |
| 8 | × 1.33 |
| 9 | × 1.46 |
| 10 | × 1.61 |
| 11+ | × 1.1^(level − 5) |
