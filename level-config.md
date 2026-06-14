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

## Handcrafted levels (1–10)

| Level | Duration | isBoss | Enemy mix |
|-------|----------|--------|-----------|
| 1 | 15 s | — | Drones (interval 8 s) |
| 2 | 20 s | — | Drones (interval 5 s) |
| 3 | 30 s | — | Drones + rushers (1.15× speed) |
| 4 | 30 s | — | Drones + rushers (1.2× speed) + minibosses |
| 5 | ∞ | Boss | Boss (1.30× speed) + drone support from t=15 |
| 6 | 60 s | — | Drones (1.2× HP) + rushers |
| 7 | 60 s | — | Drones (1.5× HP, 1.45× speed) + tanks (1.45× speed) |
| 8 | 75 s | — | Drones (1.5× HP, 1.2× speed) + rushers + tanks |
| 9 | 75 s | — | Drones (1.5× HP, 1.6× speed) + rushers (1.6×) + minibosses (1.2× HP, 1.6×) |
| 10 | ∞ | Boss | Boss (2× HP) + dense drone support from t=12 |

## Auto-scaling beyond level 10

`getLevelConfig(levelIndex)` handles all levels past the handcrafted 10. The logic:

- `extra = levelIndex - 10` (how many levels past the hand-authored set)
- `scale = 1 + extra * 0.15` — applied as `healthMult` and `speedMult` base
- `interval = max(1.5, 5 / scale)` — spawn cadence tightens with level, floor at 1.5 s
- Boss levels every 5th level (`(levelIndex + 1) % 5 === 0`), using `once('boss')` with `healthMult: scale`
- Normal levels: drones + rushers (interval × 2.5) + tanks (interval × 5)
- Speed is capped at 2.5× (`Math.min(scale * 0.8, 2.5)`) to avoid enemies becoming impossible to dodge

`BOSS_FILL = 300` s is used as the companion-wave duration in boss levels; the boss dying ends the level long before this elapses.
