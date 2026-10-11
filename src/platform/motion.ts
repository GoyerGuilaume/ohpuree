import { clamp } from '../game/math';

/** Inclinaison gauche/droite normalisée de -1 à 1, avec une petite zone morte. */
export const tilt = { x: 0, seen: false };

let bound = false;

function onOrient(e: DeviceOrientationEvent): void {
  if (e.gamma == null) return;
  tilt.seen = true;
  const v = clamp(e.gamma / 28, -1, 1);
  tilt.x = Math.abs(v) < 0.06 ? 0 : v;
}

interface IOSOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/**
 * Active l'inclinaison. Sur iOS, la permission doit être demandée pendant un geste
 * utilisateur (clic sur « Jouer »). Renvoie false si refusée ou indisponible.
 */
export async function enableTilt(): Promise<boolean> {
  try {
    let ok = true;
    const DOE = (typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : undefined) as IOSOrientationEvent | undefined;
    if (DOE && typeof DOE.requestPermission === 'function') ok = (await DOE.requestPermission()) === 'granted';
    if (ok && !bound) {
      window.addEventListener('deviceorientation', onOrient);
      bound = true;
    }
    return ok;
  } catch {
    return false;
  }
}
