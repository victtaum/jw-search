# Backlog completo do JW Search

68 itens propostos. Nenhum representa implementação concluída. Pontos são relativos; não são horas. CSV em UTF-8 com BOM e separador ponto e vírgula; JSON mantém a estrutura completa.

Prioridades: P0 bloqueia segurança/confiabilidade central; P1 é necessário para a entrega planejada; P2 é melhoria/paridade; P3 depende de evidência de valor. As dependências formam um grafo sem ciclos.

| Marco | Itens | Pontos relativos |
|---|---:|---:|
| M0 — Fundação segura | 10 | 34 |
| M1 — Pesquisa verificável | 11 | 47 |
| M2 — Execução confiável | 10 | 43 |
| M3 — Quatro ferramentas | 10 | 42 |
| M4 — Qualidade e compatibilidade | 14 | 60 |
| M5 — Lançamento e operação | 5 | 16 |
| Futuro — Expansão condicionada ao uso | 8 | 50 |

## M0 — Fundação segura

### JW-001 — Fixar baseline e contrato de preservação

**P0 · 3 pontos relativos · Engenharia/QA · Planejado**

Inventário do commit, fixtures e lista de funcionalidades que não podem desaparecer.

**Critérios de aceitação:**

- Registrar contratos e exemplos atuais de pesquisa, quatro ferramentas, leitor, histórico, importação e quatro exportações.
- Separar conteúdo legado não validado de evidência verificada; guardar fixtures sem chaves.

**Dependências:** Nenhuma.
**Origem/evidência:** 94c4c2e; análises anteriores e evidencias-adicionais.json.

### JW-002 — Build reproduzível e CI mínimo

**P0 · 3 pontos relativos · Engenharia/DevOps · Planejado**

Runtime definido, dependências travadas e pipeline de lint/testes isolados.

**Critérios de aceitação:**

- Clone limpo instala e roda testes sem credenciais nem rede por padrão.
- Falhar CI por nomes indefinidos, segredo em fixture e quebra do contrato; separar testes externos opt-in.

**Dependências:** JW-001.
**Origem/evidência:** requirements.txt; 3 F821; test_ddg_only.py importa função ausente.

### JW-003 — Vincular credencial ao destino autorizado

**P0 · 3 pontos relativos · Backend · Planejado**

Registro de provedores no servidor; URL do cliente nunca recebe chave do servidor.

**Critérios de aceitação:**

- Requisições com base_url arbitrária são rejeitadas antes da chamada.
- Chave DeepSeek não é enviada ao endpoint Hy3; fallback mantém política de credenciais e custos.

**Dependências:** JW-001.
**Origem/evidência:** main.py:270,310; rag_engine.py:263-288; reprodução anterior.

### JW-004 — Proteger leitor e downloads contra SSRF

**P0 · 5 pontos relativos · Backend · Planejado**

Política única de rede com hosts, protocolo, portas, redirecionamentos, tamanho e prazo permitidos.

**Critérios de aceitação:**

- Bloquear loopback, redes privadas, metadados, userinfo e host disfarçado em URL.
- Validar cada redirecionamento e resolução; fonte externa só usa caminho explicitamente autorizado.

**Dependências:** JW-003.
**Origem/evidência:** main.py:417-425; scraper.py:104-111.

### JW-005 — Sanitizar HTML, Markdown e importações

**P0 · 5 pontos relativos · Frontend/Backend · Planejado**

Renderização segura por contexto, esquema de importação e política de conteúdo.

**Critérios de aceitação:**

- Fixtures com onerror, javascript:, atributos quebrados, SVG e JSON malicioso não executam código.
- Manter texto, tabelas e links válidos no leitor e na exportação; CSP compatível com assets versionados.

**Dependências:** JW-001.
**Origem/evidência:** scraper.py:571-616; app.js:485-501,534,581,935,1096.

### JW-006 — Retirar configuração global da API pública

**P0 · 2 pontos relativos · Backend · Planejado**

Configuração administrativa separada; nenhuma escrita pública em .env.

**Critérios de aceitação:**

- POST público não muda credenciais de outros usuários.
- Configuração administrativa não sobrescreve variáveis existentes; teste não depende de corrigir só o import faltante.

**Dependências:** JW-003.
**Origem/evidência:** main.py:481; scraper.py:44-60.

### JW-007 — Definir acesso, cotas e limites de entrada

**P0 · 5 pontos relativos · Backend/Produto · Planejado**

Política explícita para uso local, beta restrito e hospedagem pública.

**Critérios de aceitação:**

- Limitar tamanho de query, histórico, exportação e concorrência; retornar erro tipado.
- Estabelecer sessão/capacidade de acesso e limite de uso da chave compartilhada; CORS não é tratado como autenticação.

**Dependências:** JW-001, JW-003.
**Origem/evidência:** ChatRequest e rotas sem limites de aplicação.

### JW-008 — Isolar, remover e não exportar segredos

**P0 · 3 pontos relativos · Frontend/Mobile · Planejado**

