import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { createAssistantMessageEventStream, getCurrentTools } from '@earendil-works/pi-ai';
import { loadPolicy, PROVIDER, TRANSPORT, describeApproval, routingApproval } from './policy.mjs';
import { routeEvents, stoppedMessage } from './engine.mjs';

/** Opt-in only. No service, model call, token resolution or config writes at load time. */
export default function resilience(pi: ExtensionAPI) {
  let policy: ReturnType<typeof loadPolicy>;
  let loadError = '';
  try { policy = loadPolicy(); } catch { loadError = 'Routing policy rejected. See integrations/omniroute/references/policy.md.'; }
  let registry: ExtensionContext['modelRegistry'] | undefined;
  const controllers = new Set<AbortController>();
  const attempts: any[] = [];
  pi.on('session_start', async (_event, ctx) => { registry = ctx.modelRegistry; });
  const stop = async () => { for (const c of controllers) c.abort(); controllers.clear(); registry = undefined; };
  pi.on('session_shutdown', stop);
  pi.on('session_before_switch', stop);
  pi.on('session_before_fork', stop);
  pi.on('session_before_tree', stop);
  pi.registerCommand('devops-routing-status', {
    description: 'Show approved routing policy and bounded attempt metadata (no prompts/credentials)',
    handler: async (_args, ctx) => {
      const text = loadError || (!policy ? 'Routing disabled. Set DEVOPS_MODEL_POLICY to an approved absolute policy path, reload, then select the routing model.' :
        `${PROVIDER}/${policy.id}\n${describeApproval(routingApproval({ provider: PROVIDER, id: policy.id }))}\nRecent attempts: ${JSON.stringify(attempts)}`);
      if (ctx.hasUI) ctx.ui.notify(text, loadError ? 'warning' : 'info');
    },
  });
  if (!policy) return;
  if (typeof pi.registerVirtualModel !== 'function') {
    loadError = 'Routing requires Pi 1.3 virtual models. Other package resources remain available.'; return;
  }
  const p = policy;
  pi.registerProvider(TRANSPORT, {
    name: 'DevOps routing transport (internal)', api: 'devops-resilience', apiKey: 'local-transport-not-an-upstream-credential',
    baseUrl: 'http://127.0.0.1',
    models: [{ id: p.id, name: 'Internal routing transport — select devops-resilience instead', reasoning: false, input: ['text'],
      contextWindow: p.contextWindow, maxTokens: p.maxOutputTokens, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } }],
    streamSimple(_model, context, options = {}) {
      const stream = createAssistantMessageEventStream();
      const controller = new AbortController(); controllers.add(controller);
      const requestRegistry = registry;
      void (async () => {
        try {
          const activeRegistry = requestRegistry ?? { find: () => undefined };
          for await (const e of routeEvents({
            policy: p, registry: activeRegistry, context,
            options: { ...options, signal: options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal },
            hasTools: getCurrentTools(context.messages).length > 0,
            onAttempt: (entry: any) => {
              const record = { policyHash: p.hash, ...entry };
              attempts.push(record); if (attempts.length > 20) attempts.shift();
              // No input/output text, provider errors or credentials are persisted.
              if (requestRegistry === registry) pi.appendEntry('devops.model-routing-attempt', record);
            },
          })) stream.push(e as any);
        } catch {
          const error = stoppedMessage(_model, controller.signal.aborted ? 'cancelled' : 'adapter');
          stream.push({ type: 'error', reason: error.stopReason, error } as any);
        } finally { controllers.delete(controller); stream.end(); }
      })();
      return stream;
    },
  });
  pi.registerVirtualModel({
    provider: PROVIDER, id: p.id, name: 'Approved quota fallback (text, thinking off)', input: ['text'], thinkingLevels: ['off'],
    contextWindow: p.contextWindow, maxTokens: p.maxOutputTokens,
    route(_request, ctx) {
      registry = ctx.modelRegistry;
      const model = ctx.modelRegistry.find(TRANSPORT, p.id);
      if (!model) throw new Error('Routing transport missing; reload Pi.');
      return { model, thinkingLevel: 'off' };
    },
  });
}
