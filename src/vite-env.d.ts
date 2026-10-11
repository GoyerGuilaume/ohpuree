/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" affiche les outils de dev (bouton mode dev, +1000 golds, hitbox). Voir .env.example. */
  readonly VITE_DEV_TOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
