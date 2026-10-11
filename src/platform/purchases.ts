import { SKINS } from '../data/skins';
import type { PremiumSkin, PremiumSkinId } from '../data/skins';
import type { PurchaseOutcome } from '../game/shop';

/**
 * Identifiants des produits dans les stores. Ils seront créés dans Google Play Console et
 * App Store Connect : un identifiant ne peut plus être réutilisé une fois créé → à confirmer.
 */
export const PRODUCT_IDS: Readonly<Record<PremiumSkinId, string>> = {
  cape: 'skin_cape',
  stone: 'skin_stone',
  magnet: 'skin_magnet',
};

export interface StoreProduct {
  skin: PremiumSkinId;
  /** Prix localisé, prêt à afficher. */
  price: string;
}

/** Achats intégrés (skins premium). */
export interface Purchases {
  /** true tant que l'achat réel n'est pas branché : le bouton propose un essai. */
  readonly demo: boolean;
  products(): Promise<StoreProduct[]>;
  purchase(skin: PremiumSkinId): Promise<PurchaseOutcome>;
  /** Skins déjà achetés (réinstallation, autre appareil). */
  restore(): Promise<PremiumSkinId[]>;
}

const premium = SKINS.filter((s): s is PremiumSkin => s.premium);

/** Implémentation factice : comportement du prototype (essai pour la session, aucun paiement). */
export const demoPurchases: Purchases = {
  demo: true,
  products: () => Promise.resolve(premium.map((s) => ({ skin: s.id, price: s.priceEur }))),
  purchase: () => Promise.resolve('demo'),
  restore: () => Promise.resolve([]),
};

export const purchases: Purchases = demoPurchases;
