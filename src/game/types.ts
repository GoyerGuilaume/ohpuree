import type { AchId } from '../data/achievements';
import type { BonusId, TierIndex } from '../data/bonuses';
import type { Inventory, Profile } from './profile';
import type { Rng } from './rng';

export type ObstacleType = 'pin' | 'blade';

/** Barre horizontale avec une brèche (pilon ou couteaux). */
export interface GapObstacle {
  kind: 'gap';
  type: ObstacleType;
  d: number;
  gw: number;
  base: number;
  amp: number;
  ph: number;
  hit: boolean;
}

/** Bloc isolé (pilon court ou roulette à pizza). */
export interface BlockObstacle {
  kind: 'block';
  type: ObstacleType;
  d: number;
  w: number;
  cx: number;
  amp: number;
  ph: number;
  hit: boolean;
}

export type Obstacle = GapObstacle | BlockObstacle;

export type Pickup =
  | { k: 'gold' | 'fuse'; d: number; x: number; taken: boolean }
  | { k: 'bonus'; b: BonusId; tier: TierIndex; d: number; x: number; taken: boolean };

/** Un morceau de patate, avec son couloir. */
export interface Piece {
  x: number;
  obs: Obstacle[];
  pick: Pickup[];
  nextD: number;
  inv: number;
  oven: number;
  wob: number;
  scared: boolean;
  seed: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  c: string;
  s: number;
}

export interface Banner {
  text: string;
  t: number;
}

/** État d'une partie (le « G » du prototype). */
export interface Run {
  D: number;
  t: number;
  score: number;
  vx: number;
  lost: number;
  gold: number;
  bi: number;
  banner: Banner | null;
  ketchup: number;
  mayo: number;
  glide: number;
  glideCd: number;
  skinOverride: string | null;
  achRun: AchId[];
  reached4: boolean;
  t4: number;
  glides: number;
  magnetT: number;
  bonuses: number;
  pepper: boolean;
  mustard: boolean;
  hot: boolean;
  pepperT: number;
  cd: number;
  slowT: number;
  slowDur: number;
  slowAmp: number;
  flash: number;
  nm: number;
  pieces: Piece[];
  parts: Particle[];
  shake: number;
}

export type Phase = 'menu' | 'play' | 'paused' | 'countdown' | 'over';
export type Control = 'tilt' | 'tap';
export type Wave = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface View {
  W: number;
  H: number;
}

export interface GameOverSummary {
  score: number;
  isRecord: boolean;
  best: number;
  gold: number;
  wallet: number;
  achRun: AchId[];
}

/** Effets de bord demandés par la logique ; l'UI, l'audio et la plateforme les exécutent. */
export interface Fx {
  beep(freq: number, dur: number, type: Wave, vol: number, slide: number): void;
  vibrate(ms: number): void;
  toast(msg: string): void;
  save(): void;
  phaseChanged(phase: Phase): void;
  gameOver(summary: GameOverSummary): void;
}

/** Tout ce dont la logique a besoin, sans DOM ni variable globale. */
export interface World {
  phase: Phase;
  G: Run;
  profile: Profile;
  view: View;
  rng: Rng;
  fx: Fx;
  /** Outils de dev autorisés par l'environnement (VITE_DEV_TOOLS). */
  devTools: boolean;
  activeControl: Control;
  /** Direction demandée par le joueur, de -1 à 1 (écrite par la couche d'entrées). */
  input: number;
}

export type { Inventory, Profile };
