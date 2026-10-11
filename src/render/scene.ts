import { tr } from '../i18n';
import { goldMul } from '../game/economy';
import { countdownDigit, inGame } from '../game/flow';
import { skinColors } from '../game/fxhelpers';
import { clamp } from '../game/math';
import type { World } from '../game/types';
import { curSkin, devOn, skinTrait } from '../game/world';
import { drawDecor } from './decor';
import { drawHitboxes, drawObs } from './obstacles';
import { palette } from './palette';
import { drawBonus, drawButter, drawGold } from './pickups';
import { drawPotato } from './potato';
import type { Form } from './potato';
import { circ } from './shapes';
import { EMOJI_FONT, SANS } from './theme';
import type { Theme } from './theme';

export interface Screen {
  ctx: CanvasRenderingContext2D;
  DPR: number;
  theme: Theme;
}

/** Dessine une frame complète : couloirs, obstacles, ramassables, patates, particules, HUD. */
export function drawScene(s: Screen, w: World): void {
  const { ctx, DPR, theme } = s, { W, H } = w.view, G = w.G;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const C = palette(G.D);
  const SK = curSkin(w), paint = skinColors(w);
  let sx = 0, sy = 0;
  // Tremblement : purement visuel, tiré hors du générateur de la logique.
  if (G.shake > 0) { sx = (Math.random() - 0.5) * G.shake * 30; sy = (Math.random() - 0.5) * G.shake * 30; }
  ctx.save(); ctx.translate(sx, sy);
  const n = G.pieces.length || 1, py = H * 0.3, lw = W / n, r = Math.min(26, lw * 0.12);
  const form: Form = n === 1 ? 'whole' : n === 2 ? 'half' : 'fry';
  const hitbox = devOn(w) && w.profile.settings.hitbox === 'on';
  for (let i = 0; i < G.pieces.length; i++) {
    const p = G.pieces[i]!, x0 = i * lw;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, -40, lw, H + 80); ctx.clip();
    ctx.fillStyle = i % 2 ? C.b : C.a; ctx.fillRect(x0, -40, lw, H + 80);
    drawDecor(ctx, G.D, H, C.deco, x0, lw, py, C.line, p.seed);
    for (const o of p.obs) drawObs(ctx, G, H, theme, o, x0, lw, py);
    if (hitbox) drawHitboxes(ctx, G, p, x0, lw, py, r);
    for (const pk of p.pick) {
      if (pk.taken) continue;
      const yy = py + (pk.d - G.D);
      if (yy < -30 || yy > H + 30) continue;
      const px = x0 + pk.x * lw;
      if (pk.k === 'fuse') drawButter(ctx, G, px, yy);
      else if (pk.k === 'bonus') drawBonus(ctx, G, px, yy, pk);
      else drawGold(ctx, G, px, yy, pk.d * 0.013);
    }
    drawPotato(ctx, G, SK, paint, x0 + p.x * lw, py, r, form, p);
    ctx.restore();
    if (i > 0) { ctx.fillStyle = C.ink; ctx.globalAlpha = 0.25; ctx.fillRect(x0 - 1, 0, 2, H); ctx.globalAlpha = 1; }
  }
  for (const pt of G.parts) {
    ctx.globalAlpha = clamp((pt.life / pt.max) * 2, 0, 1); ctx.fillStyle = pt.c; circ(ctx, pt.x, pt.y, pt.s);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (G.slowT > 0) {
    const sr = Math.max(0, G.slowT) / G.slowDur;
    ctx.fillStyle = `rgba(110,160,255,${(0.16 * sr * sr).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  }
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${(0.4 * G.flash).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if (inGame(w.phase)) drawHud(ctx, w, C.ink);
}

function drawHud(ctx: CanvasRenderingContext2D, w: World, ink: string): void {
  const G = w.G, { W, H } = w.view, SK = curSkin(w);
  const cape = skinTrait(SK, 'cape'), stone = skinTrait(SK, 'stone');
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 26px ${SANS}`;
  ctx.fillText(`${G.score} m`, W / 2, 30);
  ctx.font = `600 14px ${SANS},${EMOJI_FONT}`; ctx.globalAlpha = 0.85;
  let extra = `🥔 ×${G.pieces.length}   🪙 ${G.gold}`;
  if (G.ketchup > 0) extra += `   🍅×${G.ketchup}`;
  if (G.mayo > 0) extra += `   🥚×${G.mayo}`;
  if (goldMul(G) > 1) extra += `   🪙×${goldMul(G)}`;
  if (G.mustard) extra += '   🌭';
  if (G.hot) extra += '   🌶️';
  if (cape) extra += G.glide > 0 ? '   🪂 !' : G.glideCd > 0 ? `   🪂 ${Math.ceil(G.glideCd)}s` : '   🪂 ✓';
  if (w.profile.settings.mode === 'survive' && G.lost > 0) extra += `   ⚡ +${Math.round(G.lost * 22)}%`;
  if (G.magnetT > 0) extra += `   🧲 ${Math.ceil(G.magnetT)}s`;
  if (G.skinOverride) extra += '   🌈';
  if (devOn(w)) extra += '   🛠';
  ctx.fillText(extra, W / 2, 56);
  ctx.globalAlpha = 1;
  if (w.phase === 'countdown') {
    ctx.globalAlpha = 0.9; ctx.font = `800 96px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(countdownDigit(w)), W / 2, H * 0.5); ctx.globalAlpha = 1;
  }
  if (G.banner) {
    const bt = G.banner.t, ba = bt < 0.4 ? bt / 0.4 : bt > 2 ? clamp((2.6 - bt) / 0.6, 0, 1) : 1;
    ctx.globalAlpha = ba; ctx.font = `800 30px ${SANS},${EMOJI_FONT}`; ctx.fillText(G.banner.text, W / 2, H * 0.45);
    ctx.globalAlpha = 1;
  }
  if (G.t < 3.4) {
    const tilt = w.activeControl === 'tilt';
    ctx.globalAlpha = clamp(1 - (G.t - 2.4), 0, 1) * 0.9;
    ctx.font = `700 17px ${SANS},${EMOJI_FONT}`;
    ctx.fillText(tr(tilt ? 'tut_tilt' : 'tut_tap'), W / 2, H * 0.62);
    if (cape) ctx.fillText(tr(tilt ? 'tut_cape_tilt' : 'tut_cape_tap'), W / 2, H * 0.62 + 26);
    if (stone) ctx.fillText(tr('tut_stone'), W / 2, H * 0.62 + 26);
    ctx.globalAlpha = 1;
  }
}
