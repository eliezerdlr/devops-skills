# DevOps Skills

**Português** | [English](README.en.md)

Pack de skills para engenharia, DevOps, cybersecurity e operações de IT.

Um único pacote com **113 skills/sub-skills**, **8 prompts** de rede, segurança, testes e performance, e duas extensões, incluindo **subagentes reais e workflows declarativos de análise**. As skills estão organizadas no [índice principal](skills/engineering-skills/SKILL.md). Cada skill contém instruções e, quando aplicável, scripts, referências e assets.

## 1. Pré-requisitos

- Pi **1.2.0** e Node.js **22.14+** para a orquestração; fornecedor/modelo autenticado.
- Git, para obter e atualizar o repositório.
- Ferramentas específicas apenas para as tarefas que fores executar; consultar [dependências e compatibilidade](docs/DEPENDENCIES.md).

As skills são instruções, não serviços. O pacote carrega as extensões de orquestração e routing opt-in; revê o [âmbito, aprovações e limites](docs/ORCHESTRATION.md). Não instala Terraform, kubectl, Python, browsers ou credenciais.

## 2. Ativar as skills no Pi

Depois de clonar este repositório, escolhe **uma** das opções seguintes. Não registes a mesma cópia por vários métodos, para evitar nomes duplicados.

### Opção A — Registar o caminho em settings.json

Edita `~/.pi/agent/settings.json` e acrescenta o checkout como pacote local à lista `packages` existente:

```json
{
  "packages": ["/caminho/absoluto/devops-skills"]
}
```

Substitui o caminho pelo local real do checkout. **Não substituas o ficheiro inteiro** se já contém configurações: preserva os restantes campos e caminhos.

O [exemplo de configuração](examples/pi-settings.json) usa `~/devops-skills`; ajusta-o se clonaste para outra pasta. O manifesto principal seleciona as 113 skills, o catálogo, os 8 prompts e duas extensões, incluindo todos os módulos aprovados sob integrations/. Não registes apenas a pasta do índice em `skills`: o carregador Pi para de descer ao encontrar um SKILL.md numa pasta.

### Opção B — Instalar o checkout como pacote Pi

```bash
pi install /caminho/absoluto/devops-skills
pi list
```

O manifesto `package.json` regista todas as skills aprovadas, os 8 prompts e as extensões `ops-orchestrator` e `model-resilience`, numa única instalação. Não inclui hooks, temas nem scripts de instalação. O Pi fornece as dependências da extensão; não é necessário executar `npm install` na raiz.

Depois da publicação, podes instalar diretamente a partir do GitHub:

```bash
pi install git:github.com/eliezerdlr/devops-skills
```

Escolhe este método ou um dos métodos locais acima, sem duplicar o registo.

### Recarregar e verificar

Dentro do Pi:

```text
/reload
/skill:engineering-skills
```

O segundo comando abre o catálogo. Para selecionar uma especialidade diretamente:

```text
/skill:senior-devops Rever este pipeline e propor melhorias, sem executar alterações.
```

Confirma os avisos de carregamento. Se faltar uma skill, verifica caminho, permissões, duplicações e formato do SKILL.md. Se usares pacote, confirma também `pi list` e os recursos habilitados em `pi config`. Configurações de projeto podem exigir confiança no projeto.

Pi anuncia os nomes/descrições das skills e carrega as instruções detalhadas conforme a tarefa. Não é necessário carregar todas as instruções de uma vez.

**Já tinhas registado módulos separadamente?** Segue a [migração para o pacote único](docs/UNIFIED-PACKAGE.md). Não precisas de instalar Graphify, Security Audit, Addy Engineering ou Web Quality como pacotes Pi adicionais.

## 3. Ativar capacidades operacionais

**As 113 skills ficam disponíveis com o único registo acima.** Executar os seus workflows pode exigir preparação adicional:

| Capacidade | Preparação separada |
|---|---|
| Mapas Graphify | CLI externo `graphifyy==0.9.93` preparado manualmente; a skill já está incluída |
| Scripts Python | Interpretador compatível; bibliotecas opcionais em ambiente isolado, conforme o script |
| Terraform/cloud | CLI escolhida, autenticação, conta/projeto correto e permissões |
| Kubernetes/containers | kubectl ou Docker/Compose, configuração e acesso ao ambiente pretendido |
| Testes de browser | Playwright e browsers do projeto, ou Chrome/Chromium para CDP, conforme a skill |
| Microsoft 365/Google Workspace | Ferramentas, módulos, OAuth e permissões do tenant |
| MCP BrowserStack/TestRail | Instalação/configuração própria das integrações, credenciais e revisão antes de ativar |

