// Upgrade definitions and stat computation

export const UPGRADE_DEFS = [
  // ── Speed ──────────────────────────────────────────────────────────────────
  {
    id: 'moveSpeed',
    category: 'Speed',
    label: 'Move Speed',
    description: '+20% movement speed',
    maxRank: 6,
    baseCost: 15,
    unlockWhen: (_, level) => level >= 5,
  },

  // ── Laser ──────────────────────────────────────────────────────────────────
  {
    id: 'laserFireRate',
    category: 'Laser',
    label: 'Laser Speed',
    description: '+0.5 shots/sec',
    maxRank: 8,
    baseCost: 12,
  },
  {
    id: 'laserWidth',
    category: 'Laser',
    label: 'Laser Width',
    description: 'Doubles beam width',
    maxRank: 4,
    baseCost: 10,
    unlockWhen: (upgrades) => (upgrades.laserFireRate ?? 0) >= 8,
  },
  {
    id: 'laserDamage',
    category: 'Laser',
    label: 'Laser Damage',
    description: '+25 damage per shot',
    maxRank: 10,
    baseCost: 10,
    unlockWhen: (upgrades) => (upgrades.laserFireRate ?? 0) >= 8,
  },

  // ── AOE ────────────────────────────────────────────────────────────────────
  {
    id: 'arcFireRate',
    category: 'AOE',
    label: 'AOE Speed',
    description: '+0.5 pulses/sec',
    maxRank: 8,
    baseCost: 12,
  },
  {
    id: 'arcRange',
    category: 'AOE',
    label: 'AOE Range',
    description: '+60px range',
    maxRank: 8,
    baseCost: 10,
  },
  {
    id: 'arcCone',
    category: 'AOE',
    label: 'AOE Cone',
    description: 'Doubles cone width',
    maxRank: 3,
    baseCost: 10,
    unlockWhen: (upgrades) => (upgrades.arcRange ?? 0) >= 8,
  },
  {
    id: 'arcDamage',
    category: 'AOE',
    label: 'AOE Damage',
    description: '+10 damage per pulse',
    maxRank: 10,
    baseCost: 10,
    unlockWhen: (upgrades) => (upgrades.arcFireRate ?? 0) >= 8,
  },
];

export function getPlayerStats(upgrades) {
  return {
    laserDamage:   50 + (upgrades.laserDamage ?? 0) * 25,
    laserInterval: 1 / (1 + (upgrades.laserFireRate ?? 0) * 0.5),
    laserWidth:    3 * Math.pow(2, upgrades.laserWidth ?? 0),
    arcDamage:     20 + (upgrades.arcDamage ?? 0) * 10,
    arcInterval:   1 / (1 + (upgrades.arcFireRate ?? 0) * 0.5),
    arcRange:      150 + (upgrades.arcRange ?? 0) * 60,
    arcHalfAngle:  Math.min(Math.PI, (Math.PI / 5) * Math.pow(2, upgrades.arcCone ?? 0)),
    moveSpeed:     200 * (1 + (upgrades.moveSpeed ?? 0) * 0.2),
  };
}

// Pick up to 3 random distinct upgrades that are unlocked and not yet maxed
export function pickUpgradeChoices(upgrades, level) {
  const available = UPGRADE_DEFS.filter((d) => {
    if ((upgrades[d.id] ?? 0) >= d.maxRank) return false;
    if (d.unlockWhen && !d.unlockWhen(upgrades, level)) return false;
    return true;
  });
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

export function applyUpgrade(upgrades, id) {
  return { ...upgrades, [id]: (upgrades[id] ?? 0) + 1 };
}
