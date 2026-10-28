import { isIP } from 'node:net';
import { fail } from './errors.mjs';

// Public contract reference: netbirdio/netbird v0.81.3 OpenAPI and generated Go types.
export const RESOURCES = Object.freeze(['peers', 'groups', 'policies', 'networks', 'resources', 'routers']);
export const MUTABLE = Object.freeze(['groups', 'policies', 'networks', 'resources', 'routers']);
export const LIMITS = Object.freeze({ body: 16384, preview: 32768, output: 49152, items: 50, deadline: 120000 });
const ID = /^[A-Za-z0-9_-]{1,128}$/;
const TYPES = new Set(['host', 'subnet', 'domain', 'peer']);
const PROTOCOLS = new Set(['all', 'tcp', 'udp', 'icmp', 'netbird-ssh']);
const RULE_KEYS = ['name', 'enabled', 'action', 'bidirectional', 'protocol', 'description', 'id', 'sources', 'destinations', 'ports', 'port_ranges', 'authorized_groups', 'sourceResource', 'destinationResource'];
export const WRITE_FIELDS = Object.freeze({
  groups: ['name', 'peers', 'resources'], policies: ['name', 'description', 'enabled', 'rules', 'source_posture_checks'],
  networks: ['name', 'description'], resources: ['name', 'description', 'address', 'enabled', 'groups'],
  routers: ['peer', 'peer_groups', 'metric', 'masquerade', 'enabled'],
});

function invalid() { fail('INVALID_INPUT', 'Parâmetros fora do contrato permitido; consultar a documentação do conector.'); }
function object(value, allowed, required = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) invalid();
  if (Object.keys(value).some(k => !allowed.includes(k)) || required.some(k => !Object.hasOwn(value, k))) invalid();
}
function text(value, max = 128, empty = false) {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim()) || /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value)) invalid();
}
export function identifier(value) { if (typeof value !== 'string' || !ID.test(value)) invalid();return value; }
function bool(value) { if (typeof value !== 'boolean') invalid(); }
function ids(value, max = 100) {
  if (!Array.isArray(value) || value.length > max || new Set(value).size !== value.length) invalid();
  value.forEach(identifier);
}
function association(value) {
  object(value, ['id', 'type'], ['id', 'type']);identifier(value.id);
  if (!TYPES.has(value.type)) invalid();
}
function rule(value) {
  object(value, RULE_KEYS, ['name', 'enabled', 'action', 'bidirectional', 'protocol']);
  text(value.name);bool(value.enabled);bool(value.bidirectional);
  if (!['accept', 'drop'].includes(value.action) || !PROTOCOLS.has(value.protocol)) invalid();
  if (Object.hasOwn(value, 'description')) text(value.description, 1024, true);
  if (Object.hasOwn(value, 'id')) identifier(value.id);
  for (const key of ['sources', 'destinations']) if (Object.hasOwn(value, key)) ids(value[key], 16);
  for (const key of ['sourceResource', 'destinationResource']) if (Object.hasOwn(value, key)) association(value[key]);
  const source = Boolean(value.sources?.length), destination = Boolean(value.destinations?.length);
  if (Number(source) + Number(Boolean(value.sourceResource)) !== 1 || Number(destination) + Number(Boolean(value.destinationResource)) !== 1) invalid();
  if (Object.hasOwn(value, 'ports') && Object.hasOwn(value, 'port_ranges')) invalid();
  if (value.ports !== undefined) {
    if (!Array.isArray(value.ports) || value.ports.length > 32 || new Set(value.ports).size !== value.ports.length) invalid();
    for (const port of value.ports) if (typeof port !== 'string' || !/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) invalid();
  }
  if (value.port_ranges !== undefined) {
    if (!Array.isArray(value.port_ranges) || value.port_ranges.length > 32) invalid();
    for (const range of value.port_ranges) {
      object(range, ['start', 'end'], ['start', 'end']);
      if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 1 || range.end > 65535 || range.start > range.end) invalid();
    }
  }
  if ((value.ports?.length || value.port_ranges?.length) && !['tcp', 'udp'].includes(value.protocol)) invalid();
  if (value.authorized_groups !== undefined) {
    if (value.protocol !== 'netbird-ssh') invalid();
    const keys = Object.keys(value.authorized_groups ?? {});
    object(value.authorized_groups, keys);
    if (keys.length > 16) invalid();
    for (const key of keys) {
      identifier(key);if (['__proto__', 'constructor', 'prototype'].includes(key)) invalid();
      const users = value.authorized_groups[key];
      if (!Array.isArray(users) || users.length > 16) invalid();
      for (const user of users) if (typeof user !== 'string' || !/^[a-z_][a-z0-9_-]{0,63}\$?$/.test(user)) invalid();
    }
  }
}
function address(value) {
  text(value, 253);
  if (value.includes('/')) {
    const [host, prefix, ...rest] = value.split('/');const version = isIP(host);
    if (!version || host.includes('%') || rest.length || !/^\d{1,3}$/.test(prefix) || Number(prefix) < 1 || Number(prefix) > (version === 4 ? 32 : 128)) invalid();
  } else if (!isIP(value)) {
    if (!/^(?:\*\.)?(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z][A-Za-z0-9-]{0,62}\.?$/.test(value)) invalid();
  } else if (value.includes('%')) invalid();
  if (['0.0.0.0', '::'].includes(value)) invalid();
}

