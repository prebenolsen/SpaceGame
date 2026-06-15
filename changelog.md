# Changelog

## 2.7
- `arcDamage` upgrade increased from +10 to +15 damage per pulse

## 2.6
- From level 8 onward, players choose 2 upgrades per level (shown as "Pick 1 of 2" / "Pick 2 of 2")

## 2.5
- `laserDamage` and `arcDamage` now unlock at level 5 instead of requiring maxed fire rate

## 2.4
- `rusherCluster` introduced at level 6 (replaces rushers), also appears in levels 8, 10, and all even auto-scale levels

## 2.3
- Added `rusherCluster` enemy: spawns as a trio (lead + 2 wings in V-formation), drone speed/HP/color, rusher shape

## 2.2
- Laser now pierces through all enemies in its path instead of stopping at the first hit

## 2.1
- Added joystick tooltips on level 1 ("Steer ship", "Laser", "Arc blast")
- Renamed AOE → Arc throughout (upgrade labels, categories, UI, docs)
- Adjusted level durations

## 2.0
- Ship now rotates to face the active weapon aim direction
- Weapon aim takes priority over movement direction for ship rotation
- Tightened joystick padding (60px → 16px from screen edge)
- Removed level-select jump and reset shortcuts from level intro screen

## 1.1
- Moved version number from bottom-right watermark to level intro header

## 1.0
- Added `version.js` and version display
- Added CLAUDE.md with project instructions

## Pre-release
- Added upgrade system v2 with Speed, Laser, and Arc categories
- Added boss levels with game-over on boss kill
- Added significant level difficulty scaling across all levels
- Added PWA support (installable, offline-capable)
- Added reset button and fixed upgrade persistence
- Fixed laser shooting, laser width, and health baseline
- Buffed Arc damage and range
- Improved mobile/phone layout and safe area handling
- Added sound effects for laser hits, arc hits, and player damage
- Improved projectile rendering and spawn system
- Initial game implementation (player, enemies, weapons, camera, HUD)