Credenciais por provedor; remoção completa; Android não anexa chave ao leitor.

**Critérios de aceitação:**

- Apagar Gemini remove ambas as chaves legadas no navegador.
- Android só envia segredo ao provedor autorizado; logs, backups e exportações não contêm chaves; revisar armazenamento mobile.

**Dependências:** JW-003, JW-006.
**Origem/evidência:** app.js:1341-1345; SearchApiClient.kt:19-29; UserDefaults/SharedPreferences.

### JW-009 — Corrigir configuração e diagnóstico

**P0 · 2 pontos relativos · Backend/Frontend · Planejado**

Health check leve e diagnóstico que diferencia configurado, testado e indisponível.

**Critérios de aceitação:**

- GET config não retorna NameError; diagnóstico WOL realmente chama a busca.
- Latência ausente mostra não medida, nunca 120 ms fictícios; falha WOL não vira indicador verde.

**Dependências:** JW-002, JW-006.
**Origem/evidência:** main.py:434,448; app.js:1433.

### JW-010 — Padronizar erros e preservar status HTTP

**P0 · 3 pontos relativos · Backend · Planejado**

Erros tipados para timeout, autenticação, cota, modelo inexistente e fonte ausente.

**Critérios de aceitação:**

- 404 do leitor continua 404 e falha de pós-processamento não vira resposta de estudo HTTP 200.
- 503 entra na política de recuperação; mensagens não atribuem reinício sem evidência.

**Dependências:** JW-002, JW-009.
**Origem/evidência:** main.py:368,427-430; scraper.py:496-501; app.js:363.


## M1 — Pesquisa verificável

### JW-011 — Criar contrato versionado de pesquisa e evidências

**P0 · 5 pontos relativos · Backend/IA · Planejado**

ResearchRun, Source, Passage, Claim e Citation com IDs e proveniência.

**Critérios de aceitação:**

- Afirmação documental referencia trecho e documento existentes.
- Versionar schema e permitir compatibilidade temporária com ai_response/results; separar inferência de fonte.

**Dependências:** JW-001, JW-005, JW-007.
**Origem/evidência:** Ausência atual de IDs de trechos e metadados de suporte.

### JW-012 — Reformular perguntas preservando o assunto

**P0 · 3 pontos relativos · IA/Backend · Planejado**

Consultas temáticas para perguntas longas e continuações, sem corte cego das quatro primeiras palavras.

**Critérios de aceitação:**

- As duas perguntas sobre dívida produzem consultas contendo o assunto, inclusive com erros de digitação.
- Pedido de formato não substitui o tema nem dispara pesquisa por palavras como tabela/família.

**Dependências:** JW-011.
**Origem/evidência:** rag_engine.py:9-23,203-208; consultas-dirigidas.json.

### JW-013 — Resolver documentos e metadados canônicos

**P0 · 5 pontos relativos · Backend · Planejado**

Remissões, índices e redirects viram documentos identificados sem troca silenciosa.

**Critérios de aceitação:**

- URL com HTTP 200 e título divergente é rejeitada como referência daquele artigo.
- Distinguir documento e parágrafo; não colapsar buscas diferentes removendo query; preservar títulos originais.

**Dependências:** JW-004, JW-011.
**Origem/evidência:** scraper.py:448,463,551-567; títulos Feliz/Felipe alterados.

### JW-014 — Extrair parágrafos e selecionar por relevância

**P1 · 5 pontos relativos · Backend/IA · Planejado**

Contexto com passagens relevantes e vizinhas, inclusive no final dos artigos.

**Critérios de aceitação:**

- Fixture com resposta após 3.500 caracteres é recuperada.
- Excluir menus e desafios antibot; diferenciar vazio, bloqueado e erro; limitar bytes sem afirmar leitura integral truncada.

**Dependências:** JW-011, JW-013.
**Origem/evidência:** rag_engine.py:146-179; scraper.py get_clean_document.

### JW-015 — Resolver referências e versículos estruturalmente

**P0 · 5 pontos relativos · Backend/QA · Planejado**

Referências normalizadas, edição/idioma e trechos fiéis aos marcadores do documento.

**Critérios de aceitação:**

- Cobrir versículos isolados, listas, intervalos, capítulos cruzados e livros com número.
- Rejeitar intervalo invertido/versículo inexistente; nunca substituir por 450 caracteres do começo do capítulo.

**Dependências:** JW-011, JW-013.
**Origem/evidência:** scraper.py:694-758; evidencias-adicionais.json.

### JW-016 — Gerar respostas vinculadas às evidências

**P0 · 5 pontos relativos · IA/Backend · Planejado**

Síntese com IDs de citações; links e bibliografia resolvidos pelo código.

**Critérios de aceitação:**

- Modelo não determina IDs de documento/URL livremente.
- Diferenciar texto bíblico, explicação da publicação e aplicação sugerida; ausência de fonte permanece explícita.

**Dependências:** JW-011, JW-014, JW-015.
**Origem/evidência:** RAG sem contexto usa memória; autolinker escolhe por uma palavra.

