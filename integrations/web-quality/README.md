# Web Quality & SEO — incluídas no DevOps Skills

Seis skills adaptadas de [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills), sob MIT. Para sites públicos, páginas de produtos Hi-Fi, campanhas/landing pages e interfaces web — sem confundir qualidade técnica com resultados comerciais.

## Seleção e completude real

| Skill registada | Cobre | O que continua externo/manual |
|---|---|---|
| `web-quality-audit` | Triage integrado por categoria e relatório de evidências | Browser/relatórios reais e validação de jornadas |
| `web-performance` | Campo vs laboratório, loading/runtime/rede e comparação | Lighthouse/DevTools/RUM/CrUX autorizados |
| `core-web-vitals` | LCP, INP, CLS e diagnóstico por métrica | Evidência medida; INP exige interações representativas |
| `web-accessibility` | Verificações automatizadas e manuais WCAG | Teclado, tecnologias assistivas e avaliação humana |
| `web-seo` | SEO técnico/on-page, produtos, dados estruturados e internacionalização | Search Console, elegibilidade/indexação e resultados reais |
| `web-best-practices` | Higiene de browser, compatibilidade e sinais de segurança | Testes de runtime e auditoria de segurança própria |

As seis referências originais e os respetivos documentos de apoio estão preservados no snapshot, incluindo o analisador HTML estático. Entrypoints locais explicitam os limites e corrigem a interpretação de exemplos. **Completude documental não significa auditoria automática, conformidade certificada ou ranking garantido.**

Não é um pacote completo de marketing: não cobre gestão de anúncios, CRM/email automation, orçamento/media buying, estratégia comercial integral ou atribuição de conversões. Não instala analytics nem recolhe dados de clientes.

## Ativar

```bash
pi install /caminho/absoluto/devops-skills
```

No Pi:

```text
/reload
/skill:web-seo Rever SEO técnico das páginas de produtos a partir destes ficheiros; sem alterar robots/canonical nem publicar.
/skill:web-quality-audit Avaliar esta landing page com o relatório Lighthouse fornecido; separar medições e hipóteses.
/skill:core-web-vitals Analisar estes dados de LCP, INP e CLS, sem inventar valores em falta.
```

As seis skills são carregadas pelo manifesto principal, dentro dos **112 especialistas**. Regista apenas a raiz do repositório; evita outra cópia com nomes iguais. Para instalações antigas, segue a [migração](../../docs/UNIFIED-PACKAGE.md). Os nomes genéricos upstream foram adaptados para `web-performance`, `web-accessibility`, `web-seo` e `web-best-practices`.

## Ferramentas e privacidade

Ler as skills não requer instalação adicional. Usar relatórios fornecidos, ficheiros locais ou ferramentas já aprovadas. Live audits precisam de URL/estado autorizados e de browser/CLI compatível; nunca instalar MCP, Lighthouse ou browsers automaticamente.

- Não usar a sessão pessoal do utilizador sem pedido explícito; respeitar permissões do anfitrião.
- Não recarregar formulários não guardados nem executar compras, submissões ou ações irreversíveis para medir INP.
- PSI/CrUX e outros serviços recebem a URL/dados enviados. Não enviar páginas privadas, tokens, cookies ou relatórios não redigidos sem aprovação específica.
- Páginas locais/privadas podem não ter CrUX; isso significa indisponível, não aprovado.
- RUM, analytics e tags exigem consentimento/política e aprovação própria. Snippets são exemplos, não autorização de recolha.

Antes de seguir uma referência upstream, ler [evidence-and-safety.md](references/evidence-and-safety.md). As referências não são regras universais: não aplicar noindex/canonicals/headers ou marcação de reviews por copiar um exemplo.

## Smoke test estático opcional

Só para HTML local de confiança, pequeno e sem segredos, com Bash, grep, find e **jq** já instalados:

```bash
bash /caminho/absoluto/devops-skills/integrations/web-quality/upstream/skills/web-quality-audit/scripts/analyze.sh /caminho/fixture.html
```

Não instalar jq por iniciativa da skill. É um analisador por padrões, não parser HTML/browser ou scanner de segurança: pode omitir ou sinalizar atributos por capitalização, aspas, espaços e marcação multilinha. Pode expor caminhos em diagnósticos, não tem limite global de corpus/memória e `success: true` significa que o processo terminou, não que o site passou. Executar com timeout num corpus pequeno previamente aprovado; não percorrer workspaces inteiros. Não gera métricas CWV, certificação WCAG ou previsão de SEO.

## Verificar e desativar

Da raiz do pack:

```bash
node --test tests/addy-integrations.test.mjs
```

Os testes verificam empacotamento, referências, hashes e o analisador sobre HTML sintético quando ferramentas existem. Não executam auditorias de sites reais nem demonstram resultados de SEO/performance/acessibilidade.

Para desativar apenas recursos específicos, usa `pi config` no pacote principal e recarrega o Pi; preserva relatórios autorizados segundo a retenção acordada. Licença e origem: [LICENSE](LICENSE), [UPSTREAM.json](UPSTREAM.json), [SHA256SUMS](SHA256SUMS). Não é integração oficial.

## English summary

Six MIT-licensed web-quality/technical-SEO entrypoints included by the root package with complete selected source references and an optional static HTML smoke test. Measurement tools, human accessibility testing and search validation remain external. No automatic browser/MCP installs, live audits, analytics, publication or ranking guarantees. Not a full marketing/advertising platform.
