/** Élément par id (le balisage est fixe : un id manquant est une erreur de programmation). */
export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`#${id} introuvable`);
  return e as T;
}

export const show = (id: string): void => { $(id).classList.remove('hidden'); };
export const hide = (...ids: string[]): void => { for (const id of ids) $(id).classList.add('hidden'); };
export const isHidden = (id: string): boolean => $(id).classList.contains('hidden');
