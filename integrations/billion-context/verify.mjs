// Read-only verification: never imports the runtime or edits Pi settings.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { assertPrivate } from './profile/privacy.mjs';

const profile = new URL('./profile/', import.meta.url);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export function verifyRuntime(directory) {
    const root = path.resolve(directory);
    const lock = JSON.parse(fs.readFileSync(new URL('runtime-lock.json', profile), 'utf8'));
    function privateDirectory(name) {
        assertPrivate(name, { directory: true });
    }
    privateDirectory(root);
    for (const name of ['bootstrap.js', 'privacy.mjs', 'runtime.config.json', 'runtime-lock.json', 'package.json', 'package-lock.json']) {
        const target = path.join(root, name);
        assertPrivate(target);
        if (digest(fs.readFileSync(target)) !== digest(fs.readFileSync(new URL(name, profile)))) {
            throw new Error(`Profile integrity mismatch: ${name}`);
        }
    }
    const pkg = path.join(root, 'node_modules/billion-context');
    for (const [name, expected] of Object.entries(lock.sha256)) {
        if (digest(fs.readFileSync(path.join(pkg, name))) !== expected) {
            throw new Error(`Runtime integrity mismatch: ${name}`);
        }
    }
    const license = fs.readFileSync(path.join(pkg, 'LICENSE'));
    if (digest(license) !== digest(fs.readFileSync(new URL('./LICENSE', import.meta.url)))) {
        throw new Error('Runtime license mismatch.');
    }
    if (fs.existsSync(path.join(root, 'tmp'))) privateDirectory(path.join(root, 'tmp'));
    return { version: lock.version, verified: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        if (process.argv.length !== 3) throw new Error('Usage: node verify.mjs /absolute/private/runtime');
        console.log(JSON.stringify(verifyRuntime(process.argv[2])));
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
