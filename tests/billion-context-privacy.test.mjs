import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { assertPrivate, createPrivateDirectory, validateWindowsAclDescriptor } from '../integrations/billion-context/profile/privacy.mjs';

const currentUser = 'S-1-5-21-100-200-300-1001';
const full = (sid = currentUser, extra = {}) => ({ sid, type: 'Allow', applies: true, fullControl: true, ...extra });
const descriptor = (rules = [full()], owner = currentUser) => ({ currentUser, owner, rules });

test('Windows ACL policy accepts only trusted owners and applicable full-control grants', () => {
    for (const owner of [currentUser, 'S-1-5-18', 'S-1-5-32-544']) {
        assert.doesNotThrow(() => validateWindowsAclDescriptor(descriptor([full(), full('S-1-5-18'), full('S-1-5-32-544')], owner)));
    }
    assert.throws(() => validateWindowsAclDescriptor(descriptor([], 'S-1-1-0')), /Untrusted owner/);
    assert.throws(() => validateWindowsAclDescriptor(descriptor([])), /applicable full control/);
    assert.throws(() => validateWindowsAclDescriptor(descriptor([full(currentUser, { applies: false })])), /applicable full control/);
    assert.throws(() => validateWindowsAclDescriptor(descriptor([full(currentUser, { fullControl: false })])), /applicable full control/);
    assert.throws(() => validateWindowsAclDescriptor(descriptor([full('S-1-5-32-544')])), /applicable full control/);
});

test('Windows ACL policy rejects direct, group and inherited Deny ACEs even with Allow FullControl', () => {
    for (const sid of [currentUser, 'S-1-1-0', 'S-1-5-32-545']) {
        for (const applies of [true, false]) {
            assert.throws(() => validateWindowsAclDescriptor(descriptor([full(), full(sid, { type: 'Deny', applies, fullControl: false })])), /allow-only/);
        }
    }
    assert.throws(() => validateWindowsAclDescriptor(descriptor([full(), full('S-1-1-0')])), /another identity/);
});

test('Windows ACL policy fails closed on malformed descriptors and unknown rule types', () => {
    for (const value of [undefined, null, {}, { ...descriptor(), currentUser: '' }, { ...descriptor(), owner: 1 }, { ...descriptor(), rules: null }]) {
        assert.throws(() => validateWindowsAclDescriptor(value), /Invalid Windows ACL/);
    }
    for (const rule of [null, {}, full('', {}), full(currentUser, { applies: 1 }), full(currentUser, { fullControl: 'true' })]) {
        assert.throws(() => validateWindowsAclDescriptor(descriptor([rule])), /Invalid Windows ACL rule/);
    }
    assert.throws(() => validateWindowsAclDescriptor(descriptor([full(currentUser, { type: 'Unknown' })])), /allow-only/);
});

test('POSIX unsafe directory and writable-by-others file are rejected without changing modes', { skip: process.platform === 'win32' }, t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bili-posix-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    fs.chmodSync(root, 0o755);
    assert.throws(() => assertPrivate(root, { directory: true }), /Expected private real directory/);
    assert.equal(fs.statSync(root).mode & 0o777, 0o755);
    fs.chmodSync(root, 0o700);
    const file = path.join(root, 'unsafe');
    fs.writeFileSync(file, 'synthetic'); fs.chmodSync(file, 0o666);
    assert.throws(() => assertPrivate(file), /Expected private real file/);
    assert.equal(fs.statSync(file).mode & 0o777, 0o666);
});

test('private directory and inherited recovery file pass; existing paths refused', t => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'bili-privacy-'));
    t.after(() => fs.rmSync(base, { recursive: true, force: true }));
    const dir = path.join(base, "private space ' quoted");
    createPrivateDirectory(dir);
    assertPrivate(dir, { directory: true });
    assert.throws(() => createPrivateDirectory(dir), /Refusing existing/);
    const file = path.join(dir, 'recovery.txt');
    fs.writeFileSync(file, 'synthetic context', { mode: 0o600 });
    assertPrivate(file);
    assert.throws(() => assertPrivate(file, { directory: true }));
});

