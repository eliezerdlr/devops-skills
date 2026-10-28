# Instalações externas — macOS, Linux e Windows

Estes guias só se aplicam aos workflows escolhidos explicitamente. Carregar as skills não exige instalar OmniRoute, Archify ou outro serviço. Ver [âmbito da recuperação](RESTORED-SKILLS.md).

## Caminho opcional: OmniRoute

1. Instalar **Node.js LTS com npm** para o sistema/arquitetura em [nodejs.org](https://nodejs.org/en/download), ou reutilizar a instalação existente compatível.
2. No Terminal (macOS/Linux) ou PowerShell (Windows):

```sh
node --version
npm --version
npm install -g omniroute
omniroute --version
```

3. [Iniciar com configuração local e verificar o painel](install/omniroute.md#configuração).

**Não é preciso instalar Python, Git, Docker, criar um instalador próprio ou configurar um serviço para usar o OmniRoute.** O npm global usa o prefixo do Node/npm escolhido, não a pasta `devops-skills`. Instalação, configuração de contas e serviço persistente são passos separados.

## Guias por componente

| Componente | Quando necessário | Guia |
|---|---|---|
| Node/npm + Pi | Host das extensões | [Host — três sistemas](install/host.md) |
| OmniRoute | Perfil `gateway-managed` escolhido | [Instalação npm, configuração e lifecycle — três sistemas](install/omniroute.md) |
| Graphify | Mapeamento/consulta de projetos | [CLI Python — macOS/Linux e Windows](install/graphify.md) |
| Archify | Renderização de diagramas | [Runtime pinado — macOS/Linux e Windows](install/archify.md) |
| Planning with Files | Addon opt-in | [Ativação, helpers e remoção](../integrations/planning-with-files/README.md) |
| Ferramentas das skills | Só no workflow escolhido | [Ferramentas e fontes por sistema](install/workflow-tools.md) |

[Inventário estruturado](external-installations.json) e [requisitos técnicos](DEPENDENCIES.md). O [apêndice macOS de piloto isolado/launchd](install/omniroute-macos-advanced.md) é **opcional e separado**, não o caminho normal. Não misturar instalações globais com paths/wrappers desse perfil alternativo.

## Instalação simples, operação controlada

- Usar o mecanismo oficial normal. `npm install -g omniroute` resolve a versão publicada; versão fixa é opção para controlo de mudanças, não requisito para experimentar o produto. Registar versão efetiva antes de promover a produção.
- Reutilizar gestores existentes; não instalar cópias concorrentes, alterar políticas globais ou recorrer automaticamente a `sudo`/`--force` perante erro.
- Manter configurações/segredos/dados fora do Git. Antes de atualizar dados, ter backup e plano de rollback compatível.
- Painel/API local protegidos; acesso remoto requer TLS/autenticação/ACL próprios. A instalação não autoriza envio de dados, subscrições ou inferência paga.
- Serviços são opcionais: [receitas launchd no macOS e systemd no Linux para npm global](install/omniroute-services.md); no Windows, mecanismo aprovado na organização. Não habilitar serviço nem segundo supervisor por consequência de instalar skills.
- Addy Engineering, Web Quality, Security Audit e ECC selecionado não exigem instalar os seus repositórios upstream. Não executar npm recursivamente em snapshots/fixtures.
- OpenRouter é serviço remoto, não programa local. NetBird/proxy e ferramentas específicas de cloud/GPU/browser são escolhas de infraestrutura/workflow, não requisitos do pacote inteiro.

## Contrato obrigatório de documentação

Cada dependência operacional deve identificar: finalidade, plataformas, pré-requisitos, fonte e seleção de versão; comando oficial de instalação; paths/segredos; arranque e verificação; atualização/backup/rollback; remoção e limitações reais de teste. O caminho simples aparece primeiro. Isolamento avançado, serviço e políticas empresariais ficam separados, sem converter boas práticas opcionais em obstáculos universais.

Isto é documentação, não instalação automática nem certificação. Não inventar suporte funcional, performance ou pins para preencher campos. Ferramentas de exemplos sem versão/alvo selecionados são avaliadas quando se ativa o respetivo workflow.

## Verificação documental

Da raiz: `npm test`. Valida as skills, a integridade dos módulos e contratos com fixtures sintéticas; as receitas de serviço deste índice não são executadas nesta suite. Os testes usam Node, Bash e Python disponíveis; **esses requisitos são dos testes de contribuição, não da instalação OmniRoute**. PowerShell é documentado, mas não foi executado neste host. Não se executam instaladores, servidor, launchctl, criação de credenciais ou inferência.

## Estado

Suítes SDK anteriores: Pi 1.3.0. Pi 1.4.0 foi observado instalado, sem nova homologação SDK. Instalações reais macOS/Linux/Windows, serviços persistentes e benchmarks não foram executados nesta alteração. **Nenhum código de runtime, dependência ou processo adicional foi introduzido por estes guias.**

**EN:** install Node.js with npm, then `npm install -g omniroute` on macOS, Linux or Windows. Platform-specific environment setup and lifecycle are documented separately; managed services and isolated deployments are optional. Written commands are not proof of runtime or performance validation.

## Âmbito após recuperação

Este índice é referência para ferramentas **opcionais**, não uma sequência a executar ao instalar o pacote. Nenhum perfil OmniRoute é imposto ao projecto principal. O manifesto principal carrega apenas orquestração e API NetBird; o router nativo exige activação explícita. As receitas e o inventário não comprovam instalação actual nem homologação das versões publicadas. Nesta recuperação não se executam instaladores, wrappers de serviço ou credenciais; `npm test` valida skills e contratos com fixtures. Ver [skills recuperadas e runtimes opcionais](RESTORED-SKILLS.md).
