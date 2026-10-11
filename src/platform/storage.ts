import { Preferences } from '@capacitor/preferences';
import { SAVE_KEY } from '../game/profile';

/** Stockage clé/valeur asynchrone (Preferences : natif sur mobile, localStorage sur le web). */
export interface KeyValue {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

const preferences: KeyValue = {
  get: async (key) => (await Preferences.get({ key })).value,
  set: (key, value) => Preferences.set({ key, value }),
};

/** Ancienne sauvegarde du prototype et de la version web (localStorage « pdp_v1 »). */
function legacyLocalStorage(): string | null {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

/**
 * Lit la sauvegarde. Si Preferences est vide, reprend l'ancienne sauvegarde localStorage
 * et la recopie dans Preferences (migration, une seule fois).
 */
export async function loadSave(kv: KeyValue = preferences, legacy: () => string | null = legacyLocalStorage): Promise<string | null> {
  try {
    const v = await kv.get(SAVE_KEY);
    if (v != null) return v;
  } catch {
    // Stockage indisponible : on tente l'ancienne sauvegarde.
  }
  const old = legacy();
  if (old != null) await kv.set(SAVE_KEY, old).catch(() => {});
  return old;
}

let queue: Promise<void> = Promise.resolve();

/** Écrit la sauvegarde ; les écritures sont faites dans l'ordre, une erreur n'interrompt pas le jeu. */
export function writeSave(json: string, kv: KeyValue = preferences): Promise<void> {
  queue = queue.then(() => kv.set(SAVE_KEY, json)).catch(() => {});
  return queue;
}
