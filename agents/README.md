# Network agents / Agentes de rede

These ECC definitions are adapted as Pi **prompt templates**, running in the current session. They are not autonomous workers, new executables, enforced tool permissions or a separate model. They do not perform operations simply by being installed.

| Command | Role / Função | Definition |
|---|---|---|
| `/network-architect` | Enterprise/hybrid network design and phased changes | [network-architect.md](network-architect.md) |
| `/network-troubleshooter` | Read-only diagnosis with evidence | [network-troubleshooter.md](network-troubleshooter.md) |
| `/network-config-reviewer` | Read-only router/switch configuration review | [network-config-reviewer.md](network-config-reviewer.md) |

The package manifest registers only these three Markdown files. Register the repository through `pi install /absolute/path/to/devops-skills` or a local `packages` entry in Pi settings. Do not register the entire agents directory separately, which would also expose this documentation README as a command.

## Usage / Utilização

```text
/network-architect Plan two offices connected by VPN. Produce a proposal only; do not connect to devices.
/network-troubleshooter Diagnose this redacted interface output without running network commands.
/network-config-reviewer Review this redacted Cisco configuration without applying changes.
```

Os argumentos são inseridos no prompt como a tarefa. O modelo usa as ferramentas já disponíveis na sessão; este ficheiro não cria um sandbox nem restringe tecnicamente essas ferramentas. Não forneças configurações com passwords, tokens, chaves ou outros segredos.

## Related skills

`network-config-validation`, `network-bgp-diagnostics`, `network-interface-health`, `cisco-ios-patterns`, `netmiko-ssh-automation`, `homelab-network-readiness`, `homelab-network-setup`. Kubernetes workload guidance is separately available as `kubernetes-patterns`.

These are guidance resources, not verified device integrations. Check real platform/version syntax, inventory and authorisation before any live work. Netmiko examples need strict SSH host-key policy reviewed for your deployment. Command restrictions in original ECC metadata are not enforced by Pi prompt loading.

See [test instructions](../docs/TESTING.md), [dependencies](../docs/DEPENDENCIES.md), and [third-party notices](../THIRD_PARTY_NOTICES.md). Original MIT notice is retained in [LICENSE](LICENSE).
