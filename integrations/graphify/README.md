# Graphify — integração opcional

Uma **skill adaptada**, três referências e dois workflows para mapear projetos, consultar relações e reutilizar descobertas. Não inclui agents, sub-agents, runtime Python, guard Pi, hooks ou watcher. Não é integração oficial da Graphify Labs.

## O que fica disponível

- [Skill graphify](skills/graphify/SKILL.md): consultas dirigidas e memória explícita.
- [Mapear e consultar](workflows/map-and-query.md).
- [Retomar trabalho](workflows/resume-work.md): reutiliza o plano/handoff existente, sem criar uma memória concorrente.

**Não captura todas as sessões nem carrega contexto automaticamente numa janela nova.** A retoma exige invocar a skill ou pedir a leitura do handoff selecionado. Não há promessa de poupança percentual de tokens.

## Ativar apenas as instruções no Pi

O manifesto principal não carrega esta integração; as 99 skills base não mudam. Regista este pacote separadamente, após rever o conteúdo:

```bash
pi install /caminho/absoluto/devops-skills/integrations/graphify
```

Este registo não instala o Graphify Python. Não registes outra skill chamada `graphify` ao mesmo tempo. Depois, no Pi:

```text
/reload
/skill:graphify Retomar a tarefa selecionada ou consultar o mapa deste projeto.
```

Para remover só o pacote de instruções:

```bash
pi remove /caminho/absoluto/devops-skills/integrations/graphify
```

Recarrega o Pi. A remoção não apaga planos, notas, grafos ou o Graphify instalado separadamente.

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

Não instalar a mesma ferramenta por pipx e uv simultaneamente. Para obter uv, o [instalador da Astral](https://docs.astral.sh/uv/getting-started/installation/) disponibiliza:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Atenção:** este comando descarrega e executa um script remoto, cujo conteúdo pode mudar. Só o executar após aprovação e revisão do script; não é executado por esta integração. Não é necessário se a instalação por pipx já funciona. Num ambiente empresarial, preferir o mecanismo de instalação de ferramentas aprovado pela organização.

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

Optional, adapted Graphify instructions for scoped project maps, bounded queries and explicit work memory. No agents, subagents, runtime, hooks or automatic session capture. Register this directory separately; install the pinned external Python tool only after operator approval. Safeguards are guidance, not an executable sandbox. Apache-2.0 attribution is preserved.
