# Auditoria consolidada e rastreabilidade do código

Base: commit `94c4c2e054ad364f167d3a6a9aa61bd719ce70f7`. As linhas referem-se a essa versão. Esta auditoria registra o estado anterior à implementação; consulte PROGRESSO.md para as entregas posteriores.

## 1. Escopo real da revisão

Foram revisados os fluxos do backend, busca/coleta, geração, frontend web/PWA, leitor, quatro atalhos, histórico, importação/exportação, configuração de implantação e código dos clientes mobile. A revisão conecta blocos e chamadas; não trata uma linha isolada como garantia de funcionamento do produto.

As análises anteriores trouxeram execução de nove testes existentes, três erros estáticos F821, sondas locais com mocks e duas pesquisas reais pelo Gemini, seguidas de checagem HTTP das referências da primeira resposta. Esta rodada acrescentou leitura dos fluxos de ferramentas, acessibilidade/exportação/mobile e sondas locais novas, sem novas chamadas a modelos.

O inventário gerado nesta pasta lista arquivos rastreados, linhas e hashes para identificar a versão. **Inventariado não significa certificado.** Não fiz decompilação/auditoria do APK ou dos binários do Gradle, compilação Android/iOS, pentest de produção, teste de carga real nem matriz completa de navegadores/assistência. As limitações são tarefas explícitas de validação, e não resultados aprovados.

## 2. Mapa de leitura por componente

| Arquivo/bloco | Papel e decisão |
|---|---|
| `backend/main.py:1–64` | Imports/configuração/CORS/modelos; corrigir símbolos, validar enums/payload e separar privilégios |
| `backend/main.py:66–196` | Exportador DOCX; mover para módulo e renderizar estrutura, com Unicode/links/tabelas testados |
| `backend/main.py:199–246` | Chat, exportação e versículos; adaptar contratos e erros sem regressão |
| `backend/main.py:249–383` | Seleção de provedor/fallback; substituir caminhos duplicados por política de orçamento/credenciais |
| `backend/main.py:386–486` | Search/read/config/diagnostics; fechar URLs livres, configuração pública e diagnóstico falso |
| `backend/main.py:488–509` | StaticFiles/start; build/versão/health e implantação observável |
| `backend/rag_engine.py:9–140` | Palavras-chave, busca HTML e seleção de resultados; reformulação sem perda do assunto e extração robusta |
| `backend/rag_engine.py:142–182` | Cache e download paralelo; limites globais/TTL e passagens relevantes |
| `backend/rag_engine.py:184–258` | Contexto/histórico/prompt; fontes obrigatórias para afirmações documentais |
| `backend/rag_engine.py:260–348` | Endpoint/modelos/retries/saída; registry, orçamento, resultado estruturado e modelo real |
| `backend/scraper.py:13–83` | Credenciais/configuração; evitar estado global mutável e escrita de .env pelo usuário público |
| `backend/scraper.py:88–200` | HTTP, redirects e metadados heurísticos; validação de rede e título original |
| `backend/scraper.py:203–268` | Autolinker; substituir associação aproximada por IDs de citações |
| `backend/scraper.py:275–501` | Gemini + prefetch + fallback + fontes; preservar suporte/uso/modelo e validar conteúdo |
| `backend/scraper.py:503–616` | Leitor e heurística de substituição; sanitização, URL base real e navegação consistente |
| `backend/scraper.py:621–762` | Livros/parser/extrator; referências estruturadas, edição e erro explícito |
| `web/app.js:5–227` | Estado inicial, provider e escopo; seleções ligadas à execução/revisão |
| `web/app.js:232–386` | Quatro prompts e busca; ações tipadas, idempotência, cancelamento e estado por conversa |
| `web/app.js:393–620` | Markdown e cards; parser/DOM seguro, sem fontes herdadas ou cabeçalhos de origem presumidos |
| `web/app.js:626–841` | Versículos/tooltips/listeners; teclado, erros e identidade estável de referências |
| `web/app.js:847–1055` | Exports/imports/histórico; schema, isolamento, quota e exportação por material |
| `web/app.js:1076–1213` | Leitor/reset/saída; cancelar leituras antigas e preservar trabalho em andamento |
| `web/app.js:1222–1497` | Configurações/diagnóstico; provedor correto, remoção de chave e estado medido |
| `web/app.js:1503–1603` | Instalação PWA; atualização/testes reais por dispositivo e estado de instalação |
| `web/index.html:1–103` | CDNs e CSS de impressão; assets versionados e citações visíveis em PDF |
| `web/index.html:107–593` | Interface, prompts, formulários e painéis; manter ações e acrescentar semântica/acessibilidade |
| `web/index.html:594–665` | Tooltip, instalação e scripts; fonte de verdade única para cache/versão |
| `web/service-worker.js`, `manifest.json` | Cache/rede/install; preservar assets bons e explicar offline por recurso |
| Android `SearchApiClient.kt` | Motor independente; risco no cabeçalho de chave e divergência de timeout/recursos |
| Android `MainScreenViewModel.kt`, telas/navegação | Estado, leitura e UI; cancelar corretamente, tratar configuração backend e testar paridade |
| Android Gradle/manifests/resources/testes | Toolchain e configuração; build e dispositivos ainda pendentes; testes limitados de estado |
| iOS `SearchClient.swift`, `ContentView.swift` | Bindings/closures incompletos, chave persistida e leitor com HTML cru; não pronto para declarar compilável |
| Scripts, Dockerfile, Procfile, render.yaml, README | Empacotamento, runtime, secrets e documentação precisam corresponder à entrega real |
| Gerador de ícones/resources | Artefatos auxiliares; validar paths/dependências no pipeline de assets, fora do núcleo de pesquisa |

