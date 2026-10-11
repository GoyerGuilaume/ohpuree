// Utilitaire de test : exécute le script du prototype legacy dans Node, avec un faux DOM minimal,
// pour comparer frame par frame son état avec celui du portage TypeScript.
import { legacyHtml } from './legacy';
import type { Rng } from '../game/rng';

type Fn = (...args: unknown[]) => unknown;
export type FxLog = unknown[][];

export interface LegacyGame {
  /** Exécute une frame (requestAnimationFrame) au temps ts (ms). */
  frame(ts: number): void;
  click(id: string): void;
  key(type: 'keydown' | 'keyup', key: string): void;
  /** État interne du prototype (G, state, wallet…). */
  dbg(): Record<string, unknown>;
  log: FxLog;
  storage: Record<string, string>;
}

/** Points d'observation injectés dans le script legacy (chaque motif doit exister tel quel). */
const PATCHES: [string, string][] = [
  ['function beep(f,d,type,vol,slide){', "function beep(f,d,type,vol,slide){ __log(['beep',f,d,type,vol,slide]);"],
  ['function vib(ms){', "function vib(ms){ __log(['vib',ms]);"],
  ['function toast(m){', "function toast(m){ __log(['toast',m]);"],
  // Le tremblement d'écran tire au hasard pendant le dessin : on le neutralise pour ne pas
  // décaler la suite aléatoire de la logique (le portage le tire avec un autre générateur).
  ['if(G.shake>0){ sx=(Math.random()-.5)*G.shake*30; sy=(Math.random()-.5)*G.shake*30; }', ''],
  [
    'resize(); newGame(); applyI18n();',
    '__expose(function(){return {G:G,state:state,wallet:wallet,best:best,inv:inv,ach:ach,stats:stats,skinId:skinId,ownedSkins:ownedSkins}}); resize(); newGame(); applyI18n();',
  ],
];

function legacyScript(): string {
  const start = legacyHtml.indexOf('<script>') + '<script>'.length;
  let src = legacyHtml.slice(start, legacyHtml.indexOf('</script>', start));
  for (const [from, to] of PATCHES) {
    if (!src.includes(from)) throw new Error(`Motif introuvable dans le legacy : ${from}`);
    src = src.replace(from, to);
  }
  return src;
}

export function bootLegacy(o: { rng: Rng; save?: unknown; W: number; H: number; lang?: string }): LegacyGame {
  const noop = (): void => {};
  const ctx: Record<string | symbol, unknown> = new Proxy({}, {
    get: (t: Record<string | symbol, unknown>, k) => (k in t ? t[k] : noop),
    set: (t: Record<string | symbol, unknown>, k, v) => { t[k] = v; return true; },
  });
  const listeners = new Map<string, Map<string, Fn[]>>();
  const on = (owner: string, type: string, f: Fn): void => {
    const m = listeners.get(owner) ?? new Map<string, Fn[]>();
    listeners.set(owner, m);
    m.set(type, [...(m.get(type) ?? []), f]);
  };
  const fire = (owner: string, type: string, ev: unknown): void => {
    for (const f of listeners.get(owner)?.get(type) ?? []) f(ev);
  };
  const els = new Map<string, unknown>();
  const el = (id: string): unknown => {
    if (!els.has(id)) {
      els.set(id, {
        textContent: '', innerHTML: '', style: {},
        classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
        addEventListener: (t: string, f: Fn) => on(id, t, f),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: o.W, height: o.H }),
        getContext: () => ctx,
        blur: noop,
        click: () => fire(id, 'click', {}),
        getAttribute: () => null,
        setAttribute: noop,
        appendChild: noop,
      });
    }
    return els.get(id);
  };
  const storage: Record<string, string> = {};
  if (o.save !== undefined) storage.pdp_v1 = JSON.stringify(o.save);
  const log: FxLog = [];
  let raf: Fn | null = null;
  let dbg: () => Record<string, unknown> = () => ({});

  const env = {
    window: { addEventListener: (t: string, f: Fn) => on('window', t, f), devicePixelRatio: 1 },
    document: {
      getElementById: el,
      querySelectorAll: () => [],
      documentElement: { lang: '' },
      title: '',
      hidden: false,
      addEventListener: (t: string, f: Fn) => on('document', t, f),
      createElement: () => el(`_${els.size}`),
    },
    navigator: { language: o.lang ?? 'fr' },
    localStorage: { getItem: (k: string) => storage[k] ?? null, setItem: (k: string, v: string) => { storage[k] = v; } },
    getComputedStyle: () => ({ getPropertyValue: (n: string) => (n === '--metal' ? '#c9d2da' : '') }),
    requestAnimationFrame: (f: Fn) => { raf = f; },
    performance: { now: () => 0 },
    setTimeout: () => 0,
    clearTimeout: noop,
    Math: Object.assign(Object.create(Math) as Math, { random: o.rng }),
    DeviceOrientationEvent: undefined,
    __log: (e: unknown[]) => { log.push(e); },
    __expose: (f: () => Record<string, unknown>) => { dbg = f; },
  };
  const names = Object.keys(env);
  // Script de notre propre prototype, exécuté uniquement en test.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const run = new Function(...names, legacyScript()) as (...a: unknown[]) => void;
  run(...names.map((n) => env[n as keyof typeof env]));
  const frame = (ts: number): void => {
    const f = raf;
    if (!f) throw new Error('requestAnimationFrame non appelé');
    f(ts);
  };
  frame(0); // premier rAF : resize puis branchement de la boucle
  return {
    frame,
    click: (id) => fire(id, 'click', {}),
    key: (type, key) => fire('window', type, { key, preventDefault: noop }),
    dbg: () => dbg(),
    log,
    storage,
  };
}
