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
  .version('0.2.0')
  .argument('[path]', 'chemin du dépôt à scanner', '.')
  .option('-o, --output <file>', 'fichier de sortie (défaut : stdout)')
  .option('--stdout', 'forcer la sortie standard')
  .option('--force', "autoriser l'écrasement d'un README.md existant")
  .option('--dry-run', 'afficher un aperçu sans rien écrire')
  .option('--explain', 'détailler la justification de chaque badge/section')
  .option('--name <name>', 'forcer le nom du projet')
  .option('--description <text>', 'forcer la description')
  .action(async (targetPath, options) => {
    try {
      const rootPath = path.resolve(targetPath);

      // Vérifier que le chemin existe
      try {
        await fs.access(rootPath);
      } catch {
        console.error(pc.red(`Erreur : chemin introuvable : ${rootPath}`));
        process.exit(1);
      }

      // 1. Scanner
      process.stderr.write(pc.dim('Scan du dépôt…') + '\n');
      const signals = await scan(rootPath);

      // 2. Construire le ProjectInfo
      const info = createProjectInfo({
        ...signals,
        name: options.name ?? '',
        description: options.description ?? null,
      });

      // 3. Détecter l'écosystème et enrichir
      const detector = await selectDetector(rootPath);
      await detector.enrich(info, rootPath);

      // Appliquer les overrides CLI (prioritaires sur le détecteur)
      if (options.name) info.name = options.name;
      if (options.description) info.description = options.description;

      // 4. Badger
      info.badges = buildBadges(info);

      // 5. Mode --explain
      if (options.explain) {
        console.log(pc.bold('\nBadges générés :'));
        if (info.badges.length === 0) {
          console.log(pc.dim('  (aucun badge justifié)'));
        } else {
          for (const b of info.badges) {
            console.log(`  ${pc.cyan(b.label.padEnd(20))} ${pc.dim(b.reason)}`);
          }
        }
        const sections = buildSections(info);
        console.log(pc.bold('\nSections générées :'));
        for (const s of sections) {
          const heading = s.markdown.match(/^#+ .+/m)?.[0] ?? s.id;
          console.log(`  ${pc.cyan(s.id.padEnd(20))} ${pc.dim(heading.trim())}`);
        }
        console.log();
      }

      // 6. Render
      const output = render(info);

      // 7. --dry-run : afficher sans écrire
      if (options.dryRun) {
        // Colorisation basique des titres
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

      // 8. Déterminer la destination
      let dest = options.output ?? null;
      const toStdout = options.stdout || dest === null;

      if (toStdout) {
        process.stdout.write(output);
        return;
      }

      // dest explicite : vérifier écrasement
      const destPath = path.resolve(dest);
      let alreadyExists = false;
      try {
        await fs.access(destPath);
        alreadyExists = true;
      } catch {
        // n'existe pas → ok
      }

      if (alreadyExists && !options.force) {
        // Écrire dans README.generated.md et sortir avec code 2
        const genPath = path.join(path.dirname(destPath), 'README.generated.md');
        await fs.writeFile(genPath, output, 'utf8');
        console.error(
          pc.yellow(`\n⚠  ${dest} existe déjà.`) + '\n' +
          pc.dim(`   Fichier écrit dans : ${path.basename(genPath)}\n`) +
          pc.dim(`   Relance avec --force pour écraser ${dest}.`)
        );
        process.exit(2);
      }

      await fs.writeFile(destPath, output, 'utf8');
      console.error(pc.green(`✓ README écrit dans ${dest}`));
    } catch (err) {
      console.error(pc.red(`Erreur inattendue : ${err.message}`));
      if (process.env.DEBUG) console.error(err.stack);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
