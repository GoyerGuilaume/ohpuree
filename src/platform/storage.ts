import { SAVE_KEY } from '../game/profile';

/** Lit la sauvegarde brute (JSON) ; null si absente ou inaccessible. */
export function loadSave(): string | null {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

export function writeSave(json: string): void {
  try {
    localStorage.setItem(SAVE_KEY, json);
  } catch {
    // Stockage indisponible (navigation privée…) : on joue sans sauvegarde.
  }
}
