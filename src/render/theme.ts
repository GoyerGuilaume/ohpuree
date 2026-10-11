/** Couleurs du thème lues dans les variables CSS (clair / sombre). */
export interface Theme {
  pin: string;
  metal: string;
  metalDark: string;
}

/** Couleurs du skin effectif. */
export interface SkinPaint {
  potato: string;
  potatoEdge: string;
  flesh: string;
  fry: string;
}

export function readTheme(): Theme {
  const s = getComputedStyle(document.documentElement);
  const g = (n: string): string => s.getPropertyValue(n).trim();
  return { pin: g('--pin'), metal: g('--metal'), metalDark: g('--metal-dark') };
}

export const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif';
export const SANS = 'system-ui,-apple-system,"Segoe UI",sans-serif';
