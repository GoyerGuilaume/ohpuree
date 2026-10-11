import './styles.css';
import { startApp } from './app';
import { loadSave } from './platform/storage';

// La sauvegarde est lue (asynchrone sur mobile) avant de démarrer le jeu.
startApp(await loadSave());
