/**
 * Scanner : parcourt un dépôt et agrège les signaux génériques
 * (langages, licence, CI, tests, contributing, examples, git remote, TODO/FIXME).
 *
 * Logique pure — aucune dépendance aux détecteurs ni à la CLI.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/** Taille max d'un fichier scanné ligne par ligne (TODO/FIXME). Au-delà : ignoré. */
const MAX_SCAN_BYTES = 1_000_000; // 1 Mo

/** Dossiers à ignorer entièrement lors du parcours. */
const IGNORE_DIRS = new Set([
  '.git', 'node_modules', '.venv', 'venv', '__pycache__',
  'dist', 'build', 'target', 'coverage', '.next', '.nuxt',
  '.cache', 'out', '.turbo',
]);

/** Mapping extension → nom de langage. */
const EXT_LANG = {
  '.js': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
  '.ts': 'TypeScript', '.mts': 'TypeScript', '.cts': 'TypeScript',
  '.jsx': 'JavaScript', '.tsx': 'TypeScript',
  '.py': 'Python',
  '.rs': 'Rust',
  '.go': 'Go',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.c': 'C', '.h': 'C',
  '.cpp': 'C++', '.cc': 'C++', '.cxx': 'C++', '.hpp': 'C++',
  '.cs': 'C#',
  '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell',
  '.html': 'HTML', '.htm': 'HTML',
  '.css': 'CSS', '.scss': 'CSS', '.sass': 'CSS',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
};

/** Mots-clés SPDX détectés dans le contenu du fichier LICENSE. */
const LICENSE_MARKERS = [
  { spdx: 'MIT', re: /\bMIT License\b/i },
  { spdx: 'Apache-2.0', re: /Apache License,?\s+Version 2\.0/i },
  { spdx: 'GPL-2.0', re: /GNU GENERAL PUBLIC LICENSE\s+Version 2/i },
  { spdx: 'GPL-3.0', re: /GNU GENERAL PUBLIC LICENSE\s+Version 3/i },
  { spdx: 'LGPL-2.1', re: /GNU LESSER GENERAL PUBLIC LICENSE\s+Version 2\.1/i },
  { spdx: 'LGPL-3.0', re: /GNU LESSER GENERAL PUBLIC LICENSE\s+Version 3/i },
  { spdx: 'BSD-2-Clause', re: /Redistribution and use in source and binary forms/i },
  { spdx: 'BSD-3-Clause', re: /Neither the name.*nor the names of its contributors/i },
  { spdx: 'ISC', re: /ISC License/i },
  { spdx: 'MPL-2.0', re: /Mozilla Public License Version 2\.0/i },
  { spdx: 'AGPL-3.0', re: /GNU AFFERO GENERAL PUBLIC LICENSE/i },
  { spdx: 'Unlicense', re: /This is free and unencumbered software/i },
];

/** Patterns indiquant la présence de tests. */
const TEST_PATTERNS = [
  /^tests?[\\/]/i,
  /^__tests__[\\/]/i,
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /_test\.go$/,
  /test_.*\.py$/,
  /\.test\.rs$/,
  /pytest\.ini$/, /setup\.cfg$/, /pyproject\.toml$/,
];

/** Patterns indiquant la présence de CI. */
const CI_PATTERN = /^\.github[\\/]workflows[\\/].+\.ya?ml$/i;

/**
 * Normalise une URL git remote vers https://github.com/owner/repo.
 * Gère les formats ssh (git@github.com:owner/repo.git) et https.
 * @param {string} raw
 * @returns {string|null}
 */
function normalizeGitUrl(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  // SSH: git@github.com:owner/repo.git
  const ssh = trimmed.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
  if (ssh) return `https://${ssh[1]}/${ssh[2]}`;
  // HTTPS: https://github.com/owner/repo(.git)
  const https = trimmed.match(/^https?:\/\/.+?(?:\.git)?$/);
  if (https) return trimmed.replace(/\.git$/, '');
  return null;
}

/**
 * Récupère l'URL du remote git origin (tolère l'absence de git / non-repo).
 * @param {string} rootPath
 * @returns {string|null}
 */
