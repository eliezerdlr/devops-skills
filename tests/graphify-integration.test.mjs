import test from 'node:test';
import { assertUnifiedManifest } from './package-contract.mjs';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const integration = resolve(root, 'integrations/graphify');
const read = path => readFile(resolve(integration, path), 'utf8');
const json = async path => JSON.parse(await read(path));

async function files(dir = integration) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    assert.equal(entry.isSymbolicLink(), false, `unexpected symlink: ${path}`);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

test('Graphify component inventory selects exactly one skill and no executable resources', async () => {
  const pkg = await json('package.json');
  assert.equal(pkg.private, true);
  assert.equal(pkg.license, 'Apache-2.0');
  assert.deepEqual(pkg.pi, {
    skills: ['./skills/graphify/SKILL.md'], extensions: [], prompts: [], themes: [],
  });
  for (const key of ['scripts', 'dependencies', 'peerDependencies', 'bin']) {
    assert.equal(Object.hasOwn(pkg, key), false, key);
  }
  const paths = await files();
  assert.equal(paths.filter(p => p.endsWith('/SKILL.md')).length, 1);
  assert.equal(paths.filter(p => /\.(py|ts|js|mjs|sh|ps1)$/.test(p)).length, 0);
});

test('main manifest includes Graphify and all approved resources without adding startup extensions', async () => {
  const pkg = await assertUnifiedManifest();
  assert.ok(pkg.pi.skills.includes('./integrations/graphify/skills/graphify/SKILL.md'));
});

test('skill has bounded scope, valid frontmatter and an explicit adaptation notice', async () => {
  const text = await read('skills/graphify/SKILL.md');
  assert.match(text, /^---\nname: graphify\ndescription: "[^\n]+"\nlicense: Apache-2\.0\n---\n/);
  assert.ok(text.split('\n').length < 100, 'keep the entrypoint small');
  assert.match(text, /Modified for DevOps Skills/);
  assert.match(text, /Never install, upgrade/);
  assert.match(text, /not a sandbox/);
  assert.match(text, /No automatic semantic pass/);
});

test('all local Markdown links in the optional integration resolve within the pack', async () => {
  for (const path of (await files()).filter(p => extname(p) === '.md')) {
    const text = await readFile(path, 'utf8');
    for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const resolved = resolve(dirname(path), target.split('#')[0]);
      assert.ok(!relative(root, resolved).startsWith('..'), `link escapes pack: ${target}`);
      await assert.doesNotReject(access(resolved), `${relative(root, path)} -> ${target}`);
    }
    assert.equal((text.match(/^```/gm) ?? []).length % 2, 0, `unclosed fence: ${path}`);
  }
});

test('provenance and upstream licence notices are retained', async () => {
  const upstream = await json('UPSTREAM.json');
  assert.equal(upstream.repository, 'https://github.com/Graphify-Labs/graphify');
  assert.equal(upstream.commit, 'b90b9df7949bd04a15b40a1624af85d0a9cfdf04');
  assert.equal(upstream.version, '0.9.93');
  assert.equal(upstream.license, 'Apache-2.0');
  assert.ok(upstream.modifications.length >= 3);
  assert.match(await read('LICENSE'), /Apache License\s+Version 2\.0/);
  assert.match(await read('NOTICE'), /Copyright 2026 Safi Shamsi and the Graphify contributors/);
  assert.match(await read('LICENSE-MIT'), /Copyright \(c\) 2026 Safi Shamsi/);
  const notices = await readFile(resolve(root, 'THIRD_PARTY_NOTICES.md'), 'utf8');
  assert.match(notices, /Graphify — adapted instructions/);
  for (const path of (await files()).filter(p => p.includes('/skills/') || p.includes('/workflows/'))) {
    if (!path.endsWith('.md')) continue;
    const text = await readFile(path, 'utf8');
    assert.match(text, /[Mm]odified|[Aa]daptation/);
    assert.match(text, /Apache-2\.0/);
  }
});

test('catalogue includes Graphify in the unified specialist count', async () => {
  const catalogue = await readFile(resolve(root, 'skills/engineering-skills/SKILL.md'), 'utf8');
  assert.match(catalogue, /Catalogue of 117 engineering skills/);
  assert.match(catalogue, /\]\(\.\.\/\.\.\/integrations\/graphify\/skills\/graphify\/SKILL\.md\)/);
  assert.match(catalogue, /All specialists below are included by the main package manifest/);
});

test('references preserve local-only defaults and explicit, task-scoped memory', async () => {
  const query = await read('skills/graphify/references/querying.md');
  for (const setting of ['GRAPHIFY_BACKEND=none', 'GRAPHIFY_NO_AUTO_REFRESH=1', 'GRAPHIFY_QUERY_LOG_DISABLE=1']) {
    assert.ok(query.includes(setting), setting);
  }
  const memory = await read('skills/graphify/references/work-memory.md');
  assert.match(memory, /does not capture Pi conversations/);
  assert.match(memory, /not model confidence/);
  const resume = await read('workflows/resume-work.md');
  assert.match(resume, /No session collector exists/);
  assert.match(resume, /Do not activate its hooks/);
  assert.match(resume, /TC Tracker/);
});