Não há um comando que instale e autentique tudo com segurança. Não faças instalação recursiva de todos os `package.json`: há fixtures de teste que não são aplicações para instalar.

O guia [DEPENDENCIES.md](docs/DEPENDENCIES.md) distingue bibliotecas opcionais, exemplos, serviços externos, limitações de plataforma e validações já realizadas.

### Desenvolvimento com Deep Agents

A skill [deep-agents-core](skills/engineering-skills/deep-agents-core/SKILL.md), do projeto LangChain, orienta o desenvolvimento de aplicações com Deep Agents. Não instala o framework nem acrescenta subagentes ou memória ao Pi. Consulta as [dependências e limites dos exemplos](docs/DEPENDENCIES.md#deep-agents-core-langchain) antes de executar código.

### Fiabilidade e tratamento de erros

A skill [dsh-error-handling](skills/engineering-skills/dsh-error-handling/SKILL.md), do DeepSeek Harness, acrescenta orientação para falhas estruturadas, recuperação, retries seguros e resultados verificáveis. Incluímos apenas as instruções Markdown, sem instalar o runtime DeepSeek ou alterar as ferramentas do Pi.

### Agentes de rede ECC

Incluímos oito skills ECC e três agentes adaptados como prompts Pi: `/network-architect`, `/network-troubleshooter` e `/network-config-reviewer`. O método `pi install` e a entrada `packages` no `settings.json` registam ambos através do manifesto.

São papéis na sessão atual, **não subagentes autónomos nem isolamento de permissões**. Consulta o [índice dos agentes](agents/README.md) e o [teste após o pull](docs/TESTING.md).

### Subagentes reais e workflows de análise

As ferramentas `ops_agent` e `ops_workflow` executam os papéis ECC em instâncias independentes do núcleo Pi, com contexto próprio e **sem ferramentas de shell, ficheiros, MCP ou infraestrutura**. Workflows encadeiam diagnóstico → proposta → revisão; não executam alterações.

Cada execução exige confirmação real pela UI, identifica o modelo/fornecedor e tem limites de concorrência, tempo e saída. Sem UI, a execução é recusada. Usa `/ops-status` e `/ops-cancel <id>` para acompanhar/cancelar. Não há chamadas a modelos no arranque.

Ver [instalação, utilização, desativação e limites](docs/ORCHESTRATION.md) e o [workflow sintético](workflows/network-review.json). Os testes locais incluem o carregador/núcleo Pi real com transporte de modelo simulado; não é certificação de produção nem teste contra equipamentos reais.

### Planeamento persistente — Planning with Files

Integração **opcional**, com o pacote Pi upstream 3.24.0 preservado e licença MIT. Acrescenta `task_plan.md`, `findings.md` e `progress.md` para continuidade entre sessões. Não retoma automaticamente os workers nem substitui as aprovações do orquestrador.

Ver [ativação, fluxo combinado e riscos dos hooks](integrations/planning-with-files/README.md). Não é carregada por defeito: regista o pacote opcional explicitamente e começa em `notify`. **11 testes adicionais passaram** no Pi 1.2.0; não houve chamadas reais a modelos nem alteração de configurações globais.

### Engenharia e qualidade web/SEO — incluídas no pacote

Dois módulos MIT já registados pelo manifesto principal; não exigem instalação Pi separada:

- [Addy Engineering](integrations/addy-engineering/README.md): quatro skills adaptadas de constraints, contexto, fontes oficiais e simplificação; duas personas como prompts, não sub-agents autónomos. ADRs e revisão adversarial ficam como referências complementares.
- [Web Quality & SEO](integrations/web-quality/README.md): seis skills para auditoria web, performance, Core Web Vitals, acessibilidade, SEO técnico/on-page e boas práticas. Inclui referências de produto/dados estruturados/internacionalização úteis ao marketing.

As dez skills e os dois prompts fazem parte dos 113 especialistas e 8 prompts do pacote. O carregamento não instala ferramentas, hooks, browsers/MCP ou analytics. Referências completas da seleção não significam enforcement, métricas medidas, certificação WCAG ou resultados de ranking. A integração web não é uma plataforma completa de marketing/anúncios; os limites e exemplos que exigem cautela estão nos guias.

### Auditoria de segurança — incluída no pacote

A [integração Security Audit](integrations/security-audit/README.md), adaptada do projeto Cloudflare sob MIT, acrescenta uma skill de revisão baseada em evidências, referências por domínio e três prompts incluídos: hunter, verifier e coverage critic. Inclui schema, validadores sem dependências externas e testes upstream preservados.

**Orientação focada é o padrão**; auditorias completas exigem pedido explícito, âmbito, perfil e orçamento. Os prompts correm na sessão atual, não criam sub-agents. Execução de código do alvo exige sandbox imposto pelo SO; a integração não fornece esse isolamento. A skill e os prompts são carregados pelo manifesto principal; não requerem registo separado.

### Contexto de projeto — skill Graphify incluída

Incluímos uma [skill Graphify adaptada](integrations/graphify/README.md), com referências de consultas, memória explícita e atualização incremental, mais dois workflows de mapeamento/retoma. **A skill é carregada pelo manifesto principal**, sem registo Pi adicional. Não inclui agents, sub-agents, runtime Python, guard, hooks nem captura automática de sessões.

A dependência externa é preparada manualmente; não há instalação automática nem extração semântica implícita. Para continuidade, reutiliza os handoffs existentes de planeamento/TC. Conteúdo adaptado sob Apache-2.0, com proveniência e avisos preservados. Os testes estruturais não equivalem a validação fim a fim nem comprovam poupança de tokens.

### O que não está ativado/incluído
- Definições de agentes Markdown não se tornam subagentes Pi automaticamente.
- Hooks originais de outros agentes não são ativados por este pack.
- Snyk Agent Scan e Sage não são distribuídos nem instalados pelo pack.
- Não há credenciais, acesso automático à infraestrutura ou alteração de SYSTEM.md/AGENTS.md.

### UniFi — integração opcional em revisão

O projeto original está em [integrations/unifi-skills](integrations/unifi-skills/README.md), com cinco skills e um helper Python. **Não é carregado pelo manifesto Pi deste pack** e não entra na contagem das 113 skills principais.

**Não utilizar sem revisão em produção:** o helper original desativa a verificação TLS, permite escritas por defeito e pode expor dados sensíveis em respostas/dry-run. As correções e os testes nos equipamentos reais ainda não foram realizados. Publicar os ficheiros não significa aprovação operacional. Não executar exemplos contra a rede empresarial com credenciais administrativas.

## 4. Atualizações

Na pasta do checkout:

```bash
git pull --ff-only
```

Revê as alterações antes de as carregar e resolve modificações locais deliberadamente; o comando não deve sobrescrevê-las à força. Depois, no Pi:

```text
/reload
```

Para cópias geridas diretamente por uma origem Git em `pi install`, usa o mecanismo de atualização de pacotes da versão instalada do Pi; refs fixadas não avançam automaticamente para uma nova versão.

## 5. Segurança e estado de validação

As skills incluídas **não passaram por análise oficial de segurança**. Verificação de estrutura, sintaxe ou licença não garante segurança nem funcionamento completo. A descoberta de recursos e a orquestração com transporte simulado foram testadas no Pi 1.2.0; fornecedores reais, instalação limpa interativa e workflows de infraestrutura com dependências reais ainda precisam de validação autorizada.

Antes de executar scripts ou ações: revê o conteúdo, confirma ferramentas e âmbito, começa por diagnóstico só de leitura e exige aprovação, plano de rollback e janela apropriada para alterações de produção. Não guardes segredos nas skills ou neste Git.

## 6. Licença e atribuições

O conteúdo original é redistribuído principalmente sob MIT; a integração Graphify adaptada mantém Apache-2.0 e avisos próprios. Os avisos estão preservados em [LICENSE](LICENSE), nas licenças das subpastas e em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Este é um pack curado/adaptado, não uma declaração de autoria exclusiva nem de associação oficial aos autores, à Snyk ou à Gen Digital.

As novas contribuições locais independentes são também disponibilizadas sob MIT, por decisão do mantenedor; as adaptações Graphify conservam a licença indicada na integração. Os copyrights dos componentes originais permanecem preservados.

## Disponibilidade de modelos e comunicação visual

- **[Model resilience / OmniRoute](integrations/omniroute/README.md):** fallback explícito entre providers API e subscrições `/login` existentes. Pi **1.3.0**, política privada e seleção do modelo virtual são necessários; sem política, a extensão permanece inativa. Nenhum token OAuth é exportado. Gateway externo, loopback + chave e destinatários/custos aprovados.
- **[Archify](integrations/archify/README.md):** diagramas HTML interativos sob pedido, com adaptador plan/execute e runtime externo **3.2.0** pinado. Símbolos genéricos por defeito; sem logos empresariais/marketing sem direitos confirmados. Sem abrir browser ou executar JavaScript fornecido como candidato.

Ambas as skills já estão incluídas na única instalação raiz. Os testes de integração usam mocks; ativação de contas/gateway, pedidos pagos e execução real Archify são passos separados, mediante aprovação. O fallback inicial é text-only, thinking off, e não garante tokens infinitos nem um teto financeiro real.
