import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { root, assertUnifiedManifest, registeredSkillFiles } from './package-contract.mjs';

const base = resolve(root, 'integrations/prometheus-label-strategy');
const read = path => readFile(resolve(base, path), 'utf8');
const json = async path => JSON.parse(await read(path));
const source = 'skills/grafana-cloud/prometheus-label-strategy/SKILL.md';
const entry = 'skills/prometheus-label-strategy/SKILL.md';
async function files(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const path = resolve(dir, name), stat = await lstat(path);
    assert.equal(stat.isSymbolicLink(), false, path);
    if (stat.isDirectory()) out.push(...await files(path));
    else { assert.ok(stat.isFile(), path); out.push(path); }
  }
  return out;
}

// These tests check static integration and illustrative invariants only. They do
// not query production, implement runtime policy or validate real PromQL semantics.
test('label strategy includes the complete pinned official source and Apache license unchanged', async () => {
  const meta = await json('UPSTREAM.json');
  assert.equal(meta.repository, 'https://github.com/grafana/skills');
  assert.equal(meta.commit, '8fb72a527961f05e708f53d2a0500709e12d7970');
  assert.equal(meta.source_skill, 'prometheus-label-strategy');
  assert.equal(meta.registered_skill, 'prometheus-label-strategy');
  assert.equal(meta.license, 'Apache-2.0');
  assert.equal(meta.snapshot_root, 'upstream');
  const hashes = {
    LICENSE: 'efb4d91baa7cd9559d3452f79deb2b3d9dc819c83d7058a1f90ac70484a1a23e',
    [source]: 'e252cada8154f1caa56eb352c4873dd05462f22d92b9cc5192963fc15d7b29b9',
  };
  assert.deepEqual(meta.source_sha256, hashes);
  const prefix = resolve(base, 'upstream') + '/';
  assert.deepEqual((await files(resolve(base, 'upstream'))).map(p => p.slice(prefix.length)).sort(), Object.keys(hashes).sort());
  for (const [path, hash] of Object.entries(hashes)) {
    assert.equal(createHash('sha256').update(await readFile(resolve(base, 'upstream', path))).digest('hex'), hash);
  }
  assert.match(await read('upstream/LICENSE'), /Copyright 2026 Grafana Labs/);
});

test('label strategy is registered once with no startup dependencies or discovered source duplicate', async () => {
  const pkg = await assertUnifiedManifest();
  const registered = await registeredSkillFiles();
  assert.deepEqual(registered.filter(p => p.startsWith(base + '/')), [resolve(base, entry)]);
  const component = await json('package.json');
  assert.deepEqual(component.pi.skills, ['./' + entry]);
  assert.deepEqual(component.pi.extensions, []);
  assert.deepEqual(component.pi.prompts, []);
  for (const key of ['scripts', 'dependencies', 'optionalDependencies']) assert.equal(component[key], undefined);
  assert.ok(pkg.scripts.test.includes('prometheus-label-strategy-integration.test.mjs'));
  assert.equal(pkg.dependencies, undefined);
  assert.match(await read(entry), /^name: prometheus-label-strategy$/m);
  assert.ok(Buffer.byteLength(await read(entry)) <= 8192, 'bounded host-readable entrypoint');
});

test('full module has safe local links and only documented inert file types', async () => {
  for (const path of await files(base)) {
    assert.match(path, /\.(md|json)$|\/LICENSE$/);
    if (!path.endsWith('.md')) continue;
    const text = await readFile(path, 'utf8');
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^(https?:|#|mailto:)/.test(link)) continue;
      const target = resolve(dirname(path), link.split('#')[0]);
      assert.ok(target.startsWith(base + '/'), link);
      await lstat(target);
    }
  }
});

test('local adapter corrects numerical, backend, identity, join and exemplar assumptions', async () => {
  const text = await read(entry);
  for (const phrase of ['Local modifications', 'possible-combinations upper model', 'B + 2 + C', 'Label values are strings', 'not the only safe', 'not automatically reduce ingest cost', 'not a universal exemplar switch', 'does **not enable exemplars**', 'right-hand info series must be unique', 'independent reset histories', 'not consequence-free', 'Static labels are bounded, not free', 'not a guaranteed symptom']) {
    assert.ok(text.includes(phrase), phrase);
  }
  for (const phrase of ['No live queries', 'separate deployment approval', 'Enterprise', 'privacy', 'rollback', 'not bundled runtime requirements']) {
    assert.ok(text.toLowerCase().includes(phrase.toLowerCase()), phrase);
  }
  const guide = await read('README.md');
  assert.match(guide, /not a security certification/);
  assert.match(guide, /no Prometheus|no runtime dependency|requires no/);
  assert.match(guide, /No automatic fetch or installation/);
});

test('synthetic fixture demonstrates a distinguishing-label collision without performing changes', async () => {
  const fixture = await json('assets/review.example.json');
  assert.equal(fixture.execution_approved, false);
  assert.equal(fixture.measurement_claim, false);
  const f = fixture.identity_example;
  const identity = labels => JSON.stringify(Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)));
  const before = new Set(f.before.map(identity));
  const after = new Set(f.before.map(labels => identity(Object.fromEntries(Object.entries(labels).filter(([key]) => key !== f.proposed_remove)))));
  assert.equal(before.size, f.expected_unique_before);
  assert.equal(after.size, f.expected_unique_after);
  assert.ok(after.size < before.size);
  assert.equal(f.decision, 'reject-collision; do not apply');
});

test('synthetic cardinality and histogram examples distinguish observations from assumptions', async () => {
  const fixture = await json('assets/review.example.json');
  const c = fixture.cardinality_example;
  const observed = new Set(c.observed.map(labels => JSON.stringify(labels)));
  const distinct = Object.fromEntries(Object.keys(c.distinct_values).map(k => [k, new Set(c.observed.map(row => row[k])).size]));
  assert.deepEqual(distinct, c.distinct_values);
  assert.equal(Object.values(distinct).reduce((a, b) => a * b, 1), c.possible_product);
  assert.equal(observed.size, c.observed_series);
  assert.ok(c.possible_product > c.observed_series);
  const h = fixture.histogram_example;
  assert.equal(h.bucket_series_including_inf + h.sum_series + h.count_series + h.created_series, h.observed_series_per_label_set);
  assert.equal(h.created_series, 0);
});

test('catalogue and public documentation link the reusable integration and source boundary', async () => {
  const catalogue = await readFile(resolve(root, 'skills/engineering-skills/SKILL.md'), 'utf8');
  assert.ok(catalogue.includes('integrations/prometheus-label-strategy/' + entry));
  for (const path of ['README.md', 'README.en.md', 'docs/DEPENDENCIES.md', 'THIRD_PARTY_NOTICES.md']) {
    const text = await readFile(resolve(root, path), 'utf8');
    assert.ok(text.includes('prometheus-label-strategy'), path);
  }
  const text = await read('README.md');
  assert.match(text, /Enterprise inventory, credentials, dashboards/);
  assert.match(text, /their own repositories/);
});
