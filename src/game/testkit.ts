// Outils de test : monde seedé et effets enregistrés.
import { setLang } from '../i18n';
import { defaultProfile } from './profile';
import type { Profile } from './profile';
import { seededRng } from './rng';
import type { Fx, GameOverSummary, Phase, World } from './types';
import { createWorld } from './world';

export interface FxRecord {
  beeps: unknown[][];
  vibes: number[];
  toasts: string[];
  saves: number;
  phases: Phase[];
  overs: GameOverSummary[];
}

export function testWorld(opts: { seed?: number; profile?: Partial<Profile>; devTools?: boolean } = {}): World & { rec: FxRecord } {
  setLang('fr');
  const rec: FxRecord = { beeps: [], vibes: [], toasts: [], saves: 0, phases: [], overs: [] };
  const fx: Fx = {
    beep: (...a) => { rec.beeps.push(a); },
    vibrate: (ms) => { rec.vibes.push(ms); },
    toast: (m) => { rec.toasts.push(m); },
    save: () => { rec.saves++; },
    phaseChanged: (p) => { rec.phases.push(p); },
    gameOver: (s) => { rec.overs.push(s); },
  };
  const profile = { ...defaultProfile('fr'), ...opts.profile };
  const w = createWorld({ profile, view: { W: 400, H: 800 }, rng: seededRng(opts.seed ?? 1), fx, devTools: opts.devTools ?? false });
  return Object.assign(w, { rec });
}
