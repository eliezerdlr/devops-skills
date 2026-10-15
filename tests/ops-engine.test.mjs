import test from 'node:test';
import assert from 'node:assert/strict';
import { Orchestrator, validatePlan, parseOutcome, LIMITS } from '../extensions/ops-orchestrator/engine.mjs';

const role = 'network-troubleshooter';
const step = (id, dependsOn = []) => ({ id, role, task: 'Analyse synthetic evidence only', dependsOn });
const good = (summary = 'Synthetic assessment') => JSON.stringify({ status: 'ok', summary, findings: [] });
const plan = () => ({ steps: [step('first')] });
const approve = async () => true;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

test('normalised plans are valid when optional evidence is empty', () => {
  const normalized = validatePlan(plan()); assert.deepEqual(validatePlan(normalized), normalized);
});
test('reverse-ordered failed DAG propagates skip without scheduling dependent workers', async () => {
  const e = new Orchestrator(); let calls = 0;
  const r = await e.run({ steps: [step('third', ['second']), step('second', ['first']), step('first')] }, { approve, worker: async () => { calls++; throw new Error('synthetic'); } });
  assert.equal(r.status, 'failed'); assert.equal(calls, 1); assert.equal(r.steps.second.status, 'skipped'); assert.equal(r.steps.third.status, 'skipped');
});
test('validates and clones plans', () => {
  const original = plan(), normalized = validatePlan(original);
  original.steps[0].task = 'changed'; assert.notEqual(normalized.steps[0].task, 'changed');
});
for (const [name, input] of [
  ['empty steps', { steps: [] }], ['too many steps', { steps: Array.from({ length: 9 }, (_, i) => step(`s${i}`)) }],
  ['duplicate id', { steps: [step('first'), step('first')] }], ['unknown role', { steps: [{ ...step('one'), role: 'shell' }] }],
  ['unknown field', { ...plan(), command: 'ignored' }], ['self dependency', { steps: [step('one', ['one'])] }],
  ['missing dependency', { steps: [step('one', ['missing'])] }], ['cycle', { steps: [step('one', ['two']), step('two', ['one'])] }],
  ['oversized evidence', { ...plan(), evidence: 'x'.repeat(LIMITS.evidenceBytes + 1) }],
  ['oversized unicode task', { steps: [{ ...step('one'), task: 'é'.repeat(LIMITS.taskBytes) }] }],
]) test(`rejects ${name}`, () => assert.throws(() => validatePlan(input)));

