import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const integration = resolve(root, 'integrations/security-audit');
const upstream = resolve(integration, 'upstream');
const read = path => readFile(resolve(integration, path), 'utf8');
const json = async path => JSON.parse(await read(path));
const require = createRequire(import.meta.url);

async function files(dir = integration) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    assert.equal(entry.isSymbolicLink(), false, `unexpected symlink: ${path}`);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

function frontmatterName(text) {
  assert.match(text, /^---\n/);
  const match = text.match(/^name: ([a-z0-9-]+)$/m);
  assert.ok(match, 'resource must declare a name');
  return match[1];
}

test('optional manifest selects one adapted skill and three prompts, never the upstream skill', async () => {
  const pkg = await json('package.json');
  assert.equal(pkg.private, true);
  assert.equal(pkg.license, 'MIT');
  assert.deepEqual(pkg.pi.skills, ['./skills/security-audit/SKILL.md']);
  assert.deepEqual(pkg.pi.prompts, [
    './prompts/security-hunter.md', './prompts/security-verifier.md', './prompts/security-coverage-critic.md',
  ]);
  assert.deepEqual(pkg.pi.extensions, []);
  assert.deepEqual(pkg.pi.themes, []);
  for (const key of ['scripts', 'dependencies', 'peerDependencies', 'bin']) {
    assert.equal(Object.hasOwn(pkg, key), false, key);
  }
  for (const path of [...pkg.pi.skills, ...pkg.pi.prompts]) await access(resolve(integration, path));
});

test('base resources remain unchanged and optional skill/prompt names do not collide', async () => {
  const base = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  assert.deepEqual(base.pi.skills, ['./skills/engineering-skills/**/SKILL.md']);
  assert.deepEqual(base.pi.extensions, ['./extensions/ops-orchestrator/index.ts']);
  assert.equal(base.pi.prompts.length, 3);
  assert.equal(JSON.stringify(base.pi).includes('security-audit'), false);
  const optional = await json('package.json');
  const promptNames = [];
  for (const path of base.pi.prompts) promptNames.push(frontmatterName(await readFile(resolve(root, path), 'utf8')));
  for (const path of optional.pi.prompts) promptNames.push(frontmatterName(await read(path)));
  assert.equal(new Set(promptNames).size, promptNames.length);
  assert.equal(frontmatterName(await read('skills/security-audit/SKILL.md')), 'security-audit');
  assert.equal(frontmatterName(await readFile(resolve(root, 'integrations/graphify/skills/graphify/SKILL.md'), 'utf8')), 'graphify');
  assert.equal((await files()).filter(p => p.endsWith('/SKILL.md')).length, 2, 'snapshot skill must remain unregistered');
});

test('all 22 snapshot files match their recorded SHA-256 and provenance', async () => {
  const source = await json('UPSTREAM.json');
  assert.equal(source.repository, 'https://github.com/cloudflare/security-audit-skill');
  assert.equal(source.commit, 'c1c8a8c1471069fb0e188eeaff69b8e8db6564a8');
  assert.equal(source.license, 'MIT');
  const lines = (await read('SHA256SUMS')).trim().split('\n');
  assert.equal(lines.length, 22);
  const recorded = [];
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    assert.ok(match, line);
    const [, hash, path] = match;
    const resolved = resolve(upstream, path);
    assert.ok(!relative(upstream, resolved).startsWith('..'), 'hash path escapes snapshot');
    assert.equal(createHash('sha256').update(await readFile(resolved)).digest('hex'), hash, path);
    recorded.push(path);
  }
  assert.equal(new Set(recorded).size, 22);
  assert.deepEqual((await files(upstream)).map(p => relative(upstream, p)).sort(), recorded.sort());
  assert.equal(await read('LICENSE'), await read('upstream/LICENSE'));
  assert.match(await read('LICENSE'), /Copyright \(c\) 2025-2026 Cloudflare, Inc\./);
});

