import { Type } from 'typebox';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { analyse, approvalSummary, prepare, runtimeStatus } from '../../integrations/ghidra/adapter.mjs';

// Loading registers tools only: no Java process, download or filesystem mutation.
export default function (pi: ExtensionAPI) {
  const active = new Set<AbortController>();
  let busy = false;
  const respond = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }], details: undefined });
  pi.registerTool({
    name: 'ghidra_status', label: 'Ghidra runtime status',
    description: 'Check local Ghidra 12.2, Java 25 and native decompiler paths without launching them. No downloads or analysis. Readiness is not a sandbox or an integrity certification.',
    parameters: Type.Object({}, { additionalProperties: false }),
    async execute() { return respond(runtimeStatus()); },
  });
  pi.registerTool({
    name: 'ghidra_analyse', label: 'Ghidra binary analysis',
    description: 'Run real local Ghidra static analysis on a trusted benign ELF, PE or Mach-O binary, up to 64 MiB. Requires human UI approval of the input hash and output directory. Not an OS sandbox: hostile or unknown samples require a separate isolated environment. Fixed script only; no target execution or arbitrary scripts. Returns metadata and local report path, not decompiled code. Limit: 100 functions, 100 external symbols, three decompilations, 1 MiB process log, 10–600 second outer timeout.',
    parameters: Type.Object({ input: Type.String({ minLength: 1, maxLength: 4096 }), outputRoot: Type.String({ minLength: 1, maxLength: 4096 }), timeoutSeconds: Type.Optional(Type.Integer({ minimum: 10, maximum: 600 })) }, { additionalProperties: false }),
    async execute(_id, args, signal, _update, ctx) {
      if (!ctx.hasUI) throw new Error('Interactive human approval required; unattended tool analysis is disabled');
      if (busy) throw new Error('A Ghidra analysis is already active in this extension');
      busy = true;
      const controller = new AbortController(); active.add(controller);
      const abort = () => controller.abort();
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
      try {
        const plan = prepare(args);
        const result = await analyse(plan, {
          signal: controller.signal,
          approve: async () => ctx.ui.confirm('Analyse this trusted benign binary with Ghidra?', JSON.stringify(approvalSummary(plan), null, 2) + '\n\nConfirm ONLY if you own or are authorised to analyse this binary and have independently established it is benign. For malware/unknown firmware, cancel and use an isolated disposable machine. No network isolation is provided. This approval does not authorise sending report contents to a model provider.', { signal: controller.signal, timeout: 60000 }),
        });
        return respond(result);
      } finally { busy = false; active.delete(controller); signal?.removeEventListener('abort', abort); }
    },
  });
  pi.registerCommand('ghidra-status', { description: 'Check local Ghidra runtime without launching Java', handler: async (_args, ctx) => { try { ctx.ui.notify(JSON.stringify(runtimeStatus()), 'info'); } catch (error) { ctx.ui.notify(String(error), 'error'); } } });
  const cancel = () => { for (const c of active) c.abort(); };
  pi.on('session_shutdown', cancel);
  pi.on('session_before_switch', cancel);
  pi.on('session_before_fork', cancel);
  pi.on('session_before_tree', cancel);
}
