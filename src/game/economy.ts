import type { Inventory } from './profile';
import type { Run } from './types';

/** Prix en golds, avec la ristourne de 15 % de l'Économe ; jamais moins de 1. */
export function priceOf(base: number, inv: Inventory): number {
  return Math.max(1, Math.round(base * (inv.peeler > 0 ? 0.85 : 1)));
}

/** Durée des bonus chronométrés : +25 % avec le Minuteur. */
export function timerMul(inv: Inventory): number {
  return inv.timer > 0 ? 1.25 : 1;
}

/** Multiplicateur de golds : 1, +1 avec le poivre (consommable ou bonus), +2 avec la sauce piquante. */
export function goldMul(G: Run): number {
  let m = 1;
  if (G.pepper || G.pepperT > 0) m += 1;
  if (G.hot) m += 2;
  return m;
}
