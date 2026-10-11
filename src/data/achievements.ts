import type { StrKey } from '../i18n';

export interface AchievementDef {
  readonly id: string;
  readonly icon: string;
  /** Golds gagnés au déblocage. */
  readonly reward: number;
  /** Nom et description masqués tant qu'il n'est pas débloqué. */
  readonly secret?: true;
}

export const ACHIEVEMENTS = [
  { id: 'first', icon: '🥣', reward: 5 },
  { id: 'd100', icon: '⬇️', reward: 10 },
  { id: 'd300', icon: '🕳️', reward: 40 },
  { id: 'portion', icon: '🍟', reward: 15 },
  { id: 'resurrection', icon: '🌅', reward: 40 },
  { id: 'quatrequarts', icon: '🍰', reward: 25, secret: true },
  { id: 'fastfood', icon: '🍔', reward: 10, secret: true },
  { id: 'oven', icon: '♨️', reward: 20 },
  { id: 'ketchup', icon: '🍅', reward: 10 },
  { id: 'mayo', icon: '🥚', reward: 10 },
  { id: 'spark', icon: '✨', reward: 20, secret: true },
  { id: 'poppins', icon: '🪂', reward: 25 },
  { id: 'picsou', icon: '🦆', reward: 30 },
  { id: 'ascete', icon: '🧘', reward: 30, secret: true },
  { id: 'chaud', icon: '🔥', reward: 20 },
  { id: 'frigo', icon: '🧊', reward: 30 },
  { id: 'camion', icon: '🚚', reward: 10 },
  { id: 'poubelle', icon: '🗑️', reward: 60 },
  { id: 'neant', icon: '⚫', reward: 100, secret: true },
  { id: 'cadeau', icon: '🎁', reward: 15 },
  { id: 'jackpot', icon: '🌈', reward: 60, secret: true },
  { id: 'accro', icon: '🔁', reward: 20 },
  { id: 'garderobe', icon: '👗', reward: 25 },
] as const satisfies readonly AchievementDef[];

export type Achievement = (typeof ACHIEVEMENTS)[number];
export type AchId = Achievement['id'];

export const ACH_BY = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Readonly<Record<AchId, AchievementDef>>;

export const achNameKey = (id: AchId): StrKey => `ach_${id}_name`;
export const achDescKey = (id: AchId): StrKey => `ach_${id}_desc`;
