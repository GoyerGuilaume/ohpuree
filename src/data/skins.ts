import type { StrKey } from '../i18n';

interface SkinBase {
  readonly id: string;
  readonly body: string;
  readonly edge: string;
  readonly flesh: string;
  readonly fry: string;
}

/** Skin cosmétique, acheté en golds. */
export interface StandardSkinDef extends SkinBase {
  readonly premium: false;
  readonly price: number;
}

/** Skin premium (achat réel) avec une compétence passive. */
export interface PremiumSkinDef extends SkinBase {
  readonly premium: true;
  /** Prix affiché ; sera remplacé par le prix du store (étape 5). */
  readonly priceEur: string;
  /** Cape : peut planer. */
  readonly cape?: true;
  /** Caillou : forme de pierre. */
  readonly stone?: true;
  /** Multiplicateur de vitesse de chute. */
  readonly speedMul?: number;
  /** Probabilité qu'une lame ne fasse qu'une étincelle. */
  readonly spark?: number;
  /** Pas de fusion après une coupe. */
  readonly noMerge?: true;
  /** Attire les golds proches. */
  readonly magnet?: true;
}

export type SkinDef = StandardSkinDef | PremiumSkinDef;

export const SKINS = [
  { id: 'classic', premium: false, price: 0, body: '#c8924b', edge: '#8c5f2b', flesh: '#f6e3a4', fry: '#f2c94c' },
  { id: 'roseval', premium: false, price: 30, body: '#d9707a', edge: '#8f3a46', flesh: '#fbe3d6', fry: '#f7c9b8' },
  { id: 'grenaille', premium: false, price: 40, body: '#e6c45a', edge: '#a8862a', flesh: '#fff1b8', fry: '#ffe58a' },
  { id: 'douce', premium: false, price: 55, body: '#d9783a', edge: '#8a4318', flesh: '#ffc27a', fry: '#ff9f4a' },
  { id: 'vitelotte', premium: false, price: 70, body: '#6b4a8c', edge: '#3d2757', flesh: '#b79ad6', fry: '#9b78c4' },
  {
    id: 'cape', premium: true, priceEur: '2,99 €',
    body: '#c8924b', edge: '#8c5f2b', flesh: '#f6e3a4', fry: '#f2c94c',
    cape: true,
  },
  {
    id: 'stone', premium: true, priceEur: '1,99 €',
    body: '#8d8f94', edge: '#464850', flesh: '#b9bcc4', fry: '#9fa3ac',
    stone: true, speedMul: 1.35, spark: 0.33, noMerge: true,
  },
  {
    id: 'magnet', premium: true, priceEur: '1,99 €',
    body: '#8b7bd8', edge: '#4a3d99', flesh: '#d9d2ff', fry: '#b9aef0',
    magnet: true,
  },
] as const satisfies readonly SkinDef[];

export type Skin = (typeof SKINS)[number];
export type SkinId = Skin['id'];
export type PremiumSkin = Extract<Skin, { premium: true }>;
export type PremiumSkinId = PremiumSkin['id'];

/** Le skin de départ, toujours possédé. */
export const DEFAULT_SKIN = SKINS[0];

/** Skin par id ; un id inconnu retombe sur le skin classique (comme le prototype). */
export function skinById(id: string): SkinDef {
  return SKINS.find((s) => s.id === id) ?? DEFAULT_SKIN;
}

export const skinNameKey = (id: SkinId): StrKey => `skin_${id}_name`;
export const skinDescKey = (id: PremiumSkinId): StrKey => `skin_${id}_desc`;
