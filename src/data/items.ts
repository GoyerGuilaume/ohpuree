import type { StrKey } from '../i18n';

/** cons : consommable utilisé au début d'une partie ; pass : passif permanent. */
export type ItemKind = 'cons' | 'pass';

export interface ItemDef {
  readonly id: string;
  readonly kind: ItemKind;
  readonly icon: string;
  /** Prix de base en golds (avant ristourne de l'Économe). */
  readonly price: number;
}

export const ITEMS = [
  { id: 'ketchup', kind: 'cons', icon: '🍅', price: 12 },
  { id: 'mayo', kind: 'cons', icon: '🥚', price: 15 },
  { id: 'mustard', kind: 'cons', icon: '🌭', price: 20 },
  { id: 'hot', kind: 'cons', icon: '🌶️', price: 25 },
  { id: 'pepper', kind: 'cons', icon: '🧂', price: 35 },
  { id: 'ladle', kind: 'pass', icon: '🥄', price: 120 },
  { id: 'timer', kind: 'pass', icon: '⏲️', price: 140 },
  { id: 'peeler', kind: 'pass', icon: '🏷️', price: 150 },
  { id: 'oven', kind: 'pass', icon: '♨️', price: 200 },
] as const satisfies readonly ItemDef[];

export type Item = (typeof ITEMS)[number];
export type ItemId = Item['id'];

export const itemNameKey = (id: ItemId): StrKey => `item_${id}_name`;
export const itemDescKey = (id: ItemId): StrKey => `item_${id}_desc`;
