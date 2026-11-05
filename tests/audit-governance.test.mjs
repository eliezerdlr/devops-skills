import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));

test('F11 scanner guidance does not claim unavailable advisory or reputation checks', () => {
  const skill = read('skills/engineering-skills/skill-security-auditor/SKILL.md');
  assert.doesNotMatch(skill, /Cross-reference with PyPI\/npm advisory|Safe to install\.|checks require internet access|Low download count/);
  assert.doesNotMatch(read('skills/engineering-skills/skill-security-auditor/scripts/skill_security_auditor.py'), /safe to install/i);
  assert.match(skill, /not implemented/);
  assert.match(skill, /Safety remains unverified/);
  assert.match(skill, /not known-vulnerability or CVE assessment/);
});

test('G01 strict CI typecheck covers every registered root extension and optional Planning', () => {
  const ci = read('.github/workflows/test-orchestration.yml');
  const strict = ci.split('- name: Strict extension type checking')[1];
  assert.ok(strict);
  assert.match(strict, /tsc.*--noEmit/);
  assert.match(strict, /--strict/);
  for (const file of pkg.pi.extensions) assert.ok(strict.includes(file.replace(/^\.\//, '')), file);
  assert.match(ci, /Strict optional planning extension type checking/);
  assert.match(ci, /integrations\/planning-with-files\/upstream\/extensions\/planning-with-files\/index.ts/);
});

test('G02 public documents agree with manifest extension and explicit integration counts', () => {
  assert.equal(pkg.pi.extensions.length, 4);
  const integrations = pkg.pi.skills.filter((p) => p.startsWith('./integrations/'));
  assert.equal(integrations.length, 26);
  const en = read('README.en.md');
  assert.match(en, /eight prompts and four active extensions/);
  assert.doesNotMatch(en, /three active extensions/);
  assert.match(en, /OPS, NetBird API, Ponytail and Ghidra extensions/);
  assert.match(read('docs/DEPENDENCIES.md'), /the 26 approved skills/);
  assert.match(read('docs/UNIFIED-PACKAGE.md'), /131 recursos de skills, 8 prompts e 5 extensões quando/);
});

test('G03 current testing checklist cannot inherit old discovery counts from archive', () => {
  const doc = read('docs/TESTING.md');
  const [current, historical] = doc.split('## Historical validation archive — not current instructions');
  assert.ok(historical);
  assert.match(current, /129 specialists \+ catalogue = 130 skill resources \/ 8 prompts \/ 4 extensions/);
  assert.match(current, /131 \/ 8 \/ 5/);
  assert.doesNotMatch(current, /125 recursos|three active extensions/);
  assert.doesNotMatch(historical, /validação atual|descoberta esperada atual/i);
});

test('G04 original UniFi helper license and scoped immutable provenance are retained', () => {
  const root = 'integrations/unifi-skills/';
  const provenance = JSON.parse(read(root + 'HELPER-PROVENANCE.json'));
  const license = read(root + provenance.licenseFile);
  assert.equal(provenance.license, 'MIT');
  assert.match(provenance.licenseSnapshotCommit, /^[a-f0-9]{40}$/);
  assert.ok(provenance.licenseUrl.includes(provenance.licenseSnapshotCommit));
  assert.match(license, /Copyright \(c\) 2026 dlewis7444/);
  assert.match(license, /Permission is hereby granted/);
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);
  assert.equal(createHash('sha256').update(license).digest('hex'), provenance.licenseSha256);
  assert.match(read(root + provenance.helper), /dlewis7444\/unifi-claude-skill/);
  assert.match(read('THIRD_PARTY_NOTICES.md'), /LICENSE\.helper-origin/);
  assert.equal(provenance.automaticLoading, false);
  assert.ok(!pkg.pi.skills.some((p) => p.includes('unifi')));
});
