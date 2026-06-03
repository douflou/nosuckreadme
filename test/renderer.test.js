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

describe('renderer - structure', () => {
  test('contains the h1 title', () => {
    const out = render(makeInfo());
    assert.match(out, /^# my-tool/m);
  });

  test('contains the Installation section', () => {
    const out = render(makeInfo());
    assert.match(out, /## Installation/);
    assert.match(out, /npx my-tool/);
  });

  test('contains the Usage section', () => {
    const out = render(makeInfo());
    assert.match(out, /## Usage/);
    assert.match(out, /npx my-tool --help/);
  });

  test('contains the Roadmap section', () => {
    const out = render(makeInfo());
    assert.match(out, /## Roadmap/);
  });

  test('contains the License section', () => {
    const out = render(makeInfo());
    assert.match(out, /## License/);
    assert.match(out, /MIT/);
  });

  test('has no triple line breaks', () => {
    const out = render(makeInfo());
    assert.doesNotMatch(out, /\n{3,}/);
  });

  test('ends with a single \\n', () => {
    const out = render(makeInfo());
    assert.ok(out.endsWith('\n'), 'should end with \\n');
    assert.ok(!out.endsWith('\n\n'), 'should not end with \\n\\n');
  });
});

describe('renderer - stubs for missing data', () => {
  test('null description -> marked stub', () => {
    const out = render(makeInfo({ description: null }));
    assert.match(out, /<!-- TODO\(nosuckreadme\)/);
  });

  test('null installCmd -> marked stub', () => {
    const out = render(makeInfo({ installCmd: null }));
    assert.match(out, /<!-- TODO\(nosuckreadme\)/);
  });

  test('no Contributing when hasContributing=false', () => {
    const out = render(makeInfo({ hasContributing: false }));
    assert.doesNotMatch(out, /## Contributing/);
  });

  test('Contributing present when hasContributing=true', () => {
    const out = render(makeInfo({ hasContributing: true }));
    assert.match(out, /## Contributing/);
  });
});

describe('renderer - inferred known limitations', () => {
  test('hasTests=false -> "No test suite yet" limitation', () => {
    const out = render(makeInfo({ hasTests: false }));
    assert.match(out, /No test suite yet\./);
  });

  test('hasTests=true -> no tests limitation', () => {
    const out = render(makeInfo({ hasTests: true }));
    assert.doesNotMatch(out, /No test suite yet\./);
  });

  test('many todos -> "active development" limitation', () => {
    const todos = Array.from({ length: 15 }, (_, i) => `src/foo.js: // TODO: fix ${i}`);
    const out = render(makeInfo({ todos }));
    assert.match(out, /Code under active development/);
  });
});

describe('renderer - determinism', () => {
  test('same input -> identical output (2 calls)', () => {
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

  test('same input -> identical output (sorted collections)', () => {
    const info1 = makeInfo({ languages: [['JavaScript', 5000], ['CSS', 1000]] });
    const info2 = makeInfo({ languages: [['JavaScript', 5000], ['CSS', 1000]] });
    assert.equal(render(info1), render(info2));
  });
});

describe('renderer - TOC (>= 6 sections)', () => {
  test('TOC present when enough sections exist', () => {
    // Full project = 7 sections -> TOC should appear
    const out = render(makeInfo({
      hasContributing: true,
      examples: ['examples/basic.js'],
    }));
    assert.match(out, /## Table of contents/);
  });
});