test('rejects a directory junction or symlink', t => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'bili-link-'));
    t.after(() => fs.rmSync(base, { recursive: true, force: true }));
    const dir = path.join(base, 'private');
    createPrivateDirectory(dir);
    const link = path.join(base, 'link');
    fs.symlinkSync(dir, link, process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => assertPrivate(link, { directory: true }));
});

test('Windows rejects existing paths below a junction ancestor', { skip: process.platform !== 'win32' }, t => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'bili-ancestor-'));
    t.after(() => fs.rmSync(base, { recursive: true, force: true }));
    const real = path.join(base, 'private'); createPrivateDirectory(real);
    const child = path.join(real, 'child'); createPrivateDirectory(child);
    const link = path.join(base, 'junction'); fs.symlinkSync(real, link, 'junction');
    assert.throws(() => assertPrivate(path.join(link, 'child'), { directory: true }), /Reparse ancestor/);
    assert.throws(() => createPrivateDirectory(path.join(link, 'new')), /Reparse ancestor/);
    assert.equal(fs.existsSync(path.join(real, 'new')), false);
});

test('Windows real ACL with group Deny is rejected without altering the descriptor', { skip: process.platform !== 'win32' }, t => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'bili-deny-'));
    t.after(() => fs.rmSync(base, { recursive: true, force: true }));
    const dir = path.join(base, 'private'); createPrivateDirectory(dir);
    const file = path.join(dir, 'recovery.txt'); fs.writeFileSync(file, 'synthetic');
    const encoded = Buffer.from(file, 'utf16le').toString('base64');
    const script = `$ErrorActionPreference='Stop'; $p=[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${encoded}')); $acl=[IO.File]::GetAccessControl($p); $sid=New-Object Security.Principal.SecurityIdentifier('S-1-1-0'); $rule=New-Object Security.AccessControl.FileSystemAccessRule($sid,'WriteData','Deny'); $acl.AddAccessRule($rule); [IO.File]::SetAccessControl($p,$acl)`;
    const executable = path.join(process.env.SystemRoot || 'C:/Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
    const run = code => execFileSync(executable, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(code, 'utf16le').toString('base64')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 });
    assertPrivate(file);
    run(script);
    const snapshot = `${script.split('; $acl=')[0]}; [IO.File]::GetAccessControl($p).Sddl`;
    const before = run(snapshot);
    assert.throws(() => assertPrivate(file), /allow-only/);
    assert.equal(run(snapshot), before);
});

test('Windows rejects third-party read access on directories and recovery files', { skip: process.platform !== 'win32' }, t => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'bili-unsafe-acl-'));
    t.after(() => fs.rmSync(base, { recursive: true, force: true }));
    const dir = path.join(base, 'private');
    createPrivateDirectory(dir);
    const file = path.join(dir, 'recovery.txt');
    fs.writeFileSync(file, 'synthetic');
    for (const target of [file, dir]) {
        const encodedPath = Buffer.from(target, 'utf16le').toString('base64');
        const script = `$ErrorActionPreference='Stop'; $p=[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${encodedPath}')); $d=[IO.Directory]::Exists($p); $acl=if($d){[IO.Directory]::GetAccessControl($p)}else{[IO.File]::GetAccessControl($p)}; $sid=New-Object Security.Principal.SecurityIdentifier('S-1-1-0'); $rule=New-Object Security.AccessControl.FileSystemAccessRule($sid,'Read','Allow'); $acl.AddAccessRule($rule); if($d){[IO.Directory]::SetAccessControl($p,$acl)}else{[IO.File]::SetAccessControl($p,$acl)}`;
        execFileSync(path.join(process.env.SystemRoot || 'C:/Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe'), ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { stdio: 'pipe' });
        assert.throws(() => assertPrivate(target, { directory: target === dir }), /another identity/);
    }
});
