import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { INSTRUCTIONS, MODE_ENTRY, SECTION_KEY } from '../extensions/ponytail/policy.mjs';
const sdk = process.env.PI_SDK_ROOT;
if (!sdk) throw new Error('Set PI_SDK_ROOT to the installed reference SDK (Ponytail verified on 1.4.0)');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = async name => import(pathToFileURL(resolve(sdk, `dist/core/${name}.js`)));
const { loadExtensions } = await load('extensions/loader');

async function fixture({ hasUI = true } = {}) {
    const result = await loadExtensions([resolve(root, 'extensions/ponytail/index.ts')], root);
    assert.deepEqual(result.errors, []);
    let branch = [];
    const appended = [], notices = [], statuses = [];
    result.runtime.appendEntry = (customType, data) => {
        appended.push({ customType, data });
        branch.push({ type: 'custom', customType, data });
    };
    const ext = result.extensions[0];
    const ctx = { hasUI, sessionManager: { getBranch: () => branch }, ui: { notify: (...a) => notices.push(a), setStatus: (...a) => statuses.push(a) } };
    const emit = async (type, event = {}) => {
        const out = [];
        for (const fn of ext.handlers.get(type) ?? []) out.push(await fn({ type, ...event }, ctx));
        return out;
    };
    const command = args => ext.commands.get('ponytail').handler(args, ctx);
    const prompt = () => ({ systemPrompt: 'BASE', systemPromptOptions: { sections: { approvals: 'KEEP SAFETY' }, selectedTools: ['read'] } });
    return { result, ext, ctx, appended, notices, statuses, emit, command, prompt, setBranch: value => { branch = value; } };
}

