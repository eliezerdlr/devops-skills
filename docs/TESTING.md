# Verificar o pacote unificado / Unified package testing

## Follow-up F11 / G01–G04

The five follow-up contracts in `tests/audit-governance.test.mjs` run in the mandatory npm gate. They check honest scanner scope, CI coverage of every registered root extension plus Planning, manifest-derived documentation counts, historical/current separation and the pinned original UniFi helper MIT notice. No new CVE/reputation lookup or production approval is implied.

Local strict **TypeScript 5.9.3 / Pi SDK 1.4.0** checking passed for all four root extensions and optional Planning. The compiler was extracted from the existing npm cache without lifecycle scripts or network downloads; the existing SDK was used, and the temporary dependency-resolution link was removed. This is local evidence, not a remote CI result. The earlier no-typecheck statement below records the eleven-fix tranche only.

Follow-up validation: **334 Node tests** (including the five new contracts and the runner for 28 Python regressions), **42 Pi SDK tests**, and **11 Planning tests**, all passed without failures/skips. The nested Python cases are not additional Node tests. No remote CI, live CVE lookup, cloud/device/database operation or new Ghidra live run was performed for this follow-up.

## Audit behavior regressions — previous eleven-fix tranche

`npm test` now requires Python 3.11+ (or an executable supplied as `PYTHON`) and runs 28 offline Python regression cases through the Node gate. Missing prerequisites fail, not skip. The cases invert the eleven reproduced F01–F10/F12 defects, with positive controls; they do not certify all scripts or close F11/G01–G04. See [behavior matrix and compatibility changes](AUDIT-REMEDIATION.md). Six ML/data scaffolds now deliberately fail as `not_implemented`; their functionality was not implemented by this tranche.

Post-remediation local validation: **329 Node tests** (including the Python-gate runner), **28 Python regression cases**, **42 Pi SDK 1.4.0**, **11 Planning**, **6 optional routing**, **53 security-scorer Python**, **41 NetBird-validator Python**, and **1 real benign Ghidra** test passed, with no failures/skips. The Python regression suite was also invoked directly; that is a repeat execution, not another 28 distinct cases. All 210 Python files parsed; a pre-existing invalid-escape SyntaxWarning remains in the MS365 PowerShell generator. Host: macOS arm64, Node 26.13.0, Python 3.15.2. No new TypeScript check or remote CI was run; no cloud/database operations were performed.

## Current executable Ghidra integration

Expected discovery: **130 skill resources / 8 prompts / 4 extensions**, or **131 / 8 / 5** with Planning. The root Ghidra extension registers two executable tools without launching Java on load; the four agency skills remain instruction-based. Offline tests cover version/path/input limits, snapshot integrity, approval refusal/non-boolean response, configuration changes, timeout, cancellation, nonzero exit, spawn failure and log limits. Pi SDK tests load the actual extension and verify UI/headless boundaries and refusal with no analysis artifacts.

Commands: `npm test`; `PI_SDK_ROOT=/absolute/pi-sdk npm run test:pi`; same SDK for `npm run test:planning`. Separate opt-in `npm run test:ghidra:live` compiles a benign fixture and checks actual Ghidra analysis/decompiled C without executing the fixture. Requires configured Ghidra 12.2 / Java 25 and a system C compiler; missing prerequisites fail, never silently pass/skip. Artifacts are retained locally. Real runtime validation is macOS arm64 only; no malware isolation, Windows/Linux runtime validation, cloud/DB operations or campaign execution is claimed. See [Ghidra setup](install/ghidra.md).

## Current operator checklist

The root manifest is the discovery authority: **129 specialists + catalogue = 130 skill resources / 8 prompts / 4 extensions** (OPS, NetBird, Ponytail, Ghidra). With the optional Planning addon: **131 / 8 / 5**. Loading guidance is not an operational test.