function getGitRemoteUrl(rootPath) {
  try {
    const raw = execFileSync('git', ['config', '--get', 'remote.origin.url'], {
      cwd: rootPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 3000,
    });
    return normalizeGitUrl(raw);
  } catch {
    return null;
  }
}

/**
 * Détecte le SPDX à partir du contenu d'un fichier LICENSE.
 * @param {string} content
 * @returns {string|null}
 */
function detectLicense(content) {
  for (const { spdx, re } of LICENSE_MARKERS) {
    if (re.test(content)) return spdx;
  }
  return null;
}

/**
 * Parcourt le repo de façon récursive et collecte les signaux.
 *
 * @param {string} rootPath  chemin absolu du dépôt
 * @returns {Promise<{
 *   languages: Array<[string, number]>,
 *   license: string|null,
 *   hasCI: boolean,
 *   hasTests: boolean,
 *   hasContributing: boolean,
 *   examples: string[],
 *   repoUrl: string|null,
 *   todos: string[],
 * }>}
 */
export async function scan(rootPath) {
  const langBytes = {};   // lang → octets
  let license = null;
  let hasCI = false;
  let hasTests = false;
  let hasContributing = false;
  const examples = [];
  const todos = [];

  /**
   * Visite récursive.
   * @param {string} dir
   * @param {string} rel  chemin relatif depuis rootPath
   */
  async function walk(dir, rel) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // dossier illisible → on ignore
    }

    for (const entry of entries) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        // Détecter examples/ et demo/
        if (/^(examples?|demo)$/i.test(entry.name)) {
          const sub = await fs.readdir(path.join(dir, entry.name)).catch(() => []);
          for (const f of sub) examples.push(`${relPath}/${f}`);
        }
        await walk(path.join(dir, entry.name), relPath);
        continue;
      }

      if (!entry.isFile()) continue;

      // CI
      if (CI_PATTERN.test(relPath)) hasCI = true;

      // Tests
      if (!hasTests && TEST_PATTERNS.some(p => p.test(relPath))) hasTests = true;

      // Contributing
      if (/^CONTRIBUTING(\.md)?$/i.test(entry.name)) hasContributing = true;

      // LICENSE
      if (/^LICENSE(\.md|\.txt)?$/i.test(entry.name) && license === null) {
        const content = await fs.readFile(path.join(dir, entry.name), 'utf8').catch(() => null);
        if (content) license = detectLicense(content);
      }

      // Langages (compter les octets des fichiers source)
      const ext = path.extname(entry.name).toLowerCase();
      const lang = EXT_LANG[ext];
      if (lang) {
        const stat = await fs.stat(path.join(dir, entry.name)).catch(() => null);
        if (stat) langBytes[lang] = (langBytes[lang] ?? 0) + stat.size;

        // TODO/FIXME — uniquement les VRAIS marqueurs de commentaire (`TODO:` / `FIXME:`),
        // pas n'importe quelle ligne contenant le mot. Précision > exhaustivité :
        // mieux vaut rater un TODO que polluer la roadmap avec des faux positifs.
        // On saute les gros fichiers (minifiés/générés) : pas de TODO utile + coût mémoire.
        if (todos.length < 20 && stat && stat.size <= MAX_SCAN_BYTES) {
          const content = await fs.readFile(path.join(dir, entry.name), 'utf8').catch(() => null);
          if (content) {
            for (const line of content.split('\n')) {
              if (todos.length >= 20) break;
              // Doit ressembler à un commentaire : marqueur de commentaire + TODO/FIXME + ':'
              const m = line.match(/(?:\/\/|#|\*|<!--|;)\s*(TODO|FIXME)\b\s*:\s*(.+)/i);
              if (m) {
                const text = m[2].trim().replace(/\s*(\*\/|-->)\s*$/, '').slice(0, 100);
                const todo = `${m[1].toUpperCase()}: ${text}`;
                if (!todos.includes(todo)) todos.push(todo);
              }
            }
          }
        }
      }
    }
  }

  await walk(rootPath, '');

  // Trier les langages par octets décroissants
  const languages = Object.entries(langBytes)
    .sort((a, b) => b[1] - a[1]);

  const repoUrl = getGitRemoteUrl(rootPath);

  return { languages, license, hasCI, hasTests, hasContributing, examples, repoUrl, todos };
}
