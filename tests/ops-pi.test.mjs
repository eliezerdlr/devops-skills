import test from 'node:test';
import { components, skillResourceCount, promptCount } from './package-contract.mjs';
import assert from 'node:assert/strict';
import { createRequire, findPackageJSON } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The host supplies Pi packages. Do not install a second copy into the runtime pack.
const sdkRoot = process.env.PI_SDK_ROOT;
if (!sdkRoot) throw new Error('Set PI_SDK_ROOT to the installed Pi 1.2.0 package directory for host integration tests');
const requireSdk = createRequire(resolve(sdkRoot, 'package.json'));
const { createJiti } = requireSdk('jiti');
const hostModule = name => resolve(dirname(findPackageJSON(name, pathToFileURL(resolve(sdkRoot, 'package.json')))), 'dist/index.js');
const jiti = createJiti(import.meta.url, { alias: {
  '@earendil-works/pi-coding-agent': resolve(sdkRoot, 'dist/index.js'),
  '@earendil-works/pi-agent-core': hostModule('@earendil-works/pi-agent-core'),
  typebox: requireSdk.resolve('typebox'),
} });
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { createAnalysisSession, loadRole } = await jiti.import(resolve(root, 'extensions/ops-orchestrator/index.ts'));
const { loadExtensions } = await import(pathToFileURL(resolve(sdkRoot, 'dist/core/extensions/loader.js')));
const { createAssistantMessageEventStream } = await import(pathToFileURL(hostModule('@earendil-works/pi-ai')));
const model = { id: 'offline-test', name: 'Offline test', api: 'openai-completions', provider: 'synthetic', baseUrl: 'https://example.invalid', reasoning: false, input: ['text'], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 8192 };
const good = JSON.stringify({ status: 'ok', summary: 'Synthetic assessment; no infrastructure accessed', findings: [] });

function context({ answer = good, approve = true, hasUI = true, error = false, hang = false, toolCall = false } = {}) {
  const calls = [], approvals = [], streams = [];
  const ctx = { cwd: root, hasUI, mode: 'tui', model,
    ui: { confirm: async (title, body) => { approvals.push({ title, body }); return approve; }, notify: () => {} },
    modelRegistry: { streamSimple: (selected, transcript, options) => {
      calls.push({ selected, transcript, options });
      const stream = createAssistantMessageEventStream(); streams.push(stream);
      const message = { role: 'assistant', content: toolCall ? [{ type: 'toolCall', id: 'synthetic-call', name: 'bash', arguments: { command: 'echo SYNTHETIC_NOT_AUTHORISED' } }] : [{ type: 'text', text: answer }], api: model.api, provider: model.provider, model: model.id, usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, totalTokens: 2, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } }, stopReason: error ? 'error' : toolCall ? 'toolUse' : 'stop', ...(error ? { errorMessage: 'SYNTHETIC_PROVIDER_SECRET' } : {}), timestamp: Date.now() };
      queueMicrotask(() => {
        if (hang) {
          options.signal?.addEventListener('abort', () => { stream.push({ type: 'error', reason: 'aborted', error: { ...message, stopReason: 'aborted' } }); stream.end(); }, { once: true });
          return;
        }
        stream.push({ type: 'start', partial: message });
        stream.push(error ? { type: 'error', reason: 'error', error: message } : { type: 'done', reason: message.stopReason, message }); stream.end(message);
      });
      return stream;
    } },
  };
  return { ctx, calls, approvals, streams };
}
async function extension() {
  const result = await loadExtensions([resolve(root, 'extensions/ops-orchestrator/index.ts')], root);
  assert.deepEqual(result.errors, []); result.runtime.getThinkingLevel = () => 'off';
  return result.extensions[0];
}
const input = { role: 'network-troubleshooter', task: 'Analyse synthetic evidence only', evidence: 'Synthetic CRC counter: 10 -> 900' };
async function invoke(ext, name, params, ctx, signal = new AbortController().signal) {
  const result = await ext.tools.get(name).definition.execute('test', params, signal, () => {}, ctx);
  return JSON.parse(result.content[0].text);
}

