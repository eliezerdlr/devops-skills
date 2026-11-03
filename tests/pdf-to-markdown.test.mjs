import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const base = fileURLToPath(new URL('../skills/engineering-skills/pdf-to-markdown/', import.meta.url));
const cli = join(base, 'scripts/convert.py');
const run = args => spawnSync('python3', [cli, ...args], { encoding: 'utf8' });

test('generic skill has no pilot data or user-specific paths', () => {
  for (const file of ['SKILL.md', 'README.md', 'scripts/convert.py', 'requirements.txt']) {
    const text = readFileSync(join(base, file), 'utf8');
    assert.doesNotMatch(text, /innuos|multi-az|\/Users\/|~\/\.claude/i);
  }
  assert.match(readFileSync(join(base, 'SKILL.md'), 'utf8'), /name: pdf-to-markdown/);
});

test('cache integrity and OCR option validation work offline', () => {
  const code = `
import importlib.util, tempfile, json
from pathlib import Path
spec = importlib.util.spec_from_file_location('converter', ${JSON.stringify(cli)})
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as directory:
    p = Path(directory)
    assert not m.valid_cache(p)
    tick = chr(96)
    sample = '\\n'.join(['assets/x.png', tick + 'assets/x.png' + tick, '![Image](assets/x.png)', tick * 3 + 'bash', '![Image](assets/x.png)', 'cp assets/x.png out/', tick * 3, ''])
    changed = m.rewrite_images(sample, {'assets/x.png': 'output_images/x.png'})
    assert changed.count('output_images/x.png') == 1
    assert 'cp assets/x.png out/' in changed
    assert '\\nassets/x.png\\n' in '\\n' + changed
    assert '\\n![Image](assets/x.png)\\ncp' in changed
    (p / 'document.md').write_text('test')
    (p / 'report.json').write_text('{}')
    (p / 'manifest.json').write_text(json.dumps({name: m.digest(p / name) for name in ['document.md', 'report.json']}))
    assert m.valid_cache(p)
    (p / 'document.md').write_text('changed')
    assert not m.valid_cache(p)
    (p / 'manifest.json').write_text(json.dumps({'../escape': 'bad'}))
    assert not m.valid_cache(p)
`;
  const result = spawnSync('python3', ['-c', code], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('help works without optional Python libraries', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /docling/);
});

test('missing input and existing output are rejected before imports', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pdf-skill-'));
  try {
    assert.notEqual(run([join(dir, 'missing.pdf'), join(dir, 'out.md')]).status, 0);
    const input = join(dir, 'input.pdf');
    const output = join(dir, 'out.md');
    writeFileSync(input, 'synthetic placeholder');
    writeFileSync(output, 'preserve');
    const result = run([input, output]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Output already exists/);
    assert.equal(readFileSync(output, 'utf8'), 'preserve');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
