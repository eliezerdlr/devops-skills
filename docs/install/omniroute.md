# OmniRoute — instalação manual no macOS Apple Silicon

## Pré-requisitos e decisão de versão

Ler primeiro [a arquitetura e política](../../integrations/omniroute/README.md) e [o índice](../INSTALLATION.md). O procedimento destina-se a um operador, sem root, com painel local. Não instala Docker, Homebrew, tray, VPN ou proxy. Requer Node/npm compatíveis, curl, Python 3 para gerar ficheiros locais e, para o serviço, sessão macOS com launchd. Ver [host](host.md) se faltarem runtimes.

**Bloqueio de versão conhecido, confirmado em 2026-10-22:** npm `omniroute@3.8.53` devolve 404. O código 3.8.53 analisado em `UPSTREAM.json` não é um artefacto instalável publicado com essa versão. **Não usar `latest` nem construir source como fallback implícito.**

O caminho npm abaixo usa **3.8.52 como candidato de piloto, sujeito a aprovação explícita**. A metadata publicada e o source tag `v3.8.52` confirmam engines e flags usadas; não foi inspecionado integralmente o bundle de ~440 MiB nem executado. Isto não altera o pin da análise 3.8.53, não declara 3.8.52 homologado e não autoriza ligar contas. Quem exigir 3.8.53 deve parar e aguardar um artefacto revisto ou aprovar separadamente um procedimento de build.

```bash
set -euo pipefail
test "$(uname -s)" = Darwin
test "$(uname -m)" = arm64
command -v node
command -v npm
command -v python3
node -e 'const [a,b,c]=process.versions.node.split(".").map(Number); if(!((a===22&&(b>22||(b===22&&c>=2)))||(a>=24&&a<27))) process.exit(1)'
# Esperado: sem erro. Não mudar Node automaticamente se falhar.
```

Inventariar qualquer instalação/dados existentes antes de avançar: `command -v omniroute` (se existir) e presença de `~/.omniroute`. Não imprimir conteúdos de segredos. Não reutilizar dados de produção neste piloto.

## Instalação — prefixo privado e versionado

Executar blocos pela ordem, na mesma sessão Bash, **apenas após aprovar o candidato 3.8.52 e os scripts npm**. O prefixo fica fora do projeto. Sem `sudo`, sem `npm -g`, sem mudar a instalação Node/Pi existente.

```bash
set -euo pipefail
VERSION=3.8.52
ROOT="$HOME/.local/share/devops-skills/omniroute"
RELEASE="$ROOT/releases/$VERSION"
CONFIG="$HOME/.config/devops-skills/omniroute"
STATE="$ROOT/data-pilot-$VERSION"
LOGS="$ROOT/logs"
NODE_BIN="$(node -p 'require("node:fs").realpathSync(process.execPath)')"
# Parar se qualquer destino de instalação/configuração já existir.
test ! -e "$RELEASE"
test ! -e "$CONFIG"
test ! -e "$STATE"
umask 077
mkdir -p "$RELEASE" "$CONFIG" "$STATE" "$LOGS"
export VERSION ROOT RELEASE CONFIG STATE LOGS NODE_BIN
npm view "omniroute@$VERSION" version engines dist.integrity scripts.postinstall
```

Comparar a metadata com o pacote aprovado. SRI observado para **3.8.52**:

```text
sha512-R+GUs3vDWpX36n+oOwjRSJN/7dGoXC3ehSV7mSz41nZM4mFhUo2+YepYzXMk5Hf6sIwCKRpGBaPMDVR8xbvwew==
```

O npm verifica integridade dos downloads contra a metadata e grava-a no lock. A comparação abaixo impede aceitar silenciosamente outro artefacto com o mesmo número. Metadata por TLS e existência de SLSA não significam que a assinatura/proveniência foi validada independentemente.

```bash
EXPECTED_SRI='sha512-R+GUs3vDWpX36n+oOwjRSJN/7dGoXC3ehSV7mSz41nZM4mFhUo2+YepYzXMk5Hf6sIwCKRpGBaPMDVR8xbvwew=='
test "$(npm view "omniroute@$VERSION" dist.integrity)" = "$EXPECTED_SRI"
# Download/resolução sem executar hooks; ainda pode consumir disco e rede.
npm install --prefix "$RELEASE" --ignore-scripts --save-exact "omniroute@$VERSION"
```

