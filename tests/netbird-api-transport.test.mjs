import nodeTest from 'node:test';
const test = (name, fn) => nodeTest(name, { skip: process.platform === 'win32' ? 'POSIX credential profile tests' : false }, fn);
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, chmod, rm, symlink, link } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadCredentials, configurationStatus, normaliseApiUrl } from '../extensions/netbird-api/config.mjs';
import { httpsRequest, MAX_RESPONSE } from '../extensions/netbird-api/transport.mjs';
import { publicError } from '../extensions/netbird-api/errors.mjs';

const TOKEN = 'SYNTHETIC_PAT_FOR_OFFLINE_TESTS';
async function fixture(t, config = { apiUrl: 'https://vpn.example.com/api', allowWrites: false }) {
  const dir = await mkdtemp(join(tmpdir(), 'netbird-config-test-'));
  await chmod(dir, 0o700);
  await writeFile(join(dir, 'config.json'), JSON.stringify(config), { mode: 0o600 });
  await writeFile(join(dir, 'api.token'), TOKEN + '\n', { mode: 0o600 });
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}
const baseRequest = { apiUrl: 'https://vpn.example.com/api', path: '/peers', method: 'GET', token: TOKEN };
function fakeRequest({ status = 200, data = '[]', headers = { 'content-type': 'application/json' }, hang = false, error = false } = {}) {
  const calls = [];
  function request(url, options, callback) {
    const req = new EventEmitter();const call = { url: url.href, options, body: '' };calls.push(call);
    req.write = chunk => { call.body += chunk; };
    req.destroy = () => {};
    req.end = () => queueMicrotask(() => {
      if (hang) return;
      if (error) return req.emit('error', new Error('must-not-leak-' + TOKEN));
      const response = new PassThrough();response.statusCode = status;response.headers = headers;
      callback(response);if (!response.destroyed) response.end(data);
    });
    return req;
  }
  return { requestImpl: request, calls };
}

test('API URLs are HTTPS-only and normalise to a fixed /api origin', () => {
  assert.equal(normaliseApiUrl('https://vpn.example.com'), 'https://vpn.example.com/api');
  assert.equal(normaliseApiUrl('https://vpn.example.com/api/'), 'https://vpn.example.com/api');
  for (const value of ['http://vpn.example.com', 'https://user:pass@vpn.example.com', 'https://vpn.example.com/api?x=1', 'https://vpn.example.com/#x', 'https://vpn.example.com/other', 'https://vpn.example.com/\n']) {
    assert.throws(() => normaliseApiUrl(value));
  }
});

test('credentials remain private and are not part of public configuration status', async t => {
  const dir = await fixture(t);const result = await loadCredentials({ profileDir: dir });
  assert.equal(result.token, TOKEN);assert.equal(result.allowWrites, false);
  const status = await configurationStatus({ profileDir: dir });
  assert.equal(status.status, 'configured');assert.equal(status.tokenValidity, 'not_checked');assert.equal(status.apiContacted, false);
  assert.ok(!JSON.stringify(status).includes(TOKEN));assert.ok(!JSON.stringify(status).includes(result.binding));
});

test('missing profiles fail without revealing absolute paths', async () => {
  const status = await configurationStatus({ profileDir: join(tmpdir(), 'missing-netbird-profile-for-test') });
  assert.equal(status.status, 'not_ready');assert.equal(status.apiContacted, false);
  assert.ok(!JSON.stringify(status).includes(tmpdir()));
});

for (const name of ['config.json', 'api.token']) {
  test(`insecure ${name} permissions are refused`, async t => {
    const dir = await fixture(t);await chmod(join(dir, name), 0o644);
    await assert.rejects(loadCredentials({ profileDir: dir }), { code: 'CREDENTIAL_PERMISSIONS' });
  });
  test(`symlink ${name} is refused`, async t => {
    const dir = await fixture(t);const path = join(dir, name);const data = await readFile(path);
    await writeFile(join(dir, 'other'), data, { mode: 0o600 });await rm(path);await symlink(join(dir, 'other'), path);
    await assert.rejects(loadCredentials({ profileDir: dir }), { code: 'CREDENTIAL_PERMISSIONS' });
  });
  test(`hardlinked ${name} is refused`, async t => {
    const dir = await fixture(t);await link(join(dir, name), join(dir, 'other'));
    await assert.rejects(loadCredentials({ profileDir: dir }), { code: 'CREDENTIAL_PERMISSIONS' });
  });
}

