# OmniRoute: dependência operacional externa / PT · EN

Parte do pacote único; não instalar este módulo separadamente:

```bash
pi install /caminho/absoluto/devops-skills
```

## Instalar o servidor — procedimento separado

**[Instalação simples — macOS, Linux e Windows](../../docs/install/omniroute.md):** instalar Node.js com npm e executar `npm install -g omniroute`. Depois configurar/iniciar o gateway e verificar o painel. O comando `pi install` acima instala apenas as skills, **não o servidor OmniRoute**. Versão fixa e serviço persistente são opções separadas, não requisitos da instalação. Ver [índice de instalações externas](../../docs/INSTALLATION.md).

## Decisão e estado

**Perfil escolhido: `gateway-managed`.** O operador instala e gere o **OmniRoute diretamente na máquina**, fora do pacote de skills. É uma dependência operacional necessária para este perfil, **não uma dependência npm**, nem requisito para ler/carregar as skills. A instalação deste pacote não instala, inicia ou configura o servidor.

O contrato declarativo [operational-dependency.json](operational-dependency.json), referenciado pelo `package.json` raiz, regista a decisão. Não é um service manager nem um controlo de segurança executável. Não deteta automaticamente uma instalação feita pelo operador.

| Evidência | Estado |
|---|---|
| Código analisado | OmniRoute **3.8.53**, commit em [UPSTREAM.json](UPSTREAM.json) |
| Artefacto a instalar | Publicação npm pelo comando oficial; fixar versão/digest quando exigido no deployment |
| Versão instalada / runtime homologado | Não verificados; campos `null` no contrato |
| Pi de referência | **1.3.0** |

A análise anterior encontrou npm **3.8.52**, enquanto o checkout era **3.8.53**. Não são o mesmo artefacto. A versão de código analisada **não é uma ordem de instalação nem certificação**. Se instalares outra versão, rever documentação e compatibilidade antes de a promover; não preencher a versão instalada apenas com base neste guia. Guardar inventário real e resultados fora do Git, sem credenciais; atualizar o contrato apenas com evidência revista e sem dados privados.

**EN:** the selected deployment profile requires an operator-managed external OmniRoute gateway with its dashboard. It is not an npm dependency and is not required to load skills. The source pin is an analyzed candidate, not an installed or validated release. Gateway-managed fallback keeps the Pi virtual router off. Installation, credentials, service startup and paid probes require separate approval.

## Arquitetura e responsabilidade do fallback

```text
Dispositivo autorizado → VPN/mesh + TLS + autenticação/ACL
                      → Pi / Pi Web / automações
                      → OmniRoute supervisionado
                      → fornecedores/modelos explicitamente aprovados
                        (OpenRouter é upstream API opcional)
```

- O **OmniRoute controla a cadeia de fallback** neste perfil. Selecionar no Pi o modelo/combo aprovado do provider `omniroute`, não `devops-resilience/fallback-*`.
- Deixar `DEVOPS_MODEL_POLICY` ausente do ambiente Pi. `/devops-routing-status` deve mostrar `Routing disabled`. Isto confirma o router nativo inativo, **não a saúde do gateway**.
- Rever também retries do cliente, gateway e upstream; não presumir que desligar o router virtual elimina todos os retries. Limitar tentativas, concorrência e despesa na camada responsável.
- Não instalar 9Router em paralelo. OpenRouter é uma opção comercial de API, não requisito nem substituto das quotas de assinaturas ChatGPT/Claude.
- OAuth suportado no gateway é autenticado pelo próprio operador no gateway, após verificar termos. Credenciais de `/login` do Pi permanecem no Pi: nunca exportar tokens/cookies. Sem rotação de contas para evadir limites.
- A aprovação OPS de um provider físico **não enumera automaticamente destinos internos do gateway**. Aprovar a política do servidor e todos os destinatários antes de enviar evidência. O Pi não consegue provar os destinos internos de um proxy.