### JW-017 — Validar citações antes de publicar resposta

**P0 · 5 pontos relativos · Backend/QA · Planejado**

Validação estrutural, literal e de correspondência de fonte, com revisão semântica amostral.

**Critérios de aceitação:**

- Os 11 links defeituosos do ensaio anterior não passam como citações válidas.
- Link existente não basta; verificar título/localização e citação literal; sinalizar suporte incompleto sem percentual inventado.

**Dependências:** JW-013, JW-015, JW-016.
**Origem/evidência:** verificacao-links-1.json.

### JW-018 — Aplicar escopo de fontes por execução

**P1 · 3 pontos relativos · Backend/IA · Planejado**

Escopo oficial/external explícito e imutável na pesquisa e seus materiais.

**Critérios de aceitação:**

- Modo aprofundado não habilita fonte externa.
- Host é validado por hostname; referências externas ficam identificadas; trocar provedor não ignora escopo.

**Dependências:** JW-004, JW-011, JW-016.
**Origem/evidência:** scraper.py:468; include_external ignorado no RAG.

### JW-019 — Separar instruções de dados e papéis do cliente

**P1 · 3 pontos relativos · Backend/IA · Planejado**

Histórico aceita papéis apropriados; documentos e importações não redefinem política.

**Critérios de aceitação:**

- Histórico fornecido com role=system é rejeitado.
- Documento contendo instruções para ignorar fontes não muda allowlist nem formato; validadores continuam determinísticos.

**Dependências:** JW-005, JW-011, JW-016.
**Origem/evidência:** ChatMessage.role str; rag_engine.py:301; system_messages=2 em teste.

### JW-020 — Cache limitado e atualização das fontes

**P1 · 3 pontos relativos · Backend · Planejado**

TTL, tamanho, idioma/edição e hash de conteúdo, com separação entre cache público e dados privados.

**Critérios de aceitação:**

- Evitar colisão por trecho/tamanho e mistura entre usuários.
- Fonte alterada cria nova versão; material salvo mantém proveniência sem mudar silenciosamente.

**Dependências:** JW-011, JW-013, JW-014.
**Origem/evidência:** _article_cache e _verse_cache sem limites.

### JW-021 — Perfis sintetizado e aprofundado com mesma precisão

**P1 · 5 pontos relativos · IA/Produto · Planejado**

Configurações versionadas de cobertura e saída, não de tolerância a referências erradas.

**Critérios de aceitação:**

- Ambos exigem fontes válidas; sintetizado entrega pontos essenciais.
- Aprofundado decompõe subtemas e respeita limites; resumo pode ser produzido de uma pesquisa profunda sem nova coleta.

**Dependências:** JW-012, JW-016, JW-017, JW-018.
**Origem/evidência:** COMPARACAO-E-PROPOSTA-DE-PESQUISA.md.


## M2 — Execução confiável

### JW-022 — Orquestrar orçamento global e modelos válidos

**P0 · 5 pontos relativos · Backend · Planejado**

Deadline monotônico, limite de tokens/custo/tentativas e registro de capacidades de provedores.

**Critérios de aceitação:**

- Nenhuma nova tentativa começa sem orçamento restante; testar 401,404,429,503 e timeout.
- Modelo usado e motivo do fallback são registrados; não trocar silenciosamente para modelo pago fora da política.

**Dependências:** JW-003, JW-010, JW-020, JW-021.
**Origem/evidência:** 15s × retries × modelos; Gemini seis chamadas possíveis.

### JW-023 — Persistir tarefas e resultados recuperáveis

**P1 · 8 pontos relativos · Backend/DevOps · Planejado**

Fila/worker com estado durável, lease e checkpoint; API retorna identificador.

**Critérios de aceitação:**

- Reinício não perde resultado concluído; tarefa abandonada termina ou retoma por política definida.
- POST idempotente não cria trabalhos duplicados; custo externo de chamada já enviada não tem garantia de exatamente uma execução.

**Dependências:** JW-007, JW-011, JW-022.
**Origem/evidência:** Necessário para pesquisa longa; não basta BackgroundTasks em memória.

### JW-024 — Autorizar acesso a cada pesquisa e material

**P0 · 3 pontos relativos · Backend · Planejado**

Sessão/conta ou capacidade opaca vinculada ao dono, verificada em todas as rotas.

**Critérios de aceitação:**

- Usuário B não lê, cancela nem exporta pesquisa de A por adivinhar ID.
- Definir expiração e exclusão; payload da fila não contém segredo em texto puro.

**Dependências:** JW-007, JW-008, JW-023.
**Origem/evidência:** Novo estado persistente requer isolamento antes de exposição pública.

### JW-025 — Cancelamento e concorrência limitados

**P1 · 5 pontos relativos · Backend · Planejado**

Cancelamento cooperativo nos transportes e limites globais/por usuário/provedor.

**Critérios de aceitação:**

- Cancelar interrompe novas coletas e tentativas; trabalho síncrono remanescente é limitado e sinalizado.
- Simular timeout e desconexão sem multiplicar pools ou deixar tarefas indefinidas.

