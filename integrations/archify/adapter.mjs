#!/usr/bin/env node
// Standard-library adapter. The external runtime is trusted code, not an OS sandbox.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PIN = JSON.parse(fs.readFileSync(path.join(here, 'runtime-lock.json'), 'utf8'));
const TYPES = new Set(['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle', 'erd', 'class', 'tree', 'timeline', 'waterfall']);
const KEYS = new Set(['outputRoot', 'candidate', 'output', 'type', 'quality', 'timeoutMs', 'maxBufferBytes', 'offline']);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const hasLoneSurrogate = (value) => [...value].some((char) => char.length === 1 && /[\ud800-\udfff]/u.test(char));
const assert = (ok, message) => { if (!ok) throw new Error(message); };

function absolute(value, name) {
  assert(typeof value === 'string' && path.isAbsolute(value) && !/[\x00-\x1f\x7f]/u.test(value) && !hasLoneSurrogate(value), `${name}: absolute path required`);
  return path.resolve(value);
}

// Reject all symlinks (including in ancestors), not just links pointing outside.
function noLinks(file, kind) {
  const resolved = absolute(file, 'path');
  let current = path.parse(resolved).root;
  for (const part of resolved.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    assert(!fs.lstatSync(current).isSymbolicLink(), `symlink refused: ${current}`);
  }
  const stat = fs.lstatSync(resolved);
  assert(kind === 'directory' ? stat.isDirectory() : stat.isFile() && stat.nlink === 1, `invalid ${kind}: ${file}`);
  return stat;
}