test('Markdown links resolve within the pack and adapted instructions identify their source', async () => {
  for (const path of (await files()).filter(p => extname(p) === '.md')) {
    const text = await readFile(path, 'utf8');
    for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const resolved = resolve(dirname(path), target.split('#')[0]);
      assert.ok(!relative(root, resolved).startsWith('..'), `link escapes pack: ${target}`);
      await assert.doesNotReject(access(resolved), `${relative(root, path)} -> ${target}`);
    }
    assert.equal((text.match(/^```/gm) ?? []).length % 2, 0, `unclosed fence: ${path}`);
    if (!path.startsWith(`${upstream}/`) && !path.endsWith('/README.md')) {
      assert.match(text, /[Aa]dapted|[Aa]daptation/);
      assert.match(text, /Cloudflare/);
      assert.match(text, /MIT/);
    }
  }
});

test('entrypoint stays small, guidance-first and explicit about sandbox/independence', async () => {
  const skill = await read('skills/security-audit/SKILL.md');
  assert.ok(skill.split('\n').length < 100);
  assert.match(skill, /Default to focused guidance/);
  assert.match(skill, /do not launch agent waves or create reports/);
  assert.match(skill, /OS-enforced sandbox/);
  assert.match(skill, /If any control is unavailable, do not execute/);
  assert.match(skill, /two prompts in one session are not independent verification/);
  assert.match(skill, /give it no severity/);
  assert.match(skill, /scope, source ref, profile, output and invocation budget/);
});

test('role prompts disclose same-session execution and prohibit target-code execution', async () => {
  const pkg = await json('package.json');
  for (const path of pkg.pi.prompts) {
    const text = await read(path);
    assert.match(text, /Task: \$ARGUMENTS/);
    assert.match(text, /same-session prompt/);
    assert.match(text, /not an isolated subagent/);
    assert.match(text, /Do not (?:execute|run|promote)/);
    assert.match(text, /target code/);
  }
  const verifier = await read('prompts/security-verifier.md');
  assert.match(verifier, /self-review, not independent verification/);
  assert.match(verifier, /Do not invent execution evidence/);
});

test('catalogue and notices describe optional MIT integration without changing base count', async () => {
  const catalogue = await readFile(resolve(root, 'skills/engineering-skills/SKILL.md'), 'utf8');
  assert.match(catalogue, /Catalogue of 99 engineering skills/);
  assert.match(catalogue, /\]\(\.\.\/\.\.\/integrations\/security-audit\/skills\/security-audit\/SKILL\.md\)/);
  const notices = await readFile(resolve(root, 'THIRD_PARTY_NOTICES.md'), 'utf8');
  assert.match(notices, /Cloudflare — optional Security Audit/);
  assert.match(notices, /Copyright \(c\) 2025-2026 Cloudflare, Inc\./);
});

test('bundled validators accept empty documents structurally and reject invalid objects', async () => {
  const findings = require(resolve(upstream, 'security-audit/validate-findings.cjs'));
  const ledger = require(resolve(upstream, 'security-audit/validate-coverage-ledger.cjs'));
  const schema = JSON.parse(await read('upstream/security-audit/report-schema.json'));
  assert.deepEqual(findings.validateDocument([], schema), []);
  assert.deepEqual(ledger.validateDocument([]), []);
  assert.ok(findings.validateDocument([{}], schema).length > 0);
  assert.ok(ledger.validateDocument([{}]).length > 0);
  // Passing empty JSON does not establish that an audit ran or that its coverage is complete.
});

test('both validator CLIs run on synthetic files without changing them', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'security-audit-integration-'));
  try {
    const input = resolve(dir, 'synthetic.json');
    await writeFile(input, '[]\n');
    for (const script of ['validate-findings.cjs', 'validate-coverage-ledger.cjs']) {
      const result = spawnSync(process.execPath, [resolve(upstream, 'security-audit', script), input], {
        cwd: dir, env: { HOME: dir, USERPROFILE: dir, TMPDIR: dir },
        encoding: 'utf8', timeout: 10000, maxBuffer: 65536,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /PASS: 0/);
      assert.equal(await readFile(input, 'utf8'), '[]\n');
    }
    assert.deepEqual(await readdir(dir), ['synthetic.json']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