test('one root package discovers 120 skills, eight prompts and two extensions in actual Pi', async () => {
  const temp = await mkdtemp(resolve(tmpdir(), 'devops-resource-test-'));
  try {
    const sdkImport = name => import(pathToFileURL(resolve(sdkRoot, `dist/core/${name}.js`)));
    const [{ SettingsManager }, { DefaultPackageManager }, { loadSkills }, { loadPromptTemplates }] = await Promise.all(['settings-manager', 'package-manager', 'skills', 'prompt-templates'].map(sdkImport));
    const paths = await new DefaultPackageManager({ cwd: temp, agentDir: temp, settingsManager: SettingsManager.inMemory({ packages: [root] }) }).resolve();
    const selected = group => paths[group].filter(p => p.enabled && p.path.startsWith(`${root}/`)).map(p => p.path);
    assert.equal(selected('skills').length, skillResourceCount); assert.equal(selected('prompts').length, promptCount); assert.deepEqual(selected('extensions'), [resolve(root, 'extensions/ops-orchestrator/index.ts'), resolve(root, 'extensions/netbird-api/index.ts')]);
    const skills = loadSkills({ cwd: temp, agentDir: temp, skillPaths: selected('skills'), includeDefaults: false });
    const prompts = loadPromptTemplates({ cwd: temp, agentDir: temp, promptPaths: selected('prompts'), includeDefaults: false });
    assert.equal(skills.skills.length, skillResourceCount); assert.equal(prompts.templates.length, promptCount); assert.deepEqual(skills.diagnostics, []); assert.deepEqual(prompts.diagnostics, []);
  } finally { await rm(temp, { recursive: true, force: true }); }
});
test('legacy module registrations alongside root load no duplicate skills or prompts in actual Pi', async () => {
  const temp = await mkdtemp(resolve(tmpdir(), 'devops-legacy-resource-test-'));
  try {
    const sdkImport = name => import(pathToFileURL(resolve(sdkRoot, `dist/core/${name}.js`)));
    const [{ SettingsManager }, { DefaultPackageManager }, { loadSkills }, { loadPromptTemplates }] = await Promise.all(['settings-manager', 'package-manager', 'skills', 'prompt-templates'].map(sdkImport));
    const packages = [root, ...components.map(name => resolve(root, 'integrations', name))];
    const paths = await new DefaultPackageManager({ cwd: temp, agentDir: temp, settingsManager: SettingsManager.inMemory({ packages }) }).resolve();
    const selected = group => paths[group].filter(p => p.enabled && p.path.startsWith(`${root}/`)).map(p => p.path);
    const skills = loadSkills({ cwd: temp, agentDir: temp, skillPaths: selected('skills'), includeDefaults: false });
    const prompts = loadPromptTemplates({ cwd: temp, agentDir: temp, promptPaths: selected('prompts'), includeDefaults: false });
    assert.equal(skills.skills.length, skillResourceCount);
    assert.equal(prompts.templates.length, promptCount);
    assert.deepEqual(skills.diagnostics, []);
    assert.deepEqual(prompts.diagnostics, []);
    assert.deepEqual(selected('extensions'), [resolve(root, 'extensions/ops-orchestrator/index.ts'), resolve(root, 'extensions/netbird-api/index.ts')]);
  } finally { await rm(temp, { recursive: true, force: true }); }
});
test('actual Pi loader registers exactly four tools and two commands', async () => {
  const e = await extension(); assert.deepEqual([...e.tools.keys()], ['ops_agent', 'ops_workflow', 'ops_runs', 'ops_cancel']);
  assert.deepEqual([...e.commands.keys()], ['ops-status', 'ops-cancel']);
});
test('only allowlisted roles load; role context includes no unresolved arguments', async () => {
  for (const role of ['network-architect', 'network-troubleshooter', 'network-config-reviewer']) assert.ok(!(await loadRole(role)).includes('$ARGUMENTS'));
  await assert.rejects(loadRole('../../LICENSE'));
});
test('Pi core worker has independent context, no tools, and bounded parent-registry request', async () => {
  const { ctx, calls } = context(); const s = await createAnalysisSession(ctx, input.role, 'off');
  try {
    assert.deepEqual(s.getActiveToolNames(), []); await s.prompt('SYNTHETIC_TASK');
    assert.equal(s.getLastAssistantText(), good); assert.equal(calls.length, 1); assert.equal(calls[0].options.maxTokens, 4096);
    assert.equal(calls[0].transcript.tools?.length ?? 0, 0);
    assert.ok(calls[0].transcript.messages.some(m => JSON.stringify(m).includes('SYNTHETIC_TASK')));
  } finally { s.dispose(); }
});
test('separate workers do not inherit each other or parent history', async () => {
  const { ctx } = context(); const one = await createAnalysisSession(ctx, input.role, 'off'), two = await createAnalysisSession(ctx, input.role, 'off');
  try { await one.prompt('PRIVATE_FIRST_TASK'); assert.ok(!JSON.stringify(two.messages).includes('PRIVATE_FIRST_TASK')); } finally { one.dispose(); two.dispose(); }
});
test('unattended invocation fails closed before model access', async () => {
  const e = await extension(), c = context({ hasUI: false });
  await assert.rejects(invoke(e, 'ops_agent', input, c.ctx), /Interactive approval/); assert.equal(c.calls.length, 0);
});
test('cancelling pending approval aborts the host dialog and launches zero workers', async () => {
  const e = await extension(), c = context(), abort = new AbortController(); let dialogSignal;
  c.ctx.ui.confirm = async (_title, _body, options) => {
    dialogSignal = options.signal;
    return new Promise(resolve => dialogSignal.addEventListener('abort', () => resolve(false), { once: true }));
  };
  const pending = invoke(e, 'ops_agent', input, c.ctx, abort.signal);
  for (let i = 0; i < 100 && !dialogSignal; i++) await new Promise(r => setTimeout(r, 5));
  assert.ok(dialogSignal); abort.abort();
  assert.equal((await pending).status, 'cancelled'); assert.equal(dialogSignal.aborted, true); assert.equal(c.calls.length, 0);
});
test('approval refusal runs no worker', async () => {
  const e = await extension(), c = context({ approve: false });
  const r = await invoke(e, 'ops_agent', input, c.ctx); assert.equal(r.status, 'denied'); assert.equal(c.calls.length, 0);
});
test('approved agent completes via actual Pi core with fake transport', async () => {
  const e = await extension(), c = context(); const r = await invoke(e, 'ops_agent', input, c.ctx);
  assert.equal(r.status, 'completed'); assert.equal(c.calls.length, 1); assert.equal(c.approvals.length, 1);
  assert.match(c.approvals[0].body, /synthetic\/offline-test/); assert.match(c.approvals[0].body, /Plan hash:/);
});
test('changing parent model during approval cannot change approved worker provider', async () => {
  const e = await extension(), c = context();
  c.ctx.ui.confirm = async () => { c.ctx.model = { ...model, provider: 'not-approved' }; return true; };
  const r = await invoke(e, 'ops_agent', input, c.ctx);
  assert.equal(r.status, 'completed'); assert.equal(c.calls[0].selected.provider, 'synthetic');
});
test('large encoded output is explicitly capped rather than silently flooding parent context', async () => {
  const answer = JSON.stringify({ status: 'ok', summary: '\u0001'.repeat(2000), findings: Array.from({ length: 5 }, () => ({ severity: 'info', detail: '\u0001'.repeat(500) })) });
  const e = await extension(), c = context({ answer });
  const r = await invoke(e, 'ops_workflow', { steps: Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, role: input.role, task: 'Synthetic output bound test' })) }, c.ctx);
  assert.equal(r.status, 'completed'); assert.equal(r.truncated, true); assert.ok(Buffer.byteLength(JSON.stringify(r)) <= 65536);
});
test('approved workflow forwards dependency results and executes three roles', async () => {
  const e = await extension(), c = context(); const r = await invoke(e, 'ops_workflow', { steps: [
    { id: 'diagnose', role: 'network-troubleshooter', task: 'Analyse supplied data' },
    { id: 'design', role: 'network-architect', task: 'Propose a design', dependsOn: ['diagnose'] },
    { id: 'review', role: 'network-config-reviewer', task: 'Review the proposal', dependsOn: ['design'] },
  ], evidence: 'SYNTHETIC_ONLY' }, c.ctx);
  assert.equal(r.status, 'completed'); assert.equal(c.calls.length, 3); assert.equal(c.approvals.length, 1);
  assert.ok(JSON.stringify(c.calls[1].transcript.messages).includes('dependencyResults'));
});
test('provider error does not leak error payload or pass as success', async () => {
  const e = await extension(), c = context({ error: true }); const r = await invoke(e, 'ops_agent', input, c.ctx);
  assert.equal(r.status, 'failed'); assert.ok(!JSON.stringify(r).includes('SYNTHETIC_PROVIDER_SECRET'));
});
test('model tool-call attempts have no capabilities and terminate within response budget', { timeout: 2000 }, async () => {
  const e = await extension(), c = context({ toolCall: true });
  const r = await invoke(e, 'ops_agent', input, c.ctx);
  assert.equal(r.status, 'failed'); assert.ok(c.calls.length <= 2);
  for (const call of c.calls) assert.equal(call.transcript.tools?.length ?? 0, 0);
});
test('invalid model JSON blocks dependency execution', async () => {
  const e = await extension(), c = context({ answer: 'Looks good!' });
  const r = await invoke(e, 'ops_workflow', { steps: [{ id: 'first', role: input.role, task: 'Analyse' }, { id: 'next', role: input.role, task: 'Review', dependsOn: ['first'] }] }, c.ctx);
  assert.equal(r.status, 'failed'); assert.equal(r.steps.next.status, 'skipped'); assert.equal(c.calls.length, 1);
});
test('cancellation reaches real Pi core worker and run state', async () => {
  const e = await extension(), c = context({ hang: true }), abort = new AbortController();
  const pending = invoke(e, 'ops_agent', input, c.ctx, abort.signal);
  for (let i = 0; i < 100 && !c.calls.length; i++) await new Promise(r => setTimeout(r, 5));
  assert.equal(c.calls.length, 1); abort.abort();
  const r = await pending; assert.equal(r.status, 'cancelled'); assert.equal(c.calls[0].options.signal.aborted, true);
});
for (const lifecycleEvent of ['session_shutdown', 'session_before_switch', 'session_before_fork', 'session_before_tree']) test(`${lifecycleEvent} cancels active workers; no evidence in status registry`, async () => {
  const e = await extension(), c = context({ hang: true });
  const pending = invoke(e, 'ops_agent', input, c.ctx);
  for (let i = 0; i < 100 && !c.calls.length; i++) await new Promise(r => setTimeout(r, 5));
  assert.equal(c.calls.length, 1);
  for (const handler of e.handlers.get(lifecycleEvent) ?? []) await handler({ type: lifecycleEvent }, c.ctx);
  assert.equal((await pending).status, 'cancelled');
  assert.ok(!JSON.stringify(await invoke(e, 'ops_runs', {}, c.ctx)).includes(input.evidence));
});
