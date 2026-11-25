// js/data.js — Game data: ingredients, endless difficulty curve, archetypes, economy

export const INGREDIENTS = [
  // === CARB ===
  { id: 'ketupat', name: 'Ketupat', category: 'carb', price: 3000, unlockAt: 0, weight: 1.3, sfx: 'place_soft', color: '#81C784', isHot: false, container: 'daun_pisang' },
  { id: 'lontong', name: 'Lontong', category: 'carb', price: 2500, unlockAt: 1, weight: 1.0, sfx: 'place_soft', color: '#A5D6A7', isHot: false, container: 'piring_kayu' },

  // === MAIN ===
  { id: 'opor_ayam', name: 'Opor Ayam', category: 'main', price: 12000, unlockAt: 0, weight: 1.2, sfx: 'place_wet', color: '#F2D27A', isHot: true, container: 'mangkuk_kayu' },
  { id: 'rendang', name: 'Rendang', category: 'main', price: 15000, unlockAt: 0, weight: 1.2, sfx: 'place_wet', color: '#5A2E1B', isHot: true, container: 'mangkuk_kayu' },
  { id: 'semur_daging', name: 'Semur Daging', category: 'main', price: 13000, unlockAt: 1, weight: 1.0, sfx: 'place_wet', color: '#6B3B22', isHot: true, container: 'mangkuk_kayu_dalam' },
  { id: 'ayam_goreng', name: 'Ayam Goreng', category: 'main', price: 11000, unlockAt: 1, weight: 1.0, sfx: 'place_crisp', color: '#D99A3C', isHot: true, container: 'piring_kayu' },

  // === SIDE ===
  { id: 'sambal_goreng_kentang', name: 'Sambal Kentang', category: 'side', price: 5000, unlockAt: 1, weight: 1.0, sfx: 'place_soft', color: '#D9482B', isHot: true, container: 'mangkuk_kayu' },
  { id: 'telur_balado', name: 'Telur Balado', category: 'side', price: 4500, unlockAt: 1, weight: 1.0, sfx: 'place_soft', color: '#C8321F', isHot: false, container: 'mangkuk_kayu' },
  { id: 'sayur_labu_siam', name: 'Labu Siam', category: 'side', price: 4000, unlockAt: 2, weight: 1.0, sfx: 'place_soft', color: '#C9D88A', isHot: true, container: 'mangkuk_krem' },
  { id: 'perkedel', name: 'Perkedel', category: 'side', price: 3500, unlockAt: 2, weight: 1.0, sfx: 'place_crisp', color: '#D99A3C', isHot: false, container: 'piring_kayu' },

  // === EXTRAS ===
  { id: 'bawang_goreng', name: 'Bawang Goreng', category: 'topping', price: 1000, unlockAt: 2, weight: 1.0, sfx: 'place_crisp', color: '#9A5B24', isHot: false, container: 'mangkuk_kecil' },
  { id: 'sambal', name: 'Sambal', category: 'sauce', price: 1000, unlockAt: 2, weight: 1.0, sfx: 'place_wet', color: '#C0261A', isHot: false, container: 'mangkuk_batu' },
  { id: 'kerupuk', name: 'Kerupuk', category: 'crunch', price: 1500, unlockAt: 2, weight: 1.0, sfx: 'place_crisp', color: '#F3DDA0', isHot: false, container: 'mangkuk_kayu' },
  { id: 'emping', name: 'Emping', category: 'crunch', price: 2000, unlockAt: 3, weight: 1.0, sfx: 'place_crisp', color: '#D9B77A', isHot: false, container: 'mangkuk_kayu' },
];

export const INGREDIENT_MAP = Object.fromEntries(INGREDIENTS.map(i => [i.id, i]));

// Plate slot local coordinates (matching PRD 8.3, scaled to plate radius = 1.0)
export const PLATE_SLOTS = {
  carb:    { x: -0.36, y: 0.06, z: 0.05 },
  main:    { x: 0.04,  y: 0.06, z: 0.05 },
  side0:   { x: 0.46,  y: 0.06, z: -0.28 },
  side1:   { x: 0.46,  y: 0.06, z: 0.34 },
  topping: { x: 0.04,  y: 0.24, z: 0.05 },
  sauce:   { x: -0.05, y: 0.06, z: -0.58 },
  crunch:  { x: -0.15, y: 0.14, z: 0.62 },
};

