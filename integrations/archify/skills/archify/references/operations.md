# Operação do adaptador

## Pré-requisitos e identidade

Node.js >=18; apenas standard library. Runtime externo já provisionado pelo
operador, archify/ versão 3.2.0 do commit em UPSTREAM.json. Esta integração não
instala dependências, não faz downloads e não executa build/update. O operador
aprova um runtime confiável e uma raiz de output já existente. Não executar como
root. O package principal inclui a skill; não instalar integrations/archify à parte.

Definir DEVOPS_ARCHIFY_DIR com caminho absoluto para esse archify/, não para a
raiz do repositório. O wrapper lê package.json e compara SHA256 dos 203 ficheiros
em runtime-lock.json, antes de executar. Uma versão textual igual não basta.
Não atualizar lock para acomodar drift sem revisão da nova fonte e licença.
O pin verifica ficheiros conhecidos; não autentica Node/OS nem dependências ou
ficheiros extra existentes na máquina. Runtime e diretórios devem ser confiáveis.

## Configuração

Criar config JSON regular (não symlink), com até 16 KiB. Exemplo ilustrativo;
substituir todos os caminhos. A raiz outputRoot já deve existir e estar aprovada.

```json
{
  "outputRoot": "/absolute/project/approved-artifacts",
  "candidate": "/absolute/project/approved-artifacts/candidate.json",
  "output": "architecture-20261020-001/system.html",
  "type": "architecture",
  "quality": "showcase",
  "offline": true,
  "timeoutMs": 30000,
  "maxBufferBytes": 1048576
}
```

Candidate: ficheiro JSON regular com até 1 MiB, dentro de outputRoot. Não aceitar
JS/módulos. diagram_type coincide com type, meta.output é exatamente output,
meta.quality_profile coincide com quality. Não se modifica o candidate original:
na execução é guardado um snapshot candidate.json na pasta nova. O schema completo
é responsabilidade dos gates reais do runtime, não do pré-check do adaptador.

output tem exatamente dois segmentos POSIX: pasta-nova/nome.html. Sem absolutos,
.., backslash, controlos ou segmentos >100 bytes. A pasta não pode existir, mesmo
vazia, nem ser um symlink pendente. Cada reparação usa pasta nova e meta.output
atualizado. Symlinks em qualquer ancestral de root/candidate/runtime são recusados,
mesmo internos; caminhos com aliases como /tmp ou /var podem exigir o caminho
físico retornado por realpath no host. Não reutilizar diretórios após falha.

quality: showcase (default) ou standard. timeoutMs: 50..120000 por processo
(default 30000). maxBufferBytes: 1024..4194304 por stream (default 1048576).
Só offline=true é aceite (default true). Chaves desconhecidas são erro; não há
--force, override de CLI, browser path, --repo-root ou network opt-in.

## Planear e autorizar

```sh
node /absolute/package/integrations/archify/adapter.mjs plan /absolute/config.json
# dry-run é alias de plan: sem subprocessos nem escritas
node /absolute/package/integrations/archify/adapter.mjs execute /absolute/config.json
```

DEVOPS_ARCHIFY_DIR deve estar no ambiente dos dois comandos. Não executar execute
por consequência automática de carregar a skill; requer autorização do pedido.
Plan verifica configuração, candidate, destinos e pin. Não é reserva nem prova
que o estado ficará igual depois. Execute repete esses checks e cria a pasta
exclusivamente, modo 0700. Grava snapshot e executa com cwd=outputRoot:

1. node <runtime>/bin/archify.mjs deliver <type> <snapshot> <html> --quality <quality> --json
2. node <runtime>/bin/archify.mjs check <html> --require-provenance --json

Cada argumento é um elemento da lista execFile, shell=false. Não encaminhar opções
extra. O ambiente do filho tem update checks desativados, temporários na pasta de
execução e apenas PATH/SystemRoot/WINDIR herdados quando presentes; NODE_OPTIONS,
ARCHIFY_CHROME, proxies e restantes overrides não são herdados.

## Resultados e recuperação

- HTML standalone no caminho planeado.
- candidate.json: snapshot exato de entrada.
- <nome>.delivery.json: sidecar de proveniência REAL criado por deliver.
- adapter-receipt.json: relatório do wrapper, argv, stdout/stderr dos dois gates,
  erros, hashes, limites e timestamps; não substitui os receipts upstream.

Apenas ok=true do wrapper permite anunciar conclusão dos gates. O adaptador exige
receipts JSON passing, hash do candidate/artifact, output/type corretos, update
reason=disabled e provenance=current no check, além do sidecar current regular.
Os checks não são inspeção visual. Campos upstream adicionais ficam em stdout.

Exit do CLI: 0 para plan ou execução aprovada; 1 para erro. Falha anterior à
reserva não tem receipt em disco; stderr contém JSON do erro. Após reserva, falhas
normais conservam snapshot/receipts/logs e produzem ok=false. Falha de armazenamento,
kill externo ou processo interrompido podem impedir o próprio adapter-receipt.json;
não alegar evidência que não existe. Não apagar journals, locks, symlinks ou backups
automaticamente. Escolher pasta nova; para recuperar um estado upstream, o operador
consulta references/delivery-contract.md no runtime pinado e aprova o procedimento.
