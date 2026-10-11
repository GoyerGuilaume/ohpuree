import type { Piece, Run, World } from './types';

export function mkPiece(w: World, x: number, startD: number): Piece {
  return { x, obs: [], pick: [], nextD: startD, inv: 0, oven: 0, wob: w.rng() * 6, scared: false, seed: w.rng() * 50 };
}

/** Nouvelle partie (le newGame du prototype, sans effet de bord). */
export function newRun(w: World): Run {
  return {
    D: 0, t: 0, score: 0, vx: 0, lost: 0, gold: 0, bi: 0, banner: null, ketchup: 0, mayo: 0, glide: 0, glideCd: 0,
    skinOverride: null, achRun: [], reached4: false, t4: 0, glides: 0, magnetT: 0, bonuses: 0,
    pepper: false, mustard: false, hot: false, pepperT: 0, cd: 0, slowT: 0, slowDur: 1, slowAmp: 0, flash: 0, nm: 1,
    pieces: [mkPiece(w, 0.5, w.view.H * 0.9)], parts: [], shake: 0,
  };
}
