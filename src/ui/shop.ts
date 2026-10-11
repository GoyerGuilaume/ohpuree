import { ITEMS, itemDescKey, itemNameKey } from '../data/items';
import { SKINS, skinDescKey, skinNameKey } from '../data/skins';
import type { PremiumSkinId } from '../data/skins';
import { tr } from '../i18n';
import { priceOf } from '../game/economy';
import { buyItem, buySkin, equipSkin } from '../game/shop';
import type { World } from '../game/types';
import { devOn, isOwned } from '../game/world';
import { drawSkinPreview } from '../render/potato';
import { $ } from './dom';

export type ShopTab = 'items' | 'skins';

/** Ce que la boutique doit savoir des achats intégrés. */
export interface ShopDeps {
  /** Achat réel non branché : le bouton propose un essai, comme dans le prototype. */
  demo: boolean;
  /** Prix localisé du store, s'il est connu. */
  price(skin: PremiumSkinId): string | undefined;
  buyPremium(skin: PremiumSkinId): Promise<void>;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function row(title: string, sub: string, btn: HTMLButtonElement, lead?: HTMLElement): HTMLDivElement {
  const r = el('div', 'item');
  if (lead) r.appendChild(lead);
  const t = el('div', 't');
  t.appendChild(el('b', undefined, title));
  t.appendChild(el('small', undefined, sub));
  r.appendChild(t);
  r.appendChild(btn);
  return r;
}

export function renderShop(w: World, tab: ShopTab, deps: ShopDeps): void {
  const p = w.profile;
  $('walletLine').textContent = tr('wallet', p.wallet) + (devOn(w) ? tr('dev_suffix') : '');
  $('devGold').classList.toggle('hidden', !devOn(w));
  document.querySelectorAll<HTMLButtonElement>('#shopTabs button').forEach((b) => {
    b.classList.toggle('on', b.getAttribute('data-t') === tab);
  });
  const list = $('shopList');
  list.innerHTML = '';
  const rerender = (): void => renderShop(w, tab, deps);

  if (tab === 'skins') {
    let premiumLabel = false;
    for (const sk of SKINS) {
      if (sk.premium && !premiumLabel) {
        premiumLabel = true;
        const lab = el('p', 'best', tr('premium_label'));
        lab.style.margin = '6px 0 0';
        list.appendChild(lab);
      }
      const owned = isOwned(w, sk), equipped = p.skinId === sk.id;
      const pv = el('canvas');
      pv.width = 88; pv.height = 88; pv.style.cssText = 'width:44px;height:44px;flex:none';
      drawSkinPreview(pv, sk);
      const btn = el('button', 'ghost');
      if (equipped) { btn.textContent = tr('equipped'); btn.disabled = true; }
      else if (owned) {
        btn.textContent = tr('equip');
        btn.addEventListener('click', () => { equipSkin(w, sk.id); rerender(); });
      } else if (sk.premium) {
        btn.textContent = tr(deps.demo ? 'try_price' : 'buy_price', deps.price(sk.id) ?? sk.priceEur);
        btn.addEventListener('click', () => {
          btn.disabled = true;
          void deps.buyPremium(sk.id);
        });
      } else {
        const pr = priceOf(sk.price, p.inv);
        btn.textContent = `${pr} 🪙`;
        btn.disabled = p.wallet < pr;
        btn.addEventListener('click', () => { if (buySkin(w, sk.id)) rerender(); });
      }
      const sub = sk.premium ? tr(skinDescKey(sk.id)) : tr('skin_cosmetic');
      list.appendChild(row(tr(skinNameKey(sk.id)) + (sk.premium ? ' ⭐' : ''), sub, btn, pv));
    }
    return;
  }

  for (const it of ITEMS) {
    const owned = p.inv[it.id] || 0;
    const btn = el('button', 'ghost');
    if (it.kind === 'pass' && owned) { btn.textContent = tr('owned'); btn.disabled = true; }
    else if (devOn(w)) {
      btn.textContent = tr(it.kind === 'cons' ? 'plus5' : 'get_dev');
      btn.addEventListener('click', () => { if (buyItem(w, it.id)) rerender(); });
    } else {
      const pr = priceOf(it.price, p.inv);
      btn.textContent = `${pr} 🪙`;
      btn.disabled = p.wallet < pr;
      btn.addEventListener('click', () => { if (buyItem(w, it.id)) rerender(); });
    }
    const title = `${it.icon} ${tr(itemNameKey(it.id))}${it.kind === 'cons' && owned ? `  ×${owned}` : ''}`;
    list.appendChild(row(title, tr(it.kind === 'cons' ? 'kind_cons' : 'kind_pass') + tr(itemDescKey(it.id)), btn));
  }
}
