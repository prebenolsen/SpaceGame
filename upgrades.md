# Upgrade System

## Trigger

Upgrades are offered after each level is cleared. When the level-clear screen is dismissed, `pickUpgradeChoices()` returns **all** unlocked, non-maxed upgrades and the game switches to the upgrade scene. If no upgrades are available (all unlocked ones are maxed), the level advances without showing the screen.

Every available upgrade is shown — there is no cap on the number of cards. The upgrade screen uses up to 2 rows when there are more than 4 choices, scaling card width to fit the screen.

### Score-based bonus picks

Reaching certain cumulative score thresholds awards one extra upgrade pick each, granted at the end of the level where the threshold is first crossed:

| Milestone | Points |
|-----------|--------|
| 1st bonus | 500 |
| 2nd bonus | 1 500 |
| 3rd bonus | 3 000 |
| 4th bonus | 5 000 |

Logic lives in `_onLevelClearContinue()` / `_onReplayLevelClearContinue()` in `src/core/game.js`. `_scoreUpgradeMilestones` tracks how many thresholds have already been rewarded.

## Unlock progression

Upgrades are gated — not all are available from the start.

| ID | Unlocks when |
|----|-------------|
| `laserFireRate` | Always available |
| `arcFireRate` | Always available |
| `laserDamage` | Level 2 cleared |
| `arcDamage` | Level 2 cleared |
| `laserWidth` | Level 3 cleared |
| `arcRange` | Level 3 cleared |
| `moveSpeed` | Level 5 cleared |
| `arcCone` | `arcRange` maxed (rank 8) |

## Available upgrades

Defined in `src/systems/upgrade.js`.

| ID | Category | Effect per rank | Max ranks |
|----|----------|-----------------|-----------|
| `laserFireRate` | Laser (blue `#42a5f5`) | +0.5 shots/sec | 8 |
| `laserWidth` | Laser (blue `#42a5f5`) | ×2 beam width | 4 |
| `laserDamage` | Laser (blue `#42a5f5`) | +25 damage per shot | 10 |
| `arcFireRate` | Arc (purple `#ce93d8`) | +0.5 pulses/sec | 8 |
| `arcRange` | Arc (purple `#ce93d8`) | +60 px range | 8 |
| `arcCone` | Arc (purple `#ce93d8`) | ×2 cone width | 3 |
| `arcDamage` | Arc (purple `#ce93d8`) | +15 damage per pulse | 10 |
| `moveSpeed` | Speed (yellow) | +20% movement speed | 6 |

## Stat formulas

`getPlayerStats()` in `src/systems/upgrade.js` derives live values from current ranks:

```
laserDamage   = 50  + rank * 25
laserInterval = 1 / (1 + rank * 0.5) seconds between shots
laserWidth    = 3 * 2^rank  px  (3 → 6 → 12 → 24 → 48)

arcDamage     = 40  + rank * 15
arcInterval   = 1 / (1 + rank * 0.5) seconds between pulses
arcRange      = 150 + rank * 60  px
arcHalfAngle  = min(π, π/5 * 2^rank)  radians
                rank 0 = 72° total | rank 1 = 144° | rank 2 = 288° | rank 3 = full circle

moveSpeed     = 200 * (1 + rank * 0.2)
```

## Selection UI

`src/ui/upgrade-screen.js` renders up to 3 horizontal cards. Each card shows:
- A color strip for the category
- Rank pips (filled/empty bars for current vs max rank)
- Upgrade name and description

Tapping a card calls `_onUpgradePick()` in `src/core/game.js`.

## Applying an upgrade

1. `applyUpgrade(upgrades, id)` increments `upgrades[id]` by 1.
2. `_applyUpgrades()` calls `getPlayerStats()` to recalculate all derived stats.
3. `player.applyStats(stats)` pushes the new values onto the live player:
   - Sets cooldown intervals for laser and arc weapons.
   - Stores stat values used when projectiles are fired (including `arcHalfAngle`).

## Persistence

Upgrades are stored in `localStorage` under key `space-survivor-save` as a plain object mapping upgrade ID → rank (e.g. `{ laserFireRate: 3, arcRange: 8, ... }`). Locked upgrades are stored at rank 0 and simply excluded from choices until their unlock condition is met.

- Saved after every level completion (`src/utils/storage.js`).
- Loaded on game start.
- Reset to all-zeros on game over / restart.

## Key files

| File | Role |
|------|------|
| `src/systems/upgrade.js` | Upgrade definitions (with `unlockWhen`), stat formulas, choice picker |
| `src/ui/upgrade-screen.js` | Card UI for selecting an upgrade |
| `src/core/game.js` | Trigger logic, `_onUpgradePick`, `_applyUpgrades` |
| `src/entities/player.js` | `applyStats()` — pushes stats onto weapons; passes `arcHalfAngle` when firing |
| `src/utils/storage.js` | Save / load / reset |
| `src/entities/projectiles/laser.js` | Consumes `laserDamage`, `laserWidth` |
| `src/entities/projectiles/arc.js` | Consumes `arcDamage`, `arcRange`, `arcHalfAngle` |
