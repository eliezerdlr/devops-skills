---
name: model-resilience
description: "Configure or troubleshoot bounded model fallback across existing Pi API/OAuth providers and an approved OmniRoute gateway. Opt-in policy, no credential export, no automatic installation or service startup."
---

# Model resilience

Included in the single root package. Read [operations](../../README.md) and [policy](../../references/policy.md) before setup.

1. Ask which providers/accounts may receive this task's data, whether paid fallback is allowed, and the billing limits. Existing API keys and /login subscriptions can remain in Pi.
2. Keep OAuth in the native Pi registry. Never export tokens/cookies to OmniRoute or configure account rotation to evade provider limits/terms.
3. Do not install/start a gateway, alter auth/config globally, select a routing model, or make paid test requests without explicit approval.
4. Use only a private, absolute DEVOPS_MODEL_POLICY file. Validate every provider/model/origin and obtain explicit consent to all fallback recipients. No discovery-driven route additions.
5. OmniRoute is an external service, not a skill runtime installed by the package. Require loopback binding, inference key, approved server-side routes and separate provider billing caps. Do not use its incompatible Pi Apply Config writer.
6. Missing quota does not create tokens. The extension tries each eligible route at most once, within an overall deadline; it stops on auth/context/unclassified errors, timeout, cancellation or any committed text/thinking/tool event. Context repair is delegated to Pi, not model hopping.
7. First release is text-only, thinking off, with a conservative byte guard. Use a physical vision/reasoning model when those features are needed.
8. OPS workers require a real approval dialog disclosing recipient routes, policy hash and logical attempt limits. Unknown virtual routers are refused for workers.
9. Check /devops-routing-status. Trace metadata excludes prompts, provider errors and credentials; winner usage stays unchanged and discarded attempt usage is recorded separately.
10. Never claim absolute availability, a monetary hard cap, actual gateway behavior from mocks, or safe tool replay. Hand off explicitly when all approved routes are exhausted.

See [offline validation](../../../../docs/TESTING.md). Live gateway/account smoke tests are a separate approved step.
