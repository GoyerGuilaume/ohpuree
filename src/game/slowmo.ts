import type { Run } from './types';

/**
 * Déclenche un ralenti : la vitesse baisse de `amp` puis revient (courbe quadratique) en `dur` s.
 * Un ralenti plus fort déjà en cours n'est pas écrasé.
 */
export function pulse(G: Run, amp: number, dur: number): void {
  const cur = G.slowT > 0 ? G.slowAmp * Math.pow(G.slowT / G.slowDur, 2) : 0;
  if (amp >= cur) {
    G.slowT = dur;
    G.slowDur = dur;
    G.slowAmp = amp;
  }
}

/** Fait avancer le ralenti et renvoie le facteur de vitesse de cette frame (1 = pas de ralenti). */
export function stepSlow(G: Run, dt: number): number {
  let pm = 1;
  if (G.slowT > 0) {
    G.slowT -= dt;
    const rt = Math.max(0, G.slowT) / G.slowDur;
    pm = 1 - G.slowAmp * rt * rt;
  }
  return pm;
}
