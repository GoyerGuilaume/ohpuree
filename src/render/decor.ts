import type { DecoKind } from '../data/biomes';
import { hash } from './palette';
import { circ } from './shapes';

/** Motif de fond d'un couloir (13 décors), qui défile avec la profondeur D. */
export function drawDecor(
  ctx: CanvasRenderingContext2D, D: number, H: number,
  kind: DecoKind, x0: number, lw: number, py: number, col: string, seed: number,
): void {
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  if (kind === 'checker' || kind === 'grid') {
    const sq = kind === 'checker' ? 44 : 52, r0 = Math.floor((D - py) / sq) - 1;
    for (let rw = r0; ; rw++) {
      const ry = py + (rw * sq - D);
      if (ry > H + sq) break;
      if (kind === 'checker') {
        ctx.globalAlpha = 0.55;
        for (let c = 0; c * sq < lw; c++) if ((rw + c) & 1) ctx.fillRect(x0 + c * sq, ry, Math.min(sq, lw - c * sq), sq);
        ctx.globalAlpha = 1;
      } else ctx.fillRect(x0, ry, lw, 2);
    }
    if (kind === 'grid') for (let gx = sq / 2; gx < lw; gx += sq) ctx.fillRect(x0 + gx, -40, 2, H + 80);
    return;
  }
  const step = 96, k0 = Math.floor((D - py) / step);
  for (let k = k0; ; k++) {
    const yy = py + (k * step - D);
    if (yy > H + 40) break;
    if (yy < -40) continue;
    const h1 = hash(k, seed), h2 = hash(k, seed + 7), h3 = hash(k, seed + 13), sx = x0 + lw * h1;
    if (kind === 'sprouts') {
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.ellipse(sx, yy + 12, 18 + h2 * 10, 7, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 9, yy + 6); ctx.lineTo(sx - 3, yy - 14 - h2 * 6); ctx.lineTo(sx + 1, yy + 6);
      ctx.moveTo(sx - 1, yy + 6); ctx.lineTo(sx + 6, yy - 18 - h3 * 6); ctx.lineTo(sx + 10, yy + 6);
      ctx.fill();
    } else if (kind === 'ridges') {
      ctx.fillRect(x0, yy, lw, 3); circ(ctx, x0 + lw * 0.12, yy + 13, 2.5); circ(ctx, x0 + lw * 0.88, yy + 13, 2.5);
    } else if (kind === 'creases') {
      ctx.beginPath(); ctx.moveTo(sx, yy); ctx.lineTo(sx + 14 + h2 * 22, yy + 16 + h3 * 28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 + lw * h2, yy + 30); ctx.lineTo(x0 + lw * h2 - 12 - h3 * 16, yy + 50); ctx.stroke();
    } else if (kind === 'speckle') {
      for (let i = 0; i < 7; i++) ctx.fillRect(x0 + lw * hash(k + i * 3, seed + 1), yy + hash(k, seed + i) * step, 2.5, 2.5);
    } else if (kind === 'shelves') {
      if (k % 2 === 0) {
        ctx.globalAlpha = 0.8; ctx.fillRect(x0, yy, lw, 6);
        ctx.globalAlpha = 0.4; ctx.fillRect(x0, yy + 6, lw, 5);
        ctx.globalAlpha = 1;
      }
    } else if (kind === 'grain') {
      ctx.beginPath();
      for (let gx2 = 0; gx2 <= lw; gx2 += 8) {
        const gy = yy + Math.sin((gx2 + h1 * 60) * 0.045 + k) * 5;
        if (gx2 === 0) ctx.moveTo(x0, gy); else ctx.lineTo(x0 + gx2, gy);
      }
      ctx.stroke();
      if (h2 > 0.7) { ctx.beginPath(); ctx.ellipse(sx, yy + 30, 9, 5, 0, 0, 7); ctx.stroke(); }
    } else if (kind === 'flames') {
      ctx.beginPath(); ctx.moveTo(sx - 7, yy + 10); ctx.lineTo(sx, yy - 16 - h2 * 14); ctx.lineTo(sx + 7, yy + 10); ctx.fill();
    } else if (kind === 'splat') {
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.ellipse(sx, yy + h2 * step * 0.6, 6 + h3 * 12, 4 + h3 * 6, h2 * 3, 0, 7); ctx.fill();
      circ(ctx, x0 + lw * h3, yy + h1 * step * 0.8, 2 + h2 * 2);
      ctx.globalAlpha = 1;
    } else if (kind === 'snow') {
      circ(ctx, sx, yy + step * h2 * 0.6, 2 + h2 * 3); circ(ctx, x0 + lw * h2, yy + step * h1 * 0.6, 1.5 + h1 * 2);
    } else if (kind === 'trash') {
      ctx.save(); ctx.translate(sx, yy + h2 * step * 0.6); ctx.rotate(h3 * 6);
      if (h1 > 0.5) ctx.fillRect(-8, -5, 16, 10); else circ(ctx, 0, 0, 5 + h3 * 4);
      ctx.restore();
    } else {
      circ(ctx, sx, yy + h2 * step, 1 + h2 * 2); circ(ctx, x0 + lw * h2, yy + h1 * step, 1 + h1 * 1.5);
    }
  }
}
