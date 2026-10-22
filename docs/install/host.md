# Host — Node, Pi e registo do pacote

## Pré-requisitos

macOS arm64, utilizador sem root, Git, curl, tar e `shasum`. Comandos em Bash, fora do checkout. Se Node/Pi já existem, **não instalar outra cópia**: primeiro verificar proprietário/gestor e versão. Node **24.22.1 LTS** foi confirmado no índice oficial em 2026-10-22; é candidato documental compatível com os engines analisados, não runtime testado aqui. Pi **1.3.0** é a referência dos testes históricos; **1.4.0** foi observado instalado neste host, não homologado com o pacote.

```bash
set -euo pipefail
uname -s
uname -m
command -v node
node --version
command -v npm
npm --version
command -v pi
pi --version
```

Se um comando faltar, executar apenas a instalação correspondente abaixo. Guardar a origem dos executáveis; um `pi` gerido não deve ser sobreposto por npm. Não precisa de alterar Node apenas porque executou `pi update`.

## Instalação — Node apenas se necessário

A distribuição oficial é instalada num prefixo privado e versionado. Não instala Homebrew nem mexe em profiles. Parar se OS/arquitetura diferirem.

```bash
set -euo pipefail
test "$(uname -s)" = Darwin
test "$(uname -m)" = arm64
NODE_VERSION=24.22.1
NODE_PREFIX="$HOME/.local/opt/node/$NODE_VERSION"
NODE_STAGE="$HOME/.cache/devops-skills/node-$NODE_VERSION"
test ! -e "$NODE_PREFIX"
test ! -e "$NODE_STAGE"
umask 077
mkdir -p "$NODE_STAGE"
cd "$NODE_STAGE"
ARCHIVE="node-v$NODE_VERSION-darwin-arm64.tar.gz"
curl --proto '=https' --tlsv1.2 --fail --show-error --location \
  --proto-redir '=https' --output "$ARCHIVE" \
  "https://nodejs.org/dist/v$NODE_VERSION/$ARCHIVE"
curl --proto '=https' --tlsv1.2 --fail --show-error --location \
  --proto-redir '=https' --output SHASUMS256.txt \
  "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt"
awk -v f="$ARCHIVE" '$2 == f { print }' SHASUMS256.txt > selected.sha256
test "$(wc -l < selected.sha256 | tr -d ' ')" = 1
# Hash revisto no manifesto oficial em 2026-10-22; divergência exige revisão.
test "$(awk '{print $1}' selected.sha256)" = '89c682593d76cd44233fa53b1563264e7de9cbb189cad169135c5b4fadfbc0a7'
shasum -a 256 --check selected.sha256
mkdir -p "$NODE_PREFIX"
tar -xzf "$ARCHIVE" -C "$NODE_PREFIX" --strip-components=1
export PATH="$NODE_PREFIX/bin:$PATH"
node --version
npm --version
```

Resultado esperado: `v24.22.1`. SHA256 verifica integridade contra o manifesto recebido por TLS; para autenticidade independente, verificar também as assinaturas oficiais segundo a política da organização. Não alegar que TLS + checksum constitui uma auditoria de supply chain. Guardar manifesto e artefacto aprovados para rollback.

### Pi — escolher instalação existente ou npm isolado

Neste host, o launcher gerido já aponta para Pi 1.4.0. **Não executar a alternativa npm abaixo nesse caso.** Para uma máquina sem Pi e sem gestor existente, o pacote oficial npm permite um prefixo separado. Este exemplo conserva a referência **1.3.0**; uma adoção de 1.4.0 requer uma mudança aprovada e novos testes.

```bash
PI_VERSION=1.3.0
PI_RELEASE="$HOME/.local/opt/pi/$PI_VERSION"
test ! -e "$PI_RELEASE"
mkdir -p "$PI_RELEASE"
npm view "@earendil-works/pi-coding-agent@$PI_VERSION" version engines dist.integrity
# Gate manual: confirmar pacote/versão, rever hooks/dependências e aprovar download.
npm install --prefix "$PI_RELEASE" --save-exact \
  "@earendil-works/pi-coding-agent@$PI_VERSION"
"$PI_RELEASE/node_modules/.bin/pi" --version
```

