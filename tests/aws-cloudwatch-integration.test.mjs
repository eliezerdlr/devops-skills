import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { root, assertUnifiedManifest, registeredSkillFiles } from './package-contract.mjs';

const aws = resolve(root, 'integrations/aws-toolkit');
const snapshot = resolve(aws, 'upstream/cloudwatch');
const names = ['aws-observability', 'setting-up-cloudwatch-alarm-notifications'];
const read = p => readFile(p, 'utf8');
const json = async p => JSON.parse(await read(p));
const sha = data => createHash('sha256').update(data).digest('hex');
const run = promisify(execFile);
async function files(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false, 'no symlinks in distributed source');
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) found.push(...await files(path));
    else { assert.ok(entry.isFile(), path); found.push(path); }
  }
  return found.sort();
}

// Static/offline integration contracts: no imports of AWS helpers, SDK install,
// cloud requests, inference or production scripts. Text checks are not enforcement.
test('two CloudWatch entrypoints are registered once; complete support source is not discovered', async () => {
  const pkg = await assertUnifiedManifest();
  const registered = await registeredSkillFiles();
  for (const name of names) {
    assert.equal(registered.filter(p => p === resolve(aws, `skills/${name}/SKILL.md`)).length, 1);
  }
  assert.equal(registered.some(p => p.startsWith(snapshot + sep)), false);
  const component = await json(resolve(aws, 'package.json'));
  assert.equal(component.pi.skills.length, 5);
  assert.deepEqual(component.pi.extensions, []);
  assert.deepEqual(component.pi.prompts, []);
  for (const key of ['dependencies', 'optionalDependencies', 'scripts']) assert.equal(Object.hasOwn(component, key), false);
  assert.equal(Object.hasOwn(pkg, 'dependencies'), false);
  assert.equal(Object.hasOwn(pkg.scripts, 'postinstall'), false);
  assert.ok(pkg.scripts.test.includes('tests/aws-cloudwatch-integration.test.mjs'));
});

test('complete reviewed snapshot matches all 120 pinned source hashes and Apache attribution', async () => {
  const meta = await json(resolve(aws, 'CLOUDWATCH-UPSTREAM.json'));
  assert.equal(meta.repository, 'https://github.com/aws/agent-toolkit-for-aws');
  assert.equal(meta.commit, 'b2a94d85e6673f54511df0b5d78b82b0e716d73b');
  assert.equal(meta.license, 'Apache-2.0');
  assert.equal(meta.snapshot_root, 'upstream/cloudwatch');
  assert.deepEqual(meta.registered_skills, names);
  assert.deepEqual(meta.bundled_support_skills, ['setting-up-cloudwatch-observability']);
  const trees = [
    ['skills/core-skills/aws-observability', 54],
    ['skills/specialized-skills/operations-skills/setting-up-cloudwatch-observability', 62],
    ['skills/specialized-skills/operations-skills/setting-up-cloudwatch-alarm-notifications', 2],
  ];
  assert.deepEqual(meta.source_directories, trees.map(([path]) => path));
  const actual = await files(snapshot);
  const expected = Object.keys(meta.source_sha256).sort();
  assert.equal(expected.length, 120);
  assert.deepEqual(actual.map(p => relative(snapshot, p)).sort(), expected);
  let bytes = 0;
  for (const path of expected) {
    assert.ok(!path.startsWith('/') && !path.split('/').includes('..'), path);
    const data = await readFile(resolve(snapshot, path));
    bytes += data.length;
    assert.equal(sha(data), meta.source_sha256[path], path);
  }
  assert.equal(bytes, 1870931);
  for (const [path, count] of trees) assert.equal((await files(resolve(snapshot, path))).length, count);
  assert.equal(meta.source_sha256.LICENSE, '09e8a9bcec8067104652c168685ab0931e7868f9c8284b66f5ae6edae5f1130b');
  assert.equal(meta.source_sha256.NOTICE, 'd4290ed64c2edd0fce1d84e3f9dfb2881240fe534def76b8cd29ed6af683e287');
  assert.equal(meta.source_sha256['skills/core-skills/aws-observability/SKILL.md'], '0391b8b79ded7b16087b70cbd0a290fb11a217541b1de4f065a11943bc1e3081');
  assert.match(await read(resolve(snapshot, 'NOTICE')), /Copyright Amazon.com/);
});

