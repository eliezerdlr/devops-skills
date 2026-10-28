import test from 'node:test';
import assert from 'node:assert/strict';
import { NetBirdClient } from '../extensions/netbird-api/engine.mjs';
import { changePlan, readPlan, validateBody } from '../extensions/netbird-api/schema.mjs';
import { fingerprintState } from '../extensions/netbird-api/format.mjs';
import { NetBirdError } from '../extensions/netbird-api/errors.mjs';

const TOKEN = 'SYNTHETIC_PAT_FOR_ENGINE_TESTS';
const creds = Object.freeze({ apiUrl: 'https://vpn.example.com/api', allowWrites: true, token: TOKEN, binding: 'synthetic-binding' });
const group = { name: 'Support', peers: ['peer-one'], resources: [] };
const rule = { name: 'SSH', enabled: true, action: 'accept', bidirectional: true, protocol: 'tcp', sources: ['support-group'], destinations: ['resource-group'], ports: ['22'] };
const bodies = {
  groups: group,
  policies: { name: 'Resource SSH', description: '', enabled: true, rules: [rule], source_posture_checks: [] },
  networks: { name: 'Remote LAN', description: '' },
  resources: { name: 'Device', description: '', address: '192.0.2.20/32', enabled: true, groups: ['resource-group'] },
  routers: { peer: 'peer-one', metric: 100, masquerade: true, enabled: true },
};
const context = approve => ({ interactive: true, approve: approve ?? (async () => true) });
const change = (overrides = {}) => ({ operation: 'create', resource: 'groups', body: JSON.stringify(group), reason: 'Authorised synthetic configuration', rollback: 'Remove only the synthetic object', recovery: 'Independent synthetic recovery channel', ...overrides });
function fixture({ responses = [], credentialLoader, transport, deadlineMs } = {}) {
  const calls = [], loads = [];
  const client = new NetBirdClient({
    credentialLoader: async () => { loads.push(true);return credentialLoader ? credentialLoader(loads.length) : creds; },
    statusLoader: async () => ({ status: 'configured', credentialPresent: true, tokenValidity: 'not_checked' }),
    transport: async input => {
      calls.push(structuredClone({ ...input, signal: undefined }));
      if (transport) return transport(input, calls.length);
      const response = responses.shift();if (response instanceof Error) throw response;
      if (!response) throw new Error('Unexpected synthetic request');
      return response;
    },
    ...(deadlineMs ? { deadlineMs } : {}),
  });
  return { client, calls, loads };
}
const ok = data => ({ httpStatus: 200, data });
const item = (resource = 'groups', override = {}) => ({ id: 'object-one', ...bodies[resource], ...override });

test('closed resource paths cannot reach keys/users or arbitrary URLs', () => {
  for (const resource of ['tokens', 'users', 'setup-keys', 'https://other.example', '../groups']) assert.throws(() => readPlan({ resource }));
  for (const id of ['../users', 'x%2fy', 'x?query', 'x/y', 'x#y']) assert.throws(() => readPlan({ resource: 'groups', id }));
  assert.equal(readPlan({ resource: 'routers' }).path, '/networks/routers');
  assert.equal(readPlan({ resource: 'resources', networkId: 'network-one', id: 'resource-one' }).path, '/networks/network-one/resources/resource-one');
  assert.throws(() => readPlan({ resource: 'networks', id: 'routers' }));
  assert.throws(() => changePlan(change({ resource: 'peers' })));
});

for (const resource of Object.keys(bodies)) {
  test(`strict full write contract supports ${resource}`, () => {
    assert.doesNotThrow(() => validateBody(resource, structuredClone(bodies[resource])));
    assert.throws(() => validateBody(resource, { ...bodies[resource], token: 'not-accepted' }));
  });
}

test('PUT is full replacement, not an implicit association-clearing PATCH', () => {
  assert.throws(() => changePlan(change({ operation: 'update', id: 'group-one', body: JSON.stringify({ name: 'Support' }) })));
  assert.throws(() => validateBody('policies', { name: 'x', enabled: true, rules: [rule] }));
  assert.throws(() => validateBody('resources', { ...bodies.resources, groups: undefined }));
});

test('request validation rejects duplicate IDs, unknown types and empty selectors', () => {
  assert.throws(() => validateBody('groups', { ...group, peers: ['same', 'same'] }));
  assert.throws(() => validateBody('groups', { ...group, resources: [{ id: 'r', type: 'invalid' }] }));
  assert.throws(() => validateBody('policies', { ...bodies.policies, rules: [{ ...rule, sources: [] }] }));
  assert.throws(() => validateBody('policies', { ...bodies.policies, rules: [{ ...rule, sourceResource: { id: 'r', type: 'host' } }] }));
});