**Gate manual obrigatório:** rever o `package-lock.json`, origem/SRI dos pacotes e `scripts/build/postinstall.mjs` do pacote descarregado, incluindo os helpers importados e hooks transitivos. Não há um comando automático que substitua essa revisão. `--ignore-scripts` é uma etapa de staging, **não prova que a aplicação funciona**. O upstream tem native SQLite e pode descarregar/reparar runtimes ou gerar `.env`; não executar reparações automáticas, tray ou mudanças de sistema sem aprovação. Reservar espaço também para cache/dependências/backups; 440 MiB é só tamanho descompactado publicado, não RAM nem disco total.

Depois de aprovar esses efeitos, reinstalar a árvore exata pelo lock com lifecycle scripts. Forçar `DATA_DIR` piloto e cwd externo ao source reduz ambiguidade, mas alguns helpers upstream podem usar outros paths; registar todos os paths escritos.

```bash
export DATA_DIR="$STATE"
cd "$RELEASE"
npm ci --prefix "$RELEASE"
"$NODE_BIN" "$RELEASE/node_modules/omniroute/bin/omniroute.mjs" --version
# Esperado: versão 3.8.52; parar perante ABI/SQLite incompatível.
# Não executar "runtime repair" nem npm rebuild genérico por tentativa e erro.
```

Guardar lock, SRI, versão Node/macOS/CPU e resultado em inventário privado. A resolução transitiva inicial não é universalmente reproduzível só com o pin direto; o lock aprovado é parte do deployment. Um `--version` pode inicializar componentes do CLI; só executar depois da revisão dos hooks e com o DATA_DIR isolado.

## Configuração — dados e segredos antes do primeiro arranque

Criar uma configuração privada nova, sem segredo em argumento CLI, transcript, Git ou plist. O código abaixo gera chave aleatória e pede a password sem eco. Python `getpass` deve ter TTY seguro; parar se avisar que não consegue ocultar entrada. Não executar este bloco através de um agente para fornecer passwords reais.

```bash
python3 - <<'PY'
import getpass, os, secrets, shlex
from pathlib import Path
p = Path(os.environ['CONFIG']) / 'service.env'
pw = getpass.getpass('Password inicial OmniRoute (forte e exclusiva): ')
if len(pw) < 20:
    raise SystemExit('Usar password forte com pelo menos 20 caracteres; nada foi escrito.')
values = {
    'DATA_DIR': os.environ['STATE'],
    'OMNIROUTE_SERVER_HOST': '127.0.0.1',
    'OMNIROUTE_HEADLESS': '0',
    'REQUIRE_API_KEY': 'true',
    'INITIAL_PASSWORD': pw,
    'STORAGE_ENCRYPTION_KEY': secrets.token_urlsafe(48),
}
with p.open('x') as f:
    f.write(''.join(k + '=' + shlex.quote(v) + '\n' for k, v in values.items()))
p.chmod(0o600)
print('Configuração privada criada; valores não mostrados.')
PY
```

Este é um ficheiro shell **gerado e detido pelo operador**, não um `.env` arbitrário recebido da rede. Fazer backup cifrado da chave de armazenamento e configurar recuperação antes de introduzir credenciais. No upstream analisado, plaintext é possível sem chave e em certas falhas de cifragem; verificar estado efetivo, permissões e logs sem imprimir tokens.

Gerar wrapper com paths absolutos e configuração privada; o plist não terá os segredos. Revisar o wrapper antes de executar. Só usar diretórios controlados pelo operador, sem symlinks inesperados.

```bash
python3 - <<'PY'
import os, shlex
from pathlib import Path
q = shlex.quote
root = Path(os.environ['ROOT'])
wrapper = root / 'run-pilot.sh'
node = os.environ['NODE_BIN']
release = Path(os.environ['RELEASE'])
config = Path(os.environ['CONFIG']) / 'service.env'
text = '#!/bin/bash\nset -euo pipefail\numask 077\n'
text += 'export PATH=' + q(str(Path(node).parent) + ':/usr/bin:/bin:/usr/sbin:/sbin') + '\n'
text += 'unset NODE_OPTIONS NODE_PATH\nset -a\n. ' + q(str(config)) + '\nset +a\n'
text += 'cd ' + q(str(root)) + '\n'
text += 'exec ' + q(node) + ' ' + q(str(release / 'node_modules/omniroute/bin/omniroute.mjs'))
text += ' serve --port 20128 --no-open --no-tray --no-recovery\n'
with wrapper.open('x') as f:
    f.write(text)
wrapper.chmod(0o700)
PY
bash -n "$ROOT/run-pilot.sh"
```

