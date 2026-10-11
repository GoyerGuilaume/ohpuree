import { describe, expect, it } from 'vitest';
import { TUNE } from '../config/tune';
import { BONUSES } from '../data/bonuses';
import { ITEMS } from '../data/items';
import { applyBonus, rollBonus } from './bonus';
import { goldMul, priceOf } from './economy';
import { COUNTDOWN, countdownDigit, pause, resume, startGame, tick } from './flow';
import { mergeInto, split } from './pieces';
import { emptyInventory } from './profile';
import { seededRng } from './rng';
import { pulse, stepSlow } from './slowmo';
import { testWorld } from './testkit';
import type { Piece } from './types';

const DT = 1 / 60;

describe('ralenti à la coupe et à la fusion', () => {
  it('une coupe déclenche un ralenti de 40 % qui revient en 1,6 s', () => {
    const w = testWorld();
    startGame(w);
    split(w, w.G.pieces[0]!);
    expect(w.G.pieces).toHaveLength(2);
    expect(w.G.slowAmp).toBe(TUNE.splitPulse);
    expect(w.G.slowT).toBe(TUNE.splitDur);
    expect(w.G.slowDur).toBe(TUNE.splitDur);
    // Juste après : vitesse ≈ 60 %, puis retour progressif (quadratique) vers 100 %.
    const first = stepSlow(w.G, DT);
    expect(first).toBeCloseTo(1 - 0.4 * ((1.6 - DT) / 1.6) ** 2, 10);
    let prev = first, t = DT;
    while (t < TUNE.splitDur - 1e-9) {
      const pm = stepSlow(w.G, DT);
      expect(pm).toBeGreaterThanOrEqual(prev);
      prev = pm;
      t += DT;
    }
    expect(stepSlow(w.G, DT)).toBe(1);
  });

  it('une fusion déclenche un ralenti de 20 % sur 0,8 s', () => {
    const w = testWorld();
    startGame(w);
    split(w, w.G.pieces[0]!);
    w.G.slowT = 0; // ralenti de la coupe terminé
    mergeInto(w, w.G.pieces[0]!);
    expect(w.G.pieces).toHaveLength(1);
    expect(w.G.slowAmp).toBe(TUNE.mergePulse);
    expect(w.G.slowT).toBe(TUNE.mergeDur);
  });

  it('un ralenti plus faible n’écrase pas un ralenti plus fort en cours', () => {
    const w = testWorld();
    pulse(w.G, TUNE.splitPulse, TUNE.splitDur);
    pulse(w.G, TUNE.mergePulse, TUNE.mergeDur); // 0,2 < 0,4 restant : ignoré
    expect(w.G.slowAmp).toBe(TUNE.splitPulse);
    // Quand le ralenti fort est presque fini, le nouveau prend le relais.
    w.G.slowT = 0.3; // reste 0,4 × (0,3/1,6)² ≈ 0,014
    pulse(w.G, TUNE.mergePulse, TUNE.mergeDur);
    expect(w.G.slowAmp).toBe(TUNE.mergePulse);
    expect(w.G.slowDur).toBe(TUNE.mergeDur);
  });

  it('le ralenti réduit bien la distance parcourue', () => {
    const run = (withSplit: boolean): number => {
      const w = testWorld({ seed: 3 });
      startGame(w);
      for (let i = 0; i < 120; i++) tick(w, DT); // fin de l'accélération de départ
      if (withSplit) pulse(w.G, TUNE.splitPulse, TUNE.splitDur);
      w.G.pieces.forEach((p) => { p.inv = 99; }); // aucune collision pendant la mesure
      const d0 = w.G.D;
      for (let i = 0; i < 30; i++) tick(w, DT);
      return w.G.D - d0;
    };
    expect(run(true)).toBeLessThan(run(false) * 0.75);
  });
});

describe('bonus légendaire et skin premium', () => {
  const draws = (premium: boolean): string[] => {
    const rng = seededRng(42);
    return Array.from({ length: 4000 }, () => rollBonus(rng, true, premium)).filter((b) => b.tier === 3).map((b) => b.id);
  };

  it('sans skin premium : « Skin légendaire », jamais « Pluie d’or »', () => {
    const ids = new Set(draws(false));
    expect(ids).toEqual(new Set(['loan']));
  });

  it('avec un skin premium : « Pluie d’or », jamais « Skin légendaire »', () => {
    const ids = new Set(draws(true));
    expect(ids).toEqual(new Set(['rain']));
  });

  it('un « Skin légendaire » ramassé avec un skin premium devient une pluie d’or', () => {
    const w = testWorld({ profile: { skinId: 'stone', owned: { classic: true, stone: true } } });
    startGame(w);
    const p = w.G.pieces[0]!;
    applyBonus(w, { k: 'bonus', b: 'loan', tier: 3, d: 0, x: 0.5, taken: true }, p);
    expect(w.G.skinOverride).toBeNull();
    expect(w.G.gold).toBe(50);
  });

  it('sans skin premium, il prête un skin premium jusqu’à la fin de la partie', () => {
    const w = testWorld();
    startGame(w);
    applyBonus(w, { k: 'bonus', b: 'loan', tier: 3, d: 0, x: 0.5, taken: true }, w.G.pieces[0]!);
    expect(['cape', 'stone', 'magnet']).toContain(w.G.skinOverride);
    expect(w.profile.skinId).toBe('classic');
    startGame(w);
    expect(w.G.skinOverride).toBeNull();
  });

  it('les probabilités des paliers somment à 1', () => {
    const counts = [0, 0, 0, 0];
    const rng = seededRng(7);
    for (let i = 0; i < 20000; i++) counts[rollBonus(rng, false, false).tier]!++;
    expect(counts[0]! / 20000).toBeCloseTo(0.7, 1);
    expect(counts[3]! / 20000).toBeLessThan(0.02);
    expect(BONUSES.filter((b) => b.tier === 3).map((b) => b.id)).toEqual(['loan', 'rain']);
  });
});

