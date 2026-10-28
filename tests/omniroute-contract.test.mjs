import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const json = async path => JSON.parse(await read(path));
const base = 'integrations/omniroute/';

test('root declares external OmniRoute contract without installing the server', async () => {
  const pkg = await json('package.json');
  assert.deepEqual(pkg.devopsSkills.operationalDependencies, [`./${base}operational-dependency.json`]);
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    assert.equal(Object.hasOwn(pkg[section] ?? {}, 'omniroute'), false);
  }
  for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
    assert.equal(Object.hasOwn(pkg.scripts, hook), false);
  }
  assert.ok(pkg.scripts.test.includes('tests/omniroute-contract.test.mjs'));
});

test('selected profile owns fallback in gateway without making it a skill-load requirement', async () => {
  const contract = await json(`${base}operational-dependency.json`);
  assert.equal(contract.schemaVersion, 1);
  assert.equal(contract.kind, 'external-service');
  assert.equal(contract.selectedProfile, 'gateway-managed');
  assert.equal(contract.requiredForSelectedProfile, true);
  assert.equal(contract.requiredToLoadSkills, false);
  assert.equal(contract.installationOwner, 'operator');
  assert.equal(contract.automaticInstallation, false);
  assert.equal(contract.automaticStartup, false);
  assert.equal(contract.fallbackOwner, 'gateway');
  assert.equal(contract.piVirtualRouterEnabled, false);
  assert.equal(contract.dashboardRequired, true);
  assert.match(contract.enforcement, /not a service manager or runtime policy guard/);
  assert.equal(contract.runbook, './README.md');
  assert.ok((await read(`${base}${contract.runbook.slice(2)}`)).length > 0);
});

test('source provenance cannot be confused with an installed or homologated artifact', async () => {
  const contract = await json(`${base}operational-dependency.json`);
  const source = await json(`${base}${contract.reference.provenance.slice(2)}`);
  assert.equal(contract.reference.sourceVersion, source.version);
  assert.equal(contract.reference.sourceCommit, source.commit);
  assert.match(contract.reference.sourceCommit, /^[a-f0-9]{40}$/);
  assert.equal(contract.reference.status, 'analyzed-candidate-not-runtime-validated');
  assert.equal(contract.deployment.status, 'pending-operator-installation-and-validation');
  // Deliberately unknown until operator evidence is reviewed; no runtime probe here.
  assert.equal(contract.deployment.installedVersion, null);
  assert.equal(contract.deployment.artifactDigest, null);
  assert.equal(contract.deployment.validatedRuntimeVersion, null);
});

test('non-secret service example retains dashboard and does not blanket-disable refresh', async () => {
  const env = await read(`${base}examples/service.env.example`);
  const settings = Object.fromEntries(env.split('\n').filter(line => /^[A-Z_]+=/.test(line)).map(line => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
  assert.deepEqual(settings, {
    OMNIROUTE_SERVER_HOST: '127.0.0.1',
    OMNIROUTE_HEADLESS: '0',
    REQUIRE_API_KEY: 'true',
  });
  assert.match(env, /STORAGE_ENCRYPTION_KEY/);
  assert.match(env, /does NOT disable cloud sync/);
});

test('client example is a physical gateway provider using an environment key reference', async () => {
  const contract = await json(`${base}operational-dependency.json`);
  const fragment = await json(`${base}examples/models.fragment.example.json`);
  assert.deepEqual(Object.keys(fragment.providers), [contract.client.provider]);
  const provider = fragment.providers[contract.client.provider];
  assert.equal(provider.baseUrl, contract.client.exampleBaseUrl);
  assert.equal(provider.apiKey, `$${contract.client.inferenceKeyEnvironment}`);
  assert.equal(provider.api, 'openai-completions');
  assert.ok(provider.models.every(model => model.id.startsWith('REPLACE_')));
});

test('operator-facing entrypoints link the same deployment decision', async () => {
  for (const path of ['README.md', 'README.en.md', 'docs/DEPENDENCIES.md', 'docs/UNIFIED-PACKAGE.md', `${base}README.md`, `${base}skills/model-resilience/SKILL.md`]) {
    const text = await read(path);
    assert.match(text, /operational-dependency\.json/, path);
  }
  const runbook = await read(`${base}README.md`);
  assert.match(runbook, /DEVOPS_MODEL_POLICY/);
  assert.match(runbook, /Routing disabled/);
  assert.match(runbook, /rollback/i);
  assert.match(runbook, /não comprova inferência autenticada/);
});
