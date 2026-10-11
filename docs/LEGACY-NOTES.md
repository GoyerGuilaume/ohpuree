# Notes sur le portage du prototype legacy

Source de vérité du gameplay : `legacy/ohpureeV0.html`.
Règle : aucun changement de gameplay ni d'équilibrage. Les particularités ci-dessous sont
**conservées volontairement** ; toute correction doit être une décision explicite, faite à part.

## Changements volontaires (validés)

- Titre du jeu : « Pas de purée ! » → « Oh purée ! », identique dans les 4 langues.
- Le mode dev (boutique gratuite, +1000 golds, hitbox, réinitialisation des succès) n'est
  disponible que si `VITE_DEV_TOOLS=true` dans `.env.local`.

## Particularités conservées

- `tr()` ne remplace que la **première** occurrence de chaque placeholder `{n}`.
- Une langue inconnue passée à `setLang` retombe sur le français, mais la détection
  automatique (`detectLang`) retombe sur l'anglais.
- Sauce piquante : la description annonce « les golds comptent ×3 », mais le multiplicateur
  ajoute +2 (×3 seule ; avec la sauce poivre : 1 + 1 + 2 = ×4, et non ×6).
- Le réglage « hitbox » du mode dev n'est pas sauvegardé.
- Les prix des skins premium sont des chaînes fixes au format français (`'2,99 €'`) ;
  ils seront remplacés par les prix du store avec la couche d'achats.

- Compte à rebours : à l'instant exact de la reprise, `ceil(2,1 / 0,7)` vaut 4 (arrondi
  flottant), mais ce chiffre n'est jamais dessiné car chaque frame avance le temps avant de
  dessiner. On voit donc bien 3, 2, 1.

## Détails techniques du portage

- Les noms des paliers de bonus (`Commun`, `Rare`…) n'étaient jamais affichés : ils sont
  devenus des identifiants internes (`common`, `rare`…), sans traduction.
- Les décors n'avaient pas d'identifiant : ils en ont reçu un (`field`, `truck`… `void`)
  pour nommer leurs clés de traduction.
- `src/data/legacy-parity.test.ts` relit le fichier legacy et vérifie que données, TUNE et
  textes sont identiques.
- `src/game/legacy-diff.test.ts` exécute le script legacy dans Node (faux DOM minimal) en
  parallèle du portage, avec la même suite aléatoire seedée, les mêmes pas de temps et les
  mêmes entrées : l'état complet, les sons, vibrations, toasts et la sauvegarde doivent rester
  identiques à chaque frame. Le tremblement d'écran tire au hasard pendant le dessin ; dans le
  portage il utilisera un générateur à part, donc le legacy est patché pour ne pas le tirer.
- La logique (`src/game/`) ne touche ni au DOM ni à `Math.random` : elle reçoit un générateur
  aléatoire et un objet `Fx` (son, vibration, toast, sauvegarde…) que l'UI implémente.
- Les particules restent dans l'état du jeu et utilisent le générateur de la logique, comme
  dans le prototype : c'est ce qui permet la comparaison au bit près.
- Une sauvegarde dont un réglage a une valeur inconnue (ex. `mode: "turbo"`) garde la valeur
  par défaut, au lieu de la recopier telle quelle.