test('actual loader registers only one Ponytail command and passive composition/state handlers', async () => {
    const f = await fixture();
    assert.deepEqual([...f.ext.commands.keys()], ['ponytail']);
    assert.equal(f.ext.tools.size, 0);
    assert.deepEqual([...f.ext.handlers.keys()].sort(), ['before_agent_start', 'session_shutdown', 'session_start', 'session_tree'].sort());
    assert.deepEqual(f.appended, []);
});
test('new sessions are full and structured composition preserves all unrelated options', async () => {
    const f = await fixture(); await f.emit('session_start');
    const event = f.prompt(); const options = event.systemPromptOptions;
    assert.deepEqual(await f.emit('before_agent_start', event), [undefined]);
    assert.equal(event.systemPromptOptions, options);
    assert.equal(options.sections.approvals, 'KEEP SAFETY');
    assert.deepEqual(options.selectedTools, ['read']);
    assert.equal(options.sections[SECTION_KEY], INSTRUCTIONS);
    assert.equal(event.systemPrompt, 'BASE');
    await f.emit('before_agent_start', event);
    assert.equal(Object.keys(options.sections).filter(k => k === SECTION_KEY).length, 1);
    assert.deepEqual(f.appended, []);
});
test('off removes only owned section and full restores it, without sending model messages', async () => {
    const f = await fixture(); const event = f.prompt();
    await f.emit('before_agent_start', event); await f.command('off');
    await f.emit('before_agent_start', event);
    assert.deepEqual(event.systemPromptOptions.sections, { approvals: 'KEEP SAFETY' });
    await f.command('full'); await f.emit('before_agent_start', event);
    assert.equal(event.systemPromptOptions.sections[SECTION_KEY], INSTRUCTIONS);
    assert.deepEqual(f.appended, [{ customType: MODE_ENTRY, data: { version: 1, mode: 'off' } }, { customType: MODE_ENTRY, data: { version: 1, mode: 'full' } }]);
});
test('invalid/status/redundant commands persist no extra state', async () => {
    const f = await fixture();
    for (const cmd of ['', 'status', 'full', 'on', 'default off', 'band', 'off now']) await f.command(cmd);
    assert.deepEqual(f.appended, []);
    const event = f.prompt(); await f.emit('before_agent_start', event);
    assert.equal(event.systemPromptOptions.sections[SECTION_KEY], INSTRUCTIONS);
});
test('native branch state is restored for reload/tree while new sessions return full', async () => {
    const f = await fixture(); await f.command('off');
    await f.emit('session_start'); let event = f.prompt(); await f.emit('before_agent_start', event);
    assert.equal(event.systemPromptOptions.sections[SECTION_KEY], undefined);
    f.setBranch([]); await f.emit('session_tree');
    event = f.prompt(); await f.emit('before_agent_start', event);
    assert.equal(event.systemPromptOptions.sections[SECTION_KEY], INSTRUCTIONS);
    f.setBranch([{ type: 'custom', customType: MODE_ENTRY, data: { version: 1, mode: 'off' } }]);
    await f.emit('session_tree'); await f.emit('session_shutdown');
    f.setBranch([]); await f.emit('session_start');
    event = f.prompt(); await f.emit('before_agent_start', event);
    assert.equal(event.systemPromptOptions.sections[SECTION_KEY], INSTRUCTIONS);
});
test('failed session persistence does not apply an unrecorded mode change', async () => {
    const f = await fixture(); f.result.runtime.appendEntry = () => { throw Error('synthetic persistence failure'); };
    await assert.rejects(f.command('off'), /synthetic persistence failure/);
    const event = f.prompt(); await f.emit('before_agent_start', event);
    assert.equal(event.systemPromptOptions.sections[SECTION_KEY], INSTRUCTIONS);
});
test('headless full/off composition works without invoking UI callbacks', async () => {
    const f = await fixture({ hasUI: false }); await f.emit('session_start');
    let event = f.prompt(); await f.emit('before_agent_start', event);
    assert.equal(event.systemPromptOptions.sections[SECTION_KEY], INSTRUCTIONS);
    await f.command('off'); event = f.prompt(); await f.emit('before_agent_start', event);
    assert.equal(event.systemPromptOptions.sections[SECTION_KEY], undefined);
    assert.deepEqual(f.notices, []); assert.deepEqual(f.statuses, []);
});
test('legacy prompt fallback appends once and removes its own trailing suffix', async () => {
    const f = await fixture();
    const [first] = await f.emit('before_agent_start', { systemPrompt: 'BASE' });
    assert.ok(first.systemPrompt.startsWith('BASE\n\n'));
    assert.deepEqual(await f.emit('before_agent_start', { systemPrompt: first.systemPrompt }), [first]);
    await f.command('off');
    assert.deepEqual(await f.emit('before_agent_start', { systemPrompt: first.systemPrompt }), [{ systemPrompt: 'BASE' }]);
    assert.deepEqual(await f.emit('before_agent_start', { systemPrompt: 'BASE' }), [undefined]);
});
test('real Pi runner composes and removes the section without replacing safety or tools', async () => {
    const { ExtensionRunner } = await load('extensions/runner');
    const { SessionManager } = await load('session-manager');
    const { buildSystemPrompt } = await load('system-prompt');
    const loaded = await loadExtensions([resolve(root, 'extensions/ponytail/index.ts')], root);
    assert.deepEqual(loaded.errors, []);
    const manager = SessionManager.inMemory(root);
    loaded.runtime.appendEntry = (name, data) => manager.appendCustomEntry(name, data);
    const runner = new ExtensionRunner(loaded.extensions, loaded.runtime, root, manager, {});
    const errors = []; runner.onError(e => errors.push(e));
    await runner.emit({ type: 'session_start', reason: 'startup' });
    const trigger = { messageType: 'user', prompt: 'SYNTHETIC TASK' };
    const options = { cwd: root, customPrompt: 'BASE APPROVALS', contextFiles: [], selectedTools: [], sections: { safety: 'KEEP SAFETY' } };
    const active = await runner.emitBeforeAgentStart(trigger, options);
    assert.equal(active.systemPromptOptions.forceSystemPrompt, undefined);
    assert.match(buildSystemPrompt(active.systemPromptOptions), /DevOps Ponytail/);
    assert.match(buildSystemPrompt(active.systemPromptOptions), /KEEP SAFETY/);
    assert.deepEqual(active.systemPromptOptions.selectedTools, []);
    await loaded.extensions[0].commands.get('ponytail').handler('off', runner.createContext());
    const inactive = await runner.emitBeforeAgentStart(trigger, active.systemPromptOptions);
    assert.doesNotMatch(buildSystemPrompt(inactive.systemPromptOptions), /DevOps Ponytail/);
    assert.match(buildSystemPrompt(inactive.systemPromptOptions), /BASE APPROVALS/);
    assert.match(buildSystemPrompt(inactive.systemPromptOptions), /KEEP SAFETY/);
    assert.equal(manager.getBranch().filter(e => e.type === 'custom' && e.customType === MODE_ENTRY).length, 1);
    assert.deepEqual(errors, []);
});