## Preparação pelo operador — não executada pelo pacote

1. **Instalação normal:** seguir `npm install -g omniroute` no [guia multiplataforma](../../docs/install/omniroute.md). Para deployment controlado, registar/fixar a versão efetiva e verificar integridade/proveniência e requisitos Node/OS dessa versão. No código analisado: Node `>=22.22.2 <23` ou `>=24 <27`; não é o requisito mínimo deste pacote de skills. Registar método, versão e digest; não executar instaladores apenas por estarem mencionados aqui.
2. **Serviço e painel:** usar conta de serviço com privilégios mínimos, diretório privado de dados e supervisão adequada ao host (por exemplo launchd no macOS). Usar [service.env.example](examples/service.env.example) apenas como referência não secreta. Manter painel disponível; não usar `--headless`. Não desativar indiscriminadamente schedulers/refresh necessários a OAuth, quotas ou backups. Rever e desativar individualmente funcionalidades opcionais não aprovadas: cloud sync, túneis, proxies externos, memory/injeção, MCP/A2A e transformações de contexto. Estas linhas de ambiente não fazem essa revisão por ti.
3. **Segredos antes de contas:** fornecer `STORAGE_ENCRYPTION_KEY` forte por gestor de segredos/ficheiro privado fora do repo; preservar a chave para recuperação. No código analisado, a ausência de chave permite plaintext e certos erros de cifragem também podem devolver plaintext: verificar o comportamento efetivo, não apenas a variável. Proteger disco e backups. Criar chave de inferência, autenticação de gestão e permissões distintas; `REQUIRE_API_KEY=true` não substitui autenticação do painel.
4. **Rede:** servidor em loopback por defeito. Acesso remoto por proxy TLS autenticado vinculado à interface/IP mesh, com ACL dos dispositivos autorizados. **VPN não torna `127.0.0.1` acessível remotamente por si só.** Não publicar painel/API na Internet. NetBird pode fornecer conectividade independentemente da skill HomelabHero, que não é dependência aprovada deste pacote.
5. **Política:** aprovar fornecedores, modelos/combos, dados enviados, termos OAuth/API, retenção, orçamento e fallback. Desativar destinos/pools gratuitos ou de emergência não aprovados. Configurar limites de requests/tokens/concorrência e alertas externos; nenhum orçamento aqui garante teto financeiro absoluto.

## Ligar Pi ao gateway — sem sobrescrever configurações

1. Preservar `models.json`, settings e logins existentes; guardar cópia privada antes de editar. Integrar manualmente [models.fragment.example.json](examples/models.fragment.example.json) no `models.json` do diretório de agente configurado, apenas após aprovação da configuração. O `Apply Config` da versão analisada escreve `.pi/config.json`, incompatível com este contrato Pi; não o usar.
2. Substituir `REPLACE_*` pelo ID de modelo/combo aprovado. Os preços, `contextWindow=32000`, `maxTokens=4096`, texto e reasoning off do exemplo são **ilustrativos, não capacidades/preços homologados**. Num combo, declarar limites conservadores suportados por todos os candidatos. Ferramentas, thinking, streaming e cancelamento precisam de teste; não adicionar capacidades só porque a API se anuncia compatível.
3. Fornecer `OMNIROUTE_API_KEY` ao processo Pi pelo ambiente/gestor de segredos, nunca por literal no repo. No Pi 1.3.0, `$OMNIROUTE_API_KEY` é interpolação de ambiente suportada em `models.json`. A chave de armazenamento do servidor não é a chave de inferência do cliente.
4. Abrir o seletor `/model` para recarregar `models.json` e selecionar o modelo físico `omniroute` aprovado. Reabrir o processo se o ambiente mudou. Não definir `DEVOPS_MODEL_POLICY` neste perfil e não mudar automaticamente o modelo preexistente.

## Disponibilidade e entrada em operação

Checklist manual; **não há probes automáticos nem inferência executada por este pacote**:

