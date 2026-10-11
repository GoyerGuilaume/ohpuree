import { describe, expect, it } from 'vitest';
import { emptyInventory } from './profile';
import { buyItem, buySkin, devAddGold, equipSkin, resetAchievements, toggleDev, trySkin } from './shop';
import { testWorld } from './testkit';

describe('boutique', () => {
  it('achat d’un consommable : débite le prix et ajoute 1', () => {
    const w = testWorld({ profile: { wallet: 30 } });
    expect(buyItem(w, 'ketchup')).toBe(true);
    expect(w.profile.wallet).toBe(18);
    expect(w.profile.inv.ketchup).toBe(1);
    expect(w.rec.saves).toBe(1);
  });

  it('pas assez de golds : rien ne change', () => {
    const w = testWorld({ profile: { wallet: 11 } });
    expect(buyItem(w, 'ketchup')).toBe(false);
    expect(w.profile.wallet).toBe(11);
    expect(w.profile.inv.ketchup).toBe(0);
  });

  it('un passif ne s’achète qu’une fois', () => {
    const w = testWorld({ profile: { wallet: 1000 } });
    expect(buyItem(w, 'oven')).toBe(true);
    expect(buyItem(w, 'oven')).toBe(false);
    expect(w.profile.wallet).toBe(800);
  });

  it('l’Économe réduit le prix des objets et des skins', () => {
    const w = testWorld({ profile: { wallet: 100, inv: { ...emptyInventory(), peeler: 1 } } });
    buyItem(w, 'pepper'); // 35 → 30
    expect(w.profile.wallet).toBe(70);
    buySkin(w, 'roseval'); // 30 → 26
    expect(w.profile.wallet).toBe(44);
  });

  it('skin standard : acheté, équipé ; 3 skins possédés débloquent « Garde-robe »', () => {
    const w = testWorld({ profile: { wallet: 200 } });
    expect(buySkin(w, 'roseval')).toBe(true);
    expect(w.profile.skinId).toBe('roseval');
    expect(w.profile.ach.garderobe).toBeUndefined();
    expect(buySkin(w, 'grenaille')).toBe(true);
    expect(w.profile.ach.garderobe).toBe(true);
    expect(w.profile.wallet).toBe(200 - 30 - 40 + 25);
    expect(buySkin(w, 'grenaille')).toBe(false); // déjà possédé
  });

  it('un skin premium ne s’achète pas en golds ; « Essayer » l’équipe sans le sauvegarder', () => {
    const w = testWorld({ profile: { wallet: 1000 } });
    expect(buySkin(w, 'cape')).toBe(false);
    trySkin(w, 'cape');
    expect(w.profile.skinId).toBe('cape');
    expect(w.profile.owned.cape).toBeUndefined();
    expect(w.rec.saves).toBe(0);
    expect(w.rec.toasts).toHaveLength(1);
  });

  it('équiper exige de posséder le skin', () => {
    const w = testWorld();
    equipSkin(w, 'vitelotte');
    expect(w.profile.skinId).toBe('classic');
  });

  it('mode dev : objets offerts (+5 consommables), désactivation = retour à un skin possédé', () => {
    const w = testWorld({ devTools: true });
    toggleDev(w);
    expect(w.profile.settings.dev).toBe('on');
    expect(buyItem(w, 'mayo')).toBe(true);
    expect(w.profile.inv.mayo).toBe(5);
    expect(buyItem(w, 'timer')).toBe(true);
    expect(w.profile.inv.timer).toBe(1);
    expect(w.profile.wallet).toBe(0);
    equipSkin(w, 'stone'); // possédé grâce au mode dev
    expect(w.profile.skinId).toBe('stone');
    toggleDev(w);
    expect(w.profile.skinId).toBe('classic');
  });

  it('sans VITE_DEV_TOOLS, le mode dev reste inactif même si la sauvegarde dit « on »', () => {
    const w = testWorld({ devTools: false });
    w.profile.settings.dev = 'on';
    expect(buyItem(w, 'mayo')).toBe(false); // portefeuille vide, pas d'objet offert
  });

  it('outils dev : +1000 golds, réinitialisation des succès', () => {
    const w = testWorld({ devTools: true, profile: { ach: { first: true }, stats: { runs: 4 } } });
    devAddGold(w);
    expect(w.profile.wallet).toBe(1000);
    resetAchievements(w);
    expect(w.profile.ach).toEqual({});
    expect(w.profile.stats.runs).toBe(0);
  });
});