`--no-open` conserva o painel, sem abrir browser automaticamente. `--no-recovery` evita dois supervisores quando for usado launchd. Não usar `--headless`, `--daemon` ou tray neste perfil. Não desativar refresh/backup indiscriminadamente. O primeiro arranque pode iniciar tarefas opcionais com acesso à rede; aprovar/rever esses efeitos e, antes de ligar contas/dados, desativar individualmente features não aprovadas (cloud sync, memória/injeção, pools externos, MITM/túneis, MCP/A2A). Estas variáveis não fazem esse hardening por si só.

## Verificação — arranque manual primeiro

Confirmar porta livre; se houver listener, identificar proprietário e **não matar o processo**:

```bash
if lsof -nP -iTCP:20128 -sTCP:LISTEN; then
  printf '%s\n' 'Porta ocupada: identificar proprietário e parar aqui.'
  exit 1
fi
# Sem linhas/exit 1 do lsof é o caso normal sem listener.
# Erro de permissões/execução exige diagnóstico, não presumir porta livre.
```

Executar o bloco de arranque separado, depois da verificação:

```bash
"$ROOT/run-pilot.sh"
# Manter foreground; Ctrl-C para parar antes de configurar launchd.
```

Noutro terminal:

```bash
curl --connect-timeout 3 --max-time 10 --silent --show-error \
  --output /dev/null --write-out '%{http_code}\n' \
  http://127.0.0.1:20128/api/monitoring/health
lsof -nP -iTCP:20128 -sTCP:LISTEN
```

Esperar HTTP 200 para health e listener em **127.0.0.1**, não `*`/`0.0.0.0`. Health não prova autenticação nem inferência. Abrir manualmente `http://127.0.0.1:20128/dashboard` e confirmar login/password inicial, expiração de sessão e controlos de gestão. Não ligar providers antes de verificar proteção do painel e inferência. Criar chave de inferência separada, restrita aos modelos aprovados; guardar no gestor de segredos do cliente. Nunca copiar OAuth `/login` do Pi.

O smoke test de inferência, inclusive rejeição de pedido sem chave, é um passo **separado com dados sintéticos e orçamento autorizado**: uma configuração errada pode cobrar mesmo um pedido que se esperava recusado. Não publicar aqui comandos com chaves literais. Validar 429/503/auth, tools, contexto, SSE parcial e cancelamento; não repetir ferramentas/stream parcial. Ver [critérios do perfil](../../integrations/omniroute/README.md).

## Operação — launchd opcional após validação manual

Este **LaunchAgent de utilizador arranca após login**, não garante serviço antes do login nem disponibilidade com host suspenso. Para operação sem sessão, preparar separadamente LaunchDaemon com conta dedicada, paths/permissões e política de segredos; não basta copiar este plist para `/Library/LaunchDaemons`.

Depois de parar a instância manual e confirmar porta livre, gerar plist sem sobrepor ficheiro existente:

```bash
python3 - <<'PY'
import os, plistlib
from pathlib import Path
root = Path(os.environ['ROOT'])
logs = Path(os.environ['LOGS'])
p = Path.home() / 'Library/LaunchAgents/local.devops-skills.omniroute.plist'
p.parent.mkdir(parents=True, exist_ok=True)
d = {
    'Label': 'local.devops-skills.omniroute',
    'ProgramArguments': [str(root / 'run-pilot.sh')],
    'WorkingDirectory': str(root),
    'RunAtLoad': True,
    'KeepAlive': {'SuccessfulExit': False},
    'ThrottleInterval': 30,
    'ExitTimeOut': 30,
    'StandardOutPath': str(logs / 'stdout.log'),
    'StandardErrorPath': str(logs / 'stderr.log'),
}
with p.open('xb') as f:
    plistlib.dump(d, f)
p.chmod(0o600)
PY
PLIST="$HOME/Library/LaunchAgents/local.devops-skills.omniroute.plist"
plutil -lint "$PLIST"
# Gate separado: aprovar serviço persistente antes do bootstrap.
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl print "gui/$(id -u)/local.devops-skills.omniroute"
```

Para parar e retirar da sessão: `launchctl bootout "gui/$(id -u)" "$PLIST"`. Voltar a iniciar com `bootstrap` apenas depois de corrigir a falha e confirmar ausência de instância órfã. Configurar retenção/rotação privada de logs e alertas externos; o exemplo não instala rotação nem monitorização. Logs podem conter dados sensíveis. Não usar `KeepAlive` como prova de serviço funcional.

