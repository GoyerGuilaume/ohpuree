import type { fr } from './fr';

/** Clé de traduction : toute clé absente de fr.ts est une erreur de compilation. */
export type StrKey = keyof typeof fr;

/** Dictionnaire d'une langue : exactement les mêmes clés que fr.ts. */
export type Dict = Readonly<Record<StrKey, string>>;
