import { $ } from './dom';

const queue: string[] = [];
let busy = false;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Affiche un message en bas de l'écran ; 5 messages au plus en attente. */
export function toast(m: string): void {
  queue.push(m);
  if (queue.length > 5) queue.shift();
  if (!busy) next();
}

function next(): void {
  const m = queue.shift();
  if (m === undefined) { busy = false; return; }
  busy = true;
  const t = $('toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(next, 280);
  }, 2400);
}
