/**
 * Builds badges, and only badges backed by a real fact.
 * Each badge has a non-empty `reason`. No decorative or unverifiable badges.
 *
 * Explicitly forbidden:
 *  - "build passing" without real CI
 *  - "coverage X%" without a coverage report
 *  - decorative badges (PRs welcome, made with love, stars)
 *  - "downloads" without a verifiable source
 */

/**
 * Extracts owner/repo from a normalized GitHub URL.
 * @param {string|null} repoUrl
 * @returns {{ owner: string, repo: string }|null}
 */
function parseGitHubRepo(repoUrl) {
  if (!repoUrl) return null;
  const m = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

/**
 * @param {import('./model.js').ProjectInfo} info
 * @returns {import('./model.js').Badge[]}
 */
export function buildBadges(info) {
  const badges = [];

  // --- License (only when detected from the LICENSE file) ---
  if (info.license) {
    const color = info.license === 'MIT' ? 'blue'
      : info.license.startsWith('GPL') ? 'red'
      : info.license.startsWith('Apache') ? 'blue'
      : 'lightgrey';
    badges.push({
      label: 'license',
      imgUrl: `https://img.shields.io/badge/license-${encodeURIComponent(info.license)}-${color}`,
      linkUrl: 'LICENSE',
      reason: `LICENSE file present and identified as ${info.license}`,
    });
  }

  // --- Static version (only when version is known) ---
  // Static informational badge: do not pretend to know npm/PyPI online status.
  if (info.version) {
    badges.push({
      label: 'version',
      imgUrl: `https://img.shields.io/badge/version-${encodeURIComponent(info.version)}-informational`,
      linkUrl: null,
      reason: `Version ${info.version} declared in the manifest`,
    });
  }

  // --- CI / build (only when .github/workflows/ exists and the GitHub repo is known) ---
  if (info.hasCI && info.repoUrl) {
    const gh = parseGitHubRepo(info.repoUrl);
    if (gh) {
      const workflowFile = info.ciWorkflowFile ?? 'ci.yml';
      badges.push({
        label: 'CI',
        imgUrl: `https://img.shields.io/github/actions/workflow/status/${gh.owner}/${gh.repo}/${encodeURIComponent(workflowFile)}`,
        linkUrl: `${info.repoUrl}/actions`,
        reason: `CI workflow detected in .github/workflows/${workflowFile} and GitHub repository known`,
      });
    }
  }

  // --- Main language (only when languages is not empty) ---
  if (info.languages.length > 0) {
    const [lang] = info.languages[0];
    const colorMap = {
      JavaScript: 'yellow', TypeScript: '3178c6', Python: '3572A5',
      Rust: 'dea584', Go: '00ADD8', Ruby: '701516', PHP: '4F5D95',
      Java: 'b07219', 'C++': 'f34b7d', C: '555555', 'C#': '178600',
      Shell: '89e051', Kotlin: 'A97BFF', Swift: 'F05138',
    };
    const color = colorMap[lang] ?? 'lightgrey';
    badges.push({
      label: lang,
      imgUrl: `https://img.shields.io/badge/${encodeURIComponent(lang)}-${color}`,
      linkUrl: null,
      reason: `${lang} is the detected main language (${info.languages[0][1]} bytes)`,
    });
  }

  // --- Required runtime (node/python/etc.) when explicitly declared ---
  if (info.runtimeRequires) {
    const isNode = info.ecosystem === 'node';
    const isPy   = info.ecosystem === 'python';
    const label  = isNode ? 'node' : isPy ? 'python' : 'runtime';
    const color  = isNode ? '339933' : isPy ? '3572A5' : 'lightgrey';
    const ver    = encodeURIComponent(info.runtimeRequires.replace(/^(Node|Go|Rust)\s+/i, ''));
    badges.push({
      label: `${label} ${info.runtimeRequires}`,
      imgUrl: `https://img.shields.io/badge/${label}-${ver}-${color}`,
      linkUrl: null,
      reason: `Runtime requirement ${info.runtimeRequires} declared in the manifest`,
    });
  }

  return badges;
}
