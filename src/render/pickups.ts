import { BONUS_BY, TIERS } from '../data/bonuses';
import type { TierIndex } from '../data/bonuses';
import type { Pickup, Run } from '../game/types';
import { circ } from './shapes';
import { EMOJI_FONT } from './theme';

/** Halo coloré selon la rareté (vert, bleu, violet, arc-en-ciel). */
function tierColor(G: Run, t: TierIndex): string {
  return t === 3 ? `hsl(${Math.floor((G.t * 220) % 360)},100%,60%)` : TIERS[t].color;
}

export function drawBonus(ctx: CanvasRenderingContext2D, G: Run, x: number, y: number, pk: Extract<Pickup, { k: 'bonus' }>): void {
  const col = tierColor(G, pk.tier), pulse = 1 + Math.sin(G.t * 6 + pk.d) * 0.1, R = (pk.tier === 3 ? 27 : 23) * pulse;
  ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `26px ${EMOJI_FONT}`; ctx.fillStyle = '#000';
  ctx.fillText(BONUS_BY[pk.b].icon, x, y + 1);
  if (pk.tier === 3) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
      const a = G.t * 2.5 + i * 1.5708;
      circ(ctx, x + Math.cos(a) * R * 1.25, y + Math.sin(a) * R * 1.25, 2.5);
    }
  }
}

/** Golds : pièce qui tourne, contour sombre + halo doré, visible sur tous les décors. */
export function drawGold(ctx: CanvasRenderingContext2D, G: Run, x: number, y: number, seed: number): void {
  const R = 12, w = 0.55 + 0.45 * Math.abs(Math.cos(G.t * 4 + seed));
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(x, y, (R + 3.5) * w + 1.5, R + 3.5, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#ffc928'; ctx.strokeStyle = '#8a4f00'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(x, y, R * w, R, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#fff0a8'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(x, y, R * w * 0.62, R * 0.62, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(x - R * w * 0.32, y - R * 0.38, R * w * 0.17 + 0.5, R * 0.2, 0, 0, 7); ctx.fill();
}

/** Beurre (fusion). */
export function drawButter(ctx: CanvasRenderingContext2D, G: Run, px: number, yy: number): void {
  const pulse = 1 + Math.sin(G.t * 6) * 0.12;
  ctx.fillStyle = 'rgba(255,226,122,.6)'; circ(ctx, px, yy, 22 * pulse);
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, yy, 22 * pulse, 0, 7); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `26px ${EMOJI_FONT}`; ctx.fillStyle = '#000';
  ctx.fillText('🧈', px, yy + 1);
}
