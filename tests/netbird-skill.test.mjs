import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { root, registeredSkillFiles, assertUnifiedManifest } from './package-contract.mjs';

const skill = resolve(root, 'skills/engineering-skills/netbird-remote-access');
const read = name => readFile(resolve(skill, name), 'utf8');
// Only trusted local package code is executed. No inherited credentials, installs,
// daemon connection, model transport, infrastructure target or shell is used.
const env = { PATH: process.env.PATH ?? '', PYTHONDONTWRITEBYTECODE: '1' };
const runPython = args => spawnSync('python3', args, {
  cwd: skill, env, encoding: 'utf8', timeout: 30000, maxBuffer: 1048576,
});
const probe = runPython(['-B', '-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)']);
const pythonAvailable = !probe.error && probe.status === 0;

test('NetBird is discovered exactly once through the existing specialist glob', async () => {
  await assertUnifiedManifest();
  const files = await registeredSkillFiles();
  assert.equal(files.filter(path => path === resolve(skill, 'SKILL.md')).length, 1);
});

test('NetBird entrypoint is bounded and retains the approval and privacy boundaries', async () => {
  const text = await read('SKILL.md');
  assert.match(text, /^---\nname: netbird-remote-access\n/);
  assert.match(text, /description:.*Use when:/);
  assert.ok(text.split('\n').length <= 100);
  assert.ok(Buffer.byteLength(text) <= 8192);
  for (const term of ['não autoriza', 'rollback', 'recuperação', 'Exit node', 'estado persistente', 'não DLP']) {
    assert.ok(text.includes(term), `missing safety boundary: ${term}`);
  }
  const privacy = await read('references/privacy.md');
  assert.match(privacy, /não guardar aqui resultados/);
  assert.match(privacy, /não recolher automaticamente/);
  assert.match(privacy, /não confiáveis/);
});

test('NetBird templates require explicit parameters and separate bootstrap from persistent identity', async () => {
  const base = await read('templates/compose.yaml');
  for (const key of ['NB_PROJECT_NAME', 'NB_IMAGE', 'NB_HOSTNAME', 'NB_STATE_DIR', 'NB_MANAGEMENT_URL']) {
    assert.ok(base.includes('${' + key + ':?'), `unguarded parameter: ${key}`);
  }
  assert.match(base, /create_host_path: false/);
  assert.match(base, /network_mode: host/);
  assert.doesNotMatch(base, /NB_SETUP_KEY_FILE|privileged:|sysctls:|ports:/);
  const bootstrap = await read('templates/compose.bootstrap.yaml');
  assert.match(bootstrap, /NB_SETUP_KEY_FILE/);
  assert.ok(bootstrap.includes('${NB_SETUP_KEY_PATH:?'));
  assert.doesNotMatch(bootstrap, /NB_SETUP_KEY:/);
});

test('NetBird example is fictitious, not a runtime release or stored credential', async () => {
  const text = await read('templates/environment.example');
  assert.match(text, /NB_MANAGEMENT_URL=https:\/\/vpn\.example\.com/);
  assert.match(text, /NB_IMAGE=netbirdio\/netbird:<VERSION>@sha256:<SHA256>/);
  assert.doesNotMatch(text, /^NB_SETUP_KEY=/m);
  const docs = await read('README.md');
  assert.match(docs, /Python 3\.9/);
  assert.match(docs, /Linux.*Docker Engine/);
  assert.match(docs, /não valida a existência de uma imagem/);
  assert.match(docs, /Integrado no catálogo principal/);
  assert.doesNotMatch(docs, /Pacote de revisão, não instalado/);
});

test('NetBird documentary skill coexists with the separately approved API connector', async () => {
  const pkg = await assertUnifiedManifest();
  assert.deepEqual(pkg.pi.extensions, ['./extensions/ops-orchestrator/index.ts', './extensions/netbird-api/index.ts', './extensions/ponytail/index.ts']);
  assert.equal(Object.hasOwn(pkg.scripts, 'postinstall'), false);
  assert.equal(Object.hasOwn(pkg, 'dependencies'), false);
  assert.ok(pkg.scripts.test.includes('netbird-skill.test.mjs'));
  assert.equal(pkg.scripts['test:netbird'], 'node --test tests/netbird-skill.test.mjs tests/netbird-api.test.mjs tests/netbird-api-transport.test.mjs');
});

test('NetBird offline validator passes on the integrated package', {
  skip: pythonAvailable ? false : 'Python 3.9+ unavailable; no automatic installation',
}, () => {
  const result = runPython(['-B', 'scripts/validate_skill.py']);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'PASS');
  assert.equal(report.files_checked, 12);
  assert.deepEqual(report.findings, []);
});

test('NetBird synthetic Python regression suite passes without bytecode caches', {
  skip: !pythonAvailable ? 'Python 3.9+ unavailable' : process.platform === 'win32' ? 'POSIX regression suite not homologated on Windows' : false,
}, () => {
  const result = runPython(['-B', '-m', 'unittest', 'discover', '-s', 'tests', '-v']);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Ran 41 tests/);
  assert.match(result.stderr, /\bOK\b/);
});
