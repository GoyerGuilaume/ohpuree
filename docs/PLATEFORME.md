# Couche plateforme (`src/platform/`)

Chaque module marche dans le navigateur (repli web) et dans l'appli Capacitor.

| Module | Mobile (Capacitor) | Navigateur |
|---|---|---|
| `storage.ts` | `@capacitor/preferences` | `@capacitor/preferences` (stocke dans `localStorage`, clé `CapacitorStorage.pdp_v1`) |
| `haptics.ts` | Android : vibration de la durée demandée ; iOS : retour haptique léger / moyen / fort selon la durée | `navigator.vibrate` |
| `motion.ts` | API web `deviceorientation` | idem |
| `lifecycle.ts` | `@capacitor/app` : pause en arrière-plan, bouton retour Android | `visibilitychange` |
| `purchases.ts` | implémentation factice (à remplacer) | idem |

## Sauvegarde

- Format inchangé (`pdp_v1`, voir `src/game/profile.ts`).
- Lecture asynchrone **avant** le démarrage du jeu (`src/main.ts`).
- Migration : si Preferences est vide, l'ancienne sauvegarde `localStorage` `pdp_v1`
  (prototype, version web) est reprise et recopiée.
- Les écritures sont faites dans l'ordre ; une erreur de stockage n'interrompt pas le jeu.

## Inclinaison : pas de `@capacitor/motion`

`@capacitor/motion` ne contient aucun code natif : c'est une enveloppe de la même API web
`deviceorientation` que le jeu utilise déjà. Il n'apporterait rien.

- Android (WebView) : l'inclinaison marche sans permission.
- iOS : `DeviceOrientationEvent.requestPermission()` est appelé pendant le clic sur « Jouer »
  (geste utilisateur obligatoire). Refus ou capteur muet après 1,6 s → contrôle tactile, avec
  un message.

## Bouton retour Android

| Écran | Retour |
|---|---|
| En jeu / compte à rebours | pause |
| Pause | reprise (compte à rebours) |
| Boutique / succès | fermer (retour à l'écran précédent) |
| Fin de partie | menu |
| Menu | quitter l'appli |

## Achats intégrés (skins premium)

`purchases.ts` définit l'interface `Purchases` (`products`, `purchase`, `restore`) et une
implémentation factice qui reproduit le prototype : bouton « Essayer · 2,99 € », skin équipé
pour la session, message « Mode démo ».

Avec une vraie implémentation (`demo: false`) : le bouton devient « Acheter · prix du store »,
un achat réussi rend le skin possédé et le sauvegarde, et les achats sont restaurés au
démarrage.

À décider avant de créer les produits dans les stores (un identifiant ne peut pas être
réutilisé) : les identifiants de produits, proposés dans `PRODUCT_IDS`
(`skin_cape`, `skin_stone`, `skin_magnet`).