test('router selection is exclusive, nonempty and bounded by the source contract', () => {
  assert.throws(() => validateBody('routers', { ...bodies.routers, peer_groups: ['routing-group'] }));
  assert.throws(() => validateBody('routers', { metric: 100, masquerade: true, enabled: true, peer_groups: [] }));
  assert.throws(() => validateBody('routers', { ...bodies.routers, metric: 0 }));
  assert.throws(() => validateBody('routers', { ...bodies.routers, metric: 10000 }));
  assert.doesNotThrow(() => validateBody('routers', { metric: 100, masquerade: true, enabled: true, peer_groups: ['routing-group'] }));
});

test('policy protocols, ports and ranges are checked without enabling Default', () => {
  const policy = r => ({ ...bodies.policies, rules: [r] });
  assert.throws(() => validateBody('policies', policy({ ...rule, ports: ['0'] })));
  assert.throws(() => validateBody('policies', policy({ ...rule, ports: ['65536'] })));
  assert.throws(() => validateBody('policies', policy({ ...rule, port_ranges: [{ start: 22, end: 22 }] })));
  assert.throws(() => validateBody('policies', policy({ ...rule, protocol: 'icmp' })));
  const ranges = { ...rule };delete ranges.ports;ranges.port_ranges = [{ start: 100, end: 200 }];
  assert.doesNotThrow(() => validateBody('policies', policy(ranges)));
  assert.throws(() => validateBody('policies', policy({ ...ranges, port_ranges: [{ start: 200, end: 100 }] })));
  assert.throws(() => validateBody('policies', { ...bodies.policies, name: 'Default' }));
});

test('Internet default routes and malformed addresses are outside the LAN connector', () => {
  for (const address of ['0.0.0.0/0', '::/0', 'http://device.example/path', '192.0.2.20/33']) assert.throws(() => validateBody('resources', { ...bodies.resources, address }));
  for (const address of ['192.0.2.20/32', '2001:db8::20/128', '*.example.com']) assert.doesNotThrow(() => validateBody('resources', { ...bodies.resources, address }));
});

test('invalid arguments and headless calls fail before credentials or network access', async () => {
  const f = fixture();
  const bad = await f.client.read({ resource: 'tokens' }, context());assert.equal(bad.code, 'INVALID_INPUT');
  const headless = await f.client.read({ resource: 'peers' }, { interactive: false, approve: async () => true });
  assert.equal(headless.code, 'APPROVAL_REQUIRED');assert.equal(f.loads.length, 0);assert.equal(f.calls.length, 0);
});

test('local status does not load credentials or contact the API', async () => {
  const f = fixture();const status = await f.client.status();assert.equal(status.tokenValidity, 'not_checked');assert.equal(f.calls.length, 0);assert.equal(f.loads.length, 0);
});

test('read denial, nonboolean approval and UI failure do not query the API', async () => {
  for (const result of [false, 'true', undefined]) {
    const f = fixture();const response = await f.client.read({ resource: 'peers' }, context(async () => result));assert.equal(response.status, 'denied');assert.equal(f.calls.length, 0);
  }
  const f = fixture();const response = await f.client.read({ resource: 'peers' }, context(async () => { throw new Error(TOKEN); }));
  assert.equal(response.code, 'INTERNAL_ERROR');assert.ok(!JSON.stringify(response).includes(TOKEN));assert.equal(f.calls.length, 0);
});

test('read results project selected fields, redact echoes and remain bounded', async () => {
  const peers = Array.from({ length: 80 }, (_, i) => ({ id: 'peer-' + i, name: i ? 'Device' : TOKEN, ip: '192.0.2.20', private_key: TOKEN, token: TOKEN, groups: [{ id: 'g', name: Buffer.from(TOKEN).toString('base64'), password: TOKEN }] }));
  const f = fixture({ responses: [ok(peers)] });const result = await f.client.read({ resource: 'peers' }, context());
  assert.equal(result.status, 'ok');assert.equal(result.receivedCount, 80);assert.equal(result.returnedCount, 50);assert.equal(result.truncated, true);assert.equal(result.untrustedData, true);
  assert.ok(!JSON.stringify(result).includes(TOKEN));assert.ok(!JSON.stringify(result).includes('private_key'));assert.ok(Buffer.byteLength(JSON.stringify(result)) < 49152);
});