test('insecure profile directory and wrong user are refused', async t => {
  const dir = await fixture(t);await chmod(dir, 0o755);
  await assert.rejects(loadCredentials({ profileDir: dir }), { code: 'PROFILE_PERMISSIONS' });
  await chmod(dir, 0o700);const original = process.getuid;
  try { process.getuid = () => original() + 1;await assert.rejects(loadCredentials({ profileDir: dir }), { code: 'PROFILE_PERMISSIONS' }); }
  finally { process.getuid = original; }
});

test('unknown configuration keys and invalid token bytes are refused', async t => {
  const dir = await fixture(t, { apiUrl: 'https://vpn.example.com', allowWrites: false, token: 'not-accepted' });
  await assert.rejects(loadCredentials({ profileDir: dir }), { code: 'CONFIG_INVALID' });
  await writeFile(join(dir, 'config.json'), JSON.stringify({ apiUrl: 'https://vpn.example.com/api', allowWrites: false }));
  await writeFile(join(dir, 'api.token'), TOKEN + '\nextra');
  await assert.rejects(loadCredentials({ profileDir: dir }), { code: 'TOKEN_INVALID' });
});

test('large and non-UTF8 credential/config files are refused', async t => {
  const dir = await fixture(t);await writeFile(join(dir, 'config.json'), 'x'.repeat(4097));
  await assert.rejects(loadCredentials({ profileDir: dir }), { code: 'CREDENTIAL_PERMISSIONS' });
  await writeFile(join(dir, 'config.json'), Buffer.from([255, 254]));
  await assert.rejects(loadCredentials({ profileDir: dir }), { code: 'CONFIG_INVALID' });
});

test('credential rotation changes only the internal approval binding', async t => {
  const dir = await fixture(t);const first = await loadCredentials({ profileDir: dir });
  await writeFile(join(dir, 'api.token'), TOKEN + '_ROTATED');
  const second = await loadCredentials({ profileDir: dir });assert.notEqual(first.binding, second.binding);
  assert.equal((await configurationStatus({ profileDir: dir })).tokenValidity, 'not_checked');
});

test('HTTPS transport pins TLS validation and sends PAT only in its internal header', async () => {
  const fake = fakeRequest();const result = await httpsRequest(baseRequest, fake);
  assert.deepEqual(result, { httpStatus: 200, data: [] });assert.equal(fake.calls.length, 1);
  const { options, url } = fake.calls[0];assert.equal(url, 'https://vpn.example.com/api/peers');
  assert.equal(options.rejectUnauthorized, true);assert.equal(options.agent, false);assert.equal(options.minVersion, 'TLSv1.2');
  assert.equal(options.headers.Authorization, 'Token ' + TOKEN);assert.ok(!JSON.stringify(result).includes(TOKEN));
});

test('redirects are refused rather than forwarding authentication', async () => {
  const fake = fakeRequest({ status: 302, headers: { location: 'https://other.example/api/peers' } });
  await assert.rejects(httpsRequest(baseRequest, fake), { code: 'REDIRECT_REFUSED' });assert.equal(fake.calls.length, 1);
});

test('HTTP errors never disclose a server body or retry', async () => {
  const fake = fakeRequest({ status: 401, data: TOKEN });
  try { await httpsRequest(baseRequest, fake);assert.fail('expected rejection'); }
  catch (error) { assert.equal(error.code, 'API_HTTP_ERROR');assert.equal(error.details.httpStatus, 401);assert.ok(!JSON.stringify(publicError(error)).includes(TOKEN)); }
  assert.equal(fake.calls.length, 1);
});

