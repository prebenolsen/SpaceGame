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

Single spawn entry — used for bosses and surprise minibosses. Takes the same `healthMult` / `speedMult` options.

## Enemy types

`'drone'` | `'rusher'` | `'tank'` | `'miniboss'` | `'boss'`

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
| Rusher | 30 | Fast; low HP is intentional |
| Tank | 150 | Scaled down from 300; heavy healthMult compensates |
| Miniboss | 300 | Scaled down from 500; heavily multiplied in late levels |
| Boss | 1500 | Unchanged |

## Handcrafted levels (1–10)

HealthMult curve is roughly exponential so each level feels meaningfully harder at baseline laser damage (50 dmg/shot). Expected shots-to-kill a drone: L1 1, L2 2, L3 3, L4 4, L6 5, L7 7, L8 9, L9 ~11.

| Level | Duration | isBoss | Enemy mix |
|-------|----------|--------|-----------|
| 1 | 15 s | — | Drones only (interval 8 s, 1× stats) — one-shot kills |
| 2 | 30 s | — | Drones (interval 4 s, **1.8× HP**, 1.25× speed) + rushers from t=10 (interval 15 s) |
| 3 | 45 s | — | Drones (interval 3 s, **3.0× HP**, 1.5× speed) + rushers (interval 8 s) + 1 miniboss at t=20 |
| 4 | 60 s | — | Drones (interval 2.5 s, **4.5× HP**, 1.7×) + rushers (**1.8× HP**, interval 5.5 s) + tanks (interval 20 s) |
| 5 | ∞ | Boss | Boss (**2.5× HP**, 1.5× speed) + drone support (**4.0× HP**) + rusher support (**2.5× HP**) from t=10/20 |
| 6 | 60 s | — | Drones (interval 2.5 s, **6.0× HP**, 1.8×) + rushers (**2.5× HP**, interval 5 s) + tanks (**2.0× HP**, interval 18 s) |
| 7 | 75 s | — | Drones (interval 2 s, **8.0× HP**, 2.0×) + rushers (**3.5× HP**, interval 4 s) + tanks (**3.5× HP**, interval 14 s) + minibosses (**2.0× HP**, interval 30 s) |
| 8 | 75 s | — | Drones (interval 1.8 s, **10.5× HP**, 2.2×) + rushers (**5.0× HP**, interval 3.5 s) + tanks (**5.5× HP**, interval 12 s) + minibosses (**3.5× HP**, interval 22 s) |
| 9 | 90 s | — | Drones (interval 1.5 s, **13.0× HP**, 2.5×) + rushers (**7.0× HP**) + tanks (**8.0× HP**, interval 10 s) + minibosses (**5.0× HP**, interval 18 s) |
| 10 | ∞ | Boss | Boss (**5.0× HP**, 1.8× speed) + drone support (**10.0× HP**) + rusher support (**6.0× HP**) from t=5/8 (interval 6 s each) |

## Auto-scaling beyond level 10

`getLevelConfig(levelIndex)` handles all levels past the handcrafted 10. The logic:

- `extra = levelIndex - 10` (how many levels past the hand-authored set)
- `enemyScale = 13 + extra * 2` — continues from level-9 territory, grows +2 per level
- `bossScale  = 5 + extra * 0.5` — continues from level-10 boss, grows more gently
- `interval = max(1.5, 5 / (1 + extra * 0.15))` — spawn cadence tightens with level, floor at 1.5 s
- Boss levels every 5th level (`(levelIndex + 1) % 5 === 0`), using `once('boss')` with `healthMult: bossScale`
- Normal levels: drones + rushers (interval × 2.5, 50% enemy scale) + tanks (interval × 5, 60% enemy scale)
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