test('reads fail closed if credentials or endpoint change during approval', async () => {
  const f = fixture({ credentialLoader: n => n === 1 ? creds : { ...creds, binding: 'changed' } });
  const result = await f.client.read({ resource: 'peers' }, context());assert.equal(result.code, 'CONFIG_CHANGED');assert.equal(f.calls.length, 0);
});

test('writes disabled locally make zero API calls', async () => {
  const f = fixture({ credentialLoader: () => ({ ...creds, allowWrites: false }) });
  const result = await f.client.change(change(), context());assert.equal(result.code, 'WRITES_DISABLED');assert.equal(f.calls.length, 0);
});

for (const resource of Object.keys(bodies)) {
  test(`approved ${resource} creation dispatches exactly once and reads back`, async () => {
    const parent = ['resources', 'routers'].includes(resource) ? { networkId: 'network-one' } : {};
    const created = item(resource);const f = fixture({ responses: [ok(created), ok(created)] });
    let preview = '';
    const result = await f.client.change(change({ resource, body: JSON.stringify(bodies[resource]), ...parent }), context(async (_t, message) => { preview = message;return true; }));
    assert.equal(result.status, 'ok');assert.equal(result.verification, 'read_back_matches_request');assert.equal(result.retryAutomatically, false);
    assert.deepEqual(f.calls.map(c => c.method), ['POST', 'GET']);assert.ok(preview.includes('PEDIDO COMPLETO'));assert.ok(preview.includes('\n  "'));assert.ok(!preview.includes(TOKEN));
    assert.ok(preview.includes(creds.apiUrl));assert.deepEqual(f.calls[0].body, bodies[resource]);
  });
}

test('create denial makes zero API calls and input mutation cannot alter an approved plan', async () => {
  const denied = fixture();assert.equal((await denied.client.change(change(), context(async () => false))).status, 'denied');assert.equal(denied.calls.length, 0);
  const f = fixture({ responses: [ok(item()), ok(item())] });const input = change();
  const result = await f.client.change(input, context(async () => { input.body = JSON.stringify({ ...group, name: 'Not approved' });input.resource = 'users';return true; }));
  assert.equal(result.status, 'ok');assert.equal(f.calls[0].path, '/groups');assert.equal(f.calls[0].body.name, 'Support');
});

test('updates read before, recheck and perform one full PUT', async () => {
  const before = item();const after = item('groups', { name: 'Changed' });
  const f = fixture({ responses: [ok(before), ok(before), ok(after), ok(after)] });
  const result = await f.client.change(change({ operation: 'update', id: before.id, body: JSON.stringify({ ...group, name: 'Changed' }) }), context());
  assert.equal(result.status, 'ok');assert.deepEqual(f.calls.map(c => c.method), ['GET', 'GET', 'PUT', 'GET']);
});

test('a server that accepts but ignores requested fields is not reported as verified', async () => {
  const original = item();
  const f = fixture({ responses: [ok(original), ok(original), ok(original), ok(original)] });
  const result = await f.client.change(change({ operation: 'update', id: original.id, body: JSON.stringify({ ...group, name: 'Changed' }) }), context());
  assert.equal(result.status, 'accepted_unverified');assert.equal(result.verification, 'read_back_mismatch');
  assert.equal(f.calls.filter(c => c.method === 'PUT').length, 1);assert.equal(result.retryAutomatically, false);
});

test('a concurrent material update aborts before mutation', async () => {
  const f = fixture({ responses: [ok(item()), ok(item('groups', { peers: ['other-peer'] }))] });
  const result = await f.client.change(change({ operation: 'update', id: 'object-one' }), context());
  assert.equal(result.code, 'CONFLICT');assert.ok(f.calls.every(c => c.method === 'GET'));
});

test('volatile fields and group ordering are not material fingerprint changes', () => {
  const one = { ...item(), peers: [{ id: 'b' }, { id: 'a' }], last_seen: 'old' };
  const two = { ...item(), peers: [{ id: 'a' }, { id: 'b' }], last_seen: 'new' };
  assert.equal(fingerprintState('groups', one), fingerprintState('groups', two));
});

test('token rotation during update approval prevents the PUT', async () => {
  const f = fixture({ responses: [ok(item())], credentialLoader: n => n === 1 ? creds : { ...creds, binding: 'rotated' } });
  const result = await f.client.change(change({ operation: 'update', id: 'object-one' }), context());assert.equal(result.code, 'CONFIG_CHANGED');assert.equal(f.calls.length, 1);
});

