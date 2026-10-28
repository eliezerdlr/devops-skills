import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifyRuntime } from '../integrations/billion-context/verify.mjs';

const integration = fileURLToPath(new URL('../integrations/billion-context/', import.meta.url));
const profile = path.join(integration, 'profile');
const json = name => JSON.parse(fs.readFileSync(path.join(profile, name), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const tools = ['compress', 'decompress', 'search_context', 'acp_status', 'acp_cache'];

// Synthetic upstream implements only the host-facing contract, never network/model I/O.
const upstream = `export default function(pi) {
    globalThis.imported = true;
    for (const name of JSON.parse(process.env.FAKE_TOOLS)) pi.registerTool({name});
    pi.on('custom', (_event, ctx) => { globalThis.keyHidden = ctx.modelRegistry.getApiKeyForProvider === undefined; });
    pi.on('session_start', async (_event, ctx) => {
        globalThis.syncNative = process.env.BILI_NATIVE_PI;
        globalThis.keyHidden = ctx.modelRegistry.getApiKeyForProvider === undefined;
        if (process.env.BILI_NATIVE_PI !== '0') globalThis.foreignRegistry.set('bili', true);
        await Promise.resolve();
        globalThis.asyncNative = process.env.BILI_NATIVE_PI;
    });
}`;

function fixture(t, { corruptConfig = false, corruptBundle = false, names = tools } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'devops-bili-test-'));
    fs.chmodSync(root, 0o700);
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    for (const name of ['bootstrap.js', 'runtime.config.json', 'runtime-lock.json', 'package.json', 'package-lock.json']) {
        fs.copyFileSync(path.join(profile, name), path.join(root, name));
        fs.chmodSync(path.join(root, name), 0o600);
    }
    const pkg = path.join(root, 'node_modules/billion-context');
    fs.mkdirSync(path.join(pkg, 'dist/agent'), { recursive: true });
    fs.writeFileSync(path.join(pkg, 'package.json'), '{"type":"module"}');
    fs.writeFileSync(path.join(pkg, 'dist/agent/pi-native.js'), upstream);
    const lock = json('runtime-lock.json');
    lock.sha256 = Object.fromEntries(['package.json', 'dist/agent/pi-native.js'].map(name => [name, sha(fs.readFileSync(path.join(pkg, name)))]));
    fs.writeFileSync(path.join(root, 'runtime-lock.json'), JSON.stringify(lock));
    if (corruptConfig) fs.appendFileSync(path.join(root, 'runtime.config.json'), '\n');
    if (corruptBundle) fs.appendFileSync(path.join(pkg, 'dist/agent/pi-native.js'), '\n');
    return {
        root,
        run(code) {
            const script = `import assert from 'node:assert/strict';
                import fs from 'node:fs'; import path from 'node:path'; import {pathToFileURL} from 'node:url';
                const root = process.env.FIXTURE_ROOT;
                const {default: boot} = await import(pathToFileURL(path.join(root, 'bootstrap.js')));
                const handlers = new Map(); const registered = [];
                const pi = {on(name, fn) { handlers.set(name, fn); }, registerTool(tool) { registered.push(tool.name); }};
                globalThis.foreignRegistry = new Map([['foreign', Object.freeze({safe:true})]]);
                const originalRegistry = globalThis.foreignRegistry;
                let keysRead = 0;
                const ctx = {hasUI:false, modelRegistry:{getApiKeyForProvider(){keysRead++;throw Error('never read keys');}}};
                ${code}`;
            const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
                encoding: 'utf8', timeout: 20000,
                // Do not pass live provider credentials or inherited Pi/Bili flags to children.
                env: { PATH: process.env.PATH, HOME: root, PI_OFFLINE: '1', FIXTURE_ROOT: root, FAKE_TOOLS: JSON.stringify(names) },
            });
            assert.equal(result.status, 0, result.stderr || result.error?.message);
        },
    };
}

