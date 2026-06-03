/**
 * Scanner: walks a repository and aggregates generic signals
 * (languages, license, CI, tests, contributing, examples, git remote, TODO/FIXME).
 *
 * Pure logic, with no dependency on detectors or the CLI.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/** Max size for a file scanned line by line (TODO/FIXME). Larger files are ignored. */
const MAX_SCAN_BYTES = 1_000_000; // 1 Mo

/** Directories to ignore entirely while walking. */
const IGNORE_DIRS = new Set([
  '.git', 'node_modules', '.venv', 'venv', '__pycache__',
  'dist', 'build', 'target', 'coverage', '.next', '.nuxt',
  '.cache', 'out', '.turbo',
]);

/** Extension -> language name mapping. */
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

/** SPDX keywords detected in LICENSE file content. */
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

/** Patterns indicating test presence. */
const TEST_PATTERNS = [
  /^tests?[\\/]/i,
  /^__tests__[\\/]/i,
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /_test\.go$/,
  /test_.*\.py$/,
  /\.test\.rs$/,
  /pytest\.ini$/, /setup\.cfg$/, /pyproject\.toml$/,
];

/** Patterns indicating CI presence. */
const CI_PATTERN = /^\.github[\\/]workflows[\\/].+\.ya?ml$/i;

/**
 * Normalizes a git remote URL to https://github.com/owner/repo.
 * Handles ssh (git@github.com:owner/repo.git) and https formats.
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
 * Gets the git origin remote URL (tolerates missing git / non-repositories).
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
 * Detects the SPDX identifier from LICENSE file content.
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
 * Recursively walks the repository and collects signals.
 *
 * @param {string} rootPath  absolute repository path
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
  const langBytes = {};   // lang -> bytes
  let license = null;
  let hasCI = false;
  let ciWorkflowFile = null;  // name of the first detected workflow file
  let hasTests = false;
  let hasContributing = false;
  const examples = [];
  const todos = [];

  /**
   * Recursive visit.
   * @param {string} dir
   * @param {string} rel  path relative to rootPath
   */
  async function walk(dir, rel) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // unreadable directory: ignore it
    }

    for (const entry of entries) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        // Detect example/demo/assets/docs directories.
        if (/^(examples?|demo|demos|assets|docs?)$/i.test(entry.name)) {
          const sub = await fs.readdir(path.join(dir, entry.name)).catch(() => []);
          for (const f of sub) examples.push(`${relPath}/${f}`);
        }
        await walk(path.join(dir, entry.name), relPath);
        continue;
      }

      if (!entry.isFile()) continue;

      // CI: keep the first workflow name for the badge.
      if (CI_PATTERN.test(relPath)) {
        hasCI = true;
        if (!ciWorkflowFile) ciWorkflowFile = entry.name;
      }

      // Tests
      if (!hasTests && TEST_PATTERNS.some(p => p.test(relPath))) hasTests = true;

      // Contributing
      if (/^CONTRIBUTING(\.md)?$/i.test(entry.name)) hasContributing = true;

      // Demo files at the root (demo.tape, demo.sh, demo.gif, *.tape...).
      if (!rel && /^demo\.|\.tape$/i.test(entry.name)) {
        examples.push(entry.name);
      }

      // LICENSE
      if (/^LICENSE(\.md|\.txt)?$/i.test(entry.name) && license === null) {
        const content = await fs.readFile(path.join(dir, entry.name), 'utf8').catch(() => null);
        if (content) license = detectLicense(content);
      }

      // Languages (count source file bytes).
      const ext = path.extname(entry.name).toLowerCase();
      const lang = EXT_LANG[ext];
      if (lang) {
        const stat = await fs.stat(path.join(dir, entry.name)).catch(() => null);
        if (stat) langBytes[lang] = (langBytes[lang] ?? 0) + stat.size;

        // TODO/FIXME: only real comment markers (`TODO:` / `FIXME:`), not any line
        // containing the word. Precision beats exhaustiveness: it is better to miss
        // a TODO than pollute the roadmap with false positives.
        // Skip large generated/minified files: little useful TODO value, higher memory cost.
        if (todos.length < 20 && stat && stat.size <= MAX_SCAN_BYTES) {
          const content = await fs.readFile(path.join(dir, entry.name), 'utf8').catch(() => null);
          if (content) {
            for (const line of content.split('\n')) {
              if (todos.length >= 20) break;
              // Must look like a comment: comment marker + TODO/FIXME + ':'.
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

  // Sort languages by descending byte count.
  const languages = Object.entries(langBytes)
    .sort((a, b) => b[1] - a[1]);

  const repoUrl = getGitRemoteUrl(rootPath);

  return { languages, license, hasCI, ciWorkflowFile, hasTests, hasContributing, examples, repoUrl, todos };
}
