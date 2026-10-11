import { ITEMS } from '../data/items';
import type { ItemId } from '../data/items';
import { DEFAULT_SKIN, skinById } from '../data/skins';
import type { SkinDef } from '../data/skins';
import { isLang } from '../i18n';
import type { Lang } from '../i18n';

/** Clé de sauvegarde, identique au prototype (les sauvegardes existantes restent lisibles). */
export const SAVE_KEY = 'pdp_v1';

export interface Settings {
  control: 'tilt' | 'tap';
  mode: 'classic' | 'survive';
  sound: 'on' | 'off';
  dev: 'on' | 'off';
  lang: Lang;
  /** Non sauvegardé (comme dans le prototype). */
  hitbox: 'on' | 'off';
}

export type Inventory = Record<ItemId, number>;

/** Progression du joueur : tout ce qui est sauvegardé. */
export interface Profile {
  settings: Settings;
  best: number;
  wallet: number;
  inv: Inventory;
  skinId: string;
  owned: Record<string, boolean>;
  ach: Record<string, boolean>;
  stats: { runs: number };
}

const ALLOWED = {
  control: ['tilt', 'tap'],
  mode: ['classic', 'survive'],
  sound: ['on', 'off'],
  dev: ['on', 'off'],
} as const;

export function emptyInventory(): Inventory {
  return Object.fromEntries(ITEMS.map((i) => [i.id, 0])) as Inventory;
}

export function defaultProfile(lang: Lang): Profile {
  return {
    settings: { control: 'tilt', mode: 'classic', sound: 'on', dev: 'off', lang, hitbox: 'off' },
    best: 0,
    wallet: 0,
    inv: emptyInventory(),
    skinId: DEFAULT_SKIN.id,
    owned: { [DEFAULT_SKIN.id]: true },
    ach: {},
    stats: { runs: 0 },
  };
}

/** Mode dev actif : autorisé par l'environnement ET activé par le joueur. */
export function profileDevOn(p: Profile, devTools: boolean): boolean {
  return devTools && p.settings.dev === 'on';
}

export function profileOwns(p: Profile, devTools: boolean, sk: SkinDef): boolean {
  return !!p.owned[sk.id] || profileDevOn(p, devTools);
}

const num = (v: unknown): number => Number(v) || 0;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const flags = (v: Record<string, unknown>): Record<string, boolean> =>
  Object.fromEntries(Object.entries(v).map(([k, x]) => [k, !!x]));

/**
 * Lit une sauvegarde (JSON du prototype). Tolérant comme le prototype : un JSON invalide
 * donne le profil par défaut. Différence : une valeur de réglage inconnue est ignorée.
 */
export function parseProfile(raw: string | null, lang: Lang, devTools: boolean): Profile {
  const p = defaultProfile(lang);
  let saved: unknown;
  try {
    saved = JSON.parse(raw || '{}');
  } catch {
    return p;
  }
  if (!isRecord(saved)) return p;
  const s = p.settings;
  const pick = <K extends keyof typeof ALLOWED>(k: K): void => {
    const v = saved[k];
    if ((ALLOWED[k] as readonly unknown[]).includes(v)) s[k] = v as Settings[K];
  };
  pick('control');
  pick('mode');
  pick('sound');
  pick('dev');
  if (typeof saved.lang === 'string' && isLang(saved.lang)) s.lang = saved.lang;
  p.best = num(saved.best);
  p.wallet = num(saved.wallet);
  const inv = saved.inv;
  if (isRecord(inv)) for (const id of Object.keys(p.inv) as ItemId[]) p.inv[id] = num(inv[id]);
  if (typeof saved.skin === 'string' && saved.skin) p.skinId = saved.skin;
  if (isRecord(saved.ach)) p.ach = flags(saved.ach);
  if (isRecord(saved.stats)) p.stats.runs = num(saved.stats.runs);
  if (isRecord(saved.owned)) p.owned = flags(saved.owned);
  p.owned[DEFAULT_SKIN.id] = true;
  p.skinId = skinById(p.skinId).id;
  const sk = skinById(p.skinId);
  if (sk.premium && !profileOwns(p, devTools, sk)) p.skinId = DEFAULT_SKIN.id;
  return p;
}

/** Sérialise au format du prototype (le réglage hitbox n'est pas sauvegardé). */
export function serializeProfile(p: Profile): string {
  const { control, mode, sound, dev, lang } = p.settings;
  return JSON.stringify({
    control, mode, sound, dev, lang,
    best: p.best, wallet: p.wallet, inv: p.inv, skin: p.skinId, owned: p.owned, ach: p.ach, stats: p.stats,
  });
}
