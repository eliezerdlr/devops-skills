import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { root, assertUnifiedManifest, registeredSkillFiles } from './package-contract.mjs';
const base = resolve(root, 'integrations/grafana-dashboards');
const read = path => readFile(resolve(base, path), 'utf8');
async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const path = resolve(dir, entry), stat = await lstat(path);
    assert.equal(stat.isSymbolicLink(), false);
    if (stat.isDirectory()) out.push(...await files(path));
    else out.push(path);
  }
  return out;
}

test('official dashboarding complete snapshot has pinned Apache provenance and exact inventory', async () => {
  const meta = JSON.parse(await read('UPSTREAM.json'));
  assert.equal(meta.repository, 'https://github.com/grafana/skills');
  assert.equal(meta.commit, '8fb72a527961f05e708f53d2a0500709e12d7970');
  assert.equal(meta.source_skill, 'dashboarding');
  assert.equal(meta.registered_skill, 'grafana-dashboards');
  assert.equal(meta.license, 'Apache-2.0');
  const expected = ['LICENSE', 'skills/grafana-core/dashboarding/SKILL.md', 'skills/grafana-core/dashboarding/references/json-schema.md'];
  assert.deepEqual(Object.keys(meta.source_sha256).sort(), expected.sort());
  const prefix = resolve(base, 'upstream') + '/';
  assert.deepEqual((await files(resolve(base, 'upstream'))).map(p => p.slice(prefix.length)).sort(), expected.sort());
  for (const [path, hash] of Object.entries(meta.source_sha256)) {
    assert.equal(createHash('sha256').update(await readFile(resolve(base, 'upstream', path))).digest('hex'), hash);
  }
  assert.match(await read('upstream/LICENSE'), /Copyright 2026 Grafana Labs/);
  assert.match(await read('upstream/LICENSE'), /Version 2.0, January 2004/);
});

test('single root registers only the bounded Grafana entrypoint with no startup dependencies', async () => {
  const pkg = await assertUnifiedManifest();
  const entries = (await registeredSkillFiles()).filter(p => p.includes('/grafana-dashboards/'));
  assert.deepEqual(entries, [resolve(base, 'skills/grafana-dashboards/SKILL.md')]);
  assert.equal(pkg.pi.skills.filter(p => p.includes('/grafana-dashboards/')).length, 1);
  assert.ok(pkg.scripts.test.includes('grafana-dashboards-integration.test.mjs'));
  const component = JSON.parse(await read('package.json'));
  assert.deepEqual(component.pi.extensions, []);
  assert.deepEqual(component.pi.prompts, []);
  assert.equal(component.scripts, undefined);
  assert.equal(component.dependencies, undefined);
});

test('all local relative Markdown links resolve including complete source references', async () => {
  for (const path of (await files(base)).filter(p => p.endsWith('.md'))) {
    const text = await readFile(path, 'utf8');
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^(https?:|#|mailto:)/.test(link)) continue;
      const target = resolve(dirname(path), link.split('#')[0]);
      assert.ok(target.startsWith(root + '/'), link);
      await lstat(target);
    }
  }
});

test('modern illustrative dashboard has bounded nonoverlapping layout, units and placeholders', async () => {
  const dashboard = JSON.parse(await read('assets/dashboard.example.json'));
  assert.equal(new Set(dashboard.panels.map(p => p.id)).size, dashboard.panels.length);
  for (const p of dashboard.panels) {
    assert.ok(['stat', 'timeseries'].includes(p.type));
    assert.equal(p.alert, undefined);
    const { x, y, w, h } = p.gridPos;
    assert.ok([x, y, w, h].every(Number.isInteger));
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 24);
    assert.equal(p.datasource.uid, 'REPLACE_DATASOURCE_UID');
    assert.equal(p.fieldConfig.defaults.noValue, 'No Data');
    assert.ok(p.targets.every(t => t.expr.includes('example_')));
  }
  for (let i = 0; i < dashboard.panels.length; i++) for (let j = i + 1; j < dashboard.panels.length; j++) {
    const a = dashboard.panels[i].gridPos, b = dashboard.panels[j].gridPos;
    assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }
  const ratio = dashboard.panels[0];
  assert.equal(ratio.fieldConfig.defaults.unit, 'percentunit');
  assert.match(ratio.targets[0].expr, / > 0\)/);
  assert.doesNotMatch(ratio.targets[0].expr, /or vector\(0\)/);
  assert.deepEqual(ratio.options.reduceOptions.calcs, ['last']);
});

test('local guidance corrects operational and semantic hazards without claiming live validation', async () => {
  const skill = await read('skills/grafana-dashboards/SKILL.md');
  assert.match(skill, /^name: grafana-dashboards$/m);
  for (const phrase of ['Modified guidance', 'Provisioned dashboard', 'source of truth', 'explicitly approved', 'recheck version', 'overwrite: true', 'percentunit', 'multiply by 100', 'zero/missing', 'schemaVersion 41', 'No Data', 'stale', 'ReplicaLag', 'No automatic rollback', 'Visual inspection']) {
    assert.ok(skill.includes(phrase), phrase);
  }
  assert.match(await read('README.md'), /not a security certification/);
  assert.match(await read('README.md'), /not.*wshobson\/agents/);
  assert.match(await read('README.md'), /no mandatory runtime|not mandatory dependencies/);
});
