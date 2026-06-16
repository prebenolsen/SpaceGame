const KEY = 'space-survivor-save';

export function saveGame(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(KEY);
}

export const defaultSave = () => ({
  level: 0,
  lives: 5,
  upgrades: {
    laserFireRate: 0,
    laserWidth: 0,
    laserDamage: 0,
    arcFireRate: 0,
    arcRange: 0,
    arcCone: 0,
    arcDamage: 0,
    moveSpeed: 0,
  },
  score: 0,
  scoreUpgradeMilestones: 0,
});
