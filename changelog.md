# Changelog

## 3.5
- Redesigned the landing page (`src/ui/landing.js`) to match the Space Survivor design system. The plain `#05050f` fill gains a procedural starfield (deterministic, cached per size). A glowing geometric **ship glyph** now sits above the title, the title carries the ship-blue text glow, and "Choose how to begin" is replaced by the full tagline ("You are the ship at the center of the void…").
- The two choice cards now use the design's recipe: translucent deep-blue fill (`rgba(10,10,46,.55)`) with a glowing accent border (Tutorial = laser blue `#42a5f5`, Start = success green `#69f0ae`). Emoji icons (🎓 🚀) are replaced by the brand's geometric glyphs — a **drone** circle for Tutorial and the **ship** triangle for Start — and each card ends in a pill **badge** ("New players" neutral, "Skip tutorial" solid green).
- Added a **"WHAT HUNTS YOU"** roster legend along the bottom showing the drone / rusher / tank / miniboss / boss glyphs. Glyph shapes/colors mirror `src/rendering/draw-player.js` & `draw-enemies.js`. Whole composition scales down on small screens.

## 3.4
- Tutorial 1 bottom tooltip now sits much lower — anchored down into the top of the joystick band (bottom-center of the screen) instead of floating above it where it read as mid-screen. Also fixed a width bug where the box could be capped narrower than its own text and clip it.
- Actually fixed the lingering Arc in Tutorial 2: the leftover was the **aim cone** (`arcAim`), not just the fired projectile. Tutorial 2 never calls `Player.update`, so `arcAim.active`/`laserAim.active` kept their Tutorial 1 values and stayed drawn. Both aim flags are now cleared (alongside the projectiles) when Tutorial 2 starts.

## 3.3
- Added a landing page (`src/ui/landing.js`, new `SCENE.LANDING`) shown on a fresh start instead of auto-launching the tutorial. Two tappable cards: **Tutorial** (left) starts Tutorial 1; **Start** (right) skips the tutorial and jumps straight into Level 1 (sets `level = 1`, saves, shows the Level 1 intro).
- Game Over "restart" and the level-intro "reset everything" now return to the landing page instead of forcing the tutorial.

## 3.2
- Tutorial 1 bottom tooltip now hugs its text, stays within the gap between the steer and laser joysticks, and sits just above the joystick row (centered at the bottom middle) instead of floating high and spanning up to 480px wide.
- Fixed the Arc cone visual being stuck on screen at the start of Tutorial 2: Tutorial 2 never calls `Player.update`, so the arc's life-decay never ran and it stayed active. The arc and laser are now explicitly cleared when Tutorial 2 starts.
- Tutorial 2 now spawns two chasing drones (one above, one below) instead of one.

## 3.1
- Fixed blank screen on startup for fresh players: Tutorial 1 calls `Player.update` with one joystick set to `null` (only one weapon enabled per phase), but `Player.update` dereferenced `.active` on both joysticks, throwing every frame and leaving the canvas blank. `Player.update` now treats a null joystick as inactive.

## 3.0
- Added two-part interactive tutorial that runs before Level 1 on every fresh start
  - Tutorial 1: one stationary drone (laser only) → two close drones (arc only) → 2 s wait → "Tutorial 1 completed!" overlay
  - Tutorial 2: move-joystick only, top tooltip for 7 s explaining outrunning, then a chasing drone pursues the player for 20 s
- Tutorials bypass the normal level-intro/clear/upgrade flow; returning players (save.level ≥ 1) skip them
- Only the relevant joystick is drawn and interactive during each tutorial phase
- HUD timer area shows "TUTORIAL 1" / "TUTORIAL 2" instead of "LVL X" during tutorials
- Freeze button hidden during tutorials (level < 4 guard unchanged)
- Upgrade unlock thresholds restored to 1-indexed levels: damage at level 2, width/range at level 3

## 2.9
- Level 0 (static triangle tutorial) removed; replaced by the new tutorial system in 3.0
- `defaultSave().level` set to 0 so fresh starts enter the tutorial

## 2.8
- Freeze button now only visible and interactive from Level 4 onward
- Freeze button displays "Emergency button!" label above it; grays out when no charges remain
- Upgrade visibility gated by level: Level 1 shows only Laser Speed + Arc Speed; Level 2 adds Laser Damage + Arc Damage; Level 3 adds Laser Width + Arc Range

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