test('the All group and enabling the existing Default policy are protected', async () => {
  const all = fixture({ responses: [ok(item('groups', { name: 'All' }))] });
  assert.equal((await all.client.change(change({ operation: 'delete', id: 'object-one', body: undefined }), context())).code, 'PROTECTED_RESOURCE');
  const def = fixture({ responses: [ok(item('policies', { name: 'Default' }))] });
  assert.equal((await def.client.change(change({ operation: 'update', resource: 'policies', id: 'object-one', body: JSON.stringify(bodies.policies) }), context())).code, 'PROTECTED_RESOURCE');
});

test('network deletion refuses implicit cascading dependencies', async () => {
  const f = fixture({ responses: [ok(item('networks')), ok([item('resources')])] });
  const result = await f.client.change(change({ operation: 'delete', resource: 'networks', id: 'object-one', body: undefined }), context());
  assert.equal(result.code, 'DEPENDENCIES_EXIST');assert.ok(f.calls.every(c => c.method === 'GET'));
});

test('a confirmed deletion is verified by item404, never assumed from status204', async () => {
  const missing = new NetBirdError('API_HTTP_ERROR', 'synthetic missing', { httpStatus: 404 });
  const f = fixture({ responses: [ok(item()), ok(item()), { httpStatus: 200, data: null }, missing] });
  const result = await f.client.change(change({ operation: 'delete', id: 'object-one', body: undefined }), context());
  assert.equal(result.status, 'ok');assert.equal(result.verification, 'resource_absent');assert.equal(f.calls.filter(c => c.method === 'DELETE').length, 1);
});

test('a lost mutation response stays uncertain and is never retried', async () => {
  const f = fixture({ responses: [new Error('untrusted transport detail ' + TOKEN)] });
  const result = await f.client.change(change(), context());assert.equal(result.status, 'unknown');assert.equal(result.retryAutomatically, false);assert.equal(f.calls.length, 1);assert.ok(!JSON.stringify(result).includes(TOKEN));
});

test('an accepted create without an ID is reported unverified without retry', async () => {
  const f = fixture({ responses: [ok({ name: 'Support' })] });
  const result = await f.client.change(change(), context());assert.equal(result.status, 'accepted_unverified');assert.equal(result.verified, false);assert.equal(f.calls.length, 1);
});

test('credentials in tool arguments and oversized previews are blocked', async () => {
  const f = fixture();const result = await f.client.change(change({ reason: 'not allowed ' + TOKEN }), context());assert.equal(result.code, 'CREDENTIAL_IN_INPUT');assert.equal(f.calls.length, 0);
  const large = fixture({ responses: [ok(item('groups', { name: 'x'.repeat(40000) }))] });
  assert.equal((await large.client.change(change({ operation: 'delete', id: 'object-one', body: undefined }), context())).code, 'PREVIEW_TOO_LARGE');
  assert.ok(large.calls.every(c => c.method === 'GET'));
});

test('pre-aborted and cancelled approval cannot perform a late mutation', async () => {
  const f = fixture();const abort = new AbortController();abort.abort();
  assert.equal((await f.client.change(change(), { ...context(), signal: abort.signal })).code, 'CANCELLED');assert.equal(f.calls.length, 0);
  let resolveApproval;const active = new AbortController();
  const run = f.client.change(change(), { ...context(() => new Promise(resolve => { resolveApproval = resolve; })), signal: active.signal });
  while (!resolveApproval) await new Promise(resolve => setImmediate(resolve));
  active.abort();const result = await run;resolveApproval(true);await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.status, 'cancelled');assert.equal(f.calls.length, 0);
});

test('concurrent calls are refused and session cancellation revokes a pending approval', async () => {
  const f = fixture();let pending;
  const run = f.client.change(change(), context(() => new Promise(resolve => { pending = resolve; })));
  while (!pending) await new Promise(resolve => setImmediate(resolve));
  assert.equal((await f.client.read({ resource: 'peers' }, context())).code, 'BUSY');
  f.client.cancelAll();assert.equal((await run).status, 'cancelled');pending(true);await new Promise(resolve => setImmediate(resolve));assert.equal(f.calls.length, 0);
});

test('deadline bounds a UI callback that ignores cancellation', async () => {
  const f = fixture({ deadlineMs: 5 });
  const result = await f.client.change(change(), context(() => new Promise(() => {})));
  assert.equal(result.status, 'cancelled');assert.equal(f.calls.length, 0);
});
