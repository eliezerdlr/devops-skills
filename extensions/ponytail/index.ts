// Local minimal Pi adapter of Ponytail principles. Source/licence: integrations/ponytail/.
import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { INSTRUCTIONS, MODE_ENTRY, SECTION_KEY, legacyPrompt, parseModeCommand, restoreMode } from './policy.mjs';

type Mode = 'full' | 'off';

export default function ponytail(pi: ExtensionAPI) {
    let mode: Mode = 'full';

    const status = (ctx: ExtensionContext) => {
        if (ctx.hasUI) ctx.ui.setStatus('devops-ponytail', `Ponytail: ${mode}`);
    };
    const restore = (_event: unknown, ctx: ExtensionContext) => {
        mode = restoreMode(ctx.sessionManager.getBranch());
        status(ctx);
    };

    pi.on('session_start', restore);
    pi.on('session_tree', restore);
    pi.on('session_shutdown', (_event, ctx) => {
        mode = 'full';
        if (ctx.hasUI) ctx.ui.setStatus('devops-ponytail', undefined);
    });

    pi.registerCommand('ponytail', {
        description: 'Ponytail full by default. /ponytail [status|full|on|off]; branch-local mode only.',
        handler: async (args, ctx) => {
            const requested = parseModeCommand(args);
            if (!requested) {
                if (ctx.hasUI) ctx.ui.notify('Use /ponytail status, full, on or off. No global defaults are changed.', 'warning');
                return;
            }
            if (requested !== 'status' && requested !== mode) {
                // Persist only explicit mode changes via Pi, before changing live state.
                pi.appendEntry(MODE_ENTRY, { version: 1, mode: requested });
                mode = requested;
            }
            status(ctx);
            if (ctx.hasUI) ctx.ui.notify(`Ponytail: ${mode}. New sessions default to full; permissions and safety gates are unchanged.`, 'info');
        },
    });

    pi.on('before_agent_start', (event) => {
        // Structural shape also compiles against older host peers; Pi 1.4.0 is verified.
        const options = (event as unknown as { systemPromptOptions?: { sections?: Record<string, string> } }).systemPromptOptions;
        if (options?.sections && typeof options.sections === 'object' && !Array.isArray(options.sections)) {
            if (mode === 'off') delete options.sections[SECTION_KEY];
            else options.sections[SECTION_KEY] = INSTRUCTIONS;
            return;
        }
        // Old hosts have no structured sections; preserve their prompt, append once.
        if (mode === 'off' && !event.systemPrompt?.endsWith(`\n\n${INSTRUCTIONS}`)) return;
        return { systemPrompt: legacyPrompt(event.systemPrompt, mode) };
    });
}
