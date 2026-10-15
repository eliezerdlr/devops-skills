# DevOps Skills

**Português** | [English](README.en.md)

Pack de skills para engenharia, DevOps, cybersecurity e operações de IT.

Inclui **90 skills/sub-skills**, organizadas no [índice principal](skills/engineering-skills/SKILL.md). Cada skill contém instruções e, quando aplicável, scripts, referências e assets.

## 1. Pré-requisitos

- Pi instalado e fornecedor/modelo autenticado.
- Git, para obter e atualizar o repositório.
- Ferramentas específicas apenas para as tarefas que fores executar; consultar [dependências e compatibilidade](docs/DEPENDENCIES.md).

As skills não são executáveis nem serviços. Ativá-las disponibiliza instruções ao agente; não instala Terraform, kubectl, Python, browsers ou credenciais.

## 2. Ativar as skills no Pi

Depois de clonar este repositório, escolhe **uma** das opções seguintes. Não registes a mesma cópia por vários métodos, para evitar nomes duplicados.

### Opção A — Registar o caminho em settings.json

Edita `~/.pi/agent/settings.json` e acrescenta o caminho absoluto da pasta de skills à lista `skills` existente:

```json
{
  "skills": [
    "/caminho/absoluto/devops-skills/skills/engineering-skills"
  ]
}
```

Substitui o caminho pelo local real do checkout. **Não substituas o ficheiro inteiro** se já contém configurações: preserva os restantes campos e caminhos.

O [exemplo de configuração](examples/pi-settings.json) usa `~/devops-skills`; ajusta-o se clonaste para outra pasta. Pi descobre os SKILL.md recursivamente, sem listar cada skill.

### Opção B — Instalar o checkout como pacote Pi

```bash
pi install /caminho/absoluto/devops-skills
pi list
```

O manifesto `package.json` regista apenas skills. Não inclui extensões, hooks, temas, prompts nem scripts de instalação. Não é necessário executar `npm install` na raiz para carregar as skills.

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

## 3. Ativar capacidades operacionais

**As 90 skills ficam disponíveis com o registo acima.** Executar os seus workflows pode exigir preparação adicional:

| Capacidade | Preparação separada |
|---|---|
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

### O que não está ativado/incluído

- As skills e agentes ECC recomendados ainda não foram incorporados.
- Definições de agentes Markdown não se tornam subagentes Pi automaticamente.
- Hooks originais de outros agentes não são ativados por este pack.
- Snyk Agent Scan e Sage não são distribuídos nem instalados pelo pack.
- Não há credenciais, acesso automático à infraestrutura ou alteração de SYSTEM.md/AGENTS.md.

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

As skills incluídas **não passaram por análise oficial de segurança**. Verificação de estrutura, sintaxe ou licença não garante segurança nem funcionamento completo. O carregamento numa instalação limpa do Pi e os workflows com dependências reais ainda precisam de testes.

Antes de executar scripts ou ações: revê o conteúdo, confirma ferramentas e âmbito, começa por diagnóstico só de leitura e exige aprovação, plano de rollback e janela apropriada para alterações de produção. Não guardes segredos nas skills ou neste Git.

## 6. Licença e atribuições

O conteúdo original é redistribuído sob MIT, com avisos preservados em [LICENSE](LICENSE), nas licenças das subpastas e em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Este é um pack curado/adaptado, não uma declaração de autoria exclusiva nem de associação oficial aos autores, à Snyk ou à Gen Digital.

As novas contribuições locais são também disponibilizadas sob MIT, por decisão do mantenedor. Os copyrights dos componentes originais permanecem preservados.