**Dependências:** JW-022, JW-023, JW-024.
**Origem/evidência:** Rotas def e pools por requisição; abort do navegador não encerra tudo.

### JW-026 — Progresso real e reconexão

**P1 · 3 pontos relativos · Frontend/Backend · Planejado**

Eventos ou polling autenticado com sequência e estados explícitos.

**Critérios de aceitação:**

- Mostrar etapas observadas, lacunas e resultado parcial sem percentual fictício.
- Reabrir página recupera estado/resultado; reconectar não reenvia a pesquisa.

**Dependências:** JW-023, JW-024, JW-025.
**Origem/evidência:** app.js:270-279 simula estágios por relógio.

### JW-027 — Snapshots de pesquisa e revisões imutáveis

**P1 · 5 pontos relativos · Backend · Planejado**

Versões de evidências e respostas como base estável dos derivados.

**Critérios de aceitação:**

- Material guarda research_id e revision_id.
- Atualizar pesquisa não reescreve tabela/esboço editado; oferecer nova versão e comparação.

**Dependências:** JW-011, JW-017, JW-023, JW-024.
**Origem/evidência:** Estado atual é array de turnos sem proveniência versionada.

### JW-028 — Gerir histórico e aprofundar lacunas

**P1 · 3 pontos relativos · IA/Backend · Planejado**

Janela/resumo com orçamento e recuperação de referências por ID.

**Critérios de aceitação:**

- Continuação usa assunto atual e lacunas, não sempre a primeira pergunta.
- Resumo preserva referências e instruções do usuário; não conserva como fato fonte antes invalidada.

**Dependências:** JW-012, JW-021, JW-027.
**Origem/evidência:** app.js:286-291; rag_engine.py:203-208.

### JW-029 — Isolar conversas, concorrência e regenerações

**P1 · 5 pontos relativos · Frontend · Planejado**

Estado de requisição por conversa e revisão; ramificar quando alterar histórico.

**Critérios de aceitação:**

- Resultado atrasado nunca entra na conversa trocada/importada.
- Duplo envio é controlado; regenerar não deixa descendentes aparentando depender da versão nova.

**Dependências:** JW-026, JW-027, JW-028.
**Origem/evidência:** app.js:247-370,348,1040,1140.

### JW-030 — Configuração por provedor e modo

**P1 · 3 pontos relativos · Frontend/Backend · Planejado**

Seleções coerentes de modelo, credencial, modo e capacidades.

**Critérios de aceitação:**

- DeepSeek não recebe modelo/base Hy3; histórico restaura opções de modo/escopo.
- Identificar provedor real usado e separar serviço local do remoto, inclusive Ollama.

**Dependências:** JW-003, JW-008, JW-021, JW-022.
**Origem/evidência:** app.js:304-310,1040,1238.

### JW-031 — Instrumentar tempo, qualidade e consumo

**P1 · 3 pontos relativos · Backend/DevOps · Planejado**

Request/research IDs, tempos por fase e contadores por tentativa, sem conteúdo privado por padrão.

**Critérios de aceitação:**

- Distinguir coleta, filas, geração e verificação.
- Registrar tokens/custo quando o provedor informa; marcar desconhecido quando faltar; redigir segredos em erros.

**Dependências:** JW-009, JW-022, JW-023.
**Origem/evidência:** Diagnóstico atual não explica causas de lentidão.


## M3 — Quatro ferramentas

### JW-032 — Contrato comum das quatro ferramentas

**P1 · 5 pontos relativos · Backend/Frontend · Planejado**

Ações tipadas sobre uma pesquisa/revisão e itens selecionados, mantendo os quatro acessos.

**Critérios de aceitação:**

- Cada clique identifica ferramenta, base e opções; não é só uma frase no chat.
- Sem evidência suficiente, pedir seleção ou oferecer busca complementar explícita; preservar pesquisa original.

**Dependências:** JW-016, JW-024, JW-027, JW-029.
**Origem/evidência:** index.html:273-283; app.js:232-239.

### JW-033 — Comparar os textos selecionados da consulta

**P1 · 5 pontos relativos · IA/Frontend · Planejado**

Tabela com referência, contexto, ponto central, relações, aplicação e fonte por linha/célula.

**Critérios de aceitação:**

- Todas as linhas correspondem à seleção e citam evidência correta.
- Não incluir novos textos silenciosamente; distinguir semelhança, diferença contextual e ausência de informação.

**Dependências:** JW-015, JW-017, JW-032.
**Origem/evidência:** Requisito explícito do usuário.

### JW-034 — Personalizar e exportar tabela

**P2 · 3 pontos relativos · Frontend · Planejado**

Seleção de colunas, ordenação, visualização móvel em cards e exportação tabular.

**Critérios de aceitação:**

- Célula com barra vertical, link ou quebra de linha não desloca colunas.
- CSV e DOCX preservam referências; exportação só da tabela não leva conversa privada completa.

