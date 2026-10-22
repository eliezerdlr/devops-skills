import { randomUUID, createHash } from 'node:crypto';

export const ROLES = Object.freeze(['network-architect', 'network-troubleshooter', 'network-config-reviewer']);
export const LIMITS = Object.freeze({ steps: 8, taskBytes: 16384, evidenceBytes: 65536, outputBytes: 32768, concurrency: 2, activeRuns: 2, timeoutMs: 180000, records: 30 });
const bytes = value => Buffer.byteLength(value, 'utf8');
function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function text(value, max, label) {
  if (typeof value !== 'string' || !value.trim() || bytes(value) > max || value.includes('\0')) throw new Error(`Invalid or oversized ${label}`);
  return value;
}
function keys(obj, allowed) {
  if (!record(obj) || Object.keys(obj).some(k => !allowed.includes(k))) throw new Error('Unknown fields or invalid object');
}

export function validatePlan(input) {
  keys(input, ['steps', 'evidence']);
  const evidence = input.evidence === undefined || input.evidence === '' ? '' : text(input.evidence, LIMITS.evidenceBytes, 'evidence');
  if (!Array.isArray(input.steps) || input.steps.length < 1 || input.steps.length > LIMITS.steps) throw new Error('A workflow needs 1–8 steps');
  const ids = new Set();
  const steps = input.steps.map(s => {
    keys(s, ['id', 'role', 'task', 'dependsOn']);
    if (typeof s.id !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(s.id) || ids.has(s.id)) throw new Error('Invalid or duplicate step id');
    ids.add(s.id);
    if (!ROLES.includes(s.role)) throw new Error('Unknown role');
    const task = text(s.task, LIMITS.taskBytes, 'task');
    const dependsOn = s.dependsOn === undefined ? [] : s.dependsOn;
    if (!Array.isArray(dependsOn) || dependsOn.length > LIMITS.steps || new Set(dependsOn).size !== dependsOn.length || dependsOn.some(d => typeof d !== 'string')) throw new Error('Invalid dependency list');
    return { id: s.id, role: s.role, task, dependsOn: [...dependsOn] };
  });
  for (const s of steps) if (s.dependsOn.some(d => !ids.has(d) || d === s.id)) throw new Error('Missing or self dependency');
  const visited = new Set(), visiting = new Set(), byId = new Map(steps.map(s => [s.id, s]));
  function visit(id) {
    if (visiting.has(id)) throw new Error('Dependency cycle');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const d of byId.get(id).dependsOn) visit(d);
    visiting.delete(id); visited.add(id);
  }
  steps.forEach(s => visit(s.id));
  // Do not retain caller-owned objects after approval.
  return { steps, evidence };
}

export function parseOutcome(raw) {
  text(raw, LIMITS.outputBytes, 'worker output');
  let result;
  try { result = JSON.parse(raw); } catch { throw new Error('Worker did not return strict JSON'); }
  keys(result, ['status', 'summary', 'findings']);
  if (!['ok', 'blocked'].includes(result.status)) throw new Error('Invalid worker status');
  text(result.summary, 12000, 'summary');
  if (!Array.isArray(result.findings) || result.findings.length > 30) throw new Error('Invalid findings');
  for (const f of result.findings) {
    keys(f, ['severity', 'detail']);
    if (!['info', 'low', 'medium', 'high', 'critical'].includes(f.severity)) throw new Error('Invalid severity');
    text(f.detail, 4000, 'finding');
  }
  return result;
}

function abortError(signal) { return signal.reason instanceof Error ? signal.reason : new Error('Run cancelled'); }
async function bounded(promise, signal) {
  if (signal.aborted) throw abortError(signal);
  let handler;
  const aborted = new Promise((_, reject) => {
    handler = () => reject(abortError(signal));
    signal.addEventListener('abort', handler, { once: true });
  });
  try { return await Promise.race([promise, aborted]); }
  finally { signal.removeEventListener('abort', handler); }
}