export const ARCHETYPES = {
  kid_boy:  { name: 'Anak Laki-laki', patienceMult: 0.9,  tipMult: 0.8, maxItems: 3, minTier: 0 },
  kid_girl: { name: 'Anak Perempuan', patienceMult: 0.9,  tipMult: 0.8, maxItems: 3, minTier: 0 },
  teen:     { name: 'Remaja',         patienceMult: 0.85, tipMult: 1.0, maxItems: 5, minTier: 0 },
  adult_m:  { name: 'Bapak',          patienceMult: 1.0,  tipMult: 1.0, maxItems: 6, minTier: 0 },
  adult_f:  { name: 'Ibu',            patienceMult: 1.0,  tipMult: 1.0, maxItems: 6, minTier: 0 },
  parent:   { name: 'Orang Tua',      patienceMult: 1.0,  tipMult: 1.1, maxItems: 6, minTier: 1 },
  elder:    { name: 'Sesepuh',        patienceMult: 1.25, tipMult: 1.1, maxItems: 4, minTier: 1 },
  family:   { name: 'Keluarga',       patienceMult: 1.2,  tipMult: 1.3, maxItems: 7, minTier: 2 },
  vip:      { name: 'Tamu VIP',       patienceMult: 0.8,  tipMult: 2.0, maxItems: 6, minTier: 2, isVip: true },
};

export const ECONOMY = {
  tipTiers: [
    { minPatience: 0.66, rate: 0.25 },
    { minPatience: 0.33, rate: 0.12 },
    { minPatience: 0.0,  rate: 0.05 },
  ],
  perfectBonusRate: 0.10,
  comboMultipliers: [1.0, 1.0, 1.1, 1.2, 1.3, 1.4],
  comboWindowSeconds: 12,
  leaveFee: 2000,
  vipBonusSeconds: 10,
  vipBonus: 5000,
  lostLimit: 3,
};

export const LOAD_TIPS = [
  'Menyiapkan ketupat...',
  'Memasak rendang...',
  'Menyalakan lentera...',
  'Menata meja warung...',
  'Menggoreng bawang...',
];

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Progressive endless difficulty curve (0..1) from elapsedSeconds & servedCount.
 * Designed so players feel clear escalation over 3-5 minutes.
 */
export function getDifficulty(elapsedSeconds, servedCount) {
  const timeFactor = Math.min(1, elapsedSeconds / 240); // ramps over 4 minutes
  const serveFactor = Math.min(1, servedCount / 32);   // ramps over 32 serves
  const d = Math.max(0, Math.min(1, timeFactor * 0.55 + serveFactor * 0.45));

  // Unlock tier: 0 (start), 1 (>=25s or >=3 served), 2 (>=70s or >=8 served), 3 (>=130s or >=16 served)
  let unlockTier = 0;
  if (elapsedSeconds >= 25 || servedCount >= 3) unlockTier = 1;
  if (elapsedSeconds >= 70 || servedCount >= 8) unlockTier = 2;
  if (elapsedSeconds >= 130 || servedCount >= 16) unlockTier = 3;

  const dayNumber = Math.floor(elapsedSeconds / 45) + 1;
  const plateBUnlocked = elapsedSeconds >= 35 || servedCount >= 4;

  // Item count range
  const minItems = d < 0.25 ? 2 : d < 0.65 ? 3 : 4;
  const maxItems = d < 0.15 ? 2 : d < 0.40 ? 4 : d < 0.70 ? 5 : 7;

  return {
    d,
    dayNumber,
    unlockTier,
    plateBUnlocked,
    spawnInterval: lerp(14, 5, d),
    maxActive: Math.round(lerp(2, 5, d)),
    basePatience: lerp(40, 22, d),
    minItems,
    maxItems,
    removeFeeRate: unlockTier >= 2 ? 0.25 : 0,
  };
}
