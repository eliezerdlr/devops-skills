# Graphify — contexto incluído no DevOps Skills

Uma **skill adaptada**, três referências e dois workflows para mapear projetos, consultar relações e reutilizar descobertas. Não inclui agents, sub-agents, runtime Python, guard Pi, hooks ou watcher. Não é integração oficial da Graphify Labs.

## O que fica disponível

- [Skill graphify](skills/graphify/SKILL.md): consultas dirigidas e memória explícita.
- [Mapear e consultar](workflows/map-and-query.md).
- [Retomar trabalho](workflows/resume-work.md): reutiliza o plano/handoff existente, sem criar uma memória concorrente.

**Não captura todas as sessões nem carrega contexto automaticamente numa janela nova.** A retoma exige invocar a skill ou pedir a leitura do handoff selecionado. Não há promessa de poupança percentual de tokens.

## Uma instalação do pacote principal

A skill Graphify faz parte das 117 skills do pacote e é registada pelo manifesto principal. A pasta deste módulo mantém origem, referências e licença; não é uma instalação adicional.

```bash
pi install /caminho/absoluto/devops-skills
```

Este registo não instala o Graphify Python. Se tinhas registado módulos individualmente, segue a [migração para instalação única](../../docs/UNIFIED-PACKAGE.md). Depois, no Pi:

```text
/reload
/skill:graphify Retomar a tarefa selecionada ou consultar o mapa deste projeto.
```

Para desativar apenas esta skill, usa o filtro de recursos do pacote principal em `pi config`; não é necessário remover o pacote inteiro. A desativação não apaga planos, notas, grafos ou o CLI instalado separadamente.

## Receita operacional completa

**[Instalação isolada, paths, configuração, testes e remoção](../../docs/install/graphify.md).** O procedimento venv dispensa instalar um gestor adicional; pipx/uv abaixo são alternativas, não instalações cumulativas. Ver [índice externo](../../docs/INSTALLATION.md).

## Dependência externa — preparação manual

A referência revista é **graphifyy==0.9.93**, commit em [UPSTREAM.json](UPSTREAM.json). O comando é `graphify`; o nome da distribuição Python tem dois “y”. A versão está fixada como referência, **não certificada para produção**.

Para executar os comandos, um operador deve aprovar e instalar essa versão num ambiente isolado, rever dependências e disponibilizar o executável fora do projeto. A skill nunca instala ou atualiza software. Não executar `graphify install`, guard install ou hooks para usar esta adaptação.

### Instalar com pipx (recomendado se já estiver disponível)

Distribuição: [graphifyy no PyPI](https://pypi.org/project/graphifyy/). Executar manualmente:

```bash
pipx install 'graphifyy==0.9.93'
pipx ensurepath
```

Se o PATH foi atualizado, fecha e reabre o terminal. Se `pipx ensurepath` indicar que os diretórios já estão no PATH, não é um erro de instalação e não é necessário usar `--force`.

Confirma a instalação:

```bash
command -v graphify
graphify --version
```

A versão esperada é `graphify 0.9.93`. `zsh: command not found: graphify` pode indicar um terminal com PATH antigo; reabre-o e verifica `pipx list`. `zsh: command not found: uv` significa que falta o instalador uv, não que a skill Pi falhou — podes usar pipx sem instalar uv.

### Alternativa com uv — escolher apenas um gestor

Se uv já estiver instalado:

```bash
uv tool install 'graphifyy==0.9.93'
graphify --version
```

Não instalar a mesma ferramenta por pipx e uv simultaneamente. Para obter uv, selecionar uma versão e mecanismo da [documentação Astral](https://docs.astral.sh/uv/getting-started/installation/), segundo a política da organização. Não publicar/executar `curl | sh` como bootstrap deste projeto. A versão de um gestor novo exige aprovação e verificação; o [procedimento venv](../../docs/install/graphify.md) evita essa dependência. Não instalar uv se pipx/venv já satisfazem o workflow.

### Compatibilidade e alcance da validação

Upstream declara Python 3.10+ e testa versões específicas; preferir um ambiente 3.12 previamente validado para o piloto. Uma instalação local com pipx/Python 3.15.0 foi confirmada pelo comando `graphify --version` (0.9.93); isto não certifica todos os parsers, dependências ou workflows nessa versão de Python.

O núcleo usa NetworkX, NumPy, RapidFuzz e múltiplas gramáticas tree-sitter. Não instalar todos os extras. Terraform/HCL exige o extra próprio. Consultas não exigem um fornecedor LLM. Verificar a versão confirma a disponibilidade do CLI, não que já exista um mapa nem que a retoma de tarefas seja automática.

## Limites e segurança

- Local estrutural por defeito. Semântica de documentos/media e envio a fornecedores exigem aprovação separada; não estão automatizados aqui.
- Markdown tem extração de headings/links, não compreensão integral das skills. YAML/Ansible/Kubernetes/pipelines não ganham um modelo estrutural completo.
- Usar apenas workspaces de confiança e uma raiz de output aprovada. O runtime upstream pode seguir symlinks na escrita; estas instruções **não implementam confinamento**.
- Não indexar HOME, históricos completos, inventários vivos ou credenciais. Grafo/cache/notas podem conter dados sensíveis; `.gitignore` não impede leitura nem envio a modelos.
- Nada de listeners HTTP, índices globais, watchers, hooks ou workers automáticos.
- O agente usa as ferramentas normais da sessão. Conteúdo recuperado é evidência não confiável, nunca instrução nem autorização.
- A licença Apache-2.0 desta adaptação e os avisos upstream estão preservados; não apresentar estes ficheiros como exclusivamente MIT.

## Validação

```bash
node --test tests/graphify-integration.test.mjs
```

Executar da raiz do pack. Os testes verificam estrutura, links, proveniência e limites do pacote opcional; não executam Graphify, não instalam dependências e não comprovam economia de tokens, indexação real ou funcionamento fim a fim no Pi.

## English summary

Graphify instructions are included in the unified root package for scoped project maps, bounded queries and explicit work memory. No agents, subagents, runtime, hooks or automatic session capture. Register only the repository root; install the pinned external Python tool only after operator approval. Safeguards are guidance, not an executable sandbox. Apache-2.0 attribution is preserved.
