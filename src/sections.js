/**
 * Renders each README section.
 * Missing data becomes a marked `<!-- TODO(nosuckreadme): ... -->` stub, never fake content.
 * Deterministic rendering: same input, same output.
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
    : `\n\n${STUB('add a short project description')}`;
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
    : STUB('installation command');
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
    lines.push(STUB('basic usage example'));
  }

  if (info.entrypoints.length > 0) {
    lines.push('\n**Available commands:**\n');
    lines.push('| Command | Target |');
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
    lines.push(STUB('add one or two concrete examples'));
    lines.push('\n```sh\n# example\n```');
  }

  return { id: 'examples', markdown: `## Examples\n\n${lines.join('\n')}` };
}

function sectionRoadmap(info) {
  const items = info.todos.length > 0
    ? info.todos.slice(0, 10).map((t) => `- [ ] ${t}`)
    : [STUB('add the next steps')];

  return { id: 'roadmap', markdown: `## Roadmap\n\n${items.join('\n')}` };
}

function sectionLimitations(info) {
  const items = [...info.limitations];

  if (!info.hasTests) {
    items.push('No test suite yet.');
  }
  if (info.todos.length > 10) {
    items.push(`Code under active development (${info.todos.length} open TODO/FIXME items).`);
  }
  if (info.ecosystem !== 'generic' && items.length === 0) {
    items.push(STUB('list this project\'s known limitations'));
  }

  if (items.length === 0) return null;

  const lines = items.map((l) => `- ${l}`);
  return {
    id: 'limitations',
    markdown: `## Known limitations\n\n${lines.join('\n')}`,
  };
}

function sectionContributing(info) {
  if (!info.hasContributing) return null;
  return {
    id: 'contributing',
    markdown: `## Contributing\n\nSee [CONTRIBUTING](CONTRIBUTING.md) for instructions.`,
  };
}

function sectionLicense(info) {
  const body = info.license
    ? `Distributed under the [${info.license}](LICENSE) license.`
    : STUB('specify the project license');
  return { id: 'license', markdown: `## License\n\n${body}` };
}

// ── Table of contents (generated when there are at least 6 sections) ───────

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
  return { id: 'toc', markdown: `## Table of contents\n\n${entries.join('\n')}` };
}

// ── Assembly ───────────────────────────────────────────────────────────────

/**
 * Builds sections in the defined order. Returns only non-null sections.
 * @param {import('./model.js').ProjectInfo} info
 * @returns {Array<{ id: string, markdown: string }>}
 */
export function buildSections(info) {
  // First pass: sections without TOC.
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

  // Inject TOC after badges, or after title if there are no badges, when enough sections exist.
  const toc = sectionToc(raw);
  if (toc) {
    const badgesIdx = raw.findIndex((s) => s.id === 'badges');
    const insertAt = badgesIdx >= 0 ? badgesIdx + 1 : 1;
    raw.splice(insertAt, 0, toc);
  }

  return raw;
}
