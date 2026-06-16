# Changelog

## 4.7
- Laser beam default width doubled (3 → 6px); upgrade formula updated to match (starts at 6, doubles per rank).
- Aim line (beam when not firing) changed to grey (#888888) at 40% opacity instead of blue at 45%.

## 4.6
- Force landscape orientation on mobile: attempts a Screen Orientation API lock (Android Chrome/PWA) and shows a "please rotate your device" overlay on portrait screens ≤1024px wide (works on iOS and all browsers without API support).

## 4.5
- Fixed level 10 boss laser attack: the `once()` spawn helper was silently dropping the `enableLaser` option, so the boss never used its laser. Boss now correctly fires its laser every 5 seconds as intended.
- Level 10 boss speed increased by 25% (speedMult 1.95 → 2.44).
- Global high-score leaderboard powered by Supabase: on game over, players enter their name and submit their score. Leaderboard sorts by points (descending) and shows highest level cleared alongside each score.
- "SCOREBOARD" button added to the main menu; opens the top-10 leaderboard.
- Top 3 scores are always shown on the home screen, refreshed each time the landing page is displayed.

## 4.4
- Removed miniboss from level 3; minibosses now appear only on odd levels after 5 (7, 9, 11, …).
- Rushers (and rusher clusters) now appear only on even levels after 5 (6, 8, 10, …); removed rusher waves from levels 7 and 9.
- Minibosses are always very slow (speedMult 0.5; exempt from the per-level progressive speed boost).
- Miniboss HP is now 8× the drone HP for its level.
- Miniboss score value raised from 75 to 120 points.
- Auto-scale levels (11+) follow the same rules: miniboss on odd levels, rushers/rusherClusters on even levels only.

## 4.3
- Rusher speed is now capped at 528 px/s (20% faster than a fully-upgraded player's max move speed of 440 px/s), preventing rushers from becoming impossible to dodge at high levels.
- Freeze button moved to the bottom-right corner of the screen.
- "Emergency button!" label on the freeze button is removed after level 4 (the first level it appears on).

## 4.2
- Score-based bonus upgrade picks now trigger at fixed milestones (500, 1500, 3000, 5000 points) instead of every 400 points.
- Level 10 boss speed increased by 30% (speedMult 1.5 → 1.95).
- Level 10 boss gains a laser attack: every 5 seconds it stops, tracks the player for 1 second (orange warm-up beam), locks direction for 0.5 seconds (yellow warning beam), then fires a damaging red/white beam. One hit to the player per firing cycle; boss resumes movement after each attack.

## 4.1
- Fixed joystick stuck issue: if the player was moving when Tutorial 2 ended, the move joystick would remain active in level 1. All joysticks and held keys are now reset when any level or tutorial starts.

## 4.0
- Added "Menu" button to the level-clear screen alongside "Continue", taking the player back to the front page.
- Front page "START" button becomes "CAMPAIGN" once levels have been cleared, showing how many levels are done and what's next.
- Added level-select screen: after clearing at least one level, the Campaign button opens a grid showing every cleared level (replay) plus the next unplayed level.
- Replay mode: replaying a cleared level uses 3 fresh practice lives, preserves the real campaign state, and does not add to cumulative score. Per-level high scores are tracked and updated whenever a level is beaten.
- Continuing past the highest cleared level in a replay exits replay mode and converts the run into a real campaign session (score and upgrades from the replay carry over, original lives are restored).
- Per-level high scores persist across game-over resets (only a full "Reset Everything" wipes them).
- Level-clear screen now shows the score earned this level and flags a new per-level best.

## 3.9
- Repositioned joysticks: left (move/steer) joystick shifted right by one joystick width; both right joysticks (laser, arc) shifted left by one joystick width, bringing them all closer to center.

## 3.8
- Level 3 and 4 last longer
- Level 5 boss has a greater health pool

## 3.7
- Level 1 now spawns more drones (wave fills full 25 s duration, interval tightened from 4 s → 3 s).
- Level 2 drone healthMult reduced from 1.3× → 1.0× so they die from a single base-damage laser shot.
- Score is now cumulative across rounds — it no longer resets at the start of each level. The "Level Clear" screen shows "Total Score" and the Game Over screen shows the final total.
- Free bonus upgrade pick awarded for every 500 points accumulated (e.g. at 500, 1000, 1500 …). Extra picks are granted alongside the normal level-clear upgrade phase.
- Miniboss base HP doubled (300 → 600). Each level now spawns exactly one miniboss (wave→once): L7 at t=10, L8 at t=15, L9 at t=12. L3 was already a single once() spawn.
- Rushers on level 7 and beyond spawn much less frequently: L7 interval 4 s → 12 s, L8 3.5 s → 12 s, L9 3 s → 12 s, L10 boss 6 s → 18 s.

## 3.6
- After completing Tutorial 2 the player is now returned to the landing/home screen instead of being immediately sent into Level 1, so they can choose whether to start or review the intro.
- Fixed boss levels (level 5, 10, and auto-scaled boss levels) auto-completing immediately on load: the completion check now waits until the boss has actually spawned before watching for its death (`_bossHasSpawned` flag in `game.js`).
- Reduced health pools for all enemies in levels 2 and beyond (~30–40% lower `healthMult` across the board), bringing shot-to-kill counts down and making the difficulty curve less steep.
- Reduced movement speed multipliers on all levels 2+ so enemies close in more slowly overall.
- Reduced rusher base speed from 150 → 110 px/s; rushers are now meaningfully faster than drones (80 px/s) without feeling erratic.

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
