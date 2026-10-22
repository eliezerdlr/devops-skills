import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { prepare, describe, execute, loadConfig } from '../integrations/archify/adapter.mjs';

const integration = fileURLToPath(new URL('../integrations/archify/', import.meta.url));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
// Generated fixture: the actual Archify CLI is NEVER executed by this suite.
const mockCLI = `import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash = x => createHash('sha256').update(x).digest('hex');
const [command,type,input,output] = process.argv.slice(2);
if (process.env.ARCHIFY_UPDATE_CHECK_DISABLED !== '1' || process.env.NODE_OPTIONS || process.env.ARCHIFY_CHROME) process.exit(19);
if (command === 'deliver') {
  const bytes = fs.readFileSync(input);
  const candidate = JSON.parse(bytes);
  const scenario = candidate.mockScenario;
  if (scenario === 'fail') { console.error('mock failure'); process.exit(7); }
  if (scenario === 'timeout') { setInterval(() => {}, 1000); }
  else if (scenario === 'overflow') { process.stdout.write('x'.repeat(50000)); }
  else if (scenario === 'malformed') { console.log('not json'); }
  else {
    const artifact = Buffer.from('<!doctype html><title>Mock only — not validated by Archify</title>');
    fs.writeFileSync(output,artifact,{flag:'wx'});
    const identity = {sha256:hash(artifact),bytes:artifact.length};
    const receipt = {schemaVersion:1,receiptId:'mock-receipt-id',ok:true,command,type,input,output,
      specification:{sha256:hash(bytes),bytes:bytes.length},artifact:identity,
      update:{reason:'disabled',noticeRequired:false},mockOnly:true};
    if (scenario === 'hash-mismatch') receipt.artifact.sha256 = 'bad';
    if (scenario === 'update-enabled') receipt.update.reason = 'network';
    if (scenario === 'wrong-path') receipt.output = '/elsewhere.html';
    if (scenario !== 'no-sidecar') fs.writeFileSync(output.slice(0,-5)+'.delivery.json',JSON.stringify({
      schemaVersion:1,receiptId:receipt.receiptId,status:'current',command:'deliver',type,input,output,
      specification:receipt.specification,artifact:receipt.artifact,mockOnly:true
    }),{flag:'wx'});
    if (scenario === 'output-symlink') { fs.unlinkSync(output); fs.symlinkSync(input,output); }
    if (scenario === 'sidecar-symlink') { fs.unlinkSync(output.slice(0,-5)+'.delivery.json'); fs.symlinkSync(input,output.slice(0,-5)+'.delivery.json'); }
    if (scenario === 'sidecar-hash-mismatch') {
      const sidecar = output.slice(0,-5)+'.delivery.json';
      const value = JSON.parse(fs.readFileSync(sidecar));
      value.artifact.sha256 = 'bad-sidecar-hash';
      fs.writeFileSync(sidecar,JSON.stringify(value));
    }
    fs.writeFileSync(output+'.mock-state',scenario || 'normal');
    console.log(JSON.stringify(receipt));
  }
} else if (command === 'check') {
  const scenario = fs.readFileSync(type+'.mock-state','utf8');
  if (scenario === 'check-fail') { console.error('strict check failed'); process.exit(8); }
  const artifact = fs.readFileSync(type);
  console.log(JSON.stringify({ok:true,deliveryReceiptId:scenario === 'check-id-mismatch'?'other-id':'mock-receipt-id',provenance:scenario === 'unknown-provenance'?'unknown':'current',
    artifact:{sha256:hash(artifact),bytes:artifact.length},mockOnly:true}));
} else process.exit(20);
`;

function fixture(t, scenario) {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'archify-mock-')));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const root = path.join(base, 'approved saída with spaces');
  const runtime = path.join(base, 'runtime externo');
  fs.mkdirSync(root);
  fs.mkdirSync(path.join(runtime, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(runtime, 'package.json'), JSON.stringify({ name: 'archify', version: '3.2.0' }));
  fs.writeFileSync(path.join(runtime, 'bin/archify.mjs'), mockCLI);
  const lock = Object.fromEntries(['package.json', 'bin/archify.mjs'].map((file) => [file, digest(fs.readFileSync(path.join(runtime, file)))]));
  const config = { outputRoot: root, candidate: path.join(root, 'candidato ação.json'), output: 'run ação with spaces/diagrama 漢字.html', type: 'architecture', offline: true };
  const data = { schema_version: 1, diagram_type: 'architecture', meta: { output: config.output, title: 'Ação 漢字', quality_profile: 'showcase' }, components: [], ...(scenario ? { mockScenario: scenario } : {}) };
  const save = () => fs.writeFileSync(config.candidate, JSON.stringify(data));
  save();
  return { root, runtime, base, config, data, save, options: { runtimeDir: runtime, lock } };
}

