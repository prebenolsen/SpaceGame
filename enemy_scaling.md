# Enemy scaling

This document tracks every level's **health**, **spawn-rate**, and **speed** for each
enemy type. It is the human-readable companion to the scaling helpers in
[`src/levels/level-config.js`](src/levels/level-config.js); keep the two in sync.

## The model

Health is tuned against an **assumed upgrade path**: the player spends every upgrade
pick on the laser, alternating **laser damage** and **laser fire-rate** (damage first)
until both are maxed.

| Stat | Per rank | Max rank | Range |
|------|----------|----------|-------|
| `laserDamage`   | +25 dmg/shot | 10 | 50 → **300** dmg/shot |
| `laserFireRate` | +0.5 shots/s | 8  | 1 → **5** shots/s |

Maxed DPS = `300 × 5 = 1500`. The player's **absolute max move speed** (maxed
`moveSpeed`, rank 6) is `200 × 2.2 = 440 px/s`.

Picks are earned by clearing levels (**1 per level, 2 per boss level**), so the
per-shot damage the player has *when entering a level* is fixed and known. Each
enemy's HP is set so that a **drone** dies in a target number of shots **at that
level's damage**:

```
droneHP(level) = shotsToKill(level) × damagePerShot(level)
```

This is why level 1 stays a true one-shot (50 HP vs 50 dmg) instead of jumping
straight to the maxed-damage value. Damage per shot ramps as picks accumulate:

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16+ |
|-------|---|---|---|---|---|---|---|---|---|----|----|----|----|----|----|-----|
| Picks earned | 0 | 1 | 2 | 3 | 4 | 6 | 7 | 8 | 9 | 10 | 12 | 13 | 14 | 15 | 16 | 18+ |
| **dmg/shot** | 50 | 75 | 75 | 100 | 100 | 125 | 150 | 150 | 175 | 175 | 200 | 225 | 225 | 250 | 250 | **300** |

(Laser damage is fully maxed at level 16.)

HP is stored as a `healthMult` over each entity's **base HP**:
drone **40**, rusher **12**, tank **150**, miniboss **600**, boss **1500**.

## Drones — shots-to-kill, HP, speed, cadence

`healthMult = droneHP / 40`. Boss-level rows (5/10/15) describe that level's
*companion* drones; the boss itself is in the boss table below.

| Lvl | Shots | dmg | Drone HP | healthMult | Speed (px/s) | Drone interval (s) |
|----:|------:|----:|---------:|-----------:|-------------:|-------------------:|
| 1  | 1.00 | 50  | 50    | 1.250  | 80    | 3.0 |
| 2  | 1.15 | 75  | 86.25 | 2.156  | 80    | 4.0 |
| 3  | 1.25 | 75  | 93.75 | 2.344  | 80    | 3.0 |
| 4  | 1.35 | 100 | 135   | 3.375  | 80    | 2.5 |
| 5  | 1.40 | 100 | 140   | 3.500  | 80    | 8.0 (companion) |
| 6  | 1.50 | 125 | 187.5 | 4.688  | 80    | 2.5 |
| 7  | 1.75 | 150 | 262.5 | 6.563  | 80    | 2.0 |
| 8  | 2.00 | 150 | 300   | 7.500  | 80    | 1.8 |
| 9  | 2.00 | 175 | 350   | 8.750  | 80    | 1.5 |
| 10 | 2.00 | 175 | 350   | 8.750  | 80    | 6.0 (companion) |
| 11 | 2.20 | 200 | 440   | 11.000 | 88.0  | 1.20 |
| 12 | 2.40 | 225 | 540   | 13.500 | 96.8  | 1.13 |
| 13 | 2.60 | 225 | 585   | 14.625 | 106.5 | 1.07 |
| 14 | 2.80 | 250 | 700   | 17.500 | 117.1 | 1.01 |
| 15 | 3.00 | 250 | 750   | 18.750 | 128.8 | 6.0 (companion) |
| 16 | 3.00 | 300 | 900   | 22.500 | 141.7 | 0.90 |
| 17 | 3.25 | 300 | 975   | 24.375 | 155.9 | 0.85 |
| 18 | 3.50 | 300 | 1050  | 26.250 | 171.5 | 0.80 |
| 19 | 3.75 | 300 | 1125  | 28.125 | 188.6 | 0.76 |
| 20 | 4.00 | 300 | 1200 | 30.000 | 207.5 | 6.0 (companion) |
| 21+ | 4.00 | 300 | 1200 | 30.000 | 228.2 → cap | 0.67 → floor 0.30 |

From level 21 on, drones are a flat **4 shots / 1200 HP**. Speed keeps climbing
(see below) and cadence keeps tightening, so endless levels harden via *speed and
density*, not HP.

## Bosses

`healthMult = bossHP / 1500`. Boss speed is **authored** (bosses are not "mobs",
so the +7.5 %/level rule does not apply); phase-2 adds ×1.5 below 50 % HP except
where disabled.

