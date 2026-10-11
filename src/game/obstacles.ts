import { TUNE } from '../config/tune';
import { clamp } from './math';
import { rollBonus } from './bonus';
import type { BlockObstacle, GapObstacle, Obstacle, ObstacleType, Piece, Run, World } from './types';
import { curSkin, devOn, skinTrait } from './world';

/** Géométrie d'une barre à brèche : s'élargit quand l'écran est scindé. */
export function gapOf(G: Run, o: GapObstacle): { c: number; gw: number } {
  const n = G.pieces.length, gw = Math.min(0.84, o.gw * (1 + 0.2 * (n - 1))), m = gw / 2 + 0.03;
  return { c: clamp(o.base + o.amp * Math.sin(G.t * 1.7 + o.ph), m, 1 - m), gw };
}

/** Géométrie d'un bloc : rétrécit quand l'écran est scindé. */
export function blockOf(G: Run, o: BlockObstacle): { w: number; c: number } {
  const n = G.pieces.length, w = o.w * (1 - 0.12 * (n - 1));
  return { w, c: clamp(o.cx + o.amp * Math.sin(G.t * 1.4 + o.ph), 0.1, 0.9) };
}

export function hitTest(G: Run, o: Obstacle, p: Piece, lw: number, r: number, rf: number): boolean {
  const dy = o.d - G.D;
  if (o.kind === 'gap') {
    const th = o.type === 'blade' ? 13 : 15;
    if (Math.abs(dy) >= th + r * 0.8) return false;
    const g = gapOf(G, o), xr = rf * 0.85;
    return p.x - xr < g.c - g.gw / 2 || p.x + xr > g.c + g.gw / 2;
  }
  const b = blockOf(G, o), dx = (p.x - b.c) * lw;
  if (o.type === 'blade') {
    const R = (b.w * lw) / 2 + r * 0.75;
    return dx * dx + dy * dy < R * R;
  }
  return Math.abs(dy) < 15 + r * 0.8 && Math.abs(dx) < (b.w * lw) / 2 + r * 0.8;
}

/** Deux blocs côte à côte doivent laisser un passage d'au moins 30 % de la largeur. */
export function corridorOk(c1: number, w1: number, c2: number, w2: number): boolean {
  const a = [[c1 - w1 / 2, c1 + w1 / 2], [c2 - w2 / 2, c2 + w2 / 2]].sort((x, y) => x[0]! - y[0]!) as [number, number][];
  const [a0, a1] = a as [[number, number], [number, number]];
  const left = a0[0], mid = Math.max(0, a1[0] - a0[1]), right = 1 - Math.max(a0[1], a1[1]);
  return Math.max(left, mid, right) >= 0.3;
}

/** Génère obstacles, golds, beurre et bonus devant un morceau, et oublie ce qui est passé. */
export function genObs(w: World, p: Piece): void {
  const G = w.G, H = w.view.H, rng = w.rng;
  const SK = curSkin(w);
  while (p.nextD < G.D + H * 1.15) {
    const d = G.D, n = G.pieces.length;
    const bladeChance = d < 1500 ? 0 : Math.min(0.38, 0.12 + d / 60000);
    const tp = (): ObstacleType => (rng() < bladeChance ? 'blade' : 'pin');
    const rk = rng();
    let kind: 'gap' | 'block' | 'duo';
    if (d < 1200) kind = rk < 0.6 ? 'gap' : 'block';
    else if (d < 3000) kind = rk < 0.45 ? 'gap' : 'block';
    else kind = rk < 0.35 ? 'gap' : rk < 0.65 ? 'block' : 'duo';
    const amp = d < 5000 ? 0 : Math.min(0.14, (d - 5000) / 150000);
    if (kind === 'gap') {
      const gw = Math.max(0.42, 0.62 - d / 90000), m = gw / 2 + 0.03;
      p.obs.push({ kind: 'gap', type: tp(), d: p.nextD, gw, base: m + rng() * (1 - 2 * m), amp, ph: rng() * 6.28, hit: false });
    } else if (kind === 'block') {
      p.obs.push({
        kind: 'block', type: tp(), d: p.nextD, w: 0.3 + rng() * 0.2, cx: 0.2 + rng() * 0.6,
        amp: Math.min(amp, 0.1), ph: rng() * 6.28, hit: false,
      });
    } else {
      let w1: number, w2: number, c1: number, c2: number, tries = 0;
      do {
        w1 = 0.18 + rng() * 0.08; w2 = 0.18 + rng() * 0.08; c1 = 0.1 + rng() * 0.8; c2 = 0.1 + rng() * 0.8; tries++;
      } while (tries < 8 && !corridorOk(c1, w1, c2, w2));
      if (!corridorOk(c1, w1, c2, w2)) { c1 = 0.2; c2 = 0.8; w1 = 0.2; w2 = 0.2; }
      const off = (rng() < 0.5 ? -1 : 1) * (30 + rng() * 45);
      p.obs.push({ kind: 'block', type: tp(), d: p.nextD, w: w1, cx: c1, amp: 0, ph: 0, hit: false });
      p.obs.push({ kind: 'block', type: tp(), d: p.nextD + off, w: w2, cx: c2, amp: 0, ph: 0, hit: false });
    }
    const s = Math.max(165, 300 - d / 90) * (0.85 + rng() * 0.35) * (1 + 0.3 * (n - 1));
    // Beurre (fusion) et golds : plus on descend, plus il y a de golds, en grappes de plus en plus longues.
    if (n >= 2 && !skinTrait(SK, 'noMerge') && rng() < TUNE.butterRow) {
      p.pick.push({ k: 'fuse', d: p.nextD + s / 2, x: 0.15 + rng() * 0.7, taken: false });
    } else if (rng() < Math.min(0.85, 0.4 + d / 25000)) {
      let cnt = 1 + Math.min(4, Math.floor(d / 8000)) + (rng() < 0.35 ? 1 : 0);
      cnt = Math.min(5, cnt);
      const gx = 0.15 + rng() * 0.7;
      for (let gi = 0; gi < cnt; gi++) {
        p.pick.push({ k: 'gold', d: p.nextD + s * 0.2 + gi * 30, x: clamp(gx + Math.sin(gi * 1.3) * 0.07, 0.12, 0.88), taken: false });
      }
    }
    if (rng() < 0.035 * (devOn(w) ? 8 : 1)) {
      const bn = rollBonus(rng, devOn(w), SK.premium);
      p.pick.push({ k: 'bonus', b: bn.id, tier: bn.tier, d: p.nextD + s * 0.55, x: 0.15 + rng() * 0.7, taken: false });
    }
    p.nextD += s;
  }
  p.obs = p.obs.filter((o) => o.d >= G.D - H * 0.3 - 160);
  p.pick = p.pick.filter((k) => !k.taken && k.d >= G.D - H * 0.3 - 60);
}
