// Adapted from Ponytail 5.3.2 (MIT, Copyright (c) 2026 DietrichGebert).
// Local changes: fixed full/off policy, explicit safety/SLA boundaries, no collector.
export const MODE_ENTRY = 'devops-ponytail-mode';
export const SECTION_KEY = 'devops_ponytail';
export const INSTRUCTIONS = `## DevOps Ponytail — full
Efficiency guidance only; never override project instructions, approval gates or specialist contracts.
For code work, solve the whole requested problem with the smallest clear, maintainable change:
- Read the relevant flow and callers first; identify affected tests, fixtures, config and exports. Avoid unrelated exploration.
- Reuse the project's existing helpers and conventions, then stdlib/native features or installed dependencies before new code. Do not add speculative layers, options or dependencies.
- Preserve types, side effects, error behavior, concurrency and compatibility. Fewer lines is not proof of equivalence; do not code-golf.
- Never cut trust-boundary validation, security, accessibility, data-loss handling, required observability, rollback or recovery. Never skip relevant tests or weaken assertions to save time.
- For non-trivial or risky logic, run proportionate approved checks. Prefer a focused regression over redundant broad work; report failures and unverified assumptions honestly.
- For SLA/incident work, prioritize the scoped safe resolution and restoration evidence; do not claim SLA compliance or token/time savings without measurement. Do not turn diagnosis into unauthorized changes.
- Keep replies concise and avoid repetition, but preserve requested detail, findings, decisions, evidence and risks. Do not truncate required audit or incident reports. State material checks not run and residual risks.
No permission to install, access credentials, call external services, alter infrastructure, commit or publish is granted by this mode.`;

export function parseModeCommand(args) {
    const value = String(args ?? '').trim().toLowerCase();
    if (!value || value === 'status') return 'status';
    if (value === 'on' || value === 'full') return 'full';
    if (value === 'off') return 'off';
    return null;
}

export function restoreMode(entries) {
    if (!Array.isArray(entries)) return 'full';
    for (let i = entries.length - 1; i >= 0; i--) {
        const item = entries[i];
        if (item?.type !== 'custom' || item.customType !== MODE_ENTRY || item.data?.version !== 1) continue;
        if (item.data.mode === 'full' || item.data.mode === 'off') return item.data.mode;
    }
    return 'full';
}

// Legacy Pi fallback: remove only our exact trailing suffix, never arbitrary text.
export function legacyPrompt(prompt, mode) {
    const base = typeof prompt === 'string' ? prompt : '';
    const suffix = `\n\n${INSTRUCTIONS}`;
    const clean = base.endsWith(suffix) ? base.slice(0, -suffix.length) : base;
    return mode === 'off' ? clean : `${clean}${suffix}`;
}