test('inventory contains exactly one on-demand skill and no prompts/extensions', () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(integration, 'package.json')));
  assert.deepEqual(inventory.pi.skills, ['./skills/archify/SKILL.md']);
  assert.deepEqual(inventory.pi.prompts, []);
  assert.deepEqual(inventory.pi.extensions, []);
  const skill = fs.readFileSync(path.join(integration, 'skills/archify/SKILL.md'), 'utf8');
  assert.ok(skill.split('\n').length < 100);
  const pin = JSON.parse(fs.readFileSync(path.join(integration, 'runtime-lock.json')));
  assert.ok(Object.keys(pin).length >= 200);
  assert.ok(pin['bin/delivery-update.mjs']);
});

test('plan is non-mutating; Unicode/spaces remain separate argv values', (t) => {
  const f = fixture(t);
  const before = fs.readdirSync(f.root);
  const plan = prepare(f.config, f.options);
  assert.equal(describe(plan).mode, 'plan');
  assert.deepEqual(fs.readdirSync(f.root), before);
  assert.equal(plan.commands[0][3], path.join(plan.job, 'candidate.json'));
  assert.equal(plan.commands[0][4], path.join(f.root, f.config.output));
  assert.ok(!plan.commands.flat().includes('--open'));
  assert.ok(!plan.commands.flat().includes('finalize'));
});

test('explicit execute records mock receipts, hashes and strict check without inheriting hooks', async (t) => {
  const f = fixture(t);
  const old = process.env.ARCHIFY_CHROME;
  process.env.ARCHIFY_CHROME = '/do-not-open-personal-browser';
  t.after(() => { if (old === undefined) delete process.env.ARCHIFY_CHROME; else process.env.ARCHIFY_CHROME = old; });
  const result = await execute(f.config, f.options);
  assert.equal(result.ok, true, result.failure);
  assert.equal(result.stages.length, 2);
  assert.equal(result.browserEvidence, 'not-run');
  assert.equal(result.perceptualReview, 'not-run');
  assert.equal(result.artifactSha256, digest(fs.readFileSync(result.output)));
  assert.equal(JSON.parse(fs.readFileSync(result.receiptPath)).ok, true);
  assert.equal(JSON.parse(result.stages[0].stdout).mockOnly, true);
  assert.deepEqual(fs.readFileSync(path.join(path.dirname(result.output), 'candidate.json')), fs.readFileSync(f.config.candidate));
  await assert.rejects(execute(f.config, f.options), /destination already exists/);
});

