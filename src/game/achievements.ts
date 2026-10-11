import { ACH_BY, achNameKey } from '../data/achievements';
import type { AchId } from '../data/achievements';
import { tr } from '../i18n';
import type { World } from './types';

/** Débloque un succès (une seule fois) : récompense en golds, sauvegarde, toast et son. */
export function unlock(w: World, id: AchId): void {
  const a = ACH_BY[id];
  const p = w.profile;
  if (p.ach[id]) return;
  p.ach[id] = true;
  p.wallet += a.reward;
  w.fx.save();
  w.G.achRun.push(id);
  w.fx.toast(`🏆 ${tr(achNameKey(id))} · +${a.reward} 🪙`);
  w.fx.beep(988, 0.12, 'triangle', 0.06, 500);
}