1. Keep one root package registration; preserve unrelated host settings. Run `/reload` after updating.
2. Run `npm test` with Node 22.14+ and Python 3.11+.
3. Use an already installed SDK: `PI_SDK_ROOT=/absolute/pi-sdk npm run test:pi`; then `npm run test:planning` with the same environment.
4. CI's strict TypeScript gate includes **all four root extensions** plus the optional Planning extension. It uses Pi 1.4.0 and TypeScript 5.9.3; a configured gate is not evidence that remote CI ran.
5. The separately approved Ghidra live test needs the external runtime and a benign fixture; no automatic runtime install occurs. Cloud, database, device changes and paid model tests need separate approval.

The appendix below is retained as historical evidence only: old counts, commands, versions and phrases such as “deve” apply to their recorded stage, not this checkout. Use this current checklist and the root manifest instead.

## Historical validation archive — not current instructions

All following counts/results describe earlier stages, not the current executable Ghidra validation.

### Agency/Ghidra documentary tranche — historical discovery

At that documentary-only stage, expected discovery was **130 skill resources / 8 prompts / 3 extensions**, or **131 / 8 / 4** with Planning. The five new instruction skills add no runtime, tools or prompts. tests/agency-ghidra-integration.test.mjs checks provenance, component hashes, safe boundaries and local references. Validation of this tranche: **318 offline Node tests + 38 Pi SDK 1.4.0 tests + 11 Planning tests = 367 passed**, with no failures or skips; `git diff --check` clean. SDK discovery is 130 resources (131 with Planning). No Ghidra runtime, cloud/database operation, email campaign or cross-platform operational trial was executed. Earlier result/count sections below are historical and are not new validation of Ghidra, cloud/database operations or campaigns.


Usar primeiro dados sintéticos/redigidos. Os testes de empacotamento não precisam de credenciais de infraestrutura, downloads, instalação de SDK ou chamadas reais a modelos.

## Prometheus label strategy — integração oficial

A nova suite tests/prometheus-label-strategy-integration.test.mjs verifica fonte integral, licença/pin/hashes, links, descoberta única sem runtime, correções locais e fixtures sintéticas de colisão de identidade, cardinalidade e histogramas. Nenhum teste instala ferramentas nem consulta Prometheus, Grafana ou AWS. A descoberta esperada nessa etapa era 125 recursos / 8 prompts / 3 extensões; com Planning, 126 / 8 / 4.

Validação local: **315 testes Node + 38 testes SDK Pi + 11 Planning = 364**, sem falhas ou skips nas execuções finais. A primeira tentativa SDK parou por PI_SDK_ROOT ausente; repetida com o diretório do SDK instalado, passou integralmente. Fonte e licença têm hashes fixos verificados; a integração adiciona sete testes offline. `git diff --check` limpo. Sem consultas operacionais, mudanças de configuração global, commit, push ou deploy. Recarregar a sessão para atualizar o catálogo já registado.

## Integração Grafana oficial — validação histórica

Validação local: **308 testes Node offline + 38 SDK Pi 1.4.0 + 11 Planning = 357**, sem falhas ou skips. O loader Pi confirmou grafana-dashboards exatamente uma vez, sem descobrir dashboarding/upstream. Os três ficheiros de fonte/licença foram comparados byte a byte com o commit oficial 8fb72a527961f05e708f53d2a0500709e12d7970. A raiz já estava registada no Pi; não se alterou configuração global. É necessário recarregar a sessão para atualizar o catálogo. Não houve commit/push, deploy, operação Grafana/AWS, SQL, inspeção visual ou instalação de ferramentas externas.

A suite tests/grafana-dashboards-integration.test.mjs verifica a fonte completa/pin/licença/hashes, links, registo único sem runtime, exemplo moderno de layout/unidades e correções de segurança/semântica. A descoberta esperada é 124 recursos / 8 prompts / 3 extensões; com Planning, 125 / 8 / 4. Os resultados CloudWatch abaixo são históricos, anteriores à adição Grafana. Nenhum teste desta integração contacta Grafana ou AWS.

## Integração CloudWatch completa — validação histórica

