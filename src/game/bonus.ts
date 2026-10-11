import { BONUSES, BONUS_BY, DEV_TIER_P, TIERS, bonusNameKey } from '../data/bonuses';
import type { Bonus, BonusId } from '../data/bonuses';
import { SKINS, skinNameKey } from '../data/skins';
import type { PremiumSkin } from '../data/skins';
import { tr } from '../i18n';
import { unlock } from './achievements';
import { goldMul, timerMul } from './economy';
import { burst, lanePos } from './fxhelpers';
import type { Rng } from './rng';
import { pulse } from './slowmo';
import { TUNE } from '../config/tune';
import type { Piece, Pickup, World } from './types';
import { curSkin, skinTrait } from './world';

/**
 * Tire un bonus : d'abord le palier, puis un bonus du palier.
 * Palier légendaire : « Skin légendaire » sans skin premium, « Pluie d'or » avec un skin premium.
 */
export function rollBonus(rng: Rng, dev: boolean, premium: boolean): Bonus {
  const P: readonly number[] = dev ? DEV_TIER_P : TIERS.map((t) => t.p);
  const r = rng();
  let acc = 0, t = TIERS.length - 1;
  for (let i = 0; i < P.length; i++) {
    acc += P[i]!;
    if (r < acc) { t = i; break; }
  }
  const pool = BONUSES.filter((b) => b.tier === t && !(b.id === 'loan' && premium) && !('fallback' in b && b.fallback && !premium));
  return pool[Math.floor(rng() * pool.length)]!;
}

export function applyBonus(w: World, pk: Extract<Pickup, { k: 'bonus' }>, p: Piece): void {
  const G = w.G, H = w.view.H;
  let b = BONUS_BY[pk.b];
  const SK = curSkin(w), n = G.pieces.length, pos = lanePos(w, G.pieces.indexOf(p), n, p), k = timerMul(w.profile.inv);
  if (b.id === 'loan' && SK.premium) b = BONUS_BY.rain;
  const id = b.id as BonusId;
  const col = TIERS[pk.tier].color, nm = `${b.icon} ${tr(bonusNameKey(id))}`;
  let msg = `${nm} !`;
  burst(w, pos.x, H * 0.3, pk.tier === 3 ? 40 : 14, [col, '#ffffff']);
  w.fx.beep(620 + pk.tier * 130, 0.18, 'triangle', 0.07, 300 + pk.tier * 100);
  w.fx.vibrate(pk.tier >= 2 ? 40 : 15);
  G.bonuses++;
  switch (id) {
    case 'ketchup': G.ketchup++; msg = `${nm} ×${G.ketchup}`; break;
    case 'mayo': G.mayo++; msg = `${nm} ×${G.mayo}`; break;
    case 'purse': G.gold += 8; msg = `${b.icon} ${tr('b_purse')}`; break;
    case 'butter':
      if (skinTrait(SK, 'noMerge')) { G.gold += 10; msg = tr('b_butter_stone'); }
      else if (n < 2) { G.gold += 6; msg = tr('b_butter_whole'); }
      else {
        G.pieces = [p]; p.inv = Math.max(p.inv, 1); pulse(G, TUNE.mergePulse, TUNE.mergeDur); afterMerge(w);
        msg = tr('b_butter_ok');
      }
      break;
    case 'oven':
      G.pieces.forEach((q) => { q.oven = Math.min(25, Math.max(0, q.oven) + 8 * k); });
      msg = `${nm} ${tr('b_oven_note', Math.round(8 * k))}`; break;
    case 'feather':
      G.glide = Math.min(9, Math.max(0, G.glide) + 3 * k); msg = `${nm} ${tr('b_feather_note')}`; break;
    case 'pepper':
      G.pepperT = Math.min(60, Math.max(0, G.pepperT) + 20 * k); msg = `${nm} (×2 · ${Math.round(20 * k)} s)`; break;
    case 'mustard':
      G.mustard = true; msg = `${nm} ${tr('b_mustard_note')}`; break;
    case 'magnet':
      G.magnetT = Math.min(45, Math.max(0, G.magnetT) + 15 * k); msg = `${nm} (${Math.round(15 * k)} s)`; break;
    case 'star':
      G.pieces.forEach((q) => { q.inv = Math.min(18, Math.max(0, q.inv) + 6 * k); });
      msg = `${nm} ${tr('b_star_note', Math.round(6 * k))}`; break;
    case 'rain': {
      const amt = 50 * goldMul(G); G.gold += amt; msg = `${nm} ${tr('b_gold', amt)}`; break;
    }
    case 'loan': {
      const cands = SKINS.filter((s): s is PremiumSkin => s.premium && s.id !== SK.id);
      const sk = cands[Math.floor(w.rng() * cands.length)]!;
      G.skinOverride = sk.id; G.glide = 0; G.glideCd = 0; G.shake = 0.15;
      const name = tr(skinNameKey(sk.id));
      G.banner = { text: `🌈 ${name}`, t: 0 };
      msg = `🌈 ${name}${tr('b_loan')}${'cape' in sk && sk.cape ? ` ${tr('b_loan_cape')}` : ''}`;
      break;
    }
  }
  if (G.gold >= 40) unlock(w, 'picsou');
  w.fx.toast(msg);
  unlock(w, 'cadeau');
  if (pk.tier === 3) unlock(w, 'jackpot');
}

/** Après une fusion : succès « Résurrection » si on revient entier après avoir été en 4. */
export function afterMerge(w: World): void {
  if (w.G.pieces.length === 1 && w.G.reached4) unlock(w, 'resurrection');
}
