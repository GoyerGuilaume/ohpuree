import { unlock } from './achievements';
import { stepParts } from './fxhelpers';
import { newRun } from './run';
import { update } from './step';
import type { Phase, World } from './types';
import { curSkin, skinTrait } from './world';

/** Durée du compte à rebours après une pause (s) ; chaque chiffre dure COUNTDOWN_STEP. */
export const COUNTDOWN = 2.1;
export const COUNTDOWN_STEP = 0.7;

export function setPhase(w: World, phase: Phase): void {
  w.phase = phase;
  w.fx.phaseChanged(phase);
}

export const inGame = (phase: Phase): boolean => phase === 'play' || phase === 'paused' || phase === 'countdown';

/** Pas de temps d'une frame, plafonné comme dans le prototype. */
export function frameDt(ts: number, last: number): number {
  return Math.min(0.033, (ts - last) / 1000 || 0);
}

/** Avance le jeu d'une frame selon la phase. */
export function tick(w: World, dt: number): void {
  const G = w.G;
  if (w.phase === 'play') update(w, dt);
  else if (w.phase === 'menu') { G.D += 70 * dt; G.t += dt; stepParts(w, dt); }
  else if (w.phase === 'countdown') { G.cd -= dt; if (G.cd <= 0) setPhase(w, 'play'); }
  else if (w.phase === 'over') stepParts(w, dt);
}

/** Chiffre affiché pendant le compte à rebours (3, 2, 1). */
export function countdownDigit(w: World): number {
  return Math.max(1, Math.ceil(w.G.cd / COUNTDOWN_STEP));
}

/** Nouvelle partie : les consommables en stock sont utilisés automatiquement. */
export function startGame(w: World): void {
  w.G = newRun(w);
  setPhase(w, 'play');
  const inv = w.profile.inv, G = w.G;
  if (inv.ketchup > 0) { inv.ketchup--; G.ketchup = 1; }
  if (inv.mayo > 0) { inv.mayo--; G.mayo = 1; }
  if (inv.pepper > 0) { inv.pepper--; G.pepper = true; }
  if (inv.mustard > 0) { inv.mustard--; G.mustard = true; }
  if (inv.hot > 0) { inv.hot--; G.hot = true; }
  w.fx.save();
}

export function gameOver(w: World): void {
  const G = w.G, p = w.profile;
  setPhase(w, 'over');
  const isRecord = G.score > p.best;
  if (isRecord) p.best = G.score;
  p.wallet += G.gold;
  p.stats.runs++;
  w.fx.save();
  unlock(w, 'first');
  if (p.stats.runs >= 10) unlock(w, 'accro');
  w.fx.gameOver({ score: G.score, isRecord, best: p.best, gold: G.gold, wallet: p.wallet, achRun: G.achRun.slice() });
}

/** Pause : seulement pendant le jeu ou le compte à rebours. */
export function pause(w: World): boolean {
  if (w.phase !== 'play' && w.phase !== 'countdown') return false;
  w.input = 0;
  setPhase(w, 'paused');
  return true;
}

/** Reprise : passe par un compte à rebours avant de rejouer. */
export function resume(w: World): boolean {
  if (w.phase !== 'paused') return false;
  w.G.cd = COUNTDOWN;
  setPhase(w, 'countdown');
  return true;
}

/** Partie abandonnée (Recommencer / Menu) : golds et record sont quand même comptés. */
export function endRunEarly(w: World): void {
  const G = w.G, p = w.profile;
  p.wallet += G.gold;
  if (G.score > p.best) p.best = G.score;
  p.stats.runs++;
  w.fx.save();
  if (p.stats.runs >= 10) unlock(w, 'accro');
}

export function restartRun(w: World): void {
  endRunEarly(w);
  startGame(w);
}

export function quitToMenu(w: World): void {
  endRunEarly(w);
  backToMenu(w);
}

/** Retour au menu (avec une partie de fond qui défile). */
export function backToMenu(w: World): void {
  setPhase(w, 'menu');
  w.G = newRun(w);
}

/** Planer (skin à cape) : 1,6 s de chute ralentie, recharge 7 s. */
export function tryGlide(w: World): void {
  const G = w.G;
  if (w.phase !== 'play' || !skinTrait(curSkin(w), 'cape')) return;
  if (G.glide > 0 || G.glideCd > 0) return;
  G.glide = 1.6;
  G.glideCd = 7;
  G.glides++;
  if (G.glides >= 5) unlock(w, 'poppins');
  w.fx.beep(300, 0.35, 'sine', 0.05, 200);
  w.fx.vibrate(15);
}
