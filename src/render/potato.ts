import type { SkinDef } from '../data/skins';
import { clamp } from '../game/math';
import type { Piece, Run } from '../game/types';
import { skinTrait } from '../game/world';
import { circ } from './shapes';
import type { SkinPaint } from './theme';

export type Form = 'whole' | 'half' | 'fry';

type Ctx2D = CanvasRenderingContext2D;

export function stoneShape(c: Ctx2D, rx: number, ry: number): void {
  const M = [1.05, 0.9, 1.1, 0.94, 1.12, 0.9, 1.08, 0.93, 1.03, 0.97];
  c.beginPath();
  for (let i = 0; i < M.length; i++) {
    const a = (i / M.length) * 6.2832 - 1.5708, px = Math.cos(a) * rx * M[i]!, py = Math.sin(a) * ry * M[i]!;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
}

export function paintMagnet(c: Ctx2D, r: number): void {
  c.save(); c.lineCap = 'butt'; c.lineWidth = r * 0.34;
  c.strokeStyle = '#d1432f'; c.beginPath();
  c.moveTo(-r * 0.5, -r * 1.15); c.lineTo(-r * 0.5, -r * 1.55); c.arc(0, -r * 1.55, r * 0.5, Math.PI, 0); c.lineTo(r * 0.5, -r * 1.15);
  c.stroke();
  c.strokeStyle = '#e6ebef'; c.beginPath();
  c.moveTo(-r * 0.5, -r * 1.15); c.lineTo(-r * 0.5, -r * 0.92); c.moveTo(r * 0.5, -r * 1.15); c.lineTo(r * 0.5, -r * 0.92);
  c.stroke();
  c.restore();
}

function bodyPath(ctx: Ctx2D, SK: SkinDef, form: Form, r: number): void {
  ctx.beginPath();
  if (form === 'fry') {
    if (ctx.roundRect) ctx.roundRect(-r * 0.62, -r * 1.25, r * 1.24, r * 2.5, r * 0.35);
    else ctx.rect(-r * 0.62, -r * 1.25, r * 1.24, r * 2.5);
  } else if (skinTrait(SK, 'stone')) stoneShape(ctx, r * 1.03, r * 1.2);
  else ctx.ellipse(0, 0, r * 1.03, r * 1.2, 0, 0, 7);
}

/** Patate entière, demi (2 morceaux) ou frite (3-4), avec cape / parachute, aimant, yeux et bouche. */
export function drawPotato(ctx: Ctx2D, G: Run, SK: SkinDef, T: SkinPaint, x: number, y: number, r: number, form: Form, p: Piece): void {
  const cape = skinTrait(SK, 'cape');
  ctx.save(); ctx.translate(x, y);
  ctx.rotate(Math.sin(G.t * 6 + p.wob) * 0.1 + G.vx * 0.12);
  if (p.inv > 0 && Math.floor(G.t * 16) % 2 === 0) ctx.globalAlpha = 0.4;
  if (cape || G.glide > 0) {
    ctx.fillStyle = cape ? '#d1432f' : '#f4f4f4'; ctx.strokeStyle = cape ? '#8f2a1c' : '#8a8a8a'; ctx.lineWidth = Math.max(1.5, r * 0.08);
    if (G.glide > 0) {
      ctx.beginPath(); ctx.ellipse(0, -r * 2.1, r * 2.1, r * 1.15, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 2.0, -r * 2.1); ctx.lineTo(-r * 0.5, -r * 0.7); ctx.moveTo(r * 2.0, -r * 2.1); ctx.lineTo(r * 0.5, -r * 0.7);
      ctx.moveTo(0, -r * 3.2); ctx.lineTo(0, -r * 0.9);
      ctx.stroke();
    } else {
      const fl = Math.sin(G.t * 9 + p.wob) * r * 0.25;
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.5); ctx.quadraticCurveTo(-r * 1.3 + fl, -r * 1.3, -r * 1.2 + fl, -r * 2.0);
      ctx.lineTo(r * 1.2 - fl, -r * 2.0 - fl * 0.5); ctx.quadraticCurveTo(r * 1.3 - fl, -r * 1.3, r * 0.7, -r * 0.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  if (skinTrait(SK, 'magnet')) paintMagnet(ctx, r);
  ctx.lineWidth = Math.max(2, r * 0.12); ctx.strokeStyle = T.potatoEdge;
  ctx.fillStyle = form === 'fry' ? T.fry : T.potato; bodyPath(ctx, SK, form, r); ctx.fill(); ctx.stroke();
  if (form === 'half') { ctx.fillStyle = T.flesh; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.72, r * 0.92, 0, 0, 7); ctx.fill(); }
  else if (form === 'whole') {
    const a = ctx.globalAlpha;
    if (skinTrait(SK, 'stone')) {
      ctx.globalAlpha = a * 0.7; ctx.strokeStyle = T.potatoEdge; ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.2); ctx.lineTo(-r * 0.3, r * 0.5); ctx.lineTo(-r * 0.35, r * 0.85);
      ctx.moveTo(r * 0.45, -r * 0.75); ctx.lineTo(r * 0.2, -r * 0.45); ctx.lineTo(r * 0.5, -r * 0.2);
      ctx.stroke();
    } else {
      ctx.globalAlpha = a * 0.35; ctx.fillStyle = T.potatoEdge;
      circ(ctx, -r * 0.55, r * 0.45, r * 0.1); circ(ctx, r * 0.5, r * 0.7, r * 0.08); circ(ctx, r * 0.1, -r * 0.85, r * 0.08);
    }
    ctx.globalAlpha = a;
  }
  if (p.oven > 0) { ctx.fillStyle = 'rgba(232,100,20,.5)'; bodyPath(ctx, SK, form, r); ctx.fill(); }
  const ex = r * 0.3, ey = -r * 0.18, er = r * 0.24, off = clamp(G.vx, -1, 1) * er * 0.4;
  ctx.fillStyle = '#fff'; circ(ctx, -ex, ey, er); circ(ctx, ex, ey, er);
  ctx.fillStyle = '#222'; circ(ctx, -ex + off, ey, er * 0.5); circ(ctx, ex + off, ey, er * 0.5);
  ctx.fillStyle = '#5a2a1a'; ctx.beginPath();
  if (p.scared) ctx.ellipse(0, r * 0.5, r * 0.16, r * 0.22, 0, 0, 7); else ctx.ellipse(0, r * 0.45, r * 0.22, r * 0.1, 0, 0, 7);
  ctx.fill();
  ctx.restore();
}

/** Aperçu d'un skin dans la boutique. */
export function drawSkinPreview(c: HTMLCanvasElement, sk: SkinDef): void {
  const x = c.getContext('2d');
  if (!x) return;
  const s = c.width, r = s * 0.26;
  x.clearRect(0, 0, s, s); x.save(); x.translate(s / 2, s / 2 + s * 0.1);
  if (skinTrait(sk, 'cape')) {
    x.fillStyle = '#d1432f'; x.beginPath();
    x.moveTo(-r * 0.7, -r * 0.5); x.lineTo(-r * 1.3, -r * 1.8); x.lineTo(r * 1.3, -r * 1.8); x.lineTo(r * 0.7, -r * 0.5);
    x.closePath(); x.fill();
  }
  if (skinTrait(sk, 'magnet')) paintMagnet(x, r);
  x.fillStyle = sk.body; x.strokeStyle = sk.edge; x.lineWidth = Math.max(2, r * 0.12);
  if (skinTrait(sk, 'stone')) stoneShape(x, r * 1.03, r * 1.2);
  else { x.beginPath(); x.ellipse(0, 0, r * 1.03, r * 1.2, 0, 0, 7); }
  x.fill(); x.stroke();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(-r * 0.3, -r * 0.18, r * 0.24, 0, 7); x.fill();
  x.beginPath(); x.arc(r * 0.3, -r * 0.18, r * 0.24, 0, 7); x.fill();
  x.fillStyle = '#222';
  x.beginPath(); x.arc(-r * 0.3, -r * 0.18, r * 0.12, 0, 7); x.fill();
  x.beginPath(); x.arc(r * 0.3, -r * 0.18, r * 0.12, 0, 7); x.fill();
  x.restore();
}
