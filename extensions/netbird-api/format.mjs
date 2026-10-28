import { LIMITS, WRITE_FIELDS, canonical } from './schema.mjs';

const ROOT_FIELDS = {
  peers: ['id', 'name', 'ip', 'ipv6', 'connected', 'status', 'hostname', 'os', 'version', 'groups', 'ssh_enabled', 'login_expiration_enabled', 'inactivity_expiration_enabled', 'approval_required', 'last_seen'],
  groups: ['id', 'name', 'peers', 'resources', 'peers_count', 'resources_count'],
  policies: ['id', 'name', 'description', 'enabled', 'rules', 'source_posture_checks'],
  networks: ['id', 'name', 'description', 'resources_count', 'routers_count', 'routing_peers'],
  resources: ['id', 'name', 'description', 'address', 'enabled', 'type', 'groups', 'network_id'],
  routers: ['id', 'peer', 'peer_groups', 'metric', 'masquerade', 'enabled', 'network_id'],
};
const NESTED_FIELDS = new Set([...Object.values(ROOT_FIELDS).flat(), 'action', 'bidirectional', 'protocol', 'sources', 'destinations', 'ports', 'port_ranges', 'start', 'end', 'sourceResource', 'destinationResource', 'authorized_groups']);
export function redact(text, token, preserveFormatting = false) {
  let value = String(text);
  if (token) for (const pattern of new Set([token, encodeURIComponent(token), Buffer.from(token).toString('base64')])) value = value.split(pattern).join('[REDACTED]');
  return value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu, c => preserveFormatting && ['\n', '\r', '\t'].includes(c) ? c : '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}
export function projection(resource, raw, token) {
  let truncated = false, budget = 4000;
  function clean(value, depth = 0, key = '') {
    if (--budget < 0 || depth > 8) { truncated = true;return '[truncated]'; }
    if (value === null || typeof value === 'boolean' || typeof value === 'number') return value;
    if (typeof value === 'string') {
      const safe = redact(value, token);if (safe.length > 1024) { truncated = true;return safe.slice(0, 1024) + '[truncated]'; }return safe;
    }
    if (Array.isArray(value)) { if (value.length > 100) truncated = true;return value.slice(0, 100).map(v => clean(v, depth + 1)); }
    if (!value || typeof value !== 'object') return null;
    const out = Object.create(null);
    for (const [name, item] of Object.entries(value)) {
      if (key === 'authorized_groups') {
        if (/^[A-Za-z0-9_-]{1,128}$/.test(name) && !['__proto__', 'constructor', 'prototype'].includes(name)) out[redact(name, token)] = clean(item, depth + 1);
      } else if (NESTED_FIELDS.has(name)) out[name] = clean(item, depth + 1, name);
    }
    return out;
  }
  const one = item => {
    const out = Object.create(null);
    for (const key of ROOT_FIELDS[resource] ?? []) if (Object.hasOwn(item, key)) out[key] = clean(item[key], 0, key);
    return out;
  };
  const list = Array.isArray(raw);
  let data = list ? raw.slice(0, LIMITS.items).map(one) : one(raw);
  if (list && raw.length > LIMITS.items) truncated = true;
  while (Buffer.byteLength(JSON.stringify(data)) > 40000) {
    truncated = true;
    if (Array.isArray(data) && data.length) data.pop();
    else { data = null;break; }
  }
  return { data, selectedFields: true, untrustedData: true, truncated, ...(list ? { receivedCount: raw.length, returnedCount: data.length } : {}) };
}

function ids(value) {
  return (value ?? []).map(item => typeof item === 'string' ? item : item?.id).sort();
}
function assoc(value) {
  return value === undefined || value === null ? null : { id: value.id, type: value.type };
}
/** Material fields only: volatile status timestamps cannot cause perpetual conflicts. */
export function materialState(resource, raw) {
  const out = Object.create(null);
  for (const key of WRITE_FIELDS[resource] ?? []) if (Object.hasOwn(raw, key)) out[key] = structuredClone(raw[key]);
  if (resource === 'groups') {
    out.peers = ids(raw.peers);out.resources = (raw.resources ?? []).map(assoc).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }
  if (resource === 'resources') out.groups = ids(raw.groups);
  if (resource === 'routers') {
    if (raw.peer !== undefined && raw.peer !== null) out.peer = typeof raw.peer === 'string' ? raw.peer : raw.peer.id;
    if (raw.peer_groups !== undefined && raw.peer_groups !== null) out.peer_groups = ids(raw.peer_groups);
  }
  if (resource === 'policies') {
    out.source_posture_checks = ids(raw.source_posture_checks);
    out.rules = (raw.rules ?? []).map(rule => {
      const r = Object.create(null);
      for (const key of ['id', 'name', 'description', 'enabled', 'action', 'bidirectional', 'protocol', 'ports', 'port_ranges', 'authorized_groups']) if (Object.hasOwn(rule, key)) r[key] = structuredClone(rule[key]);
      r.sources = ids(rule.sources);r.destinations = ids(rule.destinations);
      if (rule.sourceResource !== undefined) r.sourceResource = assoc(rule.sourceResource);
      if (rule.destinationResource !== undefined) r.destinationResource = assoc(rule.destinationResource);
      return r;
    });
  }
  return out;
}
export function fingerprintState(resource, raw) { return canonical(materialState(resource, raw)); }
export function matchesRequested(resource, requested, observed) {
  const expected = materialState(resource, requested), actual = materialState(resource, observed);
  function subset(one, two, key = '') {
    if (key === 'description' && one === '' && two === undefined) return true;
    if (Array.isArray(one)) return Array.isArray(two) && one.length === two.length && one.every((v, i) => subset(v, two[i]));
    if (one && typeof one === 'object') {
      if (two === undefined && Object.keys(one).length === 0) return true;
      return two && typeof two === 'object' && !Array.isArray(two) && Object.keys(one).every(k => subset(one[k], two[k], k));
    }
    return one === two;
  }
  return Boolean(subset(expected, actual));
}
