Tu travailles sur « Oh purée ! », un jeu mobile de chute infinie. Lis d'abord CLAUDE.md, puis legacy/ohpureeV0.html (la source de vérité du gameplay).

Pour reprendre le travail : l'état d'avancement, les décisions prises et ce qui reste à faire sont dans docs/ETAT.md.

Objectif : migrer ce prototype mono-fichier vers un vrai projet Vite + TypeScript (strict), SANS changer le gameplay ni l'équilibrage, puis l'empaqueter avec Capacitor 8 pour Android et préparer iOS. Je développe sous Windows.

Procède par étapes. À la fin de chaque étape, arrête-toi et résume en français ce qui a été fait et ce que je dois vérifier avant de continuer.

Étape 0 — Plan (ne code rien encore) : lis le fichier legacy, propose l'arborescence des modules, la stratégie de tests et les risques. Attends mon accord.

Étape 1 — Socle : Vite + TypeScript strict + ESLint + Vitest ; scripts dev / build / test / lint ; .gitignore (y compris keystores et secrets) ; premier commit.

Étape 2 — Données et i18n : extraire items, skins, bonus, succès, biomes et TUNE en modules typés ; textes dans 4 fichiers (fr, en, es, de) avec clés typées ; test de complétude (4 langues, mêmes placeholders).

Étape 3 — Logique du jeu : fonctions pures + tests unitaires pour les invariants listés dans CLAUDE.md (ralenti à la coupe et à la fusion, règle du bonus légendaire avec skin premium, prix avec Économe, pause et compte à rebours, multiplicateur de golds).

Étape 4 — Rendu canvas et UI DOM : portage à l'identique (couteaux, roulettes à pizza, 13 décors, HUD, pause, boutique, succès, mode dev avec hitbox).

Étape 5 — Couche plateforme avec repli web, pour que la version navigateur continue de marcher : stockage (@capacitor/preferences), vibrations (@capacitor/haptics), inclinaison (permission iOS dans un geste utilisateur, repli tactile, @capacitor/motion seulement si nécessaire), pause automatique (@capacitor/app, bouton retour Android), interface purchases.ts avec une implémentation factice.

Étape 6 — Capacitor 8 + Android : init (demande-moi l'appId), add android, icônes et splash (@capacitor/assets), portrait verrouillé, build debug que je peux lancer sur mon téléphone ; documente les étapes Android Studio.

Étape 7 — iOS sans Mac : essaie « npx cap add ios » et « npx cap sync ios » depuis Windows. Si ça marche, committe le dossier ios/. Écris docs/MAC-BUILD.md : le pas à pas minimal pour le Mac de ma compagne (vérification macOS/Xcode avant toute installation, signature automatique, Archive, envoi vers App Store Connect). Si ça ne marche pas, dis-moi précisément ce qu'il faudra faire sur le Mac.

Règles : aucun changement de gameplay ou d'équilibrage ; pas de dépendance superflue ; commits petits et fréquents ; explique tes choix non évidents ; demande-moi avant toute décision irréversible (identifiant d'application, nom de package).