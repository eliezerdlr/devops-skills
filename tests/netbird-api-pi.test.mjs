import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire, findPackageJSON } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const sdkRoot = process.env.PI_SDK_ROOT;
if (!sdkRoot) throw new Error('Set PI_SDK_ROOT to the installed Pi package directory');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requireSdk = createRequire(resolve(sdkRoot, 'package.json'));
const hostModule = name => resolve(dirname(findPackageJSON(name, pathToFileURL(resolve(sdkRoot, 'package.json')))), 'dist/index.js');
const { createJiti } = requireSdk('jiti');
const jiti = createJiti(import.meta.url, { alias: {
  '@earendil-works/pi-coding-agent': resolve(sdkRoot, 'dist/index.js'),
  '@earendil-works/pi-agent-core': hostModule('@earendil-works/pi-agent-core'),
  typebox: requireSdk.resolve('typebox'),
} });
const entry = resolve(root, 'extensions/netbird-api/index.ts');
const { createNetBirdExtension } = await jiti.import(entry);
const { loadExtensions } = await import(pathToFileURL(resolve(sdkRoot, 'dist/core/extensions/loader.js')));
function register(client) {
  const tools = new Map(), commands = new Map(), events = new Map();
  createNetBirdExtension({ client })({ registerTool: t => tools.set(t.name, t), registerCommand: (n, c) => commands.set(n, c), on: (n, f) => events.set(n, f) });
  return { tools, commands, events };
}
const signal = () => new AbortController().signal;

test('actual Pi loader accepts both root extensions without tool collisions', async () => {
  const result = await loadExtensions([resolve(root, 'extensions/ops-orchestrator/index.ts'), entry], root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.extensions.length, 2);
  assert.deepEqual([...result.extensions[1].tools.keys()], ['netbird_status', 'netbird_read', 'netbird_change']);
  assert.deepEqual([...result.extensions[1].commands.keys()], ['netbird-status']);
});
test('registration does not call status, read, change or a credential reader', () => {
  let calls = 0;
  register(new Proxy({}, { get: () => { calls++;throw Error('must not execute on startup'); } }));
  assert.equal(calls, 0);
});
test('adapter forwards genuine UI confirmation and abort to the engine', async () => {
  const approvals = []; let received;
  const ext = register({ async read(input, options) { received = { input, options };assert.equal(await options.approve('NetBird — autorização', 'Exact request', options.signal), true);return { status: 'ok', data: [] }; } });
  const abort = signal();
  const ctx = { hasUI: true, ui: { confirm: async (...args) => { approvals.push(args);return true; } } };
  const result = await ext.tools.get('netbird_read').execute('synthetic', { resource: 'peers' }, abort, () => {}, ctx);
  assert.equal(received.options.signal, abort);assert.equal(received.options.interactive, true);
  assert.equal(approvals[0][0], 'NetBird — autorização');assert.equal(approvals[0][1], 'Exact request');assert.equal(approvals[0][2].timeout, 60000);
  assert.deepEqual(JSON.parse(result.content[0].text), { status: 'ok', data: [] });assert.equal(result.details, undefined);
});
test('headless and missing UI fail closed at the approval boundary', async () => {
  for (const ctx of [{ hasUI: false }, { hasUI: true }]) {
    const ext = register({ async change(_input, options) { assert.equal(options.interactive, false);return { status: 'error', code: 'UI_REQUIRED' }; } });
    const result = await ext.tools.get('netbird_change').execute('synthetic', {}, signal(), () => {}, ctx);
    assert.equal(result.isError, true);
  }
});
test('lifecycle cancellation is wired to shutdown, switch, fork and tree changes', async () => {
  let cancelled = 0;const ext = register({ cancelAll() { cancelled++; } });
  for (const event of ['session_shutdown', 'session_before_switch', 'session_before_fork', 'session_before_tree']) { assert.ok(ext.events.has(event));await ext.events.get(event)(); }
  assert.equal(cancelled, 4);
});
test('unexpected errors and oversized adapter output do not expose raw data', async () => {
  const ctx = { hasUI: false };
  for (const status of [async () => { throw Error('SYNTHETIC_SECRET_NEVER_RETURN'); }, async () => ({ status: 'ok', data: 'x'.repeat(60000) })]) {
    const ext = register({ status });
    const result = await ext.tools.get('netbird_status').execute('synthetic', {}, signal(), () => {}, ctx);
    assert.equal(result.isError, true);assert.doesNotMatch(result.content[0].text, /SYNTHETIC_SECRET/);assert.equal(result.details, undefined);
  }
});
