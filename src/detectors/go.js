/**
 * Détecteur Go — match : go.mod.
 * Parse module path et go version via regex.
 * @type {import('./base.js').Detector}
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export default {
  ecosystem: 'go',

  async matches(rootPath) {
    try {
      await fs.access(path.join(rootPath, 'go.mod'));
      return true;
    } catch {
      return false;
    }
  },

  async enrich(info, rootPath) {
    try {
      const content = await fs.readFile(path.join(rootPath, 'go.mod'), 'utf8');

      // Parse : module <path>
      const moduleMark = content.match(/^module\s+(.+?)$/m);
      if (moduleMark) {
        const modulePath = moduleMark[1].trim();
        info.name = modulePath.split('/').pop() || modulePath;
        // Entrypoint
        info.entrypoints.push({ name: info.name, target: 'main.go' });
      }

      // Parse : go <version>
      const goMark = content.match(/^go\s+(.+?)$/m);
      if (goMark) {
        info.runtimeRequires = `Go ${goMark[1].trim()}`;
      }

      info.ecosystem = 'go';

      // Install command
      if (info.name) {
        info.installCmd = `go install ${info.name}@latest`;
      } else {
        info.installCmd = `go get <module>`;
      }

      // Usage example
      info.usageExample = info.name ? `${info.name} [args]` : 'go run main.go';
    } catch (e) {
      // go.mod absent ou malformé → silently ignore
    }
  },
};
