import { TUNE } from '../config/tune';
import { unlock } from './achievements';
import { afterMerge } from './bonus';
import { timerMul } from './economy';
import { METAL, burst, lanePos, skinColors } from './fxhelpers';
import { clamp } from './math';
import { gameOver } from './flow';
import { mkPiece } from './run';
import { pulse } from './slowmo';
import type { Piece, World } from './types';
import { curSkin, skinTrait } from './world';


/** Une lame coupe le morceau en deux : ralenti, cuisson éventuelle, beurre garanti plus loin. */
export function split(w: World, p: Piece): void {
  const G = w.G, inv = w.profile.inv;
  const i = G.pieces.indexOf(p), n = G.pieces.length, py = w.view.H * 0.3, pos = lanePos(w, i, n, p);
  const ox = p.x, q = mkPiece(w, 0, G.D + 480);
  p.x = clamp(ox - 0.17, 0.12, 0.88);
  q.x = clamp(ox + 0.17, 0.12, 0.88);
  p.inv = 0.8;
  q.inv = 1;
  const bake = ((inv.oven > 0 ? 5 : 0) + (G.mustard ? 4 : 0)) * timerMul(inv);
  if (bake > 0) { p.oven = bake; q.oven = bake; }
  // De quoi refusionner assez vite.
  if (!skinTrait(curSkin(w), 'noMerge')) q.pick.push({ k: 'fuse', d: G.D + TUNE.butterFirst, x: 0.3 + w.rng() * 0.4, taken: false });
  G.pieces.splice(i + 1, 0, q);
  if (G.pieces.length >= 4) { G.reached4 = true; unlock(w, 'portion'); }
  pulse(G, TUNE.splitPulse, TUNE.splitDur);
  G.flash = 1;
  burst(w, pos.x, py, 16, [skinColors(w).fry, '#ffffff', METAL]);
  w.fx.beep(520, 0.14, 'square', 0.05, 420);
  w.fx.vibrate(25);
}

/** Le beurre fusionne le morceau avec son voisin : petit ralenti. */
export function mergeInto(w: World, p: Piece): void {
  const G = w.G;
  const i = G.pieces.indexOf(p), n = G.pieces.length;
  if (n < 2) return;
  const j = i + 1 < n ? i + 1 : i - 1, pos = lanePos(w, i, n, p);
  G.pieces.splice(j, 1);
  p.inv = Math.max(p.inv, 0.9);
  pulse(G, TUNE.mergePulse, TUNE.mergeDur);
  afterMerge(w);
  burst(w, pos.x, w.view.H * 0.3, 18, ['#ffe27a', '#ffffff', skinColors(w).fry]);
  w.fx.beep(420, 0.2, 'sine', 0.07, 520);
  w.fx.vibrate(20);
}

/** Morceau écrasé : fin de partie en classique (ou s'il était seul), sinon on continue sans lui. */
export function crush(w: World, p: Piece): void {
  const G = w.G;
  const i = G.pieces.indexOf(p), n = G.pieces.length, py = w.view.H * 0.3, pos = lanePos(w, i, n, p);
  const c = skinColors(w);
  burst(w, pos.x, py, 30, [c.potato, c.flesh, c.fry, c.potatoEdge]);
  G.shake = 0.28;
  w.fx.beep(190, 0.28, 'sawtooth', 0.09, -130);
  w.fx.vibrate(60);
  if (w.profile.settings.mode === 'classic' || n === 1) {
    if (n >= 3) unlock(w, 'fastfood');
    gameOver(w);
    return;
  }
  G.pieces.splice(i, 1);
  G.lost++;
}
