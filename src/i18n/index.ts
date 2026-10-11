import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import type { Dict, StrKey } from './types';

export type { Dict, StrKey } from './types';

export const LANGS = ['fr', 'en', 'es', 'de'] as const;
export type Lang = (typeof LANGS)[number];

export const DICTS: Readonly<Record<Lang, Dict>> = { fr, en, es, de };

let current: Lang = 'fr';

export function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v);
}

/** Langue du navigateur si elle est gérée, sinon anglais (comme le prototype). */
export function detectLang(navigatorLanguage: string | undefined): Lang {
  const n = (navigatorLanguage || 'fr').slice(0, 2).toLowerCase();
  return isLang(n) ? n : 'en';
}

/** Change la langue courante ; une valeur inconnue retombe sur le français (comme le prototype). */
export function setLang(lang: string): Lang {
  current = isLang(lang) ? lang : 'fr';
  return current;
}

export function getLang(): Lang {
  return current;
}

/**
 * Traduit une clé et remplace {0}, {1}… par les arguments.
 * Comme le prototype, seule la première occurrence de chaque placeholder est remplacée.
 */
export function tr(key: StrKey, ...args: readonly (string | number)[]): string {
  let out = DICTS[current][key];
  args.forEach((a, i) => {
    out = out.replace(`{${i}}`, String(a));
  });
  return out;
}
