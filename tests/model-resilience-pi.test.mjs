import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire, findPackageJSON } from 'node:module';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { validatePolicy, PROVIDER } from '../extensions/model-resilience/policy.mjs';
const sdkRoot = process.env.PI_SDK_ROOT;
if (!sdkRoot) throw new Error('Set PI_SDK_ROOT to Pi 1.3.0 for offline SDK tests');
const requireSdk = createRequire(resolve(sdkRoot, 'package.json'));
const hostModule = name => resolve(dirname(findPackageJSON(name, pathToFileURL(resolve(sdkRoot, 'package.json')))), 'dist/index.js');
const sdk = await import(pathToFileURL(resolve(sdkRoot, 'dist/index.js')));
const ai = await import(pathToFileURL(hostModule('@earendil-works/pi-ai')));
const { loadExtensions } = await import(pathToFileURL(resolve(sdkRoot, 'dist/core/extensions/loader.js')));
const { createVirtualModel, getBranchSelection } = await import(pathToFileURL(resolve(sdkRoot, 'dist/core/virtual-models.js')));
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const extensionPath = resolve(root, 'extensions/model-resilience/index.ts');
const usage = { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, totalTokens: 2, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } };
function config() { return { version: 1, allowMetered: true, maxInputUsdPerMillion: 3, maxOutputUsdPerMillion: 15, maxAttempts: 2, deadlineMs: 2000, attemptTimeoutMs: 1000, contextWindow: 32000, maxOutputTokens: 4096, maxInputBytes: 26000, routes: ['first', 'second'].map(provider => ({ provider, model: 'fixture', origin: `https://${provider}.invalid`, billing: 'metered', supportsTools: true })) }; }
async function setup({ partial = false, partialTool = false, bothFail = false, length = false, authOverride = false } = {}) {
  const temp = await mkdtemp(resolve(tmpdir(), 'resilience-pi-'));
  const old = process.env.DEVOPS_MODEL_POLICY;
  const path = resolve(temp, 'policy.json'); await writeFile(path, JSON.stringify(config())); process.env.DEVOPS_MODEL_POLICY = path;
  const policy = validatePolicy(config());
  const loaded = await loadExtensions([extensionPath], root); assert.deepEqual(loaded.errors, []);
  const modelRuntime = await sdk.ModelRuntime.create({ authPath: resolve(temp, 'auth.json'), modelsPath: resolve(temp, 'models.json') });
  const calls = [], toolCalls = [], networkStarts = [];
  for (const provider of ['first', 'second']) {
    modelRuntime.registerProvider(provider, {
      baseUrl: `https://${provider}.invalid`, api: 'openai-completions', apiKey: 'synthetic-never-sent',
      models: [{ id: 'fixture', name: provider, reasoning: false, input: ['text'], contextWindow: 128000, maxTokens: 8192, cost: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 } }],
      streamSimple(model, context, options) {
        calls.push({ model, context, options });
        const stream = ai.createAssistantMessageEventStream();
        const failed = !length && (provider === 'first' || bothFail);
        const m = { role: 'assistant', api: model.api, provider, model: model.id, content: failed ? [] : [{ type: 'text', text: 'synthetic success' }], usage: structuredClone(usage), stopReason: failed ? 'error' : 'stop', timestamp: Date.now(), ...(failed ? { errorMessage: 'insufficient_quota' } : {}) };
        queueMicrotask(async () => {
          try {
          await options.onPayload?.({ fixture: true }, model); networkStarts.push(provider);
          stream.push({ type: 'start', partial: m });
          if (partialTool && failed) { m.content = [{ type: 'toolCall', id: 'fixture-call', name: 'synthetic_side_effect', arguments: {} }]; stream.push({ type: 'toolcall_start', contentIndex: 0, partial: m }); }
          if (partial && failed) { m.content = [{ type: 'text', text: 'partial' }]; stream.push({ type: 'text_start', contentIndex: 0, partial: m }); stream.push({ type: 'text_delta', contentIndex: 0, delta: 'partial', partial: m }); }
          if (length) { m.stopReason = 'length'; m.usage.output = 4096; m.usage.totalTokens = 4097; stream.push({ type: 'text_start', contentIndex: 0, partial: m }); stream.push({ type: 'text_delta', contentIndex: 0, delta: 'synthetic truncated output', partial: m }); }
          stream.push(failed ? { type: 'error', reason: 'error', error: m } : { type: 'done', reason: m.stopReason, message: m });
          } catch (error) { stream.push({ type: 'error', reason: 'error', error: { ...m, stopReason: 'error', errorMessage: error.message } }); }
          finally { stream.end(); }
        }); return stream;
      },
    });
  }
  if (authOverride) {
    const previous = modelRuntime.getProvider('first');
    modelRuntime.registerNativeProvider({ ...previous, auth: { apiKey: { name: 'Synthetic auth override', resolve: async () => ({ auth: { apiKey: 'synthetic-never-sent', baseUrl: 'https://unapproved.invalid' }, source: 'fixture' }) } } });
    await modelRuntime.refresh({ allowNetwork: false });
  }
  const resourceLoader = {
    getExtensions: () => loaded, getSkills: () => ({ skills: [], diagnostics: [] }), getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }), getAgentsFiles: () => ({ agentsFiles: [] }), getSystemPrompt: () => 'Synthetic offline routing test.',
    getSystemPromptSource: () => undefined, getAppendSystemPrompt: () => [], getAppendSystemPromptSources: () => [], extendResources: () => {}, reload: async () => {},
  };
  const virtual = createVirtualModel(loaded.runtime.pendingVirtualModelRegistrations[0].definition);
  const { session } = await sdk.createAgentSession({ cwd: root, agentDir: temp, model: virtual, modelRuntime, resourceLoader, noTools: true,
    customTools: partialTool ? [{ name: 'synthetic_side_effect', label: 'Synthetic side effect', description: 'Must never run', parameters: requireSdk('typebox').Type.Object({}), execute: async () => { toolCalls.push('executed'); return { content: [{ type: 'text', text: 'executed' }] }; } }] : [],
    thinkingLevel: 'off', sessionManager: sdk.SessionManager.inMemory(root), settingsManager: sdk.SettingsManager.inMemory({ retry: { enabled: true, maxRetries: 2, baseDelayMs: 1 }, compaction: { enabled: length } }) });
  await session.bindExtensions({});
  return { session, calls, toolCalls, networkStarts, modelRuntime, policy, loaded, async close() { session.dispose(); if (old === undefined) delete process.env.DEVOPS_MODEL_POLICY; else process.env.DEVOPS_MODEL_POLICY = old; await rm(temp, { recursive: true, force: true }); } };
}

