/**
 * Construit les badges — UNIQUEMENT ceux adossés à un fait réel.
 * Chaque badge porte un `reason` non vide. Aucun badge décoratif ou non vérifiable.
 *
 * Interdits explicites :
 *  - "build passing" sans CI réelle
 *  - "coverage X%" sans rapport de couverture
 *  - badges décoratifs (PRs welcome, made with love, stars)
 *  - "downloads" sans source vérifiable
 */

/**
 * Extrait owner/repo depuis une URL GitHub normalisée.
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

  // --- Licence (uniquement si détectée depuis le fichier LICENSE) ---
  if (info.license) {
    const color = info.license === 'MIT' ? 'blue'
      : info.license.startsWith('GPL') ? 'red'
      : info.license.startsWith('Apache') ? 'blue'
      : 'lightgrey';
    badges.push({
      label: 'license',
      imgUrl: `https://img.shields.io/badge/license-${encodeURIComponent(info.license)}-${color}`,
      linkUrl: 'LICENSE',
      reason: `Fichier LICENSE présent et identifié comme ${info.license}`,
    });
  }

  // --- Version statique (uniquement si version connue) ---
  // Badge statique informational — on ne prétend pas connaître npm/PyPI en ligne.
  if (info.version) {
    badges.push({
      label: 'version',
      imgUrl: `https://img.shields.io/badge/version-${encodeURIComponent(info.version)}-informational`,
      linkUrl: null,
      reason: `Version ${info.version} déclarée dans le manifeste`,
    });
  }

  // --- CI / build (uniquement si .github/workflows/ présent ET repo GitHub connu) ---
  if (info.hasCI && info.repoUrl) {
    const gh = parseGitHubRepo(info.repoUrl);
    if (gh) {
      badges.push({
        label: 'CI',
        imgUrl: `https://img.shields.io/github/actions/workflow/status/${gh.owner}/${gh.repo}/ci.yml`,
        linkUrl: `${info.repoUrl}/actions`,
        reason: `Workflow CI détecté dans .github/workflows/ et dépôt GitHub connu`,
      });
    }
  }

  // --- Langage principal (uniquement si languages non vide) ---
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
      reason: `${lang} est le langage principal détecté (${info.languages[0][1]} octets)`,
    });
  }

  // --- Runtime requis (node/python/etc.) si explicitement déclaré ---
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
      reason: `Requirement runtime ${info.runtimeRequires} déclaré dans le manifeste`,
    });
  }

  return badges;
}
