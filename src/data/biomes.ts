import type { StrKey } from '../i18n';
import type { AchId } from './achievements';

/** Motif dessiné en fond de chaque couloir. */
export type DecoKind =
  | 'sprouts' | 'ridges' | 'checker' | 'grid' | 'creases' | 'speckle' | 'shelves'
  | 'grain' | 'flames' | 'splat' | 'snow' | 'trash' | 'stars';

export interface BiomeDef {
  readonly id: string;
  /** Couleurs des couloirs pairs / impairs. */
  readonly a: string;
  readonly b: string;
  readonly line: string;
  readonly ink: string;
  readonly deco: DecoKind;
  /** Succès débloqué en atteignant ce décor. */
  readonly ach?: AchId;
}

/** Les 13 décors, dans l'ordre de descente (un tous les BIOME_LEN). */
export const BIOMES = [
  { id: 'field', a: '#a9c26b', b: '#9db55f', line: '#6f8a3a', ink: '#27330f', deco: 'sprouts' },
  { id: 'truck', a: '#8d99a6', b: '#818e9b', line: '#5f6c79', ink: '#0f1a24', deco: 'ridges', ach: 'camion' },
  { id: 'supermarket', a: '#f4f7fb', b: '#e8eef6', line: '#bccbe0', ink: '#1d2b44', deco: 'checker' },
  { id: 'cart', a: '#cfd6dd', b: '#c4ccd4', line: '#8f9aa6', ink: '#1b2530', deco: 'grid' },
  { id: 'bag', a: '#c9a56c', b: '#bf9a60', line: '#946f3a', ink: '#2e2110', deco: 'creases' },
  { id: 'trunk', a: '#3a3d44', b: '#34373d', line: '#5a5e68', ink: '#eceef2', deco: 'speckle' },
  { id: 'fridge', a: '#e9f4f1', b: '#dcebe7', line: '#a9c9c0', ink: '#17332c', deco: 'shelves' },
  { id: 'board', a: '#e0b878', b: '#d7ac6a', line: '#b08040', ink: '#3a2410', deco: 'grain' },
  { id: 'pan', a: '#5a2a1c', b: '#6b3320', line: '#9b4a2a', ink: '#ffe3c2', deco: 'flames', ach: 'chaud' },
  { id: 'plate', a: '#fdfcf8', b: '#f3f1ea', line: '#d9a089', ink: '#1c2a4a', deco: 'splat' },
  { id: 'freezer', a: '#dff3fb', b: '#cdeaf6', line: '#a9d3e6', ink: '#1f3a4a', deco: 'snow', ach: 'frigo' },
  { id: 'trash', a: '#3b4034', b: '#343a2e', line: '#5d6850', ink: '#e9efd9', deco: 'trash', ach: 'poubelle' },
  { id: 'void', a: '#07070b', b: '#0b0b12', line: '#34344d', ink: '#e6e6f5', deco: 'stars', ach: 'neant' },
] as const satisfies readonly BiomeDef[];

export type Biome = (typeof BIOMES)[number];
export type BiomeId = Biome['id'];

export const biomeNameKey = (id: BiomeId): StrKey => `biome_${id}_name`;
