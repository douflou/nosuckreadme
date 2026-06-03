/**
 * Node detector: matches package.json (priority).
 * Parse name, description, version, bin, scripts, engines.node, license.
 * @type {import('./base.js').Detector}
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export default {
  ecosystem: 'node',

  async matches(rootPath) {
    try {
      await fs.access(path.join(rootPath, 'package.json'));
      return true;
    } catch {
      return false;
    }
  },

  async enrich(info, rootPath) {
    try {
      const pkg = JSON.parse(
        await fs.readFile(path.join(rootPath, 'package.json'), 'utf8')
      );

      info.name = pkg.name ?? info.name;
      info.description = pkg.description ?? info.description;
      info.version = pkg.version ?? info.version;
      info.license = pkg.license ?? info.license;
      info.ecosystem = 'node';
      info.runtimeRequires = pkg.engines?.node ?? null;

      // Entrypoints: bin -> [{ name, target }]
      if (pkg.bin) {
        if (typeof pkg.bin === 'string') {
          info.entrypoints.push({ name: info.name || 'bin', target: pkg.bin });
        } else {
          Object.entries(pkg.bin).forEach(([name, target]) => {
            info.entrypoints.push({ name, target });
          });
        }
      }

      // Install command
      if (info.entrypoints.length > 0) {
        info.installCmd = `npx ${info.name}`;
      } else {
        info.installCmd = `npm install ${info.name}`;
      }

      // Usage example
      if (info.entrypoints.length > 0) {
        const { name } = info.entrypoints[0];
        info.usageExample = `npx ${info.name} ${name === info.name ? '' : name}`.trim();
      } else {
        info.usageExample = `import { /* ... */ } from '${info.name}';`;
      }
    } catch (e) {
      // package.json missing or malformed: silently ignore.
    }
  },
};
