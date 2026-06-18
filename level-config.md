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
- **Speed:** `speedMultForLevel(level)` = 1.0 through level 10, then `1.075^(level−10)`
  (+7.5 %/level). Mobs are capped at `MOB_SPEED_CAP = 418 px/s` (95 % of the 440 px/s
  player max) in the spawner. Minibosses (speedMult 0.5) and bosses are uncapped.
- **Spawn rate:** `spawnFreqForLevel(level)` = 1.0 through level 11, then
  `2^((level−11)/9)` so spawns double from L11 to L20 (continuing past 20). The
  drone interval is `1.2 / freq` (floored at 0.30 s); tank/rusher/cluster intervals
  are multiples of it.

## Handcrafted levels (1–10)

Levels 1–10 keep bespoke enemy mixes / durations / intervals; only their `healthMult`
values come from the helpers, and mob `speedMult` is 1.0 (mobs don't speed up before
level 11). See `enemy_scaling.md` for exact HP.

| Level | Duration | isBoss | Enemy mix |
|-------|----------|--------|-----------|
| 1 | 25 s | — | Drones only (interval 3 s) — one-shot kills (50 HP vs 50 dmg) |
| 2 | 25 s | — | Drones (interval 4 s) + rushers from t=5 (interval 15 s) |
| 3 | 40 s | — | Drones (interval 3 s) + rushers (interval 8 s) |
| 4 | 40 s | — | Drones (interval 2.5 s) + rushers (interval 5.5 s) + tanks (interval 20 s) |
| 5 | ∞ | Boss | Boss (**25 shots**, speedMult 1.2) + drone + rusher companions |
| 6 | 45 s | — | Drones (interval 2.5 s) + **rusherClusters** (interval 5.5 s) + tanks (interval 20 s) |
| 7 | 45 s | — | Drones (interval 2 s) + tanks (interval 14 s) + 1 miniboss at t=10 (slow) |
| 8 | 45 s | — | Drones (interval 1.8 s) + rushers (interval 12 s) + **rusherClusters** (interval 12 s, t=18) + tanks (interval 12 s) |
| 9 | 45 s | — | Drones (interval 1.5 s) + tanks (interval 10 s) + 1 miniboss at t=12 (slow) |
| 10 | ∞ | Boss | Boss (**50 shots**, speedMult 2.0, laser, no phase-2 speed) + drone + rusher + rusherCluster companions |

## Auto-scaling beyond level 10

`getLevelConfig(levelIndex)` handles all levels past the handcrafted 10 using the
helpers above. For a 1-based `level`:

- drone interval `di = max(0.3, 1.2 / spawnFreqForLevel(level))`
- Normal levels: drones (`di`) + tanks (`di × 4`); even levels add rushers (`di × 2`)
  + rusherClusters (`di × 2.5`); odd levels add 1 miniboss at t=15 (speedMult 0.5)
- All mobs use `speedMultForLevel(level)`; health from the per-type helpers
- Boss levels exist **only at 15 and 20**; from level 21 on there are no more bosses
- Level 21+: drones are a flat 4 shots (1200 HP); difficulty rises via speed + density

### Level 15 boss (special case)

Mirrors level 10: laser attack, companion waves of drones + rushers + rusherClusters.

- **Boss:** 60 shots → 15 000 HP (healthMult 10.0), speedMult 2.5, laser enabled;
  phase 2 (below 50 % HP) ×1.5 speed
- Companions use `droneHealthMult(15)` / `rusherHealthMult(15)` / `clusterHealthMult(15)`
  at `speedMultForLevel(15)`

`BOSS_FILL = 300` s is the companion-wave duration in boss levels; the boss dying ends
the level long before this elapses.

### Level 20 boss (special case)

Dual-boss encounter — no companions. Both bosses fire lasers; the second spawns 2.5 s
after the first to stagger their laser cycles.

- **Boss count:** 2 (t=3 s and t=5.5 s)
- **Each boss:** 60 shots → 18 000 HP (healthMult 12.0), speedMult 2.5; phase 2 ×1.5

## Speed cap

The spawner clamps every mob's effective speed to `MOB_SPEED_CAP` (418 px/s = 95 % of
the 440 px/s player max) via the `speedCap` parameter on `BaseEnemy`. Minibosses and
bosses pass `speedCap = Infinity` (minibosses are intrinsically slow; bosses use
authored speeds). Drone and rusher constructors also carry a secondary 484 px/s hard
cap, which the 418 px/s mob cap sits below.
