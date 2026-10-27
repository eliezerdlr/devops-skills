---
name: netbird-remote-access
description: 'Use when: planear, documentar ou rever acesso remoto NetBird a recursos LAN através de um routing peer, com autorização faseada, evidência explícita e privacidade.'
---

# Acesso remoto NetBird

## Referência rápida (Quick Reference)
- Âmbito: cliente autorizado → routing peer → RESOURCE na LAN.
- Carregar esta skill não autoriza execução nem alterações.
- Exit node é um âmbito distinto, com gate próprio; não distribuir default route por rotina.
- Carregar só a referência necessária à fase: [arquitectura](references/architecture.md), [operações](references/operations.md), [evidência](references/evidence-and-docs.md), [privacidade](references/privacy.md) ou [cenários](references/scenarios.md).
- Ficheiros incluídos: `scripts/validate_skill.py`, `templates/compose.yaml`, `templates/compose.bootstrap.yaml` e `templates/environment.example`.
- A existência dos ficheiros não comprova validação nem operação. Templates do agente destinam-se a Linux; validar versão, arquitectura e digest da imagem.
- Validação offline: `python3 scripts/validate_skill.py`; JSON em stdout, saída 0 para PASS e 1 para FAIL.
- Testes offline: `python3 -B -m unittest discover -s tests -v`, sem cache de bytecode no pacote.
- O validador é heurístico, não DLP; a revisão manual é obrigatória.

## Problema (Problem)
Permitir acesso remoto restrito a um recurso LAN sem confundir saúde do plano de controlo, autorização e funcionamento do caminho de dados. Produzir documentação portátil, sem dados reais nem alegações de execução sem evidência.

## Soluções (Solutions)
### Gates separados
1. **Discovery:** trabalhar com requisitos sanitizados; não iniciar SSH nem sondagens.
2. **Proposta:** definir RESOURCE, clientes, prefixos, portas, retorno e fonte de verdade.
3. **Preparação:** aprovar alterações, dependências, privilégios e recuperação.
4. **Inscrição:** aprovar credencial de bootstrap e identidade persistente.
5. **Publicação:** aprovar rotas e políticas mínimas, sem default route implícita.
6. **Teste:** aprovar alvos, métodos, limites e testes positivos e negativos.
7. **Manutenção:** aprovar actualizações, revogações, alterações e revisão documental.

Antes de mutações, obter aprovação específica de alvo, âmbito, comando, impacto, rollback e recuperação. Aprovar documentação não autoriza SSH, instalação, pull, up, firewall, rotas ou chaves. Silêncio não é aprovação.

### Arquitectura
- Pressuposto de desenho: AWS já existente; não criar recursos nem assumir HA ou SLA.
- Traefik termina TLS; Management, Signal e gRPC usam h2c no segmento interno previsto, sujeito a confirmação por versão.
- STUN em UDP 3478 fica fora do proxy HTTP; a exposição exige aprovação própria.
- O caminho de dados usa WireGuard directo ou relay com tráfego cifrado.
- O routing peer encaminha tráfego de camada 3; não substitui o gateway por omissão da LAN, nem é reverse proxy ou bridge de camada 2.
- Masquerade simplifica o retorno, mas limita atribuição por IP na LAN.
- HTTP na LAN continua sem cifra nesse segmento.

### Identidade e privilégios
Preservar estado persistente e respectivos proprietários; não aplicar chown recursivo. Validar host networking, capabilities e acesso TUN por versão. Nenhum template é universal.

Usar keyfile de bootstrap para inscrição única, com modo efémero desligado. A expiração da chave não expira o peer. Revogar a chave, recriar apenas o serviço com Compose base sem bootstrap, confirmar reconexão com a mesma identidade e só depois remover o ficheiro temporário. Sem evidência, registar «não verificado».

Os templates não são operacionais até preencher e rever `NB_IMAGE`, `NB_HOSTNAME`, `NB_MANAGEMENT_URL`, `NB_STATE_DIR`, `NB_SETUP_KEY_PATH` e `NB_PROJECT_NAME`.

## Compromissos (Trade-offs)
- Masquerade facilita retorno mas oculta o IP original perante RESOURCE.
- Host networking, capabilities e TUN aumentam a exposição do anfitrião.
- Relay pode alterar latência e capacidade; não substitui autorização.
- Um protótipo Compose não substitui a fonte de verdade IaC aprovada.

## Casos limite (Edge Cases)
- Redes sobrepostas: suspender publicação até existir desenho aprovado.
- Cliente não autorizado: verificar negação através de teste aprovado.
- Estado healthy não demonstra datapath nem acesso autenticado a RESOURCE.
- Exit node exige análise, aprovação, testes e recuperação separados.
- Não reiniciar Docker globalmente, apagar estado ou restaurar firewall global.
- Não copiar documentação original, logs, inventário, state, credenciais ou links internos.
- Usar pseudónimos e apenas parâmetros ou exemplos documentais reservados.
- Distinguir observado, reportado, inferido, proposto e não verificado.
- Rever temporalmente Markdown, JSON, diagramas e PDF, não apenas acrescentar notas.
- Verificar render final do PDF: páginas, texto visível e overflow.
- Manter código copiável em HTML/Markdown, sem payloads executáveis nesta documentação.