export function validateBody(resource, value) {
  // Full write bodies are intentional. PUT is replacement, not PATCH; optional
  // description/association fields must be explicit so omissions are visible.
  const required = resource === 'routers' ? ['metric', 'masquerade', 'enabled'] : WRITE_FIELDS[resource];
  object(value, WRITE_FIELDS[resource] ?? [], required ?? []);
  if (value.name !== undefined) text(value.name);
  if (value.description !== undefined) text(value.description, 1024, true);
  if (resource === 'groups') {
    ids(value.peers);if (!Array.isArray(value.resources) || value.resources.length > 100) invalid();
    value.resources.forEach(association);
    if (new Set(value.resources.map(r => r.id)).size !== value.resources.length || value.name.toLowerCase() === 'all') invalid();
  } else if (resource === 'policies') {
    bool(value.enabled);ids(value.source_posture_checks, 16);
    if (!Array.isArray(value.rules) || value.rules.length < 1 || value.rules.length > 8) invalid();
    value.rules.forEach(rule);
    if (value.name.toLowerCase() === 'default' && value.enabled) fail('PROTECTED_RESOURCE', 'O conector não activa a política Default.');
  } else if (resource === 'resources') { address(value.address);bool(value.enabled);ids(value.groups, 64); }
  else if (resource === 'routers') {
    if (!Number.isInteger(value.metric) || value.metric < 1 || value.metric > 9999) invalid();
    bool(value.masquerade);bool(value.enabled);
    if (Number(Object.hasOwn(value, 'peer')) + Number(Object.hasOwn(value, 'peer_groups')) !== 1) invalid();
    if (value.peer !== undefined) identifier(value.peer);
    if (value.peer_groups !== undefined) { ids(value.peer_groups, 16);if (!value.peer_groups.length) invalid(); }
  }
  return value;
}

function pathFor(resource, id, networkId, mutation) {
  if (!RESOURCES.includes(resource)) invalid();
  if (id !== undefined) identifier(id);
  if (['resources', 'routers'].includes(resource)) {
    if (!networkId && resource === 'routers' && !mutation && !id) return '/networks/routers';
    identifier(networkId);
    return `/networks/${networkId}/${resource}${id ? '/' + id : ''}`;
  }
  if (networkId !== undefined) invalid();
  if (resource === 'networks' && id === 'routers') invalid();
  return '/' + resource + (id ? '/' + id : '');
}

export function readPlan(input) {
  object(input, ['resource', 'id', 'networkId'], ['resource']);
  return Object.freeze({ ...input, method: 'GET', path: pathFor(input.resource, input.id, input.networkId, false) });
}

export function changePlan(input) {
  object(input, ['operation', 'resource', 'id', 'networkId', 'body', 'reason', 'rollback', 'recovery'], ['operation', 'resource', 'reason', 'rollback', 'recovery']);
  if (!MUTABLE.includes(input.resource) || !['create', 'update', 'delete'].includes(input.operation)) invalid();
  for (const key of ['reason', 'rollback', 'recovery']) { text(input[key], 1024);if (input[key].trim().length < 8) invalid(); }
  if (input.operation === 'create' ? input.id !== undefined : input.id === undefined) invalid();
  const method = { create: 'POST', update: 'PUT', delete: 'DELETE' }[input.operation];
  let body;
  if (method === 'DELETE') { if (input.body !== undefined) invalid(); }
  else {
    if (typeof input.body !== 'string' || Buffer.byteLength(input.body) > LIMITS.body) invalid();
    try { body = JSON.parse(input.body); } catch { invalid(); }
    validateBody(input.resource, body);
  }
  const plan = { ...input, body, method, path: pathFor(input.resource, input.id, input.networkId, true) };
  return deepFreeze(plan);
}
function deepFreeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze);Object.freeze(value); }
  return value;
}
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