export class Orchestrator {
  #runs = new Map();
  #controllers = new Map();
  constructor({ timeoutMs = LIMITS.timeoutMs, clock = Date.now } = {}) {
    if (!Number.isInteger(timeoutMs) || timeoutMs < 10 || timeoutMs > LIMITS.timeoutMs) throw new Error('Invalid deadline');
    this.timeoutMs = timeoutMs; this.clock = clock;
  }
  list() {
    return [...this.#runs.values()].map(r => ({ id: r.id, status: r.status, startedAt: r.startedAt, finishedAt: r.finishedAt, steps: Object.fromEntries(Object.entries(r.steps).map(([id, s]) => [id, s.status])) }));
  }
  cancel(id) {
    const c = this.#controllers.get(id);
    if (!c) return false;
    c.abort(new Error('Run cancelled')); return true;
  }
  cancelAll() { for (const id of this.#controllers.keys()) this.cancel(id); }
  async run(input, { approve, worker, signal, onStart = (_id) => {}, approvalContext }) {
    const plan = validatePlan(input);
    const binding = approvalContext === undefined ? plan : { plan, approvalContext: structuredClone(approvalContext) };
    if (approvalContext !== undefined && JSON.stringify(binding.approvalContext).length > 8192) throw new Error('Approval binding exceeds limit');
    const serializedBinding = JSON.stringify(binding);
    if (signal?.aborted) throw abortError(signal);
    if (this.#controllers.size >= LIMITS.activeRuns) throw new Error('Active workflow capacity reached');
    const id = randomUUID();
    const controller = new AbortController();
    const run = { id, status: 'awaiting-approval', startedAt: this.clock(), steps: Object.fromEntries(plan.steps.map(s => [s.id, { status: 'pending' }])) };
    this.#controllers.set(id, controller); this.#runs.set(id, run);
    const onAbort = () => controller.abort(signal.reason ?? new Error('Parent aborted'));
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
    const timer = setTimeout(() => controller.abort(new Error('Workflow deadline exceeded')), this.timeoutMs);
    const audit = { id, fingerprint: createHash('sha256').update(serializedBinding).digest('hex'), stepCount: plan.steps.length, roles: [...new Set(plan.steps.map(s => s.role))] };
    run.approvalFingerprint = audit.fingerprint;
    const running = new Map();
    try {
      onStart(id);
      const approved = await bounded(Promise.resolve().then(() => approve(structuredClone(audit), controller.signal)), controller.signal);
      if (approved !== true) {
        run.status = 'denied'; run.finishedAt = this.clock();
        for (const s of Object.values(run.steps)) s.status = 'skipped';
        return structuredClone(run);
      }
      run.status = 'running';
      while (plan.steps.some(s => ['pending', 'running'].includes(run.steps[s.id].status))) {
        if (controller.signal.aborted) throw abortError(controller.signal);
        for (const s of plan.steps) {
          if (run.steps[s.id].status !== 'pending') continue;
          if (s.dependsOn.some(d => ['failed', 'blocked', 'skipped'].includes(run.steps[d].status))) {
            run.steps[s.id] = { status: 'skipped', reason: 'Dependency did not succeed' }; continue;
          }
          if (running.size >= LIMITS.concurrency || !s.dependsOn.every(d => run.steps[d].status === 'done')) continue;
          run.steps[s.id] = { status: 'running' };
          const dependencies = Object.fromEntries(s.dependsOn.map(d => [d, run.steps[d].outcome]));
          const task = Promise.resolve().then(() => {
            if (controller.signal.aborted) throw abortError(controller.signal);
            return worker({ ...structuredClone(s), evidence: plan.evidence, dependencies: structuredClone(dependencies), runId: id, signal: controller.signal });
          }).then(raw => {
            if (controller.signal.aborted) return;
            const outcome = parseOutcome(raw);
            run.steps[s.id] = { status: outcome.status === 'ok' ? 'done' : 'blocked', outcome };
          }).catch(() => {
            if (!controller.signal.aborted) run.steps[s.id] = { status: 'failed', reason: 'Worker failed or returned invalid output; dependent steps will not run' };
          }).finally(() => running.delete(s.id));
          running.set(s.id, task);
        }
        if (running.size) await bounded(Promise.race(running.values()), controller.signal);
        else if (plan.steps.some(s => run.steps[s.id].status === 'pending')) {
          // Propagate a failed dependency through reverse-ordered DAG layers.
          for (const s of plan.steps) if (run.steps[s.id].status === 'pending' && s.dependsOn.some(d => ['failed', 'blocked', 'skipped'].includes(run.steps[d].status))) run.steps[s.id] = { status: 'skipped', reason: 'Dependency did not succeed' };
        }
      }
      run.status = Object.values(run.steps).every(s => s.status === 'done') ? 'completed' : 'failed';
    } catch {
      run.status = controller.signal.aborted ? 'cancelled' : 'failed';
      for (const s of Object.values(run.steps)) if (['pending', 'running'].includes(s.status)) { s.status = 'cancelled'; delete s.outcome; }
      // Keep public errors free of provider/task/credential payloads.
      run.reason = controller.signal.aborted ? 'Cancelled or deadline exceeded' : 'Workflow execution failed';
    } finally {
      controller.abort(new Error('Run settled'));
      clearTimeout(timer); signal?.removeEventListener('abort', onAbort);
      this.#controllers.delete(id); run.finishedAt = this.clock();
      // Store only status metadata, never evidence or model text, in the run registry.
      this.#runs.set(id, { id, status: run.status, startedAt: run.startedAt, finishedAt: run.finishedAt, steps: Object.fromEntries(Object.entries(run.steps).map(([k, v]) => [k, { status: v.status }])) });
      while (this.#runs.size > LIMITS.records) {
        const settled = [...this.#runs].find(([key]) => !this.#controllers.has(key));
        if (!settled) break;
        this.#runs.delete(settled[0]);
      }
    }
    return structuredClone(run);
  }
}
