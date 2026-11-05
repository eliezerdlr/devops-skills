import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { root, registeredSkillFiles, readJson } from './package-contract.mjs';
const read = p => readFile(resolve(root, p), 'utf8');
const names = ['finops-operating-model', 'database-reliability', 'automation-governance', 'email-lifecycle-strategy', 'ghidra-binary-analysis'];
const componentFor = n => n.startsWith('ghidra-') ? 'ghidra' : 'agency-agents';

test('five specialists register once; component manifests do not duplicate the root Ghidra extension', async () => {
  const paths = await registeredSkillFiles();
  for (const name of names) {
    const matches = paths.filter(p => p.endsWith(`/skills/${name}/SKILL.md`));
    assert.equal(matches.length, 1, name);
    const text = await readFile(matches[0], 'utf8');
    assert.match(text, new RegExp(`name: ${name}\\n`));
    assert.match(text, /adapted/i);
    assert.doesNotMatch(text, /tools:|You've|You have designed/);
  }
  for (const c of ['agency-agents', 'ghidra']) {
    const pkg = await readJson(resolve(root, 'integrations', c, 'package.json'));
    assert.deepEqual(pkg.pi.extensions, []);
    assert.deepEqual(pkg.pi.prompts, []);
    assert.equal(pkg.dependencies, undefined);
    assert.equal(pkg.scripts, undefined);
    const files = await readdir(resolve(root, 'integrations', c));
    assert.ok(!files.includes('upstream') && !files.includes('install.sh'));
  }
});

test('provenance pins and license material are preserved and distributed hashes verify', async () => {
  for (const [c, pin, count] of [['agency-agents', 'b37b5bb33b78f2c1d6567d98e25ca818e3259219', 5], ['ghidra', '84782699d6d112e598e3f5077bf0d5ddeea63f0c', 6]]) {
    const base = `integrations/${c}`;
    const meta = await readJson(resolve(root, base, 'UPSTREAM.json'));
    assert.equal(meta.commit, pin);
    assert.equal(Object.keys(meta.source_sha256).length, count);
    for (const hash of Object.values(meta.source_sha256)) assert.match(hash, /^[a-f0-9]{64}$/);
    assert.match(await read(`${base}/LICENSE`), c === 'ghidra' ? /Apache License/ : /2025 AgentLand Contributors/);
    const manifest = await read(`${base}/SHA256SUMS`);
    for (const line of manifest.trim().split('\n')) {
      const [, hash, relative] = line.match(/^([a-f0-9]{64})  (.+)$/) ?? [];
      assert.ok(hash && relative && !relative.includes('..') && !relative.startsWith('/'));
      const actual = createHash('sha256').update(await readFile(resolve(root, base, relative))).digest('hex');
      assert.equal(actual, hash, relative);
    }
    const licenseHash = createHash('sha256').update(await readFile(resolve(root, base, 'LICENSE'))).digest('hex');
    assert.equal(licenseHash, meta.source_sha256.LICENSE);
  }
  assert.match(await read('integrations/ghidra/NOTICE'), /GPL/);
});

test('local references resolve and correction boundaries are explicit', async () => {
  for (const n of names) {
    const path = resolve(root, 'integrations', componentFor(n), 'skills', n, 'SKILL.md');
    const body = await readFile(path, 'utf8');
    for (const m of body.matchAll(/\]\(([^)]+)\)/g)) {
      if (!m[1].includes('://')) await readFile(resolve(dirname(path), m[1]));
    }
  }
  const text = async n => read(`integrations/${componentFor(n)}/skills/${n}/SKILL.md`);
  assert.match(await text(names[0]), /Zero\/missing denominator means unknown/);
  assert.match(await text(names[0]), /not automatic shutdown/);
  assert.match(await text(names[1]), /without separate approval/);
  assert.match(await text(names[1]), /rollback of application code may be unsafe/);
  assert.match(await text(names[2]), /never substitutes for user approval/);
  assert.match(await text(names[3]), /CTOR inherits that denominator problem/);
  assert.match(await text(names[3]), /Global suppression must win/);
  const ghidra = await read('integrations/ghidra/skills/ghidra-binary-analysis/references/operations.md');
  assert.match(ghidra, /not an OS sandbox/);
  assert.match(ghidra, /post-scripts can still run/);
  assert.match(ghidra, /outer timeout/);
});