**Dependências:** JW-033.
**Origem/evidência:** Parsers split("|") atuais; tabelas sem estrutura de dados.

### JW-035 — Configurar participantes e objetivo do estudo

**P1 · 3 pontos relativos · Produto/Frontend · Planejado**

Perfis opcionais por faixas etárias/necessidades, duração e objetivo; sem nomes obrigatórios.

**Critérios de aceitação:**

- Permitir crianças de diferentes idades, adolescentes, adultos, casal/marido/mulher e idosos.
- Suportar grupo misto e pessoa sozinha; nenhum papel ou limitação é presumido só por sexo/idade.

**Dependências:** JW-032.
**Origem/evidência:** Requisito explícito do usuário.

### JW-036 — Gerar roteiro familiar adaptável

**P1 · 5 pontos relativos · IA/Frontend · Planejado**

Abertura, leituras, perguntas, atividade, aplicação e recapitulação com opções por participante.

**Critérios de aceitação:**

- Perguntas e respostas sugeridas remetem às fontes; atividade autoral é identificada.
- Adaptar linguagem, abstração, tamanho do bloco e participação; variantes não somam todas ao tempo principal.

**Dependências:** JW-015, JW-017, JW-035.
**Origem/evidência:** Atalho atual só pede resumo em tópicos.

### JW-037 — Organizar e ampliar textos com contexto

**P1 · 5 pontos relativos · IA/Frontend · Planejado**

Separar textos já usados de complementares, com motivo da relação e consulta ao contexto.

**Critérios de aceitação:**

- Complementar só entra após leitura/validação e recebe nova proveniência.
- Listas/intervalos mantêm todos os versos e edição; referência abre trecho correto; não confundir paráfrase com citação.

**Dependências:** JW-015, JW-017, JW-032.
**Origem/evidência:** Requisito explícito; parser atual perde versículos.

### JW-038 — Criar esboços nas sete durações

**P1 · 5 pontos relativos · IA/Frontend · Planejado**

Tema, objetivo, introdução, desenvolvimento, aplicação, conclusão, leituras e transições.

**Critérios de aceitação:**

- Aceitar 3,5,10,15,30,45,60 minutos e somar blocos em segundos exatamente ao alvo.
- Preservar fontes e instruções fornecidas; não apresentar esboço autoral como oficial.

**Dependências:** JW-015, JW-017, JW-032.
**Origem/evidência:** Requisito explícito do usuário.

### JW-039 — Estimar apresentação e ajustar duração

**P1 · 3 pontos relativos · Backend/Frontend · Planejado**

Tempo planejado separado de estimativa oral, com ritmo editável, leituras e pausas.

**Critérios de aceitação:**

- Recalcular ao editar e detectar excesso; leitura não é contada duas vezes.
- Encurtar preserva argumento/fontes centrais; ampliar acrescenta desenvolvimento relevante, não repetição.

**Dependências:** JW-038.
**Origem/evidência:** Sem orçamento temporal no código atual.

### JW-040 — Modo de apresentação e ensaio

**P2 · 3 pontos relativos · Frontend · Planejado**

Fonte ampliada, tempo por bloco, cronômetro opcional e notas do orador.

**Critérios de aceitação:**

- Funcionar por teclado/toque e salvar marcações localmente.
- Distinguir cronômetro real de estimativa; exportar versão de orador sem expor notas em versão pública por padrão.

**Dependências:** JW-038, JW-039.
**Origem/evidência:** Melhoria proposta para uso prático em discursos.

### JW-041 — Editar, salvar e regenerar derivados

**P1 · 5 pontos relativos · Frontend/Backend · Planejado**

Materiais independentes com configurações, revisão, notas e versões.

**Critérios de aceitação:**

- Editar não altera original; regenerar mostra nova versão sem apagar edição manual.
- Marcar citações afetadas pela edição como pendentes; exportar referência da versão usada.

**Dependências:** JW-027, JW-032, JW-033, JW-036, JW-037, JW-038.
**Origem/evidência:** Preservação das ferramentas com reutilização confiável.


## M4 — Qualidade e compatibilidade

### JW-042 — Leitor contextual e navegação entre fontes

**P1 · 5 pontos relativos · Frontend/Backend · Planejado**

Abrir passagem destacada, voltar ao ponto anterior e mostrar metadados reais.

**Critérios de aceitação:**

- Clique rápido em A/B não mistura título e conteúdo; navegação relativa resolve pelo documento real.
- Imagens HTTPS, srcset e referências funcionam; teclado e retorno de foco preservados.

**Dependências:** JW-004, JW-005, JW-013, JW-015, JW-017, JW-041.
**Origem/evidência:** scraper.py:577-614; app.js:1076-1096.

### JW-043 — Exportações fiéis por pesquisa e material

**P1 · 5 pontos relativos · Frontend/Backend · Planejado**

Markdown/JSON/DOCX/PDF preservam textos, fontes, tabelas e tempos.

**Critérios de aceitação:**

