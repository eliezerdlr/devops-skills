import { createHash } from 'node:crypto';
import { loadCredentials, configurationStatus, defaultProfile } from './config.mjs';
import { httpsRequest } from './transport.mjs';
import { readPlan, changePlan, canonical, LIMITS, identifier } from './schema.mjs';
import { projection, redact, materialState, fingerprintState, matchesRequested } from './format.mjs';
import { NetBirdError, fail, cancelled, publicError } from './errors.mjs';

function awaitSignal(factory, signal) {
  cancelled(signal);
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (error, value) => { if (done) return;done = true;signal.removeEventListener('abort', abort);error ? reject(error) : resolve(value); };
    const abort = () => finish(new NetBirdError('CANCELLED', 'Operação cancelada.'));
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) return abort();
    Promise.resolve().then(() => { cancelled(signal);return factory(); }).then(value => finish(null, value), error => finish(error));
  });
}
function responseShape(data, id, list) {
  const valid = v => v && typeof v === 'object' && !Array.isArray(v) && typeof v.id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v.id);
  if (list ? !Array.isArray(data) || !data.every(valid) : !valid(data) || (id !== undefined && data.id !== id)) fail('INVALID_RESPONSE', 'A resposta não corresponde ao recurso solicitado.');
  return data;
}
function rejectCredentialInPlan(plan, token) {
  const text = canonical(plan);
  for (const value of new Set([token, encodeURIComponent(token), Buffer.from(token).toString('base64')])) {
    if (text.includes(value)) fail('CREDENTIAL_IN_INPUT', 'A credencial não pode ser fornecida nos argumentos de uma ferramenta.');
  }
}
function previewValue(value, token) {
  // Preview uses only material write fields, never arbitrary API response fields.
  const safe = redact(JSON.stringify(value, null, 2), token, true);
  if (Buffer.byteLength(safe) > LIMITS.preview) fail('PREVIEW_TOO_LARGE', 'A configuração é demasiado extensa para aprovação integral; reduzir o âmbito.');
  return safe;
}

