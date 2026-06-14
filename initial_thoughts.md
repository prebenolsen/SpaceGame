I want to make a simple mobile game from scratch. When I am sitting on airplanes, I find that i have no games. So, we need to create something that is simple, but fun. It needs a continuously feeling of "leveling up". Help me sort my thoughts so we can design such a game.



Here are my thoughts so far:

1. Active or idle?

Mainly active, but let's assume there are either levels in which you can click "Continue" when you are ready. But once you play a round, it's non-stop. 



This way, we can configure each level's difficulty over time.



2. Session length? Assuming we go with the levels from point 1, the answer becomes: Depends how good the player is. It should be nearly impossible to fails the first few levels, those are considered tutorials in difficulty. Each level should be about "Can you survive for 60 seconds?"



3. What is the fantasy? Let's start simple. We are in space. We are always the center of the screen. Oh and I just had a realiziation: The mobile game should be played with the phone on its side, horizontally. On the left side, bottom left, the joystick lets the user controls the environment. Meaning: While the player is always centered, moving the joystick to the left, shifts the environment to the right, making it feel like we just went left. On the bottom right side, there are two joy sticks. One controls "single target" ability, and the other controls "area-of-effect" ability. When you  hold your finger on the joystick, and aim it in any direction, you use the ability in that direction. Key point: The game offers two weapons: Single target laser (hits only the first thing it hits, really hard, one shot per second initially), area-of-effect (hits everything in the direction, but at limited range, at decreased damage, once per second initially). This is the level up - you strenghten one of the two weapons using points earned from the previous levels, and you increase damage and shooting frequency + aoe-range for the area of effect.



You can also increase your own speed, allowing you to use the left joystick to "move around" faster, repositioning yourself. 



So, to recap: We are in space. We are the middle of the screen, always. Enemies spawn in the vast space, coming into the screen. We can move to avoid the enemies, or we can kill them using two weapons (single target laser and electricity). Each level means one of three things: There are more enemies / The enemies have more health / The enemies move faster. All three does not have to be true for each level, and all three does not have to apply to each enemy in the level. Meaning, e.g. in level 4, you can have 2 mini-bosses with increased health, 6 regular mobs, and 3 that move really fast and should be prioritized or moved away from. 



When a mob hits you, you take damage (so we must have a health bar visibile), and if you are hit 3 times, you die. You have 5 lives, so you get to retry the level you died on. After 5 deaths, it's game over. 



There should also be boss levels, every 5. Starting off easy, this is just one mob. He's big, got a lot of health. And then level 10, let's say there's the same boss with increased health, but he's got some smaller companions. This kind of logic. 



What are your thoughts? I want the game to be a PWA application on my phone, so it's all web-based. You may need internet to load the game, but there should be no internet requirements once you have startet it, and you can play the levels  When you make this game, be very thorough thorough in setting up folders and files, ensuring a very strict organization. e.g. all mob/npc-designs should have their own files in a folder. 