| Lvl | Shots | dmg | Boss HP | healthMult | Speed (px/s) | Notes |
|----:|------:|----:|--------:|-----------:|-------------:|-------|
| 5  | 25 | 100 | 2 500  | 1.667 | 54 (×1.2)  | drone + rusher companions (adds spawn 2× as often) |
| 10 | 50 | 175 | **17 500** (×2) | 11.667 | 90 (×2.0)  | laser; phase-2 speed off |
| 15 | 60 | 250 | **60 000** (×4) | 40.000 | 112.5 (×2.5) | laser; drone/rusher/cluster companions |
| 20 | 60 | 300 | **54 000** (×3) | 36.000 | 112.5 (×2.5) | **two** laser bosses, offset 2.5 s; laser fires 50 % more often (`laserRateMult 1.5`); drone/rusher/cluster companions (L10 cadence) |

The L10/L15/L20 boss HP multipliers (×2/×4/×3) are applied on top of the
shots-derived `bossHealthMult` in the level config.

### Levels 25+ — endless laser-boss assault

From level 25 the level becomes **boss-gated** again (`isBoss: true`, no timer —
all bosses must die to advance). The bosses are the same type as the level-15
boss (laser enabled), but tuned differently:

- **Count:** `level − 24` bosses — **1 on L25, 2 on L26, 3 on L27**, and so on.
- **Spawn timing:** first boss at **10 s**, each subsequent boss **4 s** after the
  previous (10 s, 14 s, 18 s, …).
- **HP:** ten drones' worth — `healthMult = 10 × droneHP / 1500` (`lateBossHealthMult`).
  At L25 that's `10 × 1200 / 1500 = 8.0` (12 000 HP).
- **Speed:** matched to the level's drones — `speedMult = speedMultForLevel × 80/45`
  (`lateBossSpeedMult`), and unlike other bosses these **honor the mob speed cap**
  (`capSpeed` flag → `mobSpeedCapForLevel`). Phase-2 speed boost is disabled so the
  boss stays in lockstep with the mobs.
- **Companions:** full drone/tank/rusher/cluster waves spawn throughout, at the
  auto-scaled cadence.

## Other enemies

All derived from the level's drone so the whole roster scales together:

| Enemy | Base HP | HP rule | `healthMult` |
|-------|--------:|---------|--------------|
| **Rusher** | 12  | half a drone's shots-to-kill | `0.5 × droneHP / 12` |
| **RusherCluster** (per member) | 40 | = a drone | `droneHealthMult` |
| **Tank** | 150 | 3 drones' worth of HP | `3 × droneHP / 150` |
| **Miniboss** | 600 | 8 drones' worth of HP | `8 × droneHP / 600` |

Sample resulting HP:

| Lvl | Rusher HP | Cluster member HP | Tank HP | Miniboss HP |
|----:|----------:|------------------:|--------:|------------:|
| 4  | 67.5 | — | 405 | — |
| 7  | — | — | 787.5 | 2 100 |
| 8  | 150 | 300 | 900 | — |
| 9  | — | — | 1 050 | 2 800 |
| 11 | — | — | 1 320 | (odd lvl → miniboss 3 520) |
| 15 | 375 | 750 | — | — |
| 21+ | 600 | 1 200 | 3 600 | 9 600 |

Spawn cadence for these on auto-scaled levels (11+) is keyed off the drone
interval `di`: **tank `di × 4`, rusher `di × 2`, cluster `di × 2.5`**. Even levels
field rusher + cluster waves; odd levels field a single miniboss instead.

## Speed rule

- **Levels 1–10:** mobs move at **base speed** (speedMult 1.0) — *except* the
  handcrafted levels 6–9, whose adds get an explicit boost (L6 ×1.10, L7 ×1.15,
  L8 ×1.20, L9 ×1.25).
- **Levels 11+:** speed grows **+10 % per level** — `speedMult = 1.10^(level − 10)`
  (bumped from +7.5 % to compensate for slightly thinner spawn density on L11–19).
- **Cap:** effective speed is capped at a per-level fraction of the player's max
  speed (`mobSpeedCapForLevel`): **92.5 %** (`440 × 0.925 = 407 px/s`) through level
  20, then a single **+1 % step to 93.5 %** (`440 × 0.935 = 411.4 px/s`) at level 21,
  holding at that **93.5 %** end cap for all later levels. The cap applies to **every
  enemy except bosses** (minibosses included).
- Minibosses now keep pace with the level's drones via `minibossSpeedMult()` (was a
  flat speedMult 0.5). Bosses use authored speeds (table above) and are uncapped —
  **except** the level-25+ laser bosses, which opt into the mob cap (`capSpeed`) so
  they match the level's enemies.

## Spawn-rate rule

- **Levels 1–11:** baseline cadence (levels 1–10 use authored intervals; level 11 is
  the auto-scale baseline at a 1.20 s drone interval).
- **Levels 12+:** spawn frequency rises gently — `freq = 2^((level − 11) / 12)`, so
  spawns reach twice the level-11 rate around **level 23** (eased back from level 20 so
  L11–19 lean on enemy speed rather than density). The drone interval is `1.2 / freq`,
  and tank/rusher/cluster intervals are multiples of it, so the whole spawn mix tightens
  together.
- Growth continues past level 20 for endless play, with the drone interval **floored at
  0.30 s**.
