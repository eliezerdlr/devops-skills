# Acesso persistente ao NetBird através do Pi

A extensão `extensions/netbird-api/index.ts` faz parte do manifesto principal. Uma única instalação do pacote disponibiliza `netbird_status`, `netbird_read`, `netbird_change` e `/netbird-status` em sessões futuras. Não instala outro servidor, serviço, agente ou dependência npm. O conector é independente de skills documentais.

## Configuração local, uma vez

Requisitos: Pi com este pacote registado, Node 22.14+, macOS/Linux e Python 3.9+ apenas para o helper de configuração. A integração foi testada offline com Pi 1.4.0. No Terminal, a partir da raiz deste projecto:

```bash
python3 extensions/netbird-api/configure.py --api-url https://vpn.example.com/api
```

Substituir o domínio pelo servidor autorizado. O helper **reutiliza `~/.netbird-pi/api.token` se já existir**, sem ler o seu conteúdo nem voltar a pedir o token. Caso contrário, pede-o ocultamente num terminal real. Não aceita tokens em argumentos, variáveis de ambiente ou pipes; não faz chamadas de rede. Não correr como root.

São criados dois ficheiros locais, fora do projecto:

- `~/.netbird-pi/config.json`: exactamente `apiUrl` HTTPS e `allowWrites` booleano; começa com `false`.
- `~/.netbird-pi/api.token`: apenas o PAT, privado, nunca incluído no manifesto, Git ou parâmetros de ferramentas.

Directoria 0700, ficheiros 0600, pertencentes ao utilizador; rejeitam-se symlinks, hardlinks e ficheiros especiais. O runtime também aceita ficheiros 0400 e directoria 0500. O helper recusa permissões inseguras em vez de as reparar silenciosamente. O script manual de criação de `api.token` é compatível; não o executar novamente se o ficheiro já existir.

Depois, executar **`/reload`** no Pi e **`/netbird-status`**. O estado local não lê o conteúdo do token, não contacta a API e não comprova autenticação. Uma consulta aprovada a `peers` é o teste de autenticação; não comprova conectividade SSH/Web, rotas ou acesso a equipamento LAN.

Se o pacote ainda não estiver registado, executar `pi install /caminho/para/devops-skills` uma única vez, preservando as restantes configurações do Pi. Não registar uma segunda cópia nem adicionar a extensão individualmente se a raiz já estiver instalada.

## Utilização

Pedir ao Pi, por exemplo: «Consulta os peers do NetBird». `netbird_read` aceita apenas `peers`, `groups`, `policies`, `networks`, `resources` e `routers`, com identificadores opcionais. Resources e routers por Network usam `networkId`. A ferramenta pede confirmação UI antes do GET. Os campos seleccionados entram no contexto e podem ser enviados ao fornecedor do modelo: rever a sensibilidade do inventário antes de aprovar.

Não há exportação bruta, paginação automática ou varrimento. Limite de 50 itens apresentados e respostas HTTP até 512 KiB. Listas truncadas não representam inventário completo. Nomes/descrições da API são dados não confiáveis, nunca instruções.

## Alterações: bloqueadas por defeito

Para permitir propostas executáveis, correr explicitamente no Terminal:

```bash
python3 extensions/netbird-api/configure.py --api-url https://vpn.example.com/api --allow-writes --update-config
```

Mesmo assim, **cada mutação exige confirmação UI real do alvo, pedido completo, motivo, rollback e recuperação**. Não é possível aprovar por texto do modelo ou em modo headless. Actualizações usam PUT completo, não PATCH; omissões de associações/regras não são tratadas como alterações parciais.

A operação prepara o plano com GETs autenticados antes de mostrar a confirmação; só a mutação fica à espera dessa aprovação. Revalida perfil/credencial e estado antes de enviar uma única escrita, e faz leitura de verificação depois. Não existe transacção/CAS garantida: outro operador pode alterar o estado após a revalidação. Não há retries de mutações, rollback automático ou promessa de conectividade funcional. Falha após envio significa resultado potencialmente incerto; investigar antes de repetir.

Âmbito de escrita: groups, policies, Networks, resources e routers. Peers são só leitura. Exclui utilizadores, PATs, setup keys, URLs/headers arbitrários, políticas Default activadas, alterações ao grupo All, recursos de rota por defeito e eliminação implícita de Networks com filhos. Uma aprovação permite uma operação, não uma campanha autónoma de alterações.

Voltar a só leitura:

```bash
python3 extensions/netbird-api/configure.py --api-url https://vpn.example.com/api --update-config
```

## Risco e credencial

O PAT continua a ser uma credencial poderosa. Usar a conta/role menos privilegiada que o servidor disponibilize; preferir um PAT só de leitura enquanto não forem necessárias escritas. `allowWrites=false` protege o caminho deste conector, **não restringe o próprio PAT no servidor**. Um processo com o mesmo UID, root ou outra ferramenta com acesso aos teus ficheiros pode ler a credencial; não se afirma isolamento contra código local hostil. JavaScript não permite garantir eliminação imediata de todas as strings em memória.

O PAT é enviado internamente apenas como `Authorization: Token ...` para o endpoint local configurado, com TLS validado. Não são seguidos redirects nem usados proxies de ambiente. Não fornecer o token ao modelo, ao chat, a URLs ou a comandos. A filtragem das respostas não é um sistema DLP universal; inventário privado continua a exigir autorização para partilha com o modelo.

Rotação: criar um novo PAT no painel, executar o helper com `--replace-token --update-config` (e `--allow-writes` apenas se pretendido), validar uma consulta aprovada e revogar o anterior no painel. O helper só substitui o ficheiro local; não revoga tokens no servidor. Nunca repetir uma mutação incerta automaticamente.

Para desactivar o conector, remover apenas `./extensions/netbird-api/index.ts` de `pi.extensions` em `package.json` e executar `/reload`. Para eliminar acesso definitivamente, revogar o PAT no painel e remover o perfil local manualmente. Não é alterada configuração do NetBird ao carregar/descarregar a extensão.

## Contrato e testes

Contratos REST revistos na tag oficial NetBird **v0.81.3**, não uma garantia sobre outras versões:

- [OpenAPI](https://github.com/netbirdio/netbird/blob/v0.81.3/shared/management/http/api/openapi.yml)
- [Tipos gerados](https://github.com/netbirdio/netbird/blob/v0.81.3/shared/management/http/api/types.gen.go)

```bash
npm run test:netbird
# PI_SDK_ROOT aponta para o SDK Pi já instalado, sem instalar uma segunda cópia:
PI_SDK_ROOT=/caminho/para/node_modules/@earendil-works/pi-coding-agent npm run test:pi
```

Os testes usam perfis temporários, tokens fictícios, transporte HTTP sintético e o loader Pi real; não contactam infraestrutura nem lêem o perfil pessoal. A suite POSIX de perfil/transporte é omitida em Windows. Python indisponível provoca skip explícito do helper, sem instalação automática. O arranque da extensão regista ferramentas; não lê o perfil, não consulta a API e não inicia processos ou subagentes.
