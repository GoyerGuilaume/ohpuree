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

## Détails techniques du portage

- Les noms des paliers de bonus (`Commun`, `Rare`…) n'étaient jamais affichés : ils sont
  devenus des identifiants internes (`common`, `rare`…), sans traduction.
- Les décors n'avaient pas d'identifiant : ils en ont reçu un (`field`, `truck`… `void`)
  pour nommer leurs clés de traduction.
- `src/data/legacy-parity.test.ts` relit le fichier legacy et vérifie que données, TUNE et
  textes sont identiques.
