import { clamp } from '../game/math';
import type { Control } from '../game/types';
import { tilt } from '../platform/motion';

/** Entrées du joueur : moitiés d'écran tactiles, clavier, inclinaison, glissé vers le haut. */
export class Input {
  keyDir = 0;
  private tapDir = 0;
  private touches = new Map<number, number>();
  private starts = new Map<number, { x: number; y: number; t: number; fired: boolean }>();

  constructor(canvas: HTMLCanvasElement, getControl: () => Control, onGlide: () => void) {
    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.touches.set(e.pointerId, e.clientX < r.left + r.width / 2 ? -1 : 1);
      this.updateTap();
      this.starts.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), fired: false });
    });
    canvas.addEventListener('pointermove', (e) => {
      const s = this.starts.get(e.pointerId);
      if (s && !s.fired && s.y - e.clientY > 45) { s.fired = true; onGlide(); }
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
      canvas.addEventListener(ev, (e) => {
        const s = this.starts.get(e.pointerId);
        // En mode inclinaison, un simple tap fait planer.
        if (ev === 'pointerup' && s && !s.fired && getControl() === 'tilt' && performance.now() - s.t < 350
          && Math.abs(e.clientX - s.x) < 14 && Math.abs(e.clientY - s.y) < 14) onGlide();
        this.starts.delete(e.pointerId);
        this.touches.delete(e.pointerId);
        this.updateTap();
      });
    }
  }

  private updateTap(): void {
    let d = 0;
    this.touches.forEach((v) => { d += v; });
    this.tapDir = clamp(d, -1, 1);
  }

  /** Direction demandée : clavier en priorité, sinon inclinaison ou toucher. */
  dir(control: Control): number {
    if (this.keyDir) return this.keyDir;
    return control === 'tilt' ? tilt.x : this.tapDir;
  }

  /** Oublie les doigts posés et les touches enfoncées (à la pause). */
  reset(): void {
    this.touches.clear();
    this.starts.clear();
    this.tapDir = 0;
    this.keyDir = 0;
  }
}
