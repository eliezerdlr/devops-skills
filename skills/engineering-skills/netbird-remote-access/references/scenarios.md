# Cenários de revisão e aceitação

## Referência rápida

Estes cenários são critérios documentais fictícios, não resultados de testes. Qualquer teste real exige gate próprio, alvo, âmbito, método, impacto e recuperação aprovados.

## Problema

Um único indicador positivo pode ocultar falhas de autorização, encaminhamento, retorno, identidade ou confidencialidade.

## Soluções

### 1. Cliente autorizado

**Proposta:** permitir ao cliente autorizado alcançar apenas RESOURCE e a porta aprovada através de peer-router.

**Evidência necessária:** resultado do acesso ao recurso, identidade e política aplicável, âmbito e momento do teste.

**Aceitação:** acesso previsto demonstrado, sem extrapolar para outras portas ou clientes.

**Limite:** uma ligação bem-sucedida não prova que clientes indevidos são bloqueados.

### 2. Cliente não autorizado

**Proposta:** realizar um teste negativo aprovado a partir de um cliente sem permissão.

**Evidência necessária:** negação no recurso e porta em avaliação, com contexto suficiente para distinguir política de uma falha genérica de conectividade.

**Aceitação:** acesso indevido não disponível e causa compatível com o controlo esperado.

**Paragem:** se o acesso funcionar, não alargar os testes nem alterar políticas sem aprovação.

### 3. Redes sobrepostas

**Situação fictícia:** o cliente e a LAN anunciam o mesmo prefixo documental 192.0.2.0/24.

**Risco:** selecção ambígua de destino e encaminhamento inesperado.

**Decisão:** suspender publicação e propor uma solução explícita. Não distribuir default route nem transformar o routing peer em exit node para contornar o problema.

### 4. HTTP sem cifra na LAN

**Situação:** o túnel está cifrado, mas peer-router comunica por HTTP com RESOURCE.

**Conclusão permitida:** existe cifra no percurso coberto pelo túnel; o segmento HTTP LAN permanece sem cifra.

**Conclusão proibida:** afirmar cifra ponta a ponta.

**Próximo passo:** avaliar protecção do segmento LAN ou TLS até RESOURCE como proposta separada.

### 5. Healthy sem datapath

**Situação:** o componente apresenta estado healthy e ligação ao Management.

**Risco:** assumir que RESOURCE está acessível.

**Decisão:** manter datapath como não verificado até teste aprovado do recurso, política e retorno. Não usar saúde do controlo como substituto do teste funcional.

### 6. Retorno com e sem masquerade

**Sem masquerade:** verificar o caminho de retorno antes de concluir que a política bloqueia o cliente.

**Com masquerade:** documentar que RESOURCE pode observar o IP do routing peer.

**Limite:** registos LAN por IP não demonstram atribuição individual ao cliente original. Não prometer rastreabilidade perfeita.

### 7. Bootstrap e continuidade da identidade

**Proposta:** inscrição única por keyfile, modo efémero desligado e estado persistente.

**Evidência necessária:** revogação da chave, recriação apenas do serviço sem bootstrap e reconexão com a mesma identidade antes de remover o ficheiro temporário.

**Negativo:** a expiração da chave não permite declarar o peer removido.

**Paragem:** se surgir identidade diferente ou o estado estiver ausente, não apagar state nem reinscrever por tentativa.

### 8. Privilégios e versão

**Situação:** um template prevê host networking, capabilities ou TUN.

**Decisão:** confirmar a necessidade e os riscos na versão seleccionada antes da preparação.

**Negativo:** não afirmar que o template serve todas as versões; não efectuar chown recursivo para corrigir permissões.

### 9. Fonte de verdade IaC versus protótipo

**Situação:** o protótipo Compose difere da configuração IaC aprovada.

**Decisão:** classificar o Compose como proposta ou protótipo e reconciliar a divergência com a fonte de verdade.

**Negativo:** não aplicar o protótipo directamente nem declarar a infraestrutura actualizada apenas porque o ficheiro foi editado.

### 10. Exit node solicitado posteriormente

**Situação:** surge um pedido de encaminhamento geral de tráfego.

**Decisão:** abrir gate distinto, com análise de âmbito, DNS, privacidade, capacidade, custos, impacto, teste e recuperação.

**Negativo:** a autorização de acesso a RESOURCE não autoriza distribuir default route.

### 11. Relay e disponibilidade

**Situação:** um percurso observado utiliza relay cifrado.

**Conclusão permitida:** esse percurso foi observado no âmbito e momento indicados.

**Conclusão proibida:** garantir desempenho futuro, HA ou SLA.

**Decisão:** avaliar requisitos de disponibilidade separadamente, sem assumir redundância da AWS existente ou do routing peer.

### 12. Autorização apenas documental

**Situação:** existe aprovação para preparar documentação.

**Permitido:** produzir proposta sanitizada e registar questões pendentes.

**Não permitido:** SSH, instalação, pull, up, firewall, rotas, chaves, testes de alvos ou criação de recursos.

**Decisão:** pedir aprovação específica antes de passar ao gate operacional.

### 13. Validação e exportação

**Situação:** o validador devolve PASS.

**Conclusão permitida:** as verificações heurísticas executadas passaram segundo o resultado observado.

**Conclusão proibida:** ausência garantida de dados pessoais, auditoria certificada ou segurança perfeita.

**Aceitação documental:** revisão manual de todos os artefactos e verificação do render final do PDF, incluindo páginas, texto visível e overflow. Código, se aplicável, permanece copiável em HTML/Markdown.

## Compromissos

Testes positivos demonstram capacidade; testes negativos avaliam restrição. Ambos têm âmbito limitado e não constituem prova universal de segurança.

## Casos limite

Resultados contraditórios, identidade incerta, ausência de recuperação ou evidência desactualizada impedem declarar conclusão.

Registar «não verificado» quando necessário. Nunca reiniciar Docker globalmente, apagar estado, expor segredos ou restaurar firewall global para obter um resultado aparentemente positivo.
