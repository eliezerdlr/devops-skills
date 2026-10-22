# Um pacote, uma instalação / One package, one installation

Na versão **0.5.0**, o manifesto raiz inclui todos os recursos aprovados:

| Recurso | Quantidade | Disponibilidade |
|---|---:|---|
| Skills especialistas | **113** | 99 anteriores + 14 aprovadas, todas no pacote principal |
| Catálogo | 1 | engineering-skills; 114 recursos de skills ao todo |
| Prompts de papéis | **8** | 3 rede, 3 segurança, 2 testes/performance |
| Extensões | 2 | ops-orchestrator + model-resilience; routing sem política explícita permanece inativo |

As pastas em `integrations/` são módulos internos que preservam fontes, referências, licenças e testes. **A estrutura modular não exige instalar cada módulo.** O contrato de testes garante que o manifesto principal inclui todos os seus entrypoints aprovados, sem descobrir os snapshots upstream.

## Instalação normal

```bash
pi install /caminho/absoluto/devops-skills
```

No Pi:

```text
/reload
/skill:engineering-skills
```

Se a raiz já está registada, basta atualizar o checkout e recarregar. Não voltar a instalar por outro método. Verificar `pi list` e avisos de descoberta; filtros configurados em `pi config` podem desativar recursos intencionalmente.

Exemplo de configuração, a integrar nos settings existentes sem substituir outros campos:

```json
{
  "packages": ["/caminho/absoluto/devops-skills"]
}
```

## Migrar registos anteriores por módulo

1. Confirma primeiro que a **raiz** está registada. Preserva uma cópia da configuração existente e as preferências/filtros que queres manter.
2. Em `pi list`, identifica entradas separadas para os quatro módulos abaixo. Remove apenas as entradas que existirem, usando a origem/caminho realmente registado:

```bash
pi remove /caminho/absoluto/devops-skills/integrations/graphify
pi remove /caminho/absoluto/devops-skills/integrations/security-audit
pi remove /caminho/absoluto/devops-skills/integrations/addy-engineering
pi remove /caminho/absoluto/devops-skills/integrations/web-quality
```

3. Não remover a entrada raiz. Não remover outros pacotes, Planning with Files ou preferências sem motivo. Se as entradas foram escritas manualmente, remove apenas essas entradas na configuração correspondente, mantendo a raiz e os restantes campos.
4. Recarrega o Pi e confirma as skills/prompts abaixo. Se existe outra cópia externa com os mesmos nomes, resolve essa duplicação deliberadamente; não apagues diretórios de configuração em bloco.

Os manifestos dos módulos ficam como inventários internos/compatibilidade com configurações antigas, não como quatro instalações exigidas. Remover a entrada antiga não apaga os ficheiros do módulo, grafos, relatórios, planos ou programas externos.

**Esta alteração do repositório não edita as tuas configurações globais automaticamente.**

## Verificação funcional por capacidade

| Necessidade | Entrada incluída | O que verificar |
|---|---|---|
| Engenharia/contexto | `/skill:context-engineering`, `/skill:constraint-driven-development`, `/skill:source-driven-development`, `/skill:code-simplification` | Aplica a tarefa selecionada, não instala ferramentas nem cria loops |
| Web/marketing | `/skill:web-seo`, `/skill:web-quality-audit`, `/skill:web-performance`, `/skill:core-web-vitals`, `/skill:web-accessibility`, `/skill:web-best-practices` | Usa evidência fornecida ou ferramentas autorizadas; métricas ausentes são indisponíveis |
| Segurança | `/skill:security-audit`; `/security-hunter`, `/security-verifier`, `/security-coverage-critic` | Orientação focada por defeito, não uma auditoria ou workers automáticos |
| Testes/performance | `/test-engineer`, `/web-performance-auditor` | Papéis na sessão atual, não isolamento de permissões |
| Contexto do projeto | `/skill:graphify` | Skill disponível; mapas exigem CLI externo preparado |
| Rede | `/network-architect`, `/network-troubleshooter`, `/network-config-reviewer` | Prompts atuais; workers independentes só via ops_agent/ops_workflow e aprovação |

## Disponível não significa executar tudo no arranque

Pi anuncia nome/descrição e carrega instruções completas sob demanda. As 113 skills não iniciam 113 processos ou agentes. O manifesto não instala ferramentas ou credenciais; a extensão de routing carrega inativa sem política; não há novos hooks nem chamadas a modelos no arranque.

Dependências de workflows continuam explícitas, como em qualquer ferramenta DevOps:

- **Graphify:** CLI externo graphifyy==0.9.93, preparado com pipx/uv por um operador; [guia](../integrations/graphify/README.md). A skill já está incluída, mesmo quando o CLI não existe.
- **Web:** browser/Lighthouse/axe/MCP aprovados ou relatórios existentes; não instalar por surpresa. Sem dados reais, não há certificação de métricas/WCAG/SEO.
- **Segurança:** os validadores Node estão incluídos; executar o código do alvo exige o sandbox e as autorizações documentadas. Prompts não implementam isolamento.
- **Cloud/IT/rede:** CLI, versões, contas e acesso são requisitos por tarefa, não bootstrap automático.

Duas exclusões mantêm uma razão operacional concreta: **Planning with Files** inclui hooks/processos próprios e permanece um addon de runtime opt-in; **UniFi** continua não aprovado e fora do carregamento. Não são dependências ocultas das 113 skills principais.

## Testar o contrato único

```bash
npm test
PI_SDK_ROOT=/caminho/do/pi-coding-agent npm run test:pi
```

`npm test` executa o contrato do pacote e as suítes das capacidades aprovadas, não apenas o motor de rede. O teste Pi deve descobrir **114 recursos de skills, 8 prompts e 2 extensões** com apenas a raiz. Não são chamadas APIs reais nem infraestrutura.

A suíte de planeamento é separada porque ativa um runtime adicional em ambiente de teste:

```bash
PI_SDK_ROOT=/caminho/do/pi-coding-agent npm run test:planning
```

Ela deve descobrir 115 recursos de skills, 8 prompts e 3 extensões quando o addon é selecionado. Descoberta correta não comprova qualidade de respostas de modelos, credenciais ou testes em produção.

## English summary

Version 0.5.0 has one public installation entrypoint: the repository root. It includes 113 specialist skills, their catalogue, eight prompts and orchestration plus explicit opt-in routing extensions. Internal modules retain attribution and supporting files but require no separate registration. Remove only legacy module registrations after confirming the root, preserve other settings, and reload. External tools remain explicit workflow prerequisites; no hidden installs, new hooks or automatic audits are introduced.

## Adições em 0.5.0

`/skill:model-resilience` e `/skill:archify` pertencem à raiz. A extensão adicional `model-resilience` apenas regista routing com política explícita e não muda o modelo selecionado. O serviço OmniRoute e o runtime Archify são externos; não são instalados/iniciados pelo pacote. No perfil operacional escolhido `gateway-managed`, OmniRoute é dependência externa gerida pelo operador com painel; o gateway controla fallback e o router virtual Pi fica desligado. O [contrato operacional](../integrations/omniroute/operational-dependency.json), referenciado pelo manifesto raiz, não afirma instalação ou homologação. As skills continuam a carregar sem o serviço. Guias: [routing](../integrations/omniroute/README.md) e [diagramas](../integrations/archify/README.md).
