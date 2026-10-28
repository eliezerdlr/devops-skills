// Local opt-in Pi bootstrap. Upstream remains unmodified; see README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const marker = Symbol.for('devops.billion-context.profile.v1');
const contextTools = new Set(['compress', 'decompress', 'search_context', 'acp_status', 'acp_cache']);

function initialize() {
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'runtime-lock.json'), 'utf8'));
    const pkg = path.join(root, 'node_modules/billion-context');
    const cfg = fs.readFileSync(path.join(root, 'runtime.config.json'));
    if (createHash('sha256').update(cfg).digest('hex') !== lock.configSha256) throw new Error('billion-context profile changed; review before loading.');
    for (const [name, expected] of Object.entries(lock.sha256)) {
        const got = createHash('sha256').update(fs.readFileSync(path.join(pkg, name))).digest('hex');
        if (got !== expected) throw new Error(`billion-context integrity mismatch: ${name}`);
    }
    const current = globalThis[marker];
    if (current && current.root !== root) throw new Error('Another billion-context profile is already active; restart Pi.');
    if (!current) {
        const base = path.join(root, 'tmp');
        fs.mkdirSync(base, { recursive: true, mode: 0o700 });
        const st = fs.lstatSync(base);
        if (st.isSymbolicLink() || !st.isDirectory() || (st.mode & 0o077) !== 0) throw new Error('Temporary base must be a private real directory.');
        // Only remove this profile's marked directories whose owner no longer exists.
        for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
            if (!entry.isDirectory() || !entry.name.startsWith('pi-')) continue;
            const dir = path.join(base, entry.name);
            try {
                const owner = JSON.parse(fs.readFileSync(path.join(dir, 'owner.json'), 'utf8'));
                if (owner.profile !== 'devops-bili-v1' || !Number.isSafeInteger(owner.pid) || owner.pid < 1) continue;
                try { process.kill(owner.pid, 0); } catch (error) {
                    if (error.code === 'ESRCH') fs.rmSync(dir, { recursive: true });
                }
            } catch { /* Unknown/unreadable entries are never deleted. */ }
        }
        const tmp = fs.mkdtempSync(path.join(base, 'pi-'));
        fs.chmodSync(tmp, 0o700);
        fs.writeFileSync(path.join(tmp, 'owner.json'), JSON.stringify({ profile: 'devops-bili-v1', pid: process.pid }), { mode: 0o600 });
        globalThis[marker] = { root, tmp };
        process.once('exit', () => { try { fs.rmSync(tmp, { recursive: true }); } catch { /* retained for next startup */ } });
    }
    const tmp = globalThis[marker].tmp;
    Object.assign(process.env, {
        BILI_CONFIG_FILE: path.join(root, 'runtime.config.json'),
        BILI_SESSIONS_DIR: path.join(tmp, 'sessions'),
        BILI_PERSIST: '0', BILI_NATIVE_PI: '1', BILLION_CONTEXT_PLUGIN: '1', BILI_PI_INLINE: '0',
        XDG_CACHE_HOME: path.join(tmp, 'cache'), XDG_STATE_HOME: path.join(tmp, 'state'), XDG_DATA_HOME: path.join(tmp, 'data'),
        BILI_MITM: '0', ACP_AUTO_UPDATE: '0', BILI_ADVISORY_CHECK: '0',
        BILI_RELEASE_NOTES_CHECK: '0', ACP_AUTO_RESTART_ON_UPDATE: '0',
        BILI_AUTO_MODE_FORGE: '0', BILI_SQLITE_AUTO_DOWNLOAD: '0',
        ACP_LOG: '0', ACP_LOG_FILE: 'off', ACP_DEBUG: '0', ACP_DUMP_BODY: '0',
        ACP_DUMP_REQ: '0', BILI_DUMP_4XX: '0', BILI_IMAGE_RESCALE: '0',
        ACP_NO_INJECT_TOOL: '1', BILI_GUARDRAIL_BASH_TIMEOUT: '0',
        BILI_GUARDRAIL_MAX_OUTPUT_BYTES: '0', BILI_GUARDRAIL_REPETITION: '0',
        BILI_GUARDRAIL_TEXT_RUN_THRESHOLD: '0', BILI_CODEX_COMPACT: 'pass',
        TMPDIR: tmp, TMP: tmp, TEMP: tmp,
    });
    // SSE debugging uses a path, not a boolean; never inherit a dumping destination.
    delete process.env.ACP_DUMP_SSE;
    delete process.env.BILI_PROVIDER_REWRITES;
    if (!current) {
        delete process.env.BILLION_CONTEXT_PROXY;
        delete process.env.BILLION_CONTEXT_ATTACH;
    }
    return path.join(pkg, 'dist/agent/pi-native.js');
}

function privateContext(ctx) {
    if (!ctx.modelRegistry) return ctx;
    // Do not proactively enumerate/export provider API keys to the local proxy.
    // Normal authenticated model transport is still carried by the proxy.
    const registry = new Proxy(ctx.modelRegistry, { get(target, key) {
        if (key === 'getApiKeyForProvider') return undefined;
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
    } });
    return new Proxy(ctx, { get(target, key) {
        return key === 'modelRegistry' ? registry : Reflect.get(target, key, target);
    } });
}

export default function billionContextLocal(pi) {
    if (process.env.DEVOPS_BILI_DISABLE === '1') return;
    const starts = [];
    let ready;
    pi.on('tool_call', async (event, ctx) => {
        if (event.toolName !== 'decompress' || !event.input?.toFile) return;
        const approved = ctx.hasUI && await ctx.ui.confirm('Export recovered context?', `Write recovered conversation content to:\n${String(event.input.toFile)}\nThis is a persistent export outside automatic temporary recovery.`);
        if (approved !== true) return { block: true, reason: 'Persistent context export was not approved.' };
    });
    pi.on('session_start', async (event, ctx) => {
        if (!ready) ready = (async () => {
            const entry = initialize();
            const api = new Proxy(pi, { get(target, key) {
                if (key === 'on') return (name, handler) => {
                    if (name === 'session_start') { starts.push(handler); return () => {}; }
                    return target.on(name, (e, c) => handler(e, privateContext(c)));
                };
                if (key === 'registerTool') return tool => {
                    if (!contextTools.has(tool.name)) throw new Error(`Unexpected billion-context tool: ${tool.name}`);
                    return target.registerTool(tool);
                };
                const value = Reflect.get(target, key, target);
                return typeof value === 'function' ? value.bind(target) : value;
            } });
            const mod = await import(pathToFileURL(entry).href);
            await mod.default(api);
        })();
        await ready;
        for (const handler of starts) {
            // The pinned upstream registers required child extensions synchronously.
            // Use its kill switch only during that synchronous call; restore BEFORE
            // awaiting, so native routing/bootstrap and other handlers stay enabled.
            const previous = process.env.BILI_NATIVE_PI;
            let result;
            try { process.env.BILI_NATIVE_PI = '0'; result = handler(event, privateContext(ctx)); }
            finally {
                if (previous === undefined) delete process.env.BILI_NATIVE_PI;
                else process.env.BILI_NATIVE_PI = previous;
            }
            await result;
        }
    });
}
