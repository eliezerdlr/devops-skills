# billion-context — integração nativa opcional / opt-in native integration

Este projeto usa opcionalmente [billion-context](https://github.com/ranxianglei/billion-context) e [acp-kernel](https://github.com/ranxianglei/acp-kernel), de ranxianglei. Licença upstream: MIT **com termo adicional de atribuição visível**, preservada integralmente em [LICENSE](LICENSE). Proveniência em [UPSTREAM.json](UPSTREAM.json).

**English:** this is a reviewed, pinned, opt-in native Pi extension profile, not Pi core. It uses billion-context and acp-kernel. Runtime provisioning and registration require explicit operator action. Pulling/installing the root package does not download or enable it. The instructions below preserve existing settings, keep the runtime outside the repository and require private recovery temporaries; persistent session storage is disabled. Do not register a second bootstrap if the local installation already exists. No measured savings, universal provider support or production SLA is claimed.

## Escopo

- Versão npm fixa **0.1.209**; bootstrap/config/lock idênticos ao perfil local revisto. Código upstream não modificado nem incluído neste repositório. O perfil aplica um override específico `zod@4.1.8` → `4.6.6` para mitigar [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), sem alterar os hashes do bundle upstream. Não aplica um override global de Zod: consumidores opcionais de Zod 3 não são migrados para outra major.
- Integração pelo mecanismo nativo de extensões do Pi; não é funcionalidade do núcleo. Não acrescenta extensão automática ao manifesto raiz, skills ou prompts.
- Cinco ferramentas: `compress`, `decompress`, `search_context`, `acp_status`, `acp_cache`. Subagentes upstream e injeção de ferramentas no transporte desligados; workers sem ferramentas continuam sem ferramentas.
- Bootstrap lazy em `session_start`; checksums de configuração e quatro ficheiros upstream antes do carregamento. Não é validação criptográfica de toda a árvore de dependências nem sandbox OS. O lock npm fixa também a árvore de instalação.
- Persistência de sessões Bili, updates/advisories/release notes, forge, MITM, downloads SQLite, dumps/logs, image rescale, CCR/rules/absorb/external summary e guardrails upstream de timeout/truncagem/repetição desligados. Isto não desliga aprovações ou segurança do host.
- `decompress.toFile` exige confirmação UI real; em headless é recusado. Não há serviço de login, CLI global ou mudanças de shell.

## Instalação explícita — macOS/Linux, Node >=22.14

**Se já existe uma instalação global ativa**, não copies por cima, não registes outra extensão e não faças uma segunda instalação. Podes verificar o prefixo existente com o comando do passo 2. O perfil global ativo desta máquina não é publicado. Windows não foi homologado.

1. Revê primeiro `profile/bootstrap.js`, `profile/runtime.config.json`, locks e licença. Faz backup privado das tuas configurações fora do Git. Numa shell dedicada, define o caminho real do checkout e executa apenas se autorizares o download npm:

```bash
repo="/absolute/path/devops-skills"
runtime="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/runtimes/billion-context/0.1.209"
(
    set -eu
    umask 077
    mkdir -p "$(dirname "$runtime")"
    # Sem -p: recusa qualquer prefixo já existente, mesmo incompleto.
    mkdir -m 700 "$runtime"
    for file in bootstrap.js privacy.mjs runtime.config.json runtime-lock.json package.json package-lock.json; do
        cp "$repo/integrations/billion-context/profile/$file" "$runtime/$file"
        chmod 600 "$runtime/$file"
    done
    cp "$repo/integrations/billion-context/LICENSE" "$runtime/LICENSE"
    cp "$repo/integrations/billion-context/README.md" "$runtime/README.md"
    npm ci --prefix "$runtime" --ignore-scripts --omit=optional --no-audit --no-fund
)
```

Falha de instalação deixa o prefixo para inspeção; não repetir por cima nem remover com processos ativos. Scripts lifecycle e dependências opcionais são omitidos. Esta política faz parte do perfil validado: dependências opcionais (incluindo Jimp/Zod 3) não foram homologadas e podem continuar a ter avisos no audit da árvore completa. Para auditar a árvore efetivamente instalada, usa `npm audit --prefix "$runtime" --omit=optional`; um resultado limpo não prova ausência de falhas de código. Não executar a CLI upstream diretamente: os defaults são diferentes deste perfil.

2. Verifica sem carregar upstream, contactar providers ou alterar configurações:

```bash
node "$repo/integrations/billion-context/verify.mjs" "$runtime"
```

Resultado esperado: `{"version":"0.1.209","verified":true}`. Este verificador compara os seis ficheiros do perfil com o checkout, checksums upstream, licença e permissões privadas POSIX ou ACLs Windows. Não valida credenciais, ACLs adicionais, todos os módulos dependentes nem conectividade real. Em sistemas com ACLs, confirma também que não há permissões adicionais concedidas a terceiros. Atualizações requerem nova revisão, locks e testes; nunca contornar falhas de integridade.

3. Edita manualmente o `settings.json` global no diretório de agente escolhido (`~/.pi/agent` por defeito), **preservando todos os campos e entradas existentes**. Acrescenta à lista `extensions` apenas o caminho absoluto real correspondente a `$runtime/bootstrap.js`. JSON não expande `$HOME`, `$runtime` ou `~`: usa o caminho resolvido, não estas variáveis. Se a lista não existir, cria só esse campo. Não substituir o ficheiro inteiro; não duplicar a entrada nem a instalação local anterior. Não copiar settings/auth/histórico para o projeto.
4. Reinicia todos os processos Pi afetados e executa `/acp`. O estado deverá identificar `billion-context 0.1.209`. A existência do comando/estado confirma carregamento, não poupança ou compatibilidade universal.

## Windows / NTFS — critérios de homologação

O perfil agora inclui `profile/privacy.mjs`. Em Windows usa Windows PowerShell 5.1 e APIs ACL do .NET Framework, sem depender dos cmdlets Get-Acl/Set-Acl. A criação de diretórios aplica a DACL no próprio CreateDirectory, sem uma janela inicial com herança pública. Permite apenas o SID do utilizador atual, SYSTEM e Administradores; exige proprietário nessa lista e uma ACE FullControl aplicável ao próprio utilizador. Rejeita **todas** as ACEs Deny (incluindo grupos e ACEs herdadas), ACEs Allow de outras identidades, links/junctions e ancestrais reparse. Esta política conservadora aceita apenas DACLs allow-only; não tenta calcular acesso efetivo para DACLs arbitrárias e pode rejeitar configurações Windows que seriam seguras por outros critérios. Em POSIX mantém as verificações de mode. Não altera ACLs de pastas existentes.

Para preparar um prefixo Windows novo, importe `createPrivateDirectory` de `profile/privacy.mjs` usando Node e um file URL absoluto, e chame-o apenas sobre uma pasta inexistente cujo pai já exista. Copie os **seis** ficheiros do perfil (incluindo privacy.mjs), licença e README para esse prefixo, execute o npm ci restritivo indicado acima e o verificador. Não utilize mkdir/chmod como substituto de ACL no Windows. A instalação não pode sobrescrever um runtime existente. O helper e os ficheiros do perfil são comparados com o checkout pelo verificador; hashes upstream e pins npm permanecem inalterados.

Os testes de privacidade estão incluídos em `npm test`. O job dedicado `billion-context` do CI executa os contratos do bootstrap e a política/ACLs em Ubuntu e Windows, com Node 22 e 24. A definição do job não significa que já tenha passado: a homologação exige resultados reais Windows e validação separada do runtime completo (arranque, compressão/recuperação, transportes e limpeza), antes da aprovação de produção. Nenhuma instalação ativa deve ser substituída durante estes testes.

Validação local: `node --test tests/billion-context.test.mjs tests/billion-context-privacy.test.mjs`. Usa apenas contextos sintéticos; testa ACLs reais de diretórios/ficheiros no Windows, rejeição de acesso Everyone, junctions, integridade e limites do bootstrap. Não instala o runtime npm, não usa credenciais, não comprova compatibilidade real de providers/proxy/compressão no Windows e não habilita globalmente a extensão. Executar o runtime real continua a exigir validação separada. O helper não constitui sandbox contra administradores ou processos sob o mesmo utilizador.

## Dados e limites

**Não é “só RAM”.** Recuperações grandes podem criar ficheiros privados em `runtime/tmp/pi-*` (`0700`, ficheiros de recuperação `0600`). O perfil redireciona `TMPDIR/TMP/TEMP`, XDG cache/state/data e o diretório de sessões para esse temporário **no mesmo processo**, afetando também bibliotecas/extensões co-residentes. Não muda o histórico normal do Pi nem importa históricos em lote; histórico retomado normalmente enviado ao modelo pode atravessar o proxy em memória.

Limpeza de temporários é best-effort no exit e no próximo arranque, limitada a diretórios com marcador próprio/PID morto. Crash ou filhos podem deixar conteúdo, sem TTL garantido. Inspeciona e remove apenas dados teus de processos comprovadamente terminados. Referências/estado de compressão podem perder-se ao reiniciar; não há retoma transparente garantida. Memória pode crescer.

O proxy loopback é por processo, sem autenticação adicional contra outros processos locais. O bootstrap oculta o getter proativo de chaves do registry nos callbacks Bili, mas a autenticação normal dos pedidos atravessa o transporte proxy. Confirmação de export é um controlo do host, não uma sandbox contra código/local API maliciosos.

## Validação e manutenção

`npm test` inclui testes offline e isolados deste bootstrap, com módulos upstream sintéticos: pins/licença, inicialização lazy, configuração/hash adulterados, whitelist, chave oculta, restauro de env antes de await e aprovações. Não instala/executa o runtime real nem usa contas. O perfil teve também validação local anterior com SDK Pi 1.4.0, Node 26.12.1/macOS e providers HTTP/WS simulados, incluindo compressão/recuperação real e coexistência OPS/NetBird/Ponytail. Esses fixtures locais não são distribuídos nem constituem homologação de todos os providers, streaming, Windows, sessões longas, retoma, custos ou SLA. O CI do repositório não reproduz por si só esses testes de transporte.

A inibição do autorregisto de filhos depende do trecho **síncrono** do callback `session_start` upstream: `BILI_NATIVE_PI=0` apenas durante a chamada; o valor é restaurado **antes** de await. Rever este pressuposto em cada upgrade. O bundle pin impede upgrades silenciosos dos ficheiros verificados.

## Desativação e rollback

Remove **somente** a entrada deste bootstrap de `extensions` e reinicia os Pi afetados. `DEVOPS_BILI_DISABLE=1` é alternativa para um novo processo, não descarrega uma extensão já ativa. Não apagues o prefixo enquanto houver processos ativos. Restaura um backup integral só se não sobrescrever mudanças posteriores. Reverter o commit desta integração não remove nem desativa instalações externas já registadas.
