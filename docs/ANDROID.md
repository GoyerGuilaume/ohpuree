# Android : installer l'appli de test sur ton téléphone (Windows)

Prérequis déjà faits dans le dépôt : projet Capacitor 8 (`android/`), orientation portrait
verrouillée, appId **provisoire** `com.ohpuree.test`.

## 1. Installer Android Studio (une seule fois)

1. Télécharge Android Studio (version stable la plus récente) :
   <https://developer.android.com/studio>. Capacitor 8 demande au minimum Android Studio
   Otter (2025.2.1).
2. Installation standard : l'assistant installe le SDK Android et un JDK. Garde les choix
   par défaut.

## 2. Préparer le projet (à chaque mise à jour du code)

Dans PowerShell, à la racine du projet :

```powershell
git pull
npm ci              # seulement si package.json a changé
npm run android     # build du jeu + copie dans le projet Android
```

## 3. Ouvrir dans Android Studio

- `npm run android:open`, ou dans Android Studio : **File > Open** → choisir le dossier
  `android` du projet (pas la racine).
- Attends la fin de la **synchronisation Gradle** (barre en bas ; la première fois : plusieurs
  minutes). Si Android Studio propose d'installer un SDK ou une mise à jour Gradle **du
  SDK** (« Install missing platform »), accepte. Refuse en revanche l'« AGP Upgrade
  Assistant » : la version est fixée par Capacitor.

## 4a. Lancer directement sur le téléphone (câble USB, recommandé)

1. Sur le téléphone : **Paramètres > À propos du téléphone** → touche 7 fois **Numéro de
   build** → les « Options pour les développeurs » apparaissent.
2. **Paramètres > Système > Options pour les développeurs** → active **Débogage USB**.
3. Branche le téléphone au PC, accepte « Autoriser le débogage USB ».
4. Dans Android Studio, choisis ton téléphone dans la liste des appareils (en haut), puis
   **Run ▶**. L'appli s'installe et se lance.

## 4b. Ou fabriquer un fichier APK à installer à la main

1. **Build > Build App Bundle(s) / APK(s) > Build APK(s)**.
2. Clique **locate** dans la notification : le fichier est
   `android\app\build\outputs\apk\debug\app-debug.apk`.
3. Envoie-le sur le téléphone (câble, Google Drive, mail…), ouvre-le, autorise
   « Installer des applis inconnues » pour l'appli qui l'ouvre (Fichiers, Drive…).
4. Play Protect peut avertir (appli de développeur inconnu) : **Installer quand même**.

## Quoi tester sur le téléphone

- Inclinaison (choisir « Inclinaison » dans le menu) et contrôle tactile
- Vibrations, son
- Bouton retour : pause → reprise ; boutique/succès → fermer ; fin de partie → menu ;
  menu → quitter
- Passer sur l'écran d'accueil pendant une partie → le jeu doit être en pause au retour
- Fermer l'appli puis la rouvrir → record, golds, skins conservés
- Rotation de l'écran bloquée en portrait
- Affichage : emojis, encoche / barre de navigation, fluidité

## Problèmes fréquents

- **« Gradle JDK » / erreur de version Java** : **Settings > Build, Execution, Deployment >
  Build Tools > Gradle > Gradle JDK** → choisis le JDK d'Android Studio (jbr-21).
- **« App not installed »** : une version signée différemment est déjà installée →
  désinstalle-la d'abord.
- **Le jeu affiché est ancien** : relance `npm run android` avant **Run**.
- Les outils de dev apparaissent si `.env.local` contient `VITE_DEV_TOOLS=true` au moment du
  `npm run android`.

## Changer l'appId (avant toute publication)

L'appId `com.ohpuree.test` est provisoire. Quand l'identifiant définitif est choisi :

1. `capacitor.config.ts` : `appId`.
2. `android/app/build.gradle` : `applicationId` (le `namespace`, nom du code Java, peut rester).
3. `android/app/src/main/res/values/strings.xml` : `package_name` et `custom_url_scheme`.
4. `npm run android`.

L'appli de test et l'appli définitive seront alors deux applis distinctes sur le téléphone
(désinstalle la version de test). Une fois publiée sur le Play Store, l'appId ne peut plus
changer.
