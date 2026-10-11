import { describe, expect, it } from 'vitest';
import { backAction } from './back';

const none = { shop: false, ach: false };

describe('bouton retour Android', () => {
  it('en jeu : pause ; en pause : reprise', () => {
    expect(backAction('play', none)).toBe('pause');
    expect(backAction('countdown', none)).toBe('pause');
    expect(backAction('paused', none)).toBe('resume');
  });

  it('boutique ou succès ouverts : on les ferme (y compris boutique ouverte depuis la fin de partie)', () => {
    expect(backAction('menu', { shop: true, ach: false })).toBe('closeShop');
    expect(backAction('over', { shop: true, ach: false })).toBe('closeShop');
    expect(backAction('menu', { shop: false, ach: true })).toBe('closeAch');
  });

  it('fin de partie : retour au menu ; menu : quitter l’appli', () => {
    expect(backAction('over', none)).toBe('toMenu');
    expect(backAction('menu', none)).toBe('exit');
  });
});
