import https from 'node:https';
import { NetBirdError, fail, cancelled } from './errors.mjs';
import { normaliseApiUrl } from './config.mjs';

export const MAX_RESPONSE = 524288;
export const REQUEST_TIMEOUT = 15000;

/** HTTPS only: no redirects, proxies, retries or caller-provided headers. */
export async function httpsRequest(input, { requestImpl = https.request, timeoutMs = REQUEST_TIMEOUT } = {}) {
  const { apiUrl, path, method, token, body, signal } = input;
  const base = normaliseApiUrl(apiUrl);
  if (!/^\/[A-Za-z0-9/_-]+$/.test(path) || path.includes('//') || !['GET', 'POST', 'PUT', 'DELETE'].includes(method)) fail('INVALID_REQUEST', 'Pedido fora do contrato permitido.');
  if (!/^[\x21-\x7e]{8,8192}$/.test(token)) fail('TOKEN_INVALID', 'Formato de credencial inválido.');
  if (method === 'GET' && body !== undefined) fail('INVALID_REQUEST', 'Um pedido de leitura não aceita corpo.');
  const payload = body === undefined ? undefined : JSON.stringify(body);
  if (payload && Buffer.byteLength(payload) > 16384) fail('REQUEST_TOO_LARGE', 'O corpo da alteração excede o limite.');
  cancelled(signal);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > REQUEST_TIMEOUT) fail('INVALID_REQUEST', 'Timeout fora do limite.');
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), timeoutMs);
  timer.unref?.();
  const combined = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal;
  let onAbort;
  try {
    return await new Promise((resolve, reject) => {
      let settled = false, request;
      const finish = (error, result) => {
        if (settled) return;
        settled = true;
        error ? reject(error) : resolve(result);
      };
      onAbort = () => {
        finish(new NetBirdError(signal?.aborted ? 'CANCELLED' : 'REQUEST_TIMEOUT', 'Pedido cancelado ou timeout atingido; não houve repetição.'));
        request?.destroy();
      };
      combined.addEventListener('abort', onAbort, { once: true });
      if (combined.aborted) { onAbort(); return; }
      try {
        request = requestImpl(new URL(base + path), {
          method, signal: combined, agent: false, rejectUnauthorized: true, minVersion: 'TLSv1.2',
          headers: { Authorization: 'Token ' + token, Accept: 'application/json', 'Accept-Encoding': 'identity',
            ...(payload !== undefined ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}) },
        }, response => {
          const status = response.statusCode;
          if (!Number.isInteger(status) || status < 200 || status >= 300) {
            response.destroy();
            return finish(new NetBirdError(status >= 300 && status < 400 ? 'REDIRECT_REFUSED' : 'API_HTTP_ERROR',
              'A API recusou o pedido; corpo de erro e cabeçalhos não foram divulgados.', Number.isInteger(status) ? { httpStatus: status } : {}));
          }
          const declared = response.headers?.['content-length'];
          const encoding = response.headers?.['content-encoding'];
          if ((declared && (!/^\d+$/.test(String(declared)) || Number(declared) > MAX_RESPONSE)) || (encoding && encoding !== 'identity')) {
            response.destroy();return finish(new NetBirdError('RESPONSE_LIMIT', 'Resposta acima do limite ou com codificação não suportada.'));
          }
          let size = 0;const chunks = [];
          response.on('data', chunk => {
            if (settled) return;
            const bytes = Buffer.from(chunk);size += bytes.length;
            if (size > MAX_RESPONSE) { response.destroy();finish(new NetBirdError('RESPONSE_LIMIT', 'Resposta acima do limite.')); }
            else chunks.push(bytes);
          });
          response.on('error', () => finish(new NetBirdError('NETWORK_ERROR', 'Resposta interrompida; detalhes privados não foram divulgados.')));
          response.on('aborted', () => finish(new NetBirdError('NETWORK_ERROR', 'Resposta interrompida.')));
          response.on('end', () => {
            if (settled) return;
            if (!size && (status === 204 || (method === 'DELETE' && status === 200))) return finish(null, { httpStatus: status, data: null });
            const type = String(response.headers?.['content-type'] ?? '').toLowerCase();
            if (!/^application\/json(?:;|$)/.test(type)) return finish(new NetBirdError('INVALID_RESPONSE', 'A API não devolveu JSON no formato esperado.'));
            try {
              const text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
              finish(null, { httpStatus: status, data: JSON.parse(text) });
            } catch { finish(new NetBirdError('INVALID_RESPONSE', 'Resposta JSON inválida; conteúdo não foi divulgado.')); }
          });
        });
        request.on('error', () => finish(new NetBirdError(signal?.aborted ? 'CANCELLED' : timeout.signal.aborted ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
          'Pedido interrompido ou ligação TLS indisponível; não houve repetição automática.')));
        if (payload !== undefined) request.write(payload);
        request.end();
      } catch { request?.destroy();finish(new NetBirdError('NETWORK_ERROR', 'Não foi possível iniciar o pedido HTTPS.')); }
    });
  } finally { clearTimeout(timer); if (onAbort) combined.removeEventListener('abort', onAbort); }
}
