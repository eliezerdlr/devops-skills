# Skills recuperadas; runtimes opcionais

Foram recuperadas do histórico Git, com referências, licenças e proveniência:

- `archify`: diagramas HTML sob pedido, com renderer externo pinado.
- `model-resilience`: orientação para fallback de modelos, OmniRoute e router nativo opcional.
- `aws-billing-and-cost-management`: custos e FinOps AWS.
- `aws-site-to-site-vpn`: VPN IPsec AWS.
- `aws-well-architected-review`: revisão AWS com âmbito/evidência explícitos.
- `homelab-wireguard-vpn`: planeamento e diagnóstico WireGuard.
- `netbird-remote-access`: orientação documental, complementar ao conector API.

A contagem atual abaixo inclui também a adição posterior de `skill-creator`, que não faz parte da recuperação original. A skill `teach` foi removida a pedido. Não há runtime novo.

## Descoberta e activação

O pacote principal disponibiliza **119 especialistas + 1 catálogo = 120 recursos de skills**, **8 prompts** e **2 extensões activas**: `ops-orchestrator` e `netbird-api`. Não é necessário instalar os módulos internos separadamente. Com o addon Planning with Files: **121 recursos / 8 prompts / 3 extensões**.

A recuperação não inicia serviços, instala dependências, altera políticas globais, configura credenciais nem faz chamadas a cloud/modelos. A disponibilidade de instruções não equivale a runtime instalado ou acesso autorizado.

### Archify

O adaptador e os pins estão em `integrations/archify/`, mas só são executados mediante pedido e autorização de operação. O renderer é externo: seguir o [guia](install/archify.md). Não há browser, instalação ou execução automática ao carregar a skill.

### OmniRoute e model-resilience

O [contrato](../integrations/omniroute/operational-dependency.json) é condicionado à escolha do perfil `gateway-managed`; não obriga todos os utilizadores do pacote a instalar OmniRoute. O [guia](../integrations/omniroute/README.md) e as receitas de instalação são referências opt-in, não tarefas de arranque.

O código do router nativo foi recuperado em `extensions/model-resilience/`, mas **não está em `pi.extensions` do manifesto principal**. Para optar por esse runtime numa sessão, após rever política, destinatários dos dados, custos e documentação:

```bash
pi -e /caminho/para/devops-skills/extensions/model-resilience/index.ts
```

Requer o SDK Pi do host (incluindo `pi-ai`) e uma política privada explicitamente aprovada via `DEVOPS_MODEL_POLICY`; sem política, o routing permanece desligado. Não criar nem preencher essa política automaticamente. Não acumular o router nativo com fallback do gateway por defeito. Os workers OPS actuais recusam modelos virtuais: esta recuperação não activa routing dentro desses workers. Ver [limites da política](../integrations/omniroute/references/policy.md).

`npm run test:pi:optional` testa o runtime nativo explicitamente com o SDK instalado e transportes sintéticos; não o activa no pacote principal. Testes offline não comprovam disponibilidade de fornecedores ou limites financeiros efectivos.

### AWS, WireGuard e NetBird

As skills são documentais. Operações reais continuam a exigir ferramentas existentes, credenciais locais, âmbito, aprovação e recuperação. A skill NetBird não substitui o [conector API](NETBIRD-API.md): o conector, as confirmações UI e o armazenamento externo do PAT são preservados sem alterações.

## Validação e reversão

```bash
npm test
PI_SDK_ROOT=/caminho/para/SDK-Pi npm run test:pi
PI_SDK_ROOT=/caminho/para/SDK-Pi npm run test:planning
PI_SDK_ROOT=/caminho/para/SDK-Pi npm run test:pi:optional
```

A suite padrão inclui as verificações recuperadas de proveniência, integridade, adaptador Archify com runtime fictício, política/fallback sintéticos e os 41 testes Python da skill NetBird. Não se executam instaladores, API NetBird, AWS, renderer real, gateway ou fornecedores reais.

Validação desta recuperação no Pi 1.4.0: **262 testes padrão, 27 Pi, 11 Planning e 6 do runtime opcional**, todos aprovados, sem skips. As suites Python sintéticas são executadas pelos testes padrão; não foram utilizados serviços ou credenciais reais.

Uma reversão deve remover selectivamente as entradas das skills e documentação recuperadas; não reverter o commit do conector API nem apagar credenciais/estado operacional. Nenhuma configuração local ou global do utilizador é escrita por esta recuperação.
