import { blockOf, gapOf } from '../game/obstacles';
import type { Obstacle, Piece, Run } from '../game/types';
import { circ, rr } from './shapes';
import type { Theme } from './theme';

export function drawObs(ctx: CanvasRenderingContext2D, G: Run, H: number, T: Theme, o: Obstacle, x0: number, lw: number, py: number): void {
  const y = py + (o.d - G.D);
  if (y < -170 || y > H + 170) return;
  if (o.kind === 'gap') {
    const g = gapOf(G, o), gl = x0 + (g.c - g.gw / 2) * lw, gr = x0 + (g.c + g.gw / 2) * lw, xe = x0 + lw;
    if (o.type === 'pin') {
      const th = 15;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, x0 - 8, y - th - 2, gl - x0 + 10, th * 2 + 4, th); rr(ctx, gr - 2, y - th - 2, xe - gr + 10, th * 2 + 4, th);
      ctx.fillStyle = T.pin; rr(ctx, x0 - 6, y - th, gl - x0 + 6, th * 2, th); rr(ctx, gr, y - th, xe - gr + 6, th * 2, th);
      ctx.fillStyle = 'rgba(255,255,255,.2)'; rr(ctx, x0, y - th + 4, gl - x0 - 8, 4, 2); rr(ctx, gr + 8, y - th + 4, xe - gr - 8, 4, 2);
    } else {
      drawKnife(ctx, T, x0 - 4, gl, y);
      drawKnife(ctx, T, xe + 4, gr, y);
    }
    return;
  }
  const b = blockOf(G, o), cx = x0 + b.c * lw;
  if (o.type === 'pin') {
    const hw = (b.w * lw) / 2;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, cx - hw - 2, y - 17, hw * 2 + 4, 34, 17);
    ctx.fillStyle = T.pin; rr(ctx, cx - hw, y - 15, hw * 2, 30, 15);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; rr(ctx, cx - hw + 8, y - 10, hw * 2 - 16, 4, 2);
  } else {
    drawPizzaCutter(ctx, G, T, cx, y, (b.w * lw) / 2);
  }
}

/** Mode dev : zones où le CENTRE de la patate ne doit pas se trouver (rouge). */
export function drawHitboxes(ctx: CanvasRenderingContext2D, G: Run, p: Piece, x0: number, lw: number, py: number, r: number): void {
  const rf = r / lw;
  ctx.save();
  ctx.fillStyle = 'rgba(255,0,0,.25)'; ctx.strokeStyle = 'rgba(255,0,0,.9)'; ctx.lineWidth = 1.5;
  for (const o of p.obs) {
    if (o.hit) continue;
    const y = py + (o.d - G.D);
    if (o.kind === 'gap') {
      const g = gapOf(G, o), th = (o.type === 'blade' ? 13 : 15) + r * 0.8, xr = rf * 0.85;
      const a = x0 + (g.c - g.gw / 2 + xr) * lw, b = x0 + (g.c + g.gw / 2 - xr) * lw;
      ctx.fillRect(x0, y - th, a - x0, th * 2); ctx.strokeRect(x0, y - th, a - x0, th * 2);
      ctx.fillRect(b, y - th, x0 + lw - b, th * 2); ctx.strokeRect(b, y - th, x0 + lw - b, th * 2);
    } else {
      const bl = blockOf(G, o), cx = x0 + bl.c * lw;
      if (o.type === 'blade') {
        const R = (bl.w * lw) / 2 + r * 0.75;
        ctx.beginPath(); ctx.arc(cx, y, R, 0, 7); ctx.fill(); ctx.stroke();
      } else {
        const hw = (bl.w * lw) / 2 + r * 0.8, th2 = 15 + r * 0.8;
        ctx.fillRect(cx - hw, y - th2, hw * 2, th2 * 2); ctx.strokeRect(cx - hw, y - th2, hw * 2, th2 * 2);
      }
    }
  }
  ctx.fillStyle = '#00e060'; circ(ctx, x0 + p.x * lw, py, 3);
  ctx.restore();
}

/** Couteau de cuisine (horizontal, pointe vers la brèche, tranchant vers le haut). */
function drawKnife(ctx: CanvasRenderingContext2D, T: Theme, xh: number, xt: number, y: number): void {
  const L = Math.abs(xt - xh);
  if (L < 14) return;
  const dir = xt >= xh ? 1 : -1, hl = Math.min(40, L * 0.42), hh = 11;
  ctx.save(); ctx.translate(xh, y); ctx.scale(dir, 1); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, -10, -hh * 0.85 - 2, hl + 14, hh * 1.7 + 4, 6);
  ctx.fillStyle = '#5a3a22'; rr(ctx, -8, -hh * 0.85, hl + 10, hh * 1.7, 5);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(ctx, -6, -hh * 0.6, Math.max(2, hl - 2), 3, 1.5);
  ctx.fillStyle = '#e6d3a8'; circ(ctx, hl * 0.28, 0, 2.2); circ(ctx, hl * 0.68, 0, 2.2);
  ctx.beginPath(); ctx.moveTo(hl, hh); ctx.lineTo(L - 14, hh); ctx.quadraticCurveTo(L - 2, hh, L, -hh * 0.15);
  ctx.quadraticCurveTo(hl + (L - hl) * 0.55, -hh * 1.2, hl, -hh * 0.9); ctx.closePath();
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.stroke();
  ctx.fillStyle = T.metal; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.6; ctx.beginPath();
  ctx.moveTo(hl + 8, -hh * 0.35); ctx.quadraticCurveTo(hl + (L - hl) * 0.55, -hh * 0.65, L - 18, -hh * 0.2); ctx.stroke();
  ctx.fillStyle = T.metalDark; ctx.fillRect(hl, hh - 3, Math.max(0, L - 14 - hl), 3); ctx.fillRect(hl - 3, -hh * 0.95, 4, hh * 1.95);
  ctx.restore();
}

/** Roulette à pizza : roue qui tourne + manche rouge fixe (côté opposé au joueur). */
function drawPizzaCutter(ctx: CanvasRenderingContext2D, G: Run, T: Theme, cx: number, y: number, R: number): void {
  ctx.save(); ctx.translate(cx, y);
  const hl = R * 1.55 + 8;
  ctx.save(); ctx.rotate(0.9);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(ctx, 0, -R * 0.2 - 2, hl + 4, R * 0.4 + 4, 6);
  ctx.fillStyle = '#c0392b'; rr(ctx, R * 0.45, -R * 0.17, hl - R * 0.45, R * 0.34, 6);
  ctx.fillStyle = '#8f2a1c'; rr(ctx, R * 0.45, -R * 0.17, 5, R * 0.34, 2);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; rr(ctx, R * 0.45 + 8, -R * 0.1, Math.max(2, hl - R * 0.45 - 16), 3, 1.5);
  ctx.restore();
  ctx.rotate(G.t * 5);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; circ(ctx, 0, 0, R + 3);
  ctx.fillStyle = T.metal; circ(ctx, 0, 0, R);
  ctx.strokeStyle = T.metalDark; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R - 1, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(60,70,80,.75)';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.2832;
    circ(ctx, Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, Math.max(2, R * 0.12));
  }
  ctx.fillStyle = T.metalDark; circ(ctx, 0, 0, R * 0.22);
  ctx.fillStyle = '#e8eef2'; circ(ctx, 0, 0, R * 0.1);
  ctx.restore();
}
