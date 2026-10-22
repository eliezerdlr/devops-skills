# Archify — provisionar runtime externo pinado

## Pré-requisitos

Opcional, só para gerar diagramas HTML. Não instalar o projeto de desenvolvimento inteiro nem outra skill Pi. Requer Git, Node >=18 para o runtime (usar o Node aprovado do host), Python 3 apenas para a verificação de hashes publicada abaixo, acesso ao GitHub para obter source e diretório privado fora do checkout de skills. `deliver`/`check` deste caminho usam Node built-ins; não precisam de `npm install`, Chrome, Playwright ou instalação de fontes no sistema.

Pin: **Archify 3.2.0**, commit `25cf37080fc8b1dbe758a4efc3935b55f3327083`; [proveniência](../../integrations/archify/UPSTREAM.json) e [203 hashes](../../integrations/archify/runtime-lock.json). O bundle contém assets/fontes e licenças de terceiros que devem ser preservados, não redistribuídos como autoria própria.

```bash
set -euo pipefail
command -v git
command -v node
command -v python3
node --version
```

## Instalação — checkout novo, sem npm/hooks

Executar apenas após aprovação do download. Paths não podem conter symlinks em ancestrais para o adaptador; usar caminhos físicos, não aliases como `/tmp` que no macOS podem resolver para outro path.

```bash
set -euo pipefail
PACK="/caminho/absoluto/devops-skills"
PIN=25cf37080fc8b1dbe758a4efc3935b55f3327083
DEST="$HOME/.local/opt/archify/$PIN"
test -f "$PACK/integrations/archify/runtime-lock.json"
test ! -e "$DEST"
umask 077
mkdir -p "$(dirname "$DEST")"
git clone --no-checkout https://github.com/tt-a1i/archify.git "$DEST"
git -C "$DEST" -c core.hooksPath=/dev/null checkout --detach "$PIN"
test "$(git -C "$DEST" rev-parse HEAD)" = "$PIN"
export PACK DEST
```

Não executar instaladores upstream, `npm install`, build de gallery, `finalize`, browser, update ou comandos proativos mencionados no README externo. O root `package.json` upstream não é o contrato desta integração. Clone por hash e hashes locais confirmam identidade/conteúdo conhecido, não confiança em Git/Node/OS nem isolamento.

## Configuração e integridade

O ambiente aponta para o **subdiretório `archify/`**, não a raiz Git nem `integrations/archify`:

```bash
export DEVOPS_ARCHIFY_DIR="$(cd "$DEST/archify" && pwd -P)"
export ARCHIFY_UPDATE_CHECK_DISABLED=1
python3 - <<'PY'
import hashlib, json, os
from pathlib import Path
runtime = Path(os.environ['DEVOPS_ARCHIFY_DIR'])
lock = json.loads((Path(os.environ['PACK']) / 'integrations/archify/runtime-lock.json').read_text())
for ancestor in [runtime, *runtime.parents]:
    if ancestor.is_symlink():
        raise SystemExit('Symlink não permitido no runtime')
for rel, expected in lock.items():
    p = runtime / rel
    if any(x.is_symlink() for x in [p, *p.parents]):
        raise SystemExit('Symlink não permitido: ' + rel)
    if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest() != expected:
        raise SystemExit('Hash divergente ou ficheiro ausente: ' + rel)
pkg = json.loads((runtime / 'package.json').read_text())
if pkg['version'] != '3.2.0':
    raise SystemExit('Versão divergente')
print('PASS:', len(lock), 'hashes; Archify', pkg['version'])
PY
```

Esperado: 203 hashes e versão 3.2.0. Parar se divergir; não regenerar lock para ocultar diferenças. O adaptador também verifica o pin a cada plano/execução. Ficheiros extra e processos do mesmo utilizador não são autenticados por este hash inventory; manter diretórios controlados e rever qualquer conteúdo extra.

Nenhuma API key necessária para renderizar JSON local. Preparar `outputRoot` privado e aprovado; inputs/receipts/HTML não devem conter segredos. Definir ambiente apenas no processo Pi/terminal desejado, sem editar profiles globais. O adaptador força update checks off nos subprocessos; isso não implementa bloqueio de rede do SO.

## Verificação

A verificação acima não executa código upstream. Para testar ligação ao adaptador, preparar candidate/config seguindo [autoria](../../integrations/archify/skills/archify/references/authoring.md) e [operação](../../integrations/archify/skills/archify/references/operations.md), com paths físicos e output novo. Não copiar um example de outro tipo sem ajustar meta/schema/output.

```bash
# Só depois de preparar e aprovar a configuração; substituir o caminho.
node "$PACK/integrations/archify/adapter.mjs" plan /caminho/fisico/config.json
```

Esperado: plano válido, sem escrita nem subprocessos. `execute` é um gate **separado**, autorizado explicitamente: executa o runtime, cria output e receipts. Depois conferir `ok=true`, proveniência e inspeção visual autorizada; um hash/receipt não prova qualidade visual. Não executar renderização como efeito colateral de instalação.

## Operação

CLI pontual, sem daemon, listener, watcher ou serviço launchd. Execução exclusivamente pelo adaptador aprovado; não encaminhar flags arbitrárias ao runtime. O Node filho tem ambiente reduzido e timeouts, mas não sandbox OS/rede. Preservar fontes, logs e receipts quando houver falha; usar pasta nova por tentativa, sem sobrescrever outputs.

## Atualização e rollback

Uma versão nova exige revisão de licença/schema/runtime e novo lock **aprovado no projeto**; não atualizar source in-place nem aceitar simplesmente o mesmo campo version. Instalar em novo `$DEST`, manter commit anterior e dados de autoria/receipts. Enquanto a integração não aprovar outro pin, continuar com o commit exato atual. Rollback documental é restaurar pin/adaptador compatíveis e repor `DEVOPS_ARCHIFY_DIR` anterior; não apagar os artefactos que explicam uma entrega. HTML gerado não substitui candidate/config como fonte editável.

## Remoção

Remover a variável do processo/profile que efetivamente a definiu e desativar a skill se necessário. Isso não apaga o source nem diagramas. Confirmar que nenhum processo/consumidor usa `$DEST`, arquivar e remover **apenas o checkout inventariado** após aprovação; preservar outputs e licenças conforme retenção. Não remover Git, Node ou fontes do sistema: este procedimento não os instalou.

## Fontes e estado

- [Source pinado](https://github.com/tt-a1i/archify/tree/25cf37080fc8b1dbe758a4efc3935b55f3327083), em particular `archify/package.json`, CLI, schemas e contrato de delivery.
- [Operação do adaptador](../../integrations/archify/skills/archify/references/operations.md), [limites de segurança](../../integrations/archify/skills/archify/references/safety-and-evidence.md).

**Estado:** source e contrato inspecionados; testes anteriores usaram runtime mock. Estes comandos de clone/instalação, renderização real e rollback não foram executados nesta alteração. O pin não é certificação de segurança ou qualidade visual.
