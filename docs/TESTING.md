# Post-pull test / Teste após o pull

Test with synthetic/redacted inputs first. No controller credentials, SSH device access, production changes or dependency installation are needed for initial loading tests.

## 1. Update the checkout

```bash
cd /your/path/devops-skills
git pull --ff-only
```

On a new checkout, clone `https://github.com/eliezerdlr/devops-skills.git` instead. Resolve local changes deliberately; do not force-overwrite them.

## 2. Register resources — choose one method

### Local package (recommended for this test)

```bash
pi install /absolute/path/to/devops-skills
pi list
```

Do not also register the same paths through manual settings. The package loads 99 specialists plus their catalogue, three network role prompts and the ops-orchestrator extension. Optional UniFi integration source is NOT loaded. Orchestration requires Pi 1.2.0 / Node 22.14+; startup makes no worker/provider calls.

### Existing manual settings users

Replace the old pack-specific `skills`/`prompts` path entries with a local `packages` entry in `~/.pi/agent/settings.json`, keeping unrelated preferences and resources:

```json
{
  "packages": ["/absolute/path/to/devops-skills"]
}
```

The package manifest owns resource glob expansion and explicitly lists the three prompt files. Registering just the catalogue directory under `skills` makes Pi stop at its SKILL.md instead of discovering specialists. Do not replace the whole settings file or register the same pack twice. An older copy auto-discovered under ~/.agents/skills can also collide by name; resolve duplicate installations deliberately. Project settings follow Pi's project trust and path resolution rules.

## 3. Reload and check discovery

Inside Pi:

```text
/reload
/skill:engineering-skills
```

Check startup/reload diagnostics for duplicates, invalid frontmatter or missing paths. For package installation, inspect enabled resources in `pi config` if necessary. Confirm the catalogue includes the eight ECC additions.

## 4. Smoke-test a skill without infrastructure

```text
/skill:network-interface-health Explain how you would investigate increasing CRC counters on a switch uplink. Use hypothetical data only, do not run commands or contact devices.
```

Expected: an evidence-based diagnostic plan that distinguishes historical counts from increments and suggests checking both link ends. No network connection or configuration change.

## 5. Smoke-test the three role prompts

```text
/network-architect Propose a hypothetical two-office network with a management VLAN and site-to-site VPN. Do not execute commands or contact infrastructure.
/network-troubleshooter Hypothetical case: an uplink's CRC counter increases from 10 to 900 in five minutes. Ask for missing evidence and propose read-only checks; execute nothing.
/network-config-reviewer Review only this synthetic snippet: line vty 0 4; transport input telnet; login local. Do not execute commands or apply changes.
```

Expected:
- Commands expand as templates and receive your task text.
- The model follows the appropriate role in the SAME session, not a newly spawned subagent.
- Design output identifies assumptions and recovery needs; diagnosis separates evidence from hypotheses; config review identifies management exposure without applying a fix.
- No provider/model switch or tool permission isolation is claimed.

Model output is not deterministic. Resource discovery and prompt expansion are necessary checks, not proof of technical correctness or safe production behaviour.

## 6. Test the executable orchestration separately

```bash
npm test
PI_SDK_ROOT="$(npm root -g)/@earendil-works/pi-coding-agent" npm run test:pi
```

Expected: **29 engine tests + 20 actual Pi loader/core tests**, using simulated model transport only. No provider authentication, infrastructure or SDK installation into the pack is required. For a non-npm Pi installation, set PI_SDK_ROOT to the actual installed SDK directory.

For an explicitly authorised live-model smoke test, ask the parent to submit `workflows/network-review.json` to `ops_workflow`. This uses synthetic evidence, requires a real confirmation and may incur provider charges. Refuse the first confirmation and verify zero workers start; repeat and approve only if the displayed provider/model and scope are correct. Check `/ops-status`. Do not claim device tests happened.

This live UI/provider test has **not** been performed automatically. See [ORCHESTRATION.md](ORCHESTRATION.md) for boundaries, failure semantics and unsupported cases.

## 7. Record results before live use

Record Pi version, registration method, discovered resources, warnings, each prompt used and observed behaviour. If a resource is missing, capture the diagnostic (without credentials). Test actual OS/vendor commands and task dependencies separately in a lab with explicit authorisation.

Live SSH/Netmiko, BGP, VLAN, firewall, Kubernetes and cloud actions need target/version verification, least-privilege access and appropriate approval. The UniFi helper remains unmodified under `integrations/` and must not be used unchanged for company administration.

## Optional persistent planning integration

The optional upstream package is not loaded by the base registration above. Follow [its activation guide](../integrations/planning-with-files/README.md) deliberately; use `notify` initially and keep each operations-workflow approval separate.

```bash
PI_SDK_ROOT="$(npm root -g)/@earendil-works/pi-coding-agent" npm run test:planning
```

Eleven additional tests passed using both the installed host SDK and a fresh temporary official Pi 1.2.0 SDK. Combined optional/base discovery returned 101 skill resources, three prompts and two extensions, without skill diagnostics or command collisions. Strict checking of the optional extension passed with TypeScript 5.9.3. No model calls, history recovery scripts, periodic ticks or global configuration edits were performed. This does not assert the full upstream Vitest suite passed.

## What has and has not been verified

Local preparation verified metadata/catalogue paths, scoped licences, exact copies of the eight selected upstream skills, and manifest resources. An offline test using the installed Pi 1.2.0 package resolver and actual skill/prompt loaders discovered all 100 skill resources (99 specialists plus catalogue), including the subsequently added dsh-error-handling and exactly three network role prompts with no package diagnostics; all three commands substituted their task arguments correctly. The test used temporary/in-memory configuration, filtered out existing home resources, invoked no model, and contacted no infrastructure. An initial unfiltered test detected the existing home catalogue as a duplicate, which is why duplicate-install checks matter. The extension additionally passed 29 engine tests and 20 tests using the real Pi loader/core with synthetic provider streams, including a three-stage workflow, provider identity pinning, cancellation and shutdown. Strict TypeScript checking passed against Pi 1.2.0 declarations with TypeScript 5.9.3. These checks are not a full interactive clean-machine test, a model-quality assessment, live-provider authentication test, real-device validation or an independent Snyk/Gen security assessment.