- Título com emoji não gera 500; DOCX possui links utilizáveis e hierarquia.
- Impressão não oculta rótulos de citação nem corta tabelas/esboços longos; opção para exportar só material selecionado.

**Dependências:** JW-005, JW-011, JW-034, JW-036, JW-037, JW-039, JW-041.
**Origem/evidência:** main.py:232; CSS print oculta button; evidência do emoji.

### JW-044 — Migrar estudos e formatos legados

**P1 · 5 pontos relativos · Backend/Frontend · Planejado**

Importação versionada, recuperação e exportação de backup antes da migração.

**Critérios de aceitação:**

- JSON antigo válido continua abrindo; MD é importado como texto sem status de fonte verificada.
- Dados inválidos são recusados com explicação; migração repetida é idempotente e reversível.

**Dependências:** JW-001, JW-005, JW-027, JW-041, JW-043.
**Origem/evidência:** Importer verifica apenas array turns.

### JW-045 — Armazenamento e exclusão previsíveis

**P1 · 3 pontos relativos · Frontend/Backend · Planejado**

Histórico robusto com tratamento de quota, retenção e controles de exclusão.

**Critérios de aceitação:**

- Falha de armazenamento não transforma geração bem-sucedida em erro de conexão.
- Definir excluir histórico, estudo ativo, materiais e cópias no servidor; perfis familiares não exigem dados pessoais.

**Dependências:** JW-024, JW-027, JW-035, JW-044.
**Origem/evidência:** localStorage limita conversas, não bytes; exclusão só remove cópia.

### JW-046 — Teclado, foco e leitura confortável

**P1 · 5 pontos relativos · Frontend/QA · Planejado**

Diálogos semânticos, foco gerido, contraste, zoom e referências operáveis.

**Critérios de aceitação:**

- Abrir/fechar modal mantém foco e Escape; controle não depende apenas de hover.
- Testar 320px, zoom 200%, leitor de tela e textos grandes; tabela tem cabeçalhos e alternativa móvel.

**Dependências:** JW-029, JW-033, JW-036, JW-038, JW-042.
**Origem/evidência:** HTML sem role=dialog/aria-modal; span bíblico não focalizável.

### JW-047 — Cache e atualização PWA seguros

**P1 · 3 pontos relativos · Frontend · Planejado**

Assets versionados, atualização coerente e limites claros de offline.

**Critérios de aceitação:**

- Não gravar erro HTTP sobre asset bom; precache corresponde à URL usada.
- Estudo salvo abre offline; novas pesquisas informam necessidade de rede; atualização preserva edição não salva.

**Dependências:** JW-002, JW-029, JW-044, JW-045.
**Origem/evidência:** SW v18; /app.js versus /app.js?v=2.18.0.

### JW-048 — Testar pesquisa, fontes e falhas deterministicamente

**P1 · 5 pontos relativos · QA/Backend · Planejado**

Fixtures de conteúdo e provedores simulados cobrindo os defeitos reais.

**Critérios de aceitação:**

- Testes cobrem 503, timeout, coleta vazia, referência falsa, idioma, orçamento e cancelamento.
- Health verde exige sucesso real; testes externos não mascaram falhas nem consomem chave por padrão.

**Dependências:** JW-002, JW-010, JW-017, JW-019, JW-022, JW-025.
**Origem/evidência:** Nove testes atuais passam com diagnóstico quebrado.

### JW-049 — Testar as quatro ferramentas e as sete durações

**P1 · 5 pontos relativos · QA/IA · Planejado**

Casos estruturais, de seleção e conteúdo para todos os artefatos.

**Critérios de aceitação:**

- Tabela compara exatamente o conjunto escolhido; família mistura perfis sem duplicar tempo.
- Esboços nas sete durações fecham orçamento e não inventam fontes; textos complementares são realmente verificados.

**Dependências:** JW-033, JW-036, JW-037, JW-039, JW-041.
**Origem/evidência:** Requisitos novos de artefatos.

### JW-050 — Construir benchmark editorial e de fontes

**P1 · 5 pontos relativos · Pesquisa/QA · Planejado**

Conjunto inicial de 20–30 casos com evidências conferidas e rubrica explícita.

**Critérios de aceitação:**

- Incluir assunto raro, histórico, divergência contextual, ausência de fonte e as perguntas sobre dívidas.
- Avaliar suporte, cobertura, fidelidade e utilidade; não usar só tamanho, nota automática ou texto antigo como verdade.

**Dependências:** JW-017, JW-021, JW-028, JW-048, JW-049.
**Origem/evidência:** Comparação anterior é amostra de 2 respostas, não benchmark completo.

### JW-051 — Jornadas completas e regressão de recursos

**P1 · 5 pontos relativos · QA/Frontend · Planejado**

Teste ponta a ponta da pesquisa aos quatro materiais e exportações.

**Critérios de aceitação:**

- Pesquisar → comparar → família → textos → esboço → salvar/importar/exportar funciona em desktop/mobile.
- Testar mudança de conversa, importação hostil, regeneração, offline e clique rápido no leitor.

