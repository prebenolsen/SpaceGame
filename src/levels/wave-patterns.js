// Reusable wave templates. Each entry is spawned at `time` seconds into the level.
// type: 'drone' | 'rusher' | 'tank' | 'miniboss' | 'boss'

export const WAVE_PATTERNS = {
  // Spread of drones from random edges
  droneSpread: (count, healthMult = 1, speedMult = 1) =>
    Array.from({ length: count }, (_, i) => ({
      type: 'drone',
      time: i * 4,
      healthMult,
      speedMult,
    })),

  // Rushers in a burst
  rusherBurst: (count, delay = 2) =>
    Array.from({ length: count }, (_, i) => ({
      type: 'rusher',
      time: i * delay,
      healthMult: 1,
      speedMult: 1,
    })),

  // Tanks trickle in
  tankTrickle: (count) =>
    Array.from({ length: count }, (_, i) => ({
      type: 'tank',
      time: i * 8,
      healthMult: 1,
      speedMult: 1,
    })),

  // Mini-boss pair
  minibossPair: (healthMult = 1) => [
    { type: 'miniboss', time: 5, healthMult, speedMult: 1 },
    { type: 'miniboss', time: 20, healthMult, speedMult: 1 },
  ],

  // Single boss
  boss: (healthMult = 1) => [
    { type: 'boss', time: 3, healthMult, speedMult: 1 },
  ],
};