- [ ] Versão/artefacto, permissões, supervisor e reinício após reboot registados.
- [ ] Listener e proxy só nas interfaces aprovadas; painel e inferência com autenticação/ACL separadamente verificados.
- [ ] Health do processo acessível ao monitor autorizado; health **não comprova inferência autenticada**. Um 401 em `/v1/models` também não prova a proteção dos endpoints de inferência.
- [ ] API falsa/transporte sintético cobre 429/503, auth terminal, exaustão, contexto, tools, cancelamento e erro SSE após HTTP 200. Não repetir automaticamente output parcial nem ferramentas com efeitos laterais.
- [ ] Smoke test real com dados sintéticos, destinatários e orçamento explicitamente aprovados, incluindo pedido autenticado e rejeição de pedido não autorizado; um teste mal configurado pode gerar custo.
- [ ] Backup SQLite consistente (incluindo tratamento WAL), segredos/chave recuperáveis e restauro isolado testado; alertas fora do host e limites de custo revistos.
- [ ] Só então registar versão runtime validada e promover. Uma máquina, energia e Internet continuam pontos únicos de falha; sem SLA/HA prometidos.

Os testes offline deste pacote validam **contratos e o router Pi**, não o servidor OmniRoute, contas reais, preços, acesso remoto ou restore. Ver [testes](../../docs/TESTING.md).

## Alternativa: fallback nativo Pi (opt-in, não é o perfil escolhido)

Para operação sem gateway, a extensão `model-resilience` pode reutilizar APIs e `/login` nativos. Não necessita OmniRoute. Ler [contrato e limites](references/policy.md), copiar [policy.example.json](examples/policy.example.json) para caminho absoluto privado fora do repo, substituir placeholders e aprovar destinos/custos. `allowMetered=false` e `gatewayPolicyApproved=false` são intencionais. Definir `DEVOPS_MODEL_POLICY` só após aprovação, recarregar e selecionar o ID virtual indicado por `/devops-routing-status`.

A política de exemplo pertence **apenas a esta alternativa**; não é a configuração server-side do OmniRoute. Texto/thinking off e limites conservadores aplicam-se ao router nativo inicial, não a todos os modelos físicos Pi. Alterações de hash exigem reload/nova aprovação OPS. Usar gateway como rota de um router Pi exige revisão separada de tentativas e destinatários; não é o default escolhido.

## Falha, upgrade e rollback

- Se o gateway falhar: parar novas automações/dispatches e alertar. Não mudar silenciosamente para outro fornecedor; um modelo direto preexistente só pode ser selecionado explicitamente se o envio de dados e custos já estiver aprovado.
- Antes de upgrade: backup consistente, chave de armazenamento recuperável, versão/digest anteriores e compatibilidade da migração DB. Validar nova versão isoladamente antes de promover.
- Para reverter a integração Pi: selecionar um modelo direto aprovado; remover apenas o provider/entradas criados para OmniRoute, preservando os restantes logins/settings. Confirmar router virtual inativo. Parar o gateway só por ação explícita do operador, sobretudo se outras automações o usam.
- Para reverter o servidor: restaurar o conjunto compatível **binário + DB + configuração + chave**, sem presumir que um binário antigo lê uma DB migrada. Não apagar dados nem rodar a chave às cegas.

### Fontes da referência analisada

Todas em [OmniRoute no commit analisado](https://github.com/cheaper-inference/OmniRoute/tree/bdcd6c0088f7a68bb0d18b258fcdc1d6cd44c9ce): `docs/guides/HEADLESS.md` (conteúdo marcado 3.8.52), `docs/guides/REMOTE-MODE.md`, `docs/ops/DATABASE_GUIDE.md`, `docs/security/INFERENCE_AUTH_POSTURE.md`, `src/lib/db/encryption.ts`, `src/lib/routing/adaptiveRouting.ts` e `src/instrumentation-node.ts`. Consultar documentação correspondente à versão efetivamente instalada antes de aplicar este guia.
