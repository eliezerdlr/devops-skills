# Ferramentas opcionais das skills — preparação por workflow

## Pré-requisitos e âmbito

**macOS, Linux e Windows:** escolher instalador/gestor e sintaxe do sistema em uso. As 113 skills não constituem uma aplicação única a instalar. [DEPENDENCIES.md](../DEPENDENCIES.md) inventaria imports e famílias de ferramentas; ler uma skill não exige instalar os seus exemplos. Os runtimes integrados têm receitas próprias em [INSTALLATION.md](../INSTALLATION.md).

**Estado deste âmbito: versões/matriz por tarefa ainda não aprovadas.** Os procedimentos abaixo preparam isolamento e definem os gates; não afirmam que todos os exemplos estão prontos para produção. Não há pin universal seguro para stacks cloud/GPU/browser/MCP. Antes de habilitar uma destas ferramentas, completar a receita específica com OS, versão exata, artefacto/hash, conta/destinatários e teste. Enquanto faltar, o workflow que a exige fica bloqueado — não se usa `latest` ou um fallback de demo como resultado real.

## Inventário e fontes por família

| Ferramenta / stack | Quando necessária | Procedimento específico que precisa de seleção/revisão |
|---|---|---|
| Python 3 | Scripts da skill escolhida, helpers Planning | Distribuição oficial/gestor da organização; [downloads por sistema](https://www.python.org/downloads/). Verificar arquitetura, assinatura do installer e coexistência com Python do sistema. Não substituir `/usr/bin/python3`. |
| PyYAML, Pillow | YAML e imagens, não todos os scripts | Venv por tarefa abaixo, versões/hashes escolhidos após verificar imports e interpreter. [pip](https://pip.pypa.io/en/stable/topics/repeatable-installs/) |
| NumPy/ONNX/ONNX Runtime/PyTorch | Branches específicas de visão/benchmarks | Matriz OS/CPU/GPU/driver e wheels aprovados; [PyTorch](https://pytorch.org/get-started/locally/), [ONNX Runtime](https://onnxruntime.ai/docs/install/). Não misturar builds GPU/CPU por tentativa. |
| Netmiko/TextFSM/ntc-templates | Coleção SSH de dispositivos | Venv por tarefa, pins compatíveis e host keys validadas; [Netmiko](https://ktbyers.github.io/netmiko/). Instalar biblioteca não autoriza sessão SSH ou push. |
| Playwright Node/Python + browsers | Testes/automação de browser selecionados | Projeto isolado com lock, versões browser compatíveis e target autorizado; [Node](https://playwright.dev/docs/intro), [Python](https://playwright.dev/python/docs/intro). Browser download é instalação separada. |
| Chrome/Chromium CDP | full-page-screenshot | Browser já aprovado, perfil descartável e debug só loopback; [Chrome remote debugging](https://developer.chrome.com/docs/devtools/remote-debugging/). Não usar perfil pessoal/autenticado nem expor CDP em rede. |
| Lighthouse/axe/Chrome DevTools MCP | Medições/a11y/web selecionadas | Toolchain e versões próprias; [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/), [axe-core](https://github.com/dequelabs/axe-core), [DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp). Não instalar/registrar servidor MCP para preencher lacuna automaticamente. |
| BrowserStack/TestRail MCP | Integrações opcionais Playwright | Manifestos em `skills/engineering-skills/playwright-pro/integrations/`; rever pins/build/segredos. Sem lock incluído; `npm start` usa `tsx` devDependency, por isso `--omit=dev` sozinho não funciona. [BrowserStack](https://www.browserstack.com/docs), [TestRail API](https://support.testrail.com/hc/en-us/articles/7077083596436-Introduction-to-the-TestRail-API) |
| deepagents/LangChain/LangGraph/Zod | Desenvolvimento de uma aplicação Deep Agents | Projeto isolado e matriz de versões de APIs; [Deep Agents](https://docs.langchain.com/oss/python/deepagents/overview). Não instalar framework só para ler a skill; exemplos têm placeholders. |
| Git/gh | Worktrees/review/PR escolhidos | [Git](https://git-scm.com/downloads), [GitHub CLI](https://cli.github.com/manual/). Verificar binário e origem; worktrees usam ferramenta dedicada do host. Autenticação remota e push exigem autorização. |
| Terraform | Validar/provisionar IaC selecionado | [Installer oficial](https://developer.hashicorp.com/terraform/install), pin por projeto + provider lock. `init` descarrega módulos/providers e não é mera análise offline. |
| AWS CLI / Azure CLI / gcloud | Operação cloud do fornecedor escolhido | [AWS](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), [Azure por sistema](https://learn.microsoft.com/cli/azure/install-azure-cli), [gcloud](https://cloud.google.com/sdk/docs/install). Escolher um, validar identidade/conta/região e política de SSO; não instalar os três por defeito. |
| kubectl / Docker ou runtime escolhido | Kubernetes/containers aprovados | [kubectl](https://kubernetes.io/docs/tasks/tools/), [Docker por sistema](https://docs.docker.com/get-started/get-docker/). Contexto de cluster/daemon é decisão separada; não usar contexto default sem confirmação. Rever licenças e privilégio do daemon. |
| gws | Operações Google Workspace selecionadas | [CLI oficial](https://github.com/googleworkspace/cli), skill específica e escopos OAuth mínimos; sem execução de demo como auditoria real. |
| PowerShell + Graph/Exchange | M365/tenant selecionado | [PowerShell por sistema](https://learn.microsoft.com/powershell/scripting/install/installing-powershell), [Graph SDK](https://learn.microsoft.com/powershell/microsoftgraph/installation), [Exchange Online](https://learn.microsoft.com/powershell/exchange/exchange-online-powershell). Selecionar módulos/versões e tenant, sem consentimento admin implícito. |
| Bash/jq/curl/sips | Smoke test e branches de scripts | Confirmar comandos e versões do OS/gestor aprovado; `sips` é específico macOS. Bash macOS pode não suportar recursos de Bash moderno de exemplos externos. Não prometer portabilidade sem testar. |
| uv ou pipx | Alternativa de gestão Python, não requisito universal | [uv instalação](https://docs.astral.sh/uv/getting-started/installation/), [pipx instalação](https://pipx.pypa.io/stable/installation/). Preferir venv existente/revisado quando adequado; sem `curl | sh`, sem garantir pin de helper não selecionado. |

As ligações são fontes oficiais para preparar receitas versionadas, não prova de homologação nem aprovação de execução. Ferramentas de segurança/load test têm ainda escopo/ambiente próprios; nenhuma instalação autoriza scanning, carga ou operações em produção.

## Instalação — ambiente Python por tarefa

Escolher o script/branches e levantar imports **antes** de instalar. Se não existir uma versão exata revista, parar. Exemplo de mecanismo, não uma matriz já aprovada:

```bash
set -euo pipefail
: "${APPROVED_PYTHON:?Definir caminho absoluto do Python aprovado}"
: "${TASK_ENV:?Definir diretório absoluto novo fora do source}"
: "${REVIEWED_REQUIREMENTS:?Definir requirements lock com hashes, revisto}"
test ! -e "$TASK_ENV"
test -f "$REVIEWED_REQUIREMENTS"
"$APPROVED_PYTHON" -m venv "$TASK_ENV"
"$TASK_ENV/bin/python" -m pip install --require-hashes -r "$REVIEWED_REQUIREMENTS"
"$TASK_ENV/bin/python" -m pip check
```

Equivalente Windows PowerShell, com os mesmos caminhos/lock aprovados:

```powershell
if (-not $env:APPROVED_PYTHON -or -not $env:TASK_ENV -or -not $env:REVIEWED_REQUIREMENTS) {
    throw "Definir interpreter, ambiente novo e lock aprovados."
}
if (Test-Path $env:TASK_ENV) { throw "Ambiente já existe." }
& $env:APPROVED_PYTHON -m venv "$env:TASK_ENV"
$Python = Join-Path $env:TASK_ENV "Scripts\python.exe"
& $Python -m pip install --require-hashes -r "$env:REVIEWED_REQUIREMENTS"
& $Python -m pip check
```

Confirmar o exit code de cada comando nativo antes de avançar. O lock deve incluir transitivas e hashes compatíveis com interpreter/CPU/OS; pode ser necessário wheelhouse fechado. Não fabricar ficheiro de requirements a partir de nomes numa tabela. Builds de source podem executar código e descarregar toolchains; rever essa necessidade separadamente. O pacote `security_scorer` é módulo local do skill-tester, não uma dependência PyPI a instalar.

## Instalação — ferramentas Node/MCP por tarefa

Copiar apenas conteúdo aprovado para workspace isolado novo (ou projeto alvo autorizado), preservar licenças e criar/rever o lock antes de habilitar. Fixtures como `dependency-auditor/test-project` **não são aplicações**. Não executar `npm install` no root deste pack para obter todas as ferramentas.

```bash
set -euo pipefail
: "${TASK_PROJECT:?Diretório absoluto do projeto isolado aprovado}"
test -f "$TASK_PROJECT/package-lock.json"
# Gate: rever manifesto, lock, scripts e build antes de permitir lifecycle.
npm ci --prefix "$TASK_PROJECT" --ignore-scripts
```

Windows PowerShell usa o mesmo npm, com sintaxe de variável própria:

```powershell
if (-not $env:TASK_PROJECT) { throw "Definir projeto isolado aprovado." }
npm ci --prefix "$env:TASK_PROJECT" --ignore-scripts
```

Scripts bloqueados podem ser necessários ao runtime. Revisá-los e autorizar uma instalação/build com scripts é um gate separado, não remover o flag silenciosamente. Um servidor MCP só é registado depois de build/output/path/transport/credenciais e restrições de ferramentas verificados. Usar gestão MCP do host, verificando instalações existentes antes de adicionar; não copiar configuração antiga Claude como se fosse Pi atual.

## Configuração

Segredos em gestor privado, por processo e com escopos mínimos; não em exemplos, argumentos CLI, lockfiles ou relatórios. Confirmar identidades/tenant/cluster/projeto e destinatários antes de autenticar. Não é preciso autenticar cloud para verificar versão de binário. Aplicações geradas têm requisitos próprios; documentá-los no projeto gerado, não no manifesto raiz de skills.

## Verificação

Primeiro origem/hash/versão, resolução transitiva e import/`--help` local quando seguro. Depois fixture sintética/offline com resultado esperado. Só então smoke test real aprovado, com orçamento/escopo. Instalação bem sucedida ou output demo não prova acesso real, segurança, correção, performance ou autorização. Ferramentas podem efetuar rede mesmo em `--help`; rever fonte/contrato se isso for relevante.

## Operação

Ferramentas pontuais não precisam de daemon. Browsers/MCP/daemons cloud ou de containers abrem novas superfícies e requerem supervisor, bind/auth/ACL, logs e procedimento de paragem específico. Se esses campos não estiverem definidos, não ativar persistência. Um servidor MCP não herda automaticamente os limites de aprovação OPS do pacote.

## Atualização e rollback

Preservar lock/artefactos e dados/configuração anteriores, testar nova versão em ambiente novo com fixtures e só trocar depois. Rever migrações de dados e compatibilidade de APIs/vendor. `pip freeze`/lock não faz backup de dados nem autentica binários. Não atualizar versões de ferramentas ou modelos para fazer um exemplo antigo parecer compatível sem rever o contrato.

## Remoção

Parar somente o serviço/processo inventariado, retirar registo MCP/PATH criado e revogar credenciais remotas quando aplicável. Remover o ambiente/prefixo específico após backup e aprovação; não apagar toolchain do sistema, tenant, cluster, recursos cloud ou caches globais. Desinstalar um CLI não destrói nem revoga recursos criados por ele. Dados e logs seguem retenção própria.

## Fontes e estado

As fontes por família estão na tabela. Manifestos/imports locais e limitações estão em [DEPENDENCIES.md](../DEPENDENCIES.md). **Estado: procedimentos gerais documentados; instalações específicas por tarefa ainda bloqueadas por seleção de versão, plataforma, alvo e aprovação.** Nenhuma stack opcional foi instalada ou testada nesta alteração. Completar o contrato de [INSTALLATION.md](../INSTALLATION.md#contrato-obrigatório-de-documentação) antes de promover um workflow a operacional.