describe('prix avec l’Économe', () => {
  it('sans Économe : prix de base', () => {
    const inv = emptyInventory();
    for (const it of ITEMS) expect(priceOf(it.price, inv)).toBe(it.price);
  });

  it('avec Économe : -15 %, arrondi, jamais moins de 1', () => {
    const inv = { ...emptyInventory(), peeler: 1 };
    expect(priceOf(12, inv)).toBe(10); // 10,2
    expect(priceOf(15, inv)).toBe(13); // 12,75
    expect(priceOf(30, inv)).toBe(26); // 25,5 → arrondi au-dessus
    expect(priceOf(200, inv)).toBe(170);
    expect(priceOf(1, inv)).toBe(1);
    expect(priceOf(0, inv)).toBe(1);
  });
});

describe('pause et compte à rebours', () => {
  it('pause impossible hors partie', () => {
    const w = testWorld();
    expect(pause(w)).toBe(false); // menu
    expect(w.phase).toBe('menu');
    expect(resume(w)).toBe(false);
  });

  it('la pause gèle le jeu ; la reprise passe par 3, 2, 1 puis rejoue', () => {
    const w = testWorld();
    startGame(w);
    for (let i = 0; i < 60; i++) tick(w, DT);
    w.input = 1;
    expect(pause(w)).toBe(true);
    expect(w.phase).toBe('paused');
    expect(w.input).toBe(0);
    const frozen = JSON.stringify(w.G);
    for (let i = 0; i < 300; i++) tick(w, DT);
    expect(JSON.stringify(w.G)).toBe(frozen);

    expect(resume(w)).toBe(true);
    expect(w.phase).toBe('countdown');
    expect(w.G.cd).toBe(COUNTDOWN);
    const D = w.G.D;
    const digits: number[] = [];
    let frames = 0;
    // Comme dans la boucle de jeu : on avance, puis on dessine le chiffre.
    // (Juste à la reprise, 2,1 / 0,7 donne 3,0000000000000004 → 4, mais ce n'est jamais dessiné.)
    while (w.phase === 'countdown') {
      tick(w, DT);
      frames++;
      if (w.phase === 'countdown') {
        const d = countdownDigit(w);
        if (digits.at(-1) !== d) digits.push(d);
      }
    }
    expect(digits).toEqual([3, 2, 1]);
    expect(frames).toBeGreaterThanOrEqual(Math.floor(COUNTDOWN / DT) - 1);
    expect(frames).toBeLessThanOrEqual(Math.ceil(COUNTDOWN / DT) + 1);
    expect(w.G.D).toBe(D); // rien ne bouge pendant le compte à rebours
    expect(w.phase).toBe('play');
    tick(w, DT);
    expect(w.G.D).toBeGreaterThan(D);
  });

  it('on peut remettre en pause pendant le compte à rebours', () => {
    const w = testWorld();
    startGame(w);
    pause(w);
    resume(w);
    expect(pause(w)).toBe(true);
    expect(w.phase).toBe('paused');
  });
});

describe('multiplicateur de golds', () => {
  const G = (o: { pepper?: boolean; pepperT?: number; hot?: boolean }) => {
    const w = testWorld();
    Object.assign(w.G, o);
    return w.G;
  };

  it('combinaisons poivre / sauce piquante', () => {
    expect(goldMul(G({}))).toBe(1);
    expect(goldMul(G({ pepper: true }))).toBe(2);
    expect(goldMul(G({ pepperT: 5 }))).toBe(2);
    expect(goldMul(G({ pepper: true, pepperT: 5 }))).toBe(2); // pas cumulatif
    expect(goldMul(G({ hot: true }))).toBe(3);
    expect(goldMul(G({ pepper: true, hot: true }))).toBe(4);
  });

  it('un gold ramassé rapporte le multiplicateur courant', () => {
    const w = testWorld();
    startGame(w);
    w.G.pepper = true;
    w.G.hot = true;
    const p: Piece = w.G.pieces[0]!;
    p.pick = [{ k: 'gold', d: w.G.D, x: p.x, taken: false }];
    p.nextD = Infinity; // pas de génération pendant le test
    tick(w, DT);
    expect(w.G.gold).toBe(4);
  });

  it('la pluie d’or applique aussi le multiplicateur', () => {
    const w = testWorld({ profile: { skinId: 'magnet', owned: { classic: true, magnet: true } } });
    startGame(w);
    w.G.pepperT = 10;
    applyBonus(w, { k: 'bonus', b: 'rain', tier: 3, d: 0, x: 0.5, taken: true }, w.G.pieces[0]!);
    expect(w.G.gold).toBe(100);
  });

  it('les consommables de la boutique sont utilisés au départ', () => {
    const w = testWorld({ profile: { inv: { ...emptyInventory(), pepper: 2, hot: 1, ketchup: 1 } } });
    startGame(w);
    expect(w.G.pepper).toBe(true);
    expect(w.G.hot).toBe(true);
    expect(w.G.ketchup).toBe(1);
    expect(w.profile.inv).toMatchObject({ pepper: 1, hot: 0, ketchup: 0 });
  });
});
