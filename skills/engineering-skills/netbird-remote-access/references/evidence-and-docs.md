# Evidência e qualidade documental

## Referência rápida

Toda a afirmação operacional deve indicar natureza da evidência, âmbito, momento de recolha e limitações. Esta documentação não contém observações de infraestrutura real.

## Problema

Notas antigas, diagramas e resultados isolados podem transformar hipóteses em aparentes factos. Acrescentar uma nota nova não corrige necessariamente uma afirmação antiga contraditória.

## Soluções

### Classes de evidência

| Classe | Significado | Regra de redacção |
|---|---|---|
| Observado | Medido ou visto directamente por método autorizado | Indicar método, âmbito e momento |
| Reportado | Comunicado por outra fonte | Identificar a natureza da fonte, sem dados pessoais |
| Inferido | Conclusão derivada de evidência | Explicitar raciocínio e incerteza |
| Proposto | Desenho ou acção ainda não aplicada | Não usar linguagem de conclusão |
| Não verificado | Sem confirmação suficiente | Não converter ausência de erro em sucesso |

Usar referência sanitizada da evidência; não incorporar logs originais, capturas com dados reais, inventário ou ligações internas.

### Correspondência entre afirmação e prova

- Estado healthy pode demonstrar apenas uma condição de saúde definida pelo componente.
- Ligação ao Management não demonstra acesso a RESOURCE.
- Um teste positivo não demonstra negação a clientes indevidos.
- Um teste numa porta não demonstra todas as portas.
- Um percurso directo observado num momento não garante que nunca será usado relay.
- Um PASS do validador não demonstra ausência de dados pessoais nem segurança da infraestrutura.

Registar resultados inconclusivos e falhas, sem omitir condições do teste.

### Revisão temporal

Em cada alteração relevante, rever todos os artefactos afectados:

- Markdown e tabelas.
- JSON e resumos de resultados.
- Diagramas e respectivas legendas.
- PDF e versões exportadas.

Substituir ou marcar afirmações ultrapassadas. Não limitar a manutenção a acrescentar notas no fim.

Indicar versão de referência, data de revisão, âmbito e estado de validade. Não atribuir autoria a uma pessoa real neste pacote. Remover contradições entre texto, diagramas e anexos.

### Documentação profissional

Usar português de Portugal, pseudónimos consistentes e termos definidos. Separar desenho de referência, proposta e estado verificado.

Os diagramas devem distinguir plano de controlo, STUN e caminho de dados, incluindo os limites da cifra e o segmento LAN.

Evitar capturas de interfaces reais. Uma ilustração fictícia deve ser identificada como tal.

### PDF e formatos copiáveis

Verificar o render final do PDF, não apenas o ficheiro de origem:

- Número e ordem das páginas.
- Texto visível e legível.
- Ausência de cortes, sobreposição e overflow.
- Tabelas e diagramas dentro dos limites.
- Ligações e caracteres correctamente apresentados.
- Ausência de dados reais em conteúdo e metadados.

Manter código ou exemplos técnicos copiáveis em HTML/Markdown, quando existirem no pacote final. Não depender de capturas de ecrã para copiar texto. Esta documentação não fornece payloads executáveis de infraestrutura.

### Verificação offline

Validação: `python3 scripts/validate_skill.py`.

Contrato: JSON em stdout; saída 0 para PASS e 1 para FAIL.

Testes: `python3 -B -m unittest discover -s tests -v`.

Os ficheiros fazem parte do pacote. Não afirmar que os comandos foram executados ou passaram sem resultado observado.

O validador rejeita symlinks, hardlinks, ficheiros ocultos, caches, tipos de ficheiro não permitidos ou conteúdo com codificação/controlos binários, endereços não documentais, domínios não permitidos, identificadores de contas ou AWS, UUIDs, credenciais literais e scripts de rede ou subprocessos.

Não recolhe ambiente, não executa infraestrutura e não instala software. É heurístico, não DLP, e não detecta arbitrariamente todos os nomes de pessoas ou hostnames curtos. A revisão manual continua obrigatória.

### Referências públicas

Consultar apenas quando houver autorização para pesquisa e necessidade de confirmar comportamento da versão:

- https://docs.netbird.io
- https://doc.traefik.io
- https://docs.docker.com
- https://docs.aws.amazon.com

Estas referências não foram consultadas para produzir este pacote e não constituem prova de compatibilidade. Registar a versão e a página efectivamente consultadas numa revisão futura autorizada.

## Compromissos

Minimizar evidência reduz exposição de dados, mas pode limitar a reprodução do diagnóstico. Declarar essa limitação em vez de copiar material original.

## Casos limite

Se uma evidência estiver desactualizada, incompleta ou contraditória, classificar a conclusão como não verificada até revisão. Não prometer auditoria certificada, testes sem falhas ou estado runtime não medido.