**Dependências:** JW-042, JW-043, JW-044, JW-046, JW-047, JW-049.
**Origem/evidência:** Contrato de preservação JW-001.

### JW-052 — Medir latência e custo por modo e ferramenta

**P1 · 3 pontos relativos · Engenharia/Produto · Planejado**

Metas revisadas com medição, limites e resultado parcial claro.

**Critérios de aceitação:**

- Medir p50/p95 e causas em amostra definida; diferenciar cache/cold start.
- Reuso de evidências reduz chamadas; orçamento configurado limita gasto; divulgar desconhecido quando não há medição.

**Dependências:** JW-021, JW-022, JW-031, JW-050.
**Origem/evidência:** Não há base para prometer 4–8 s ou custo zero.

### JW-053 — Revisar linguagem, atribuição e incerteza

**P1 · 3 pontos relativos · Produto/Editorial · Planejado**

Tom claro e respeitoso, aplicação identificada e metadados de origem precisos.

**Critérios de aceitação:**

- Evitar rotular síntese gerada como publicação oficial ou afirmar 100% de precisão.
- Não transformar inferência em regra; adaptações familiares não presumem funções/capacidades por gênero/idade.

**Dependências:** JW-016, JW-018, JW-036, JW-038, JW-050.
**Origem/evidência:** Promessas de 100%, rótulos oficiais e percentuais não calibrados.

### JW-054 — Testar carga moderada e falhas de infraestrutura

**P1 · 5 pontos relativos · QA/DevOps · Planejado**

Plano de carga em homologação e testes de isolamento/recuperação.

**Critérios de aceitação:**

- Reinício, provedor lento e indisponibilidade de fonte não deixam trabalho infinito.
- Usuários isolados, cancelamento efetivo e recursos limitados; nenhuma carga agressiva enviada ao site fonte.

**Dependências:** JW-004, JW-007, JW-024, JW-025, JW-031, JW-048.
**Origem/evidência:** Ausência de testes de carga e recuperação.

### JW-055 — Documentar e empacotar release sem segredos

**P1 · 3 pontos relativos · Engenharia/Produto · Planejado**

README fiel, instruções de instalação, changelog e pacote com arquivos permitidos.

**Critérios de aceitação:**

- ZIP não inclui .env, caches, credenciais nem artefatos de desenvolvimento.
- Indicar estado real de web/Android/iOS e decisões de licença/atribuição; remover promessas não medidas.

**Dependências:** JW-001, JW-002, JW-008, JW-043, JW-053.
**Origem/evidência:** criar_pacote_zip.bat inclui diretórios inteiros; documentação divergente.


## M5 — Lançamento e operação

### JW-056 — Homologação e deploy observável

**P1 · 5 pontos relativos · DevOps · Planejado**

Ambiente separado, secrets, banco/fila persistentes e health probes.

**Critérios de aceitação:**

- Build do commit rastreável; migrações ensaiadas antes de produção.
- Deep research funciona após restart e não depende de filesystem efêmero; URLs/custos de serviços são decisão explícita.

**Dependências:** JW-002, JW-009, JW-023, JW-024, JW-031, JW-054, JW-055.
**Origem/evidência:** render.yaml atual sem job/store e sem runtime fixo.

### JW-057 — Rollback e restauração testados

**P1 · 3 pontos relativos · DevOps/Backend · Planejado**

Feature flags, backup e compatibilidade de schema entre versões.

**Critérios de aceitação:**

- Reverter UI/worker não apaga estudos e materiais.
- Restaurar backup em ambiente isolado e medir perda/tempo; pausar novas pesquisas se versão não conseguir processar fila.

**Dependências:** JW-027, JW-044, JW-045, JW-056.
**Origem/evidência:** Migração incremental precisa reversibilidade.

### JW-058 — Runbook de incidentes e manutenção de modelos

**P1 · 3 pontos relativos · DevOps/Produto · Planejado**

Procedimentos para quotas, credenciais, modelos retirados, fontes alteradas e bugs de citação.

**Critérios de aceitação:**

- Operador identifica fase/fonte/provedor por ID sem expor conteúdo privado.
- Suspender provedor e revogar segredo sem redeploy de frontend; corrigir referência com histórico de versão.

**Dependências:** JW-022, JW-031, JW-055, JW-056, JW-057.
**Origem/evidência:** Modelos hardcoded e tratamento de erro por texto.

### JW-059 — Beta orientado a tarefas reais

**P1 · 3 pontos relativos · Produto/QA · Planejado**

Grupo restrito testa pesquisas, famílias variadas e discursos de várias durações.

**Critérios de aceitação:**

- Coletar se encontrou fonte, preparou material e cumpriu objetivo, sem exigir dados familiares privados.
- Registrar falhas por tarefa e priorizar; não usar apenas satisfação subjetiva.

**Dependências:** JW-050, JW-051, JW-052, JW-053, JW-056.
**Origem/evidência:** Validar relevância do produto além da geração de texto.

### JW-060 — Gate de lançamento e monitoramento inicial

