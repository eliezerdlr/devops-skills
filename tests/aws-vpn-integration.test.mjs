import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { root, assertUnifiedManifest, registeredSkillFiles } from './package-contract.mjs';

const aws = resolve(root, 'integrations/aws-toolkit');
const vpn = resolve(root, 'skills/engineering-skills/homelab-wireguard-vpn');
const read = p => readFile(p, 'utf8');
const json = async p => JSON.parse(await read(p));
const sha = data => createHash('sha256').update(data).digest('hex');
const names = ['aws-billing-and-cost-management', 'aws-site-to-site-vpn', 'aws-well-architected-review'];
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false, 'no external symlinks');
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

// Static instruction contracts only. These tests do not establish policy enforcement,
// AWS permissions, secret isolation, network connectivity or operational VPN correctness.
test('four selected instruction skills are registered once without new runtime behavior', async () => {
  const pkg = await assertUnifiedManifest();
  const registered = await registeredSkillFiles();
  for (const name of names) {
    assert.equal(registered.filter(p => p === resolve(aws, `skills/${name}/SKILL.md`)).length, 1);
  }
  assert.equal(registered.filter(p => p === resolve(vpn, 'SKILL.md')).length, 1);
  const component = await json(resolve(aws, 'package.json'));
  assert.deepEqual(component.pi.extensions, []);
  assert.deepEqual(component.pi.prompts, []);
  for (const key of ['dependencies', 'optionalDependencies', 'scripts']) assert.equal(Object.hasOwn(component, key), false);
  assert.equal(Object.hasOwn(pkg, 'dependencies'), false);
  assert.equal(Object.hasOwn(pkg.scripts, 'postinstall'), false);
});

test('AWS provenance preserves reviewed commit and verbatim license/NOTICE hashes', async () => {
  const meta = await json(resolve(aws, 'UPSTREAM.json'));
  assert.equal(meta.repository, 'https://github.com/aws/agent-toolkit-for-aws');
  assert.equal(meta.commit, '9ab50636d12510dc351ff02fd7966efa4dba4341');
  assert.equal(meta.license, 'Apache-2.0');
  assert.deepEqual(meta.registered_skills, names);
  for (const name of ['LICENSE', 'NOTICE']) {
    assert.equal(sha(await readFile(resolve(aws, name))), meta.source_sha256[name]);
  }
  assert.match(await read(resolve(aws, 'NOTICE')), /Copyright Amazon.com/);
  assert.match(await read(resolve(aws, 'LICENSE')), /Apache License/);
  assert.ok(Object.keys(meta.source_sha256).some(p => p.includes('sitetositevpn/SKILL.md')));
  assert.ok(meta.modifications.length >= 3);
});

test('WireGuard retains ECC MIT attribution and pinned source identity', async () => {
  const meta = await json(resolve(vpn, 'UPSTREAM.json'));
  assert.equal(meta.commit, '90606c8315ee09cafc303515c5f33024db6b9882');
  assert.equal(meta.source_path, 'skills/homelab-wireguard-vpn/SKILL.md');
  assert.match(meta.source_sha256, /^[a-f0-9]{64}$/);
  assert.match(await read(resolve(vpn, 'LICENSE')), /Copyright \(c\) 2026 Affaan Mustafa/);
  assert.equal(sha(await readFile(resolve(vpn, 'LICENSE'))), sha(await readFile(resolve(root, 'licenses/ecc-MIT.txt'))));
});

test('distributed AWS and WireGuard content has complete local integrity records', async () => {
  for (const dir of [aws, vpn]) {
    const manifest = await read(resolve(dir, 'SHA256SUMS'));
    const actual = (await files(dir)).filter(p => p !== resolve(dir, 'SHA256SUMS')).sort();
    const expected = [];
    for (const line of manifest.trim().split('\n')) {
      const match = line.match(/^([a-f0-9]{64})  ([^\r\n]+)$/);
      assert.ok(match);
      assert.ok(!match[2].startsWith('/') && !match[2].split('/').includes('..'));
      const path = resolve(dir, match[2]);
      expected.push(path);
      assert.equal(sha(await readFile(path)), match[1], match[2]);
    }
    assert.equal(new Set(expected).size, expected.length);
    assert.deepEqual(expected.sort(), actual);
  }
});

test('new instruction resources are document-only, bounded, and have valid local links', async () => {
  for (const dir of [aws, vpn]) {
    for (const path of await files(dir)) {
      assert.ok(/\.(?:md|json)$|\/(?:LICENSE|NOTICE|SHA256SUMS)$/.test(path), path);
      if (!path.endsWith('.md')) continue;
      const content = await read(path);
      assert.ok(Buffer.byteLength(content) < 20000, 'bounded instruction document');
      for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const link = match[1];
        if (/^https:\/\//.test(link) || link.startsWith('#')) continue;
        assert.ok(!/^[a-z]+:/i.test(link), link);
        await access(resolve(dirname(path), link.split('#')[0]));
      }
    }
  }
});

test('WireGuard instructions address identified secret, firewall, IPv6 and recovery gaps', async () => {
  const text = await read(resolve(vpn, 'SKILL.md'));
  for (const phrase of ['0700', '0600', 'exclusive creation', 'symlinks', 'CGNAT', 'IPv6', 'INPUT', 'FORWARD', 'source VPN subnet', 'revok', 'rollback', 'explicit approval']) {
    assert.ok(text.includes(phrase), phrase);
  }
  assert.match(text, /not a server firewall ACL/);
  assert.match(text, /old handshake can mean an idle peer/);
  assert.doesNotMatch(text, /sudo (?:tee|iptables|apt)|wg genkey \||subprocess\.run|curl --/);
  assert.match(await read(resolve(vpn, 'references/deployment-checklist.md')), /saved.*live|live interface/);
});

test('AWS skills distinguish operational requirements, costs, unknowns and approval', async () => {
  const billing = await read(resolve(aws, `skills/${names[0]}/SKILL.md`));
  const site = await read(resolve(aws, `skills/${names[1]}/SKILL.md`));
  const review = await read(resolve(aws, `skills/${names[2]}/SKILL.md`));
  assert.match(billing, /End date is exclusive/);
  assert.match(billing, /queries can cost money/);
  assert.match(billing, /Analysis approval never authorizes a purchase/);
  assert.match(site, /not proof of end-to-end application access/);
  assert.match(site, /Do not output the API's full sample response/);
  assert.match(site, /--query/);
  assert.match(review, /Cannot Determine/);
  assert.match(review, /never claim full coverage/);
  assert.match(review, /Do not install MCP/);
  for (const text of [billing, site, review]) {
    assert.match(text, /Adapted from AWS Agent Toolkit/);
    assert.match(text, /Apache-2\.0/);
    assert.doesNotMatch(text, /uvx .*@latest|pip install|brew install|sleep 900/);
  }
});

test('dependency documentation states reading versus actual AWS and VPN operations', async () => {
  const doc = await read(resolve(root, 'docs/DEPENDENCIES.md'));
  assert.match(doc, /Reading these Markdown skills requires no new external dependency/);
  assert.match(doc, /Actual AWS queries require existing approved/);
  assert.match(doc, /Actual WireGuard deployment needs supported/);
  const notices = await read(resolve(root, 'THIRD_PARTY_NOTICES.md'));
  assert.match(notices, /AWS — selected Agent Toolkit instructions/);
  assert.match(notices, /ninth skill is explicitly adapted/);
});
