# État du projet (mémo de reprise)

Dernière mise à jour : 11 octobre 2026.

Plan complet : voir `CLAUDE.md`. Pour reprendre avec Claude : « Lis CLAUDE.md et
docs/ETAT.md, puis reprends là où on s'est arrêtés ».

## Avancement

| Étape | État |
|---|---|
| 0 — Plan | ✅ |
| 1 — Socle Vite + TS strict + ESLint + Vitest | ✅ |
| 2 — Données typées + i18n (fr, en, es, de) | ✅ |
| 3 — Logique pure + tests (dont test différentiel contre le legacy) | ✅ |
| 4 — Rendu canvas + UI DOM (vérifié au pixel près contre le legacy) | ✅ |
| 5 — Couche plateforme (Preferences, Haptics, App, achats factices) | ✅ |
| 6 — Capacitor + Android | 🟡 en partie : projet `android/` créé, portrait verrouillé, appId **provisoire**. Reste : appId définitif, icônes et splash, essai sur téléphone |
| 7 — iOS sans Mac | ⏳ pas commencé |

## Décisions prises

- Titre : « Oh purée ! » dans les 4 langues.
- Mode dev visible seulement avec `VITE_DEV_TOOLS=true` dans `.env.local`.
- TypeScript 6.0 (typescript-eslint ne prend pas encore en charge TypeScript 7).
- Sauvegarde : format `pdp_v1` inchangé, migration automatique depuis `localStorage`.
- `@capacitor/motion` non utilisé (simple enveloppe de l'API web déjà utilisée).
- Bouton retour Android : voir `docs/PLATEFORME.md`.
- Particularités du legacy conservées : voir `docs/LEGACY-NOTES.md`.

## En attente de toi

- **Micro-entreprise** → nom → **appId définitif** (format `com.nomentreprise.ohpuree` ou
  domaine inversé si tu as un site). Procédure de changement : `docs/ANDROID.md`.
- **Comptes** : Google Play Console (25 $ une fois) et Apple Developer Program
  (99 $/an), au nom de la micro-entreprise.
- **Icône** de l'appli (image carrée 1024×1024, et si possible une version sans fond pour
  l'icône adaptative Android) : nécessaire pour `@capacitor/assets`.
- Valider le comportement du **bouton retour** Android.
- Plus tard : **identifiants des produits** des skins premium (proposés : `skin_cape`,
  `skin_stone`, `skin_magnet`), puis choix de la bibliothèque d'achats réels.

## Prochaines actions

1. Toi : installer l'APK de test (`docs/ANDROID.md`) et noter ce qui cloche.
2. Étape 6 : appId définitif, icônes/splash, build debug validé sur téléphone.
3. Étape 7 : `npx cap add ios` depuis Windows, `docs/MAC-BUILD.md`.

## Points techniques à savoir

- Sous Windows : Node ≥ 22.13 obligatoire ; si PowerShell bloque `npm`, voir
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- `npm test` : 82 tests, dont le test différentiel contre le prototype (~5 s).
- `npm audit` : 3 alertes modérées dans l'outillage du CLI Capacitor (`uuid` via `xcode`),
  sans impact sur l'appli ; à revoir lors d'une mise à jour de Capacitor.
- La vérification visuelle au pixel près (Playwright + Chromium) n'est pas dans le dépôt
  (dépendance lourde) ; elle peut être refaite au besoin.
