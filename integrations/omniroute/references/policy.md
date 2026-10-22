# Routing policy v1 — contract

`DEVOPS_MODEL_POLICY` is an operator-provided absolute path, never discovered in project files. No shell commands, credentials, automatic installation, model requests or provider discovery occur at extension load. Missing/invalid policy leaves the extension inert with a status command. The final file must be regular, <=64 KiB and not a symlink; parents and filesystem permissions remain the operator's trust boundary. Keep it private and outside version control.

All fields in `../examples/policy.example.json` are required; unknown fields, duplicates of a provider/model route, invalid prices/ranges, routing cycles, unknown billing modes and placeholders are refused. Policy ID/hash is canonical SHA256. Profiles are immutable for the loaded extension lifetime.

| Field | Enforcement |
|---|---|
| `routes` | 1–6 explicit physical provider/model IDs, evaluated in order; no discovery or account rotation. Each eligible route is attempted once. Missing credentials are skipped, not extracted/copied. |
| `origin` | Exact origin pin against both catalog model.baseUrl and effective model.baseUrl in the SDK pre-send payload hook (after native auth resolution); HTTPS or HTTP `127.0.0.1`/`[::1]`, no userinfo/query/fragment. Endpoint paths are provider-managed. Origin pin cannot govern a gateway's internal routing. |
| `billing` | `subscription` requires native registry OAuth **and** provider auth.oauth.isSubscription=true; `metered` requires `allowMetered=true`. OAuth subscription pricing/terms are still operator responsibilities. |
| `supportsTools` | Explicit operator assertion; a tool-bearing request cannot use a false route. Requires a separate real-provider tool compatibility test before production. |
| `gatewayPolicyApproved` | Required true for the reserved `omniroute` provider, only after operator server-side review. Other custom proxy providers also require operator review; a renamed proxy cannot be detected automatically. |
| `maxAttempts` | 1–4 logical upstream calls per inference request, no more than route count. The engine asks for SDK `maxRetries=0`; provider/gateway-internal behavior may differ. Not a session-wide quota. |
| `deadlineMs` / `attemptTimeoutMs` | 1–120 seconds total and per-attempt bound. Cancellation/deadline terminates routing, not another attempt. Uncooperative cleanup is not awaited. Providers must honor abort to stop underlying resource use. |
| `contextWindow` | 8192–2000000 conservative advertised limit on both virtual and transport model; candidates with smaller catalog limits are skipped. |
| `maxOutputTokens` | 256–32768 and <=half context; clamps forwarded output allowance and candidate capability. |
| `maxInputBytes` | Positive and <=context-output-1024. UTF-8 serialized request guard; deliberately treats bytes conservatively, not an exact provider tokenizer. Direct worker calls do not compact. A rejected request needs smaller evidence/context. |
| Price ceilings | Nonnegative finite input/output USD per million ceilings, max 1000. Metered candidate catalog input/cache read/cache write and output prices must be within the ceilings. Catalog/custom gateway prices may be stale/estimates. **Not a monetary hard cap.** Configure hard billing caps at provider/gateway. |

## Failure/stream contract

Only recognizable quota exhaustion, 429/rate limits and selected 5xx/overload failures can move to another approved route **before commit**. Auth, unknown errors, context errors, cancellation and timeouts stop. The host may compact/retry a pre-output context error. Quota errors such as `insufficient_quota` are handled by this transport, not by falsifying the Pi error classifier.

A `start` event is held. Any subsequent content/thinking/tool event commits the stream and flushes it; fallback is then forbidden. Visible content in a terminal error also prevents fallback. Partial/error and exhausted-chain responses use stable non-transient diagnostics so the host does not retry the whole chain. No tool execution is replayed by the router. An operator manually retrying a failed task must review its side effects first.

Text-only and thinking **off** in this first release: no false promise of universal vision/reasoning compatibility. Image-bearing transcripts are rejected. A 2 MiB wrapper output bound prevents unbounded forwarding; it is not an OS memory sandbox for providers.

## Credentials, evidence and accounting

Every physical call uses `ctx.modelRegistry.streamSimple`; this preserves provider-native API/OAuth authentication and refresh. Native OAuth refresh can persist renewed credentials through the host's normal behavior; the extension never reads credential files or exports those tokens. Transport `apiKey`, `headers`, `env` and `baseUrl` overrides are removed before switching providers. Instrumentation hooks pass to the physical request, not a second raw HTTP client.

Successful winner provider/api/model, content/signatures and usage are preserved. Upstream `length` is converted to a terminal non-recoverable error while preserving its content/usage and recording upstreamStopReason=length, so Pi cannot compact/replay a truncated response after visible output. Failed-attempt reported usage is **separate**, in bounded in-memory status and `devops.model-routing-attempt` session custom entries, never added to the winner's numbers. These entries contain policy hash, route IDs, outcome and finite observed usage, not prompts/provider error strings/credentials. Missing usage does not mean a failed request was free. Transport/virtual catalog zero prices are synthetic placeholders, not a free-model claim; Pi's winner usage alone is not complete aggregate routing spend.

OPS approvals disclose all configured route recipients/origins/billing, logical attempt ceiling and hash. Their fingerprint binds plan + selected model + disclosed policy. A changed policy file/ID prevents new worker approval until reload. Unknown virtual routers are refused for OPS workers rather than silently enlarging their recipient/budget authorization. There is no promise of endless capacity; stop and hand off when all authorized routes fail.

## Evidence/version boundary

Tested host: Pi 1.3.0, Node >=22.14. See `UPSTREAM.json` for OmniRoute 3.8.53 source evidence. Gateway runtime, OAuth real accounts, real billing and inference authorization posture remain unverified until separately approved live smoke tests. No retries are a licence to bypass provider restrictions.

### Supported adapter/endpoint trust boundary

Initial direct adapter APIs: openai-completions, openai-responses, openai-codex-responses and anthropic-messages. Other APIs (including environment-derived cloud endpoints) are blocked pending adapter-specific review; use an approved OpenAI-compatible gateway where appropriate. The native provider must honor the SDK pre-send onPayload contract. A missing hook cannot produce success/fallback; a mismatched effective origin throws before a compliant adapter sends inference. Native auth redirects to a different origin are blocked, even when legitimate; configure/review a compatible endpoint rather than relaxing pins silently.

The hook validates the **initial request model endpoint**, not a network firewall. Host/provider code, HTTP redirect/proxy behavior and the approved service are trusted; malicious/non-compliant custom adapters cannot be sandboxed by this extension. Strict network egress guarantees require separately enforced OS/network controls. OAuth refresh is native host behavior and does not carry task evidence.
