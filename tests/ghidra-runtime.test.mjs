import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runtimeStatus, prepare, analyse, runProcess } from '../integrations/ghidra/adapter.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ghidra-unit-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const put = (p, text = 'fixture') => { const file = path.join(root, p); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); return file; };
  const home = path.join(root, 'runtime'), java = path.join(root, 'java');
  put('runtime/Ghidra/application.properties', 'application.version=12.2\n');
  put('runtime/Ghidra/Framework/Utility/lib/Utility.jar');
  const platform = { darwin: 'mac', linux: 'linux', win32: 'win' }[process.platform];
  const arch = { arm64: 'arm_64', x64: 'x86_64' }[process.arch];
  const native = put(`runtime/Ghidra/Features/Decompiler/os/${platform}_${arch}/decompile${process.platform === 'win32' ? '.exe' : ''}`); fs.chmodSync(native, 0o700);
  put('java/release', 'JAVA_VERSION="25.0.5"\n'); put(`java/bin/java${process.platform === 'win32' ? '.exe' : ''}`);
  const config = put('ghidra.json', JSON.stringify({ ghidraHome: home, javaHome: java }));
  const input = put('sample', Buffer.from('7f454c4600000000', 'hex'));
  return { root, config, input, put, native };
}

test('status validates pin, Java and native decompiler without launching fixture code', t => {
  const f = fixture(t); assert.equal(runtimeStatus(f.config).ready, true);
  fs.unlinkSync(f.native); assert.throws(() => runtimeStatus(f.config), /ENOENT|decompiler/);
});
test('rejects incompatible Java and Ghidra versions', t => {
  const f = fixture(t); f.put('java/release', 'JAVA_VERSION="17.0.1"'); assert.throws(() => runtimeStatus(f.config), /Java 25/);
  f.put('java/release', 'JAVA_VERSION="25.0.5"'); f.put('runtime/Ghidra/application.properties', 'application.version=12.1\n'); assert.throws(() => runtimeStatus(f.config), /12.2/);
});
test('prepares exact in-memory snapshot, rejects unsupported, relative, injected and unbounded parameters', t => {
  const f = fixture(t), args = { input: f.input, outputRoot: f.root };
  const p = prepare(args, f.config); assert.equal(p.format, 'ELF'); assert.equal(p.bytes.length, 8);
  assert.throws(() => prepare({ ...args, preScript: 'evil' }, f.config), /Unknown/);
  assert.throws(() => prepare({ ...args, timeoutSeconds: 601 }, f.config), /10..600/);
  assert.throws(() => prepare({ ...args, input: './sample' }, f.config), /absolute/);
  assert.throws(() => prepare({ ...args, input: f.input + '\n' }, f.config), /control/);
  f.put('sample', 'not a binary'); assert.throws(() => prepare(args, f.config), /Only ELF/);
  assert.equal(p.bytes.toString('hex'), '7f454c4600000000');
});
test('empty and oversized binaries are refused before allocation/launch', t => {
  const f = fixture(t); fs.truncateSync(f.input, 0); assert.throws(() => prepare({ input: f.input, outputRoot: f.root }, f.config), /empty/);
  fs.truncateSync(f.input, 64 * 1024 * 1024 + 1); assert.throws(() => prepare({ input: f.input, outputRoot: f.root }, f.config), /oversized/);
});
test('symlink input is refused', { skip: process.platform === 'win32' ? 'Windows symlink creation needs privilege' : false }, t => {
  const f = fixture(t), linked = path.join(f.root, 'linked'); fs.symlinkSync(f.input, linked);
  assert.throws(() => prepare({ input: linked, outputRoot: f.root }, f.config), /linked/);
});
test('missing/denied approval and aborted execution create no run directory', async t => {
  const f = fixture(t), p = prepare({ input: f.input, outputRoot: f.root }, f.config), before = fs.readdirSync(f.root);
  await assert.rejects(analyse(p), /approval callback/);
  for (const answer of [false, undefined, 'true', 1]) await assert.rejects(analyse(p, { approve: async () => answer }), /not approved/);
  const c = new AbortController(); c.abort(); await assert.rejects(analyse(p, { signal: c.signal, approve: async () => true }), /cancelled/);
  assert.deepEqual(fs.readdirSync(f.root), before);
});
test('runtime configuration changes during approval invalidate the run without launching', async t => {
  const f = fixture(t), p = prepare({ input: f.input, outputRoot: f.root }, f.config), before = fs.readdirSync(f.root);
  await assert.rejects(analyse(p, { approve: async () => { f.put('ghidra.json', JSON.stringify({ ghidraHome: '/nonexistent', javaHome: '/nonexistent' })); return true; } }), /ENOENT|changed/);
  assert.deepEqual(fs.readdirSync(f.root), before);
});
test('subprocess success, nonzero exit and output budget are reported accurately', async () => {
  let r = await runProcess(process.execPath, ['-e', 'console.log("bounded");process.exitCode=3'], { timeoutMs: 5000 });
  assert.equal(r.code, 3); assert.match(r.log, /bounded/);
  r = await runProcess(process.execPath, ['-e', 'process.stdout.write("x".repeat(100000));setInterval(()=>{},1000)'], { timeoutMs: 5000, maxBytes: 1024 });
  assert.equal(r.reason, 'log-limit'); assert.ok(Buffer.byteLength(r.log) <= 1024);
});
test('subprocess timeout and cancellation terminate execution', async () => {
  const args = ['-e', 'setInterval(()=>{},1000)'];
  const r = await runProcess(process.execPath, args, { timeoutMs: 100 }); assert.equal(r.reason, 'timeout');
  const c = new AbortController(); const p = runProcess(process.execPath, args, { timeoutMs: 5000, signal: c.signal }); c.abort();
  assert.equal((await p).reason, 'cancelled');
});
test('spawn failure rejects instead of pretending analysis completed', async () => {
  await assert.rejects(runProcess(path.join(os.tmpdir(), 'nonexistent-ghidra-command'), [], { timeoutMs: 1000 }), /ENOENT/);
});