function inside(root, file) {
  const rel = path.relative(root, file);
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

function readBounded(file, maximum) {
  assert(noLinks(file, 'file').size <= maximum, `file too large: ${file}`);
  const bytes = fs.readFileSync(file);
  assert(bytes.length <= maximum, `file too large: ${file}`);
  return bytes;
}

function missing(file) {
  try { fs.lstatSync(file); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  throw new Error(`destination already exists; choose a fresh run directory: ${file}`);
}

export function loadConfig(file) {
  return JSON.parse(readBounded(absolute(file, 'config'), 16 * 1024).toString('utf8'));
}

// lock injection is an in-process test seam; the command-line interface always uses PIN.
export function prepare(config, { runtimeDir = process.env.DEVOPS_ARCHIFY_DIR, lock = PIN } = {}) {
  assert(config && typeof config === 'object' && !Array.isArray(config), 'configuration must be an object');
  for (const key of Object.keys(config)) assert(KEYS.has(key), `unknown configuration key: ${key}`);
  assert(config.offline === undefined || config.offline === true, 'only offline=true is supported');
  assert(TYPES.has(config.type), 'unsupported native diagram type');
  const quality = config.quality ?? 'showcase';
  assert(['showcase', 'standard'].includes(quality), 'unsupported quality');
  const timeoutMs = config.timeoutMs ?? 30000;
  const maxBufferBytes = config.maxBufferBytes ?? 1024 * 1024;
  assert(Number.isInteger(timeoutMs) && timeoutMs >= 50 && timeoutMs <= 120000, 'timeoutMs must be 50..120000');
  assert(Number.isInteger(maxBufferBytes) && maxBufferBytes >= 1024 && maxBufferBytes <= 4 * 1024 * 1024, 'maxBufferBytes must be 1024..4194304');
  const root = absolute(config.outputRoot, 'outputRoot');
  noLinks(root, 'directory');
  const candidate = absolute(config.candidate, 'candidate');
  assert(inside(root, candidate) && candidate.endsWith('.json'), 'candidate must be a JSON file inside outputRoot');
  const candidateBytes = readBounded(candidate, 1024 * 1024);
  const data = JSON.parse(candidateBytes.toString('utf8'));
  assert(data && data.diagram_type === config.type, 'candidate diagram_type must match type');
  assert(typeof config.output === 'string', 'output must be run-directory/file.html');
  const segments = config.output.split('/');
  assert(segments.length === 2 && segments.every((s) => s && s !== '.' && s !== '..' && !/[\\:\x00-\x1f\x7f<>"|?*]/u.test(s) && !/[. ]$/u.test(s) && !hasLoneSurrogate(s) && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(s) && Buffer.byteLength(s) <= 100), 'output must be a fresh run-directory/file.html');
  assert(segments[1].endsWith('.html') && segments[1] !== '.html', 'output must end in .html');
  const job = path.join(root, segments[0]);
  const output = path.join(job, segments[1]);
  assert(inside(root, output), 'output escapes outputRoot');
  missing(job);
  assert(data.meta?.output === config.output, 'candidate meta.output must equal configured output');
  assert(data.meta?.quality_profile === quality, 'candidate quality_profile must equal quality');
  // No third-party logos, embedded markup, or external resource URLs in this profile.
  // This is a conservative authoring guard, not a general HTML sanitizer.
  const inspect = (value) => {
    if (typeof value === 'string') assert(!/[<>]|(?:https?:|file:|data:|javascript:|\/\/)/iu.test(value), 'candidate markup/URL refused by generic-only profile');
    if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
      assert(!/^(brand|logo|src|href|html|script|font)$/iu.test(key), `candidate field refused: ${key}`);
      inspect(child);
    }
  };
  inspect(data);
  const runtime = absolute(runtimeDir, 'DEVOPS_ARCHIFY_DIR');
  noLinks(runtime, 'directory');
  const manifest = JSON.parse(readBounded(path.join(runtime, 'package.json'), 64 * 1024));
  assert(manifest.name === 'archify' && manifest.version === '3.2.0', 'runtime must be archify 3.2.0');
  for (const [relative, expected] of Object.entries(lock)) {
    const file = path.resolve(runtime, relative);
    assert(inside(runtime, file), 'invalid runtime lock path');
    assert(hash(readBounded(file, 24 * 1024 * 1024)) === expected, `runtime pin mismatch: ${relative}`);
  }
  const cli = path.join(runtime, 'bin', 'archify.mjs');
  noLinks(cli, 'file');
  const snapshot = path.join(job, 'candidate.json');
  const commands = [
    [cli, 'deliver', config.type, snapshot, output, '--quality', quality, '--json'],
    [cli, 'check', output, '--require-provenance', '--json'],
  ];
  return { root, job, output, snapshot, candidate, candidateBytes, runtime, timeoutMs, maxBufferBytes, commands, type: config.type };
}

export function describe(plan) {
  return {
    mode: 'plan', runtime: plan.runtime, runtimeVersion: '3.2.0',
    output: plan.output, candidate: plan.candidate, candidateSha256: hash(plan.candidateBytes),
    cwd: plan.root, executable: process.execPath, arguments: plan.commands,
    environment: { ARCHIFY_UPDATE_CHECK_DISABLED: '1' },
    timeoutMsPerProcess: plan.timeoutMs, maxBufferBytes: plan.maxBufferBytes,
    offlineScope: 'update checks disabled; not an OS/network sandbox',
    browser: 'not requested', writes: [plan.job],
  };
}

function invoke(args, plan) {
  // Do not inherit NODE_OPTIONS, browser hooks, proxy variables, or runtime overrides.
  const env = { ARCHIFY_UPDATE_CHECK_DISABLED: '1', TMPDIR: plan.job, TMP: plan.job, TEMP: plan.job };
  for (const key of ['PATH', 'SystemRoot', 'WINDIR']) if (process.env[key]) env[key] = process.env[key];
  return new Promise((resolve) => {
    execFile(process.execPath, args, {
      cwd: plan.root, env, shell: false, windowsHide: true,
      timeout: plan.timeoutMs, maxBuffer: plan.maxBufferBytes, killSignal: 'SIGKILL', encoding: 'utf8',
    }, (error, stdout, stderr) => resolve({
      arguments: args, exitCode: error ? (Number.isInteger(error.code) ? error.code : null) : 0,
      error: error ? { code: error.code ?? null, signal: error.signal ?? null, killed: Boolean(error.killed), message: error.message.slice(0, 2000) } : null,
      stdout, stderr,
    }));
  });
}

export async function execute(config, options) {
  const plan = prepare(config, options);
  // Exclusive creation reserves a fresh run. Never reuse or clean a failed run automatically.
  noLinks(plan.root, 'directory');
  fs.mkdirSync(plan.job, { mode: 0o700 });
  const receiptPath = path.join(plan.job, 'adapter-receipt.json');
  const receipt = { ...describe(plan), schemaVersion: 1, ok: false, mode: 'execute', startedAt: new Date().toISOString(), stages: [], browserEvidence: 'not-run', perceptualReview: 'not-run' };
  let delivered;
  try {
    fs.writeFileSync(plan.snapshot, plan.candidateBytes, { flag: 'wx', mode: 0o600 });
    for (const args of plan.commands) {
      noLinks(plan.job, 'directory');
      const stage = await invoke(args, plan);
      receipt.stages.push(stage);
      assert(!stage.error, `${args[1]} failed: ${stage.error?.message}`);
      const result = JSON.parse(stage.stdout);
      assert(result.ok === true, `${args[1]} did not return a passing receipt`);
      if (args[1] === 'deliver') {
        assert(result.schemaVersion === 1 && typeof result.receiptId === 'string' && result.receiptId.length > 0, 'invalid delivery receipt identity');
        assert(result.command === 'deliver' && result.input === plan.snapshot && result.output === plan.output && result.type === plan.type, 'delivery receipt paths/type mismatch');
        assert(result.specification?.sha256 === hash(plan.candidateBytes) && result.specification?.bytes === plan.candidateBytes.length, 'delivery candidate hash mismatch');
        assert(result.update?.reason === 'disabled' && result.update?.noticeRequired === false, 'update-check suppression not confirmed');
        const artifact = readBounded(plan.output, 24 * 1024 * 1024);
        assert(result.artifact?.sha256 === hash(artifact) && result.artifact?.bytes === artifact.length, 'delivery artifact hash mismatch');
        delivered = result;
      } else {
        assert(result.provenance === 'current' && result.deliveryReceiptId === delivered.receiptId, 'check did not confirm bound current provenance');
        const artifact = readBounded(plan.output, 24 * 1024 * 1024);
        assert(result.artifact?.sha256 === hash(artifact) && result.artifact?.bytes === artifact.length, 'check artifact hash mismatch');
      }
    }
    const sidecar = plan.output.slice(0, -5) + '.delivery.json';
    const provenance = JSON.parse(readBounded(sidecar, 4 * 1024 * 1024));
    assert(provenance.schemaVersion === 1 && provenance.status === 'current' && provenance.command === 'deliver' && provenance.output === plan.output && provenance.input === plan.snapshot && provenance.type === plan.type && provenance.receiptId === delivered.receiptId, 'missing/current delivery provenance required');
    assert(provenance.specification?.sha256 === delivered.specification.sha256 && provenance.specification?.bytes === delivered.specification.bytes && provenance.artifact?.sha256 === delivered.artifact.sha256 && provenance.artifact?.bytes === delivered.artifact.bytes, 'sidecar identity mismatch');
    receipt.deliveryReceipt = sidecar;
    receipt.artifactSha256 = hash(readBounded(plan.output, 24 * 1024 * 1024));
    receipt.ok = true;
  } catch (error) {
    receipt.failure = error.message;
  }
  receipt.finishedAt = new Date().toISOString();
  noLinks(plan.job, 'directory');
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return { ...receipt, receiptPath };
}

async function main() {
  const [mode, configPath, ...rest] = process.argv.slice(2);
  assert(['plan', 'dry-run', 'execute'].includes(mode) && configPath && rest.length === 0, 'Usage: node adapter.mjs plan|dry-run|execute /absolute/config.json');
  const config = loadConfig(configPath);
  const result = mode === 'execute' ? await execute(config) : describe(prepare(config));
  console.log(JSON.stringify(result, null, 2));
  if (mode === 'execute' && !result.ok) process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(JSON.stringify({ ok: false, error: error.message })); process.exitCode = 1; });
}
