// Test différentiel : le prototype legacy et le portage TypeScript reçoivent la même suite
// aléatoire, les mêmes pas de temps et les mêmes entrées ; leur état doit rester identique
// à chaque frame (au bit près), ainsi que les sons, vibrations, toasts et la sauvegarde.
import { describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import { bootLegacy } from '../testing/legacyRuntime';
import type { FxLog } from '../testing/legacyRuntime';
import { backToMenu, frameDt, pause, resume, startGame, tick, tryGlide } from './flow';
import { blockOf, gapOf } from './obstacles';
import { parseProfile, serializeProfile } from './profile';
import { seededRng } from './rng';
import type { Fx, World } from './types';
import { createWorld } from './world';

const W = 400, H = 800;

/** JSON à clés triées : l'ordre des propriétés diffère entre legacy et portage. */
const canon = (v: unknown): string =>
  JSON.stringify(v, (_k, val: unknown) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(Object.keys(val).sort().map((k) => [k, (val as Record<string, unknown>)[k]]))
      : val,
  );

/** Pilote simple : vise la brèche ou le côté libre du prochain obstacle du premier morceau. */
function autopilot(w: World): number {
  const G = w.G, p = G.pieces[0];
  if (!p) return 0;
  let target = 0.5, best = Infinity;
  for (const o of p.obs) {
    const dy = o.d - G.D;
    if (o.hit || dy < -10 || dy >= best) continue;
    best = dy;
    if (o.kind === 'gap') target = gapOf(G, o).c;
    else target = blockOf(G, o).c > 0.5 ? 0.2 : 0.8;
  }
  const e = target - p.x;
  return Math.abs(e) < 0.03 ? 0 : e < 0 ? -1 : 1;
}

interface Scenario {
  name: string;
  seed: number;
  frames: number;
  devTools?: boolean;
  save?: Record<string, unknown>;
  /** Proportion de frames où l'entrée est aléatoire plutôt que pilotée. */
  noise?: number;
}

interface Coverage {
  runs: number;
  maxPieces: number;
  maxBiome: number;
  bonuses: number;
  glides: number;
  pauses: number;
  ach: Set<string>;
}

function runScenario(sc: Scenario): Coverage {
  setLang('fr');
  const legacy = bootLegacy({ rng: seededRng(sc.seed), save: sc.save, W, H });
  const log: FxLog = [];
  const fx: Fx = {
    beep: (...a) => { log.push(['beep', ...a]); },
    vibrate: (ms) => { log.push(['vib', ms]); },
    toast: (m) => { log.push(['toast', m]); },
    save: () => {},
    phaseChanged: () => {},
    gameOver: () => {},
  };
  const devTools = sc.devTools ?? false;
  const w = createWorld({
    profile: parseProfile(sc.save ? JSON.stringify(sc.save) : null, 'fr', devTools),
    view: { W, H }, rng: seededRng(sc.seed), fx, devTools,
  });
  const act = seededRng(sc.seed + 7919);
  const cov: Coverage = { runs: 0, maxPieces: 1, maxBiome: 0, bonuses: 0, glides: 0, pauses: 0, ach: new Set() };
  let ts = 0, last = 0, logPos = 0, overFor = 0, pausedFor = 0, dir = 0;

  const setDir = (d: number): void => {
    if (d === dir) return;
    dir = d;
    if (d === 0) legacy.key('keyup', 'ArrowLeft');
    else legacy.key('keydown', d < 0 ? 'ArrowLeft' : 'ArrowRight');
    w.input = d;
  };
  const check = (frame: number): void => {
    const L0 = legacy.dbg() as { G: { D: number; t: number; gold: number; pieces: unknown[]; parts: unknown[] }; state: string; wallet: number };
    // Empreinte à chaque frame, état complet toutes les 10 frames (ou dès que l'empreinte diffère).
    const quick = (g: { D: number; t: number; gold: number; pieces: unknown[]; parts: unknown[] }, ph: string, wal: number): string =>
      `${g.D}|${g.t}|${g.gold}|${g.pieces.length}|${g.parts.length}|${ph}|${wal}`;
    if (
      frame % 10 !== 0 &&
      quick(w.G, w.phase, w.profile.wallet) === quick(L0.G, L0.state, L0.wallet) &&
      log.length === legacy.log.length
    ) {
      if (log.length > logPos && canon(log.slice(logPos)) !== canon(legacy.log.slice(logPos))) {
        expect(log.slice(logPos), `${sc.name} : effets différents à la frame ${frame}`).toEqual(legacy.log.slice(logPos));
      }
      logPos = log.length;
      return;
    }
    const L = legacy.dbg() as { G: Record<string, unknown> & { achRun: { id: string }[] } } & Record<string, unknown>;
    const ours = canon({
      phase: w.phase, G: w.G, wallet: w.profile.wallet, best: w.profile.best, inv: w.profile.inv,
      ach: w.profile.ach, runs: w.profile.stats.runs, skinId: w.profile.skinId,
    });
    const theirs = canon({
      phase: L.state, G: { ...L.G, achRun: L.G.achRun.map((a) => a.id) }, wallet: L.wallet, best: L.best, inv: L.inv,
      ach: L.ach, runs: (L.stats as { runs: number }).runs, skinId: L.skinId,
    });
    if (ours !== theirs) expect(JSON.parse(ours), `${sc.name} : divergence à la frame ${frame}`).toEqual(JSON.parse(theirs));
    if (log.length !== legacy.log.length || canon(log.slice(logPos)) !== canon(legacy.log.slice(logPos))) {
      expect(log.slice(logPos), `${sc.name} : effets différents à la frame ${frame}`).toEqual(legacy.log.slice(logPos));
    }
    logPos = log.length;
  };
  const step = (frame: number): void => {
    ts += 1000 / 60;
    legacy.frame(ts);
    tick(w, frameDt(ts, last));
    last = ts;
    check(frame);
  };

  // Quelques frames de menu, puis on lance la partie.
  for (let f = 0; f < 30; f++) step(f);
  legacy.click('play');
  w.activeControl = 'tap';
  startGame(w);
  cov.runs++;
  check(30);

  for (let f = 31; f < sc.frames; f++) {
    const r1 = act(), r2 = act(), r3 = act(), r4 = act();
    if (w.phase === 'play') {
      setDir(r1 < (sc.noise ?? 0.1) ? Math.floor(r4 * 3) - 1 : autopilot(w));
      if (r2 < 0.01) { legacy.key('keydown', 'ArrowUp'); tryGlide(w); }
      if (r3 < 0.002) {
        legacy.key('keydown', 'p'); pause(w); dir = 0; pausedFor = 30; cov.pauses++;
      }
    } else if (w.phase === 'paused' && --pausedFor <= 0) {
      legacy.key('keydown', 'p'); resume(w);
    } else if (w.phase === 'over' && ++overFor > 45) {
      overFor = 0;
      if (r1 < 0.15) {
        // Détour par le menu de temps en temps.
        legacy.click('toMenu'); backToMenu(w);
        legacy.click('play'); startGame(w);
      } else {
        legacy.click('again'); startGame(w);
      }
      cov.runs++;
    }
    check(f);
    step(f);
    cov.maxPieces = Math.max(cov.maxPieces, w.G.pieces.length);
    cov.maxBiome = Math.max(cov.maxBiome, w.G.bi);
    cov.bonuses = Math.max(cov.bonuses, w.G.bonuses);
    cov.glides = Math.max(cov.glides, w.G.glides);
  }
  for (const id of Object.keys(w.profile.ach)) cov.ach.add(id);
  // La sauvegarde écrite par le legacy doit correspondre à notre profil.
  expect(JSON.parse(serializeProfile(w.profile))).toEqual(JSON.parse(legacy.storage.pdp_v1 ?? '{}'));
  return cov;
}

const ALL_ITEMS = { ketchup: 3, mayo: 3, mustard: 2, hot: 1, pepper: 2, ladle: 1, timer: 1, peeler: 1, oven: 1 };
const owned = (...ids: string[]): Record<string, boolean> => Object.fromEntries(['classic', ...ids].map((i) => [i, true]));

const SCENARIOS: Scenario[] = [
  { name: 'classique, sans objet', seed: 1, frames: 9000, save: { control: 'tap' } },
  { name: 'classique, autre seed', seed: 2, frames: 9000, save: { control: 'tap' }, noise: 0.3 },
  { name: 'survie + tous les objets', seed: 3, frames: 12000, save: { control: 'tap', mode: 'survive', inv: ALL_ITEMS, wallet: 50 } },
  { name: 'survie, caillou-patate', seed: 4, frames: 9000, save: { control: 'tap', mode: 'survive', skin: 'stone', owned: owned('stone') } },
  { name: 'cape (planer)', seed: 5, frames: 9000, save: { control: 'tap', mode: 'survive', skin: 'cape', owned: owned('cape') } },
  { name: 'dev : bonus fréquents, skin classique', seed: 6, frames: 12000, devTools: true, save: { control: 'tap', mode: 'survive', dev: 'on' } },
  { name: 'dev : bonus fréquents, skin aimant', seed: 7, frames: 12000, devTools: true, save: { control: 'tap', mode: 'survive', dev: 'on', skin: 'magnet', owned: owned('magnet'), inv: ALL_ITEMS } },
  { name: 'dev : survie, caillou + objets', seed: 8, frames: 12000, devTools: true, save: { control: 'tap', mode: 'survive', dev: 'on', skin: 'stone', inv: ALL_ITEMS } },
];

describe('parité frame par frame avec le prototype legacy', () => {
  const total: Coverage = { runs: 0, maxPieces: 0, maxBiome: 0, bonuses: 0, glides: 0, pauses: 0, ach: new Set() };

  it.each(SCENARIOS)('$name', { timeout: 30000 }, (sc) => {
    const c = runScenario(sc);
    total.runs += c.runs;
    total.maxPieces = Math.max(total.maxPieces, c.maxPieces);
    total.maxBiome = Math.max(total.maxBiome, c.maxBiome);
    total.bonuses += c.bonuses;
    total.glides += c.glides;
    total.pauses += c.pauses;
    c.ach.forEach((a) => total.ach.add(a));
  });

  it('les scénarios couvrent bien le gameplay', () => {
    console.log('Couverture des scénarios :', { ...total, ach: [...total.ach].sort().join(' ') });
    expect(total.maxPieces).toBe(4);
    expect(total.maxBiome).toBeGreaterThanOrEqual(3);
    expect(total.bonuses).toBeGreaterThan(5);
    expect(total.glides).toBeGreaterThan(0);
    expect(total.pauses).toBeGreaterThan(0);
    for (const a of ['jackpot', 'spark', 'oven', 'ketchup', 'mayo', 'portion', 'resurrection', 'poubelle']) {
      expect(total.ach, `chemin non couvert : ${a}`).toContain(a);
    }
  });
});
