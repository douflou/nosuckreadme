/**
 * Rust detector: matches Cargo.toml.
 * Parse [package] : name, description, version, license, rust-version.
 * Detects whether the crate is a binary (install) or library (add).
 * @type {import('./base.js').Detector}
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';

export default {
  ecosystem: 'rust',

  async matches(rootPath) {
    try {
      await fs.access(path.join(rootPath, 'Cargo.toml'));
      return true;
    } catch {
      return false;
    }
  },

  async enrich(info, rootPath) {
    try {
      const content = await fs.readFile(path.join(rootPath, 'Cargo.toml'), 'utf8');
      const toml = parseToml(content);

      const pkg = toml.package || {};
      info.name = pkg.name ?? info.name;
      info.description = pkg.description ?? info.description;
      info.version = pkg.version ?? info.version;
      info.license = pkg.license ?? info.license;
      info.ecosystem = 'rust';
      info.runtimeRequires = pkg['rust-version'] ? `Rust ${pkg['rust-version']}` : null;

      // Detect whether binaries are declared.
      const hasBin = Array.isArray(toml.bin) && toml.bin.length > 0;

      // Entrypoints
      if (hasBin && Array.isArray(toml.bin)) {
        toml.bin.forEach((b) => {
          info.entrypoints.push({ name: b.name || info.name, target: b.path || 'src/main.rs' });
        });
      }

      // Install command
      if (hasBin) {
        info.installCmd = `cargo install ${info.name}`;
      } else {
        info.installCmd = `cargo add ${info.name}`;
      }

      // Usage example
      if (hasBin) {
        info.usageExample = `${info.name} [args]`;
      } else {
        info.usageExample = `${info.name} = "0.x"  # in Cargo.toml`;
      }
    } catch (e) {
      // Cargo.toml missing or malformed: silently ignore.
    }
  },
};
