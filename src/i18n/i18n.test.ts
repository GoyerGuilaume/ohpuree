import { afterEach, describe, expect, it } from 'vitest';
import { DICTS, LANGS, detectLang, getLang, setLang, tr } from '.';
import type { StrKey } from '.';

const placeholders = (s: string): string[] => (s.match(/\{\d+\}/g) ?? []).sort();
const keysOf = (lang: (typeof LANGS)[number]): StrKey[] => Object.keys(DICTS[lang]).sort() as StrKey[];

describe('complétude des traductions', () => {
  const ref = keysOf('fr');

  it.each(LANGS)('%s a exactement les mêmes clés que fr', (lang) => {
    expect(keysOf(lang)).toEqual(ref);
  });

  it.each(LANGS)('%s : aucune chaîne vide', (lang) => {
    const empty = ref.filter((k) => DICTS[lang][k].trim() === '');
    expect(empty).toEqual([]);
  });

  it.each(LANGS)('%s : mêmes placeholders que fr pour chaque clé', (lang) => {
    const diff = ref.filter((k) => placeholders(DICTS[lang][k]).join() !== placeholders(DICTS.fr[k]).join());
    expect(diff).toEqual([]);
  });

  it('le titre est « Oh purée ! » dans toutes les langues', () => {
    for (const lang of LANGS) expect(DICTS[lang].title).toBe('Oh purée !');
  });
});

describe('tr()', () => {
  afterEach(() => {
    setLang('fr');
  });

  it('remplace les placeholders dans la langue courante', () => {
    setLang('en');
    expect(tr('total', 12, 340)).toBe('+12 🪙  (total: 340 🪙)');
    setLang('fr');
    expect(tr('record', 42)).toBe('Record : 42 m');
  });

  it('sans argument, laisse la chaîne intacte', () => {
    setLang('de');
    expect(tr('play')).toBe('Spielen');
  });
});

describe('choix de la langue', () => {
  afterEach(() => {
    setLang('fr');
  });

  it('detectLang : langue gérée, sinon anglais', () => {
    expect(detectLang('fr-FR')).toBe('fr');
    expect(detectLang('ES')).toBe('es');
    expect(detectLang('de-AT')).toBe('de');
    expect(detectLang('it-IT')).toBe('en');
    expect(detectLang(undefined)).toBe('fr');
    expect(detectLang('')).toBe('fr');
  });

  it('setLang : une langue inconnue retombe sur le français', () => {
    expect(setLang('es')).toBe('es');
    expect(getLang()).toBe('es');
    expect(setLang('zz')).toBe('fr');
  });
});
