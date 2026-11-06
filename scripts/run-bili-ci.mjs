// Keep the test exit status, and expose TAP failures through GitHub annotations.
// This lets the public checks API report more than a generic exit code.
import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, [
    '--test', '--test-reporter=tap',
    'tests/billion-context.test.mjs', 'tests/billion-context-privacy.test.mjs',
], { encoding: 'utf8', timeout: 480000, maxBuffer: 16 * 1024 * 1024 });
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
const escape = value => value.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
if (process.env.GITHUB_ACTIONS === 'true') {
    for (const failure of (result.stdout || '').matchAll(/^not ok[^\n]*\n(?:(?!^(?:ok |not ok |# Subtest:)).*\n)*/gm)) {
        console.log(`::error title=Bili test failure::${escape(failure[0].slice(0, 12000))}`);
    }
    if (result.error) console.log(`::error title=Bili test runner::${escape(result.error.message)}`);
}
process.exitCode = result.status === 0 && !result.error ? 0 : 1;
