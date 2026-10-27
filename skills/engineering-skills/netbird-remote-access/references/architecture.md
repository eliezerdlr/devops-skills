# Arquitectura de referência

## Referência rápida

Percurso lógico do âmbito principal:

Cliente autorizado → rede NetBird → peer-router → RESOURCE na LAN.

`VM-ROUTING-01`, `peer-router` e `RESOURCE` são pseudónimos. Não representam inventário observado.

## Problema

Separar plano de controlo, descoberta de conectividade e caminho de dados. Uma sessão de gestão funcional não demonstra que o recurso LAN está acessível, nem que um cliente indevido está bloqueado.

## Soluções

### Plataforma e terminação TLS

O desenho parte de AWS já existente. Não pressupõe conta, região, topologia, regras de segurança ou recursos específicos. Não autoriza criação ou alteração de recursos.

Traefik termina TLS nos endpoints públicos previstos. Management, Signal e gRPC comunicam por h2c no segmento interno do desenho de referência.

h2c é HTTP/2 sem TLS nesse segmento; não deve ser descrito como cifrado. Confirmar portas, encaminhamentos, isolamento e compatibilidade nas versões seleccionadas. Não extrapolar esta disposição para todas as versões ou distribuições.

### STUN e dados

STUN utiliza UDP 3478 fora do proxy HTTP. Não tentar tratá-lo como tráfego HTTP através de Traefik. A exposição UDP, os controlos de rede e o alvo exigem aprovação explícita.

O caminho de dados pode estabelecer WireGuard directo ou recorrer a relay com tráfego cifrado. A disponibilidade do relay não dispensa políticas de acesso, nem garante desempenho equivalente ao percurso directo.

Não confundir relay de dados com reverse proxy da aplicação.

### Routing peer

O routing peer encaminha tráfego de camada 3 para uma LAN alcançável. Não é uma bridge de camada 2 nem, por esse papel, um reverse proxy.

A proposta deve identificar:

- Prefixo de destino e eventual sobreposição.
- RESOURCE e portas estritamente necessárias.
- Clientes e grupos autorizados.
- Política aplicável ao recurso.
- Caminho de retorno.
- Necessidade de masquerade.
- Responsável pela configuração e fonte de verdade.

Não publicar prefixos adicionais por conveniência.

### Retorno e masquerade

Sem masquerade, confirmar que existe um caminho de retorno adequado para os endereços dos clientes. Não presumir que a LAN conhece a rede sobreposta.

Com masquerade, RESOURCE pode observar o endereço do routing peer em vez do endereço original do cliente. Os registos LAN deixam, por si só, de permitir atribuição individual por IP.

Documentar esta limitação. Qualquer correlação com identidade requer evidência adicional, autorizada e sujeita a minimização; não prometer atribuição perfeita.

### Limite da cifra

O túnel protege o percurso coberto pelo túnel. Se o routing peer comunicar por HTTP com RESOURCE, esse segmento LAN permanece sem cifra.

Quando necessário, propor TLS até ao recurso como alteração separada. Não declarar cifra ponta a ponta com base apenas na ligação NetBird.

### Identidade e privilégios

O estado persistente contém material sensível e suporta continuidade de identidade. Definir armazenamento neutro sob `/srv/netbird`, persistência, proprietário e permissões antes de qualquer instalação aprovada.

Os templates do agente destinam-se a Linux com Docker Engine/Compose e TUN. Não extrapolar host networking para Docker Desktop ou outros sistemas. Host networking reduz isolamento da rede do contentor. Capabilities de rede e acesso ao dispositivo TUN podem ampliar o impacto sobre o anfitrião.

Validar necessidades exactas na versão e no ambiente escolhidos. Não assumir que todos os privilégios são obrigatórios nem que um template funciona universalmente. Não corrigir permissões com chown recursivo.

## Compromissos

| Opção | Benefício | Limite |
|---|---|---|
| Percurso directo | Evita intermediação de relay | Depende da conectividade efectiva |
| Relay cifrado | Percurso alternativo | Pode alterar latência e capacidade |
| Masquerade | Simplifica retorno | Oculta IP original perante RESOURCE |
| Host networking | Pode facilitar encaminhamento | Reduz isolamento |
| Protótipo Compose | Facilita revisão inicial | Não substitui IaC aprovada |

## Casos limite

### Exit node

Exit node transporta um âmbito de tráfego diferente do acesso a um recurso LAN. Exige gate separado com avaliação de tráfego abrangido, DNS, privacidade, capacidade, custos, impacto e recuperação.

Não distribuir default route por rotina nem activar exit node como solução implícita para falhas de acesso.

### Sobreposição e disponibilidade

Sobreposição de prefixos pode tornar o destino ambíguo. Suspender a publicação e propor desenho explícito, em vez de alterar rotas por tentativa.

Um routing peer, relay ou endpoint de gestão isolado não demonstra HA. Não inferir SLA, redundância ou recuperação automática sem desenho e testes específicos.
