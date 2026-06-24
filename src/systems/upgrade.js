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
    unlockWhen: (_, level) => level >= 3,
  },
  {
    id: 'laserDamage',
    category: 'Laser',
    label: 'Laser Damage',
    description: '+25 damage per shot',
    maxRank: 10,
    baseCost: 10,
    unlockWhen: (_, level) => level >= 2,
  },
  {
    id: 'laserStun',
    category: 'Laser',
    label: 'Laser Stun',
    description: '5% chance to stun on hit',
    maxRank: 2,
    baseCost: 15,
    unlockWhen: (upgrades) =>
      (upgrades.laserFireRate ?? 0) >= 8 &&
      (upgrades.laserDamage ?? 0) >= 10,
  },

  // ── Arc ────────────────────────────────────────────────────────────────────
  {
    id: 'arcFireRate',
    category: 'Arc',
    label: 'Arc Speed',
    description: '+0.5 pulses/sec',
    maxRank: 8,
    baseCost: 12,
  },
  {
    id: 'arcRange',
    category: 'Arc',
    label: 'Arc Range',
    description: '+25% range',
    maxRank: 3,
    baseCost: 10,
    unlockWhen: (_, level) => level >= 3,
  },
  {
    id: 'arcCone',
    category: 'Arc',
    label: 'Arc Cone',
    description: '+25% cone width',
    maxRank: 3,
    baseCost: 10,
    unlockWhen: (upgrades) => (upgrades.arcRange ?? 0) >= 3,
  },
  {
    id: 'arcDamage',
    category: 'Arc',
    label: 'Arc Damage',
    description: '+25 damage per pulse',
    maxRank: 10,
    baseCost: 10,
    unlockWhen: (_, level) => level >= 2,
  },
  {
    id: 'arcStun',
    category: 'Arc',
    label: 'Arc Stun',
    description: '+2.5% stun chance on Arc hit',
    maxRank: 2,
    baseCost: 15,
    unlockWhen: (upgrades) =>
      (upgrades.arcFireRate ?? 0) >= 8 &&
      (upgrades.arcRange ?? 0) >= 3 &&
      (upgrades.arcCone ?? 0) >= 3 &&
      (upgrades.arcDamage ?? 0) >= 10,
  },
];

export function getPlayerStats(upgrades) {
  return {
    laserDamage:     50 + (upgrades.laserDamage ?? 0) * 25,
    laserInterval:   1 / (1 + (upgrades.laserFireRate ?? 0) * 0.5),
    laserWidth:      6 * Math.pow(2, upgrades.laserWidth ?? 0),
    laserStunChance: (upgrades.laserStun ?? 0) > 0 ? 0.05 : 0,
    arcDamage:       40 + (upgrades.arcDamage ?? 0) * 25,
    arcInterval:     1 / (1 + (upgrades.arcFireRate ?? 0) * 0.5),
    arcRange:        150 * Math.pow(1.25, upgrades.arcRange ?? 0),
    arcHalfAngle:    Math.min(Math.PI, (Math.PI / 5) * Math.pow(1.25, upgrades.arcCone ?? 0)),
    arcStunChance:   0.025 * (upgrades.arcStun ?? 0),
    moveSpeed:       200 * (1 + (upgrades.moveSpeed ?? 0) * 0.2),
  };
}

// Return all upgrades that are unlocked and not yet maxed.
// No cap on count — every available upgrade is offered.
export function pickUpgradeChoices(upgrades, level) {
  return UPGRADE_DEFS.filter((d) => {
    if ((upgrades[d.id] ?? 0) >= d.maxRank) return false;
    if (d.unlockWhen && !d.unlockWhen(upgrades, level)) return false;
    return true;
  });
}

export function applyUpgrade(upgrades, id) {
  return { ...upgrades, [id]: (upgrades[id] ?? 0) + 1 };
}
