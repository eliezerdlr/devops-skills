import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { root, assertUnifiedManifest, specialistCount, skillResourceCount } from './package-contract.mjs';
import { INSTRUCTIONS, MODE_ENTRY, SECTION_KEY, legacyPrompt, parseModeCommand, restoreMode } from '../extensions/ponytail/policy.mjs';

const read = p => readFile(resolve(root, p), 'utf8');
const entry = mode => ({ type: 'custom', customType: MODE_ENTRY, data: { version: 1, mode } });

test('Ponytail defaults full with no session state', () => {
  for (const value of [undefined, null, [], {}, 'off']) assert.equal(restoreMode(value), 'full');
});
test('latest valid branch mode wins without accepting unrelated/malformed records', () => {
  assert.equal(restoreMode([entry('full'), entry('off')]), 'off');
  assert.equal(restoreMode([entry('off'), entry('full')]), 'full');
  assert.equal(restoreMode([entry('off'), entry('ultra'), { type: 'custom', customType: MODE_ENTRY, data: { version: 2, mode: 'full' } }, { type: 'custom', customType: 'other', data: { version: 1, mode: 'full' } }]), 'off');
  assert.equal(restoreMode([{ type: 'message', data: { mode: 'off' } }]), 'full');
});
test('commands accept only full/on/off/status and never implicit global configuration', () => {
  for (const text of ['', 'status', ' STATUS ']) assert.equal(parseModeCommand(text), 'status');
  for (const text of ['on', 'full', ' FULL ']) assert.equal(parseModeCommand(text), 'full');
  assert.equal(parseModeCommand('off'), 'off');
  for (const text of ['ultra', 'default off', 'off now', 'band', 'status extra', 'off; anything']) assert.equal(parseModeCommand(text), null);
});
test('legacy composition preserves the base and adds exactly one stable suffix', () => {
  const once = legacyPrompt('KEEP BASE', 'full');
  assert.ok(once.startsWith('KEEP BASE\n\n'));
  assert.equal(once.split(INSTRUCTIONS).length, 2);
  assert.equal(legacyPrompt(once, 'full'), once);
  assert.equal(legacyPrompt(once, 'off'), 'KEEP BASE');
  assert.equal(legacyPrompt('KEEP BASE', 'off'), 'KEEP BASE');
  assert.ok(!legacyPrompt(undefined, 'full').includes('undefined'));
});
test('legacy removal never deletes a non-owned or non-trailing prompt portion', () => {
  const input = `KEEP ${INSTRUCTIONS} OTHER POLICY`;
  assert.equal(legacyPrompt(input, 'off'), input);
});
test('fixed policy preserves safety, testing and SLA boundaries without claiming savings', () => {
  assert.ok(Buffer.byteLength(INSTRUCTIONS) < 3000);
  for (const term of ['approval gates', 'security', 'accessibility', 'rollback', 'recovery', 'SLA', 'without measurement', 'Never skip relevant tests', 'Do not truncate required audit', 'Do not add speculative', 'Fewer lines is not proof']) assert.ok(INSTRUCTIONS.includes(term), term);
  assert.equal(SECTION_KEY, 'devops_ponytail');
});
test('root adds one extension, no skill count change or dependency installation', async () => {
  const pkg = await assertUnifiedManifest();
  assert.equal(pkg.pi.extensions.length, 3);
  assert.equal(pkg.pi.extensions.at(-1), './extensions/ponytail/index.ts');
  assert.equal(specialistCount, 119); assert.equal(skillResourceCount, 120);
  assert.equal(Object.hasOwn(pkg, 'dependencies'), false);
  assert.equal(Object.hasOwn(pkg.scripts, 'postinstall'), false);
  assert.ok(pkg.scripts.test.includes('ponytail.test.mjs'));
  assert.ok(pkg.scripts['test:pi'].includes('ponytail-pi.test.mjs'));
  const workflow = await read('.github/workflows/test-orchestration.yml');
  for (const name of ['pi-coding-agent', 'pi-agent-core', 'pi-ai']) assert.ok(workflow.includes(`@earendil-works/${name}@1.4.0`));
  assert.match(workflow, /--ignore-scripts/);
});
test('adapter registers no model tools, collectors, providers, processes or external IO', async () => {
  const source = await read('extensions/ponytail/index.ts');
  assert.doesNotMatch(source, /node:|readFile|writeFile|process\.|fetch\(|setInterval|setTimeout|registerTool|sendUserMessage|sendMessage|streamSimple|registerProvider|registerMcpServer/);
  assert.match(source, /pi\.appendEntry\(MODE_ENTRY, \{ version: 1, mode: requested \}\)/);
  assert.match(source, /getBranch\(\)/);
  assert.match(source, /sections\[SECTION_KEY\]/);
});
test('MIT source attribution and reviewed snapshot are preserved', async () => {
  const meta = JSON.parse(await read('integrations/ponytail/UPSTREAM.json'));
  assert.equal(meta.commit, '09c434ab73ca43761c5d8b0c5d341926c2fba710');
  assert.equal(meta.source_version, '5.3.2');
  assert.equal(meta.license, 'MIT');
  assert.equal(meta.repository, 'https://github.com/DietrichGebert/ponytail');
  assert.equal(createHash('sha256').update(await readFile(resolve(root, 'integrations/ponytail/LICENSE'))).digest('hex'), meta.source_sha256.LICENSE);
  assert.match(await read('integrations/ponytail/LICENSE'), /Copyright \(c\) 2026 DietrichGebert/);
});
test('root-relative integrity inventory covers only the approved runtime and attribution', async () => {
  const expected = ['extensions/ponytail/index.ts', 'extensions/ponytail/policy.mjs', 'integrations/ponytail/LICENSE', 'integrations/ponytail/README.md', 'integrations/ponytail/UPSTREAM.json'];
  const found = [];
  for (const row of (await read('integrations/ponytail/SHA256SUMS')).trim().split('\n')) {
    const [, hash, path] = row.match(/^([a-f0-9]{64})  (.+)$/) ?? [];
    assert.ok(expected.includes(path)); found.push(path);
    assert.equal(createHash('sha256').update(await readFile(resolve(root, path))).digest('hex'), hash, path);
  }
  assert.deepEqual(found.sort(), expected.sort());
});
test('documentation discloses default-on scope, opt-out and non-measured performance', async () => {
  const text = await read('integrations/ponytail/README.md');
  for (const term of ['default to **full**', '/ponytail off', 'native Pi session metadata', 'No global default', 'not every process', 'No prompt cache hit rate', 'No upstream hooks', 'require a separately approved']) assert.ok(text.includes(term), term);
  assert.match(await read('THIRD_PARTY_NOTICES.md'), /Ponytail — minimal default-full Pi guidance/);
});
