// Garde-fou : les données typées doivent rester identiques au prototype legacy
// (aucun changement de gameplay ni d'équilibrage), textes compris.
import { describe, expect, it } from 'vitest';
import { BIOME_LEN, MAXP, TUNE } from '../config/tune';
import { DICTS, LANGS } from '../i18n';
import type { StrKey } from '../i18n';
import { legacyHtml, legacyLiteral, legacyNumber } from '../testing/legacy';
import { ACHIEVEMENTS, achDescKey, achNameKey } from './achievements';
import { BIOMES, biomeNameKey } from './biomes';
import { BONUSES, DEV_TIER_P, TIERS, bonusNameKey } from './bonuses';
import { ITEMS, itemDescKey, itemNameKey } from './items';
import { SKINS, skinDescKey, skinNameKey } from './skins';

type L4 = [string, string, string, string];
type Loose = Record<string, unknown> & { name: L4; desc?: L4 };

/** Textes d'une clé dans les 4 langues, dans l'ordre du legacy (fr, en, es, de). */
const texts = (key: StrKey): string[] => LANGS.map((l) => DICTS[l][key]);
/** Retire les champs textuels pour comparer le reste. */
const strip = ({ name: _n, desc: _d, ...rest }: Loose): Record<string, unknown> => rest;

describe('parité avec legacy/ohpureeV0.html', () => {
  it('TUNE et constantes', () => {
    expect(TUNE).toEqual(legacyLiteral('TUNE'));
    expect(BIOME_LEN).toBe(legacyNumber('BIOME_LEN'));
    expect(MAXP).toBe(legacyNumber('MAXP'));
    expect(legacyHtml).toContain(`devOn()?[${DEV_TIER_P.join(',').replace(/0\./g, '.')}]`);
  });

  it('objets de la boutique', () => {
    const legacy = legacyLiteral<Loose[]>('ITEMS');
    expect(ITEMS.map((i) => ({ ...i }))).toEqual(legacy.map(strip));
    legacy.forEach((l, i) => {
      const id = ITEMS[i]!.id;
      expect(texts(itemNameKey(id))).toEqual(l.name);
      expect(texts(itemDescKey(id))).toEqual(l.desc);
    });
  });

  it('skins', () => {
    const legacy = legacyLiteral<Loose[]>('SKINS');
    // Le legacy n'a pas de champ premium:false ni price pour les premium : on normalise.
    const ours = SKINS.map((s) => {
      const { premium, ...rest } = s;
      return premium ? { premium, ...rest } : rest;
    });
    expect(ours).toEqual(legacy.map(strip));
    legacy.forEach((l, i) => {
      const s = SKINS[i]!;
      expect(texts(skinNameKey(s.id))).toEqual(l.name);
      if (s.premium) expect(texts(skinDescKey(s.id))).toEqual(l.desc);
      else expect(l.desc).toBeUndefined();
    });
  });

  it('paliers et bonus', () => {
    const tiers = legacyLiteral<{ color: string; p: number }[]>('TIERS');
    expect(TIERS.map(({ color, p }) => ({ color, p }))).toEqual(tiers.map(({ color, p }) => ({ color, p })));
    const legacy = legacyLiteral<Loose[]>('BONUSES');
    expect(BONUSES.map((b) => ({ ...b }))).toEqual(legacy.map(strip));
    legacy.forEach((l, i) => expect(texts(bonusNameKey(BONUSES[i]!.id))).toEqual(l.name));
  });

  it('succès', () => {
    const legacy = legacyLiteral<Loose[]>('ACHS');
    expect(ACHIEVEMENTS.map((a) => ({ ...a }))).toEqual(legacy.map(strip));
    legacy.forEach((l, i) => {
      const id = ACHIEVEMENTS[i]!.id;
      expect(texts(achNameKey(id))).toEqual(l.name);
      expect(texts(achDescKey(id))).toEqual(l.desc);
    });
  });

  it('décors', () => {
    const legacy = legacyLiteral<Loose[]>('BIOMES');
    expect(BIOMES).toHaveLength(13);
    expect(BIOMES.map(({ id: _id, ...rest }) => rest)).toEqual(legacy.map(strip));
    legacy.forEach((l, i) => expect(texts(biomeNameKey(BIOMES[i]!.id))).toEqual(l.name));
  });

  it('textes de l’interface (STR), titre excepté', () => {
    const legacy = legacyLiteral<Record<string, L4>>('STR');
    const keys = Object.keys(legacy).filter((k) => k !== 'title');
    for (const k of keys) expect(texts(k as StrKey), k).toEqual(legacy[k]);
  });
});
