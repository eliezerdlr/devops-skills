---
name: model-resilience
description: "Configure or troubleshoot bounded model fallback across existing Pi API/OAuth providers and an approved OmniRoute gateway. Opt-in policy, no credential export, no automatic installation or service startup."
---

# Model resilience

Included in the single root package. Read [operations](../../README.md) and the [external dependency contract](../../operational-dependency.json) before setup. The selected profile is **gateway-managed**: an operator-installed OmniRoute with its dashboard, physical gateway model selection and gateway-owned fallback. Keep DEVOPS_MODEL_POLICY unset and the Pi virtual router off in that profile. No service is installed or started by this package; the analyzed source version is not proof of an installed/validated runtime.

For the alternative **native Pi router** only, read [policy](../../references/policy.md); its limits and approval metadata do not automatically apply to physical gateway models. Do not stack both fallback owners by default.

1. Ask which providers/accounts may receive this task's data, whether paid fallback is allowed, and the billing limits. Existing API keys and /login subscriptions can remain in Pi.
2. Keep OAuth in the native Pi registry. Never export tokens/cookies to OmniRoute or configure account rotation to evade provider limits/terms.
3. Do not install/start a gateway, alter auth/config globally, select a routing model, or make paid test requests without explicit approval.
4. Only for native Pi fallback, use a private, absolute DEVOPS_MODEL_POLICY file. Validate every provider/model/origin and obtain explicit consent to all fallback recipients. No discovery-driven route additions.
5. OmniRoute is an external operational dependency of the selected profile, not an npm/skill runtime installed by the package. Require loopback binding, protected dashboard, inference key, verified credential encryption with a recoverable storage key, approved server-side routes and separate provider billing caps. Remote access needs an explicitly configured TLS/auth proxy and mesh ACL; loopback is not remotely reachable just because a VPN exists. Do not use its incompatible Pi Apply Config writer.
6. Missing quota does not create tokens. In native Pi mode, the extension tries each eligible route at most once, within an overall deadline; it stops on auth/context/unclassified errors, timeout, cancellation or any committed text/thinking/tool event. Context repair is delegated to Pi, not model hopping.
7. The native Pi router's first release is text-only, thinking off, with a conservative byte guard. Use a physical vision/reasoning model when those features are needed.
8. Native-router OPS workers require a real approval dialog disclosing recipient routes, policy hash and logical attempt limits. Unknown virtual routers are refused for workers. For physical gateway models, approve the internal server policy separately: the Pi dialog does not enumerate the gateway's hidden recipients.
9. Check /devops-routing-status (Routing disabled is expected for gateway-managed; it is not gateway health). Trace metadata excludes prompts, provider errors and credentials; winner usage stays unchanged and discarded attempt usage is recorded separately.
10. Never claim absolute availability, a monetary hard cap, actual gateway behavior from mocks, or safe tool replay. Hand off explicitly when all approved routes are exhausted.

See [offline validation](../../../../docs/TESTING.md). Live gateway/account smoke tests are a separate approved step.
