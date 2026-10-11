/** Outils de dev (mode dev, hitbox…) : activés seulement si VITE_DEV_TOOLS=true dans .env.local. */
export const DEV_TOOLS = import.meta.env.VITE_DEV_TOOLS === 'true';
