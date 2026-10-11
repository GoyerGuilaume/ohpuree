import { skinById } from '../data/skins';
import type { SkinDef } from '../data/skins';
import { profileDevOn, profileOwns } from './profile';
import type { Profile } from './profile';
import type { Rng } from './rng';
import { newRun } from './run';
import type { Fx, View, World } from './types';

export interface WorldOptions {
  profile: Profile;
  view: View;
  rng: Rng;
  fx: Fx;
  devTools: boolean;
}

/** Crée le monde en phase « menu », avec une partie de fond (comme au démarrage du prototype). */
export function createWorld(o: WorldOptions): World {
  const w: World = {
    phase: 'menu',
    // newRun a besoin du monde (vue, générateur) : la partie est créée juste après.
    G: null as unknown as World['G'],
    profile: o.profile,
    view: o.view,
    rng: o.rng,
    fx: o.fx,
    devTools: o.devTools,
    activeControl: 'tap',
    input: 0,
  };
  w.G = newRun(w);
  return w;
}

export const devOn = (w: World): boolean => profileDevOn(w.profile, w.devTools);
export const isOwned = (w: World, sk: SkinDef): boolean => profileOwns(w.profile, w.devTools, sk);

/** Skin effectif : celui prêté par le bonus légendaire, sinon celui équipé. */
export function curSkin(w: World): SkinDef {
  return w.G.skinOverride ? skinById(w.G.skinOverride) : skinById(w.profile.skinId);
}

/** Lit une compétence de skin (toujours absente sur un skin standard). */
export function skinTrait<K extends 'cape' | 'stone' | 'speedMul' | 'spark' | 'noMerge' | 'magnet'>(
  sk: SkinDef,
  k: K,
): Extract<SkinDef, { premium: true }>[K] | undefined {
  return sk.premium ? sk[k] : undefined;
}
