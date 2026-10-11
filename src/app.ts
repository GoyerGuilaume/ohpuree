import { ACH_BY, achNameKey } from './data/achievements';
import { ITEMS } from './data/items';
import { DEV_TOOLS } from './env';
import { detectLang, setLang, tr } from './i18n';
import { backToMenu, frameDt, inGame, pause, quitToMenu, restartRun, resume, startGame, tick, tryGlide } from './game/flow';
import { parseProfile, serializeProfile } from './game/profile';
import type { Settings } from './game/profile';
import { mathRng } from './game/rng';
import { applyPurchase, devAddGold, resetAchievements, restoreSkins, toggleDev } from './game/shop';
import type { Fx, GameOverSummary, Phase, World } from './game/types';
import { createWorld, devOn } from './game/world';
import { vibrate } from './platform/haptics';
import { enableTilt, tilt } from './platform/motion';
import { exitApp, initLifecycle } from './platform/lifecycle';
import { purchases } from './platform/purchases';
import type { StoreProduct } from './platform/purchases';
import { writeSave } from './platform/storage';
import { readTheme } from './render/theme';
import { drawScene } from './render/scene';
import type { Screen } from './render/scene';
import { renderAch } from './ui/achievements';
import { beep, unlockAudio } from './ui/audio';
import { $, hide, isHidden, show } from './ui/dom';
import { backAction } from './ui/back';
import { Input } from './ui/input';
import { renderShop } from './ui/shop';
import type { ShopTab } from './ui/shop';
import { toast } from './ui/toast';

const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';