test('denial makes zero worker calls', async () => {
  let calls = 0; const engine = new Orchestrator();
  const r = await engine.run(plan(), { approve: async () => false, worker: async () => { calls++; return good(); } });
  assert.equal(r.status, 'denied'); assert.equal(calls, 0);
});
test('approval must return exactly true', async () => {
  const r = await new Orchestrator().run(plan(), { approve: async () => 'yes', worker: async () => assert.fail() });
  assert.equal(r.status, 'denied');
});
test('approval exception fails closed', async () => {
  const r = await new Orchestrator().run(plan(), { approve: async () => { throw new Error('SYNTHETIC_SECRET'); }, worker: async () => assert.fail() });
  assert.equal(r.status, 'failed'); assert.ok(!JSON.stringify(r).includes('SYNTHETIC_SECRET'));
});
test('dependencies receive successful outcomes in order', async () => {
  const order = [];
  const r = await new Orchestrator().run({ steps: [step('review', ['collect']), step('collect')] }, { approve, worker: async s => {
    order.push(s.id); if (s.id === 'review') assert.equal(s.dependencies.collect.status, 'ok'); return good();
  } });
  assert.equal(r.status, 'completed'); assert.deepEqual(order, ['collect', 'review']);
});
test('two-worker concurrency cap', async () => {
  let active = 0, peak = 0;
  const r = await new Orchestrator().run({ steps: Array.from({ length: 8 }, (_, i) => step(`s${i}`)) }, { approve, worker: async () => {
    active++; peak = Math.max(peak, active); await pause(5); active--; return good();
  } });
  assert.equal(r.status, 'completed'); assert.equal(peak, 2);
});
test('failure skips dependent steps but independent analysis may finish', async () => {
  const called = [];
  const r = await new Orchestrator().run({ steps: [step('one'), step('two', ['one']), step('independent')] }, { approve, worker: async s => {
    called.push(s.id); if (s.id === 'one') throw new Error('secret provider error'); return good();
  } });
  assert.equal(r.status, 'failed'); assert.equal(r.steps.two.status, 'skipped'); assert.ok(!called.includes('two'));
  assert.equal(r.steps.independent.status, 'done'); assert.ok(!JSON.stringify(r).includes('secret provider error'));
});
test('blocked outcome prevents dependent work', async () => {
  const r = await new Orchestrator().run({ steps: [step('one'), step('two', ['one'])] }, { approve, worker: async () => JSON.stringify({ status: 'blocked', summary: 'Need evidence', findings: [] }) });
  assert.equal(r.steps.one.status, 'blocked'); assert.equal(r.steps.two.status, 'skipped');
});
test('malformed worker result never becomes success', async () => {
  const r = await new Orchestrator().run(plan(), { approve, worker: async () => 'not JSON' }); assert.equal(r.status, 'failed');
});
test('strict worker schema and output bounds', () => {
  assert.throws(() => parseOutcome('```json\n' + good() + '\n```'));
  assert.throws(() => parseOutcome(JSON.stringify({ status: 'ok', summary: 's', findings: [], action: 'deploy' })));
  assert.throws(() => parseOutcome(good('x'.repeat(LIMITS.outputBytes + 1))));
  assert.throws(() => parseOutcome(JSON.stringify({ status: 'ok', summary: 's', findings: [{ severity: 'pass', detail: 's' }] })));
});
test('deadline cancels uncooperative worker without reporting success', async () => {
  const engine = new Orchestrator({ timeoutMs: 25 }); let seenSignal;
  const r = await engine.run(plan(), { approve, worker: async s => { seenSignal = s.signal; return new Promise(() => {}); } });
  assert.equal(r.status, 'cancelled'); assert.equal(seenSignal.aborted, true);
});
test('cancel an active run; late result cannot overwrite cancellation', async () => {
  const engine = new Orchestrator(); let id, finish;
  const pending = engine.run(plan(), { approve, onStart: value => { id = value; }, worker: async () => new Promise(resolve => { finish = resolve; }) });
  await pause(5); assert.equal(engine.cancel(id), true);
  const r = await pending; finish(good()); await pause(5);
  assert.equal(r.status, 'cancelled'); assert.equal(engine.list()[0].status, 'cancelled');
  assert.equal(engine.cancel(id), false);
});
test('cancel pending approval without launching work', async () => {
  const e = new Orchestrator(); let id;
  const result = e.run(plan(), { onStart: x => { id = x; }, approve: async () => new Promise(() => {}), worker: async () => assert.fail() });
  e.cancel(id); assert.equal((await result).status, 'cancelled');
});
test('pre-aborted input runs no callbacks', async () => {
  const c = new AbortController(); c.abort();
  await assert.rejects(new Orchestrator().run(plan(), { signal: c.signal, approve: async () => assert.fail(), worker: async () => assert.fail() }));
});
test('active run cap and shutdown cancellation', async () => {
  const e = new Orchestrator(); const options = { approve, worker: async () => new Promise(() => {}) };
  const one = e.run(plan(), options), two = e.run(plan(), options);
  await assert.rejects(e.run(plan(), options), /capacity/); e.cancelAll();
  assert.equal((await one).status, 'cancelled'); assert.equal((await two).status, 'cancelled');
});
test('metadata registry excludes evidence and model text', async () => {
  const e = new Orchestrator(); await e.run({ ...plan(), evidence: 'SYNTHETIC_PRIVATE_DATA' }, { approve, worker: async () => good('SYNTHETIC_MODEL_TEXT') });
  const stored = JSON.stringify(e.list()); assert.ok(!stored.includes('SYNTHETIC_PRIVATE_DATA')); assert.ok(!stored.includes('SYNTHETIC_MODEL_TEXT'));
});
test('run registry bounded and immutable to callers', async () => {
  const e = new Orchestrator();
  for (let i = 0; i < 35; i++) await e.run(plan(), { approve, worker: async () => good() });
  assert.equal(e.list().length, LIMITS.records); const list = e.list(); list[0].status = 'fake'; assert.notEqual(e.list()[0].status, 'fake');
});
