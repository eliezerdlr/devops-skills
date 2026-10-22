# OmniRoute como serviço — launchd e systemd

Usa a instalação **`npm install -g omniroute` já existente**. Não instala outra cópia nem acrescenta PM2, Docker ou wrappers de terceiros. Só executar após o arranque manual funcionar. Os passos são manuais; este pacote não ativa serviços.

## 1. Confirmar caminhos e dados — ambos os sistemas

No terminal do utilizador que vai executar o serviço:

```bash
command -v node
npm root -g
id -un
printf '%s\n' "$HOME"
```

Usar caminhos absolutos nos exemplos. O CLI é `<npm root -g>/omniroute/bin/omniroute.mjs`. Executá-lo com o Node absoluto evita depender de `nvm`/`fnm` ou profiles que o serviço não carrega. Depois de mudar Node/prefixo npm, rever estes caminhos.

**Não correr o gateway como root.** Se uma conta dedicada for escolhida, tem de conseguir ler/executar a instalação Node/npm e possuir os seus dados. Não copiar credenciais de outra conta nem apontar uma segunda instância à mesma DB.

Antes de ativar o serviço: parar a instância manual com Ctrl+C e confirmar que a porta 20128 está livre. Não matar processos desconhecidos. Preservar o **DATA_DIR efetivo** e a chave de armazenamento existentes; não criar um diretório vazio e anunciar que as contas desapareceram.

## 2. Configuração privada — ambos os sistemas

Criar diretório apenas para a configuração do serviço:

```bash
mkdir -p "$HOME/.config/omniroute-service"
chmod 700 "$HOME/.config/omniroute-service"
```

Com editor local, criar `~/.config/omniroute-service/service.env`, modo 600, substituindo os dois valores indicados. Usar paths sem expansão `~`/`$HOME` e valores simples sem espaços neste ficheiro, para ser compatível com shell e systemd:

```dotenv
OMNIROUTE_SERVER_HOST=127.0.0.1
OMNIROUTE_HEADLESS=0
REQUIRE_API_KEY=true
DATA_DIR=/CAMINHO/ABSOLUTO/DOS/DADOS
STORAGE_ENCRYPTION_KEY=CHAVE_EXISTENTE_OU_NOVA_GERADA_LOCALMENTE
```

```bash
chmod 600 "$HOME/.config/omniroute-service/service.env"
```

**Não iniciar com placeholders.** Se já há contas, reutilizar a chave correta; não a regenerar. Numa instalação nova sem chave, obter uma chave forte no gestor de segredos ou gerar localmente para um ficheiro privado, sem a imprimir no chat:

```bash
# Só se ainda não existe uma chave. Não sobrescreve storage-key.new existente.
(umask 077; set -C; openssl rand -hex 32 > "$HOME/.config/omniroute-service/storage-key.new")
```

Transferir o valor pelo editor local para `service.env`, guardar cópia cifrada recuperável e eliminar o ficheiro auxiliar só depois de confirmar o backup. Não enviar esses ficheiros a um modelo. A presença da variável não certifica cifragem efetiva; confirmar comportamento do servidor antes de introduzir contas. Manter login forte do painel e chave de inferência separada. Não usar `INITIAL_PASSWORD` para redefinir uma instalação existente.

## 3. macOS — launchd

### Arranque após login do utilizador

Este **LaunchAgent** mantém o processo sem terminal depois do login. Não inicia antes do login e não torna um portátil suspenso disponível. Para funcionamento antes do login é necessário um LaunchDaemon com conta dedicada, configuração diferente e validação própria; não mover este plist para `/Library/LaunchDaemons` por tentativa.

Criar `~/.config/omniroute-service/run.sh` com os caminhos reais de Node e CLI:

```bash
#!/bin/bash
set -euo pipefail
umask 077
export PATH=/DIRETORIO/DO/NODE:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
set -a
. "$HOME/.config/omniroute-service/service.env"
set +a
exec /CAMINHO/ABSOLUTO/node /PREFIXO/NPM/lib/node_modules/omniroute/bin/omniroute.mjs serve --port 20128 --no-open --no-tray --no-recovery
```

O path do CLI é apenas ilustrativo: usar exatamente o resultado de `npm root -g` seguido de `/omniroute/bin/omniroute.mjs`. O ficheiro sourced é configuração privada criada pelo operador, não conteúdo recebido da rede. `--no-recovery` deixa o restart a cargo de launchd, sem dois supervisores.

```bash
chmod 700 "$HOME/.config/omniroute-service/run.sh"
bash -n "$HOME/.config/omniroute-service/run.sh"
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs/omniroute"
chmod 700 "$HOME/Library/Logs/omniroute"
```

