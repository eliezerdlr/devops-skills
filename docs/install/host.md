# Host — Node.js, npm e Pi nos três sistemas

## Pré-requisitos

**macOS, Linux ou Windows.** Reutilizar Node/Pi existentes quando compatíveis; não criar instalações concorrentes. Node inclui npm. Para OmniRoute, Node 24 LTS satisfaz os engines publicados na referência consultada; confirmar com `npm view omniroute engines` antes de instalar. O requisito do host pode ser mais restrito que o manifesto das skills.

## Instalação

### 1. Node.js com npm

| Sistema | Caminho simples |
|---|---|
| macOS Intel / Apple Silicon | Descarregar o instalador LTS para a arquitetura correta em [nodejs.org](https://nodejs.org/en/download), executar o `.pkg` e reabrir o terminal. Se já usa gestor Node, continuar com esse gestor. |
| Windows x64 / ARM64 | Descarregar o instalador LTS adequado em [nodejs.org](https://nodejs.org/en/download), instalar Node + npm com entrada no PATH e reabrir PowerShell. |
| Linux | Na mesma página oficial, escolher a distribuição/arquitetura e seguir o método suportado, ou usar o gestor Node já aprovado. Confirmar a versão: o pacote `nodejs` da distribuição pode ser mais antigo que o exigido pelo OmniRoute. |

Não é preciso descarregar npm separadamente, compilar Node ou criar um prefixo privado para começar. Downloads/instaladores têm efeitos no sistema e devem ser executados pelo operador. Em ambiente com política de versões, escolher LTS exata e verificar assinatura/checksum oficiais; isso não muda o procedimento normal das skills.

Confirmar em qualquer sistema:

```sh
node --version
npm --version
```

Se falhar, reabrir terminal e corrigir a instalação/PATH antes de avançar.

### 2. Pi — apenas se ainda não existir

Se `pi --version` já funciona, não reinstalar. Se não existe e se escolheu a distribuição npm oficial, nos três sistemas:

```sh
npm install -g @earendil-works/pi-coding-agent
pi --version
```

Não sobrepor um Pi gerido por outro instalador. A referência dos testes históricos deste projeto é Pi 1.3.0; Pi 1.4.0 foi observado neste host, ainda sem homologação SDK específica. Instalar a versão publicada não significa que todas as versões tenham sido testadas. Para fixar uma versão aprovada, acrescentar `@VERSAO` ao nome do pacote.

## Configuração

Registar **uma vez** o pacote local. Ajustar o caminho, preservando settings e logins existentes.

macOS/Linux:

```bash
pi install "/caminho/absoluto/devops-skills"
pi list
```

Windows PowerShell:

```powershell
pi install "C:\caminho\devops-skills"
pi list
```

Isto regista as skills/extensões, não instala OmniRoute, Graphify ou Archify. Para o gateway: [instalação simples OmniRoute](omniroute.md).

## Verificação

Executar `node --version`, `npm --version`, `pi --version` e `pi list`. Dentro do Pi, `/reload`; no perfil gateway-managed, `/devops-routing-status` deve mostrar `Routing disabled`. Não prova saúde do servidor.

Para localizar executáveis: macOS/Linux `command -v node` e `command -v pi`; Windows `Get-Command node` e `Get-Command pi`. `npm prefix -g` e `npm root -g` mostram o destino global, não a pasta corrente. Se PowerShell bloquear o shim `.ps1`, usar o `.cmd` correspondente (`npm.cmd`, `pi.cmd`) sem alterar a política global.

## Operação

Iniciar `pi` normalmente, com credenciais do operador. Não criar daemon nem instalar Pi Web por consequência deste guia. O diretório de agente pode ser personalizado; não copiar `auth.json` nem presumir que o path aparente não é symlink.

## Atualização e rollback

Na CLI Pi 1.4.0: `pi update` atualiza o Pi, `pi update --extensions` reconcilia pacotes, `pi update --models` atualiza catálogos. Confirmar `pi update --help` na versão instalada. Para Node/Pi, usar **o mesmo gestor que fez a instalação**; uma instalação npm global pode ser atualizada com `npm install -g NOME_DO_PACOTE`.

Antes da mudança, registar versões e guardar backup privado da configuração/dados. Rollback: repor versão anterior pelo mesmo gestor e configuração compatível, sem apagar credenciais. Não modificar ficheiros internos de uma instalação gerida por tentativa. O checkout local de skills é atualizado via Git e `/reload`, não transformado em instalação npm dentro do source.

## Remoção

Para desregistar só as skills: `pi remove "CAMINHO_DO_CHECKOUT"`. Não apaga source, runtimes ou dados. Se Pi foi instalado por npm global, `npm uninstall -g @earendil-works/pi-coding-agent`; não usar este comando para gerir instalações de outro gestor. Node é removido pelo mecanismo original do OS/gestor, apenas se nenhum consumidor precisar dele. Preservar configurações/backups até decidir retenção.

## Fontes e estado

- [Download Node por sistema](https://nodejs.org/en/download), [instalar Node e npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
- [Pi oficial](https://github.com/earendil-works/pi), documentação `cli.md`/`packages.md` da versão instalada.

**Estado:** instruções multiplataforma documentadas; novas instalações e rollback não foram executados nesta alteração. Testes offline não homologam instaladores de cada OS nem a compatibilidade de qualquer versão futura.
