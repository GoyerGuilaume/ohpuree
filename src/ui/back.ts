import type { Phase } from '../game/types';

export type BackAction = 'pause' | 'resume' | 'closeShop' | 'closeAch' | 'toMenu' | 'exit';

/** Que fait le bouton retour Android selon l'écran affiché. */
export function backAction(phase: Phase, open: { shop: boolean; ach: boolean }): BackAction {
  if (phase === 'play' || phase === 'countdown') return 'pause';
  if (phase === 'paused') return 'resume';
  if (open.shop) return 'closeShop';
  if (open.ach) return 'closeAch';
  if (phase === 'over') return 'toMenu';
  return 'exit';
}
