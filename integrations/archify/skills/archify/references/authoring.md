# Autoria sob pedido — runtime como fonte canónica

Todos os caminhos abaixo são relativos a DEVOPS_ARCHIFY_DIR (o diretório externo
archify/ já verificado). Ler ficheiros desse runtime configurado; não são links
para cópias inexistentes dentro desta integração. Não procurar schemas de outra
versão na rede. Se ausentes ou diferentes do pin, parar.

## Leitura mínima

Ler references/authoring-defaults.md, schemas/common.schema.json e o schema/example
do tipo escolhido. Para um sistema real, ler references/repository-authoring.md e
somente as fontes autorizadas relevantes. Não copiar factos de exemplos. Antes de
usar cada enum/campo, confirmar a sua definição no schema pinado. Ler em lotes
limitados e recuperar secções truncadas. Mermaid é entrada conceptual: reescrever
JSON nativo a partir da topologia, não executar JS nem copiar estilos cegamente.

| Tipo | Schema | Example |
|---|---|---|
| architecture | schemas/architecture.schema.json | examples/web-app.architecture.json |
| workflow | schemas/workflow.schema.json | examples/agent-tool-call.workflow.json |
| sequence | schemas/sequence.schema.json | examples/cache-miss-request.sequence.json |
| dataflow | schemas/dataflow.schema.json | examples/product-analytics.dataflow.json |
| lifecycle | schemas/lifecycle.schema.json | examples/deployment-release.lifecycle.json |
| erd | schemas/erd.schema.json | examples/orders.erd.json |
| class | schemas/class.schema.json | examples/payments.class.json |
| tree | schemas/tree.schema.json | examples/payment-platform.tree.json |
| timeline | schemas/timeline.schema.json | examples/payment-incident.timeline.json |
| waterfall | schemas/waterfall.schema.json | examples/checkout-request.waterfall.json |

Architecture de deployment: examples/production-deployment.architecture.json.
Layout/rotas: references/architecture-layout-repair.md e
references/authoring-contract.md quando houver falha concreta. Viewer avançado:
references/viewer-runtime.md somente se pedido e dentro das capacidades expostas.
Operação/proveniência: references/delivery-contract.md. Avisos de atualização:
references/update-awareness.md, apenas para compreender receipts; o adaptador não
consulta updates nem executa snooze/ignore/install.

## Contrato desta adaptação

Escolher tipo pela pergunta: componentes→architecture; etapas/gates→workflow;
chamadas→sequence; circulação de dados→dataflow; estados→lifecycle; tabelas→erd;
classes→class; árvore single-parent→tree; datas→timeline; durações→waterfall.
Conservar nomes, relações, condições e fontes relevantes. Não inventar datas,
medidas ou inventários. Indicar quando o diagrama é conceptual/ilustrativo.

Criar JSON com schema_version aceito pelo schema pinado, diagram_type do tipo
escolhido e meta com title, output e quality_profile. output corresponde ao destino
exato da configuração, relativo a outputRoot, não à pasta do runtime. O wrapper
executa com cwd=outputRoot. Não reutilizar meta.output dos exemplos.

Preferir showcase. Um ERD denso pode justificar standard explicitamente; preservar
todas as colunas físicas, tipos, comentários e key roles (pk/fk/unique), referências
FK e domínios de layout em blocos retangulares. Não esconder campos em cards.
Rotas automáticas primeiro; rotas explícitas apenas para necessidade real ou reparo
medido. Não alterar factos/topologia para fazer um gate passar.

Usar semantic component types e ícones genéricos do schema. O wrapper recusa brand,
logo, src, href, html, script e font em qualquer objeto, strings com markup < >,
URLs http(s)/file/data/javascript e //. Esta política conservadora também recusa
alguns labels legítimos e URLs de evidência: reformular texto ou reportar o limite,
não remover verificações. Não há bypass para logos, mesmo num pedido de marketing.

Sem --repo-root: esta adaptação não valida proveniência de um repositório externo.
Não fingir que um desenho source-backed passou essa verificação. Conservar as
citações do levantamento em resposta/handoff aprovado, sem embed de URLs neste
perfil. Se o candidate exige o gate repository-backed ou conteúdo bloqueado,
parar e reportar essa limitação, em vez de enfraquecer o schema/gates.

Explainer Markdown/HTML e exportações não são expostos. Um pedido de apresentação
pode ser atendido por um dos dez diagramas se adequado e aceite; caso contrário,
explicar a cobertura limitada e pedir decisão, sem renderização alternativa oculta.

## Reparação e entrega

Ao falhar, ler diagnostics/receipt do gate; corrigir uma causa coerente mantendo
intenção e evidência. Duas tentativas focadas sem resolver a mesma causa exigem
reler o contrato relevante; uma tentativa adicional baseada em evidência e depois
reportar o bloqueio. Cada tentativa do wrapper usa novo output e nova pasta.

Só entregar HTML se existe e os gates reais passaram. Mencionar standard/warnings
ou limitações que mudam a leitura. Distinguir validação, proveniência, browser e
inspeção percetual. Não dizer que a validação mocked provou conteúdo/layout real.
