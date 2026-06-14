const CACHE_NAME = 'space-survivor-v1';
const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/main.js',
  './src/core/game.js',
  './src/core/scene.js',
  './src/core/camera.js',
  './src/core/collision.js',
  './src/core/timer.js',
  './src/entities/player.js',
  './src/entities/enemies/base-enemy.js',
  './src/entities/enemies/drone.js',
  './src/entities/enemies/rusher.js',
  './src/entities/enemies/tank.js',
  './src/entities/enemies/miniboss.js',
  './src/entities/enemies/boss.js',
  './src/entities/projectiles/laser.js',
  './src/entities/projectiles/arc.js',
  './src/systems/spawner.js',
  './src/systems/combat.js',
  './src/systems/upgrade.js',
  './src/systems/lives.js',
  './src/ui/hud.js',
  './src/ui/joystick.js',
  './src/ui/level-intro.js',
  './src/ui/upgrade-screen.js',
  './src/ui/game-over.js',
  './src/ui/level-clear.js',
  './src/levels/level-config.js',
  './src/levels/wave-patterns.js',
  './src/rendering/renderer.js',
  './src/rendering/background.js',
  './src/rendering/draw-player.js',
  './src/rendering/draw-enemies.js',
  './src/rendering/draw-projectiles.js',
  './src/audio/sound-manager.js',
  './src/audio/sounds.js',
  './src/utils/math.js',
  './src/utils/pool.js',
  './src/utils/storage.js',
];

self.addEventListener('install', (event) => {
  if (!IS_DEV) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
  }
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const toDelete = IS_DEV ? keys : keys.filter((k) => k !== CACHE_NAME);
      return Promise.all(toDelete.map((k) => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (IS_DEV) return; // always fetch from network in dev
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
