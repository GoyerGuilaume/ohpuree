/** Équilibrage du mode scindé (à ajuster ici). Valeurs identiques au prototype. */
export const TUNE = {
  /** Vitesse de chute selon le nombre de morceaux (1 à 4). */
  pieceSpeed: [1, 0.92, 0.85, 0.78],
  /** Ralenti à chaque coupe : -40 % puis retour progressif sur 1,6 s. */
  splitPulse: 0.4,
  splitDur: 1.6,
  /** Petit ralenti à la fusion, pour adoucir le retour à l'entier. */
  mergePulse: 0.2,
  mergeDur: 0.8,
  /** Chance de beurre par rangée quand on est scindé. */
  butterRow: 0.22,
  /** Distance du beurre garanti après une coupe. */
  butterFirst: 560,
} as const;

/** Nombre maximal de morceaux. */
export const MAXP = 4;

/** Longueur d'un décor (6000 unités = 100 m). */
export const BIOME_LEN = 6000;
