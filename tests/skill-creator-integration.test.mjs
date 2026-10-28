import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { root, assertUnifiedManifest, registeredSkillFiles } from './package-contract.mjs';

const dir = resolve(root, 'skills/engineering-skills/skill-creator');
const read = name => readFile(resolve(dir, name), 'utf8');
const sha = data => createHash('sha256').update(data).digest('hex');
async function files(at) {
  const result = [];
  for (const entry of await readdir(at, { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false);
    const path = resolve(at, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

// These checks validate packaging and instruction contracts, not model efficacy,
// permission enforcement, OS isolation or successful behavioral evaluation.
test('creator registers once and teach is absent without new runtime or dependencies', async () => {
  const pkg = await assertUnifiedManifest();
  const selected = await registeredSkillFiles();
  assert.equal(selected.filter(p => p === resolve(dir, 'SKILL.md')).length, 1);
  assert.ok(!selected.some(p => p === resolve(root, 'skills/engineering-skills/teach/SKILL.md')));
  await assert.rejects(access(resolve(root, 'skills/engineering-skills/teach')), { code: 'ENOENT' });
  assert.doesNotMatch(pkg.scripts.test, /teach-integration/);
  assert.doesNotMatch(pkg.scripts['test:pi'], /teach-pi/);
  assert.deepEqual(pkg.pi.extensions, ['./extensions/ops-orchestrator/index.ts', './extensions/netbird-api/index.ts']);
  assert.equal(Object.hasOwn(pkg, 'dependencies'), false);
  assert.equal(Object.hasOwn(pkg.scripts, 'postinstall'), false);
  assert.ok(pkg.scripts.test.includes('skill-creator-integration.test.mjs'));
  assert.ok(pkg.scripts['test:pi'].includes('skill-creator-pi.test.mjs'));
});

test('creator provenance and original Apache license are pinned', async () => {
  const meta = JSON.parse(await read('UPSTREAM.json'));
  assert.equal(meta.repository, 'https://github.com/anthropics/skills');
  assert.equal(meta.commit, 'dbd4588f9e1033efb41dad4bef2f7947c8993d44');
  assert.equal(meta.license, 'Apache-2.0');
  assert.equal(Object.keys(meta.source_sha256).length, 6);
  assert.equal(sha(await readFile(resolve(dir, 'LICENSE'))), meta.source_sha256['skills/skill-creator/LICENSE.txt']);
  assert.match(await read('LICENSE'), /Copyright 2026 Anthropic, PBC/);
  assert.ok(meta.modifications.length >= 5);
});

test('creator integrity is complete with only inert documents and JSON assets', async () => {
  const all = await files(dir);
  const expected = all.filter(p => p !== resolve(dir, 'SHA256SUMS')).sort();
  const listed = [];
  for (const row of (await read('SHA256SUMS')).trim().split('\n')) {
    const match = row.match(/^([a-f0-9]{64})  ([^\r\n]+)$/);
    assert.ok(match);
    assert.ok(!match[2].startsWith('/') && !match[2].split('/').includes('..'));
    const path = resolve(dir, match[2]);
    listed.push(path);
    assert.equal(sha(await readFile(path)), match[1], match[2]);
  }
  assert.equal(new Set(listed).size, listed.length);
  assert.deepEqual(listed.sort(), expected);
  for (const path of all) {
    assert.ok(/\.(?:md|json)$|\/(?:LICENSE|SHA256SUMS)$/.test(path), path);
    assert.ok(!path.includes('/scripts/') && !path.includes('/eval-viewer/'));
    if (!path.endsWith('.md')) continue;
    const text = await readFile(path, 'utf8');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^https:\/\//.test(match[1]) || match[1].startsWith('#')) continue;
      assert.ok(!/^[a-z]+:/i.test(match[1]));
      await access(resolve(dirname(path), match[1].split('#')[0]));
    }
  }
});

test('creator captures authorized expertise without automatic history or operational activity', async () => {
  const text = await read('SKILL.md');
  assert.match(text, /^---\nname: skill-creator\n/);
  assert.ok(Buffer.byteLength(text) < 12000);
  for (const term of ['Do not collect memory or histories automatically', 'supplies or explicitly authorizes', 'reported experience', 'acceptance criteria', 'symlink/path escapes', 'Do not package `.skill` archives', 'Do not authenticate, install a CLI/MCP', 'No skill weights or model weights are trained']) {
    assert.ok(text.includes(term), term);
  }
  const safety = await read('references/knowledge-and-safety.md');
  for (const term of ['Observed', 'Reported', 'Inferred', 'Proposed', 'Unverified', 'redistribution rights', 'exclusive creation', 'kill processes']) {
    assert.ok(safety.includes(term), term);
  }
});

test('evaluation requires approval, one layout, baseline control and honest metrics', async () => {
  const text = await read('references/evaluation.md');
  for (const term of ['OS-enforced isolation', 'baseline cannot discover the candidate', 'fresh independent contexts', 'final untouched set', 'schema_version 1', 'run-001/', 'candidate minus baseline', 'Missing values are null/unknown', 'output_chars separate', 'no_response', 'Unrun evaluations remain labelled unrun']) {
    assert.ok(text.includes(term), term);
  }
  assert.match(await read('references/review-roles.md'), /tie or inconclusive/);
  assert.match(await read('references/review-roles.md'), /not registered prompts, autonomous agents/);
});

test('synthetic plan is explicitly unapproved, versioned and does not claim metrics', async () => {
  const plan = JSON.parse(await read('assets/eval-plan.example.json'));
  assert.equal(plan.schema_version, 1);
  assert.equal(plan.record_kind, 'synthetic_example_not_executed');
  assert.equal(plan.execution.approved, false);
  assert.equal(plan.execution.isolation, 'not_verified');
  assert.equal(plan.execution.provider, null);
  assert.equal(plan.execution.model, null);
  assert.deepEqual(plan.execution.tools, []);
  for (const value of Object.values(plan.execution.metric_defaults)) assert.equal(value, null);
  assert.equal(plan.configurations.baseline.contamination_check, 'not_run');
  assert.equal(new Set(plan.cases.map(c => c.id)).size, plan.cases.length);
  assert.deepEqual(new Set(plan.cases.map(c => c.category)), new Set(['positive', 'negative', 'edge']));
  for (const item of plan.cases) {
    assert.match(item.id, /^case-\d{3}$/);
    assert.ok(item.prompt && item.expected_output && item.criteria.length);
    assert.equal(new Set(item.criteria.map(c => c.id)).size, item.criteria.length);
    for (const criterion of item.criteria) assert.ok(criterion.text && criterion.verification);
  }
});

test('creator docs distinguish instruction loading from real evaluation and teaching', async () => {
  const catalogue = await readFile(resolve(root, 'skills/engineering-skills/SKILL.md'), 'utf8');
  assert.ok(catalogue.includes('`skill-creator/SKILL.md`'));
  assert.ok(!catalogue.includes('`teach/SKILL.md`'));
  assert.ok(!catalogue.includes('/skill:teach'));
  const readme = await read('README.md');
  assert.match(readme, /No separate installation/);
  assert.match(readme, /No new evaluator runtime/);
  assert.match(readme, /No automatic install, commit, publishing/i);
  assert.match(await readFile(resolve(root, 'THIRD_PARTY_NOTICES.md'), 'utf8'), /Anthropic — adapted skill-creator guidance/);
  assert.match(await readFile(resolve(root, 'docs/DEPENDENCIES.md'), 'utf8'), /Reading\/authoring guidance requires no new dependency/);
});
