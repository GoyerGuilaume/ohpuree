import { BIOME_LEN, MAXP, TUNE } from '../config/tune';
import { BIOMES, biomeNameKey } from '../data/biomes';
import { tr } from '../i18n';
import { unlock } from './achievements';
import { applyBonus } from './bonus';
import { goldMul } from './economy';
import { burst, dims, lanePos, stepParts } from './fxhelpers';
import { clamp } from './math';
import { genObs, hitTest } from './obstacles';
import { crush, mergeInto, split } from './pieces';
import { stepSlow } from './slowmo';
import type { World } from './types';
import { curSkin, skinTrait } from './world';

/** Une frame de jeu (le update du prototype), dans le même ordre d'opérations. */
export function update(w: World, dt: number): void {
  const G = w.G, H = w.view.H, fx = w.fx, inv = w.profile.inv;
  const SK = curSkin(w);
  G.t += dt;
  const target = w.input * 1.55;
  G.vx += (target - G.vx) * Math.min(1, 9 * dt);
  const ease = Math.min(1, 0.4 + G.t / 1.2);
  const malus = w.profile.settings.mode === 'survive' ? 1 + 0.22 * G.lost : 1;
  const nt = TUNE.pieceSpeed[Math.min(G.pieces.length, 4) - 1]!;
  G.nm += (nt - G.nm) * Math.min(1, 3 * dt);
  const nmul = G.nm;
  const pm = stepSlow(G, dt);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 4);
  if (G.glide > 0) G.glide -= dt;
  if (G.glideCd > 0) G.glideCd -= dt;
  if (G.magnetT > 0) G.magnetT -= dt;
  if (G.pepperT > 0) G.pepperT -= dt;
  const gmul = G.glide > 0 ? 0.45 : 1;
  const smul = (skinTrait(SK, 'speedMul') || 1) * (G.hot ? 1.2 : 1);
  G.D += (210 + Math.min(320, G.D * 0.018)) * malus * nmul * pm * ease * gmul * smul * dt;
  G.score = Math.floor(G.D / 60);
  if (G.score >= 100) unlock(w, 'd100');
  if (G.score >= 300) unlock(w, 'd300');
  if (G.score >= 100 && G.gold === 0) unlock(w, 'ascete');
  const bi = Math.min(Math.floor(G.D / BIOME_LEN), BIOMES.length - 1);
  if (bi !== G.bi) {
    G.bi = bi;
    const biome = BIOMES[bi]!;
    G.banner = { text: tr(biomeNameKey(biome.id)), t: 0 };
    if ('ach' in biome) unlock(w, biome.ach);
  }
  if (G.pieces.length >= 4) { G.t4 += dt; if (G.t4 >= 10) unlock(w, 'quatrequarts'); }
  else G.t4 = 0;
  if (G.banner) { G.banner.t += dt; if (G.banner.t > 2.6) G.banner = null; }

  const list = G.pieces.slice();
  for (const p of list) {
    if (w.G.pieces.indexOf(p) < 0) continue;
    let dm = dims(w);
    p.x = clamp(p.x + G.vx * dt, dm.rf, 1 - dm.rf);
    if (p.inv > 0) p.inv -= dt;
    if (p.oven > 0) p.oven -= dt;
    genObs(w, p);
    p.scared = false;

    const mag = !!(skinTrait(SK, 'magnet') || G.magnetT > 0);
    const reach = dm.r + (inv.ladle > 0 ? 40 : 14) + (mag ? 20 : 0);
    for (const pk of p.pick) {
      if (pk.taken) continue;
      if (mag && pk.k === 'gold' && Math.abs(pk.d - G.D) < 190) pk.x += (p.x - pk.x) * Math.min(1, 3.5 * dt);
      if (Math.abs(pk.d - G.D) < reach && Math.abs(p.x - pk.x) * dm.lw < reach) {
        pk.taken = true;
        if (pk.k === 'gold') {
          G.gold += goldMul(G);
          if (G.gold >= 40) unlock(w, 'picsou');
          fx.beep(880 + Math.min(G.gold, 12) * 18, 0.08, 'triangle', 0.05, 220);
          burst(w, dm.lw * G.pieces.indexOf(p) + pk.x * dm.lw, H * 0.3, 6, ['#ffd23f', '#fff3b0']);
        } else if (pk.k === 'bonus') { applyBonus(w, pk, p); break; }
        else { mergeInto(w, p); break; }
      }
    }
    dm = dims(w);
    if (G.pieces.indexOf(p) < 0) continue;

    for (const o of p.obs) {
      if (o.hit) continue;
      const dy = o.d - G.D;
      if (dy > 0 && dy < 170) p.scared = true;
      if (!hitTest(G, o, p, dm.lw, dm.r, dm.rf)) continue;
      if (p.inv > 0) continue;
      if (o.type === 'pin' && p.oven > 0) { unlock(w, 'oven'); continue; }
      o.hit = true;
      const ip = G.pieces.indexOf(p), pos = lanePos(w, ip, dm.n, p);
      if (o.type === 'blade') {
        const spark = skinTrait(SK, 'spark');
        if (spark && w.rng() < spark) {
          unlock(w, 'spark');
          burst(w, pos.x, H * 0.3, 24, ['#ffd23f', '#ff9a1f', '#ffffff']);
          G.shake = 0.1;
          fx.beep(1400, 0.09, 'square', 0.05, -500);
          fx.vibrate(15);
        } else if (G.ketchup > 0) {
          G.ketchup--;
          burst(w, pos.x, H * 0.3, 16, ['#d1432f', '#ff8a73']);
          fx.toast(tr('toast_ketchup'));
          fx.beep(300, 0.15, 'triangle', 0.06, 200);
          unlock(w, 'ketchup');
        } else if (G.pieces.length < MAXP) split(w, p);
        else crush(w, p);
      } else if (G.mayo > 0) {
        G.mayo--;
        burst(w, pos.x, H * 0.3, 16, ['#fff3c4', '#ffffff']);
        fx.toast(tr('toast_mayo'));
        fx.beep(300, 0.15, 'triangle', 0.06, 200);
        unlock(w, 'mayo');
      } else crush(w, p);
      if (w.phase !== 'play') return;
      break;
    }
  }
  stepParts(w, dt);
}