for (const scenario of ['fail', 'timeout', 'overflow', 'malformed', 'hash-mismatch', 'update-enabled', 'wrong-path', 'no-sidecar', 'check-fail', 'unknown-provenance', 'check-id-mismatch', 'output-symlink', 'sidecar-symlink', 'sidecar-hash-mismatch']) {
  test(`mock ${scenario} is a failure, preserves evidence, and cannot silently retry/overwrite`, async (t) => {
    const f = fixture(t, scenario);
    if (scenario === 'timeout') f.config.timeoutMs = 200;
    if (scenario === 'overflow') f.config.maxBufferBytes = 1024;
    const result = await execute(f.config, f.options);
    assert.equal(result.ok, false);
    assert.ok(result.failure);
    assert.equal(JSON.parse(fs.readFileSync(result.receiptPath)).ok, false);
    if (scenario === 'timeout') assert.equal(result.stages[0].error.signal, 'SIGKILL');
    if (scenario === 'overflow') assert.equal(result.stages[0].error.code, 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER');
    await assert.rejects(execute(f.config, f.options), /destination already exists/);
  });
}

test('config validation rejects flags, invalid bounds, missing runtime and wrong version/pin', (t) => {
  const f = fixture(t);
  for (const change of [{ force: true }, { offline: false }, { type: 'explainer' }, { quality: 'other' }, { timeoutMs: 0 }, { maxBufferBytes: 999 }]) {
    assert.throws(() => prepare({ ...f.config, ...change }, f.options));
  }
  assert.throws(() => prepare(f.config, { ...f.options, runtimeDir: 'relative' }), /absolute/);
  fs.appendFileSync(path.join(f.runtime, 'bin/archify.mjs'), '\n// changed');
  assert.throws(() => prepare(f.config, f.options), /pin mismatch/);
  fs.writeFileSync(path.join(f.runtime, 'package.json'), '{"name":"archify","version":"0.0.0"}');
  assert.throws(() => prepare(f.config, f.options), /3.2.0/);
});

test('output traversal, absolute paths and existing destinations are refused', (t) => {
  const f = fixture(t);
  for (const output of ['../escape.html', '/tmp/escape.html', 'run/../../escape.html', 'run/../escape.html', 'run\\escape.html', 'run/a.txt', 'run/a\n.html', 'run/con.html', 'run/a\ud800.html']) {
    assert.throws(() => prepare({ ...f.config, output }, f.options));
  }
  fs.mkdirSync(path.join(f.root, f.config.output.split('/')[0]));
  assert.throws(() => prepare(f.config, f.options), /destination already exists/);
});

test('candidate must be bounded JSON inside approved root, never executable JS', (t) => {
  const f = fixture(t);
  const outside = path.join(f.base, 'candidate.json');
  fs.writeFileSync(outside, JSON.stringify(f.data));
  assert.throws(() => prepare({ ...f.config, candidate: outside }, f.options), /inside outputRoot/);
  const js = path.join(f.root, 'candidate.mjs');
  fs.writeFileSync(js, 'throw new Error("must not run")');
  assert.throws(() => prepare({ ...f.config, candidate: js }, f.options), /JSON file/);
  fs.writeFileSync(f.config.candidate, 'invalid JSON');
  assert.throws(() => prepare(f.config, f.options), SyntaxError);
  fs.writeFileSync(f.config.candidate, 'x'.repeat(1024 * 1024 + 1));
  assert.throws(() => prepare(f.config, f.options), /too large/);
});

test('candidate output, quality, logo/markup/URL policies are enforced', (t) => {
  const f = fixture(t);
  for (const change of [{ diagram_type: 'workflow' }, { meta: { ...f.data.meta, output: '../other.html' } }, { meta: { ...f.data.meta, quality_profile: 'standard' } }, { brand: 'vue' }, { label: '<script>alert(1)</script>' }, { logo: 'vendor' }, { href: 'https://example.test' }]) {
    fs.writeFileSync(f.config.candidate, JSON.stringify({ ...f.data, ...change }));
    assert.throws(() => prepare(f.config, f.options));
  }
});

test('symlinks to outside, inside, dangling targets and runtime files are refused', (t) => {
  const f = fixture(t);
  const alias = path.join(f.root, 'alias.json');
  for (const target of [f.config.candidate, path.join(f.base, 'outside.json'), path.join(f.base, 'missing.json')]) {
    fs.symlinkSync(target, alias);
    assert.throws(() => prepare({ ...f.config, candidate: alias }, f.options), /symlink/);
    fs.unlinkSync(alias);
  }
  const linkedRoot = path.join(f.base, 'linked-root');
  fs.symlinkSync(f.root, linkedRoot);
  assert.throws(() => prepare({ ...f.config, outputRoot: linkedRoot }, f.options), /symlink/);
  fs.symlinkSync(f.base, path.join(f.root, f.config.output.split('/')[0]));
  assert.throws(() => prepare(f.config, f.options), /destination already exists/);
  fs.unlinkSync(path.join(f.root, f.config.output.split('/')[0]));
  const cli = path.join(f.runtime, 'bin/archify.mjs');
  const replacement = path.join(f.base, 'mock.mjs');
  fs.renameSync(cli, replacement);
  fs.symlinkSync(replacement, cli);
  assert.throws(() => prepare(f.config, f.options), /symlink/);
});

test('CLI dry-run validates production pin but does not execute a mock under a forged version', (t) => {
  const f = fixture(t);
  const configPath = path.join(f.base, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(f.config));
  assert.deepEqual(loadConfig(configPath), f.config);
  assert.throws(() => execFileSync(process.execPath, [path.join(integration, 'adapter.mjs'), 'dry-run', configPath], {
    env: { DEVOPS_ARCHIFY_DIR: f.runtime }, stdio: 'pipe', timeout: 5000,
  }), (error) => error.status === 1 && /pin mismatch|ENOENT/.test(error.stderr.toString()));
  assert.equal(fs.existsSync(path.join(f.root, f.config.output)), false);
});
