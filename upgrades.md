# Upgrade System

## Trigger

Upgrades are offered after each level is cleared. When the level-clear screen is dismissed, `pickUpgradeChoices()` returns **all** unlocked, non-maxed upgrades and the game switches to the upgrade scene. If no upgrades are available (all unlocked ones are maxed), the level advances without showing the screen.

Every available upgrade is shown — there is no cap on the number of cards. The upgrade screen uses up to 2 rows when there are more than 4 choices, scaling card width to fit the screen.

## Unlock progression

Upgrades are gated — not all are available from the start.

| ID | Unlocks when |
|----|-------------|
| `laserFireRate` | Always available |
| `arcFireRate` | Always available |
| `arcRange` | Always available |
| `moveSpeed` | Level 5 cleared |
| `laserWidth` | `laserFireRate` maxed (rank 8) |
| `laserDamage` | `laserFireRate` maxed (rank 8) |
| `arcCone` | `arcRange` maxed (rank 8) |
| `arcDamage` | `arcFireRate` maxed (rank 8) |

## Available upgrades

Defined in `src/systems/upgrade.js`.

| ID | Category | Effect per rank | Max ranks |
|----|----------|-----------------|-----------|
| `laserFireRate` | Laser (purple) | +0.5 shots/sec | 8 |
| `laserWidth` | Laser (purple) | ×2 beam width | 4 |
| `laserDamage` | Laser (purple) | +25 damage per shot | 10 |
| `arcFireRate` | AOE (blue) | +0.5 pulses/sec | 8 |
| `arcRange` | AOE (blue) | +60 px range | 8 |
| `arcCone` | AOE (blue) | ×2 cone width | 3 |
| `arcDamage` | AOE (blue) | +10 damage per pulse | 10 |
| `moveSpeed` | Speed (yellow) | +20% movement speed | 6 |

## Stat formulas

`getPlayerStats()` in `src/systems/upgrade.js` derives live values from current ranks:

```
laserDamage   = 50  + rank * 25
laserInterval = 1 / (1 + rank * 0.5) seconds between shots
laserWidth    = 3 * 2^rank  px  (3 → 6 → 12 → 24 → 48)

arcDamage     = 20  + rank * 10
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
