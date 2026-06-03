/**
 * Détecteur générique — fallback final.
 * Utilise le nom du dossier, git remote (si dispo), instructions git clone.
 * @type {import('./base.js').Detector}
 */
import path from 'node:path';

export default {
  ecosystem: 'generic',

  async matches(rootPath) {
    return true; // fallback : toujours applicable
  },

  async enrich(info, rootPath) {
    // name = nom du dossier si pas déjà défini
    if (!info.name || info.name === '') {
      info.name = path.basename(rootPath) || 'project';
    }

    info.ecosystem = 'generic';

    // Install command : git clone si repoUrl connu
    if (info.repoUrl) {
      info.installCmd = `git clone ${info.repoUrl}`;
    } else {
      info.installCmd = `git clone <repo-url>`;
    }

    // Usage example : défaut générique
    if (!info.usageExample) {
      info.usageExample = 'See README for usage instructions.';
    }
  },
};
