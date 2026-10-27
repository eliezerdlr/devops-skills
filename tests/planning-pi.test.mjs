import test from 'node:test';
import { skillResourceCount, promptCount } from './package-contract.mjs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const sdkRoot = process.env.PI_SDK_ROOT;
if (!sdkRoot) throw new Error('Set PI_SDK_ROOT to the installed Pi 1.2.0 SDK package directory');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const integration = resolve(root, 'integrations/planning-with-files');
const upstream = resolve(integration, 'upstream');
const entry = resolve(upstream, 'extensions/planning-with-files/index.ts');
const requireSdk = createRequire(resolve(sdkRoot, 'package.json'));
const { createJiti } = requireSdk('jiti');
const jiti = createJiti(import.meta.url, { alias: { '@earendil-works/pi-coding-agent': resolve(sdkRoot, 'dist/index.js') } });
const sdkImport = name => import(pathToFileURL(resolve(sdkRoot, `dist/core/${name}.js`)));
const { loadExtensions } = await sdkImport('extensions/loader');
const { readPlanStatus } = await jiti.import(resolve(upstream, 'extensions/planning-with-files/plan.ts'));
const { checkPlanAttestation } = await jiti.import(resolve(upstream, 'extensions/planning-with-files/attestation.ts'));
const planText = '# Synthetic plan\n### Phase 1: Evidence\n**Status:** complete\n### Phase 2: Review\n**Status:** pending\n';
// These are test-child-process settings, not edits to user Pi configuration.
delete process.env.PLAN_ID;
process.env.PWF_MODE = 'notify';

async function fixture(fn) {
  const cwd = await mkdtemp(resolve(tmpdir(), 'planning-integration-'));
  try {
    await mkdir(resolve(cwd, '.git'));
    await writeFile(resolve(cwd, 'task_plan.md'), planText);
    await writeFile(resolve(cwd, 'findings.md'), 'Synthetic evidence only\n');
    await writeFile(resolve(cwd, 'progress.md'), 'Synthetic test started\n');
    const notices = [], statuses = [], sent = [];
    const ctx = { cwd, hasUI: true, model: { provider: 'synthetic', id: 'offline' },
      sessionManager: { getSessionId: () => 'synthetic-session', getLeafId: () => 'synthetic-leaf' },
      ui: { notify: (...args) => notices.push(args), setStatus: (...args) => statuses.push(args) } };
    const loaded = await loadExtensions([entry], cwd);
    assert.deepEqual(loaded.errors, []);
    loaded.runtime.sendUserMessage = (...args) => sent.push(args);
    loaded.runtime.sendMessage = (...args) => sent.push(args);
    const ext = loaded.extensions[0];
    const emit = async (name, event = {}) => {
      const results = [];
      for (const handler of ext.handlers.get(name) ?? []) results.push(await handler({ type: name, ...event }, ctx));
      return results;
    };
    try { await fn({ cwd, ctx, ext, emit, notices, statuses, sent }); }
    finally { await emit('session_shutdown'); }
  } finally { delete process.env.PLAN_ID; process.env.PWF_MODE = 'notify'; await rm(cwd, { recursive: true, force: true }); }
}