test('billion-context metadata, license and npm pins are reproducible', () => {
    const lock = json('runtime-lock.json');
    const npm = json('package-lock.json');
    const provenance = JSON.parse(fs.readFileSync(path.join(integration, 'UPSTREAM.json'), 'utf8'));
    assert.equal(lock.version, '0.1.209');
    assert.equal(json('package.json').dependencies['billion-context'], lock.version);
    assert.equal(npm.packages['node_modules/billion-context'].version, lock.version);
    assert.equal(npm.packages['node_modules/billion-context'].integrity, lock.integrity);
    assert.equal(provenance.integrity, lock.integrity);
    assert.equal(provenance.publishedCommit, lock.publishedCommit);
    assert.equal(sha(fs.readFileSync(path.join(profile, 'runtime.config.json'))), lock.configSha256);
    assert.equal(sha(fs.readFileSync(path.join(profile, 'bootstrap.js'))), '15b8617298a8b1dd63fee47c6e3110519072bc314f58c0fd791d265723d3f9c2');
    assert.equal(sha(fs.readFileSync(path.join(integration, 'LICENSE'))), 'f27574cd3f4b0b4877da2869953945d66d76a665e7ebb9320a5e87aa76f7ab58');
});

test('profile keeps persistence, updates, delegates, dumps and injection disabled', () => {
    const cfg = json('runtime.config.json');
    for (const key of ['autoUpdate', 'autoRestartOnUpdate', 'advisoryCheck', 'releaseNotesCheck', 'imageRescale', 'log', 'debug']) assert.equal(cfg[key], false, key);
    for (const key of ['persist', 'autoModeForge', 'mitm']) assert.equal(cfg[key].enabled, false, key);
    assert.equal(cfg.pi.subagents, false);
    assert.equal(cfg.diagnostics.noInjectTool, true);
    for (const key of ['dumpBody', 'dumpReq', 'dump4xx']) assert.equal(cfg.diagnostics[key], false);
    for (const key of ['ccr', 'rules', 'absorb', 'externalSummary']) assert.equal(cfg.compress[key].enabled, false);
});

test('bootstrap is lazy and disabled mode has no registrations or temporary writes', t => {
    fixture(t).run(`process.env.DEVOPS_BILI_DISABLE='1'; boot(pi);
        assert.equal(handlers.size, 0); assert.equal(fs.existsSync(path.join(root,'tmp')), false);
        delete process.env.DEVOPS_BILI_DISABLE; boot(pi);
        assert.deepEqual([...handlers.keys()], ['tool_call','session_start']);
        assert.equal(registered.length, 0); assert.equal(globalThis.imported, undefined);
        assert.equal(fs.existsSync(path.join(root,'tmp')), false);`);
});

for (const [label, options, expected] of [
    ['configuration', {corruptConfig:true}, 'profile changed'],
    ['bundle', {corruptBundle:true}, 'integrity mismatch'],
]) test(`tampered ${label} fails before import, environment mutation and temporary writes`, t => {
    fixture(t, options).run(`boot(pi);
        await assert.rejects(handlers.get('session_start')({},ctx), /${expected}/);
        assert.equal(globalThis.imported, undefined);
        assert.equal(process.env.BILI_NATIVE_PI, undefined);
        assert.equal(fs.existsSync(path.join(root,'tmp')), false);`);
});

test('tools are bounded, credential getter hidden, foreign registry untouched, env restored before await', t => {
    const f = fixture(t);
    f.run(`boot(pi); await handlers.get('session_start')({},ctx);
        assert.deepEqual(registered, JSON.parse(process.env.FAKE_TOOLS));
        assert.equal(globalThis.syncNative, '0'); assert.equal(globalThis.asyncNative, '1');
        assert.equal(process.env.BILI_NATIVE_PI, '1'); assert.equal(globalThis.keyHidden, true);
        assert.equal(keysRead, 0); assert.equal(globalThis.foreignRegistry, originalRegistry);
        assert.equal(originalRegistry.size, 1); assert.equal(Object.isFrozen(originalRegistry.get('foreign')), true);
        handlers.get('custom')({}, ctx); assert.equal(globalThis.keyHidden, true);
        assert.equal(process.env.ACP_NO_INJECT_TOOL, '1'); assert.equal(process.env.BILI_PERSIST, '0');
        const st=fs.statSync(process.env.TMPDIR); assert.equal(st.mode & 0o077, 0);
        assert.equal(fs.statSync(path.join(process.env.TMPDIR,'owner.json')).mode & 0o077, 0);
        fs.writeFileSync(path.join(process.env.TMPDIR,'recovery.txt'), 'synthetic recovery', {mode:0o600});`);
    assert.deepEqual(fs.readdirSync(path.join(f.root, 'tmp')), [], 'owned process temp removed at exit');
});

