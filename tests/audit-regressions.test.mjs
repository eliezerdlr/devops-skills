import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
test('eleven audit findings have offline positive and negative Python regressions', { timeout: 120000 }, () => {
  const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  const result = spawnSync(python, ['-B', '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_audit_regressions.py', '-v'], {
    cwd: root, encoding: 'utf8', timeout: 110000, maxBuffer: 2 * 1024 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stderr, /Ran 28 tests/);
  assert.doesNotMatch(result.stderr, /skipped=/);
});
