/**
 * Rend chaque section du README.
 * Données absentes → stub balisé `<!-- TODO(nosuckreadme): ... -->`, jamais du faux contenu.
 * Rendu déterministe : même entrée → même sortie.
 */

const STUB = (what) => `<!-- TODO(nosuckreadme): ${what} -->`;

// ── Helpers ────────────────────────────────────────────────────────────────

function badgeLine(badges) {
  if (!badges || badges.length === 0) return null;
  return badges
    .map((b) => {
      const img = `![${b.label}](${b.imgUrl})`;
      return b.linkUrl ? `[${img}](${b.linkUrl})` : img;
    })
    .join(' ');
}

function codeBlock(lang, content) {
  return `\`\`\`${lang}\n${content}\n\`\`\``;
}

// ── Sections ───────────────────────────────────────────────────────────────

function sectionTitle(info) {
  const title = `# ${info.name || 'project'}`;
  const desc = info.description
    ? `\n\n${info.description}`
    : `\n\n${STUB('ajoute une description courte du projet')}`;
  return { id: 'title', markdown: title + desc };
}

function sectionBadges(info) {
  const line = badgeLine(info.badges);
  if (!line) return null;
  return { id: 'badges', markdown: line };
}

function sectionInstallation(info) {
  const cmd = info.installCmd
    ? codeBlock('sh', info.installCmd)
    : STUB('commande d\'installation');
  return {
    id: 'installation',
    markdown: `## Installation\n\n${cmd}`,
  };
}

function sectionUsage(info) {
  const lines = [];

  if (info.usageExample) {
    lines.push(codeBlock('sh', info.usageExample));
  } else {
    lines.push(STUB('exemple d\'utilisation basique'));
  }

  if (info.entrypoints.length > 0) {
    lines.push('\n**Commandes disponibles :**\n');
    lines.push('| Commande | Cible |');
    lines.push('|----------|-------|');
    for (const ep of info.entrypoints) {
      lines.push(`| \`${ep.name}\` | \`${ep.target}\` |`);
    }
  }

  return { id: 'usage', markdown: `## Usage\n\n${lines.join('\n')}` };
}

function sectionExamples(info) {
  const lines = [];

  if (info.examples.length > 0) {
    for (const ex of info.examples.slice(0, 5)) {
      lines.push(`- [\`${ex}\`](${ex})`);
    }
  } else {
    lines.push(STUB('ajoute un ou deux exemples concrets'));
    lines.push('\n```sh\n# exemple\n```');
  }

  return { id: 'examples', markdown: `## Exemples\n\n${lines.join('\n')}` };
}

function sectionRoadmap(info) {
  const items = info.todos.length > 0
    ? info.todos.slice(0, 10).map((t) => `- [ ] ${t}`)
    : [`- [ ] ${STUB('ajoute les prochaines étapes')}`];

  return { id: 'roadmap', markdown: `## Roadmap\n\n${items.join('\n')}` };
}

function sectionLimitations(info) {
  const items = [...info.limitations];

  if (!info.hasTests) {
    items.push('Pas de suite de tests pour le moment.');
  }
  if (info.todos.length > 10) {
    items.push(`Code en évolution active (${info.todos.length} TODO/FIXME ouverts).`);
  }
  if (info.ecosystem !== 'generic' && items.length === 0) {
    items.push(STUB('liste les limites connues de ce projet'));
  }

  if (items.length === 0) return null;

  const lines = items.map((l) => `- ${l}`);
  return {
    id: 'limitations',
    markdown: `## Limites connues\n\n${lines.join('\n')}`,
  };
}

function sectionContributing(info) {
  if (!info.hasContributing) return null;
  return {
    id: 'contributing',
    markdown: `## Contributing\n\nVoir [CONTRIBUTING](CONTRIBUTING.md) pour les instructions.`,
  };
}

function sectionLicense(info) {
  const body = info.license
    ? `Distribué sous licence [${info.license}](LICENSE).`
    : STUB('précise la licence du projet');
  return { id: 'license', markdown: `## Licence\n\n${body}` };
}

// ── Table of contents (générée si ≥ 6 sections) ───────────────────────────

function sectionToc(sections) {
  const skip = new Set(['title', 'badges', 'toc']);
  const entries = sections
    .filter((s) => !skip.has(s.id))
    .map((s) => {
      const heading = s.markdown.match(/^##\s+(.+)$/m)?.[1] ?? s.id;
      const anchor = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `- [${heading}](#${anchor})`;
    });
  if (entries.length < 6) return null;
  return { id: 'toc', markdown: `## Table des matières\n\n${entries.join('\n')}` };
}

// ── Assemblage ─────────────────────────────────────────────────────────────

/**
 * Construit les sections dans l'ordre défini. Retourne uniquement les non-null.
 * @param {import('./model.js').ProjectInfo} info
 * @returns {Array<{ id: string, markdown: string }>}
 */
export function buildSections(info) {
  // Premier passage : sections sans TOC
  const raw = [
    sectionTitle(info),
    sectionBadges(info),
    sectionInstallation(info),
    sectionUsage(info),
    sectionExamples(info),
    sectionRoadmap(info),
    sectionLimitations(info),
    sectionContributing(info),
    sectionLicense(info),
  ].filter(Boolean);

  // Injecter TOC après badges (ou après title si pas de badges), si ≥ 6 sections
  const toc = sectionToc(raw);
  if (toc) {
    const badgesIdx = raw.findIndex((s) => s.id === 'badges');
    const insertAt = badgesIdx >= 0 ? badgesIdx + 1 : 1;
    raw.splice(insertAt, 0, toc);
  }

  return raw;
}
