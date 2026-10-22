import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path), 'utf8');
const json = async path => JSON.parse(await read(path));
const guides = ['host', 'omniroute', 'graphify', 'archify', 'workflow-tools'].map(name => `docs/install/${name}.md`);
const entrypoints = ['README.md', 'README.en.md', 'docs/DEPENDENCIES.md', 'integrations/graphify/README.md', 'integrations/archify/README.md', 'integrations/omniroute/README.md', 'integrations/planning-with-files/README.md'];

test('root points to explicit non-installing inventory covering all integrated external runtimes', async () => {
  const pkg = await json('package.json');
  assert.equal(pkg.devopsSkills.installationInventory, './docs/external-installations.json');
  const inventory = await json(pkg.devopsSkills.installationInventory);
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(inventory.automaticInstallation, false);
  assert.deepEqual(inventory.entries.map(entry => entry.id).sort(), ['archify', 'graphify', 'host', 'omniroute', 'planning', 'workflow-tools']);
  assert.equal(new Set(inventory.entries.map(entry => entry.id)).size, inventory.entries.length);
  await access(resolve(root, inventory.index));
  for (const entry of inventory.entries) {
    assert.ok(entry.validation && !entry.validation.includes('production-approved'));
    await access(resolve(root, entry.guide));
  }
  assert.ok(pkg.scripts.test.includes('tests/external-installation.test.mjs'));
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(Object.hasOwn(pkg.scripts, hook), false);
});

test('runtime pins agree with provenance while published OmniRoute candidate stays distinct', async () => {
  const { entries } = await json('docs/external-installations.json');
  const find = id => entries.find(entry => entry.id === id);
  assert.equal(find('graphify').version, (await json('integrations/graphify/UPSTREAM.json')).version);
  assert.equal(find('archify').version, (await json('integrations/archify/UPSTREAM.json')).runtimeVersion);
  assert.equal(find('planning').version, (await json('integrations/planning-with-files/UPSTREAM.json')).packageVersion);
  assert.equal(find('omniroute').sourceVersion, (await json('integrations/omniroute/UPSTREAM.json')).version);
  assert.equal(find('omniroute').publishedCandidate, '3.8.52');
  assert.notEqual(find('omniroute').publishedCandidate, find('omniroute').sourceVersion);
  const guide = await read(find('omniroute').guide);
  assert.match(guide, /3\.8\.53.*404/);
  assert.match(guide, /EXPECTED_SRI=/);
  assert.match(guide, /gate manual obrigatório/i);
});

test('each operational guide covers prerequisite, install, config, check and lifecycle with evidence limits', async () => {
  for (const file of guides) {
    const text = await read(file);
    for (const heading of ['Pré-requisitos', 'Instalação', 'Configuração', 'Verificação', 'Operação', 'Atualização', 'Remoção', 'Fontes']) {
      assert.match(text, new RegExp(`^## ${heading}`, 'm'), `${file}: ${heading}`);
    }
    assert.match(text, /rollback/i, file);
    assert.match(text, /não (?:foram |foi |executad|homologad)|não.*executad|nenhuma.*instalad/i, file);
    for (const [, block] of text.matchAll(/^```bash\n([\s\S]*?)^```/gm)) {
      assert.doesNotMatch(block, /curl[^\n]*\|\s*(?:sh|bash)/, file);
      assert.doesNotMatch(block, /npm (?:install|i) -g|sudo npm/, file);
    }
  }
  for (const file of entrypoints) assert.match(await read(file), /INSTALLATION\.md/, file);
});