Inclui dois entrypoints e as três árvores upstream completas (120 ficheiros, incluindo LICENSE/NOTICE). Os sete testes em `tests/aws-cloudwatch-integration.test.mjs` verificam registo único, exclusão do snapshot da descoberta, hashes/inventário e atribuição, links relativos, parsing AST dos 26 ficheiros Python e imports diretos, requisitos opcionais e limites/correções locais. Nenhum helper é importado ou executado; não se instala boto3, botocore, CDK ou MCP.

Validação local em Node 26.13.0: **303 testes Node offline + 38 SDK Pi 1.4.0 + 11 Planning = 352**, sem falhas/skips. Os 41 testes Python NetBird permanecem internos à suíte padrão. A descoberta no SDK é **123 recursos de skills / 8 prompts / 3 extensões**, ou **124 / 8 / 4** com Planning. Os dois novos nomes aparecem uma vez; a dependência de onboarding e snapshots não são descobertos. Todos os 120 ficheiros foram também comparados byte a byte com o commit Git fixado; `git diff --check` limpo.

Não foram executados scripts AWS, instalações opcionais, compilação CDK, modelos, operações cloud, testes de entrega real, SDK AWS em ambiente limpo, CI remoto, commit ou push. Os mínimos de SDK não são um lockfile nem certificação de compatibilidade operacional. Ver [dependências, revisão estática e limites](../integrations/aws-toolkit/CLOUDWATCH.md). Resultados de integrações anteriores abaixo são históricos quando identificados como tal.

## Perfil opcional billion-context

`npm test` inclui `tests/billion-context.test.mjs`: pins/SRI/licença, configuração restritiva, lazy init, hash/config inválidos antes de efeitos laterais, whitelist, getter de chaves oculto, registry alheio preservado, restauro de env antes de await (incluindo exceção), confirmação de exports e verificador read-only. Fixtures upstream sintéticas em processos isolados, sem rede/contas/SDK e sem alterar o perfil global.

O runtime não é instalado pelos testes ou pela raiz. A [verificação manual](../integrations/billion-context/README.md) do prefixo instalado é read-only; os testes locais anteriores com SDK/transportes simulados não são reproduzidos automaticamente pelo CI nem provam poupança real ou compatibilidade universal. O perfil é adicional opt-in, não altera a contagem de extensões da raiz.

## 1. Atualizar e registar uma vez

```bash
cd /caminho/devops-skills
git pull --ff-only
```

Se a raiz ainda não estiver registada:

```bash
pi install /caminho/absoluto/devops-skills
pi list
```

Se já estiver registada, atualizar e recarregar é suficiente. Não registar módulos internos adicionalmente. Ver [pacote único e migração de configurações antigas](UNIFIED-PACKAGE.md); preservar configurações não relacionadas e filtros intencionais.

A raiz expõe **124 especialistas + 1 catálogo = 125 recursos de skills**, **8 prompts** e **3 extensões**. Snapshots upstream, UniFi e o runtime adicional de Planning with Files não entram nessa descoberta. A presença dos ficheiros em integrations/ não implica execução de código ou instalação separada.

## 2. Recarregar e conferir

No Pi:

```text
/reload
/skill:engineering-skills
```

Verificar ausência de avisos de nomes duplicados, frontmatter inválido ou caminhos ausentes. `pi config` permite inspecionar recursos e filtros. Projetos precisam de confiança apropriada; uma instalação noutro âmbito pode ter filtros próprios.

Os oito prompts incluídos são:

- network-architect, network-troubleshooter, network-config-reviewer;
- security-hunter, security-verifier, security-coverage-critic;
- test-engineer, web-performance-auditor.

São templates na sessão atual, não oito subagents autónomos. A extensão mantém os três papéis de rede e as aprovações já existentes.

## 3. Suíte padrão: todas as capacidades incluídas

```bash
npm test
```

A suíte padrão cobre motor de orquestração, contrato unificado, Graphify, Security Audit, engenharia/web e os validadores upstream de segurança. Verifica contagens, nomes, links, licenças, hashes, limites de execução automática e fixtures locais. Não inicia browser, auditoria de site, código de um alvo ou infraestrutura.

Para verificar apenas o contrato público:

```bash
npm run test:package
```

