/**
 * Python detector: matches pyproject.toml or setup.py.
 * Parse name, description, version, requires-python, license, [project.scripts].
 * @type {import('./base.js').Detector}
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';

export default {
  ecosystem: 'python',

  async matches(rootPath) {
    try {
      await fs.access(path.join(rootPath, 'pyproject.toml'));
      return true;
    } catch {
      try {
        await fs.access(path.join(rootPath, 'setup.py'));
        return true;
      } catch {
        return false;
      }
    }
  },

  async enrich(info, rootPath) {
    try {
      const tomlPath = path.join(rootPath, 'pyproject.toml');
      const content = await fs.readFile(tomlPath, 'utf8');
      const toml = parseToml(content);

      const project = toml.project || {};
      info.name = project.name ?? info.name;
      info.description = project.description ?? info.description;
      info.version = project.version ?? info.version;
      info.license = project.license?.text ?? project.license ?? info.license;
      info.ecosystem = 'python';
      info.runtimeRequires = project['requires-python'] ?? null;

      // Entrypoints: [project.scripts]
      if (project.scripts && typeof project.scripts === 'object') {
        Object.entries(project.scripts).forEach(([name, target]) => {
          info.entrypoints.push({ name, target });
        });
      }

      // Install command
      if (info.entrypoints.length > 0) {
        info.installCmd = `pipx install ${info.name}`;
      } else {
        info.installCmd = `pip install ${info.name}`;
      }

      // Usage example
      if (info.entrypoints.length > 0) {
        const { name } = info.entrypoints[0];
        info.usageExample = `${name} [args]`;
      } else {
        info.usageExample = `import ${(info.name || 'package').replace(/-/g, '_')}`;
      }
    } catch (e) {
      // pyproject.toml missing or malformed: silently ignore.
    }
  },
};
