# OmniRoute — macOS, Linux e Windows

## Pré-requisitos

Instalar **Node.js LTS com npm** seguindo o [guia do host](host.md), ou reutilizar a instalação existente. Não é preciso Python, Git, Docker, prefixo privado nem serviço para instalar o OmniRoute.

No Terminal (macOS/Linux) ou PowerShell (Windows):

```sh
node --version
npm --version
npm view omniroute engines
```

O Node deve satisfazer os engines publicados. Na consulta de 2026-10-22, o npm disponibiliza 3.8.52 com Node `>=22.22.2 <23 || >=24 <27`; Node 24 LTS é uma escolha compatível. A fonte 3.8.53 analisada é referência histórica, não uma exigência para usar o comando oficial.

## Instalação

**O mesmo comando nos três sistemas:**

```sh
npm install -g omniroute
omniroute --version
```

Este é o caminho principal documentado pelo upstream. `-g` instala no prefixo global do npm selecionado, **não dentro de `devops-skills`**, mesmo se o terminal estiver nesse diretório. O npm resolve a versão publicada no canal `latest`; não significa que a versão tenha sido homologada neste projeto. Registar a versão devolvida por `--version`.

Se a organização exigir versão fixa, usar opcionalmente `npm install -g omniroute@3.8.52`, ou outra versão explicitamente aprovada e disponível. Não é preciso criar um instalador próprio. O npm pode executar scripts e instalar módulos nativos; perante erro de ABI/permissões, diagnosticar o erro, não usar `sudo`/`--force` por tentativa.

## Configuração

Para o perfil deste projeto: painel disponível, listener local e chave de inferência obrigatória. Antes de adicionar contas, definir uma chave persistente `STORAGE_ENCRYPTION_KEY` pelo gestor de segredos/ambiente privado e configurar login forte no painel. Não publicar segredos no Git ou nos comandos copiados para o chat. A instalação de software e a autenticação de fornecedores são passos distintos.

### macOS e Linux — Bash/Zsh

```bash
export OMNIROUTE_SERVER_HOST=127.0.0.1
export OMNIROUTE_HEADLESS=0
export REQUIRE_API_KEY=true
omniroute serve --no-open
```

### Windows — PowerShell

```powershell
$env:OMNIROUTE_SERVER_HOST = "127.0.0.1"
$env:OMNIROUTE_HEADLESS = "0"
$env:REQUIRE_API_KEY = "true"
omniroute serve --no-open
```

Estas variáveis afetam a sessão atual. Não inserir a chave de armazenamento em exemplos públicos; conservar e recuperar a mesma chave após reinícios. `--no-open` só evita abertura automática do browser: **não desliga o painel**. Abrir manualmente `http://127.0.0.1:20128/dashboard`. Não usar `--headless` se se pretende o painel.

Paths e permissões:

| Item | macOS / Linux | Windows |
|---|---|---|
| Prefixo global | `npm prefix -g`; executável em `bin` desse prefixo | `npm prefix -g`; launchers `.cmd`/`.ps1` no prefixo |
| Localizar comando | `command -v omniroute` | `Get-Command omniroute` |
| Dados por defeito | `~/.omniroute`; XDG pode alterar | `%APPDATA%\omniroute`; legado `~/.omniroute` pode prevalecer |
| Dados explícitos | `DATA_DIR` se definido | `DATA_DIR` se definido |

Não apagar dados preexistentes. `npm root -g` mostra onde o npm guarda os pacotes; `npm prefix -g` não é o diretório de dados da aplicação.

## Verificação

O processo deve indicar o painel/porta e permanecer em foreground. Noutro terminal:

macOS/Linux:

```bash
curl --connect-timeout 3 --max-time 10 --silent --show-error --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:20128/api/monitoring/health
```

Windows PowerShell:

```powershell
(Invoke-WebRequest -Uri "http://127.0.0.1:20128/api/monitoring/health" -TimeoutSec 10).StatusCode
```

Esperado: HTTP 200 para health e login no painel. **Health não prova autenticação nem inferência.** Confirmar binding local e proteção do painel/API antes de ligar fornecedores. Verificar inferência separadamente com dados sintéticos e orçamento aprovado; não imprimir tokens nos diagnósticos.

Se `omniroute` não for encontrado, reabrir terminal e verificar o PATH do prefixo npm. No Windows, se a política de execução bloquear apenas o shim `.ps1`, usar `npm.cmd`/`omniroute.cmd` em vez de alterar políticas globais. No macOS/Linux, resolver permissões pelo gestor Node/prefixo do utilizador; não recorrer automaticamente a `sudo npm`.

## Operação

`Ctrl+C` para parar. **Serviço persistente é opcional**, não requisito da instalação:

- **macOS: launchd** — [configurar serviço com a instalação npm global existente](omniroute-services.md#3-macos--launchd). O LaunchAgent arranca após login, não antes.
- **Linux: systemd** — [configurar serviço com arranque no boot](omniroute-services.md#4-linux--systemd), sem executar o gateway como root.
- Windows: mecanismo de serviço/supervisão aprovado na organização; não instalar wrappers de terceiros só para correr o CLI.

Não habilitar dois supervisores para a mesma instância. Acesso remoto é configuração separada de TLS/autenticação/ACL; não expor `0.0.0.0` apenas para resolver conectividade.

Para ligar ao Pi, usar [configuração do provider](../../integrations/omniroute/README.md#ligar-pi-ao-gateway--sem-sobrescrever-configurações). O OmniRoute gere fallback; o router virtual Pi fica desligado neste perfil. Não há nova camada de routing nem alteração dos modelos automaticamente.

## Atualização e rollback

Guardar versão anterior e backup consistente dos dados/configuração/chave com o processo parado. Para atualizar a instalação global, o mesmo comando:

```sh
npm install -g omniroute
omniroute --version
```

Ou usar `omniroute@VERSAO_APROVADA` para controlar a mudança. Rollback: reinstalar a versão anterior exata e, se houver migração de DB, restaurar o snapshot compatível de dados/configuração/chave. Reinstalar binário antigo não desfaz migração. Testar funcionamento antes de retomar automações.

## Remoção

Parar a instância e retirar apenas o serviço criado, se houver. Nos três sistemas:

```sh
npm uninstall -g omniroute
```

Este passo remove o software; **não é instrução para apagar dados, backups ou contas**. Não usar limpeza `--full` nem apagar a pasta de dados sem decisão de retenção. Preservar outros pacotes npm e configurações Pi.

## Fontes e estado

- [OmniRoute oficial — instalação npm e plataformas](https://github.com/cheaper-inference/OmniRoute#readme).
- [Metadata npm publicada](https://registry.npmjs.org/omniroute/latest); flags confirmadas no source `v3.8.52`.
- [npm global e PATH](https://docs.npmjs.com/cli/v11/configuring-npm/folders), [resolução de permissões](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally).

**Estado:** comandos documentados para macOS, Linux e Windows; instalações, launchd/systemd/serviço Windows, performance e inferência real não foram executados/homologados nesta alteração. A documentação não acrescenta código de runtime, dependências ou processos ao projeto.