O contrato falha se um módulo aprovado deixar de ser exportado pelo manifesto raiz, se um snapshot passar a ser descoberto, se houver nomes duplicados, se os guias voltarem a exigir instalações Pi separadas ou se npm test deixar de incluir as suítes aprovadas.

## Ponytail full por defeito — validação histórica

A raiz carrega três extensões: OPS, conector NetBird e Ponytail full. Mantém **124 especialistas + catálogo = 125 recursos / 8 prompts / 3 extensões**; com Planning, **126 / 8 / 4**. Não acrescenta skills concorrentes ou ferramentas de modelo. `/ponytail off`, `full` e `status` controlam o ramo da sessão, com full em sessões novas; o modo não altera aprovações ou acesso.

Validação na cópia isolada e no checkout original, com o SDK instalado **Pi 1.4.0**: **280 testes Node offline + 38 SDK + 11 Planning = 329**, sem falhas/skips. Inclui 11 testes offline de política/proveniência/ausência de IO e nove SDK para registo, prompt composto sem duplicação, off/full/status, modo por ramo/reload, falha de persistência, headless e fallback legado. Um teste usa ExtensionRunner e SessionManager reais em memória e verifica preservação das secções de segurança e das ferramentas. As 41 verificações Python NetBird continuam internas à suíte padrão. O importador da sandbox omitiu uma pasta de skill chamada coverage; foi reposto apenas o SKILL.md original idêntico para a descoberta completa.

O CI foi alinhado nos três peers Pi **1.4.0**, mantendo prefixo isolado/ignore-scripts e TypeScript 5.9.3; o passo estrito inclui a nova extensão. CI remoto e novo typecheck local não foram executados (compilador local indisponível). Não se instalou SDK, alterou configuração global ou executou inferência, benchmark de custos, coleta de histórico, dashboard, webhook, rede ou infraestrutura. Os testes provam contratos de integração, não obediência do modelo, savings de tokens/cache, rapidez de incidentes ou cumprimento de SLA. O fallback string legado é testado sinteticamente, não homologação de SDKs antigos. No checkout original, o Finder acrescentou um `.DS_Store` local e não distribuído no Creator. O inventário de testes ignora apenas esse ficheiro regular, sem apagar dados nem relaxar a rejeição de symlinks/ficheiros inesperados. Resultados anteriores abaixo são históricos.

## Skill Creator — autoria documental e avaliação opcional

A skill `skill-creator` é carregada pelo glob existente, sem runner, viewer, servidor, empacotador ou dependências novas. Os sete testes em `tests/skill-creator-integration.test.mjs` verificam registo de creator e ausência de teach, licença/proveniência/integridade/links, limites de fonte autorizada, aprovação de avaliação e consistência do plano sintético versionado. A fixture declara execução não aprovada, isolamento não verificado e métricas nulas. Não foi executado benchmark de modelos; contratos de texto não garantem comportamento, isolamento ou eficácia.

Os dois testes `tests/skill-creator-pi.test.mjs` verificam no loader Pi real que creator aparece com metadata válido para autoria e que teach já não aparece na descoberta ou no prompt. Estes testes medem descoberta/formatação, não a decisão de um modelo sobre quando ativar uma skill.

Validação histórica após remover teach a pedido e manter skill-creator: **269 testes Node offline + 29 SDK Pi 1.4.0 + 11 planning = 309 testes**, sem falhas/skips. A suíte padrão continua a executar os 41 testes Python NetBird internamente; não são mais 41 testes Node. Descoberta nessa validação: **120 especialistas + catálogo = 121 recursos / 8 prompts / 2 extensões**; com Planning, **122 / 8 / 3**. Os testes verificam ausência de teach no filesystem de skills, na descoberta SDK, no catálogo e nos comandos de testes. Foram retirados os sete contratos offline e dois testes SDK específicos de teach; a cobertura das restantes capacidades foi preservada. Nenhum curso ou ficheiro externo foi apagado. `git diff --check` limpo; sem edição de runtime, instalação, recolha de credenciais, acesso cloud/rede, benchmark de modelos, publicação, novo typecheck, CI remoto ou teste do runtime opcional de routing nesta tarefa.

