import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validatePolicy, loadPolicy, routingApproval, describeApproval, PROVIDER } from '../extensions/model-resilience/policy.mjs';
import { routeEvents, failureKind } from '../extensions/model-resilience/engine.mjs';

export function samplePolicy() {
  return { version: 1, allowMetered: true, maxInputUsdPerMillion: 3, maxOutputUsdPerMillion: 15, maxAttempts: 2, deadlineMs: 2000, attemptTimeoutMs: 1000, contextWindow: 32000, maxOutputTokens: 4096, maxInputBytes: 26000,
    routes: [{ provider: 'subscription', model: 'primary', origin: 'https://first.invalid', billing: 'subscription', supportsTools: true }, { provider: 'api', model: 'secondary', origin: 'https://second.invalid', billing: 'metered', supportsTools: true }] };
}
const context = { messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }], timestamp: 0 }] };
function message(provider = 'api', model = 'secondary', content = [{ type: 'text', text: 'ok' }]) {
  return { role: 'assistant', api: 'openai-completions', provider, model, content, stopReason: 'stop', timestamp: 0, usage: { input: 2, output: 1, cacheRead: 0, cacheWrite: 0, totalTokens: 3, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } };
}
const failure = (errorMessage, content = []) => ({ type: 'error', reason: 'error', error: { ...message('subscription', 'primary', content), stopReason: 'error', errorMessage } });
function fixture(p = samplePolicy(), behavior = {}) {
  const policy = validatePolicy(p), calls = [], records = [];
  const models = p.routes.map(r => ({ provider: r.provider, id: r.model, api: 'openai-completions', baseUrl: r.origin + '/v1', input: ['text'], contextWindow: 128000, maxTokens: 8192, cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 } }));
  const registry = {
    find: (provider, id) => models.find(m => m.provider === provider && m.id === id),
    hasConfiguredAuth: () => true, isUsingOAuth: m => m.provider === 'subscription',
    getProvider: provider => ({ auth: { oauth: { isSubscription: provider === 'subscription' } } }),
    streamSimple: (m, c, o) => { calls.push({ m, c, o }); return (async function* () {
      await o.onPayload({ synthetic: true }, m);
      yield* (behavior[m.provider] ?? (async function* () { yield { type: 'done', reason: 'stop', message: message(m.provider, m.id) }; }))(m, c, o);
    })(); },
  };
  return { policy, calls, records, models, registry, async run(options = {}, c = context) { return Array.fromAsync(routeEvents({ policy, registry, context: c, options, onAttempt: e => records.push(e) })); } };
}

test('policy strict, immutable, canonical and safe by default', () => {
  const p = samplePolicy(), a = validatePolicy(p);
  assert.equal(a.hash, validatePolicy(Object.fromEntries(Object.entries(p).reverse())).hash);
  assert.ok(Object.isFrozen(a.routes[0]));
  assert.throws(() => validatePolicy({ ...p, apiKey: 'never-persist' }));
  assert.throws(() => validatePolicy({ ...p, maxAttempts: 100 }));
  assert.throws(() => validatePolicy({ ...p, maxInputBytes: 32000 }));
  for (const origin of ['http://public.invalid', 'https://u:p@first.invalid', 'https://first.invalid/path', 'https://first.invalid?key=secret', 'file:///tmp']) {
    const q = samplePolicy(); q.routes[0].origin = origin; assert.throws(() => validatePolicy(q));
  }
  const q = samplePolicy(); q.routes[0].provider = PROVIDER; assert.throws(() => validatePolicy(q));
  const g = samplePolicy(); g.routes[1].provider = 'omniroute'; assert.throws(() => validatePolicy(g));
  g.routes[1].gatewayPolicyApproved = true; assert.doesNotThrow(() => validatePolicy(g));
});

