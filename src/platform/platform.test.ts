import { ImpactStyle } from '@capacitor/haptics';
import { describe, expect, it } from 'vitest';
import { SAVE_KEY } from '../game/profile';
import { impactFor } from './haptics';
import { PRODUCT_IDS, demoPurchases } from './purchases';
import { loadSave, writeSave } from './storage';
import type { KeyValue } from './storage';

function memoryKV(init: Record<string, string> = {}): KeyValue & { data: Record<string, string> } {
  const data = { ...init };
  return {
    data,
    get: (k) => Promise.resolve(data[k] ?? null),
    set: (k, v) => { data[k] = v; return Promise.resolve(); },
  };
}

describe('stockage', () => {
  it('lit la sauvegarde Preferences', async () => {
    const kv = memoryKV({ [SAVE_KEY]: '{"wallet":5}' });
    expect(await loadSave(kv, () => '{"wallet":999}')).toBe('{"wallet":5}');
  });

  it('migre une ancienne sauvegarde localStorage si Preferences est vide', async () => {
    const kv = memoryKV();
    expect(await loadSave(kv, () => '{"wallet":42}')).toBe('{"wallet":42}');
    expect(kv.data[SAVE_KEY]).toBe('{"wallet":42}');
  });

  it('rien nulle part : null', async () => {
    expect(await loadSave(memoryKV(), () => null)).toBeNull();
  });

  it('Preferences en panne : on reprend l’ancienne sauvegarde sans planter', async () => {
    const broken: KeyValue = { get: () => Promise.reject(new Error('x')), set: () => Promise.reject(new Error('x')) };
    expect(await loadSave(broken, () => '{"best":3}')).toBe('{"best":3}');
  });

  it('les écritures sont faites dans l’ordre ; une erreur n’arrête pas les suivantes', async () => {
    const order: string[] = [];
    let fail = true;
    const kv: KeyValue = {
      get: () => Promise.resolve(null),
      set: async (_k, v) => {
        await new Promise((r) => setTimeout(r, v === 'a' ? 20 : 0));
        if (fail) { fail = false; throw new Error('disque plein'); }
        order.push(v);
      },
    };
    void writeSave('a', kv);
    void writeSave('b', kv);
    await writeSave('c', kv);
    expect(order).toEqual(['b', 'c']);
  });
});

describe('retour haptique', () => {
  it('durées du jeu → intensité iOS', () => {
    expect([15, 20].map(impactFor)).toEqual([ImpactStyle.Light, ImpactStyle.Light]);
    expect([25, 40].map(impactFor)).toEqual([ImpactStyle.Medium, ImpactStyle.Medium]);
    expect(impactFor(60)).toBe(ImpactStyle.Heavy);
  });
});

describe('achats factices', () => {
  it('reprennent le comportement du prototype : prix affiché, essai, rien à restaurer', async () => {
    expect(demoPurchases.demo).toBe(true);
    expect(await demoPurchases.products()).toEqual([
      { skin: 'cape', price: '2,99 €' },
      { skin: 'stone', price: '1,99 €' },
      { skin: 'magnet', price: '1,99 €' },
    ]);
    expect(await demoPurchases.purchase('cape')).toBe('demo');
    expect(await demoPurchases.restore()).toEqual([]);
  });

  it('chaque skin premium a un identifiant de produit unique', () => {
    const ids = Object.values(PRODUCT_IDS);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
