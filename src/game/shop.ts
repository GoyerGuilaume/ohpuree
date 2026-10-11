import { ITEMS } from '../data/items';
import type { ItemId } from '../data/items';
import { DEFAULT_SKIN, skinById } from '../data/skins';
import type { PremiumSkinId, SkinId } from '../data/skins';
import { tr } from '../i18n';
import { unlock } from './achievements';
import { priceOf } from './economy';
import type { World } from './types';
import { devOn, isOwned } from './world';

const SHOP_BEEP = [700, 0.1, 'triangle', 0.06, 300] as const;

/** Achète un objet (en mode dev : +5 consommables ou passif offert). Renvoie true si l'achat a eu lieu. */
export function buyItem(w: World, id: ItemId): boolean {
  const it = ITEMS.find((i) => i.id === id)!;
  const p = w.profile;
  if (it.kind === 'pass' && p.inv[id]) return false;
  if (devOn(w)) {
    p.inv[id] = it.kind === 'cons' ? (p.inv[id] || 0) + 5 : 1;
  } else {
    const pr = priceOf(it.price, p.inv);
    if (p.wallet < pr) return false;
    p.wallet -= pr;
    p.inv[id] = (p.inv[id] || 0) + 1;
  }
  w.fx.save();
  w.fx.beep(...SHOP_BEEP);
  return true;
}

/** Achète un skin standard en golds et l'équipe. */
export function buySkin(w: World, id: SkinId): boolean {
  const sk = skinById(id), p = w.profile;
  if (sk.premium || isOwned(w, sk)) return false;
  const pr = priceOf(sk.price, p.inv);
  if (p.wallet < pr) return false;
  p.wallet -= pr;
  p.owned[sk.id] = true;
  p.skinId = sk.id;
  w.fx.save();
  if (Object.keys(p.owned).length >= 3) unlock(w, 'garderobe');
  w.fx.beep(...SHOP_BEEP);
  return true;
}

export function equipSkin(w: World, id: SkinId): void {
  if (!isOwned(w, skinById(id))) return;
  w.profile.skinId = id;
  w.fx.save();
}

/** Skin premium non possédé : essai pour la session (non sauvegardé), achat réel non branché. */
export function trySkin(w: World, id: SkinId): void {
  w.profile.skinId = id;
  w.fx.toast(tr('toast_demo'));
}

export function toggleDev(w: World): void {
  const p = w.profile;
  p.settings.dev = devOn(w) ? 'off' : 'on';
  if (!devOn(w) && !isOwned(w, skinById(p.skinId))) p.skinId = DEFAULT_SKIN.id;
  w.fx.save();
  w.fx.toast(tr(devOn(w) ? 'toast_dev_on' : 'toast_dev_off'));
}

export function devAddGold(w: World): void {
  w.profile.wallet += 1000;
  w.fx.save();
  w.fx.beep(880, 0.1, 'triangle', 0.06, 300);
}

export function resetAchievements(w: World): void {
  w.profile.ach = {};
  w.profile.stats.runs = 0;
  w.fx.save();
  w.fx.toast(tr('toast_ach_reset'));
}

/** Résultat d'un achat de skin premium via le store. */
export type PurchaseOutcome = 'purchased' | 'cancelled' | 'demo' | 'error';

/** Applique le résultat d'un achat de skin premium. */
export function applyPurchase(w: World, id: PremiumSkinId, outcome: PurchaseOutcome): void {
  if (outcome === 'demo') trySkin(w, id);
  else if (outcome === 'purchased') grantSkin(w, id);
  else if (outcome === 'error') w.fx.toast(tr('toast_buy_error'));
}

/** Skin premium acheté : possédé pour de bon, équipé et sauvegardé. */
export function grantSkin(w: World, id: PremiumSkinId): void {
  const p = w.profile;
  p.owned[id] = true;
  p.skinId = id;
  w.fx.save();
  if (Object.keys(p.owned).length >= 3) unlock(w, 'garderobe');
}

/** Achats restaurés par le store : on marque les skins comme possédés. */
export function restoreSkins(w: World, ids: readonly PremiumSkinId[]): void {
  const p = w.profile;
  const missing = ids.filter((id) => !p.owned[id]);
  if (!missing.length) return;
  for (const id of missing) p.owned[id] = true;
  w.fx.save();
}
