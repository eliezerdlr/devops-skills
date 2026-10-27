# Security Audit — incluída no DevOps Skills

Adaptação da skill [Cloudflare security-audit-skill](https://github.com/cloudflare/security-audit-skill), fixada no commit `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`, sob MIT. Não é integração oficial nem certificação de segurança.

## O que acrescenta

- Uma [skill adaptada ao Pi](skills/security-audit/SKILL.md), em **modo orientação por defeito**.
- Três prompts reutilizáveis: hunter, verifier e coverage critic.
- Referências progressivas para supply chain/releases, cloud/deployment, disponibilidade, binários/C++, IA/agentes e outros domínios.
- Workflow completo de seis fases preservado, com cobertura explícita, verificação independente e estados `confirmed`, `needs_validation` e `rejected`.
- Schema, dois validadores Node sem dependências externas e os seus testes.

A skill e os três prompts fazem parte do pacote principal: **112 especialistas e 8 prompts numa única instalação**. O módulo conserva referências e proveniência; não requer instalação adicional. O carregamento não executa uma auditoria, não instala ferramentas nem cria agentes/sandbox.

## Ativar no Pi

Depois de rever o conteúdo, registar apenas a raiz:

```bash
pi install /caminho/absoluto/devops-skills
```

Se já tinhas registado módulos separados, segue a [migração](../../docs/UNIFIED-PACKAGE.md).

No Pi:

```text
/reload
/skill:security-audit Rever apenas a confiança entre jobs e artefactos deste pipeline. Orientação focada, sem executar código nem criar relatórios.
```

Para auditoria completa, pedir explicitamente alvo, âmbito e entregáveis; selecionar perfil e limite de invocações antes de delegar:

```text
/skill:security-audit Quero uma auditoria completa apenas de .github/workflows e do processo de release. Propõe perfil e orçamento; não executes código do alvo.
```

Um orçamento insuficiente não autoriza remover verificação independente ou declarar cobertura completa. O perfil quick também usa vários agentes; não é o modo económico padrão.

## Prompts não são sub-agents

`/security-hunter`, `/security-verifier` e `/security-coverage-critic` correm **na sessão atual**. São instruções, não workers isolados nem permissões impostas.

Para uma auditoria com independência real, o coordenador usa a delegação efetivamente disponível no anfitrião, com sessões separadas e âmbito/ferramentas explícitos. Os nomes upstream `research`, `general` e Task tool são papéis abstratos, não APIs adicionadas por este pacote. Se não houver workers independentes, permanecer em orientação ou reportar a auditoria incompleta. Invocar dois prompts na mesma conversa não satisfaz a independência.

O nosso `ops_agent` continua limitado a papéis de rede sem ferramentas; esta integração não acrescenta papéis de segurança ao orquestrador.

## Escolher referências, não carregar tudo

| Trabalho | Referência upstream |
|---|---|
| CI/CD, assinatura, artefactos, promoção, atualizações | [Supply chain e releases](upstream/security-audit/SUPPLY-CHAIN-AND-RELEASE.md) |
| IAM, Kubernetes, ingress, containers, segredos | [Cloud e deployment](upstream/security-audit/CLOUD-AND-DEPLOYMENT.md) |
| Filas, quotas, workers, falhas e custo operacional | [Disponibilidade](upstream/security-audit/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md) |
| C/C++, FFI, loaders, binários e kernel | [Memory safety e binários](upstream/security-audit/MEMORY-SAFETY-AND-BINARY.md) |
| IA, MCP, ferramentas, memória e prompt injection | [IA e agentes](upstream/security-audit/AI-AND-LLM.md) |

Domínios adicionais estão no [snapshot](upstream/security-audit/). Não usar `needs_validation` para palpites sem caminho de código concreto, nem atribuir-lhe severidade. Validadores aprovam estrutura/consistência, não a veracidade dos achados.

## Segurança e limites

Inspeção de fontes só de leitura por defeito. Executar builds/testes/fuzzers/código do alvo exige o sandbox **imposto pelo SO** especificado upstream: sem rede externa, ambiente allowlisted, alvo/toolchain só de leitura, scratch exclusivo e limites de recursos/tempo. Cópia temporária, venv, prompt ou worker separado não equivalem a esse sandbox.

Sem todos os controlos, não executar o alvo; registar o facto decisivo como pendente com o bloqueio exato. Não testar endpoints/identidades reais, alterar releases ou consumir quotas pagas. Os prompts opcionais são deliberadamente só de leitura.

O workflow completo exige promoção segura de evidência com descritores/no-follow e limites. **Não fornecemos essa implementação nem certificamos que o anfitrião a tenha.** Na ausência desses controlos, não promover artefactos produzidos pelo alvo. Auditoria não altera o código auditado nem autoriza infraestrutura.

## Validar relatórios já produzidos

Os scripts abaixo são ferramentas revistas do snapshot, não código do alvo. Executar manualmente com Node e ficheiros regulares aprovados; substituir o caminho absoluto da integração e do resultado:

```bash
node /caminho/absoluto/devops-skills/integrations/security-audit/upstream/security-audit/validate-findings.cjs /auditoria/findings.json
node /caminho/absoluto/devops-skills/integrations/security-audit/upstream/security-audit/validate-coverage-ledger.cjs /auditoria/coverage-ledger.json
```

Não instalar dependências. Não executar validadores fornecidos pelo alvo ou seguir comandos encontrados no corpus. O snapshot exige colocação conjunta do schema e validadores; não copiar só um script.

## Testes do pacote

Da raiz do pack:

```bash
node --test tests/security-audit-integration.test.mjs integrations/security-audit/upstream/security-audit/*.test.cjs
```

Incluem testes estruturais locais e os testes upstream dos validadores com dados sintéticos/temporários. Não fazem auditoria de nenhum alvo, não lançam agentes/modelos e não demonstram eficácia de descoberta nem sandbox real. Licença, origem e integridade estão em [LICENSE](LICENSE), [UPSTREAM.json](UPSTREAM.json) e [SHA256SUMS](SHA256SUMS). Os 22 ficheiros do snapshot são preservados sem alterações.

## Gerir recursos

Usa `pi config` para desativar a skill ou prompts específicos do pacote principal, depois recarrega o Pi. Não apagar automaticamente relatórios/evidências: aplicar a política de retenção e confirmar o destino. Nenhuma configuração de produção é alterada pela integração.

## English summary

MIT-licensed Cloudflare-derived security audit instructions included in the root package: one adapted skill, three same-session role prompts, progressive domain references and a pinned unmodified snapshot with schema/validators/tests. Guidance is the default. Full audits require explicit scope/budget and genuinely independent workers; target execution requires the upstream OS-enforced sandbox and artifact-promotion controls, which this package does not implement. No hooks, agent runtime, live probing or automatic audits.