A instalação npm pode executar lifecycle scripts de dependências; não a executar sem rever/autorizar esses efeitos. Guardar `package-lock.json` e `npm ls --prefix "$PI_RELEASE" --all` em inventário privado. Não substituir o launcher de uma instalação gerida, não copiar `auth.json`, não executar instalador remoto via pipe. Os ficheiros npm ficam em `$PI_RELEASE`, não em `devops-skills`.

## Configuração

Se foi escolhido npm isolado, usar o caminho absoluto acima ou acrescentar o seu `node_modules/.bin` ao PATH **apenas no processo desejado**, depois de revisão. Não gravar profiles automaticamente. O diretório de agente Pi pode ser personalizado e `~/.pi/agent` pode ser symlink; confirmar o destino real antes de backups ou edição.

Registar a raiz do pacote uma única vez:

```bash
PACK="/caminho/absoluto/devops-skills"
test -f "$PACK/package.json"
pi list
pi install "$PACK"
```

Este comando altera settings Pi; obter aprovação e backup privado primeiro. Autenticação `/login` é ação separada do operador. Skills não instalam servidores. Não partilhar `auth.json` nem usar um dump de configurações como diagnóstico público.

## Verificação

Dentro do Pi: `/reload`, consultar skills e executar `/devops-routing-status` se a extensão estiver carregada. Para `gateway-managed`, esperar `Routing disabled`. Isso não comprova OmniRoute. Verificar `pi list` para evitar módulos redundantes.

Da raiz do checkout:

```bash
npm test
```

Testes SDK são separados e só após aprovação; `PI_SDK_ROOT` deve apontar para o SDK **da versão que se quer testar**, não para uma cópia antiga. Não anunciar Pi 1.4.0 homologado por executar testes com SDK 1.3.0.

## Operação

Pi é iniciado pelo operador/host existente. Este guia não cria serviço Pi Web nem abre portas. As extensões não precisam de daemon próprio. Uma instalação managed pode manter várias releases; isso não é instalação no diretório corrente.

## Atualização e rollback

Na CLI Pi 1.4.0, `pi update` atualiza **o Pi**; `pi update --extensions` reconcilia pacotes; `pi update --models` atualiza catálogos. Um pacote local continua a ser o checkout, não uma cópia npm. Verificar `pi update --help` na versão existente antes de executar: atualização não é um health check.

Antes de atualizar: backup privado de settings/auth, versão/gestor e release anterior. Não executar `pi update` como parte de carregar skills. Para npm isolado, instalar outra versão em **novo prefixo**, validar e trocar o PATH; rollback é voltar ao prefixo anterior e à configuração compatível. Para instalação gerida, usar o procedimento do gestor/instalador original, não editar arbitrariamente `current-version`. Nunca remover versões anteriores antes do teste de recuperação.

## Remoção

Para desregistar só o pacote: `pi remove /caminho/absoluto/devops-skills`, preservando restantes entradas. Não apaga o checkout nem runtimes externos. Para remover um Pi/Node npm/manual isolado, primeiro retirar apenas o PATH/serviço criado e confirmar que nada usa o prefixo; arquivar ou remover **apenas esse prefixo aprovado**. Não apagar `~/.pi`, logins ou versões geridas para limpar uma instalação isolada.

## Fontes e estado

- [Distribuições Node](https://nodejs.org/dist/index.json), [release e checksums](https://nodejs.org/dist/v24.22.1/).
- [Pi oficial](https://github.com/earendil-works/pi), [metadata npm 1.4.0](https://registry.npmjs.org/@earendil-works%2fpi-coding-agent/1.4.0).
- `docs/cli.md` e `docs/packages.md` dos SDKs locais 1.3.0/1.4.0 confirmam os comandos e a distinção entre pacote local e instalação do host; consultar a versão instalada.

**Estado:** guia revisto contra fontes; nenhum download de runtime, instalação ou arranque foi realizado para o escrever. A instalação limpa e o rollback deste procedimento ainda não foram executados. Não é uma garantia de suporte de todas as versões/plataformas.
