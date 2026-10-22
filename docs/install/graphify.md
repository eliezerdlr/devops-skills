# Graphify — CLI Python isolado

## Pré-requisitos

Opcional, só para executar mapas/consultas. Ler [limites e workflow](../../integrations/graphify/README.md). macOS com Python local aprovado; referência de piloto: Python 3.12, Git se trabalhar com source, espaço para gramáticas/dependências/cache. Upstream/PyPI `graphifyy==0.9.93` declara Python >=3.10; isso não homologa qualquer Python/CPU nem todos os extras. Não instalar Python ou uv silenciosamente.

```bash
set -euo pipefail
command -v python3.12
python3.12 --version
# Se faltar: escolher distribuição Python aprovada antes de continuar.
# Verificar se já existe um graphify; não instalar cópia concorrente.
command -v graphify || true
```

Nome da distribuição: **graphifyy** (dois y); executável: **graphify**. Não confundir com pacotes homónimos. Se já instalado por pipx/uv, inventariar `pipx list`/`uv tool list` no gestor existente e escolher **um só** método. O venv abaixo evita depender de instalar um gestor adicional.

## Instalação

Num diretório fora do source, na mesma sessão Bash:

```bash
set -euo pipefail
VERSION=0.9.93
VENV="$HOME/.local/opt/graphify/$VERSION"
INVENTORY="$HOME/.local/share/devops-skills/graphify/$VERSION"
test ! -e "$VENV"
test ! -e "$INVENTORY"
umask 077
mkdir -p "$INVENTORY"
python3.12 -m venv "$VENV"
"$VENV/bin/python" -m pip --version
# Gate manual: aprovar distribuição e dependências/transmissão ao PyPI.
"$VENV/bin/python" -m pip install --disable-pip-version-check 'graphifyy==0.9.93'
"$VENV/bin/python" -m pip freeze --all > "$INVENTORY/freeze.txt"
"$VENV/bin/python" -m pip check
"$VENV/bin/graphify" --version
```

Esperado: `graphify 0.9.93`, `pip check` sem conflitos. Instalação pode descarregar wheels e construir dependências nativas se não houver wheel compatível; parar e rever toolchain/CPU em vez de instalar compiladores como root por tentativa. O pin direto não fixa transitivas: antes de promover, produzir lock com hashes/wheelhouse a partir da resolução revista e testar nova instalação offline com esse conjunto. `freeze.txt` é inventário, não verificação criptográfica nem lock universal. Extras Terraform/SQL/media/model providers não são instalados por este procedimento.

Alternativas, **apenas com gestor já aprovado**: `pipx install 'graphifyy==0.9.93'` ou `uv tool install 'graphifyy==0.9.93'`. Guardar versão do gestor/Python e inventário transitivo. Não executar `pipx ensurepath`/instalador uv sem aprovar alteração de PATH/downloads; não é necessário se for usado caminho absoluto do venv.

## Configuração

Usar o executável absoluto para não mascarar outra instalação. Num processo dedicado:

```bash
export PATH="$VENV/bin:$PATH"
export GRAPHIFY_BACKEND=none
export GRAPHIFY_NO_AUTO_REFRESH=1
export GRAPHIFY_QUERY_LOG_DISABLE=1
```

Não gravar em profiles sem revisão. Estes settings são os exigidos pelos workflows adaptados, não firewall/sandbox. Não chamar `graphify install`, watcher, guard, MCP/server ou hooks. Nenhuma chave LLM é necessária para consultar grafo já existente; processamento semântico/envio de conteúdo requer autorização separada. Outputs/grafos/cache têm paths definidos pelo workflow; escolher explicitamente projeto e raiz de output sem segredos, fora de HOME global. Não usar filesystem não confiável/symlinks para simular confinamento.

## Verificação

`--version` prova disponibilidade do CLI; não prova mapa ou análise correta. Primeiro rever `graphify --help` e o [workflow estrutural aprovado](../../integrations/graphify/workflows/map-and-query.md). Executar mapa/consulta somente com corpus sintético e output autorizado; não indexar este workspace inteiro por consequência de instalar. Comparar entidades/arestas esperadas e confirmar ausência de ficheiros fora do output/corpus aprovados. Registar efetivamente quais comandos e formatos foram testados. Testes anteriores map/query/save-result/reflect com corpus sintético não certificam todos os parsers nem economia de tokens.

## Operação

Ferramenta pontual, **sem serviço persistente, portas ou arranque no login**. Parar tarefa foreground com Ctrl-C e conservar evidência se houver escrita parcial. Uma falha não autoriza apagar locks/cache indiscriminadamente. Memória/retoma da skill continua explícita, não captura automática de sessões.

## Atualização e rollback

Guardar venv anterior, freeze/lock/wheels e backup dos grafos/notas/output antes de atualizar. Instalar versão nova num prefixo novo; testar corpus sintético e compatibilidade de grafos/formato. Só depois trocar o caminho do executável. Voltar ao prefixo anterior **e ao conjunto de dados compatível** se existir migração de grafo. Não executar `pip install --upgrade` dentro do venv ativo durante trabalhos. Um venv não é um backup portável entre versões de Python/OS: para recuperação noutra máquina usar artefactos/lock aprovados e validar.

## Remoção

Desativar a skill pelo filtro do pacote se desejado; isso não remove o CLI nem os dados. Para venv, retirar apenas o PATH/atalho adicionado e arquivar/remover o diretório `$VENV` explicitamente inventariado após aprovação. Não apagar grafos/notas/cache sem política de retenção. Se instalado por pipx/uv, usar **o mesmo gestor** (`pipx uninstall graphifyy` ou `uv tool uninstall graphifyy`), não uma limpeza global de Python. Nunca remover o Python do sistema para desinstalar uma ferramenta.

## Fontes e estado

- [PyPI 0.9.93](https://pypi.org/project/graphifyy/0.9.93/), [metadata e hashes dos artefactos](https://pypi.org/pypi/graphifyy/0.9.93/json), consultados em 2026-10-22.
- [Proveniência e source pin](../../integrations/graphify/UPSTREAM.json).
- [venv oficial](https://docs.python.org/3/library/venv.html), [instalações repetíveis pip](https://pip.pypa.io/en/stable/topics/repeatable-installs/), [pipx](https://pipx.pypa.io/stable/), [uv tools](https://docs.astral.sh/uv/guides/tools/).

**Estado:** receita documentada, não executada nesta alteração. A instalação limpa, lock transitivo fechado, upgrade e recuperação ainda precisam de teste no host-alvo. Fontes oficiais orientam os comandos; versões externas podem retirar wheels ou alterar disponibilidade.