test('unexpected upstream tool is rejected', t => {
    fixture(t, {names:['bash']}).run(`boot(pi);
        await assert.rejects(handlers.get('session_start')({},ctx), /Unexpected billion-context tool: bash/);
        assert.deepEqual(registered, []);`);
});

test('native env kill switch is restored when a synchronous callback throws', t => {
    const f = fixture(t);
    const entry = path.join(f.root, 'node_modules/billion-context/dist/agent/pi-native.js');
    const code = `export default pi => pi.on('session_start', () => { throw Error('synthetic start failed'); });`;
    fs.writeFileSync(entry, code);
    const lockPath = path.join(f.root, 'runtime-lock.json');
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    lock.sha256['dist/agent/pi-native.js'] = sha(code);
    fs.writeFileSync(lockPath, JSON.stringify(lock));
    f.run(`boot(pi); await assert.rejects(handlers.get('session_start')({},ctx), /synthetic start failed/);
        assert.equal(process.env.BILI_NATIVE_PI, '1');`);
});

test('persistent exports block headless/denied/non-boolean approval, allow explicit approval only', t => {
    fixture(t).run(`boot(pi); const guard=handlers.get('tool_call');
        const event={toolName:'decompress',input:{toFile:'/synthetic/export.txt'}};
        assert.equal((await guard(event,ctx)).block,true);
        for (const answer of [false, undefined, 'yes']) assert.equal((await guard(event,{hasUI:true,ui:{confirm:async()=>answer}})).block,true);
        assert.equal(await guard(event,{hasUI:true,ui:{confirm:async()=>true}}),undefined);
        assert.equal(await guard({toolName:'decompress',input:{}},ctx),undefined);
        assert.equal(await guard({toolName:'read',input:{toFile:'anything'}},ctx),undefined);
        assert.equal(fs.existsSync(path.join(root,'tmp')),false);`);
});

test('read-only verifier rejects modified profile and unsafe permissions without loading runtime', t => {
    const f = fixture(t);
    // Fixture runtime lock differs from shipped reference, so verification must not trust it.
    assert.throws(() => verifyRuntime(f.root), /Profile integrity mismatch: runtime-lock.json/);
    fs.chmodSync(f.root, 0o755);
    assert.throws(() => verifyRuntime(f.root), /Expected private real directory/);
    assert.equal(fs.existsSync(path.join(f.root, 'tmp')), false);
});

test('integration ships only public profile, source verifier, attribution and documentation', () => {
    assert.deepEqual(fs.readdirSync(integration).sort(), ['LICENSE','README.md','UPSTREAM.json','profile','verify.mjs']);
    assert.deepEqual(fs.readdirSync(profile).sort(), ['bootstrap.js','package-lock.json','package.json','runtime-lock.json','runtime.config.json']);
    for (const dir of [integration,profile]) for (const name of fs.readdirSync(dir)) {
        const filename=path.join(dir,name);
        if (fs.statSync(filename).isFile()) assert.doesNotMatch(fs.readFileSync(filename,'utf8'), /\/Users\/|registered_pending_restart|settings\.before\.json/);
    }
    const rootPackage=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
    assert.equal(rootPackage.pi.extensions.length,3);
    assert.ok(rootPackage.pi.extensions.every(name=>!name.includes('billion-context')));
    for (const filename of ['README.md','README.en.md','THIRD_PARTY_NOTICES.md']) {
        const content=fs.readFileSync(new URL(`../${filename}`,import.meta.url),'utf8');
        assert.match(content,/https:\/\/github.com\/ranxianglei\/billion-context/);
        assert.match(content,/https:\/\/github.com\/ranxianglei\/acp-kernel/);
    }
});