**P1 · 2 pontos relativos · Produto/Engenharia · Planejado**

Checklist de liberação com evidências e responsáveis funcionais.

**Critérios de aceitação:**

- Nenhum P0 aberto; quatro ferramentas preservadas; referência fabricada bloqueada nos casos de teste.
- Aprovar benchmark humano, recuperação, isolamento e exports; definir responsável por incidentes.

**Dependências:** JW-048, JW-049, JW-050, JW-051, JW-052, JW-054, JW-057, JW-058, JW-059.
**Origem/evidência:** Entrega completa não equivale a deploy que iniciou.


## Futuro — Expansão condicionada ao uso

### JW-061 — Alinhar Android ao serviço e aos materiais

**P2 · 8 pontos relativos · Android · Planejado**

Contrato compartilhado, navegação e segurança equivalentes à PWA.

**Critérios de aceitação:**

- Definir descontinuação ou manutenção explícita do modo standalone.
- Compilar/testar em SDK declarado, comparar fontes/materiais e garantir que leitor não transmite chave.

**Dependências:** JW-008, JW-011, JW-041, JW-043, JW-060.
**Origem/evidência:** Client direto; renderer sem tabelas; APK não auditado como binário.

### JW-062 — Restaurar projeto iOS compilável e seguro

**P2 · 8 pontos relativos · iOS · Planejado**

Projeto Xcode, bindings corretos, leitor real e contrato comum.

**Critérios de aceitação:**

- Compilar em macOS e validar navegação; corrigir text:/selection: vazios e closures inválidas.
- Segredos em armazenamento apropriado; leitor renderiza conteúdo, não HTML cru em Text.

**Dependências:** JW-008, JW-011, JW-041, JW-043, JW-060.
**Origem/evidência:** ContentView.swift; SearchClient.swift; projeto Xcode ausente.

### JW-063 — Matriz de paridade e publicação mobile

**P2 · 5 pontos relativos · QA/Mobile · Planejado**

Versões compatíveis e testes reais de armazenamento, rede e acessibilidade.

**Critérios de aceitação:**

- Android/iOS passam jornadas equivalentes da matriz e não anunciam recursos ausentes.
- Builds rastreáveis substituem APK solto sem proveniência; publicação exige validação da versão real.

**Dependências:** JW-061, JW-062.
**Origem/evidência:** Não foi realizada compilação mobile nesta análise.

### JW-064 — Avaliar índice semântico após benchmark

**P3 · 8 pontos relativos · IA/Backend · Planejado**

Experimento condicionado a lacunas de recuperação comprovadas.

**Critérios de aceitação:**

- Comparar baseline lexical/híbrido com custo, cobertura e atualização.
- Adotar somente se melhora casos reais; evitar cópia indiscriminada de acervo.

**Dependências:** JW-020, JW-050, JW-052, JW-060.
**Origem/evidência:** Banco vetorial não é pré-requisito demonstrado.

### JW-065 — Sincronização opcional entre dispositivos

**P3 · 8 pontos relativos · Produto/Backend · Planejado**

Contas, resolução de conflitos e compartilhamento privado revogável.

**Critérios de aceitação:**

- Consentimento explícito para sincronizar; não publicar estudos por padrão.
- Controle por recurso, revogação e conflito de versões testados; pesquisas locais continuam úteis.

**Dependências:** JW-024, JW-027, JW-045, JW-057, JW-060.
**Origem/evidência:** Recurso adicional, não necessário para o primeiro lançamento.

### JW-066 — Coleções, favoritos e anotações

**P2 · 3 pontos relativos · Frontend · Planejado**

Reencontrar estudos e fontes por tema com notas pessoais separadas da publicação.

**Critérios de aceitação:**

- Nota do usuário nunca aparece como texto da fonte.
- Busca por título/tema e organização local preservam referências e versões.

**Dependências:** JW-027, JW-041, JW-045, JW-060.
**Origem/evidência:** Melhoria de reutilização para tornar a ferramenta relevante.

### JW-067 — Consolidar inglês e espanhol com paridade

**P2 · 5 pontos relativos · Backend/QA · Planejado**

Edição bíblica, URLs, metadados e interface coerentes por idioma.

**Critérios de aceitação:**

- Troca de idioma não reaproveita verso/cache de outra edição.
- Benchmarks por idioma e referências locais válidas; português é o primeiro escopo integral.

**Dependências:** JW-015, JW-018, JW-020, JW-050, JW-060.
**Origem/evidência:** URLs r5/lp-t hardcoded fora de pt.

### JW-068 — Indicadores de cobertura calibrados

**P3 · 5 pontos relativos · Pesquisa/Produto · Planejado**

Mostrar cobertura observável e pendências, com avaliação de significado.

**Critérios de aceitação:**

- Indicador mede itens verificados, não probabilidade arbitrária de verdade.
- Se adotar score, documentar conjunto de calibração, limitações e atualização.

**Dependências:** JW-031, JW-050, JW-059, JW-060.
**Origem/evidência:** Conversa referência exibe confiança 97/98% sem método.
