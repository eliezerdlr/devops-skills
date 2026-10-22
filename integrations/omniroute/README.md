# Model resilience + OmniRoute / PT · EN

Parte do pacote único; não instalar este módulo separadamente:

```bash
pi install /caminho/absoluto/devops-skills
```

**PT:** fallback limitado entre contas já configuradas no Pi, incluindo `/login`, e APIs diretas ou um gateway OmniRoute aprovado. O runtime OmniRoute **3.8.53** continua externo. A extensão está incluída na raiz mas fica inativa sem uma política explícita e sem selecionar o modelo de routing. Requer **Pi 1.3.0**; nunca instala/inicia o gateway ou altera logins/configuração global.

**EN:** one root package; bounded fallback reuses the parent Pi registry, including native OAuth refresh. OAuth credentials stay in Pi and are never exported to OmniRoute. The external gateway is not installed or started. No policy means no routing registration; selecting the virtual model is a separate explicit action.

## Preparação do gateway (apenas se necessário)

1. Preparar a versão pinada por um procedimento de instalação aprovado, fora deste pacote. A referência de versão é o checkout em `UPSTREAM.json`, não uma imagem Docker/digest verificada. Não usar `latest`.
2. Aplicar os controlos de `examples/service.env.example`: bind loopback, `REQUIRE_API_KEY=true`, headless e background services desativados. Criar a chave de inferência e configurar apenas os fornecedores/modelos aprovados no gateway. Nunca copiar cookies/tokens de `/login` do Pi.
3. Antes de marcar `gatewayPolicyApproved=true`, rever a política **do servidor**: destinos/contas permitidos, fallback de modelo/família/emergência, retries, custos, logs e retenção; desativar memória/injeção, compressão e routing indiscriminado para a validação inicial. Preferir uma instância dedicada com apenas os destinos autorizados. O cliente não consegue provar/restringir os destinatários internos de um proxy.
4. Fazer um smoke test explicitamente aprovado. Um 401 em `/v1/models` **não prova** proteção de inferência: o upstream distingue a política desse endpoint da de `/v1/*` inference. Não usar probes de inferência sem autorização/custos definidos.

## Configurar no Pi sem sobrescrever ficheiros

1. Confirmar os IDs disponíveis no seletor de modelos e os respetivos endpoints, capacidades, preços e termos de utilização. Autorizar previamente todos os destinatários dos dados. Respeitar os limites/termos das subscrições, sem account farming ou evasão de quotas.
2. Só para o gateway: **integrar manualmente**, preservando todos os campos existentes, o fragmento `examples/models.fragment.example.json` no `models.json` do diretório de agente configurado no Pi. Fornecer `OMNIROUTE_API_KEY` pelo ambiente/gestor de segredos do host. Não usar o `Apply Config` do OmniRoute analisado: escreve `.pi/config.json`, incompatível com este contrato do Pi. Subscrições e APIs já configuradas não precisam de nova configuração.
3. Copiar `examples/policy.example.json` para um ficheiro privado **fora do repositório**, substituir todos os `REPLACE_*` e confirmar cada `origin` (HTTPS ou HTTP loopback literal), billing e suporte a ferramentas. Os placeholders são recusados. `allowMetered=false` bloqueia as rotas API pagáveis por defeito. Só alterar para `true` após aprovar essa despesa. `gatewayPolicyApproved=false` é intencional: não o alterar sem a revisão do servidor acima.
4. Definir `DEVOPS_MODEL_POLICY=/caminho/absoluto/policy.json` no ambiente do processo Pi. Reabrir/recarregar o host para reconhecer a variável e a extensão. `/devops-routing-status` mostra hash, destinos, limites e o ID `devops-resilience/fallback-<hash>`.
5. Selecionar esse **modelo virtual**, não o provider interno `devops-resilience-transport`. Não há mudança automática do teu modelo corrente. A seleção virtual mantém-se quando a resposta identifica o upstream vencedor.

Sem gateway: usar uma segunda rota API já configurada no Pi, com o seu provider/model/origin reais; não é necessário integrar o fragmento OmniRoute nem iniciar serviço. Rever os quatro adaptadores diretos suportados no contrato abaixo.

[Contrato e limites](references/policy.md). Alterar a política exige reload e seleção do novo ID/hash; não existe hot-reload de destinatários. Nos workers OPS, a aprovação humana inclui os destinos e o hash da política; o fingerprint liga plano, modelo e política.

## Validação e rollback

Mocks offline + SDK Pi real com transporte sintético cobrem quota→sucesso, ausência de replay parcial, contexto, auth, limites, cancelamento e seleção persistente. **Não validam contas reais, preços, gateway ou disponibilidade de rede.** Ver [testes](../../docs/TESTING.md).

Para voltar atrás: selecionar um modelo físico conhecido, remover `DEVOPS_MODEL_POLICY` do ambiente e recarregar. Remover só o fragmento de provider criado por esta integração, se já não for necessário, preservando os restantes settings/logins. Parar/remover o serviço externo apenas mediante ação explícita do operador. Não há promessas de tokens infinitos, zero custos ou segurança de replay de ferramentas.