test('private policy loader rejects relative, symlink, oversized and malformed files without echoing secrets', () => {
  const dir = mkdtempSync(join(tmpdir(), 'routing-policy-'));
  try {
    const file = join(dir, 'policy.json'); writeFileSync(file, JSON.stringify(samplePolicy()));
    assert.equal(loadPolicy(file).maxAttempts, 2);
    const link = join(dir, 'link'); symlinkSync(file, link); assert.throws(() => loadPolicy(link));
    assert.throws(() => loadPolicy('relative.json'));
    writeFileSync(file, '{secret-value'); assert.throws(() => loadPolicy(file), e => !e.message.includes('secret-value'));
    writeFileSync(file, ' '.repeat(65537)); assert.throws(() => loadPolicy(file));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('quota fallback works without depending on the host retry classifier', async () => {
  const f = fixture(undefined, { subscription: async function* () { yield failure('insufficient_quota'); } });
  const events = await f.run();
  assert.equal(f.calls.length, 2); assert.equal(events.at(-1).type, 'done');
  assert.equal(events.at(-1).message.provider, 'api'); assert.equal(events.at(-1).message.model, 'secondary');
  assert.deepEqual(f.records.map(r => r.outcome), ['quota', 'success']);
  assert.deepEqual(events.at(-1).message.usage, message().usage);
});
for (const reason of ['429 rate limit', '503 overloaded', 'Monthly usage limit reached', 'GoUsageLimitError', 'subscription_sharing_usage_limit_exceeded']) {
  test(`eligible pre-output failure: ${reason}`, async () => {
    const f = fixture(undefined, { subscription: async function* () { yield failure(reason); } });
    assert.equal((await f.run()).at(-1).type, 'done'); assert.equal(f.calls.length, 2);
  });
}
for (const reason of ['401 unauthorized', 'invalid_api_key', 'context length exceeded', 'unclassified error', 'network timeout']) {
  test(`no fallback for ${reason}`, async () => {
    const f = fixture(undefined, { subscription: async function* () { yield failure(reason); } });
    assert.equal((await f.run()).at(-1).type, 'error'); assert.equal(f.calls.length, 1);
  });
}

test('start-only failure can switch, without exposing the failed start', async () => {
  const f = fixture(undefined, { subscription: async function* () { yield { type: 'start', partial: message('subscription', 'primary', []) }; yield failure('insufficient_quota'); } });
  const events = await f.run(); assert.equal(f.calls.length, 2); assert.deepEqual(events.map(e => e.type), ['done']);
});
for (const type of ['text_start', 'thinking_start', 'toolcall_start']) {
  test(`commit ${type} prevents fallback and erases retry-triggering error text`, async () => {
    const f = fixture(undefined, { subscription: async function* () { yield { type: 'start', partial: message('subscription', 'primary', []) }; yield { type, partial: message('subscription', 'primary', []) }; yield failure('429 insufficient_quota secret-value'); } });
    const events = await f.run(); assert.equal(f.calls.length, 1);
    assert.equal(events.at(-1).type, 'error'); assert.match(events.at(-1).error.errorMessage, /partial_output/);
    assert.doesNotMatch(events.at(-1).error.errorMessage, /429|insufficient_quota|secret-value/);
  });
}

test('partial content in terminal error blocks fallback even without prior deltas', async () => {
  const f = fixture(undefined, { subscription: async function* () { yield failure('429', [{ type: 'toolCall', id: 'call', name: 'must-not-execute', arguments: {} }]); } });
  assert.equal((await f.run()).at(-1).type, 'error'); assert.equal(f.calls.length, 1);
});

test('exhausted chain is terminal and bounded, and failed attempt usage is recorded separately', async () => {
  const fail = async function* () { yield failure('429'); };
  const f = fixture(undefined, { subscription: fail, api: fail });
  const events = await f.run(); assert.equal(f.calls.length, 2);
  assert.match(events.at(-1).error.errorMessage, /approved_routes_exhausted/);
  assert.doesNotMatch(events.at(-1).error.errorMessage, /429|rate.limit|quota/);
  assert.equal(f.records[0].usage.totalTokens, 3);
});

test('missing auth, unapproved origin, low context, nested routers and price drift are blocked before network', async () => {
  for (const mutate of [
    f => { f.registry.hasConfiguredAuth = () => false; },
    f => f.models.forEach(m => { m.baseUrl = 'https://unapproved.invalid'; }),
    f => f.models.forEach(m => { m.contextWindow = 1000; }),
    f => f.models.forEach(m => { m.api = 'pi-virtual'; }),
  ]) { const f = fixture(); mutate(f); await f.run(); assert.equal(f.calls.length, 0); }
  const f = fixture(); f.registry.isUsingOAuth = () => false; f.models[1].cost.output = 99;
  await f.run(); assert.equal(f.calls.length, 0);
});

test('metered fallback requires explicit permission', async () => {
  const p = samplePolicy(); p.allowMetered = false;
  const f = fixture(p, { subscription: async function* () { yield failure('insufficient_quota'); } });
  await f.run(); assert.equal(f.calls.length, 1);
});

test('transport auth overrides are removed; hooks, cancellation and safe output ceiling propagate', async () => {
  const f = fixture(); const hook = () => {};
  await f.run({ apiKey: 'transport-secret', headers: { Authorization: 'secret' }, env: { API_KEY: 'secret' }, baseUrl: 'https://bad.invalid', maxTokens: 100000, maxRetries: 9, onPayload: hook, onResponse: hook });
  const o = f.calls[0].o;
  for (const key of ['apiKey', 'headers', 'env', 'baseUrl']) assert.equal(o[key], undefined);
  assert.equal(o.maxTokens, 4096); assert.equal(o.maxRetries, 0); assert.equal(typeof o.onPayload, 'function'); assert.equal(o.onResponse, hook);
  assert.ok(o.signal instanceof AbortSignal);
});

test('cancelled, oversized and image requests do not start a provider call', async () => {
  const f = fixture(); const controller = new AbortController(); controller.abort();
  assert.equal((await f.run({ signal: controller.signal })).at(-1).reason, 'aborted');
  await f.run({}, { messages: [{ role: 'user', content: 'x'.repeat(27000) }] });
  await f.run({}, { messages: [{ role: 'user', content: [{ type: 'image', data: 'x', mimeType: 'image/png' }] }] });
  assert.equal(f.calls.length, 0);
});

test('uncooperative provider is bounded by attempt deadline, without fallback', async () => {
  const f = fixture(undefined, { subscription: () => ({ [Symbol.asyncIterator]() { return this; }, next: () => new Promise(() => {}), return: () => new Promise(() => {}) }) });
  const start = Date.now(); const events = await f.run();
  assert.ok(Date.now() - start < 1800); assert.equal(f.calls.length, 1); assert.match(events.at(-1).error.errorMessage, /deadline/);
});

test('approval binds exact immutable policy, exposes recipients and rejects drift', () => {
  const dir = mkdtempSync(join(tmpdir(), 'routing-approval-'));
  try {
    const path = join(dir, 'policy.json'), p = samplePolicy(); writeFileSync(path, JSON.stringify(p));
    const policy = loadPolicy(path), model = { provider: PROVIDER, id: policy.id };
    const a = routingApproval(model, path); assert.equal(a.policyHash, policy.hash); assert.match(describeApproval(a), /second.invalid/);
    assert.equal(routingApproval({ provider: 'plain', id: 'm' }, path), undefined);
    p.maxAttempts = 1; writeFileSync(path, JSON.stringify(p)); assert.throws(() => routingApproval(model, path), /changed/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('OAuth without native subscription marker cannot bypass metered policy', async () => {
  const p = samplePolicy(); p.allowMetered = false; const f = fixture(p);
  f.registry.getProvider = () => ({ auth: { oauth: { isSubscription: false } } });
  assert.equal((await f.run()).at(-1).type, 'error'); assert.equal(f.calls.length, 0);
});

test('effective auth endpoint override is blocked by pre-send hook', async () => {
  const f = fixture(); let networkStarts = 0;
  f.registry.streamSimple = (m, c, o) => (async function* () {
    await o.onPayload({}, { ...m, baseUrl: 'https://not-approved.invalid' }); networkStarts++;
    yield { type: 'done', message: message() };
  })();
  const events = await f.run(); assert.equal(networkStarts, 0); assert.match(events.at(-1).error.errorMessage, /origin_policy/);
});

test('providers omitting the SDK payload hook cannot succeed or trigger fallback', async () => {
  const f = fixture(); f.registry.streamSimple = () => (async function* () { yield failure('429'); })();
  const events = await f.run(); assert.match(events.at(-1).error.errorMessage, /provider_contract/);
  assert.equal(f.records.length, 1);
});

test('upstream length is terminal and keeps partial content and usage separately from stop reason', async () => {
  const f = fixture(undefined, { subscription: async function* () { yield { type: 'done', reason: 'length', message: { ...message('subscription', 'primary'), stopReason: 'length' } }; } });
  const events = await f.run(); assert.equal(f.calls.length, 1); assert.equal(events.at(-1).type, 'error');
  assert.equal(events.at(-1).error.stopReason, 'error'); assert.deepEqual(events.at(-1).error.usage, message().usage);
  assert.equal(f.records[0].upstreamStopReason, 'length');
});

test('invalid caller output caps and incomplete catalog limits fail closed', async () => {
  for (const maxTokens of [0, -1, NaN, Infinity, 0.5]) {
    const f = fixture(); assert.equal((await f.run({ maxTokens })).at(-1).type, 'error'); assert.equal(f.calls.length, 0);
  }
  const f = fixture(); f.models.forEach(m => { m.maxTokens = undefined; });
  await f.run(); assert.equal(f.calls.length, 0);
});
