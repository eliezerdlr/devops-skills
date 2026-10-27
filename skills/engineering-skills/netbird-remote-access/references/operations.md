# Operações e autorização

## Referência rápida

Nenhuma instrução desta skill autoriza acesso a sistemas. Não contém payloads de instalação ou alteração.

Antes de qualquer mutação, registar aprovação específica de alvo, âmbito, comando, impacto, rollback e recuperação. A aprovação deve corresponder à operação concreta, não apenas ao objectivo geral.

## Problema

Uma autorização documental pode ser confundida com autorização operacional. Alterações de rede ou identidade podem também retirar o acesso necessário à recuperação.

## Soluções

### Gates independentes

| Gate | Entregável para decisão | Limite |
|---|---|---|
| Discovery | Requisitos e informação sanitizada | Sem SSH ou sondagens implícitas |
| Proposta | Desenho, riscos, alternativas e fonte de verdade | Não executar a proposta |
| Preparação | Plano de alteração e recuperação aprovado | Não inscrever nem publicar por extensão |
| Inscrição | Aprovação de chave, identidade e política do peer | Não concede acesso LAN automaticamente |
| Publicação | Prefixos, RESOURCE, portas e clientes aprovados | Sem default route implícita |
| Teste | Alvos, métodos, janela e critérios aprovados | Não ampliar o teste a outros recursos |
| Manutenção | Alteração concreta e documentação revista | Não reutilizar aprovação anterior indiscriminadamente |

SSH exige aprovação própria, mesmo para observação. Instalação, pull de imagens, up de serviços, firewall, rotas e criação de chaves não estão autorizados pela aprovação de documentação.

Testes de conectividade também exigem aprovação: podem gerar sessões, carga ou registos.

### Registo de aprovação

Usar uma ficha textual sem valores reais neste pacote:

| Campo | Conteúdo necessário na operação autorizada |
|---|---|
| Alvo | Sistema e componente inequivocamente identificados |
| Âmbito | Recursos e operações permitidos e excluídos |
| Comando | Invocação exacta revista, sem segredo literal no registo |
| Impacto | Interrupções possíveis, dependências e alcance |
| Rollback | Reversão limitada à alteração |
| Recuperação | Via independente se o acesso remoto falhar |
| Critério de paragem | Condição que impede continuar |
| Validade | Janela e condições da aprovação |

Sem via de recuperação adequada, não avançar para uma alteração que possa cortar o acesso.

### Preparação

Confirmar versão, compatibilidade, disponibilidade do caminho de recuperação e fonte de verdade. Rever estado persistente, proprietários, permissões, host networking, capabilities e TUN.

Não aplicar chown recursivo nem presumir que o utilizador do contentor coincide entre versões.

Os templates `templates/compose.yaml`, `templates/compose.bootstrap.yaml` e `templates/environment.example` permanecem não operacionais até preencher parâmetros e rever o resultado.

### Inscrição e bootstrap

1. Aprovar uma chave de inscrição única, com modo efémero desligado.
2. Disponibilizá-la por keyfile, sem incorporar o valor na documentação, no Compose, no histórico ou na saída de diagnóstico.
3. Usar o estado persistente previsto para o peer.
4. Verificar a identidade inscrita através de evidência autorizada.
5. Revogar a chave de bootstrap.
6. Mediante aprovação, recriar somente o serviço do agente com Compose base, sem referência nem mount de bootstrap; confirmar reconexão e a mesma identidade persistente.
7. Só então remover o ficheiro temporário da chave pelo procedimento aprovado. Não apagar estado nem assumir que a remoção limpa snapshots/cópias anteriores.

A expiração da chave impede utilizações futuras segundo a sua política; não expira nem remove automaticamente o peer já inscrito.

Revogar uma chave não equivale a revogar um peer. Desinscrição ou remoção de acesso requer operação própria.

Se a identidade não puder ser comparada, parar e registar «não verificado». Não apagar estado para forçar uma nova inscrição.

### Publicação e teste

Publicar apenas o prefixo e os acessos aprovados. Confirmar retorno e efeitos de masquerade antes de interpretar resultados.

Testar separadamente:

- Acesso do cliente autorizado ao recurso e porta aprovados.
- Negação ao cliente não autorizado.
- Ausência de acessos adicionais não previstos.
- Continuidade da identidade.
- Caminho de dados, para além do estado healthy.

Não registar sucesso sem evidência correspondente ao critério.

### Manutenção e recuperação

Rever versões, permissões, identidade, políticas e documentação com nova aprovação quando houver alteração.

Rollback deve ser específico e limitado ao delta autorizado. Não reiniciar Docker globalmente, apagar state, restaurar firewall global ou efectuar limpezas indiscriminadas.

Preservar proprietários e estado. A recuperação não pode depender apenas do próprio acesso que a alteração pode interromper.

## Compromissos

Gates separados acrescentam revisão, mas evitam que inscrição seja confundida com publicação ou que diagnóstico se transforme em alteração não autorizada.

Preservar identidade limita reinscrições acidentais, mas exige protecção do estado persistente.

## Casos limite

- Mudança de identidade inesperada: parar e investigar com autorização.
- IaC diferente do protótipo: reconciliar a proposta com a fonte de verdade antes de aplicar.
- Pedido de exit node: abrir gate próprio; não reutilizar a aprovação de acesso LAN.
- Falha sem recuperação disponível: não tentar alterações sucessivas por tentativa.