test('actual Pi loader remains inert without policy and registers no model tools', async () => {
  const old = process.env.DEVOPS_MODEL_POLICY; delete process.env.DEVOPS_MODEL_POLICY;
  try { const r = await loadExtensions([extensionPath], root); assert.deepEqual(r.errors, []); assert.equal(r.runtime.pendingProviderRegistrations.length, 0); assert.equal(r.runtime.pendingVirtualModelRegistrations.length, 0); assert.equal(r.extensions[0].tools.size, 0); assert.ok(r.extensions[0].commands.has('devops-routing-status')); }
  finally { if (old !== undefined) process.env.DEVOPS_MODEL_POLICY = old; }
});

test('actual Pi session quota fallback keeps physical identity, usage and persistent virtual selection', async () => {
  const f = await setup();
  try {
    await f.session.prompt('Use synthetic transports only.');
    assert.equal(f.calls.length, 2); assert.equal(f.session.getLastAssistantText(), 'synthetic success');
    const last = f.session.messages.findLast(m => m.role === 'assistant'); assert.equal(last.provider, 'second'); assert.equal(last.model, 'fixture'); assert.deepEqual(last.usage, usage);
    assert.equal(f.session.model.provider, PROVIDER);
    const selected = getBranchSelection(f.session.sessionManager.getBranch(), (p, m) => f.modelRuntime.getModel(p, m));
    assert.deepEqual(selected, { provider: PROVIDER, modelId: f.policy.id });
    const records = f.session.sessionManager.getBranch().filter(e => e.type === 'custom' && e.customType === 'devops.model-routing-attempt');
    assert.deepEqual(records.map(e => e.data.outcome), ['quota', 'success']);
    assert.doesNotMatch(JSON.stringify(records), /synthetic-never-sent|Use synthetic/);
  } finally { await f.close(); }
});

test('actual Pi host retries cannot replay partial output or exhaust the chain repeatedly', async () => {
  for (const options of [{ partial: true }, { partialTool: true }, { bothFail: true }]) {
    const f = await setup(options);
    try { await f.session.prompt('Synthetic failure test'); assert.equal(f.calls.length, options.partial || options.partialTool ? 1 : 2); assert.equal(f.session.messages.findLast(m => m.role === 'assistant').stopReason, 'error'); assert.equal(f.toolCalls.length, 0); }
    finally { await f.close(); }
  }
});

test('direct registry routing forwards payload hooks once per physical attempt with no transport auth leak', async () => {
  const f = await setup();
  try {
    const hooks = [];
    const context = { messages: [{ role: 'user', content: [{ type: 'text', text: 'synthetic direct call' }], timestamp: 0 }] };
    const stream = f.modelRuntime.streamSimple(f.session.model, context, { apiKey: 'outer-must-not-cross', headers: { 'x-outer-secret': 'must-not-cross' }, env: { FIXTURE_SECRET: 'must-not-cross' }, onPayload: (_p, m) => { hooks.push(m.provider); } });
    const events = await Array.fromAsync(stream);
    assert.equal(events.at(-1).type, 'done'); assert.deepEqual(hooks, ['first', 'second']);
    for (const call of f.calls) { assert.notEqual(call.options.apiKey, 'outer-must-not-cross'); assert.equal(call.options.headers?.['x-outer-secret'], undefined); assert.equal(call.options.env?.FIXTURE_SECRET, undefined); }
  } finally { await f.close(); }
});

test('length after visible output cannot trigger host recovery with compaction enabled', async () => {
  const f = await setup({ length: true });
  try {
    await f.session.prompt('Synthetic truncation test'); assert.equal(f.calls.length, 1);
    const last = f.session.messages.findLast(m => m.role === 'assistant'); assert.equal(last.stopReason, 'error'); assert.match(last.errorMessage, /output_limit/); assert.equal(last.usage.output, 4096);
    const records = f.session.sessionManager.getBranch().filter(e => e.type === 'custom' && e.customType === 'devops.model-routing-attempt');
    assert.equal(records.at(-1).data.upstreamStopReason, 'length');
  } finally { await f.close(); }
});

test('native auth.baseUrl override is blocked before synthetic HTTP send', async () => {
  const f = await setup({ authOverride: true });
  try {
    await f.session.prompt('Synthetic effective endpoint guard');
    assert.equal(f.calls.length, 1); assert.equal(f.calls[0].model.baseUrl, 'https://unapproved.invalid');
    assert.equal(f.networkStarts.length, 0); assert.match(f.session.messages.findLast(m => m.role === 'assistant').errorMessage, /origin_policy/);
  } finally { await f.close(); }
});
