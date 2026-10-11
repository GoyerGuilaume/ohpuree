import { DEV_TOOLS } from './env';

// Socle (étape 1) : le jeu sera porté ici aux étapes suivantes.
const stage = document.getElementById('stage');
if (stage) stage.textContent = `Oh purée ! — socle Vite + TypeScript${DEV_TOOLS ? ' (outils de dev)' : ''}`;
