# CLAUDE.md — Project instructions

## Documentation maintenance

The following files document live game systems. **Keep them up to date whenever you make changes that affect them.**

| File | Update when |
|------|-------------|
| `upgrades.md` | Any change to `src/systems/upgrade.js` (upgrade definitions, stat formulas, max ranks, choice logic) or to how upgrades are triggered, applied, or persisted in `src/core/game.js` / `src/utils/storage.js` |
| `level-config.md` | Any change to `src/levels/level-config.js` (new levels, modified durations, enemy mixes, spawn helpers, auto-scale logic, or new enemy types) |

Update the relevant `.md` file in the same commit/change as the code edit — do not defer it.
