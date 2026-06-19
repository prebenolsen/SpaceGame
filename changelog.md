# Changelog

## 6.4
- **Godmode level range extended to 1–30** (`src/core/game.js`, `src/ui/level-select.js`): the godmode level picker now offers levels 1 through 30 instead of 1 through 21. Levels beyond the defined set already auto-scale (endless boss assault from level 25), so the higher starting levels are fully playable.

## 6.3
- **Speed cap now ramps late-game** (`src/levels/level-config.js`, `src/systems/spawner.js`): the enemy speed cap stays at 92.5 % of the player's max speed through level 20, then climbs +1 %/level across levels 21–24, holding at 96.5 % from level 24 on (`mobSpeedCapForLevel`). The spawner reads the cap per level instead of a fixed constant.
- **Endless boss assault from level 25** (`src/levels/level-config.js`, `src/systems/spawner.js`): levels 25+ are now boss-gated. They field laser bosses of the same type as the level-15 boss, each with the HP of **ten drones** and moving at that level's drone speed (capped like the mobs). Level 25 has **one** boss (spawns 10 s in); every level after adds one more (**2 on 26, 3 on 27**, …), each spawning 4 s after the previous. Companion drone/tank/rusher/cluster waves spawn throughout. Bosses can now opt into the mob speed cap via a new `capSpeed` entry flag.

## 6.2
- **Narrower spawn exclusion zones** (`src/systems/spawner.js`): the no-spawn wedges around due north (270°) and due south (90°) shrank from 15° to 10° on each side. Enemies can now appear closer to top and bottom of the screen, but still never spawn directly north or south. Allowed arc grew from 300° to 320°.

## 6.1
- **Boss & level tuning** (`src/levels/level-config.js`, `src/entities/enemies/boss.js`, `src/systems/spawner.js`):
  - **Level 5 boss:** companion adds now spawn twice as often (drone interval 8→4 s, rusher 12→6 s).
  - **Level 10 boss:** 2× health.
  - **Level 15 boss:** 4× health.
  - **Level 20 boss:** each of the two bosses has 3× health and fires its laser 50 % more often (new `laserRateMult` option on the Boss; threaded through the spawner). The level now also spawns companion adds (drone/rusher/cluster) at the same cadence as level 10.
  - **Levels 6–9:** add (drone/tank/rusher/cluster/miniboss) speed increased via explicit `speedMult` (L6 ×1.10, L7 ×1.15, L8 ×1.20, L9 ×1.25).
  - **Minibosses:** no longer deliberately slow — they now keep pace with the level's drones via the new `minibossSpeedMult()` helper (was a flat `speedMult: 0.5`), and are now subject to the absolute speed cap.
- **Levels 11–19 rebalance:** spawn frequency now grows more gently (`spawnFreqForLevel` divisor 9→12, so spawns double by ~L23 instead of L20) while enemy speed ramps faster (`speedMultForLevel` +7.5 %/level → +10 %/level).
- **Absolute enemy speed cap** lowered to 92.5 % of the player's maxed speed (`MOB_SPEED_CAP` = 440 × 0.925 = 407 px/s, was 418). The cap now applies to every enemy except bosses (minibosses included).

## 6.0
- **Reworked the entire enemy scaling system** (`src/levels/level-config.js`, `src/systems/spawner.js`). Enemy health is now derived from a single model: assuming the player follows the recommended build (every pick into laser damage / fire-rate, alternating, damage first), each level's drone HP is set to a target *shots-to-kill* × the player's *damage-per-shot at that level* (which ramps 50→300 as picks accrue, maxed by L16). Drone shots-to-kill: L1 1.0, L2 1.15, L3 1.25, L4 1.35, L6 1.5, L7 1.75, L8 2.0, L9 2.0, L11 2.2, L12 2.4, L13 2.6, L14 2.8, L16 3.0, L17 3.25, L18 3.5, L19 3.75, L21+ flat 4.0. Bosses: L5 25 shots, L10 50, L15 60, L20 60 each. Rushers are half a drone's shots; clusters = a drone; tanks ×3; minibosses ×8.
- **Speed:** mobs now move at base speed through level 10 and only speed up from level 11 (+7.5 %/level, `1.075^(level−10)`), capped at 418 px/s (95 % of player max, `MOB_SPEED_CAP`). Removed the old compounding `1.1^(level−5)` spawner boost and the tiered per-level speed caps; speed is now fully defined by the level config's `speedMult`, with the spawner only enforcing the mob cap (minibosses/bosses uncapped).
- **Spawn rate:** cadence is flat through level 11 (baseline 1.20 s drone interval) then rises so spawns are twice as frequent by level 20 (`freq = 2^((level−11)/9)`), continuing past 20 with the drone interval floored at 0.30 s. Tank/rusher/cluster intervals are multiples of the drone interval so the whole mix tightens together.
- New `enemy_scaling.md` documents every level's health, speed, and spawn cadence per enemy type, plus the damage model.

