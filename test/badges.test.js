import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildBadges } from '../src/badges.js';
import { createProjectInfo } from '../src/model.js';

/** Règle centrale : chaque badge émis doit avoir un reason non vide. */
function assertAllHaveReason(badges) {
  for (const b of badges) {
    assert.ok(b.reason && b.reason.trim().length > 0,
      `Badge "${b.label}" n'a pas de reason`);
  }
}

describe('badges — règle anti-bullshit : aucun badge sans fait réel', () => {
  test('repo sans LICENSE → aucun badge licence', () => {
    const info = createProjectInfo({ license: null });
    const badges = buildBadges(info);
    const licBadges = badges.filter(b => b.label === 'license');
    assert.equal(licBadges.length, 0);
  });

  test('repo sans CI → aucun badge build/CI', () => {
    const info = createProjectInfo({
      hasCI: false,
      repoUrl: 'https://github.com/owner/repo',
    });
    const badges = buildBadges(info);
    const ciBadges = badges.filter(b => b.label === 'CI');
    assert.equal(ciBadges.length, 0);
  });

  test('hasCI=true mais repoUrl=null → aucun badge CI (pas de lien GitHub)', () => {
    const info = createProjectInfo({ hasCI: true, repoUrl: null });
    const badges = buildBadges(info);
    const ciBadges = badges.filter(b => b.label === 'CI');
    assert.equal(ciBadges.length, 0);
  });

  test('hasCI=true mais repoUrl non-GitHub → aucun badge CI', () => {
    const info = createProjectInfo({
      hasCI: true,
      repoUrl: 'https://gitlab.com/owner/repo',
    });
    const badges = buildBadges(info);
    const ciBadges = badges.filter(b => b.label === 'CI');
    assert.equal(ciBadges.length, 0);
  });

  test('repo sans languages → aucun badge langage', () => {
    const info = createProjectInfo({ languages: [] });
    const badges = buildBadges(info);
    const langBadges = badges.filter(b =>
      ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go'].includes(b.label)
    );
    assert.equal(langBadges.length, 0);
  });

  test('repo sans version → aucun badge version', () => {
    const info = createProjectInfo({ version: null });
    const badges = buildBadges(info);
    const verBadges = badges.filter(b => b.label === 'version');
    assert.equal(verBadges.length, 0);
  });
});

describe('badges — émission sur fait réel', () => {
  test('LICENSE MIT → badge licence émis', () => {
    const info = createProjectInfo({ license: 'MIT' });
    const badges = buildBadges(info);
    const lic = badges.find(b => b.label === 'license');
    assert.ok(lic, 'badge licence attendu');
    assert.ok(lic.imgUrl.includes('MIT'));
    assert.equal(lic.linkUrl, 'LICENSE');
  });

  test('version présente → badge version statique émis', () => {
    const info = createProjectInfo({ version: '1.2.3' });
    const badges = buildBadges(info);
    const ver = badges.find(b => b.label === 'version');
    assert.ok(ver, 'badge version attendu');
    assert.ok(ver.imgUrl.includes('1.2.3'));
    assert.ok(ver.imgUrl.includes('informational'));
  });

  test('hasCI=true + repoUrl GitHub → badge CI émis avec lien actions', () => {
    const info = createProjectInfo({
      hasCI: true,
      repoUrl: 'https://github.com/alice/myproject',
    });
    const badges = buildBadges(info);
    const ci = badges.find(b => b.label === 'CI');
    assert.ok(ci, 'badge CI attendu');
    assert.ok(ci.imgUrl.includes('alice/myproject'));
    assert.ok(ci.linkUrl?.includes('/actions'));
  });

  test('languages non vide → badge langage principal émis', () => {
    const info = createProjectInfo({
      languages: [['JavaScript', 5000], ['TypeScript', 2000]],
    });
    const badges = buildBadges(info);
    const lang = badges.find(b => b.label === 'JavaScript');
    assert.ok(lang, 'badge langage attendu');
  });

  test('runtimeRequires → badge runtime émis', () => {
    const info = createProjectInfo({
      ecosystem: 'node',
      runtimeRequires: '>=18',
    });
    const badges = buildBadges(info);
    const rt = badges.find(b => b.label.startsWith('node'));
    assert.ok(rt, 'badge runtime attendu');
  });
});

describe('badges — chaque badge a un reason', () => {
  test('projet complet → tous les badges ont un reason', () => {
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
    assert.ok(badges.length > 0, 'doit émettre au moins un badge');
    assertAllHaveReason(badges);
  });

  test('projet vide → aucun badge (et pas de crash)', () => {
    const info = createProjectInfo();
    const badges = buildBadges(info);
    assert.ok(Array.isArray(badges));
    assert.equal(badges.length, 0);
  });
});
