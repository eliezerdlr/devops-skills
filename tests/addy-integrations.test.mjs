import test from 'node:test';
import { assertUnifiedManifest } from './package-contract.mjs';
import assert from 'node:assert/strict';
import { readFile, readdir, access, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const integrations = resolve(root, 'integrations');
const configs = [
  { name: 'addy-engineering', skills: 4, prompts: 2, files: 20, commit: 'aeac41d4d005999432bb7312f7ff06383a91d59d', year: 2025 },
  { name: 'web-quality', skills: 6, prompts: 0, files: 17, commit: 'afa8da942115f2961fdbfa80807ea0b232ff6c00', year: 2026 },
];
const read = path => readFile(path, 'utf8');
const json = async path => JSON.parse(await read(path));
const resourceName = text => {
  const header = text.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(header, 'missing frontmatter');
  const name = header[1].match(/^name:\s*["']?([^"'\n]+?)["']?\s*$/m);
  assert.ok(name, 'missing name');
  return name[1];
};

async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    assert.equal(entry.isSymbolicLink(), false, `unexpected symlink: ${path}`);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

for (const config of configs) {
  const base = resolve(integrations, config.name);
  test(`${config.name}: component inventory, no extensions, dependencies or install scripts`, async () => {
    const pkg = await json(resolve(base, 'package.json'));
    assert.equal(pkg.private, true);
    assert.equal(pkg.license, 'MIT');
    assert.equal(pkg.pi.skills.length, config.skills);
    assert.equal(pkg.pi.prompts.length, config.prompts);
    assert.deepEqual(pkg.pi.extensions, []);
    assert.deepEqual(pkg.pi.themes, []);
    for (const key of ['scripts', 'dependencies', 'peerDependencies', 'bin']) assert.equal(Object.hasOwn(pkg, key), false, key);
    for (const path of [...pkg.pi.skills, ...pkg.pi.prompts]) {
      assert.equal(path.includes('upstream'), false);
      assert.equal(path.includes('*'), false);
      await access(resolve(base, path));
    }
  });

  test(`${config.name}: all selected source files, licences and hashes are preserved`, async () => {
    const provenance = await json(resolve(base, 'UPSTREAM.json'));
    assert.equal(provenance.commit, config.commit);
    assert.equal(provenance.license, 'MIT');
    const lines = (await read(resolve(base, 'SHA256SUMS'))).trim().split('\n');
    assert.equal(lines.length, config.files);
    const names = [];
    for (const line of lines) {
      const match = line.match(/^([a-f0-9]{64})  (.+)$/);
      assert.ok(match, line);
      const [, digest, name] = match;
      const path = resolve(base, 'upstream', name);
      assert.ok(!relative(resolve(base, 'upstream'), path).startsWith('..'));
      assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'), digest, name);
      names.push(name);
    }
    assert.equal(new Set(names).size, config.files);
    assert.deepEqual(names.sort(), provenance.source_files.toSorted());
    assert.deepEqual((await files(resolve(base, 'upstream'))).map(p => relative(resolve(base, 'upstream'), p)).sort(), names);
    assert.equal(await read(resolve(base, 'LICENSE')), await read(resolve(base, 'upstream/LICENSE')));
    assert.ok((await read(resolve(base, 'LICENSE'))).includes(`Copyright (c) ${config.year} Addy Osmani`));
  });

  test(`${config.name}: complete local Markdown links, balanced fences and small adapted entrypoints`, async () => {
    for (const path of (await files(base)).filter(p => extname(p) === '.md')) {
      const text = await read(path);
      for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
        if (/^(https?:|mailto:|#)/.test(target)) continue;
        const destination = resolve(dirname(path), target.split('#')[0]);
        assert.ok(!relative(root, destination).startsWith('..'), `link escapes pack: ${target}`);
        await assert.doesNotReject(access(destination), `${relative(root, path)} -> ${target}`);
      }
      assert.equal((text.match(/^```/gm) ?? []).length % 2, 0, `unclosed fence: ${path}`);
    }
    const pkg = await json(resolve(base, 'package.json'));
    for (const path of pkg.pi.skills) {
      const text = await read(resolve(base, path));
      assert.ok(text.split('\n').length < 100, path);
      assert.match(text, /Adapted for DevOps Skills/);
      assert.match(text, /MIT/);
      assert.match(text, /description: "[^\n]+"/);
      resourceName(text);
    }
  });
}

test('all 10 new skill names and two prompts avoid existing registered resources', async () => {
  const base = await assertUnifiedManifest();
  const names = [];
  for (const path of (await files(resolve(root, 'skills/engineering-skills'))).filter(p => p.endsWith('/SKILL.md'))) {
    names.push(resourceName(await read(path)));
  }
  for (const name of ['graphify', 'security-audit', 'addy-engineering', 'web-quality']) {
    const dir = resolve(integrations, name);
    const pkg = await json(resolve(dir, 'package.json'));
    for (const path of pkg.pi.skills) names.push(resourceName(await read(resolve(dir, path))));
  }
  assert.equal(new Set(names).size, names.length, 'duplicate skill name');
  const prompts = [];
  for (const path of base.pi.prompts) prompts.push(resourceName(await read(resolve(root, path))));
  assert.equal(new Set(prompts).size, prompts.length, 'duplicate prompt name');
});

test('engineering adaptation prevents automatic enforcement, commits and unsafe example assumptions', async () => {
  const base = resolve(integrations, 'addy-engineering');
  const boundaries = await read(resolve(base, 'references/operating-boundaries.md'));
  assert.match(boundaries, /Never install tools/);
  assert.match(boundaries, /not an installed guard/);
  assert.match(boundaries, /may contain sensitive data/);
  assert.match(boundaries, /Map.*not interchangeable with an object/);
  assert.match(boundaries, /Do not duplicate state/);
  assert.match(boundaries, /No arbitrary 80% threshold/);
  for (const path of (await json(resolve(base, 'package.json'))).pi.prompts) {
    const text = await read(resolve(base, path));
    assert.match(text, /same-session prompt/);
    assert.match(text, /not an isolated subagent/);
    assert.match(text, /Task: \$ARGUMENTS/);
    assert.match(text, /Adapted for DevOps Skills/);
  }
  const context = await read(resolve(base, 'skills/context-engineering/SKILL.md'));
  assert.match(context, /Do not infer approval from a prior conversation/);
});

test('web adaptation qualifies SEO, field/lab, accessibility and browser consent', async () => {
  const base = resolve(integrations, 'web-quality');
  const safety = await read(resolve(base, 'references/evidence-and-safety.md'));
  for (const pattern of [/No automatic tool installation/, /field p75/, /Unavailable|unavailable/, /robots\.txt is crawler guidance, not authentication/, /Do not canonicalise every paginated page/, /Never fabricate customer reviews/, /not WCAG conformance/, /48 px/, /explicitly requested/]) assert.match(safety, pattern);
  const pkg = await json(resolve(base, 'package.json'));
  for (const path of pkg.pi.skills) assert.match(await read(resolve(base, path)), /evidence and safety/);
  const seo = await read(resolve(base, 'skills/web-seo/SKILL.md'));
  assert.match(seo, /Product\/Organization\/Breadcrumb\/Article/);
  assert.match(seo, /owner approval and rollback/);
  assert.match(seo, /not paid-media management or complete marketing strategy/);
});

test('catalogue and notices expose the integrated selection and unified count', async () => {
  const catalogue = await read(resolve(root, 'skills/engineering-skills/SKILL.md'));
  assert.match(catalogue, /Catalogue of 118 engineering skills/);
  for (const config of configs) {
    const base = resolve(integrations, config.name), pkg = await json(resolve(base, 'package.json'));
    for (const path of pkg.pi.skills) assert.ok(catalogue.includes(`../../integrations/${config.name}/${path.slice(2)}`), path);
  }
  const notices = await read(resolve(root, 'THIRD_PARTY_NOTICES.md'));
  assert.match(notices, /Copyright \(c\) 2025 Addy Osmani/);
  assert.match(notices, /Copyright \(c\) 2026 Addy Osmani/);
});

const hasBash = spawnSync('/bin/bash', ['--version'], { timeout: 3000 }).status === 0;
const hasJq = spawnSync('jq', ['--version'], { timeout: 3000 }).status === 0;
test('optional static analyzer handles synthetic HTML and reports issues separately from success', { skip: !hasBash || !hasJq }, async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'addy-web-fixture-'));
  try {
    const script = resolve(integrations, 'web-quality/upstream/skills/web-quality-audit/scripts/analyze.sh');
    const valid = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Hi-Fi</title></head><body><img src="hero.webp" alt="Player"></body></html>';
    const invalid = '<html><body><img src="hero.webp"></body></html>';
    for (const [name, html, expectIssues] of [['valid.html', valid, false], ['missing attributes.html', invalid, true]]) {
      const path = resolve(dir, name);
      await writeFile(path, html);
      const run = spawnSync('/bin/bash', [script, path], {
        cwd: dir, env: { PATH: process.env.PATH, HOME: dir, TMPDIR: dir, LANG: 'C' },
        encoding: 'utf8', timeout: 10000, maxBuffer: 65536,
      });
      assert.equal(run.error, undefined);
      assert.equal(run.status, 0, run.stderr);
      const result = JSON.parse(run.stdout);
      assert.equal(result.success, true);
      assert.equal(result.issueCount > 0, expectIssues);
      if (!expectIssues) assert.equal(result.warningCount, 0);
      assert.equal(await read(path), html);
    }
    const missing = spawnSync('/bin/bash', [script, resolve(dir, 'absent.html')], {
      cwd: dir, env: { PATH: process.env.PATH, HOME: dir, TMPDIR: dir }, encoding: 'utf8', timeout: 10000, maxBuffer: 65536,
    });
    assert.equal(missing.status, 1);
    assert.equal(JSON.parse(missing.stdout).success, false);
    assert.deepEqual((await readdir(dir)).sort(), ['missing attributes.html', 'valid.html']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
