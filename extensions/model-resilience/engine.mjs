import { PROVIDER, TRANSPORT } from './policy.mjs';

// Initial support is limited to adapters whose request endpoint follows model.baseUrl.
// Environment-derived cloud endpoints need their own audited pre-send contract.
const SUPPORTED_APIS = new Set(['openai-completions', 'openai-responses', 'openai-codex-responses', 'anthropic-messages']);
const EMPTY_USAGE = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } });
export function failureKind(message) {
  if (message?.stopReason === 'aborted') return 'cancelled';
  const text = String(message?.errorMessage ?? '').slice(0, 16384);
  if (/context.{0,30}(length|window|limit)|maximum.{0,20}context|too many tokens/i.test(text)) return 'context';
  if (/invalid.api.key|unauthori[sz]ed|authentication|\b401\b|permission.denied|forbidden/i.test(text)) return 'authentication';
  if (/insufficient_quota|quota.exceeded|quota.{0,30}exhaust|exhaust.{0,30}quota|out of budget|available balance|monthly usage limit|usage.limit.reached|you have (hit|reached).{0,70}usage limit|credit balance.{0,30}(low|exhaust|insufficient)|GoUsageLimitError|FreeUsageLimitError|subscription_sharing_usage_limit_exceeded/i.test(text)) return 'quota';
  if (/\b429\b|rate.limit|too many requests/i.test(text)) return 'rate_limit';
  if (/\b50[0234]\b|overloaded|service.unavailable/i.test(text)) return 'server_error';
  return 'other';
}
export function stoppedMessage(model, kind, partial) {
  return {
    ...(partial ?? {}), role: 'assistant', api: model?.api ?? 'devops-resilience', provider: model?.provider ?? TRANSPORT,
    model: model?.id ?? 'stopped', content: partial?.content ?? [], usage: partial?.usage ?? EMPTY_USAGE(), timestamp: Date.now(),
    stopReason: kind === 'cancelled' ? 'aborted' : 'error',
    // Do not let the host repeat a complete chain or replay partial output on a transient error.
    // Context repair is left to the host, but only before any output was committed.
    errorMessage: kind === 'context' ? 'DevOps routing: context length exceeded; compact the conversation.' : `DevOps routing stopped (${kind}). Inspect /devops-routing-status; automatic replay is disabled for this response.`,
  };
}
function visible(m) { return Array.isArray(m?.content) && m.content.some(b => b.type === 'toolCall' || Boolean(b.text || b.thinking || b.signature)); }
function hasImage(messages) { return messages.some(m => Array.isArray(m.content) && m.content.some(b => b.type === 'image')); }
export function checkRoute(policy, route, registry, hasTools) {
  const model = registry.find(route.provider, route.model);
  if (!model || !SUPPORTED_APIS.has(model.api) || [PROVIDER, TRANSPORT].includes(model.provider) || model.api === 'pi-virtual' || !registry.hasConfiguredAuth(model)) return undefined;
  let u; try { u = new URL(model.baseUrl); } catch { return undefined; }
  if (u.origin !== route.origin || u.username || u.password || u.search || u.hash) return undefined;
  if (!Number.isInteger(model.contextWindow) || !Number.isInteger(model.maxTokens) || !model.input?.includes('text') || model.contextWindow < policy.contextWindow || model.maxTokens < policy.maxOutputTokens || (hasTools && !route.supportsTools)) return undefined;
  if (route.billing === 'subscription') {
    if (!registry.isUsingOAuth(model) || registry.getProvider?.(model.provider)?.auth?.oauth?.isSubscription !== true) return undefined;
  } else {
    if (!policy.allowMetered) return undefined;
    const c = model.cost;
    if (!c || ![c.input, c.output, c.cacheRead, c.cacheWrite].every(n => Number.isFinite(n) && n >= 0) ||
        Math.max(c.input, c.cacheRead, c.cacheWrite) > policy.maxInputUsdPerMillion || c.output > policy.maxOutputUsdPerMillion) return undefined;
  }
  return model;
}
function bounded(promise, signal) {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(signal.reason); };
    signal.addEventListener('abort', abort, { once: true });
    Promise.resolve(promise).then(v => { signal.removeEventListener('abort', abort); resolve(v); }, e => { signal.removeEventListener('abort', abort); reject(e); });
    if (signal.aborted) abort();
  });
}
function observedUsage(message) {
  const u = message?.usage;
  if (!u) return undefined;
  const safe = n => Number.isFinite(n) && n >= 0 ? n : null;
  return { input: safe(u.input), output: safe(u.output), cacheRead: safe(u.cacheRead), cacheWrite: safe(u.cacheWrite), totalTokens: safe(u.totalTokens), costTotal: safe(u.cost?.total) };
}

