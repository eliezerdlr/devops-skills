import { openSync, readFileSync, fstatSync, closeSync, constants } from 'node:fs';
import { isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';

export const PROVIDER = 'devops-resilience';
export const TRANSPORT = 'devops-resilience-transport';
const fail = () => { throw new Error('Routing policy rejected; see the policy reference. No configuration was changed.'); };
const object = x => x && typeof x === 'object' && !Array.isArray(x);
function keys(x, allowed) { if (!object(x) || Object.keys(x).some(k => !allowed.includes(k))) fail(); }
function integer(n, lo, hi) { if (!Number.isInteger(n) || n < lo || n > hi) fail(); return n; }
function price(n) { if (!Number.isFinite(n) || n < 0 || n > 1000) fail(); return n; }
function identifier(s) { if (typeof s !== 'string' || !/^[A-Za-z0-9_.:/+-]{1,160}$/.test(s) || /REPLACE_|EXAMPLE_/i.test(s)) fail(); return s; }
export function approvedOrigin(value) {
  let u; try { u = new URL(value); } catch { fail(); }
  if (u.username || u.password || u.search || u.hash || u.pathname !== '/' ||
      !['https:', 'http:'].includes(u.protocol) ||
      (u.protocol === 'http:' && !['127.0.0.1', '[::1]'].includes(u.hostname))) fail();
  return u.origin;
}
function freeze(x) { if (object(x) || Array.isArray(x)) { Object.values(x).forEach(freeze); Object.freeze(x); } return x; }
export function validatePolicy(input) {
  keys(input, ['version', 'allowMetered', 'maxInputUsdPerMillion', 'maxOutputUsdPerMillion', 'maxAttempts', 'deadlineMs', 'attemptTimeoutMs', 'contextWindow', 'maxOutputTokens', 'maxInputBytes', 'routes']);
  if (input.version !== 1 || typeof input.allowMetered !== 'boolean') fail();
  const p = structuredClone(input);
  integer(p.contextWindow, 8192, 2000000);
  integer(p.maxOutputTokens, 256, Math.min(32768, Math.floor(p.contextWindow / 2)));
  integer(p.maxInputBytes, 1, p.contextWindow - p.maxOutputTokens - 1024);
  integer(p.deadlineMs, 1000, 120000); integer(p.attemptTimeoutMs, 1000, p.deadlineMs);
  if (!Array.isArray(p.routes) || p.routes.length < 1 || p.routes.length > 6) fail();
  integer(p.maxAttempts, 1, Math.min(4, p.routes.length));
  price(p.maxInputUsdPerMillion); price(p.maxOutputUsdPerMillion);
  const seen = new Set();
  for (const r of p.routes) {
    keys(r, ['provider', 'model', 'origin', 'billing', 'supportsTools', 'gatewayPolicyApproved']);
    identifier(r.provider); identifier(r.model);
    if ([PROVIDER, TRANSPORT].includes(r.provider) || !['subscription', 'metered'].includes(r.billing) || typeof r.supportsTools !== 'boolean' ||
        (r.gatewayPolicyApproved !== undefined && typeof r.gatewayPolicyApproved !== 'boolean')) fail();
    r.origin = approvedOrigin(r.origin);
    const id = `${r.provider}/${r.model}`; if (seen.has(id)) fail(); seen.add(id);
    if (r.provider === 'omniroute' && r.gatewayPolicyApproved !== true) fail();
  }
  const canonical = {
    version: 1, allowMetered: p.allowMetered, maxInputUsdPerMillion: p.maxInputUsdPerMillion,
    maxOutputUsdPerMillion: p.maxOutputUsdPerMillion, maxAttempts: p.maxAttempts,
    deadlineMs: p.deadlineMs, attemptTimeoutMs: p.attemptTimeoutMs, contextWindow: p.contextWindow,
    maxOutputTokens: p.maxOutputTokens, maxInputBytes: p.maxInputBytes,
    routes: p.routes.map(r => ({ provider: r.provider, model: r.model, origin: r.origin, billing: r.billing, supportsTools: r.supportsTools, gatewayPolicyApproved: r.gatewayPolicyApproved === true })),
  };
  const hash = createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
  return freeze({ ...canonical, hash, id: `fallback-${hash.slice(0, 16)}` });
}
export function loadPolicy(path = process.env.DEVOPS_MODEL_POLICY) {
  if (!path) return undefined;
  if (!isAbsolute(path)) fail();
  let fd;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > 65536) fail();
    return validatePolicy(JSON.parse(readFileSync(fd, 'utf8')));
  } catch { fail(); } finally { if (fd !== undefined) closeSync(fd); }
}
export function routingApproval(model, path = process.env.DEVOPS_MODEL_POLICY) {
  if (![PROVIDER, TRANSPORT].includes(model?.provider)) return undefined;
  const p = loadPolicy(path);
  if (!p || model.id !== p.id) throw new Error('Routing policy changed or missing. Reload Pi and select the current routing model before approval.');
  return {
    policyHash: p.hash, model: `${model.provider}/${model.id}`, maxAttempts: p.maxAttempts,
    routes: p.routes.map(r => ({ provider: r.provider, model: r.model, origin: r.origin, billing: r.billing })),
    allowMetered: p.allowMetered, maxInputUsdPerMillion: p.maxInputUsdPerMillion, maxOutputUsdPerMillion: p.maxOutputUsdPerMillion,
  };
}
export function describeApproval(a) {
  if (!a) return '';
  return `\nRouting policy: ${a.policyHash}\nApproved recipients (in order):\n${a.routes.map(r => `- ${r.provider}/${r.model} @ ${r.origin} (${r.billing})`).join('\n')}\nUp to ${a.maxAttempts} logical upstream attempts per worker request; provider-internal retries may still apply. Metered fallback: ${a.allowMetered ? 'allowed' : 'blocked'}. Catalog price ceilings: input $${a.maxInputUsdPerMillion}/M, output $${a.maxOutputUsdPerMillion}/M. These are estimates, not a billing hard cap; gateway-internal routing must be approved separately.\n`;
}
