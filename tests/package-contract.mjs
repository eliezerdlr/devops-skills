import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const components = ['graphify', 'security-audit', 'addy-engineering', 'web-quality', 'omniroute', 'archify', 'aws-toolkit'];
export const specialistCount = 117;
export const skillResourceCount = 118; // specialists + catalogue
export const promptCount = 8;
export const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

export async function assertUnifiedManifest() {
  const pkg = await readJson(resolve(root, 'package.json'));
  const expected = {
    skills: ['./skills/engineering-skills/**/SKILL.md'],
    prompts: [
      './agents/network-architect.md', './agents/network-troubleshooter.md', './agents/network-config-reviewer.md',
    ],
  };
  for (const name of components) {
    const component = await readJson(resolve(root, 'integrations', name, 'package.json'));
    for (const type of ['skills', 'prompts']) {
      for (const path of component.pi[type] ?? []) {
        assert.ok(path.startsWith('./') && !path.includes('..') && !path.includes('upstream'), `invalid component resource: ${path}`);
        expected[type].push(`./integrations/${name}/${path.slice(2)}`);
      }
    }
    assert.deepEqual(component.pi.extensions, [], 'component must not add executable startup behavior');
  }
  for (const type of ['skills', 'prompts']) {
    assert.deepEqual(pkg.pi[type], expected[type], `root manifest must include every approved ${type} resource exactly once`);
    assert.equal(new Set(pkg.pi[type]).size, pkg.pi[type].length);
  }
  assert.equal(pkg.pi.skills.length, 18);
  assert.equal(pkg.pi.prompts.length, promptCount);
  assert.deepEqual(pkg.pi.extensions, ['./extensions/ops-orchestrator/index.ts', './extensions/model-resilience/index.ts']);
  assert.deepEqual(pkg.pi.themes, []);
  assert.doesNotMatch(JSON.stringify(pkg.pi), /upstream|unifi|planning-with-files/);
  return pkg;
}

async function catalogueSkillFiles(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`unexpected skill symlink: ${entry.name}`);
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...await catalogueSkillFiles(path));
    else if (entry.name === 'SKILL.md') result.push(path);
  }
  return result;
}

export async function registeredSkillFiles() {
  const pkg = await assertUnifiedManifest();
  return [
    ...await catalogueSkillFiles(resolve(root, 'skills/engineering-skills')),
    ...pkg.pi.skills.slice(1).map(path => resolve(root, path)),
  ];
}
