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
| 11 | 2.20 | 200 | 440   | 11.000 | 86.0  | 1.20 |
| 12 | 2.40 | 225 | 540   | 13.500 | 92.5  | 1.11 |
| 13 | 2.60 | 225 | 585   | 14.625 | 99.4  | 1.03 |
| 14 | 2.80 | 250 | 700   | 17.500 | 106.9 | 0.95 |
| 15 | 3.00 | 250 | 750   | 18.750 | 114.9 | 6.0 (companion) |
| 16 | 3.00 | 300 | 900   | 22.500 | 123.5 | 0.82 |
| 17 | 3.25 | 300 | 975   | 24.375 | 132.7 | 0.76 |
| 18 | 3.50 | 300 | 1050  | 26.250 | 142.6 | 0.70 |
| 19 | 3.75 | 300 | 1125  | 28.125 | 153.3 | 0.65 |
| 20 | —    | —   | —     | —      | —     | — (dual boss, no companions) |
| 21+ | 4.00 | 300 | 1200 | 30.000 | 177.2 → cap | 0.56 → floor 0.30 |

From level 21 on, drones are a flat **4 shots / 1200 HP**. Speed keeps climbing
(see below) and cadence keeps tightening, so endless levels harden via *speed and
density*, not HP.

## Bosses

`healthMult = bossHP / 1500`. Boss speed is **authored** (bosses are not "mobs",
so the +7.5 %/level rule does not apply); phase-2 adds ×1.5 below 50 % HP except
where disabled.

| Lvl | Shots | dmg | Boss HP | healthMult | Speed (px/s) | Notes |
|----:|------:|----:|--------:|-----------:|-------------:|-------|
| 5  | 25 | 100 | 2 500  | 1.667 | 54 (×1.2)  | drone + rusher companions |
| 10 | 50 | 175 | 8 750  | 5.833 | 90 (×2.0)  | laser; phase-2 speed off |
| 15 | 60 | 250 | 15 000 | 10.000 | 112.5 (×2.5) | laser; drone/rusher/cluster companions |
| 20 | 60 | 300 | 18 000 | 12.000 | 112.5 (×2.5) | **two** laser bosses, offset 2.5 s, no companions |

There are no boss levels beyond 20.

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

- **Levels 1–10:** mobs move at **base speed** (speedMult 1.0). They never speed up
  before level 11.
- **Levels 11+:** speed grows **+7.5 % per level** — `speedMult = 1.075^(level − 10)`.
- **Cap:** effective speed never exceeds **95 % of the player's max speed**
  = `440 × 0.95 = 418 px/s` (`MOB_SPEED_CAP`, enforced in the spawner). Given the
  base speeds, drones reach the cap around level 33, rushers around level 29.
- Minibosses are deliberately slow (speedMult 0.5) and uncapped; bosses use authored
  speeds (table above).

## Spawn-rate rule

- **Levels 1–11:** baseline cadence (levels 1–10 use authored intervals; level 11 is
  the auto-scale baseline at a 1.20 s drone interval).
- **Levels 12+:** spawn frequency rises so enemies spawn **twice as often by level 20
  as at level 11** — `freq = 2^((level − 11) / 9)` (≈ +8 %/level). The drone interval
  is `1.2 / freq`, and tank/rusher/cluster intervals are multiples of it, so the whole
  spawn mix tightens together.
- Growth continues past level 20 for endless play, with the drone interval **floored at
  0.30 s** (reached around level 29).
