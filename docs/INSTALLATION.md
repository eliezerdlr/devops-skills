# Instalações externas — índice operacional

Este é o ponto de entrada para instalar e operar dependências **fora do checkout `devops-skills`**. `pi install /caminho/devops-skills` regista skills/extensões; não instala os runtimes abaixo. Não executar todos os guias: selecionar apenas as capacidades necessárias.

## Inventário e ordem

| Componente | Obrigatoriedade | Procedimento | Estado da evidência |
|---|---|---|---|
| Node + Pi | Host para executar as extensões | [Host](install/host.md) | Suítes anteriores com Pi 1.3.0; Pi 1.4.0 observado instalado, compatibilidade ainda não homologada |
| OmniRoute | Obrigatório apenas para o perfil escolhido `gateway-managed` | [Instalação macOS e serviço](install/omniroute.md) | Fonte analisada 3.8.53; artefacto npm 3.8.52 disponível; aprovação/piloto pendentes |
| Graphify | Opcional: executar mapeamento/consulta | [Instalação Python isolada](install/graphify.md) | graphifyy 0.9.93; testes históricos sintéticos não equivalem a instalação limpa |
| Archify | Opcional: renderizar diagramas | [Provisionar checkout pinado](install/archify.md) | 3.2.0 / 203 hashes; renderização real não homologada |
| Planning with Files | Addon opt-in, não requisito de execução do pacote raiz | [Ativação, helpers e remoção](../integrations/planning-with-files/README.md) | Snapshot 3.24.0; 11 testes históricos Pi 1.3.0, não certificação de helpers |
| Ferramentas das skills | Só no workflow escolhido | [Ferramentas, ambientes e bloqueios](install/workflow-tools.md) | Sem matriz universal de versões aprovadas; não instalar indiscriminadamente |

O [inventário estruturado](external-installations.json) torna esta classificação verificável nos testes. É documentação, não um instalador ou inventário automático da máquina. [DEPENDENCIES.md](DEPENDENCIES.md) mantém os requisitos técnicos e limites por família.

Addy Engineering, Web Quality, Security Audit e ECC selecionado são conteúdo/implementação local: **não exigem instalar os repositórios upstream**. Os peers Pi vêm do host. Não executar `npm install` recursivamente nos manifestos, fixtures ou snapshots.

OpenRouter é um **serviço remoto**, não software local a instalar. Contas, destinatários, termos, retenção e orçamento exigem autorização própria. NetBird/proxy TLS são infraestrutura de acesso remoto escolhida separadamente; não há topologia/IdP/ACL aprovados que permitam fornecer uma configuração universal segura. A skill HomelabHero não está aprovada. Snyk Agent Scan, Sage, UniFi opcional e outros projetos apenas analisados não são dependências operacionais aprovadas.

## Contrato obrigatório de documentação

Qualquer nova dependência operacional deve ter, antes de ser anunciada como utilizável:

1. Finalidade, obrigatoriedade e responsável; sistemas/arquiteturas suportados.
2. Fonte oficial, versão exata, integridade/proveniência e licenças.
3. Pré-requisitos e verificações que falham antes de instalar no destino errado.
4. Comandos, diretórios de binários/dados/logs e efeitos de scripts de instalação.
5. Configuração, armazenamento/recuperação de segredos e política de rede.
6. Verificações de disponibilidade separadas de teste funcional/autenticado.
7. Arranque/paragem/supervisão, ou declaração de que é ferramenta pontual.
8. Atualização controlada, backup/restauro, rollback e remoção preservando dados.
9. Estado real de validação: escrito/revisto, teste sintético ou execução real.

Versão não escolhida, mecanismo incompatível ou pré-requisito ausente são **bloqueios**, não autorização para instalar `latest`, ignorar scripts necessários ou inventar um pin. Um exemplo não é uma receita homologada.

## Regras de execução e evidência

- Os comandos publicados são para execução **manual aprovada**, não foram executados para escrever estes guias. Downloads de metadata pública não são instalação.
- Perfil detalhado: **macOS Apple Silicon**; as diferenças de Linux/Windows estão assinaladas. Não anunciar estes procedimentos como suporte multi-OS validado.
- Usar uma sessão Bash dedicada, blocos pela ordem indicada e os mesmos exports; `set -euo pipefail` faz erros abortarem. Não colar Markdown inteiro num terminal. Ler cada bloco e parar nos gates manuais.
- Não usar `sudo npm`, `curl | sh`, instaladores globais concorrentes ou diretórios de source como diretórios de runtime. Nunca substituir uma instalação existente sem backup e plano.
- Registar fora do Git: data, OS/arquitetura, Node/Python/Pi, versão/digest do artefacto, lock/freeze transitivo, paths, aprovação, resultados e versão anterior. Não registar valores de segredos. Alterar declarações de estado do projeto apenas com evidência revista.
- Parar se algum comando divergir da fonte/versão: preservar logs redigidos, não executar reparações automáticas nem `--force` indiscriminado.
- Revalidar antes de produção, após mudança de runtime, artefacto ou configuração. Os testes de documentação verificam estrutura, links e pins; não executam instaladores ou simulam uma máquina limpa.

## Verificação documental pelo contribuidor

Da raiz: `npm test`. Além de Node, os testes documentais requerem Bash e Python 3 já disponíveis: `bash -n`, parsing AST e geração sintética de wrapper/plist num HOME temporário, sem executar instaladores, wrapper, criação de chaves ou serviço. Não instalam ferramentas se faltarem. O resultado não homologa instaladores, runtime, credenciais, launchd ou rede.

## Ordem recomendada neste projeto

1. Confirmar o host existente — não reinstalar Pi só por carregar skills.
2. Aprovar a versão/artefacto OmniRoute e preparar piloto local sem fornecedores.
3. Validar serviço, autenticação, armazenamento, backup/restauro e destinatários.
4. Ligar o Pi e testar inferência só com autorização e orçamento.
5. Instalar Graphify/Archify apenas quando o respetivo trabalho for necessário; ativar Planning apenas se desejado.

**EN:** this installation index separates host prerequisites, external operational runtimes, an optional addon, and workflow-only tools. Each runtime has a manual lifecycle runbook. Documented commands are not evidence of execution or production approval. Unknown versions and infrastructure-specific configuration remain explicit blockers, not hidden installs.
