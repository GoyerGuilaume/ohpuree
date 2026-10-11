import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface LifecycleHandlers {
  /** L'appli passe en arrière-plan (ou l'onglet est masqué). */
  onPause(): void;
  /** Bouton retour Android. */
  onBack(): void;
}

export function initLifecycle(h: LifecycleHandlers): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) h.onPause();
  });
  if (!Capacitor.isNativePlatform()) return;
  void App.addListener('pause', () => h.onPause());
  // Une fois ce listener posé, le retour ne ferme plus l'appli : c'est à nous de décider.
  void App.addListener('backButton', () => h.onBack());
}

export function exitApp(): void {
  void App.exitApp();
}
