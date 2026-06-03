import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/renderer.js';
import { createProjectInfo } from '../src/model.js';

function makeInfo(overrides = {}) {
  return createProjectInfo({
    name: 'my-tool',
    description: 'A great tool.',
    ecosystem: 'node',
    version: '1.0.0',
    license: 'MIT',
    languages: [['JavaScript', 5000]],
    installCmd: 'npx my-tool',
    entrypoints: [{ name: 'my-tool', target: 'bin/index.js' }],
    usageExample: 'npx my-tool --help',
    hasCI: false,
    hasTests: true,
    hasContributing: false,
    repoUrl: null,
    todos: [],
    limitations: [],
    badges: [],
    ...overrides,
  });
}

describe('renderer — structure', () => {
  test('contient le titre h1', () => {
    const out = render(makeInfo());
    assert.match(out, /^# my-tool/m);
  });

  test('contient la section Installation', () => {
    const out = render(makeInfo());
    assert.match(out, /## Installation/);
    assert.match(out, /npx my-tool/);
  });

  test('contient la section Usage', () => {
    const out = render(makeInfo());
    assert.match(out, /## Usage/);
    assert.match(out, /npx my-tool --help/);
  });

  test('contient la section Roadmap', () => {
    const out = render(makeInfo());
    assert.match(out, /## Roadmap/);
  });

  test('contient la section Licence', () => {
    const out = render(makeInfo());
    assert.match(out, /## Licence/);
    assert.match(out, /MIT/);
  });

  test('pas de triple saut de ligne', () => {
    const out = render(makeInfo());
    assert.doesNotMatch(out, /\n{3,}/);
  });

  test('se termine par un seul \\n', () => {
    const out = render(makeInfo());
    assert.ok(out.endsWith('\n'), 'doit se terminer par \\n');
    assert.ok(!out.endsWith('\n\n'), 'ne doit pas se terminer par \\n\\n');
  });
});

describe('renderer — stubs pour données manquantes', () => {
  test('description nulle → stub balisé', () => {
    const out = render(makeInfo({ description: null }));
    assert.match(out, /<!-- TODO\(nosuckreadme\)/);
  });

  test('installCmd nul → stub balisé', () => {
    const out = render(makeInfo({ installCmd: null }));
    assert.match(out, /<!-- TODO\(nosuckreadme\)/);
  });

  test('pas de Contributing si hasContributing=false', () => {
    const out = render(makeInfo({ hasContributing: false }));
    assert.doesNotMatch(out, /## Contributing/);
  });

  test('Contributing présent si hasContributing=true', () => {
    const out = render(makeInfo({ hasContributing: true }));
    assert.match(out, /## Contributing/);
  });
});

describe('renderer — Limites connues inférées', () => {
  test('hasTests=false → limite "Pas de suite de tests"', () => {
    const out = render(makeInfo({ hasTests: false }));
    assert.match(out, /Pas de suite de tests/);
  });

  test('hasTests=true → pas de limite tests', () => {
    const out = render(makeInfo({ hasTests: true }));
    assert.doesNotMatch(out, /Pas de suite de tests/);
  });

  test('beaucoup de todos → limite "évolution active"', () => {
    const todos = Array.from({ length: 15 }, (_, i) => `src/foo.js: // TODO: fix ${i}`);
    const out = render(makeInfo({ todos }));
    assert.match(out, /évolution active/);
  });
});

describe('renderer — déterminisme', () => {
  test('même entrée → sortie identique (2 appels)', () => {
    const info = makeInfo({
      badges: [
        { label: 'license', imgUrl: 'https://img.shields.io/badge/license-MIT-blue', linkUrl: 'LICENSE', reason: 'MIT' },
      ],
      todos: ['src/a.js: // TODO: refactor', 'src/b.js: // TODO: add tests'],
    });
    const out1 = render(info);
    const out2 = render(info);
    assert.equal(out1, out2);
  });

  test('même entrée → sortie identique (collections triées)', () => {
    const info1 = makeInfo({ languages: [['JavaScript', 5000], ['CSS', 1000]] });
    const info2 = makeInfo({ languages: [['JavaScript', 5000], ['CSS', 1000]] });
    assert.equal(render(info1), render(info2));
  });
});

describe('renderer — TOC (≥ 6 sections)', () => {
  test('TOC présente si assez de sections', () => {
    // Projet complet = 7 sections → TOC doit apparaître
    const out = render(makeInfo({
      hasContributing: true,
      examples: ['examples/basic.js'],
    }));
    assert.match(out, /## Table des matières/);
  });
});