## 3. Achados priorizados

“Reproduzido” indica teste local ou execução registrada. “Estático” indica caminho identificado no código sem ensaio completo da consequência no dispositivo/produção. “Lacuna” indica requisito ausente, não defeito de sintaxe.

| ID | Prioridade | Evidência / achado | Tipo | Backlog |
|---|---|---|---|---|
| A01 | P0 | `main.py:270,310` + `rag_engine.py:263–288`: URL do cliente combinada com chave do servidor | Reproduzido com chave fictícia/mock | JW-003 |
| A02 | P0 | `main.py:417–425`: leitor aceita endereço arbitrário, incluindo loopback | Reproduzido sem acesso interno real | JW-004 |
| A03 | P0 | `scraper.py:571–616` mantém atributos ativos; `app.js:1096` usa innerHTML | Reproduzido com HTML local | JW-005 |
| A04 | P0 | Importação só verifica turns; campos entram em HTML/atributos sem proteção consistente | Estático | JW-005,044 |
| A05 | P0 | Corrigir apenas o import de set_api_key reativaria mutação global/escrita destrutiva de .env | Estático | JW-006 |
| A06 | P0 | API pública consome chaves sem cotas/limites de aplicação; CORS não autentica | Estático | JW-007 |
| A07 | P0 | Android `SearchApiClient.kt:19–29` anexa X-Gemini-Api-Key a qualquer GET, também usado no leitor | Estático; não afirma conteúdo do APK | JW-008 |
| A08 | P0 | `app.js:296` corta em 90 s; cadeias têm múltiplas tentativas sem deadline comum | Código e sondas anteriores | JW-022,025 |
| A09 | P0 | `main.py:434,448,483`: três nomes indefinidos | Ruff + TestClient | JW-009 |
| A10 | P0 | Coleta direta vazia nas duas perguntas; corte de palavras-chave remove dívida/dinheiro | Execução real | JW-012 |
| A11 | P0 | Primeira resposta real: 6 URLs bíblicas 404 e 5 publicações em URLs com títulos diferentes | HTTP e títulos registrados | JW-013,015,017 |
| A12 | P0 | `scraper.py:694–716`: listas truncadas, intervalo entre capítulos errado, intervalo invertido aceito | Novas sondas locais | JW-015 |
| A13 | P0 | `scraper.py:737–748`: números em texto corrido; fallback mostra início do capítulo como verso | Estático | JW-015 |
| A14 | P1 | `main.py:368`: 503 não aciona fallback; `:429` converte 404 em 500 | Reproduzido | JW-010,022 |
| A15 | P1 | `scraper.py:496–501`: erro de pós-processamento pode virar ai_response comum | Estático | JW-010,016 |
| A16 | P1 | `app.js:1433`: ausência de latência vira 120 ms verde; teste aceita diagnóstico WOL quebrado | Código + testes existentes | JW-009,048 |
| A17 | P1 | `rag_engine.py:215–216`: sem documentos, prompt instrui usar memória | Estático | JW-016 |
| A18 | P1 | `scraper.py:253–257`: autolinker associa fonte por uma palavra; leitor pode substituir artigo | Estático | JW-013,016 |
| A19 | P1 | `app.js:339–341`: sem fonte nova, reapresenta fontes antigas | Estático | JW-016,027 |
| A20 | P1 | Domínio por substring e cards externos filtrados sem assegurar todo o texto da resposta | Estático | JW-018 |
| A21 | P1 | `ChatMessage.role` livre; RAG encaminha segundo role=system fornecido pelo cliente | Nova sonda com mock | JW-019 |
| A22 | P1 | `rag_engine.py:156–157`: só começo dos artigos; contexto relevante pode ficar fora | Estático | JW-014 |
| A23 | P1 | `scraper.py:193–194`: título Feliz vira Féliz; Felipe vira Félipe | Nova sonda local | JW-013 |
| A24 | P1 | Deduplicação remove query/fragmento; buscas e passagens distintas podem colapsar | Estático | JW-013,015 |
| A25 | P1 | Caches ilimitados/sem TTL e chaves incompletas para parâmetros/idioma | Estático | JW-020 |
| A26 | P1 | Histórico inteiro e uso da primeira pergunta em continuação curta | Estático | JW-028 |
| A27 | P1 | `app.js:304–310`: parâmetros Hy3 enviados para DeepSeek | Estático | JW-030 |
| A28 | P1 | Remover chave Gemini não apaga alias legado usado na busca | Estático | JW-008 |
| A29 | P1 | Requisições não pertencem a uma conversa fixa; regeneração não ramifica descendentes | Estático | JW-029 |
| A30 | P1 | Quatro ferramentas são prompts genéricos, sem seleção/agenda/tempo/proveniência próprios | Código + extração local | JW-032 a 041 |
| A31 | P1 | `get_clean_document` trata / antes de // e usa host fixo em relativos | Reproduzido para imagem | JW-042 |
| A32 | P1 | Resposta antiga do leitor pode substituir clique novo | Estático | JW-042 |
| A33 | P1 | `main.py:232`: título de exportação com emoji falha em header Latin-1 | Nova sonda HTTP 500 | JW-043 |
| A34 | P1 | `index.html:89` oculta todos os buttons na impressão, incluindo rótulo das citações renderizadas | Estático; impressão real pendente | JW-043 |
| A35 | P1 | Parsers de tabela dividem todo pipe; títulos/links com pipe quebram células | Estático | JW-034,043 |
| A36 | P1 | Quota de localStorage pode impedir render após sucesso; histórico sem migração/versão | Estático | JW-044,045 |
| A37 | P1 | Diálogos sem semântica/modal e referências span sem foco de teclado | HTML/JS; teste assistivo pendente | JW-046 |
| A38 | P1 | Service worker cacheia sem checar status; URL do JS precache difere do HTML | Estático | JW-047 |
| A39 | P1 | Dependências sem lock; scripts exploratórios no conjunto test_* e ausência de CI | Estático | JW-002,048 |
| A40 | P1 | Script ZIP inclui diretórios inteiros, podendo levar backend/.env criado pela própria configuração | Estático; ZIP não gerado | JW-055 |
| A41 | P2 | Android input de servidor altera baseUrl, mas useLocalBackend permanece false no código rastreado | Estático | JW-061 |
| A42 | P2 | Android renderer não implementa tabela; fontes/imagens e estado não têm paridade com PWA | Estático | JW-061,063 |
| A43 | P2 | iOS tem argumentos/bindings ausentes, closure inválida e mostra HTML retornado em Text | Estático; sem compilação | JW-062 |
| A44 | P2 | Caminhos bíblicos r5/lp-t misturados com outros idiomas | Estático | JW-015,067 |
| A45 | P1 | Promessas de velocidade, gratuidade e disponibilidade sem medidas; motor real não retornado no Gemini | Estático | JW-022,031,053,055 |

