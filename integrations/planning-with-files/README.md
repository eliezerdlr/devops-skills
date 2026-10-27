# Planning with Files — integração opcional / optional integration

Snapshot do pacote Pi oficial de [OthmanAdi/planning-with-files](https://github.com/OthmanAdi/planning-with-files), versão **3.24.0**, commit **96b79bf1d64f22ab5f68442e0a45704eef06ddfc**. Os 46 ficheiros em `upstream/` preservam o conteúdo original; apenas acrescentámos a licença MIT do repositório ao pacote. Proveniência em [UPSTREAM.json](UPSTREAM.json), integridade em [SHA256SUMS](SHA256SUMS), licença em [upstream/LICENSE](upstream/LICENSE).

**Não é carregado pelo manifesto principal.** Ativação explícita evita instalar hooks, ler planos ou iniciar processos por surpresa ao atualizar o pack. O pacote principal inclui 112 skills; a instalação opcional acrescenta uma skill e uma extensão. Não registes simultaneamente outra cópia npm/global de planning-with-files.

## Ativar no Pi 1.2.0

Depois de atualizar o checkout, regista o pacote opcional:

```bash
pi install /caminho/absoluto/devops-skills/integrations/planning-with-files/upstream
```

Não é necessário executar `npm install` nesse diretório ou nos subdiretórios. Preserva as restantes configurações. Vê [examples/pi-planning-settings.json](../../examples/pi-planning-settings.json) para a alternativa por `packages` e modo `notify`. Se usares settings, ajusta ambos os caminhos e não dupliques os registos existentes.

Começa com modo de notificações, sem continuação automática do fim de turno:

```bash
PWF_MODE=notify UV_OFFLINE=1 UV_PYTHON_DOWNLOADS=never pi
```

`PWF_MODE` tem precedência sobre os settings. As opções UV evitam downloads implícitos pelo launcher; disponibiliza Python localmente se precisares dos helpers. O modo `notify` não é sandbox e **não desativa um `/plan-loop` iniciado explicitamente**.

Dentro do Pi:

```text
/reload
/skill:planning-with-files
/plan-status
```

Solicita a criação dos três ficheiros num diretório de tarefa do teu projeto, usando os templates incluídos:

- `task_plan.md`: objetivo, fases e critérios de conclusão;
- `findings.md`: evidências e decisões;
- `progress.md`: ações realizadas, testes e próximos passos.

Na retoma, pede explicitamente a leitura desses ficheiros. O plano persiste em disco; o histórico de execução do nosso orquestrador continua em memória. **Não há retoma automática de workers interrompidos.**

### Fluxo combinado

1. O agente principal é o único responsável pelos ficheiros partilhados do plano.
2. Regista evidências redigidas e o âmbito autorizado.
3. Chama `ops_agent` ou `ops_workflow` para diagnóstico → proposta → revisão.
4. Aprova a execução no diálogo próprio do orquestrador.
5. O agente principal regista os resultados efetivamente devolvidos, limitações e próximos passos.
6. Após reiniciar, lê o plano e decide explicitamente se são necessárias novas análises.

Os workers do nosso orquestrador continuam sem ferramentas e **não escrevem nesses ficheiros**. O planeamento usa as ferramentas normais da sessão principal; não lhes impõe novas restrições.

## Hooks e limites importantes

- `/plan-execute` ativa os hooks upstream para a sessão/plano; não executa automaticamente o workflow do nosso pack, nem autoriza mudanças na infraestrutura. É um comando explícito, não o diálogo de aprovação obrigatório de `ops_workflow`.
- Sem `/plan-execute`, os hooks de injeção/continuação permanecem passivos. Isto não significa ausência de todos os efeitos: `session_start` pode executar o helper de recuperação com `--no-history`, usando `uv`/Python, e os handlers podem ler ficheiros e publicar avisos.
- Em `parity`/`cache-safe`, o fim de turno pode pedir continuação automática até três vezes. `auto` escolhe o modo conforme o modelo. Recomenda-se `notify` inicialmente.
- `/plan-loop` pode criar ticks periódicos e pedidos pagos, mesmo em `notify`; não o atives sem avaliar custos e ciclo de vida. `/plan-loop stop` para parar.
- `/plan-execute reset` revoga a ativação dos hooks. Para retirar a integração, usa `pi remove /caminho/absoluto/devops-skills/integrations/planning-with-files/upstream` ou remove apenas essa entrada em `packages`, e recarrega o Pi.
- Attestation SHA-256 sinaliza alterações do plano; **não autentica o autor, não prova a correção do plano e não bloqueia comandos de infraestrutura**. Os avisos de comandos perigosos upstream são heurísticos, não um scanner oficial nem um controlo de autorização.
- Conteúdo dos planos pode chegar ao fornecedor do modelo e aos transcripts normais do Pi quando a injeção é ativada. Redige segredos antes de escrever; um `.gitignore` não impede leitura local nem envio ao modelo.
- Os parsers upstream leem ficheiros sincronicamente sem limite global de tamanho; a contagem de estados é textual, não prova semântica de conclusão. Mantém planos pequenos, em workspaces de confiança, e verifica resultados reais. Não é proteção contra ficheiros maliciosos, symlinks arbitrários ou outros processos do mesmo utilizador.
- Seleciona `PLAN_ID` explicitamente quando houver tarefas paralelas. Não dependas de seleção implícita de plano para isolamento forte.

## Validação

```bash
PI_SDK_ROOT="$(npm root -g)/@earendil-works/pi-coding-agent" npm run test:planning
```

A suíte de **11 testes locais** cobre integridade dos 46 ficheiros, descoberta combinada, ausência de colisões, leitura persistente de planos, modo passivo, `notify`, ativação/reset, ausência de continuação após erro/abort, revogação no shutdown, deteção de alteração e seletor inválido. Na validação do pacote unificado com o SDK Pi 1.3.0, os 11 passaram com **113 recursos de skills / 8 prompts / 2 extensões**. Houve validação anterior do addon no Pi 1.2.0 com a composição antiga. As suítes do pacote principal e do planeamento mantêm-se separadas. A extensão opcional também passou verificação estrita de tipos com TypeScript 5.9.3 contra as declarações do Pi 1.2.0.

Não executámos a suíte Vitest upstream completa, os helpers de shell/PowerShell, recuperação de histórico, temporizadores periódicos ou chamadas a fornecedores reais. Os testes não certificam Windows/macOS, segurança independente ou uso irrestrito em produção. Nenhuma configuração global ou infraestrutura foi alterada.

## English summary

This optional, unmodified upstream Pi package adds persistent `task_plan.md`, `findings.md` and `progress.md` files. Install the `upstream/` directory explicitly; the main manifest does not auto-load it. Start in `PWF_MODE=notify` and review the settings example. Planning activation is separate from operations-workflow approval, and does not authorise infrastructure changes or resume interrupted workers. The parent owns the files; our tool-free workers only return analyses.

Upstream hooks can spawn local recovery helpers, inject plan text, request continuations in other modes, and start periodic model calls via `/plan-loop` even in notify mode. Use trusted, small, redacted planning files; keep local data out of Git. Eleven targeted tests passed against Pi 1.2.0, not a full upstream suite or independent security audit. Upstream MIT copyright and source provenance are preserved.
