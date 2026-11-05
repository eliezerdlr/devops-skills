// Explicit opt-in command only. Compiles a known benign fixture; NEVER executes it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyse, prepare, runProcess } from '../integrations/ghidra/adapter.mjs';
test('installed Ghidra performs real static analysis and decompilation of our benign fixture', { timeout: 240000 }, async () => {
  assert.ok(['darwin', 'linux'].includes(process.platform), 'Live fixture compilation currently supports macOS/Linux only');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ghidra-live-')); fs.chmodSync(root, 0o700);
  const source = path.join(root, 'benign.c'), binary = path.join(root, 'benign');
  fs.writeFileSync(source, '#include <stdio.h>\nint add(int a,int b){return a+b;}\nint main(void){puts("devops-ghidra-benign");return add(2,3)!=5;}\n', { mode: 0o600 });
  const built = await runProcess(process.platform === 'darwin' ? '/usr/bin/clang' : '/usr/bin/cc', ['-O0', '-g', source, '-o', binary], { timeoutMs: 60000 });
  assert.equal(built.code, 0, built.log); assert.equal(built.reason, undefined);
  const result = await analyse(prepare({ input: binary, outputRoot: root, timeoutSeconds: 180 }), { approve: async summary => summary.sandbox === false });
  const data = JSON.parse(fs.readFileSync(result.report, 'utf8'));
  assert.equal(result.status, 'completed'); assert.equal(data.analysisTimedOut, false); assert.equal(data.decompileFailures, 0);
  assert.ok(data.functionCount > 0); assert.ok(data.functions.some(f => f.c?.includes('return')));
  console.log(JSON.stringify({ ...result, fixtureSource: source, sampleExecuted: false }));
  // Preserve local artifacts for review; caller owns cleanup. Never upload decompiled code.
});