test('all installation links stay inside repository and code fences are balanced', async () => {
  for (const file of ['docs/INSTALLATION.md', ...guides, ...entrypoints]) {
    const text = await read(file);
    assert.equal((text.match(/^```/gm) ?? []).length % 2, 0, file);
    for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const destination = resolve(dirname(resolve(root, file)), target.split('#')[0]);
      assert.ok(!relative(root, destination).startsWith('..'), `${file}: escapes root`);
      await assert.doesNotReject(access(destination), `${file}: ${target}`);
    }
  }
});

test('documented shell and embedded Python parse without executing installers or runtime code', async () => {
  for (const file of guides) {
    const text = await read(file);
    for (const [, block] of text.matchAll(/^```bash\n([\s\S]*?)^```/gm)) {
      const shell = spawnSync('bash', ['-n'], { input: block, encoding: 'utf8', timeout: 5000 });
      assert.equal(shell.status, 0, `${file}: ${shell.stderr}`);
      for (const [, code] of block.matchAll(/python3 - <<'PY'\n([\s\S]*?)\nPY(?:\n|$)/g)) {
        const python = spawnSync('python3', ['-c', 'import ast,sys; ast.parse(sys.stdin.read())'], { input: code, encoding: 'utf8', timeout: 5000 });
        assert.equal(python.status, 0, `${file}: ${python.stderr}`);
      }
    }
  }
});

test('documented wrapper and plist generators work only against a synthetic temporary home', async () => {
  const text = await read('docs/install/omniroute.md');
  const scripts = [...text.matchAll(/python3 - <<'PY'\n([\s\S]*?)\nPY(?:\n|$)/g)].map(match => match[1]);
  const wrapperScript = scripts.find(code => code.includes("wrapper = root / 'run-pilot.sh'"));
  const plistScript = scripts.find(code => code.includes('import os, plistlib'));
  assert.ok(wrapperScript && plistScript);
  const home = await mkdtemp(resolve(tmpdir(), 'installation-docs-'));
  const app = resolve(home, 'app with spaces');
  const config = resolve(home, 'config with spaces');
  try {
    await mkdir(app);
    await mkdir(config);
    const result = spawnSync('python3', ['-c', wrapperScript + '\n' + plistScript + `
import stat
p = Path.home() / 'Library/LaunchAgents/local.devops-skills.omniroute.plist'
d = plistlib.loads(p.read_bytes())
assert d['Label'] == 'local.devops-skills.omniroute'
assert d['ProgramArguments'] == [str(root / 'run-pilot.sh')]
assert d['KeepAlive'] == {'SuccessfulExit': False}
assert 'EnvironmentVariables' not in d
assert stat.S_IMODE(p.stat().st_mode) == 0o600
assert stat.S_IMODE((root / 'run-pilot.sh').stat().st_mode) == 0o700
`], {
      env: { PATH: process.env.PATH, HOME: home, ROOT: app, CONFIG: config, LOGS: resolve(app, 'logs'), NODE_BIN: process.execPath, RELEASE: resolve(app, 'releases/3.8.52') },
      encoding: 'utf8', timeout: 5000,
    });
    assert.equal(result.status, 0, result.stderr);
    const syntax = spawnSync('bash', ['-n', resolve(app, 'run-pilot.sh')], { encoding: 'utf8', timeout: 5000 });
    assert.equal(syntax.status, 0, syntax.stderr);
    const wrapper = await readFile(resolve(app, 'run-pilot.sh'), 'utf8');
    assert.ok(wrapper.includes('serve --port 20128 --no-open --no-tray --no-recovery'));
    // No wrapper execution, launchctl, npm, key creation or server start occurs.
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test('OmniRoute service does not silently expose remote access or disable its dashboard', async () => {
  const guide = await read('docs/install/omniroute.md');
  assert.match(guide, /'OMNIROUTE_SERVER_HOST': '127\.0\.0\.1'/);
  assert.match(guide, /'OMNIROUTE_HEADLESS': '0'/);
  assert.match(guide, /'REQUIRE_API_KEY': 'true'/);
  assert.match(guide, /getpass\.getpass/);
  assert.match(guide, /secrets\.token_urlsafe/);
  assert.match(guide, /serve --port 20128 --no-open --no-tray --no-recovery/);
  assert.match(guide, /LaunchAgent.*após login/);
  assert.match(guide, /acesso remoto continua.*bloqueado/i);
  assert.match(guide, /health não prova autenticação nem inferência/i);
});
