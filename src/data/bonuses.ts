import type { StrKey } from '../i18n';

export type TierIndex = 0 | 1 | 2 | 3;

export interface TierDef {
  /** Commun, rare, épique, légendaire (nom interne, non affiché). */
  readonly id: string;
  /** Couleur du halo. */
  readonly color: string;
  /** Probabilité de tirage. */
  readonly p: number;
}

export const TIERS = [
  { id: 'common', color: '#3ddc6b', p: 0.7 },
  { id: 'rare', color: '#4aa3ff', p: 0.22 },
  { id: 'epic', color: '#b36bff', p: 0.07 },
  { id: 'legendary', color: '#ffd23f', p: 0.01 },
] as const satisfies readonly [TierDef, TierDef, TierDef, TierDef];

/** Probabilités des paliers en mode dev (bonus rares plus fréquents). */
export const DEV_TIER_P = [0.4, 0.3, 0.2, 0.1] as const;

export interface BonusDef {
  readonly id: string;
  readonly tier: TierIndex;
  readonly icon: string;
  /** Remplace le « Skin légendaire » quand le joueur porte déjà un skin premium. */
  readonly fallback?: true;
}

export const BONUSES = [
  { id: 'ketchup', tier: 0, icon: '🍅' },
  { id: 'mayo', tier: 0, icon: '🥚' },
  { id: 'purse', tier: 0, icon: '💰' },
  { id: 'butter', tier: 1, icon: '🧈' },
  { id: 'oven', tier: 1, icon: '♨️' },
  { id: 'feather', tier: 1, icon: '🪶' },
  { id: 'pepper', tier: 1, icon: '🧂' },
  { id: 'mustard', tier: 1, icon: '🌭' },
  { id: 'magnet', tier: 2, icon: '🧲' },
  { id: 'star', tier: 2, icon: '⭐' },
  { id: 'loan', tier: 3, icon: '🌈' },
  { id: 'rain', tier: 3, icon: '💎', fallback: true },
] as const satisfies readonly BonusDef[];

export type Bonus = (typeof BONUSES)[number];
export type BonusId = Bonus['id'];

export const BONUS_BY = Object.fromEntries(BONUSES.map((b) => [b.id, b])) as Readonly<Record<BonusId, BonusDef>>;

export const bonusNameKey = (id: BonusId): StrKey => `bonus_${id}_name`;