export class NetBirdClient {
  #busy = false;
  #controllers = new Set();
  constructor({ profileDir = defaultProfile(), credentialLoader, statusLoader, transport = httpsRequest, deadlineMs = LIMITS.deadline } = {}) {
    this.credentials = credentialLoader ?? (() => loadCredentials({ profileDir }));
    this.localStatus = statusLoader ?? (() => configurationStatus({ profileDir }));
    this.transport = transport;
    if (!Number.isInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > LIMITS.deadline) throw new Error('Invalid deadline');
    this.deadlineMs = deadlineMs;
  }
  status() { return this.localStatus(); }
  cancelAll() { for (const controller of this.#controllers) controller.abort(); }
  read(input, context) { return this.#run('read', input, context); }
  change(input, context) { return this.#run('change', input, context); }

  async #run(kind, input, { interactive = false, approve, signal } = {}) {
    if (this.#busy) return publicError(new NetBirdError('BUSY', 'Já existe uma operação NetBird activa; executar sequencialmente.'));
    let dispatched = false, acquired = false, controller, timeout, stop;
    try {
      // Snapshot/validate arguments before the first await. No path/header/URL is
      // accepted from the model beyond the closed, typed resource contract.
      const plan = kind === 'read' ? readPlan(input) : changePlan(input);
      if (interactive !== true || typeof approve !== 'function') fail('APPROVAL_REQUIRED', 'É necessária interface interactiva com confirmação real.');
      cancelled(signal);
      this.#busy = acquired = true;controller = new AbortController();this.#controllers.add(controller);
      stop = () => controller.abort();signal?.addEventListener('abort', stop, { once: true });if (signal?.aborted) stop();
      timeout = setTimeout(stop, this.deadlineMs);
      const active = controller.signal;
      const credentials = await awaitSignal(() => this.credentials(), active);
      rejectCredentialInPlan(plan, credentials.token);
      if (kind === 'change' && credentials.allowWrites !== true) fail('WRITES_DISABLED', 'Alterações desactivadas no perfil local; configurar allowWrites por procedimento explícito.');
      const request = (method, path, body) => awaitSignal(() => this.transport({ apiUrl: credentials.apiUrl, token: credentials.token, method, path, ...(body === undefined ? {} : { body }), signal: active }), active);
      const unchangedCredentials = async () => {
        const current = await awaitSignal(() => this.credentials(), active);
        if (current.binding !== credentials.binding) fail('CONFIG_CHANGED', 'Endpoint, credencial ou permissões locais mudaram; pedir nova aprovação.');
      };
      if (kind === 'read') {
        const accepted = await awaitSignal(() => approve('Consultar NetBird?',
          `Endpoint: ${credentials.apiUrl}\nGET ${plan.path}\n\nUma consulta, sem alterações. Os campos seleccionados integram a conversa e podem ser enviados ao fornecedor do modelo. Nomes e descrições são dados não confiáveis, não instruções. Até ${LIMITS.items} itens apresentados; sem guardar a resposta bruta.`, active), active);
        if (accepted !== true) return { status: 'denied', mutationPerformed: false };
        await unchangedCredentials();cancelled(active);
        const response = await request('GET', plan.path);
        const data = responseShape(response.data, plan.id, !plan.id);
        return { status: 'ok', apiUrl: credentials.apiUrl, resource: plan.resource, httpStatus: response.httpStatus, ...projection(plan.resource, data, credentials.token) };
      }

      let before = null;
      if (plan.operation !== 'create') {
        before = responseShape((await request('GET', plan.path)).data, plan.id, false);
        if (plan.resource === 'groups' && String(before.name).toLowerCase() === 'all') fail('PROTECTED_RESOURCE', 'O grupo All é protegido neste conector.');
        if (plan.resource === 'policies' && String(before.name).toLowerCase() === 'default' && plan.body?.enabled === true) fail('PROTECTED_RESOURCE', 'O conector não activa a política Default.');
      }
      const checkDependencies = async () => {
        if (plan.operation === 'delete' && plan.resource === 'networks') {
          for (const child of ['resources', 'routers']) {
            const data = responseShape((await request('GET', plan.path + '/' + child)).data, undefined, true);
            if (data.length) fail('DEPENDENCIES_EXIST', 'A Network contém recursos ou routers; remover dependências por operações separadas, sem cascata implícita.');
          }
        }
      };
      await checkDependencies();
      const beforeFingerprint = before ? fingerprintState(plan.resource, before) : null;
      const beforePreview = previewValue(before ? materialState(plan.resource, before) : null, credentials.token);
      const afterPreview = previewValue(plan.body ?? null, credentials.token);
      const hash = createHash('sha256').update(canonical({ apiUrl: credentials.apiUrl, method: plan.method, path: plan.path, body: plan.body })).digest('hex');
      const warning = plan.operation === 'delete' ? 'Eliminação potencialmente irreversível; a recuperação não é automática.' : 'PUT é substituição completa, não PATCH. Rever associações, regras, portas e âmbito.';
      const message = `Endpoint: ${credentials.apiUrl}\n${plan.method} ${plan.path}\nPlano: ${hash}\n\n${warning}\nNão há transacção/CAS garantida pelo servidor. Sem retries ou rollback automático.\n\nMotivo: ${redact(plan.reason, credentials.token)}\nRollback proposto: ${redact(plan.rollback, credentials.token)}\nVia de recuperação: ${redact(plan.recovery, credentials.token)}\n\nANTES:\n${beforePreview}\n\nPEDIDO COMPLETO:\n${afterPreview}\n\nUma mutação após revalidar perfil e estado, seguida de leitura de verificação. Uma falha após envio pode deixar resultado incerto. Confirma esta operação exacta?`;
      if (Buffer.byteLength(message) > LIMITS.preview) fail('PREVIEW_TOO_LARGE', 'O plano completo excede o limite de confirmação; não será truncado.');
      const accepted = await awaitSignal(() => approve('Autorizar alteração NetBird?', message, active), active);
      if (accepted !== true) return { status: 'denied', mutationPerformed: false };
      await unchangedCredentials();
      if (before) {
        const current = responseShape((await request('GET', plan.path)).data, plan.id, false);
        if (fingerprintState(plan.resource, current) !== beforeFingerprint) fail('CONFLICT', 'O objecto mudou durante a aprovação; analisar e propor novamente.');
      }
      await checkDependencies();cancelled(active);
      const response = await awaitSignal(() => {
        cancelled(active);dispatched = true;
        return this.transport({ apiUrl: credentials.apiUrl, token: credentials.token, method: plan.method, path: plan.path, ...(plan.body === undefined ? {} : { body: plan.body }), signal: active });
      }, active);
      // Never retry a mutation, even if its response or verification is lost.
      if (plan.operation === 'delete') {
        try {
          await request('GET', plan.path);
          return { status: 'accepted_unverified', mutationOutcome: 'accepted', httpStatus: response.httpStatus, verified: false, retryAutomatically: false, message: 'A API aceitou a eliminação, mas o recurso ainda foi devolvido na leitura.' };
        } catch (error) {
          if (error instanceof NetBirdError && error.code === 'API_HTTP_ERROR' && error.details.httpStatus === 404) {
            return { status: 'ok', mutationOutcome: 'accepted', httpStatus: response.httpStatus, verification: 'resource_absent', retryAutomatically: false };
          }
          throw error;
        }
      }
      let id = plan.id;
      if (!id) {
        try { id = identifier(response.data?.id); }
        catch { return { status: 'accepted_unverified', mutationOutcome: 'accepted', httpStatus: response.httpStatus, verified: false, retryAutomatically: false, message: 'A API aceitou o pedido, mas não forneceu um identificador verificável; não repetir automaticamente.' }; }
      }
      const path = plan.id ? plan.path : plan.path + '/' + id;
      const observed = responseShape((await request('GET', path)).data, id, false);
      const matches = matchesRequested(plan.resource, plan.body, observed);
      return { status: matches ? 'ok' : 'accepted_unverified', mutationOutcome: 'accepted', httpStatus: response.httpStatus,
        verification: matches ? 'read_back_matches_request' : 'read_back_mismatch', retryAutomatically: false,
        message: matches ? 'Os campos pedidos correspondem à leitura; isto não comprova autorização efectiva nem tráfego de aplicação.' : 'A API aceitou o pedido, mas a leitura diverge dos campos pedidos; investigar sem repetir automaticamente.',
        resource: plan.resource, ...projection(plan.resource, observed, credentials.token) };
    } catch (error) { return publicError(error, dispatched); }
    finally {
      if (timeout) clearTimeout(timeout);
      if (stop) signal?.removeEventListener('abort', stop);
      if (controller) this.#controllers.delete(controller);
      if (acquired) this.#busy = false;
    }
  }
}