/** Pure orchestration. invoke is the host registry stream, not a separate auth client. */
export async function* routeEvents({ policy, registry, context, options = {}, hasTools = false, onAttempt = () => {} }) {
  let activeModel;
  const total = new AbortController();
  const totalTimer = setTimeout(() => total.abort(new Error('Routing deadline')), policy.deadlineMs);
  const parentSignal = options.signal;
  const signal = parentSignal ? AbortSignal.any([parentSignal, total.signal]) : total.signal;
  let partial, committed = false;
  const stop = (kind, message = partial) => ({ type: 'error', reason: kind === 'cancelled' ? 'aborted' : 'error', error: stoppedMessage(activeModel, kind, message) });
  try {
    // Byte guard is intentionally conservative, also covering direct calls/workers which do not compact.
    if ((options.maxTokens !== undefined && (!Number.isInteger(options.maxTokens) || options.maxTokens <= 0)) || hasImage(context.messages) || Buffer.byteLength(JSON.stringify(context)) > policy.maxInputBytes) { yield stop('input_policy'); return; }
    if (signal.aborted) { yield stop('cancelled'); return; }
    let attempts = 0;
    for (const route of policy.routes) {
      if (attempts >= policy.maxAttempts) break;
      activeModel = checkRoute(policy, route, registry, hasTools);
      const identity = `${route.provider}/${route.model}`;
      if (!activeModel) { onAttempt({ route: identity, outcome: 'policy_or_auth_blocked' }); continue; }
      attempts++;
      const attempt = new AbortController();
      const timer = setTimeout(() => attempt.abort(new Error('Attempt deadline')), policy.attemptTimeoutMs);
      const attemptSignal = AbortSignal.any([signal, attempt.signal]);
      let iterator, heldStart, ended = false, kind = 'other', receivedBytes = 0, originValidated = false, originRejected = false;
      partial = undefined; committed = false;
      try {
        // Transport credentials/overrides must never leak into a different provider's resolver.
        const { apiKey, headers, env, baseUrl, ...forward } = options;
        const inner = registry.streamSimple(activeModel, context, {
          ...forward,
          onPayload: async (payload, effectiveModel) => {
            let url; try { url = new URL(effectiveModel?.baseUrl); } catch {}
            if (!url || url.origin !== route.origin || url.username || url.password || url.search || url.hash ||
                effectiveModel.provider !== activeModel.provider || effectiveModel.id !== activeModel.id) {
              originRejected = true; throw new Error('Routing endpoint policy stopped this request.');
            }
            originValidated = true;
            return forward.onPayload?.(payload, effectiveModel);
          },
          signal: attemptSignal, reasoning: 'off', maxRetries: 0,
          timeoutMs: policy.attemptTimeoutMs, maxRetryDelayMs: 1,
          maxTokens: Math.min(options.maxTokens ?? policy.maxOutputTokens, policy.maxOutputTokens),
        });
        iterator = inner[Symbol.asyncIterator]();
        while (true) {
          const next = await bounded(iterator.next(), attemptSignal);
          if (next.done) break;
          const e = next.value;
          if (e.type === 'start' && !committed) { heldStart = e; partial = e.partial; continue; }
          if (e.type === 'error') {
            partial = e.error;
            kind = originRejected ? 'origin_policy' : failureKind(partial);
            if (!originValidated && ['quota', 'rate_limit', 'server_error'].includes(kind)) kind = 'provider_contract';
            if (committed || visible(partial)) { kind = 'partial_output'; if (heldStart) { yield heldStart; heldStart = undefined; } }
            ended = true; break;
          }
          if (e.type === 'done') {
            if (!originValidated) { kind = 'provider_contract'; ended = true; break; }
            if (!['stop', 'toolUse', 'length'].includes(e.message?.stopReason)) { kind = 'protocol'; ended = true; break; }
            if (Buffer.byteLength(JSON.stringify(e.message)) > 2097152) { partial = undefined; kind = 'output_policy'; committed = true; ended = true; break; }
            if (heldStart) { yield heldStart; heldStart = undefined; }
            if (e.message.stopReason === 'length') {
              onAttempt({ route: identity, outcome: 'output_limit', upstreamStopReason: 'length', usage: observedUsage(e.message) });
              yield stop('output_limit', e.message); return;
            }
            onAttempt({ route: identity, outcome: 'success', usage: observedUsage(e.message) });
            yield e; return;
          }
          // Provider adapters must honor the SDK pre-send payload-hook contract.
          if (!originValidated) { kind = 'provider_contract'; ended = true; break; }
          // All non-start events commit the response, including thinking/tool starts.
          committed = true;
          receivedBytes += typeof e.delta === 'string' ? Buffer.byteLength(e.delta) : 0;
          if (receivedBytes > 2097152) { partial = undefined; kind = 'output_policy'; ended = true; break; }
          if (heldStart) { yield heldStart; heldStart = undefined; }
          partial = e.partial ?? partial;
          yield e;
        }
        if (!ended) kind = committed ? 'partial_output' : 'protocol';
      } catch (e) {
        kind = attemptSignal.aborted ? (parentSignal?.aborted ? 'cancelled' : 'deadline') : originRejected ? 'origin_policy' : committed ? 'partial_output' : failureKind({ errorMessage: e instanceof Error ? e.message : '' });
        if (!originValidated && ['quota', 'rate_limit', 'server_error'].includes(kind)) kind = 'provider_contract';
      } finally {
        clearTimeout(timer);
        attempt.abort();
        // Never await an uncooperative provider's cleanup beyond our deadline.
        try { Promise.resolve(iterator?.return?.()).catch(() => {}); } catch {}
      }
      onAttempt({ route: identity, outcome: kind, usage: observedUsage(partial) });
      if (!committed && !visible(partial) && ['quota', 'rate_limit', 'server_error'].includes(kind) && !signal.aborted) continue;
      if (signal.aborted) kind = parentSignal?.aborted ? 'cancelled' : 'deadline';
      yield stop(kind, partial); return;
    }
    yield stop('approved_routes_exhausted', undefined);
  } catch {
    yield stop(parentSignal?.aborted ? 'cancelled' : 'policy');
  } finally { clearTimeout(totalTimer); total.abort(); }
}