test('all bundled relative Markdown references and local entrypoint links resolve', async () => {
  const paths = [...await files(snapshot), ...names.map(n => resolve(aws, `skills/${n}/SKILL.md`)), resolve(aws, 'CLOUDWATCH.md')];
  let checked = 0;
  for (const path of paths.filter(p => p.endsWith('.md'))) {
    for (const match of (await read(path)).matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
      const link = match[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('#')) continue;
      const target = resolve(dirname(path), decodeURIComponent(link.split('#')[0]));
      assert.ok(target.startsWith(aws + sep), `${path}: ${link} escapes module`);
      await access(target);
      checked++;
    }
  }
  assert.ok(checked > 50, 'exercise full reference closure, not just entrypoints');
});

test('26 optional Python files parse and their direct imports close without executing source', async () => {
  const script = String.raw`
import ast, pathlib, sys
base = pathlib.Path(sys.argv[1])
paths = sorted(base.rglob('*.py'))
assert len(paths) == 26, len(paths)
modules = {p.stem for p in paths}
external = set()
for path in paths:
    tree = ast.parse(path.read_text(), filename=str(path))
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports = [alias.name.split('.')[0] for alias in node.names]
        elif isinstance(node, ast.ImportFrom):
            imports = [(node.module or '').split('.')[0]]
        else:
            continue
        for name in imports:
            if not name or name in sys.stdlib_module_names:
                continue
            if name.startswith('di_'):
                assert name in modules, (str(path), name)
            else:
                external.add(name)
assert external == {'boto3', 'botocore'}, external
print('26 files parsed; external imports: boto3, botocore')
`;
  const result = await run('python3', ['-B', '-c', script, snapshot], { timeout: 30000 });
  assert.match(result.stdout, /26 files parsed/);
  assert.equal((await files(snapshot)).some(p => /__pycache__|\.pyc$/.test(p)), false);
  const requirements = await read(resolve(aws, 'requirements-cloudwatch.txt'));
  assert.deepEqual(requirements.split('\n').filter(line => line && !line.startsWith('#')), ['boto3>=1.43.35', 'botocore>=1.43.35']);
});

test('local routing preserves full sources, explicit region and approval/data/cost boundaries', async () => {
  const entry = await read(resolve(aws, `skills/${names[0]}/SKILL.md`));
  const guide = await read(resolve(aws, 'CLOUDWATCH.md'));
  for (const phrase of ['upstream skill', 'onboarding', 'Resolve every upstream reference', 'Terraform', 'ReplicaLag', 'No automatic', 'external-model scoring']) assert.ok(entry.includes(phrase), phrase);
  for (const phrase of ['us-east-1', 'Region is ignored', 'PII', 'retention', 'writeback', 'NOT read-only', 'no MCP configuration', 'not a transitive/hash lock', '26 Python files', 'aws-cdk-lib', 'constructs', 'ADOT', 'six credential-access', 'one installation finding', 'optional external integrations']) assert.ok(guide.toLowerCase().includes(phrase.toLowerCase()), phrase);
  assert.match(guide, /not credential exfiltration or a runtime installer/);
  assert.match(guide, /No cloud operation or optional dependency installation/);
});

test('notification entrypoint addresses KMS, preservation, unsafe state reset and delivery limitations', async () => {
  const entry = await read(resolve(aws, `skills/${names[1]}/SKILL.md`));
  for (const phrase of ['alias/aws/sns', 'AWS-managed key policy', 'customer-managed key', 'Preserve all settings', 'metric/composite', 'separate approval', 'Never force a production alarm', 'actual receipt', 'AWS SDK v2', 'resource dimensions', 'No direct CLI writes']) assert.ok(entry.includes(phrase), phrase);
  assert.match(entry, /No SDK, MCP configuration, AWS credentials, schedule or cloud resource/);
});

test('catalogue, notices and dependency guides identify both additions without hidden runtime installs', async () => {
  const catalogue = await read(resolve(root, 'skills/engineering-skills/SKILL.md'));
  for (const name of names) assert.ok(catalogue.includes(`integrations/aws-toolkit/skills/${name}/SKILL.md`));
  const notices = await read(resolve(root, 'THIRD_PARTY_NOTICES.md'));
  assert.ok(notices.includes('CLOUDWATCH-UPSTREAM.json'));
  assert.ok(notices.includes('b2a94d85e6673f54511df0b5d78b82b0e716d73b'));
  for (const path of ['README.md', 'README.en.md', 'docs/DEPENDENCIES.md']) {
    const content = await read(resolve(root, path));
    assert.ok(content.includes('integrations/aws-toolkit/CLOUDWATCH.md'), path);
    for (const name of names) assert.ok(content.includes(name), `${path}: ${name}`);
  }
});