Acesso remoto continua **bloqueado até definir VPN/mesh, certificados, proxy autenticado e ACL**. Não alterar bind para todas as interfaces para resolver acesso. O proxy deve ligar ao loopback e escutar apenas no endereço/interface autorizado; a identidade/MFA e as rotas dependem da infraestrutura escolhida.

## Atualização, backup e rollback

1. Pausar automações; parar instância/supervisor e confirmar que **todos** os processos que usam o DATA_DIR terminaram. Sem live-copy cega de SQLite.
2. Com serviço parado, arquivar o DATA_DIR completo (DB e eventuais WAL/SHM), configuração e chave em armazenamento cifrado aprovado; guardar permissões e lock/SRI/release Node. Não guardar password/chave em backup plaintext na cloud. Confirmar espaço, checksum e recuperação.
3. Instalar nova versão em prefixo novo. Testar com cópia isolada da DB **não simultaneamente aberta por duas instâncias**, portas distintas e sem credenciais de produção ativas para evitar efeitos de refresh/saída de rede não autorizados.
4. Só após restore e gates funcionais passar wrapper/serviço para a release aprovada. Não executar `npm update` dentro da release ativa.
5. Rollback requer **release anterior + DB/config/chave compatíveis do mesmo snapshot**. Repor binário antigo sobre DB migrada não é rollback seguro. RPO/RTO são objetivos medidos por teste, não garantias.

Exemplo de cópia local **somente após paragem e autorização**, antes de transferir para backup cifrado; o destino conterá segredos e deve permanecer em disco cifrado/protegido:

```bash
BACKUP="$HOME/.local/share/devops-skills/backups/omniroute-$(date +%Y%m%d-%H%M%S)"
test ! -e "$BACKUP"
umask 077
mkdir -p "$BACKUP"
cp -pR "$STATE" "$BACKUP/data"
cp -pR "$CONFIG" "$BACKUP/config"
cp -p "$RELEASE/package-lock.json" "$BACKUP/package-lock.json"
# Não imprimir service.env nem enviar este diretório a um modelo.
```

Restauro: manter serviço parado; verificar integridade do snapshot; restaurar para destinos novos/privados; apontar `DATA_DIR` e configuração ao par restaurado; testar com a release original isoladamente; só promover depois de confirmar resultados. Não copiar sobre um diretório de dados ativo.

## Remoção e recuperação de falhas

Parar via `bootout`, confirmar listeners/PIDs, desregistar apenas o provider OmniRoute no Pi preservando settings/logins, e remover apenas o plist/wrapper desta instalação se já não forem usados. Arquivar release/config/dados para retenção aprovada. A remoção de software não revoga tokens no fornecedor: revogar separadamente quando aplicável.

Não executar `uninstall --full`, `rm -rf ~/.omniroute` ou limpeza geral de npm. Remover prefixos explicitamente inventariados só após conferir backup/restauro e outros consumidores. Se interrompido durante staging, conservar lock/logs e usar diretório de release novo; não promover instalação parcial. Se SQLite/ABI falhar, registar Node/CPU/artefacto e rever o mecanismo oficial da versão; sem reparação automática com root.

## Fontes e estado

- [npm 3.8.52](https://registry.npmjs.org/omniroute/3.8.52): engines, bin, scripts, SRI e provenance metadata; não houve validação criptográfica da attestation.
- [Source tag 3.8.52](https://github.com/cheaper-inference/OmniRoute/tree/v3.8.52): `package.json`, `.env.example`, `bin/cli/commands/serve.mjs` confirmados para os comandos publicados.
- [Análise source 3.8.53](https://github.com/cheaper-inference/OmniRoute/tree/bdcd6c0088f7a68bb0d18b258fcdc1d6cd44c9ce): persistência/cifragem, política de auth e lifecycle consultados; diferenças no artefacto 3.8.52 ainda exigem verificação no piloto.
- macOS `man launchd.plist` e `man launchctl` no host-alvo são referência para LaunchAgent, `bootstrap`, `bootout` e lifecycle.

**Estado:** procedimento documental revisto, sem instalação, arranque, inferência, backup/restauro ou teste launchd executados. O candidato publicado não está homologado. [Ligação Pi e rollback de configuração](../../integrations/omniroute/README.md#ligar-pi-ao-gateway--sem-sobrescrever-configurações).
