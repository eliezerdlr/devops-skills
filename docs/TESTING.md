# Verificar o pacote unificado / Unified package testing

Usar primeiro dados sintéticos/redigidos. Os testes de empacotamento não precisam de credenciais de infraestrutura, downloads, instalação de SDK ou chamadas reais a modelos.

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

A raiz expõe **119 especialistas + 1 catálogo = 120 recursos de skills**, **8 prompts** e **2 extensões**. Snapshots upstream, UniFi e o runtime adicional de Planning with Files não entram nessa descoberta. A presença dos ficheiros em integrations/ não implica execução de código ou instalação separada.

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

## Skill Creator — autoria documental e avaliação opcional

A skill `skill-creator` é carregada pelo glob existente, sem runner, viewer, servidor, empacotador ou dependências novas. Os sete testes em `tests/skill-creator-integration.test.mjs` verificam registo de creator e ausência de teach, licença/proveniência/integridade/links, limites de fonte autorizada, aprovação de avaliação e consistência do plano sintético versionado. A fixture declara execução não aprovada, isolamento não verificado e métricas nulas. Não foi executado benchmark de modelos; contratos de texto não garantem comportamento, isolamento ou eficácia.

Os dois testes `tests/skill-creator-pi.test.mjs` verificam no loader Pi real que creator aparece com metadata válido para autoria e que teach já não aparece na descoberta ou no prompt. Estes testes medem descoberta/formatação, não a decisão de um modelo sobre quando ativar uma skill.

Validação local após remover teach a pedido e manter skill-creator: **269 testes Node offline + 29 SDK Pi 1.4.0 + 11 planning = 309 testes**, sem falhas/skips. A suíte padrão continua a executar os 41 testes Python NetBird internamente; não são mais 41 testes Node. Descoberta atual: **119 especialistas + catálogo = 120 recursos / 8 prompts / 2 extensões**; com Planning, **121 / 8 / 3**. Os testes verificam ausência de teach no filesystem de skills, na descoberta SDK, no catálogo e nos comandos de testes. Foram retirados os sete contratos offline e dois testes SDK específicos de teach; a cobertura das restantes capacidades foi preservada. Nenhum curso ou ficheiro externo foi apagado. `git diff --check` limpo; sem edição de runtime, instalação, recolha de credenciais, acesso cloud/rede, benchmark de modelos, publicação, novo typecheck, CI remoto ou teste do runtime opcional de routing nesta tarefa.

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

Os testes verificam descoberta de **120 skills / 8 prompts / 2 extensões** a partir de apenas uma entrada raiz e a compatibilidade temporária com os quatro registos legados. Também verificam quatro ferramentas de orquestração, duas commands, isolamento de contexto dos workers, zero ferramentas nos workers, recusa/cancelamento/timeout, bloqueio de dependências e limites de saída. Só usam configuração temporária/em memória e um transporte de modelo sintético.

## 5. Planeamento persistente: teste do addon de runtime

O [Planning with Files](../integrations/planning-with-files/README.md) inclui hooks próprios, pelo que continua separado da instalação normal das skills. Não é uma dependência oculta das 119 skills.

```bash
PI_SDK_ROOT=/caminho/real/@earendil-works/pi-coding-agent npm run test:planning
```

A descoberta combinada deve ser **121 skills / 8 prompts / 3 extensões**. Os testes verificam integridade do snapshot, coexistência, modo passivo/notify, ativação/reset, leitura do plano, alteração/seleção inválida e ausência de continuação após erro/abort. Não exercitam toda a suíte upstream, modelos reais, recuperação de históricos ou loops periódicos.

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
