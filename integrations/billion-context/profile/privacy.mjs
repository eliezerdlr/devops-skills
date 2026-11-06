// Local filesystem privacy boundary. Never treats Windows mode bits as ACLs.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Validate only a conservative allow-only descriptor; never approximate effective
// access in the presence of Deny ACEs or grant access to additional principals.
export function validateWindowsAclDescriptor(descriptor) {
    const sid = value => typeof value === 'string' && /^S-\d+(?:-\d+)+$/.test(value);
    if (!descriptor || !sid(descriptor.currentUser) || !sid(descriptor.owner) || !Array.isArray(descriptor.rules)) {
        throw new Error('Invalid Windows ACL descriptor.');
    }
    const allowed = new Set([descriptor.currentUser, 'S-1-5-18', 'S-1-5-32-544']);
    if (!allowed.has(descriptor.owner)) throw new Error('Untrusted owner.');
    let hasFull = false;
    for (const rule of descriptor.rules) {
        if (!rule || !sid(rule.sid) || typeof rule.applies !== 'boolean' || typeof rule.fullControl !== 'boolean') {
            throw new Error('Invalid Windows ACL rule.');
        }
        // Reject all Deny ACEs, including group and inherited ACEs. This is
        // intentionally stricter than Windows effective-access evaluation.
        if (rule.type !== 'Allow') throw new Error('Only allow-only Windows ACLs are supported.');
        if (!allowed.has(rule.sid)) throw new Error('ACL permits another identity.');
        if (rule.sid === descriptor.currentUser && rule.applies && rule.fullControl) hasFull = true;
    }
    if (!hasFull) throw new Error('Current user lacks applicable full control.');
}

function windowsAcl(target, configure = false) {
    // Encode the path as data; never interpolate it into executable PowerShell.
    const encodedPath = Buffer.from(path.resolve(target), 'utf16le').toString('base64');
    const script = `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$p = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${encodedPath}'))
$me = [Security.Principal.WindowsIdentity]::GetCurrent().User
$allowed = @($me.Value, 'S-1-5-18', 'S-1-5-32-544')
$ancestor = [IO.Directory]::GetParent($p)
while ($null -ne $ancestor) {
    if (($ancestor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Reparse ancestor is not private storage' }
    $ancestor = $ancestor.Parent
}
${configure ? `
if (Test-Path -LiteralPath $p) { throw 'Refusing existing directory' }
$parent = Get-Item -LiteralPath (Split-Path -Parent $p) -Force
if (-not $parent.PSIsContainer -or ($parent.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Invalid parent directory' }
$acl = New-Object Security.AccessControl.DirectorySecurity
$acl.SetOwner($me)
$acl.SetAccessRuleProtection($true, $false)
foreach ($sid in $allowed) {
    $identity = New-Object Security.Principal.SecurityIdentifier($sid)
    $rule = New-Object Security.AccessControl.FileSystemAccessRule($identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    $acl.AddAccessRule($rule)
}
[void][IO.Directory]::CreateDirectory($p, $acl)
` : ''}
$item = Get-Item -LiteralPath $p -Force
if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Reparse points are not private storage' }
$acl = if ($item.PSIsContainer) { [IO.Directory]::GetAccessControl($p) } else { [IO.File]::GetAccessControl($p) }
$rules = @($acl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier]) | ForEach-Object {
    @{
        sid = $_.IdentityReference.Value
        type = [string]$_.AccessControlType
        applies = ($_.PropagationFlags -band [Security.AccessControl.PropagationFlags]::InheritOnly) -eq 0
        fullControl = ($_.FileSystemRights -band [Security.AccessControl.FileSystemRights]::FullControl) -eq [Security.AccessControl.FileSystemRights]::FullControl
    }
})
@{ currentUser = $me.Value; owner = $acl.GetOwner([Security.Principal.SecurityIdentifier]).Value; rules = $rules } | ConvertTo-Json -Compress -Depth 4
`;
    const executable = path.join(process.env.SystemRoot || 'C:/Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
    const output = execFileSync(executable, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {
        encoding: 'utf8', timeout: 15000, windowsHide: true, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let descriptor;
    try { descriptor = JSON.parse(output); }
    catch (cause) { throw new Error('Windows ACL verification did not complete.', { cause }); }
    validateWindowsAclDescriptor(descriptor);
}

export function assertPrivate(target, { directory = false } = {}) {
    const st = fs.lstatSync(target);
    if (st.isSymbolicLink() || (directory ? !st.isDirectory() : !st.isFile())) {
        throw new Error(`Expected private real ${directory ? 'directory' : 'file'}: ${target}`);
    }
    if (process.platform === 'win32') windowsAcl(target);
    else if ((st.mode & (directory ? 0o077 : 0o022)) !== 0) {
        throw new Error(`Expected private real ${directory ? 'directory' : 'file'}: ${target}`);
    }
}

// Use only for a newly created, empty directory. Refuses pre-existing paths.
export function createPrivateDirectory(target) {
    if (fs.existsSync(target)) throw new Error(`Refusing existing directory: ${target}`);
    if (process.platform === 'win32') windowsAcl(target, true);
    else fs.mkdirSync(target, { mode: 0o700 });
    assertPrivate(target, { directory: true });
}
