# netbird-remote-access

Documentação portátil, em português de Portugal, para planear e rever acesso remoto NetBird a recursos LAN através de um routing peer.

## Requisitos e limites de compatibilidade

- Validador: Python 3.9 ou posterior, apenas biblioteca padrão; sem Docker ou rede.
- Suite de testes: ambiente Linux/macOS com operações POSIX temporárias. Não foi homologada integralmente em Windows.
- Templates do agente: Linux com Docker Engine/Compose e TUN. Não assumir equivalência com Docker Desktop, Windows ou macOS.
- Escolher a versão e a arquitectura da imagem oficial, verificar origem e digest SHA256 e fornecer `NB_IMAGE` no formato `netbirdio/netbird:<VERSION>@sha256:<SHA256>`. Os marcadores do exemplo não constituem uma imagem válida para execução.
- O validador revê o pacote estático; não valida a existência de uma imagem, a compatibilidade do daemon ou os parâmetros reais preenchidos posteriormente.

## Referência rápida

Começar por `SKILL.md` e consultar:

| Documento | Finalidade |
|---|---|
| `references/architecture.md` | Componentes, caminhos de comunicação e limites |
| `references/operations.md` | Gates, identidade, alterações e recuperação |
| `references/evidence-and-docs.md` | Evidência, actualidade e qualidade documental |
| `references/privacy.md` | Sanitização e revisão de privacidade |
| `references/scenarios.md` | Cenários positivos, negativos e critérios de decisão |

O pacote não constitui autorização de acesso ou execução. Não instala software, não publica rotas e não demonstra qualquer estado runtime.

## Problema

O acesso a uma LAN exige mais do que um peer ligado ao serviço de gestão. É necessário distinguir inscrição, autorização, encaminhamento, retorno e acesso efectivo ao recurso.

A reutilização da documentação exige também evitar a transferência de dados reais para exemplos, diagramas ou artefactos de validação.

## Soluções

### Âmbito

O percurso principal é cliente autorizado → routing peer → RESOURCE na LAN.

AWS já existente é um pressuposto da arquitectura de referência, não uma instrução para criar recursos. A situação efectiva permanece não verificada até existir evidência autorizada.

Exit node, encaminhamento geral de Internet e distribuição de default route ficam fora deste percurso habitual e exigem gate separado.

### Ficheiros incluídos

O pacote contém:

- `scripts/validate_skill.py`
- `templates/compose.yaml`
- `templates/compose.bootstrap.yaml`
- `templates/environment.example`
- Testes sintéticos offline no directório `tests`

Os ficheiros são modelos e ferramentas offline; não constituem uma instalação nem prova de execução.

Os templates permanecem não operacionais até preencher e rever:

| Parâmetro | Significado |
|---|---|
| `NB_IMAGE` | Imagem e versão seleccionadas e verificadas |
| `NB_HOSTNAME` | Nome genérico do peer |
| `NB_MANAGEMENT_URL` | Endpoint de gestão aprovado |
| `NB_STATE_DIR` | Local persistente do estado de identidade |
| `NB_SETUP_KEY_PATH` | Local do keyfile de bootstrap |
| `NB_PROJECT_NAME` | Nome do projecto Compose |

Não colocar segredos literais no ficheiro de exemplo.

### Verificação offline

Comando documental de validação: `python3 scripts/validate_skill.py`.

Contrato: JSON em stdout; código de saída 0 para PASS e 1 para FAIL.

Comando documental de testes: `python3 -B -m unittest discover -s tests -v`.

A opção `-B` evita caches de bytecode no pacote. Os comandos verificam somente o pacote local e fixtures sintéticas. Não autorizam acesso ou alterações em infraestrutura.

O validador não recolhe variáveis de ambiente, não executa infraestrutura e não instala componentes. Deve rejeitar symlinks, hardlinks, ficheiros ocultos, caches, tipos de ficheiro não permitidos ou conteúdo com codificação/controlos binários, endereços não documentais, domínios não permitidos, identificadores de contas ou AWS, UUIDs, credenciais literais e scripts com rede ou subprocessos.

A verificação é heurística, não DLP. Não identifica arbitrariamente todos os nomes de pessoas ou hostnames curtos; exige revisão manual.

## Compromissos

- Masquerade simplifica o retorno, mas reduz atribuição por IP na LAN.
- O túnel cifrado não cifra automaticamente o segmento HTTP até RESOURCE.
- Host networking e privilégios de rede exigem justificação por versão.
- Um protótipo Compose não substitui IaC nem constitui garantia de HA ou SLA.

## Casos limite

Parar perante ausência de autorização, sobreposição de redes, identidade incerta, divergência da fonte de verdade ou recuperação não definida.

Não reiniciar Docker globalmente, apagar estado, restaurar firewall global ou expor segredos como forma de diagnóstico.

## Decisões e limites

A documentação adopta gates separados, exemplos fictícios reservados e classificação explícita de evidência. Não contém inventário, credenciais, payloads executáveis ou resultados de testes reais.

Não promete segurança perfeita, certificação de auditoria ou ausência de falhas. A aceitação final depende de revisão manual, validação offline e testes especificamente autorizados.

## Estado da distribuição

Integrado no catálogo principal de devops-skills e seleccionado pelo glob de especialistas do manifesto raiz. Não exige um registo individual. Esta integração não altera configurações globais, não instala NetBird nem publica recursos de infraestrutura; se o pacote raiz já estiver registado no Pi, recarregar permite descobrir a skill. O validador lê apenas a árvore indicada e os testes usam fixtures temporárias sintéticas. Não executar sobre uma árvore que esteja a ser alterada por terceiros. A utilização operacional continua sujeita aos gates de aprovação.
