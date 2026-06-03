#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { scan } from '../src/scanner.js';
import { selectDetector } from '../src/detectors/index.js';
import { createProjectInfo } from '../src/model.js';
import { buildBadges } from '../src/badges.js';
import { render } from '../src/renderer.js';
import { buildSections } from '../src/sections.js';

const program = new Command();

program
  .name('nosuckreadme')
  .description("Generate a GitHub README that doesn't suck — honest badges, real install/usage, known limitations.")
  .version('0.2.1')
  .argument('[path]', 'repository path to scan', '.')
  .option('-o, --output <file>', 'output file (default: stdout)')
  .option('--stdout', 'force standard output')
  .option('--force', 'allow overwriting an existing README.md')
  .option('--dry-run', 'show a preview without writing anything')
  .option('--explain', 'show the justification for each badge/section')
  .option('--name <name>', 'force the project name')
  .option('--description <text>', 'force the description')
  .action(async (targetPath, options) => {
    try {
      const rootPath = path.resolve(targetPath);

      // Check that the path exists.
      try {
        await fs.access(rootPath);
      } catch {
        console.error(pc.red(`Error: path not found: ${rootPath}`));
        process.exit(1);
      }

      // 1. Scan.
      process.stderr.write(pc.dim('Scanning repository...') + '\n');
      const signals = await scan(rootPath);

      // 2. Build ProjectInfo.
      const info = createProjectInfo({
        ...signals,
        name: options.name ?? '',
        description: options.description ?? null,
      });

      // 3. Detect ecosystem and enrich.
      const detector = await selectDetector(rootPath);
      await detector.enrich(info, rootPath);

      // Apply CLI overrides, which take precedence over detector values.
      if (options.name) info.name = options.name;
      if (options.description) info.description = options.description;

      // 4. Build badges.
      info.badges = buildBadges(info);

      // 5. --explain mode.
      if (options.explain) {
        console.log(pc.bold('\nGenerated badges:'));
        if (info.badges.length === 0) {
          console.log(pc.dim('  (no justified badge)'));
        } else {
          for (const b of info.badges) {
            console.log(`  ${pc.cyan(b.label.padEnd(20))} ${pc.dim(b.reason)}`);
          }
        }
        const sections = buildSections(info);
        console.log(pc.bold('\nGenerated sections:'));
        for (const s of sections) {
          const heading = s.markdown.match(/^#+ .+/m)?.[0] ?? s.id;
          console.log(`  ${pc.cyan(s.id.padEnd(20))} ${pc.dim(heading.trim())}`);
        }
        console.log();
      }

      // 6. Render.
      const output = render(info);

      // 7. --dry-run: print without writing.
      if (options.dryRun) {
        // Basic heading colorization.
        const colored = output
          .split('\n')
          .map((line) => {
            if (/^# /.test(line)) return pc.bold(pc.cyan(line));
            if (/^## /.test(line)) return pc.bold(line);
            if (/^### /.test(line)) return pc.dim(line);
            if (/^!\[/.test(line)) return pc.dim(line);
            if (/^<!--/.test(line)) return pc.yellow(line);
            return line;
          })
          .join('\n');
        console.log(colored);
        return;
      }

      // 8. Determine destination.
      let dest = options.output ?? null;
      const toStdout = options.stdout || dest === null;

      if (toStdout) {
        process.stdout.write(output);
        return;
      }

      // Explicit destination: check overwrite.
      const destPath = path.resolve(dest);
      let alreadyExists = false;
      try {
        await fs.access(destPath);
        alreadyExists = true;
      } catch {
        // Does not exist, so it is safe to write.
      }

      if (alreadyExists && !options.force) {
        // Write to README.generated.md and exit with code 2.
        const genPath = path.join(path.dirname(destPath), 'README.generated.md');
        await fs.writeFile(genPath, output, 'utf8');
        console.error(
          pc.yellow(`\nWarning: ${dest} already exists.`) + '\n' +
          pc.dim(`   File written to: ${path.basename(genPath)}\n`) +
          pc.dim(`   Run again with --force to overwrite ${dest}.`)
        );
        process.exit(2);
      }

      await fs.writeFile(destPath, output, 'utf8');
      console.error(pc.green(`README written to ${dest}`));
    } catch (err) {
      console.error(pc.red(`Unexpected error: ${err.message}`));
      if (process.env.DEBUG) console.error(err.stack);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