## 5.13
- Reworked upgrade-pick awards: clearing a level now grants a fixed **1 pick per level, 2 picks for boss levels** (`isBoss`), via the new `_picksForClearedLevel()` helper in `src/core/game.js`. Removed the score-milestone bonus-pick system entirely — the `SCORE_MILESTONES` table, the `_scoreUpgradeMilestones` counter, and its `localStorage`/save-state plumbing are gone (`game.js`, `src/utils/storage.js`). Base picks were previously `levelNumber >= 8 ? 2 : 1`. Godmode's starting-pick formula now mirrors the new scheme (`(level-1) + floor((level-1)/5) + 4`). Banked/pending picks (Menu-on-clear) still work, now banking only the level's fixed picks.

## 5.12
- Fixed two stale comments in `src/levels/level-config.js` so they match the code: the Level 5 boss comment now reads `Boss 4× → 6000 HP` (was `1.8× → 2700 HP`), and the auto-scale `bossScale` comment no longer claims it "continues from the level-10 boss (5×)" (the level-10 boss is 14×) — it now describes the formula's 5× base. No gameplay change.

## 5.11
- Boss 10 no longer enters a phase 2 speed increase at 50% HP (`enablePhase2Speed: false` in the level config). A new `enablePhase2Speed` option on the Boss entity (default `true`) controls this per-boss; the spawner passes it through from the wave entry.
- Auto-scale base `speedMult` reduced from 2.4 to 2.1 (level 11 drops from ~340 px/s to ~297 px/s for drones; the +7.5%/level ramp is unchanged).

## 5.10
- Pending upgrade picks: if the player clears a level and chooses "Menu" instead of picking an upgrade, the skipped picks are now banked and added on top of the next level's picks. Score-milestone bonus picks are also banked correctly. Banked picks survive app restarts (stored in `localStorage` as `pendingUpgradePicks`). Replay-mode level clears that step into new campaign territory also consume banked picks.

## 5.9
- PWA auto-update: the app now checks for a new version on every launch and reloads automatically if one is already staged. If a new version installs while the app is running (mid-session), a "Update available" button appears at the bottom of the screen; tapping it reloads into the new version. Users never need to manually clear the cache. Offline play continues to work unchanged. Also fixed the service worker asset list which was missing several JS files (`rusher-cluster.js`, `supabase.js`, `scoreboard.js`, `config.js`, `level-select.js`, `version.js`); updated cache name to `space-survivor-v4`.

## 5.8
- Fixed bug where bosses and minibosses were instantly killed when they collided with the player. Bosses and minibosses now survive player contact and can only die from weapon damage. When a boss or miniboss hits the player it is frozen for 1 second instead of being deactivated.

## 5.7
- Level 20 dual bosses are now capped at 484 px/s (110% of max player speed) by the spawner, matching the hard stop for L21+ regular enemies. Previously the spawner boost pushed the L20 boss to ~865 px/s. Phase 2 (below 50% HP) still multiplies speed by 1.5× (726 px/s).

