import type { Piece, World } from './types';
import { curSkin } from './world';

/** Couleur métal des lames (variable CSS --metal, identique en thème clair et sombre). */
export const METAL = '#c9d2da';

/** Couleurs du skin effectif, utilisées par les éclats de particules. */
export function skinColors(w: World): { potato: string; potatoEdge: string; flesh: string; fry: string } {
  const s = curSkin(w);
  return { potato: s.body, potatoEdge: s.edge, flesh: s.flesh, fry: s.fry };
}

export function burst(w: World, x: number, y: number, n: number, cols: readonly string[]): void {
  const r = w.rng;
  for (let i = 0; i < n; i++) {
    w.G.parts.push({
      x, y, vx: (r() - 0.5) * 380, vy: (r() - 0.85) * 320,
      life: 0.6 + r() * 0.5, max: 1.1, c: cols[i % cols.length]!, s: 3 + r() * 5,
    });
  }
}

export function stepParts(w: World, dt: number): void {
  const G = w.G;
  for (let i = G.parts.length - 1; i >= 0; i--) {
    const q = G.parts[i]!;
    q.life -= dt;
    if (q.life <= 0) {
      G.parts.splice(i, 1);
      continue;
    }
    q.vy += 900 * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
  }
  G.shake = Math.max(0, G.shake - dt * 1.6);
}

export function dims(w: World): { n: number; lw: number; r: number; rf: number } {
  const n = w.G.pieces.length, lw = w.view.W / n, r = Math.min(26, lw * 0.12);
  return { n, lw, r, rf: r / lw };
}

export function lanePos(w: World, i: number, n: number, p: Piece): { x: number; lw: number } {
  const lw = w.view.W / n;
  return { x: i * lw + p.x * lw, lw };
}