test('vendored snapshot matches all 46 recorded SHA-256 hashes', async () => {
  const lines = (await readFile(resolve(integration, 'SHA256SUMS'), 'utf8')).trim().split('\n');
  assert.equal(lines.length, 46);
  for (const line of lines) {
    const [, digest, path] = line.match(/^([a-f0-9]{64})  (.+)$/);
    const actual = createHash('sha256').update(await readFile(resolve(upstream, path))).digest('hex');
    assert.equal(actual, digest, path);
  }
  assert.match(await readFile(resolve(upstream, 'LICENSE'), 'utf8'), /Copyright \(c\) 2026 Ahmad Adi/);
});
test('optional package adds one skill and one extension without changing base discovery', async () => {
  const [{ SettingsManager }, { DefaultPackageManager }, { loadSkills }] = await Promise.all(['settings-manager', 'package-manager', 'skills'].map(sdkImport));
  const cwd = await mkdtemp(resolve(tmpdir(), 'planning-resources-'));
  try {
    const paths = await new DefaultPackageManager({ cwd, agentDir: cwd, settingsManager: SettingsManager.inMemory({ packages: [root, upstream] }) }).resolve();
    const selected = group => paths[group].filter(p => p.enabled && p.path.startsWith(`${root}/`)).map(p => p.path);
    assert.equal(selected('skills').length, skillResourceCount + 1); assert.equal(selected('extensions').length, 2); assert.equal(selected('prompts').length, promptCount);
    const skills = loadSkills({ cwd, agentDir: cwd, skillPaths: selected('skills'), includeDefaults: false });
    assert.equal(skills.skills.length, skillResourceCount + 1); assert.deepEqual(skills.diagnostics, []);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
test('both real Pi extensions load together without tool or command collisions', async () => {
  const result = await loadExtensions([resolve(root, 'extensions/ops-orchestrator/index.ts'), entry], root);
  assert.deepEqual(result.errors, []);
  const names = result.extensions.flatMap(e => [...e.commands.keys()]);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.includes('ops-status')); assert.ok(names.includes('plan-execute'));
  assert.equal(result.extensions.reduce((n, e) => n + e.tools.size, 0), 4);
});
test('plan phases and findings are re-read from disk after updates', async () => fixture(async ({ cwd }) => {
  const status = readPlanStatus(cwd);
  assert.equal(status.totalPhases, 2); assert.equal(status.completePhases, 1); assert.equal(status.pendingPhases, 1);
  await writeFile(resolve(cwd, 'task_plan.md'), planText.replace('pending', 'complete'));
  assert.equal(readPlanStatus(cwd).completePhases, 2);
  assert.equal(await readFile(status.findingsPath, 'utf8'), 'Synthetic evidence only\n');
}));
test('before activation hooks remain passive and enqueue no model requests', async () => fixture(async ({ emit, sent }) => {
  assert.deepEqual(await emit('before_agent_start'), [undefined]);
  await emit('agent_end', { messages: [] }); assert.deepEqual(sent, []);
}));
test('notify mode remains non-continuing even after explicit plan-execute', async () => fixture(async ({ ext, ctx, emit, sent, notices }) => {
  await ext.commands.get('plan-execute').handler('', ctx);
  assert.deepEqual(await emit('before_agent_start'), [undefined]);
  await emit('agent_end', { messages: [] }); assert.deepEqual(sent, []);
  assert.ok(notices.some(n => n[0].includes('Continue manually')));
}));
test('parity injects the selected plan only after activation; reset disables injection', async () => fixture(async ({ ext, ctx, emit }) => {
  process.env.PWF_MODE = 'parity';
  assert.deepEqual(await emit('before_agent_start'), [undefined]);
  await ext.commands.get('plan-execute').handler('', ctx);
  assert.match((await emit('before_agent_start'))[0].message.content, /Synthetic plan/);
  await ext.commands.get('plan-execute').handler('reset', ctx);
  assert.deepEqual(await emit('before_agent_start'), [undefined]);
}));
test('provider error/abort cannot enqueue automatic continuation in parity mode', async () => fixture(async ({ ext, ctx, emit, sent }) => {
  process.env.PWF_MODE = 'parity'; await ext.commands.get('plan-execute').handler('', ctx);
  for (const stopReason of ['error', 'aborted']) await emit('agent_end', { messages: [{ role: 'assistant', stopReason }] });
  assert.deepEqual(sent, []);
}));
test('shutdown revokes plan activation', async () => fixture(async ({ ext, ctx, emit }) => {
  process.env.PWF_MODE = 'parity'; await ext.commands.get('plan-execute').handler('', ctx);
  await emit('session_shutdown'); assert.deepEqual(await emit('before_agent_start'), [undefined]);
}));
test('attestation detects plan changes but is not an infrastructure authorisation', async () => fixture(async ({ cwd }) => {
  const hash = createHash('sha256').update(planText).digest('hex');
  await writeFile(resolve(cwd, '.plan-attestation'), hash);
  assert.equal(checkPlanAttestation(readPlanStatus(cwd)).tampered, false);
  await writeFile(resolve(cwd, 'task_plan.md'), `${planText}\nChanged\n`);
  assert.equal(checkPlanAttestation(readPlanStatus(cwd)).tampered, true);
}));
test('explicit invalid plan selector fails closed instead of selecting root plan', async () => fixture(async ({ cwd }) => {
  process.env.PLAN_ID = '../../outside'; assert.equal(readPlanStatus(cwd).exists, false);
  process.env.PLAN_ID = 'nonexistent'; assert.equal(readPlanStatus(cwd).exists, false);
}));
