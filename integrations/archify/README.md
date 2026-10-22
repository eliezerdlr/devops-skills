# Archify — módulo integrado / integrated module

**PT:** Uma skill sob pedido para diagramas HTML standalone. Incluída pelo
pacote principal DevOps Skills; este package.json é inventário interno, não
outro pacote Pi a instalar. O runtime externo é uma dependência explícita,
como no Graphify, mas não faz indexação: Archify apresenta/visualiza informação.

**EN:** One on-demand skill in the unified DevOps Skills package. Uses an
explicit, externally provisioned Archify 3.2.0 runtime pinned by file hashes.
Plans are read-only; execution requires a separate explicit command. No
installer, browser opening, automatic updates, prompts or extensions.

## Instalação única / single installation

```sh
pi install /caminho/absoluto/devops-skills
```

Registar apenas a raiz; não instalar este módulo separadamente.

## Entrada / entry points

- [Skill](skills/archify/SKILL.md)
- [Operação e limites](skills/archify/references/operations.md)
- [Autoria e schemas/examples do runtime](skills/archify/references/authoring.md)
- [Segurança, offline e evidência](skills/archify/references/safety-and-evidence.md)
- [Proveniência](UPSTREAM.json), [licença](LICENSE), [aviso adaptado](NOTICE)
  e [avisos upstream](THIRD_PARTY_NOTICES.md).

Configure DEVOPS_ARCHIFY_DIR com o caminho absoluto de archify/ no checkout
revisto (commit em UPSTREAM.json). Não é o diretório raiz do checkout nem este
módulo. Sem runtime exato, parar; não instalar automaticamente. As 203 entradas
de runtime-lock.json verificam conteúdo, incluindo schemas, examples e recursos,
sem distribuir os ~17 MiB de fontes/assets upstream.

Com configuração aprovada descrita em operations.md:

```sh
node /absolute/devops-skills/integrations/archify/adapter.mjs plan /absolute/config.json
node /absolute/devops-skills/integrations/archify/adapter.mjs execute /absolute/config.json
```

O primeiro comando não executa o runtime nem escreve; dry-run é sinónimo de plan.
O segundo executa somente deliver e check --require-provenance. Não equivale a
finalize: não produz prova de browser nem inspeção visual. Nenhuma execução real
Archify foi feita para validar este módulo; os testes são exclusivamente mocks.

## Testes locais (sem runtime, dependências ou rede)

```sh
node --test tests/archify-integration.test.mjs
node --check integrations/archify/adapter.mjs
```

Os fixtures são gerados em diretórios temporários pelo próprio teste. Não são
exemplos de schema validados nem artefactos aprovados pelo Archify. Manter fontes,
configuração, candidate, receipts e HTML sem segredos; não carregar HTML
não confiável no browser pessoal. Não há garantia de sandbox OS ou isolamento
de rede/processos descendentes. Apenas os update checks conhecidos são desativados.
