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
  },

  // ── Laser ──────────────────────────────────────────────────────────────────
  {
    id: 'laserDamage',
    category: 'Laser',
    label: 'Laser Damage',
    description: '+25 damage per shot',
    maxRank: 10,
    baseCost: 10,
  },
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
  },

  // ── AOE ────────────────────────────────────────────────────────────────────
  {
    id: 'arcDamage',
    category: 'AOE',
    label: 'AOE Damage',
    description: '+10 damage per pulse',
    maxRank: 10,
    baseCost: 10,
  },
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
];

export function getPlayerStats(upgrades) {
  return {
    laserDamage:   50 + upgrades.laserDamage * 25,
    laserInterval: 1 / (1 + upgrades.laserFireRate * 0.5),
    laserWidth:    3 * Math.pow(2, upgrades.laserWidth ?? 0),
    arcDamage:     20 + upgrades.arcDamage * 10,
    arcInterval:   1 / (1 + upgrades.arcFireRate * 0.5),
    arcRange:      150 + upgrades.arcRange * 60,
    moveSpeed:     200 * (1 + upgrades.moveSpeed * 0.2),
  };
}

// Pick 3 random distinct upgrades that are not maxed out
export function pickUpgradeChoices(upgrades) {
  const available = UPGRADE_DEFS.filter((d) => (upgrades[d.id] ?? 0) < d.maxRank);
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

export function applyUpgrade(upgrades, id) {
  return { ...upgrades, [id]: (upgrades[id] ?? 0) + 1 };
}
