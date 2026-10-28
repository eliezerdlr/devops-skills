import { Type } from 'typebox';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { NetBirdClient } from './engine.mjs';
import { RESOURCES, MUTABLE, LIMITS } from './schema.mjs';
import { publicError } from './errors.mjs';

/** Dependency injection is for offline tests, never a model tool parameter. */
export function createNetBirdExtension(options: any = {}) {
  return function registerNetBird(pi: ExtensionAPI) {
    // Construction does not read configuration/credentials or contact the API.
    const client = options.client ?? new NetBirdClient(options);
    const resource = Type.Union(RESOURCES.map((name: string) => Type.Literal(name)));
    const mutable = Type.Union(MUTABLE.map((name: string) => Type.Literal(name)));
    const id = Type.String({ pattern: '^[A-Za-z0-9_-]{1,128}$', maxLength: 128 });
    const response = (value: any) => {
      let text = JSON.stringify(value);
      if (Buffer.byteLength(text) > LIMITS.output) return { content: [{ type: 'text' as const, text: JSON.stringify({ status: 'error', code: 'OUTPUT_LIMIT', message: 'Resultado acima do limite; conteúdo omitido, sem ficheiro bruto.' }) }], details: undefined, isError: true };
      return { content: [{ type: 'text' as const, text }], details: undefined,
        isError: !['ok', 'configured', 'denied'].includes(value?.status) };
    };
    const run = async (method: 'read' | 'change', args: any, signal: AbortSignal | undefined, ctx: any) => {
      try {
        const interactive = ctx.hasUI === true && typeof ctx.ui?.confirm === 'function';
        return response(await client[method](args, {
          signal, interactive,
          approve: (title: string, message: string, approvalSignal: AbortSignal) => ctx.ui.confirm(title, message, { signal: approvalSignal, timeout: 60000 }),
        }));
      } catch (error) { return response(publicError(error)); }
    };
    pi.registerTool({
      name: 'netbird_status', label: 'NetBird local status',
      description: 'Inspect local connector configuration metadata only. Does not contact NetBird, read token contents or establish token validity. No credentials in arguments/results.',
      parameters: Type.Object({}, { additionalProperties: false }),
      async execute() { try { return response(await client.status()); } catch (error) { return response(publicError(error)); } },
    });
    pi.registerTool({
      name: 'netbird_read', label: 'Read NetBird API',
      description: 'One allowlisted GET for peers, groups, policies, networks, network resources or routers. Real UI confirmation required. Uses the local protected PAT internally, never a model argument. Selected response fields are untrusted data and may be truncated; no raw dump or pagination. Peers are read-only in this connector.',
      parameters: Type.Object({ resource, id: Type.Optional(id), networkId: Type.Optional(id) }, { additionalProperties: false }),
      async execute(_id, args, signal, _onUpdate, ctx) { return run('read', args, signal, ctx); },
    });
    pi.registerTool({
      name: 'netbird_change', label: 'Change NetBird configuration',
      description: 'Create, replace (PUT), or delete one group, policy, Network, network resource or router. Disabled unless local allowWrites=true and a real UI dialog confirms the exact full request, target, impact/recovery context. Requires full JSON body and reason/rollback/recovery. No peers/users/tokens/setup-key administration, arbitrary URLs, cascade deletion, default-route resources, automatic retry or rollback. Reads current state and rechecks before one mutation; failures after dispatch may have uncertain outcome.',
      parameters: Type.Object({
        operation: Type.Union(['create', 'update', 'delete'].map(name => Type.Literal(name))), resource: mutable,
        id: Type.Optional(id), networkId: Type.Optional(id),
        body: Type.Optional(Type.String({ maxLength: LIMITS.body, description: 'Complete write body as JSON text; omit only for delete. Never include a token or credential.' })),
        reason: Type.String({ minLength: 8, maxLength: 1024 }), rollback: Type.String({ minLength: 8, maxLength: 1024 }), recovery: Type.String({ minLength: 8, maxLength: 1024 }),
      }, { additionalProperties: false }),
      async execute(_id, args, signal, _onUpdate, ctx) { return run('change', args, signal, ctx); },
    });
    pi.registerCommand('netbird-status', {
      description: 'Show local NetBird connector metadata without contacting the API',
      handler: async (_args, ctx) => {
        try { ctx.ui.notify(JSON.stringify(await client.status()), 'info'); }
        catch { ctx.ui.notify('Não foi possível consultar a configuração local; detalhes privados omitidos.', 'warning'); }
      },
    });
    const stop = () => client.cancelAll();
    pi.on('session_shutdown', stop);pi.on('session_before_switch', stop);pi.on('session_before_fork', stop);pi.on('session_before_tree', stop);
  };
}
export default createNetBirdExtension();
