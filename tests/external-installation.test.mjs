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
const guides = ['host', 'omniroute', 'omniroute-macos-advanced', 'graphify', 'archify', 'workflow-tools'].map(name => `docs/install/${name}.md`);
const additionalGuides = ['docs/install/omniroute-services.md'];
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
  assert.match(guide, /npm install -g omniroute/);
  assert.match(guide, /macOS, Linux e Windows/);
  assert.match(guide, /prefixo global/);
  const advanced = await read('docs/install/omniroute-macos-advanced.md');
  assert.match(advanced, /3\.8\.53.*404/);
  assert.match(advanced, /EXPECTED_SRI=/);
  assert.match(advanced, /não é requisito de instalação/i);
});

test('each operational guide covers prerequisite, install, config, check and lifecycle with evidence limits', async () => {
  for (const file of guides) {
    const text = await read(file);
    for (const heading of ['Pré-requisitos', 'Instalação', 'Configuração', 'Verificação', 'Operação', 'Atualização', 'Remoção', 'Fontes']) {
      assert.match(text, new RegExp(`^## ${heading}`, 'm'), `${file}: ${heading}`);
    }
    assert.match(text, /rollback/i, file);
    assert.match(text, /não (?:foram |foi |executad|homologad)|não.*executad|nenhuma.*instalad/i, file);
    for (const [, block] of text.matchAll(/^```(?:bash|sh)\n([\s\S]*?)^```/gm)) {
      assert.doesNotMatch(block, /curl[^\n]*\|\s*(?:sh|bash)/, file);
      assert.doesNotMatch(block, /sudo npm/, file);
    }
  }
  for (const file of entrypoints) assert.match(await read(file), /INSTALLATION\.md/, file);
});

test('all installation links stay inside repository and code fences are balanced', async () => {
  for (const file of ['docs/INSTALLATION.md', ...guides, ...additionalGuides, ...entrypoints]) {
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
  for (const file of [...guides, ...additionalGuides]) {
    const text = await read(file);
    for (const [, block] of text.matchAll(/^```(?:bash|sh)\n([\s\S]*?)^```/gm)) {
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
  const text = await read('docs/install/omniroute-macos-advanced.md');
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
  const main = await read('docs/install/omniroute.md');
  assert.match(main, /npm install -g omniroute/);
  assert.match(main, /omniroute serve --no-open/);
  assert.match(main, /\$env:OMNIROUTE_SERVER_HOST = "127\.0\.0\.1"/);
  assert.match(main, /export OMNIROUTE_SERVER_HOST=127\.0\.0\.1/);
  assert.doesNotMatch(main, /launchctl bootstrap|python3 - <<|npm ci --prefix/);
  for (const file of ['host', 'omniroute', 'graphify', 'archify', 'workflow-tools']) {
    const doc = await read(`docs/install/${file}.md`);
    assert.match(doc, /macOS/);
    assert.match(doc, /Linux/);
    assert.match(doc, /Windows/);
    assert.match(doc, /```powershell/);
  }
  const guide = await read('docs/install/omniroute-macos-advanced.md');
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

test('launchd service template parses without storing secrets or executing a service', async () => {
  const text = await read('docs/install/omniroute-services.md');
  const xml = text.match(/^```xml\n([\s\S]*?)^```/m)?.[1];
  assert.ok(xml);
  const parsed = spawnSync('python3', ['-c', `
import plistlib, sys
p = plistlib.loads(sys.stdin.buffer.read())
assert p['Label'] == 'local.omniroute'
assert p['RunAtLoad'] is True
assert p['KeepAlive'] == {'SuccessfulExit': False}
assert p['EnvironmentVariables'] == {'HOME': '/Users/UTILIZADOR'}
assert p['Umask'] == 63
assert p['ExitTimeOut'] == 30
assert len(p['ProgramArguments']) == 1
assert p['ProgramArguments'][0].endswith('/omniroute-service/run.sh')
`], { input: xml, encoding: 'utf8', timeout: 5000 });
  assert.equal(parsed.status, 0, parsed.stderr);
  assert.match(text, /não inicia antes do login/i);
  assert.match(text, /launchctl bootstrap/);
  assert.match(text, /launchctl bootout/);
});

test('systemd unit uses foreground global CLI, non-root user and private environment', async () => {
  const text = await read('docs/install/omniroute-services.md');
  const unit = text.match(/^```ini\n([\s\S]*?)^```/m)?.[1];
  assert.ok(unit);
  for (const setting of ['Type=simple', 'User=UTILIZADOR', 'Restart=on-failure', 'RestartSec=10', 'KillMode=control-group', 'NoNewPrivileges=true', 'UMask=0077', 'WantedBy=multi-user.target']) {
    assert.ok(unit.includes(setting), setting);
  }
  assert.match(unit, /^EnvironmentFile=.*\/omniroute-service\/service\.env$/m);
  assert.match(unit, /^ExecStart=\/.*\/node .*\/omniroute\/bin\/omniroute\.mjs serve --port 20128 --no-open --no-tray --no-recovery$/m);
  assert.doesNotMatch(unit, /User=root|STORAGE_ENCRYPTION_KEY=|--daemon|--headless|npm install/);
  assert.match(text, /systemd-analyze verify/);
  assert.match(text, /systemctl enable --now/);
  assert.match(text, /systemctl disable --now/);
  assert.match(text, /journalctl -u omniroute/);
  assert.match(text, /OMNIROUTE_SERVER_HOST=127\.0\.0\.1/);
  assert.match(text, /REQUIRE_API_KEY=true/);
  assert.match(await read('docs/install/omniroute.md'), /omniroute-services\.md/);
});