/** Relie la logique (src/game), le rendu (src/render) et l'interface DOM, comme le prototype. */
export function startApp(savedJson: string | null): void {
  const cv = $<HTMLCanvasElement>('cv');
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible');
  const screen: Screen = { ctx, DPR: 1, theme: readTheme() };
  let shopFrom: 'menu' | 'over' = 'menu', shopTab: ShopTab = 'items';

  const fx: Fx = {
    beep: (f, d, type, vol, slide) => { if (w.profile.settings.sound === 'on') beep(f, d, type, vol, slide); },
    vibrate,
    toast,
    save: () => { void writeSave(serializeProfile(w.profile)); },
    phaseChanged: onPhase,
    gameOver: onGameOver,
  };
  const profile = parseProfile(savedJson, detectLang(navigator.language), DEV_TOOLS);
  // La taille est mesurée avant de créer la partie de fond (comme le prototype : resize puis newGame).
  const r0 = cv.getBoundingClientRect();
  const w: World = createWorld({ profile, view: { W: r0.width, H: r0.height }, rng: mathRng, fx, devTools: DEV_TOOLS });
  const input = new Input(cv, () => w.activeControl, () => tryGlide(w));

  /* ---------- Taille & thème ---------- */
  function resize(): void {
    screen.DPR = Math.min(2, window.devicePixelRatio || 1);
    const r = cv.getBoundingClientRect();
    w.view.W = r.width;
    w.view.H = r.height;
    cv.width = Math.max(1, Math.round(r.width * screen.DPR));
    cv.height = Math.max(1, Math.round(r.height * screen.DPR));
    screen.theme = readTheme();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => { screen.theme = readTheme(); });

  /* ---------- Textes & menu ---------- */
  function applyI18n(): void {
    setLang(w.profile.settings.lang);
    document.documentElement.lang = w.profile.settings.lang;
    document.title = tr('title');
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((e) => {
      e.textContent = tr(e.getAttribute('data-i18n') as Parameters<typeof tr>[0]);
    });
    syncUI();
  }

  function syncUI(): void {
    const s = w.profile.settings;
    document.querySelectorAll<HTMLElement>('.seg').forEach((seg) => {
      const key = seg.getAttribute('data-key') as keyof Settings;
      seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-v') === s[key]));
    });
    $('hint').textContent = `${tr(s.control === 'tilt' ? 'hint_tilt' : 'hint_tap')} ${tr(s.mode === 'classic' ? 'hint_classic' : 'hint_survive')}`;
    const p = w.profile, parts: string[] = [];
    if (p.best > 0) parts.push(tr('record', p.best));
    parts.push(`${p.wallet} 🪙`);
    for (const it of ITEMS) if (it.kind === 'cons' && p.inv[it.id] > 0) parts.push(`${it.icon} ×${p.inv[it.id]}`);
    $('bestLine').textContent = parts.join(' · ');
    const dev = $('devBtn');
    dev.classList.toggle('hidden', !DEV_TOOLS);
    dev.textContent = tr('dev_btn', devOn(w) ? 'ON' : 'off');
    dev.classList.toggle('on', devOn(w));
  }

  document.querySelectorAll<HTMLButtonElement>('.seg button').forEach((b) => {
    b.addEventListener('click', () => {
      const key = b.parentElement?.getAttribute('data-key') as Exclude<keyof Settings, 'hitbox' | 'dev'>;
      (w.profile.settings as unknown as Record<string, string>)[key] = b.getAttribute('data-v') ?? '';
      fx.save();
      if (key === 'lang') applyI18n(); else syncUI();
    });
  });

  /* ---------- Phases, pause, fin de partie ---------- */
  function onPhase(phase: Phase): void {
    $('pauseBtn').classList.toggle('hidden', !inGame(phase));
    $('pauseBtn').innerHTML = phase === 'paused' ? ICON_PLAY : ICON_PAUSE;
    if (phase === 'paused') {
      input.reset();
      renderPause();
      show('pause');
    }
  }

  function renderPause(): void {
    $('hitboxBtn').classList.toggle('hidden', !devOn(w));
    $('hitboxBtn').textContent = tr('hitbox_btn', w.profile.settings.hitbox === 'on' ? 'ON' : 'off');
    syncUI();
  }

  function onGameOver(s: GameOverSummary): void {
    $('finalScore').textContent = `${s.score} m`;
    $('finalBest').textContent = s.isRecord ? tr('new_record') : tr('record', s.best);
    $('finalGold').textContent = tr('total', s.gold, s.wallet);
    $('finalAch').textContent = s.achRun.length
      ? `🏆 ${s.achRun.map((id) => `${tr(achNameKey(id))} (+${ACH_BY[id].reward})`).join(' · ')}`
      : '';
    setTimeout(() => { if (w.phase === 'over') show('over'); }, 550);
  }

  /** Lance une partie (consommables, overlays, repli tactile si l'inclinaison ne répond pas). */
  function launch(): void {
    startGame(w);
    hide('menu', 'over', 'shop', 'ach', 'pause');
    if (w.activeControl === 'tilt') {
      setTimeout(() => {
        if (w.phase === 'play' && w.activeControl === 'tilt' && !tilt.seen) {
          w.activeControl = 'tap';
          toast(tr('toast_sensor'));
        }
      }, 1600);
    }
  }

  function doResume(): void {
    if (resume(w)) hide('pause');
  }

  $('pauseBtn').addEventListener('click', () => {
    if (w.phase === 'paused') doResume(); else pause(w);
    $('pauseBtn').blur();
  });
  $('resumeBtn').addEventListener('click', doResume);
  $('restartBtn').addEventListener('click', () => { hide('pause'); restartRun(w); launch(); });
  $('quitBtn').addEventListener('click', () => { hide('pause'); quitToMenu(w); show('menu'); syncUI(); });
  $('hitboxBtn').addEventListener('click', () => {
    w.profile.settings.hitbox = w.profile.settings.hitbox === 'on' ? 'off' : 'on';
    renderPause();
  });

  /* ---------- Arrière-plan & bouton retour (Android) ---------- */
  initLifecycle({
    onPause: () => { pause(w); },
    onBack: () => {
      switch (backAction(w.phase, { shop: !isHidden('shop'), ach: !isHidden('ach') })) {
        case 'pause': pause(w); break;
        case 'resume': doResume(); break;
        case 'closeShop': $('shopBack').click(); break;
        case 'closeAch': $('achBack').click(); break;
        case 'toMenu': $('toMenu').click(); break;
        case 'exit': exitApp(); break;
      }
    },
  });

  $('play').addEventListener('click', () => {
    unlockAudio();
    if (w.profile.settings.control === 'tilt') {
      void enableTilt().then((ok) => {
        w.activeControl = ok ? 'tilt' : 'tap';
        if (!ok) toast(tr('toast_tilt_denied'));
        launch();
      });
    } else {
      w.activeControl = 'tap';
      launch();
    }
  });
  $('again').addEventListener('click', launch);
  $('toMenu').addEventListener('click', () => { backToMenu(w); hide('over'); show('menu'); syncUI(); });

  /* ---------- Clavier ---------- */
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (w.phase === 'play' || w.phase === 'countdown') { e.preventDefault(); pause(w); return; }
      if (w.phase === 'paused') { e.preventDefault(); doResume(); return; }
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') input.keyDir = -1;
    else if (e.key === 'ArrowRight' || e.key === 'd') input.keyDir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'z') tryGlide(w);
    else if ((e.key === 'Enter' || e.key === ' ') && w.phase !== 'play' && isHidden('shop') && isHidden('ach')) {
      e.preventDefault();
      if (w.phase === 'over') launch(); else $('play').click();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (['ArrowLeft', 'a', 'q', 'ArrowRight', 'd'].includes(e.key)) input.keyDir = 0;
  });

  /* ---------- Boutique ---------- */
  let products: StoreProduct[] = [];
  const shopDeps = {
    demo: purchases.demo,
    price: (skin: StoreProduct['skin']) => products.find((p) => p.skin === skin)?.price,
    buyPremium: async (skin: StoreProduct['skin']) => {
      applyPurchase(w, skin, await purchases.purchase(skin).catch(() => 'error' as const));
      if (!isHidden('shop')) renderShop(w, shopTab, shopDeps);
    },
  };
  function showShop(from: 'menu' | 'over'): void {
    shopFrom = from;
    hide('menu', 'over');
    renderShop(w, shopTab, shopDeps);
    show('shop');
  }
  // Prix du store et achats déjà faits (réinstallation) : chargés en arrière-plan.
  void purchases.products().then((p) => { products = p; }).catch(() => {});
  void purchases.restore().then((ids) => { restoreSkins(w, ids); syncUI(); }).catch(() => {});
  document.querySelectorAll<HTMLButtonElement>('#shopTabs button').forEach((b) => {
    b.addEventListener('click', () => { shopTab = b.getAttribute('data-t') as ShopTab; renderShop(w, shopTab, shopDeps); });
  });
  $('openShop').addEventListener('click', () => showShop('menu'));
  $('overShop').addEventListener('click', () => showShop('over'));
  $('shopBack').addEventListener('click', () => { hide('shop'); show(shopFrom === 'over' ? 'over' : 'menu'); syncUI(); });
  $('devGold').addEventListener('click', () => { devAddGold(w); renderShop(w, shopTab, shopDeps); });
  $('devBtn').addEventListener('click', () => { toggleDev(w); syncUI(); });

  /* ---------- Succès ---------- */
  $('openAch').addEventListener('click', () => { hide('menu'); renderAch(w); show('ach'); });
  $('achBack').addEventListener('click', () => { hide('ach'); show('menu'); syncUI(); });
  $('achReset').addEventListener('click', () => { resetAchievements(w); renderAch(w); });

  /* ---------- Boucle ---------- */
  let last = 0;
  function frame(ts: number): void {
    const dt = frameDt(ts, last);
    last = ts;
    w.input = input.dir(w.activeControl);
    tick(w, dt);
    drawScene(screen, w);
    requestAnimationFrame(frame);
  }

  resize();
  applyI18n();
  requestAnimationFrame(() => { resize(); requestAnimationFrame(frame); });
}
