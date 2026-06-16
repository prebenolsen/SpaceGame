# CLAUDE.md — Project instructions

## Documentation maintenance

The following files document live game systems. **Keep them up to date whenever you make changes that affect them.**

| File | Update when |
|------|-------------|
| `upgrades.md` | Any change to `src/systems/upgrade.js` (upgrade definitions, stat formulas, max ranks, choice logic) or to how upgrades are triggered, applied, or persisted in `src/core/game.js` / `src/utils/storage.js` |
| `level-config.md` | Any change to `src/levels/level-config.js` (new levels, modified durations, enemy mixes, spawn helpers, auto-scale logic, or new enemy types) |
| `supabase.md` | Any change to `src/utils/supabase.js` (table schema, column additions, query logic, RLS policies) or to how/where scores are submitted. If the table schema changes, add a row to the **Schema migrations** table in `supabase.md` with the migration SQL. |
| `changelog.md` | **Every code change, no exceptions.** Add a new `## <version>` section at the top describing what changed. Do this in the same edit as the version bump — do not defer it. |

Update the relevant `.md` file in the same commit/change as the code edit — do not defer it.

## Version number

The game version lives in `src/version.js` (exported as `VERSION`) and is displayed on the level-select screen (bottom-right corner).

**Bump the version every time you make any code change.** Use semantic versioning: increment the patch digit (e.g. `1.0` → `1.1` → `1.2`) for fixes and tweaks; increment the minor digit (e.g. `1.2` → `1.3` → `2.0`) for larger feature additions. Do this in the same edit as the code change — do not defer it.
