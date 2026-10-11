import { ACHIEVEMENTS, achDescKey, achNameKey } from '../data/achievements';
import { tr } from '../i18n';
import type { World } from '../game/types';
import { devOn } from '../game/world';
import { $ } from './dom';

export function renderAch(w: World): void {
  const list = $('achList'), ach = w.profile.ach;
  list.innerHTML = '';
  const done = ACHIEVEMENTS.filter((a) => ach[a.id]).length;
  $('achCount').textContent = tr('ach_count', done, ACHIEVEMENTS.length);
  $('achReset').classList.toggle('hidden', !devOn(w));
  for (const a of ACHIEVEMENTS) {
    const ok = !!ach[a.id], show = ok || !('secret' in a && a.secret);
    const row = document.createElement('div');
    row.className = `item ${ok ? 'done' : 'locked'}`;
    const ic = document.createElement('div');
    ic.style.cssText = 'font-size:1.6rem;flex:none;width:34px;text-align:center';
    ic.textContent = show ? a.icon : '❓';
    const t = document.createElement('div');
    t.className = 't';
    const b = document.createElement('b');
    b.textContent = show ? tr(achNameKey(a.id)) : '???';
    const s2 = document.createElement('small');
    s2.textContent = show ? tr(achDescKey(a.id)) : tr('ach_secret');
    t.appendChild(b);
    t.appendChild(s2);
    const rw = document.createElement('div');
    rw.className = 'rw';
    rw.textContent = `${ok ? '✓ ' : ''}+${a.reward} 🪙`;
    row.appendChild(ic);
    row.appendChild(t);
    row.appendChild(rw);
    list.appendChild(row);
  }
}