Criar `~/Library/LaunchAgents/local.omniroute.plist`; substituir **todos** os paths `/Users/UTILIZADOR`. Se paths contiverem caracteres XML, codificá-los (por exemplo `&amp;` para `&`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>local.omniroute</string>
  <key>ProgramArguments</key>
  <array><string>/Users/UTILIZADOR/.config/omniroute-service/run.sh</string></array>
  <key>WorkingDirectory</key><string>/Users/UTILIZADOR/.config/omniroute-service</string>
  <key>EnvironmentVariables</key>
  <dict><key>HOME</key><string>/Users/UTILIZADOR</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>ExitTimeOut</key><integer>30</integer>
  <key>Umask</key><integer>63</integer>
  <key>StandardOutPath</key><string>/Users/UTILIZADOR/Library/Logs/omniroute/stdout.log</string>
  <key>StandardErrorPath</key><string>/Users/UTILIZADOR/Library/Logs/omniroute/stderr.log</string>
</dict>
</plist>
```

`63` é o valor decimal da máscara octal `077`. Segredos ficam no ficheiro privado, não no plist. Validar e ativar **apenas quando os paths estiverem corretos**:

```bash
PLIST="$HOME/Library/LaunchAgents/local.omniroute.plist"
chmod 600 "$PLIST"
plutil -lint "$PLIST"
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl print "gui/$(id -u)/local.omniroute"
```

Comandos de gestão:

```bash
# Parar/descarregar da sessão atual; o plist continua registado para próximo login.
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/local.omniroute.plist"
# Iniciar novamente depois de bootout:
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/local.omniroute.plist"
```

Logs: `~/Library/Logs/omniroute/stdout.log` e `stderr.log`; consultar localmente e redigir segredos antes de partilhar. Definir retenção/rotação conforme necessidade; o exemplo não instala outro daemon de logs.

## 4. Linux — systemd

### Arranque no boot sem login

Requer Linux com systemd e aprovação administrativa **apenas para registar a unit**. Usar o utilizador não privilegiado da instalação npm existente. O processo continua sem root. Não usar este exemplo numa distribuição sem systemd.

Criar `/etc/systemd/system/omniroute.service` com `sudoedit` ou editor administrativo aprovado. Substituir utilizador e todos os caminhos; não colocar segredos na unit:

```ini
[Unit]
Description=OmniRoute gateway
Wants=network-online.target
After=network-online.target
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
User=UTILIZADOR
Environment=HOME=/home/UTILIZADOR
Environment=PATH=/DIRETORIO/DO/NODE:/usr/local/bin:/usr/bin:/bin
EnvironmentFile=/home/UTILIZADOR/.config/omniroute-service/service.env
WorkingDirectory=/home/UTILIZADOR/.config/omniroute-service
ExecStart=/CAMINHO/ABSOLUTO/node /PREFIXO/NPM/lib/node_modules/omniroute/bin/omniroute.mjs serve --port 20128 --no-open --no-tray --no-recovery
Restart=on-failure
RestartSec=10
TimeoutStopSec=30
KillMode=control-group
NoNewPrivileges=true
UMask=0077

[Install]
WantedBy=multi-user.target
```

Exemplo pressupõe paths sem espaços. Se o host tem paths diferentes, usar sintaxe de quoting de systemd em `ExecStart`/`EnvironmentFile`; não copiar quoting shell para uma unit. O diretório do Node em PATH deve corresponder ao binário em ExecStart. `DATA_DIR` precisa de permissões de escrita do `User`, sem abrir dados a outros utilizadores.

Validar e ativar:

```bash
sudo systemd-analyze verify /etc/systemd/system/omniroute.service
sudo systemctl daemon-reload
sudo systemctl enable --now omniroute.service
systemctl status omniroute.service --no-pager
```

Comandos de gestão:

```bash
sudo systemctl restart omniroute.service
sudo systemctl stop omniroute.service
# Parar e desativar no boot:
sudo systemctl disable --now omniroute.service
# Logs desta unit, não de todo o host:
sudo journalctl -u omniroute.service -n 100 --no-pager
```

Configurar retenção/acesso de journald pela política do host, sem alterar parâmetros globais inadvertidamente. Em hosts onde systemd já aplica sandboxing, verificar acesso ao Node/npm e DATA_DIR; não desligar controlos às cegas.

## 5. Verificar, atualizar e remover

Em ambos os sistemas, confirmar listener apenas local (`lsof` no macOS ou `ss -ltnp` no Linux) e health:

```bash
curl --connect-timeout 3 --max-time 10 --silent --show-error --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:20128/api/monitoring/health
```

Esperado: 200, processo estável, login no painel. Health não prova inferência autenticada. Fazer smoke test de inferência separadamente com dados sintéticos, orçamento e destinatários aprovados. Não expor a porta na Internet; acesso remoto usa TLS/auth/ACL separados.

Para atualizar: parar o serviço, guardar versão e backup consistente de dados/configuração/chave, executar `npm install -g omniroute` pelo **mesmo utilizador/gestor npm**, rever caminhos Node/CLI e voltar a iniciar. Não executar a instalação como root só porque systemctl usa sudo. Rollback repõe versão anterior e snapshot de DB/config/chave compatível.

Para remover só o serviço:

- macOS: `bootout`, depois retirar apenas `local.omniroute.plist` e o wrapper se não houver outros consumidores. Não deixar plist para voltar no próximo login.
- Linux: `disable --now`, retirar apenas `omniroute.service` e executar `sudo systemctl daemon-reload`.

Preservar dados e segredos conforme retenção. Desinstalar o software com `npm uninstall -g omniroute` é passo separado. Se já existe outro serviço/instância/porta, parar e identificar; não sobrepor nem duplicar a DB.

## Fontes e validação

- [OmniRoute](https://github.com/cheaper-inference/OmniRoute/tree/v3.8.52): flags `serve`, `--no-open`, `--no-tray`, `--no-recovery` e encaminhamento SIGTERM.
- macOS: `man launchd.plist` e `man launchctl` no host; [guia Apple de daemons e serviços](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).
- [systemd.service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html), [systemd.exec](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html), [systemctl](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html).

**Estado:** exemplos documentados e verificações sintáticas/estruturais offline. Não se executaram launchctl/systemctl, gateway, restart/boot/logout, inferência ou benchmarks nesta alteração. Serviço supervisionado não garante HA nem disponibilidade com host suspenso ou sem Internet.
