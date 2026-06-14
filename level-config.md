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
| 1 | 15 s | — | Drones only (interval 8 s, 1× stats) |
| 2 | 30 s | — | Drones (interval 4 s, 1.15× HP, 1.25× speed) + rushers from t=10 (interval 15 s) |
| 3 | 45 s | — | Drones (interval 3 s, 1.3× HP, 1.5× speed) + rushers (interval 8 s) + 1 miniboss at t=20 |
| 4 | 60 s | — | Drones (interval 2.5 s, 1.4× HP, 1.7×) + rushers (interval 5.5 s, 1.1× HP) + tanks (interval 20 s) |
| 5 | ∞ | Boss | Boss (1.5× HP, 1.5× speed) + drone/rusher support from t=10/20 |
| 6 | 60 s | — | Drones (interval 2.5 s, 1.5× HP, 1.8×) + rushers (interval 5 s) + tanks (interval 18 s) |
| 7 | 75 s | — | Drones (interval 2 s, 1.7× HP, 2.0×) + rushers (interval 4 s) + tanks (1.3× HP, interval 14 s) + minibosses (interval 30 s) |
| 8 | 75 s | — | Drones (interval 1.8 s, 2.0× HP, 2.2×) + rushers (1.2× HP, interval 3.5 s) + tanks (1.6× HP, interval 12 s) + minibosses (1.5× HP, interval 22 s) |
| 9 | 90 s | — | Drones (interval 1.5 s, 2.3× HP, 2.5×) + rushers (1.3× HP) + tanks (2.0× HP, interval 10 s) + minibosses (2.0× HP, interval 18 s) |
| 10 | ∞ | Boss | Boss (3.5× HP, 1.8× speed) + dense drone + rusher support from t=5/8 (interval 6 s each) |

## Auto-scaling beyond level 10

`getLevelConfig(levelIndex)` handles all levels past the handcrafted 10. The logic:

- `extra = levelIndex - 10` (how many levels past the hand-authored set)
- `scale = 1 + extra * 0.15` — applied as `healthMult` and `speedMult` base
- `interval = max(1.5, 5 / scale)` — spawn cadence tightens with level, floor at 1.5 s
- Boss levels every 5th level (`(levelIndex + 1) % 5 === 0`), using `once('boss')` with `healthMult: scale`
- Normal levels: drones + rushers (interval × 2.5) + tanks (interval × 5)
- Speed is capped at 2.5× (`Math.min(scale * 0.8, 2.5)`) to avoid enemies becoming impossible to dodge

`BOSS_FILL = 300` s is used as the companion-wave duration in boss levels; the boss dying ends the level long before this elapses.
