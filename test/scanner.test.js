import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan } from '../src/scanner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, 'fixtures');

describe('scanner - node_proj', () => {
  let result;
  test('scan() runs without error', async () => {
    result = await scan(path.join(fixtures, 'node_proj'));
  });

  test('detects JavaScript as the main language', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    const langs = r.languages.map(([l]) => l);
    assert.ok(langs.includes('JavaScript'), `Languages: ${langs}`);
    assert.equal(r.languages[0][0], 'JavaScript', 'JS should be first');
  });

  test('detects the MIT license', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.equal(r.license, 'MIT');
  });

  test('detects hasCI = true', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.equal(r.hasCI, true);
  });

  test('detects hasTests = false (no test files)', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.equal(r.hasTests, false);
  });

  test('detects examples/', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.ok(r.examples.length > 0, 'examples/ should be detected');
    assert.ok(r.examples.some(e => e.includes('basic.js')));
  });

  test('collects TODO/FIXME', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.ok(r.todos.length > 0, 'Should find the TODO in src/index.js');
    assert.ok(r.todos[0].includes('TODO'));
  });
});

describe('scanner - python_proj', () => {
  test('detects Python as the main language', async () => {
    const r = await scan(path.join(fixtures, 'python_proj'));
    const langs = r.languages.map(([l]) => l);
    assert.ok(langs.includes('Python'), `Languages: ${langs}`);
  });

  test('detects the MIT license', async () => {
    const r = await scan(path.join(fixtures, 'python_proj'));
    assert.equal(r.license, 'MIT');
  });

  test('detects hasCI = false', async () => {
    const r = await scan(path.join(fixtures, 'python_proj'));
    assert.equal(r.hasCI, false);
  });

  test('detects hasTests = true (tests/ directory)', async () => {
    const r = await scan(path.join(fixtures, 'python_proj'));
    assert.equal(r.hasTests, true);
  });

  test('collects FIXME', async () => {
    const r = await scan(path.join(fixtures, 'python_proj'));
    assert.ok(r.todos.length > 0, 'Should find the FIXME in cli.py');
    assert.ok(r.todos[0].includes('FIXME'));
  });
});

describe('scanner - bare (no manifest)', () => {
  test('does not crash on a bare repo', async () => {
    const r = await scan(path.join(fixtures, 'bare'));
    assert.ok(Array.isArray(r.languages));
    assert.equal(r.license, null);
    assert.equal(r.hasCI, false);
  });

  test('detects Shell as a language', async () => {
    const r = await scan(path.join(fixtures, 'bare'));
    const langs = r.languages.map(([l]) => l);
    assert.ok(langs.includes('Shell'), `Languages: ${langs}`);
  });

  test('repoUrl is null (no git remote)', async () => {
    const r = await scan(path.join(fixtures, 'bare'));
    // Accept null (no remote) or a valid URL (if the parent repo has a remote)
    if (r.repoUrl !== null) {
      assert.match(r.repoUrl, /^https?:\/\//);
    }
  });
});

describe('scanner - git URL normalization', () => {
  test('languages sorted by descending bytes', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    for (let i = 0; i < r.languages.length - 1; i++) {
      assert.ok(r.languages[i][1] >= r.languages[i + 1][1], 'should be sorted descending');
    }
  });

  test('todos limited to 20', async () => {
    const r = await scan(path.join(fixtures, 'node_proj'));
    assert.ok(r.todos.length <= 20);
  });
});
