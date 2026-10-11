import { describe, expect, it } from 'vitest';
import { defaultProfile, parseProfile, serializeProfile } from './profile';

describe('sauvegarde (format pdp_v1 du prototype)', () => {
  it('JSON absent ou invalide : profil par défaut', () => {
    expect(parseProfile(null, 'es', false)).toEqual(defaultProfile('es'));
    expect(parseProfile('{oups', 'de', false)).toEqual(defaultProfile('de'));
    expect(parseProfile('42', 'fr', false)).toEqual(defaultProfile('fr'));
  });

  it('relit une sauvegarde du prototype', () => {
    const raw = JSON.stringify({
      control: 'tap', mode: 'survive', sound: 'off', dev: 'off', lang: 'de',
      best: 321, wallet: '77', inv: { ketchup: 2, oven: 1, inconnu: 5 }, skin: 'roseval',
      owned: { classic: true, roseval: true }, ach: { first: true }, stats: { runs: 12 },
    });
    const p = parseProfile(raw, 'fr', false);
    expect(p.settings).toEqual({ control: 'tap', mode: 'survive', sound: 'off', dev: 'off', lang: 'de', hitbox: 'off' });
    expect(p.best).toBe(321);
    expect(p.wallet).toBe(77);
    expect(p.inv.ketchup).toBe(2);
    expect(p.inv.oven).toBe(1);
    expect(p.inv).not.toHaveProperty('inconnu');
    expect(p.skinId).toBe('roseval');
    expect(p.ach).toEqual({ first: true });
    expect(p.stats.runs).toBe(12);
    expect(JSON.parse(serializeProfile(p))).toMatchObject({ skin: 'roseval', wallet: 77, lang: 'de' });
  });

  it('skin premium non possédé : retour au skin classique (sauf mode dev)', () => {
    const raw = JSON.stringify({ skin: 'cape', dev: 'on' });
    expect(parseProfile(raw, 'fr', false).skinId).toBe('classic');
    expect(parseProfile(raw, 'fr', true).skinId).toBe('cape');
  });

  it('skin inconnu : skin classique ; le skin classique est toujours possédé', () => {
    const p = parseProfile(JSON.stringify({ skin: 'banane', owned: {} }), 'fr', false);
    expect(p.skinId).toBe('classic');
    expect(p.owned.classic).toBe(true);
  });

  it('le réglage hitbox n’est pas sauvegardé', () => {
    const p = defaultProfile('fr');
    p.settings.hitbox = 'on';
    expect(JSON.parse(serializeProfile(p))).not.toHaveProperty('hitbox');
  });
});
