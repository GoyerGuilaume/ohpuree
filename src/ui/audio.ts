import type { Wave } from '../game/types';

let ac: AudioContext | null = null;

type AudioCtor = typeof AudioContext;

function ctx(): AudioContext {
  if (!ac) {
    const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) throw new Error('WebAudio indisponible');
    ac = new Ctor();
  }
  return ac;
}

/** À appeler pendant un geste utilisateur : les navigateurs bloquent le son sinon. */
export function unlockAudio(): void {
  try {
    void ctx().resume();
  } catch {
    // Pas de son.
  }
}

/** Petit son synthétisé (oscillateur), comme dans le prototype. */
export function beep(f: number, d: number, type: Wave, vol: number, slide: number): void {
  try {
    const a = ctx(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(vol || 0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + d);
  } catch {
    // Pas de son.
  }
}
