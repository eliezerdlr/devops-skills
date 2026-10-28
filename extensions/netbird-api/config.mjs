import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { fail, NetBirdError } from './errors.mjs';

export const defaultProfile = () => join(homedir(), '.netbird-pi');
export const CONFIG_LIMIT = 4096;
export const TOKEN_FILE_LIMIT = 16384;

export function normaliseApiUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\s\u0000-\u001f\u007f]/u.test(value)) fail('CONFIG_INVALID', 'Endpoint API inválido.');
  let url;
  try { url = new URL(value); } catch { fail('CONFIG_INVALID', 'Endpoint API inválido.'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.search || url.hash || !['', '/', '/api', '/api/'].includes(url.pathname)) {
    fail('CONFIG_INVALID', 'Usar um endpoint HTTPS sem credenciais, query ou fragmento, com caminho /api.');
  }
  return url.origin + '/api';
}

function ownerUid() {
  if (typeof process.getuid !== 'function') fail('PLATFORM_UNSUPPORTED', 'Credenciais locais protegidas requerem um sistema POSIX suportado.');
  return process.getuid();
}

async function checkDirectory(directory) {
  let info;
  try { info = await lstat(directory); } catch { fail('NOT_CONFIGURED', 'Configurar primeiro o perfil local com configure.py.'); }
  const mode = info.mode & 0o777;
  if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== ownerUid() || ![0o700, 0o500].includes(mode)) {
    fail('PROFILE_PERMISSIONS', 'O perfil tem de ser uma directoria privada do utilizador, sem symlinks ou acesso de grupo/outros.');
  }
}

function fileMetadataValid(info, limit) {
  return info.isFile() && info.uid === ownerUid() && info.nlink === 1 &&
    [0o600, 0o400].includes(info.mode & 0o777) && info.size > 0 && info.size <= limit;
}

async function privateFile(directory, name, limit, contents) {
  let handle;
  try {
    const path = join(directory, name);
    const before = await lstat(path);
    if (before.isSymbolicLink() || !fileMetadataValid(before, limit)) fail('CREDENTIAL_PERMISSIONS', 'Ficheiro local inválido ou com permissões inseguras.');
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const info = await handle.stat();
    if (!fileMetadataValid(info, limit) || info.dev !== before.dev || info.ino !== before.ino) fail('CREDENTIAL_PERMISSIONS', 'Ficheiro local alterado ou inseguro.');
    if (!contents) return undefined;
    const buffer = Buffer.alloc(limit + 1);
    try {
      let length = 0;
      while (length <= limit) {
        const { bytesRead } = await handle.read(buffer, length, limit + 1 - length, length);
        if (!bytesRead) break;
        length += bytesRead;
      }
      const after = await handle.stat();
      if (length > limit || info.size !== after.size || info.mtimeMs !== after.mtimeMs) fail('CONFIG_CHANGED', 'O ficheiro local mudou durante a leitura.');
      try { return new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, length)); }
      catch { fail('CONFIG_INVALID', 'O ficheiro local não contém texto UTF-8 válido.'); }
    } finally { buffer.fill(0); }
  } catch (error) {
    if (error instanceof NetBirdError) throw error;
    fail('NOT_CONFIGURED', 'Perfil incompleto ou ficheiro local inacessível; não foram divulgados detalhes.');
  } finally { await handle?.close().catch(() => {}); }
}

async function profileConfig(profileDir) {
  await checkDirectory(profileDir);
  const text = await privateFile(profileDir, 'config.json', CONFIG_LIMIT, true);
  let config;
  try { config = JSON.parse(text); } catch { fail('CONFIG_INVALID', 'Configuração local inválida.'); }
  if (!config || Array.isArray(config) || typeof config !== 'object' || Object.keys(config).sort().join(',') !== 'allowWrites,apiUrl' || typeof config.allowWrites !== 'boolean') {
    fail('CONFIG_INVALID', 'A configuração suporta apenas apiUrl e allowWrites booleano.');
  }
  return { apiUrl: normaliseApiUrl(config.apiUrl), allowWrites: config.allowWrites };
}

/** Called only by an explicit tool invocation, never during extension startup. */
export async function loadCredentials({ profileDir = defaultProfile() } = {}) {
  const config = await profileConfig(profileDir);
  const raw = await privateFile(profileDir, 'api.token', TOKEN_FILE_LIMIT, true);
  const token = raw.replace(/\r?\n$/, '');
  if (!/^[\x21-\x7e]{8,8192}$/.test(token)) fail('TOKEN_INVALID', 'Formato de token inválido; fornecer apenas o valor da credencial.');
  const binding = createHash('sha256').update(JSON.stringify(config)).update('\0').update(token).digest('hex');
  return Object.freeze({ ...config, token, binding });
}

/** Metadata/configuration only. This does not validate the token against NetBird. */
export async function configurationStatus({ profileDir = defaultProfile() } = {}) {
  try {
    const config = await profileConfig(profileDir);
    await privateFile(profileDir, 'api.token', TOKEN_FILE_LIMIT, false);
    return { status: 'configured', apiUrl: config.apiUrl, writesEnabled: config.allowWrites, credentialPresent: true, tokenValidity: 'not_checked', apiContacted: false };
  } catch (error) {
    return { status: 'not_ready', code: error instanceof NetBirdError ? error.code : 'CONFIG_ERROR', credentialPresent: false, apiContacted: false };
  }
}
