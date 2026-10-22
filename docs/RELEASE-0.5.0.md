# DevOps Skills 0.5.0 — implementação e revisão

## Entregue

- Um pacote raiz: **113 especialistas + catálogo, 8 prompts, 2 extensões**.
- **Model resilience:** quota fallback explícito sobre registry Pi; mantém API/OAuth nativos e não exporta tokens. Política privada, allowlist/origins, limites/deadlines, metered opt-in e aprovação OPS vinculada a modelo/plano/política.
- **OmniRoute:** integração e configuração de referência para runtime externo 3.8.53, sem instalação/serviço automático nem Apply Config incompatível.
- **Archify:** skill e adaptador plan/execute para 10 tipos de diagramas HTML nativos; runtime externo 3.2.0 pinado por 203 hashes, licenças/avisos preservados e símbolos genéricos por defeito.

## Verificação

**219 testes passaram:** 180 offline, 28 SDK Pi 1.3.0 com transporte sintético, 11 addon planning. Incluem ausência de replay de partial/toolcalls/length, override nativo de endpoint bloqueado antes de envio e aprovação de todos os destinatários de fallback. Revisão independente concluída; três findings relevantes corrigidos, sem blocker remanescente identificado nesse escopo.

## Limites e ativação

Routing inicial: **texto, thinking off**, quatro APIs diretas compatíveis (OpenAI completions/responses/Codex, Anthropic messages), outras via gateway aprovado. Origin guard depende do contrato pre-send do SDK/fornecedor e não é um firewall. Não há garantia de tokens infinitos nem teto financeiro absoluto.

**Não houve** acesso manual a credenciais, alteração de logins/settings globais, instalação, serviço, pedido pago, teste de contas/gateway real, execução real Archify ou abertura do browser. Os mocks não provam acessibilidade, preços, qualidade visual ou segurança de rede em produção.

Para ativar: [definir destinatários e limites privados de routing](../integrations/omniroute/README.md), ou [preparar o runtime Archify sob pedido](../integrations/archify/README.md). Sem a política explícita o routing permanece inativo; o modelo corrente não é alterado.

Rollback: selecionar um modelo físico, remover DEVOPS_MODEL_POLICY do ambiente e recarregar; preservar os outros providers/logins. Não há commit/push automático.