test('headers and streamed data enforce response bounds', async () => {
  await assert.rejects(httpsRequest(baseRequest, fakeRequest({ headers: { 'content-length': String(MAX_RESPONSE + 1) } })), { code: 'RESPONSE_LIMIT' });
  await assert.rejects(httpsRequest(baseRequest, fakeRequest({ data: Buffer.alloc(MAX_RESPONSE + 1) })), { code: 'RESPONSE_LIMIT' });
});

test('compressed, HTML, malformed JSON and invalid UTF8 responses are refused', async () => {
  for (const spec of [{ headers: { 'content-encoding': 'gzip' } }, { headers: { 'content-type': 'text/html' } }, { data: 'not-json' }, { data: Buffer.from([255]) }]) {
    await assert.rejects(httpsRequest(baseRequest, fakeRequest(spec)));
  }
});

test('DELETE accepts an empty204 response', async () => {
  const fake = fakeRequest({ status: 204, data: '', headers: {} });
  assert.deepEqual(await httpsRequest({ ...baseRequest, method: 'DELETE' }, fake), { httpStatus: 204, data: null });
});

test('arbitrary paths, headers via tokens and GET bodies are refused before dispatch', async () => {
  const fake = fakeRequest();
  for (const path of ['/../tokens', '//other.example', '/groups?id=x', '/groups/x%2Fy']) await assert.rejects(httpsRequest({ ...baseRequest, path }, fake));
  await assert.rejects(httpsRequest({ ...baseRequest, token: TOKEN + '\nX: value' }, fake));
  await assert.rejects(httpsRequest({ ...baseRequest, body: {} }, fake));assert.equal(fake.calls.length, 0);
});

test('transport exceptions are sanitised and mutations are marked unconfirmed', async () => {
  const fake = fakeRequest({ error: true });
  try { await httpsRequest({ ...baseRequest, method: 'PUT', body: { name: 'example' } }, fake);assert.fail('expected failure'); }
  catch (error) { const result = publicError(error, true);assert.equal(result.status, 'unknown');assert.equal(result.retryAutomatically, false);assert.ok(!JSON.stringify(result).includes(TOKEN)); }
});

test('pre-aborted requests never dispatch', async () => {
  const abort = new AbortController();abort.abort();const fake = fakeRequest();
  await assert.rejects(httpsRequest({ ...baseRequest, signal: abort.signal }, fake), { code: 'CANCELLED' });assert.equal(fake.calls.length, 0);
});

test('DELETE also accepts the empty200 response documented in the pinned API', async () => {
  const fake = fakeRequest({ status: 200, data: '', headers: {} });
  assert.deepEqual(await httpsRequest({ ...baseRequest, method: 'DELETE' }, fake), { httpStatus: 200, data: null });
});

test('offline setup helper regressions pass on synthetic profiles only', t => {
  const env = { PATH: process.env.PATH ?? '', PYTHONDONTWRITEBYTECODE: '1' };
  const probe = spawnSync('python3', ['-B', '-c', 'import sys; sys.exit(0 if sys.version_info >= (3,9) else 1)'], { env, timeout: 10000 });
  if (probe.error || probe.status !== 0) { t.skip('Python3.9+ unavailable; not installed automatically');return; }
  const path = fileURLToPath(new URL('../extensions/netbird-api/tests/', import.meta.url));
  const result = spawnSync('python3', ['-B', '-m', 'unittest', 'discover', '-s', path, '-p', 'test_configure.py', '-v'], { env, encoding: 'utf8', timeout: 30000, maxBuffer: 1048576 });
  assert.equal(result.error, undefined);assert.equal(result.status, 0, result.stderr);assert.match(result.stderr, /Ran 25 tests/);assert.match(result.stderr, /\bOK\b/);
});

test('a stalled transport times out without depending on error events', async () => {
  const keepAlive = setTimeout(() => {}, 1000);
  try { await assert.rejects(httpsRequest(baseRequest, { ...fakeRequest({ hang: true }), timeoutMs: 5 }), { code: 'REQUEST_TIMEOUT' }); }
  finally { clearTimeout(keepAlive); }
});