P0 é bloqueador de exposição/qualidade central; P1 é necessário para a entrega planejada; P2 é melhoria/paridade posterior. A prioridade de um achado mobile não significa abandonar a correção imediata de segredo: JW-008 continua no primeiro marco.

## 4. Evidências novas desta rodada

`auditoria_planejamento.py` usa TestClient e mocks, sem chamadas a provedores, e grava `evidencias-adicionais.json`:

- DOCX com título `Estudo 📖`: HTTP 500 por codificação do header.
- `João 3:16, 18`: parser devolve apenas João 3:16.
- `João 3:16-4:2`: parser devolve intervalo 16–4 no capítulo 3.
- `João 3:99` e `João 3:18-16`: aceitos pelo parser sem validade estrutural suficiente.
- Títulos Feliz/Felipe alterados incorretamente.
- Histórico com role=system resulta em duas mensagens system no adaptador RAG simulado.
- Os quatro atalhos contêm somente frases genéricas de prompt.
- Nenhum role=dialog ou aria-modal=true no HTML atual; isso é evidência de lacuna semântica, não uma auditoria completa de acessibilidade.

## 5. Relação com os resultados anteriores

Arquivos na pasta superior: `ANALISE-JW-SEARCH.md`, `COMPARACAO-E-PROPOSTA-DE-PESQUISA.md` e `comparacao-resultados/` contêm as medições e respostas completas. Nove testes existentes passaram, mas o diagnóstico não estava saudável; isso demonstra insuficiência da assertiva, não que todos os testes sejam inúteis.

A comparação real usou o Gemini configurado e dois turnos. Não foi repetida nesta rodada para simular certeza estatística nem para consumir cota sem necessidade. O novo backlog exige um benchmark mais amplo e revisão humana de fontes.

## 6. O que preservar da base

FastAPI, contratos simples, coleta paralela já existente, leitura integrada, histórico e variedade de exportações são reaproveitáveis. O problema central não é o editor ou o modelo usados para escrever o código. É a distância entre promessas de produto, contratos explícitos e verificações efetivas.

Recomendo refatoração por fronteiras e testes, não substituição integral. A primeira entrega deve conseguir demonstrar a correção das falhas críticas; a segunda deve provar que as ferramentas continuam úteis com as fontes corretas.
