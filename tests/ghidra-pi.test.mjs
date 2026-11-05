import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './package-contract.mjs';
import fs from 'node:fs';
import os from 'node:os';
const sdkRoot = process.env.PI_SDK_ROOT;
if (!sdkRoot) throw new Error('Set PI_SDK_ROOT to installed Pi 1.4.0 SDK');
const { loadExtensions } = await import(pathToFileURL(resolve(sdkRoot, 'dist/core/extensions/loader.js')));
async function load() {
  const result = await loadExtensions([resolve(root, 'extensions/ghidra/index.ts')], root);
  assert.deepEqual(result.errors, []); return result.extensions[0];
}
test('actual Pi loads Ghidra tools and lifecycle cancellation without requiring an installed runtime', async () => {
  const ext = await load();
  assert.deepEqual([...ext.tools.keys()], ['ghidra_status', 'ghidra_analyse']);
  assert.ok(ext.commands.has('ghidra-status'));
  for (const event of ['session_shutdown', 'session_before_switch', 'session_before_fork', 'session_before_tree']) assert.ok(ext.handlers.has(event));
});
test('headless tool execution fails closed before reading input or runtime', async () => {
  const ext = await load();
  await assert.rejects(ext.tools.get('ghidra_analyse').definition.execute('test', {}, new AbortController().signal, () => {}, { hasUI: false }), /Interactive human approval/);
});
test('actual Pi tool shows exact approval and refusal creates no analysis artifacts', async () => {
  const dir = fs.mkdtempSync(resolve(os.tmpdir(), 'ghidra-pi-'));
  const previous = process.env.DEVOPS_GHIDRA_CONFIG;
  const put = (p, value = 'fixture') => { const target = resolve(dir, p); fs.mkdirSync(resolve(target, '..'), { recursive: true }); fs.writeFileSync(target, value); return target; };
  try {
    put('runtime/Ghidra/application.properties', 'application.version=12.2\n'); put('runtime/Ghidra/Framework/Utility/lib/Utility.jar');
    const platform = { darwin: 'mac', linux: 'linux', win32: 'win' }[process.platform], arch = { arm64: 'arm_64', x64: 'x86_64' }[process.arch];
    fs.chmodSync(put(`runtime/Ghidra/Features/Decompiler/os/${platform}_${arch}/decompile${process.platform === 'win32' ? '.exe' : ''}`), 0o700);
    put('java/release', 'JAVA_VERSION="25.0.5"'); put(`java/bin/java${process.platform === 'win32' ? '.exe' : ''}`);
    process.env.DEVOPS_GHIDRA_CONFIG = put('config.json', JSON.stringify({ ghidraHome: resolve(dir, 'runtime'), javaHome: resolve(dir, 'java') }));
    const input = put('sample', Buffer.from('7f454c4600000000', 'hex')), before = fs.readdirSync(dir), ext = await load();
    let approvals = 0;
    const ctx = { hasUI: true, ui: { confirm: async (_title, body, options) => { approvals++; assert.match(body, /inputSha256/); assert.match(body, /scriptSha256/); assert.match(body, /No network isolation/); assert.equal(options.timeout, 60000); return false; } } };
    await assert.rejects(ext.tools.get('ghidra_analyse').definition.execute('test', { input, outputRoot: dir }, new AbortController().signal, () => {}, ctx), /not approved/);
    assert.equal(approvals, 1); assert.deepEqual(fs.readdirSync(dir), before);
  } finally {
    if (previous === undefined) delete process.env.DEVOPS_GHIDRA_CONFIG; else process.env.DEVOPS_GHIDRA_CONFIG = previous;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test('invalid input cannot reach the approval dialog or launch Java', async () => {
  const ext = await load(); let approvals = 0;
  await assert.rejects(ext.tools.get('ghidra_analyse').definition.execute('test', { input: 'relative', outputRoot: 'relative' }, new AbortController().signal, () => {}, { hasUI: true, ui: { confirm: async () => { approvals++; return true; } } }), /absolute path/);
  assert.equal(approvals, 0);
});
