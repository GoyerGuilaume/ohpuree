import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * iOS ne permet pas de choisir la durée d'une vibration : on traduit la durée demandée
 * par le jeu (15 à 60 ms) en intensité de retour haptique.
 */
export function impactFor(ms: number): ImpactStyle {
  if (ms <= 20) return ImpactStyle.Light;
  if (ms <= 40) return ImpactStyle.Medium;
  return ImpactStyle.Heavy;
}

export function vibrate(ms: number): void {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') {
    Haptics.impact({ style: impactFor(ms) }).catch(() => {});
  } else if (platform === 'android') {
    Haptics.vibrate({ duration: ms }).catch(() => {});
  } else {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch {
      // Vibration non prise en charge.
    }
  }
}
