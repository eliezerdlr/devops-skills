import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, components, specialistCount, skillResourceCount, promptCount, assertUnifiedManifest, registeredSkillFiles } from './package-contract.mjs';

const read = path => readFile(resolve(root, path), 'utf8');
const nameOf = text => {
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(frontmatter, 'missing frontmatter');
  const name = frontmatter[1].match(/^name:\s*["']?([^"'\n\r]+?)["']?\s*$/m);
  assert.ok(name, 'missing name');
  return name[1];
};

const approvedNames = [
  'graphify', 'security-audit', 'constraint-driven-development', 'context-engineering',
  'source-driven-development', 'code-simplification', 'web-quality-audit', 'web-performance',
  'core-web-vitals', 'web-accessibility', 'web-seo', 'web-best-practices',
  'model-resilience', 'archify', 'aws-billing-and-cost-management', 'aws-site-to-site-vpn', 'aws-well-architected-review',
];

test('root manifest includes all 17 explicit approved specialists and five added prompts', async () => {
  const pkg = await assertUnifiedManifest();
  assert.equal(pkg.version, '0.4.0');
  const names = [];
  for (const path of pkg.pi.skills.slice(1)) names.push(nameOf(await read(path)));
  assert.deepEqual(names.toSorted(), approvedNames.toSorted());
  assert.equal(pkg.pi.prompts.length, promptCount);
  for (const path of pkg.pi.prompts) await access(resolve(root, path));
});

test('single package has 118 specialists plus catalogue, no duplicate skill/prompt names', async () => {
  const paths = await registeredSkillFiles();
  assert.equal(paths.length, skillResourceCount);
  const names = await Promise.all(paths.map(async path => nameOf(await readFile(path, 'utf8'))));
  assert.equal(new Set(names).size, skillResourceCount);
  assert.equal(names.filter(name => name !== 'engineering-skills').length, specialistCount);
  const pkg = await assertUnifiedManifest();
  const prompts = [];
  for (const path of pkg.pi.prompts) prompts.push(nameOf(await read(path)));
  assert.equal(new Set(prompts).size, promptCount);
  assert.ok(!paths.some(path => path.includes('/upstream/') || path.includes('/unifi-skills/')));
});

test('catalogue counts and links include all approved resources as main package features', async () => {
  const text = await read('skills/engineering-skills/SKILL.md');
  assert.match(text, /Catalogue of 118 engineering skills/);
  assert.match(text, /All specialists below are included by the main package manifest/);
  assert.doesNotMatch(text, /not in the 99 core|Optional source-first security|Optional project context/);
  const pkg = await assertUnifiedManifest();
  for (const path of pkg.pi.skills.slice(1)) assert.ok(text.includes(`../../${path.slice(2)}`), path);
});

test('one public install entrypoint replaces per-module installation instructions', async () => {
  for (const path of ['README.md', 'README.en.md', ...components.map(name => `integrations/${name}/README.md`)]) {
    const text = await read(path);
    assert.doesNotMatch(text, /pi install[^\n]*devops-skills\/integrations\/(?:graphify|security-audit|addy-engineering|web-quality)/);
    assert.match(text, /pi install \/(?:caminho\/absoluto|absolute\/path\/to)\/devops-skills|pi install git:/);
    assert.doesNotMatch(text, /not loaded by default.*99|outside the main manifest|manifesto principal não carrega|not loaded by the main manifest/);
  }
  const migration = await read('docs/UNIFIED-PACKAGE.md');
  assert.match(migration, /não edita as tuas configurações globais automaticamente/);
  assert.match(migration, /pi remove .*integrations\/graphify/);
  assert.match(migration, /Não remover a entrada raiz/);
  assert.match(migration, /119 recursos de skills, 8 prompts e 2 extensões/);
});

test('standard npm test covers all included capability suites and source validators', async () => {
  const pkg = await assertUnifiedManifest();
  for (const file of ['ops-engine.test.mjs', 'graphify-integration.test.mjs', 'security-audit-integration.test.mjs', 'addy-integrations.test.mjs', 'unified-package.test.mjs', 'validate-findings.test.cjs', 'validate-coverage-ledger.test.cjs']) {
    assert.ok(pkg.scripts.test.includes(file), `default test must run ${file}`);
  }
  assert.doesNotMatch(pkg.scripts.test, /npm install|npx|pip|curl/);
  assert.deepEqual(pkg.pi.extensions, ['./extensions/ops-orchestrator/index.ts', './extensions/netbird-api/index.ts']);
  assert.equal(Object.hasOwn(pkg.scripts, 'postinstall'), false);
});
