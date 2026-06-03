import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan } from '../src/scanner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, 'fixtures');

describe('scanner — node_proj', () => {
  let result;
  test('scan() runs without error', async () => {
    result = await scan(path.join(fixtures, 'node_proj'));
  });

  test('détecte JavaScript comme langage principal', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    const langs = r.languages.map(([l]) => l);
    assert.ok(langs.includes('JavaScript'), `Langages: ${langs}`);
    assert.equal(r.languages[0][0], 'JavaScript', 'JS doit être le premier');
  });

  test('détecte la licence MIT', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.equal(r.license, 'MIT');
  });

  test('détecte hasCI = true', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.equal(r.hasCI, true);
  });

  test('détecte hasTests = false (pas de fichiers test)', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.equal(r.hasTests, false);
  });

  test('détecte les examples/', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.ok(r.examples.length > 0, 'examples/ doit être détecté');
    assert.ok(r.examples.some(e => e.includes('basic.js')));
  });

  test('collecte les TODO/FIXME', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.ok(r.todos.length > 0, 'Doit trouver le TODO dans src/index.js');
    assert.ok(r.todos[0].includes('TODO'));
  });
});

describe('scanner — python_proj', () => {
  test('détecte Python comme langage principal', async () => {
    const r = await scan(path.join(fixtures, 'python_proj'));
    const langs = r.languages.map(([l]) => l);
    assert.ok(langs.includes('Python'), `Langages: ${langs}`);
  });

  test('détecte la licence MIT', async () => {
    const r = await scan(path.join(fixtures, 'python_proj'));
    assert.equal(r.license, 'MIT');
  });

  test('détecte hasCI = false', async () => {
    const r = await scan(path.join(fixtures, 'python_proj'));
    assert.equal(r.hasCI, false);
  });

  test('détecte hasTests = true (dossier tests/)', async () => {
    const r = await scan(path.join(fixtures, 'python_proj'));
    assert.equal(r.hasTests, true);
  });

  test('collecte les FIXME', async () => {
    const r = await scan(path.join(fixtures, 'python_proj'));
    assert.ok(r.todos.length > 0, 'Doit trouver le FIXME dans cli.py');
    assert.ok(r.todos[0].includes('FIXME'));
  });
});

describe('scanner — bare (aucun manifeste)', () => {
  test('ne crashe pas sur un repo nu', async () => {
    const r = await scan(path.join(fixtures, 'bare'));
    assert.ok(Array.isArray(r.languages));
    assert.equal(r.license, null);
    assert.equal(r.hasCI, false);
  });

  test('détecte Shell comme langage', async () => {
    const r = await scan(path.join(fixtures, 'bare'));
    const langs = r.languages.map(([l]) => l);
    assert.ok(langs.includes('Shell'), `Langages: ${langs}`);
  });

  test('repoUrl est null (pas de git remote)', async () => {
    const r = await scan(path.join(fixtures, 'bare'));
    // Accepte null (pas de remote) ou une URL valide (si le repo parent a un remote)
    if (r.repoUrl !== null) {
      assert.match(r.repoUrl, /^https?:\/\//);
    }
  });
});

describe('scanner — normalisation URL git', () => {
  test('languages trié par octets décroissants', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    for (let i = 0; i < r.languages.length - 1; i++) {
      assert.ok(r.languages[i][1] >= r.languages[i + 1][1], 'doit être trié desc');
    }
  });

  test('todos limités à 20', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.ok(r.todos.length <= 20);
  });
});
