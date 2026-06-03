/**
 * Generic detector: final fallback.
 * Uses the folder name, git remote when available, and git clone instructions.
 * @type {import('./base.js').Detector}
 */
import path from 'node:path';

export default {
  ecosystem: 'generic',

  async matches(rootPath) {
    return true; // fallback: always applies
  },

  async enrich(info, rootPath) {
    // name = folder name when not already set
    if (!info.name || info.name === '') {
      info.name = path.basename(rootPath) || 'project';
    }

    info.ecosystem = 'generic';

    // Install command: git clone when repoUrl is known.
    if (info.repoUrl) {
      info.installCmd = `git clone ${info.repoUrl}`;
    } else {
      info.installCmd = `git clone <repo-url>`;
    }

    // Usage example: generic default.
    if (!info.usageExample) {
      info.usageExample = 'See README for usage instructions.';
    }
  },
};
