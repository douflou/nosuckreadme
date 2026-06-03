import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProjectInfo } from '../src/model.js';
import { selectDetector } from '../src/detectors/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, 'fixtures');

describe('detector - selection', () => {
  test('node_proj -> Node detector', async () => {
    const d = await selectDetector(path.join(fixtures, 'node_proj'));
    assert.equal(d.ecosystem, 'node');
  });

  test('python_proj -> Python detector', async () => {
    const d = await selectDetector(path.join(fixtures, 'python_proj'));
    assert.equal(d.ecosystem, 'python');
  });

  test('bare -> Generic detector', async () => {
    const d = await selectDetector(path.join(fixtures, 'bare'));
    assert.equal(d.ecosystem, 'generic');
  });
});

describe('Node detector - enrich', () => {
  test('fills name, version, license, installCmd', async () => {
    const d = await selectDetector(path.join(fixtures, 'node_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'node_proj'));

    assert.equal(info.name, 'my-node-tool');
    assert.equal(info.version, '1.2.3');
    assert.equal(info.license, 'MIT');
    assert.match(info.installCmd, /npx my-node-tool/);
    assert.ok(info.usageExample);
  });

  test('detects bin -> entrypoints', async () => {
    const d = await selectDetector(path.join(fixtures, 'node_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'node_proj'));

    assert.ok(info.entrypoints.length > 0);
    assert.equal(info.entrypoints[0].name, 'my-node-tool');
  });

  test('parses engines.node -> runtimeRequires', async () => {
    const d = await selectDetector(path.join(fixtures, 'node_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'node_proj'));

    assert.equal(info.runtimeRequires, '>=18');
  });
});

describe('Python detector - enrich', () => {
  test('fills name, version, license, installCmd', async () => {
    const d = await selectDetector(path.join(fixtures, 'python_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'python_proj'));

    assert.equal(info.name, 'mypy-tool');
    assert.equal(info.version, '0.3.1');
    assert.equal(info.license, 'MIT');
    assert.match(info.installCmd, /pip/);
  });

  test('detects [project.scripts] -> entrypoints', async () => {
    const d = await selectDetector(path.join(fixtures, 'python_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'python_proj'));

    assert.ok(info.entrypoints.length > 0);
    assert.equal(info.entrypoints[0].name, 'mypy-tool');
  });

  test('parses requires-python -> runtimeRequires', async () => {
    const d = await selectDetector(path.join(fixtures, 'python_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'python_proj'));

    assert.equal(info.runtimeRequires, '>=3.10');
  });
});

describe('Rust detector - enrich', () => {
  test('fills name, version, license, installCmd', async () => {
    const d = await selectDetector(path.join(fixtures, 'rust_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'rust_proj'));

    assert.equal(info.name, 'my-rust-cli');
    assert.equal(info.version, '0.5.0');
    assert.equal(info.license, 'MIT');
    assert.match(info.installCmd, /cargo install/);
  });

  test('detects [[bin]] -> entrypoints', async () => {
    const d = await selectDetector(path.join(fixtures, 'rust_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'rust_proj'));

    assert.ok(info.entrypoints.length > 0);
    assert.equal(info.entrypoints[0].name, 'my-rust-cli');
  });

  test('parses rust-version -> runtimeRequires', async () => {
    const d = await selectDetector(path.join(fixtures, 'rust_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'rust_proj'));

    assert.match(info.runtimeRequires, /Rust 1\.70/);
  });
});

describe('Go detector - enrich', () => {
  test('fills name from module path', async () => {
    const d = await selectDetector(path.join(fixtures, 'go_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'go_proj'));

    assert.equal(info.name, 'my-go-tool');
  });

  test('parses go version -> runtimeRequires', async () => {
    const d = await selectDetector(path.join(fixtures, 'go_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'go_proj'));

    assert.match(info.runtimeRequires, /Go 1\.21/);
  });

  test('generates go installCmd', async () => {
    const d = await selectDetector(path.join(fixtures, 'go_proj'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'go_proj'));

    assert.match(info.installCmd, /go install/);
  });
});

describe('Generic detector - enrich', () => {
  test('fills name from folder name', async () => {
    const d = await selectDetector(path.join(fixtures, 'bare'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'bare'));

    assert.equal(info.name, 'bare');
  });

  test('generates generic installCmd', async () => {
    const d = await selectDetector(path.join(fixtures, 'bare'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'bare'));

    assert.ok(info.installCmd);
    assert.match(info.installCmd, /git clone/i);
  });

  test('usageExample = default', async () => {
    const d = await selectDetector(path.join(fixtures, 'bare'));
    const info = createProjectInfo();
    await d.enrich(info, path.join(fixtures, 'bare'));

    assert.ok(info.usageExample);
  });
});