## 5.6
- Enemy speed is now capped by a level-specific limit applied in the spawner before the enemy is constructed: 418 px/s (95% player max) for levels 11–16, 440 px/s (100%) at level 17, 462 px/s (105%) for levels 18–20, and 484 px/s (110%) from level 21 onward (hard stop). This replaces the previous blanket 528 px/s cap and fixes rusherClusters which had no cap and could become unboundedly fast at high levels.
- RusherCluster members now share the same healthMult as drones at their level, across all hand-authored and auto-scaled levels. Previously clusters used 40% of drone HP in auto-scale and mismatched values in levels 6, 8, 10, and 15. In levels 21+ rusherCluster HP now scales with drones (was frozen at the level-21 base).
- Drone and rusher constructor hard-caps lowered from 528 px/s (120% player max) to 484 px/s (110%), matching the new absolute ceiling.

## 5.5
- Godmode redesigned: after the 5-second activation, a level picker (1–21) is shown instead of jumping straight to level 20 with all upgrades maxed. Selecting a level opens the upgrade screen with the number of picks a normal campaign run would have earned by that point (7 picks for levels 1–8, then +2 per level from 8 onward) plus 4 extra picks. Only upgrades unlocked at the chosen level are offered, so the player builds an appropriate loadout through manual choices rather than receiving everything at once.

## 5.4
- From level 21 onwards there are no more boss levels. Drone health grows an additional +5% per level (compounding from the level-21 base); rusher and rusherCluster health is frozen at the level-21 base value (~35× and ~28× respectively). Drones spawn 10% more frequently each level (interval shrinks ×0.9 per level, floor 0.3 s). Tank and miniboss health continue to scale proportionally with drones; all other spawn intervals are frozen at their level-21 values.

## 5.3
- Level 20 is now a handcrafted dual-boss encounter: two laser bosses, no companion enemies. Each boss HP = 75 × a level-19 drone (≈ 145 119 HP, healthMult ≈ 96.75). The second boss spawns 2.5 s after the first so their laser cycles are staggered.

## 5.2
- Auto-scale difficulty reworked: level 11 now starts 25% harder than level 9 (drone healthMult 11.25, spawn interval 1.2 s, speedMult 2.4) instead of the previous formula which made it easier.
- Health scales ×1.20 per level (was linear +2), spawn interval shrinks ÷1.15 per level for 15% more mobs (was `5/(1+extra×0.15)` with a 1.5 s floor), and speed grows ×1.075 per level from a 2.4 base. Speed floor for interval raised from 1.5 s to 0.5 s.
- Boss companion drones in auto-scale levels now receive the correct `speedMult` (was omitted, defaulting to 1×).
- Level 15 boss is now a full-featured fight matching level 10: fires a laser attack every 5 s, spawns drone + rusher + rusherCluster companion waves. Boss HP = 100× a level-14 drone (77 760 HP, healthMult 51.84).

## 5.1
- Arc cone now scales by ×1.25 per rank instead of ×2 (72° → 90° → 112.5° → 140.625°); maxRank stays 3.
- Arc range now scales by ×1.25 per rank (150 → 187.5 → 234.4 → 293px); maxRank reduced from 8 to 3.
- `arcCone` unlock condition updated from arcRange ≥ 8 to arcRange ≥ 3.
- New upgrade **Arc Stun** (Arc category, maxRank 2): unlocks when arcFireRate, arcRange, arcCone, and arcDamage are all maxed. Rank 1 = 2.5% chance, rank 2 = 5% chance to stun non-boss/miniboss enemies for 2s on Arc hit.
- New upgrade **Laser Stun** (Laser category, maxRank 2): unlocks when laserFireRate and laserDamage are maxed. Both ranks give 5% chance to stun non-boss/miniboss enemies for 2s on Laser hit.

## 5.0
- Godmode: Start at level 20 with all upgrades maxed. A red progress bar fills along the bottom of the card while holding.

## 4.9
- Scoreboard now records the game version with each score submission (`version` column in Supabase). The scoreboard defaults to showing the newest version's scores, with ‹ / › arrow buttons to browse older versions.
- Drone speed is now capped at 528 px/s (20% faster than a fully-upgraded player's max move speed), matching the existing rusher cap.
- Boss levels now limit companion enemies to `level` on-screen at once (level 5 → 5 companions, level 10 → 10, etc.), preventing the screen from being overwhelmed.

## 4.8
- Boss direction indicator: a pulsing red arrow appears around the player pointing toward the boss whenever the boss is off-screen. The arrow disappears once the boss is nearly in view.

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
