import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildBadges } from '../src/badges.js';
import { createProjectInfo } from '../src/model.js';

/** Core rule: every emitted badge must have a non-empty reason. */
function assertAllHaveReason(badges) {
  for (const b of badges) {
    assert.ok(b.reason && b.reason.trim().length > 0,
      `Badge "${b.label}" has no reason`);
  }
}

describe('badges - anti-bullshit rule: no badge without a real fact', () => {
  test('repo without LICENSE -> no license badge', () => {
    const info = createProjectInfo({ license: null });
    const badges = buildBadges(info);
    const licBadges = badges.filter(b => b.label === 'license');
    assert.equal(licBadges.length, 0);
  });

  test('repo without CI -> no build/CI badge', () => {
    const info = createProjectInfo({
      hasCI: false,
      repoUrl: 'https://github.com/owner/repo',
    });
    const badges = buildBadges(info);
    const ciBadges = badges.filter(b => b.label === 'CI');
    assert.equal(ciBadges.length, 0);
  });

  test('hasCI=true but repoUrl=null -> no CI badge (no GitHub link)', () => {
    const info = createProjectInfo({ hasCI: true, repoUrl: null });
    const badges = buildBadges(info);
    const ciBadges = badges.filter(b => b.label === 'CI');
    assert.equal(ciBadges.length, 0);
  });

  test('hasCI=true but non-GitHub repoUrl -> no CI badge', () => {
    const info = createProjectInfo({
      hasCI: true,
      repoUrl: 'https://gitlab.com/owner/repo',
    });
    const badges = buildBadges(info);
    const ciBadges = badges.filter(b => b.label === 'CI');
    assert.equal(ciBadges.length, 0);
  });

  test('repo without languages -> no language badge', () => {
    const info = createProjectInfo({ languages: [] });
    const badges = buildBadges(info);
    const langBadges = badges.filter(b =>
      ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go'].includes(b.label)
    );
    assert.equal(langBadges.length, 0);
  });

  test('repo without version -> no version badge', () => {
    const info = createProjectInfo({ version: null });
    const badges = buildBadges(info);
    const verBadges = badges.filter(b => b.label === 'version');
    assert.equal(verBadges.length, 0);
  });
});

describe('badges - emission based on real facts', () => {
  test('MIT LICENSE -> license badge emitted', () => {
    const info = createProjectInfo({ license: 'MIT' });
    const badges = buildBadges(info);
    const lic = badges.find(b => b.label === 'license');
    assert.ok(lic, 'license badge expected');
    assert.ok(lic.imgUrl.includes('MIT'));
    assert.equal(lic.linkUrl, 'LICENSE');
  });

  test('version present -> static version badge emitted', () => {
    const info = createProjectInfo({ version: '1.2.3' });
    const badges = buildBadges(info);
    const ver = badges.find(b => b.label === 'version');
    assert.ok(ver, 'version badge expected');
    assert.ok(ver.imgUrl.includes('1.2.3'));
    assert.ok(ver.imgUrl.includes('informational'));
  });

  test('hasCI=true + GitHub repoUrl -> CI badge emitted with actions link', () => {
    const info = createProjectInfo({
      hasCI: true,
      repoUrl: 'https://github.com/alice/myproject',
    });
    const badges = buildBadges(info);
    const ci = badges.find(b => b.label === 'CI');
    assert.ok(ci, 'CI badge expected');
    assert.ok(ci.imgUrl.includes('alice/myproject'));
    assert.ok(ci.linkUrl?.includes('/actions'));
  });

  test('non-empty languages -> main language badge emitted', () => {
    const info = createProjectInfo({
      languages: [['JavaScript', 5000], ['TypeScript', 2000]],
    });
    const badges = buildBadges(info);
    const lang = badges.find(b => b.label === 'JavaScript');
    assert.ok(lang, 'language badge expected');
  });

  test('runtimeRequires -> runtime badge emitted', () => {
    const info = createProjectInfo({
      ecosystem: 'node',
      runtimeRequires: '>=18',
    });
    const badges = buildBadges(info);
    const rt = badges.find(b => b.label.startsWith('node'));
    assert.ok(rt, 'runtime badge expected');
  });
});

describe('badges - every badge has a reason', () => {
  test('full project -> all badges have a reason', () => {
    const info = createProjectInfo({
      license: 'MIT',
      version: '2.0.0',
      hasCI: true,
      repoUrl: 'https://github.com/alice/myproject',
      languages: [['Python', 10000]],
      ecosystem: 'python',
      runtimeRequires: '>=3.10',
    });
    const badges = buildBadges(info);
    assert.ok(badges.length > 0, 'should emit at least one badge');
    assertAllHaveReason(badges);
  });

  test('empty project -> no badges (and no crash)', () => {
    const info = createProjectInfo();
    const badges = buildBadges(info);
    assert.ok(Array.isArray(badges));
    assert.equal(badges.length, 0);
  });
});