## 4. Carregador/núcleo Pi real com transporte simulado

Usar o SDK que já está instalado; não instalar outra cópia no pack:

```bash
PI_SDK_ROOT=/caminho/real/@earendil-works/pi-coding-agent npm run test:pi
```

Numa instalação npm global convencional, pode ser:

```bash
PI_SDK_ROOT="$(npm root -g)/@earendil-works/pi-coding-agent" npm run test:pi
```

Confirmar antes que o caminho existe. Numa instalação pi-web-ui, o SDK pode estar nas dependências dessa aplicação, não diretamente em npm root.

Os testes verificam descoberta de **125 skills / 8 prompts / 3 extensões** a partir de apenas uma entrada raiz e a compatibilidade temporária com os quatro registos legados. Também verificam quatro ferramentas de orquestração, duas commands, isolamento de contexto dos workers, zero ferramentas nos workers, recusa/cancelamento/timeout, bloqueio de dependências e limites de saída. Só usam configuração temporária/em memória e um transporte de modelo sintético.

## 5. Planeamento persistente: teste do addon de runtime

O [Planning with Files](../integrations/planning-with-files/README.md) inclui hooks próprios, pelo que continua separado da instalação normal das skills. Não é uma dependência oculta das 124 skills.

```bash
PI_SDK_ROOT=/caminho/real/@earendil-works/pi-coding-agent npm run test:planning
```

A descoberta combinada deve ser **126 skills / 8 prompts / 4 extensões**. Os testes verificam integridade do snapshot, coexistência, modo passivo/notify, ativação/reset, leitura do plano, alteração/seleção inválida e ausência de continuação após erro/abort. Não exercitam toda a suíte upstream, modelos reais, recuperação de históricos ou loops periódicos.

## 6. Smoke tests manuais sem ações externas

```text
/skill:web-seo Explica como rever SEO de uma página de produto usando apenas estes metadados sintéticos; não navegues, não alteres ficheiros e não publiques.
/skill:context-engineering Propõe o conteúdo mínimo de um handoff; não cries ficheiros nem leias históricos.
/skill:security-audit Revê apenas esta hipótese fornecida; sem auditoria completa, agentes ou execução.
/test-engineer Propõe testes para esta função sintética; não executes comandos.
/network-troubleshooter Usa apenas estes contadores sintéticos para propor diagnóstico; não contactes dispositivos.
```

Esperado: recurso encontrado, argumentos recebidos, resposta limitada ao âmbito e sem alegações de verificações não feitas. Qualidade de resposta de um modelo não é determinística. Para Graphify real, usar primeiro um projeto temporário de confiança; verificar versão/output e seguir [os requisitos do CLI](../integrations/graphify/README.md). Não mapear HOME ou todos os Workspaces para um smoke test.

Para um teste autorizado com modelo real de ops_workflow, usar apenas evidência sintética, confirmar modelo/custo na UI e testar recusa antes de aprovação. O teste pode gerar custos e não é executado automaticamente pela suíte.

## 7. Estado de validação e limites

A validação do pacote 0.4.0 no SDK instalado **Pi 1.3.0** passou com:

- **126 testes** em npm test;
- **21 testes** do carregador/núcleo Pi real com transporte simulado;
- **11 testes** do addon de planeamento;
- total **158**, sem skips nesse ambiente.

A descoberta foi 112/8/1 para a raiz e 113/8/2 com planeamento, sem diagnostics de skills/prompts. A coexistência com registos legados não duplicou recursos. O runtime de orquestração tinha validação anterior em Pi 1.2.0; não confundir isso com teste da nova descoberta nessa versão. As verificações anteriores de tipos mantêm o seu âmbito/versão documentado.

Isto não certifica todos os sistemas operativos, ferramentas externas, qualidade dos modelos, contas cloud, segurança independente, métricas web, SEO, WCAG ou equipamentos reais. Registar versões, condições e resultados das verificações operacionais efetivamente realizadas. SSH, redes, Kubernetes, cloud e alterações de produção exigem âmbito, versões, permissões e aprovação específicos.
