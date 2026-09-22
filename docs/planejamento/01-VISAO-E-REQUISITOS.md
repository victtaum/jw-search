# JW Search — visão completa de produto

Status: proposta de evolução, sem implementação na aplicação. Base: commit `94c4c2e`, análises anteriores, comparação real das duas pesquisas e requisitos explicitados nesta conversa.

## 1. Objetivo do produto

Transformar uma pergunta bíblica em pesquisa verificável e, a partir dela, em materiais úteis para estudo pessoal, comparação de textos, consideração em família e preparação de discursos. O valor central é a continuidade entre **perguntar, conferir, compreender, preparar, apresentar e reutilizar**.

O aplicativo deve ajudar a encontrar e trabalhar com as fontes, com clareza sobre o que veio delas e o que é síntese ou aplicação sugerida. A qualidade não será medida pelo comprimento da resposta ou pela quantidade de links.

## 2. Requisitos confirmados pelo usuário

| Requisito | Decisão de produto |
|---|---|
| Preservar recursos atuais | Pesquisa, leitor, links, navegação, histórico, importação, exportações e os quatro atalhos continuam acessíveis |
| Dois níveis de pesquisa | Seletor Sintetizada / Aprofundada; mesma exigência de evidência |
| Tabela comparativa | Comparar os textos trazidos pela consulta, com seleção explícita |
| Estudo em família | Roteiro de consideração, com sugestões para diferentes idades e participantes |
| Textos bíblicos | Organizar os já usados e oferecer complementares verificados |
| Esboço estruturado | Ferramenta para discursos, com 3, 5, 10, 15, 30, 45 e 60 minutos |
| Pesquisa documental | JW.ORG/WOL por padrão; fontes externas apenas quando habilitadas expressamente |
| Projeto de ponta a ponta | Segurança, arquitetura, UX, conteúdo, testes, implantação, operação e manutenção no backlog |

## 3. Princípios de funcionamento

- A pergunta do usuário é preservada; a consulta ao buscador é uma representação melhorada dela, não um corte das primeiras palavras.
- Afirmações documentais apontam para trechos identificados; a IA não escolhe URLs arbitrárias.
- Fonte encontrada, fonte lida e fonte usada na resposta são estados diferentes.
- A aplicação de um princípio é identificada como aplicação, sem se transformar em instrução oficial por estar junto a um link oficial.
- O modo simples pode ter texto curto; a validação das referências não é reduzida.
- “Aprofundar” procura o que falta; “resumir” reapresenta o que já foi pesquisado.
- Uma ferramenta derivada usa a versão da pesquisa escolhida. Trocar de conversa não altera essa base silenciosamente.
- O usuário pode editar o material. Regenerar cria outra versão, sem apagar o que foi ajustado manualmente.
- Falta de fonte, erro e resultado parcial são mostrados como tais.
- O produto é uma ferramenta de pesquisa independente; a origem oficial das fontes não transforma a síntese gerada em publicação oficial.

## 4. Jornada do início ao fim

1. **Pesquisar:** pergunta, modo de profundidade e escopo de fontes. Configuração de provedor fica em área própria, sem ocupar o centro da experiência.
2. **Acompanhar:** progresso real, cancelar e opção de voltar depois para consultas longas. Sem mensagens de reinício ou percentuais inventados.
3. **Compreender:** resumo inicial, pontos desenvolvidos e fontes próximas às afirmações. Estudos longos oferecem índice.
4. **Conferir:** abrir a fonte no trecho pertinente, examinar contexto e retornar ao ponto de origem.
5. **Preparar material:** escolher uma das quatro ferramentas e a parte da pesquisa a usar.
6. **Revisar:** editar texto, fontes selecionadas, adaptações familiares ou duração do discurso; conferir impacto sobre referências e tempos.
7. **Usar:** modo de leitura/apresentação e exportação do material desejado.
8. **Reutilizar:** histórico identifica pesquisas e seus derivados, com versões, títulos e data. Importações antigas continuam acessíveis.

## 5. Organização da interface

Na tela inicial: campo de pergunta, seletor Sintetizada/Aprofundada, escopo “Fontes JW” e botão Pesquisar. O controle de fontes externas é independente da profundidade.

No estudo aberto: área principal com conteúdo e índice, leitor lateral no desktop ou painel dedicado no celular, e ações “Tabela comparativa”, “Estudo em família”, “Textos bíblicos” e “Esboço estruturado”. Mostrar de forma simples qual pesquisa/parte foi selecionada como base.

Cada ferramenta abre uma configuração curta, com boas opções iniciais. Não obrigar o usuário a preencher uma ficha extensa. Opções avançadas ficam recolhidas. A saída é um material próprio, que pode aparecer junto ao estudo sem se confundir com outra pesquisa.

O leitor deve ter voltar, abrir na origem, localizar referência, tamanho de letra e contexto anterior/posterior. Tooltips não podem ser o único modo de acessar um versículo: teclado e toque precisam funcionar.

## 6. Tabela comparativa — especificação

### Entrada

Pesquisa/revisão de origem; textos bíblicos selecionados; objetivo da comparação; colunas desejadas. A seleção inicial inclui os textos efetivamente usados na resposta atual, não todos os textos de todo o histórico. O usuário pode incluir passagens de outro trecho do mesmo estudo conscientemente.

### Saída inicial recomendada

| Coluna | Conteúdo |
|---|---|
| Texto bíblico | Referência normalizada e botão para ler o trecho |
| Contexto | Quem fala, a quem e em que situação, quando isso estiver documentado |
| Ponto central | Síntese do que aquela passagem sustenta |
| Relação com os outros | Semelhança, complemento ou diferença contextual |
| Aplicação ao tema | Aplicação identificada; não ampliar indevidamente a afirmação |
| Fonte de apoio | Passagem e publicação que fundamentam a interpretação |

Opcionalmente comparar relatos, personagens ou publicações, mas o primeiro escopo é a comparação dos textos trazidos na consulta, conforme solicitado.

### Comportamentos importantes

- Com um único texto, explicar que são necessários pelo menos dois para comparar e oferecer seleção ou busca de complementares.
- Não acrescentar textos só para preencher linhas. Novos textos exigem consulta complementar identificada.
- “Não abordado na fonte” é uma célula válida; não preencher por adivinhação.
- Não forçar concordância entre situações diferentes nem criar contradição por ignorar contexto.
- Oferecer mover/reordenar linhas, ocultar colunas, seleção de textos e exportação.
- No celular, permitir cards com os mesmos campos e retorno à tabela.
- Manter estrutura em dados; `|` no título ou na célula não pode quebrar o formato.

### Aceite

Todas as linhas correspondem ao conjunto escolhido; referências abrem passagens corretas; nenhuma fonte é herdada de outro turno sem vínculo; conteúdo continua íntegro em CSV, DOCX e impressão. Backlog: JW-032 a JW-034, JW-043 e JW-049.

## 7. Estudo em família — especificação

### Entrada

Tema e pesquisa de origem; objetivo da consideração; duração opcional; participantes/perfis e necessidades de apresentação. Nomes, datas de nascimento ou detalhes familiares não são necessários. As adaptações são sugestões editáveis, não avaliação da capacidade das pessoas.

Perfis de partida: crianças de 3–5, 6–9 e 10–12 anos; adolescentes; adultos; casal; marido e/ou mulher quando o usuário quiser focar uma aplicação; idosos. Essas faixas são uma organização proposta da interface, não uma norma pedagógica ou congregacional.

| Perfil opcional | Adaptação possível |
|---|---|
| 3–5 anos | Uma ideia concreta por vez, perguntas breves, observar/desenhar/encenar com adulto |
| 6–9 anos | Explicar com as próprias palavras, reconhecer situação cotidiana, pequena atividade |
| 10–12 anos | Comparar escolhas, localizar um ponto na passagem e explicar o motivo |
| Adolescente | Perguntas abertas, dilemas cotidianos, raciocínio próprio sem exigir exposição pessoal |
| Adulto | Contexto, escolhas práticas, dificuldades e aplicação deliberada |
| Casal/marido/mulher | Perguntas de diálogo e cooperação relacionadas ao tema, sem atribuir culpa ou funções presumidas |
| Idoso | Opções de ritmo, leitura ampliada, participação e experiências quando desejadas, sem infantilização |
| Grupo misto | Núcleo comum e alternativas simultâneas para participação de cada pessoa |

### Saída

Objetivo do encontro; preparo opcional; abertura; leituras essenciais; blocos de discussão; perguntas por nível; sugestões de resposta fundamentadas; atividade opcional; aplicação para a semana; recapitulação; fontes e notas do facilitador.

Mostrar “Roteiro do encontro” e “Notas de quem conduz”. Respostas sugeridas podem ficar recolhidas para não substituir a conversa familiar.

Exemplo de estrutura de 20 minutos, meramente editorial: abertura 2 min, leitura/contexto 4 min, conversa 7 min, atividade/aplicação 5 min e recapitulação 2 min. O usuário pode redistribuir. Alternativas para crianças/adolescentes não entram todas na soma: seleciona-se o ramo utilizado. Tempos de participação humana permanecem aproximados.

### Aceite

O roteiro é uma sequência de consideração, não um resumo renomeado; pergunta factual tem fonte; perguntas de reflexão não fingem ter uma única resposta publicada; atividades inventadas são sugestões; grupo misto mantém duração plausível; aplicação ao casal depende do tema e da escolha. Backlog: JW-035, JW-036, JW-041 e JW-049.

## 8. Textos bíblicos — especificação

Duas seções: **Textos já usados** e **Textos complementares verificados**. Para cada passagem: referência, edição/idioma, contexto, motivo da relação com o tema, publicações relacionadas e acesso ao leitor.

O motor deve resolver livro/capítulo/versículos em estrutura de dados, não produzir uma URL textual inventada. Ao clicar, o leitor apresenta o trecho/contexto efetivamente obtido da fonte. Na síntese, usar referência, explicação e citações curtas pertinentes; não reconstruir texto bíblico de memória nem colocar paráfrase entre aspas como se fosse transcrição.

Suportar listas de versículos, intervalos, capítulos cruzados e nomes abreviados. Tratar ambiguidades explicitamente. Referência inválida não retorna um pedaço qualquer do capítulo.

Adicionar texto complementar muda o conjunto de evidências e gera nova versão quando utilizado em material existente. Selecionar passagens aqui pode alimentar diretamente tabela, família e discurso. Backlog: JW-015 e JW-037.

## 9. Esboço estruturado — especificação

### Entrada

Tema; objetivo; pesquisa/revisão de origem; público; duração de **3, 5, 10, 15, 30, 45 ou 60 minutos**; textos a ler e textos apenas a mencionar; estilo de apresentação; instruções ou esboço-base fornecido pelo usuário; ritmo de fala opcional.

Distinguir esboço autoral, adaptação de material do próprio usuário e apoio para desenvolver um esboço fornecido. Não identificar material gerado como esboço oficial. Quando houver uma estrutura-base, preservar seus pontos e restrições ou indicar claramente os ajustes sugeridos.

### Saída

Tema e objetivo; ideia central; introdução; pontos principais e subpontos; leituras marcadas; explicação e aplicação; transições; conclusão; tempo por bloco e acumulado; fontes por ponto; notas do orador. A saída deve favorecer falar a partir de um esboço, com opção posterior de expandir anotações, sem obrigar um manuscrito longo.

### Orçamento de tempo

O algoritmo trabalha em segundos. A soma dos blocos planejados fecha a duração escolhida. O seguinte é apenas um ponto de partida editorial, não regra oficial de discursos:

| Total | Introdução | Desenvolvimento, leituras e aplicações | Conclusão | Transições/pausas |
|---|---|---|---|---|
| 3 min | 0:20 | 2:10 | 0:20 | 0:10 |
| 5 min | 0:30 | 3:40 | 0:30 | 0:20 |
| 10 min | 1:00 | 7:30 | 1:00 | 0:30 |
| 15 min | 1:30 | 11:30 | 1:30 | 0:30 |
| 30 min | 3:00 | 23:00 | 3:00 | 1:00 |
| 45 min | 4:00 | 35:00 | 4:00 | 2:00 |
| 60 min | 5:00 | 47:00 | 5:00 | 3:00 |

O desenvolvimento é subdividido conforme o argumento e os textos escolhidos. Leituras e aplicações já estão incluídas nessa coluna. Tempos de leituras não devem ser adicionados uma segunda vez.

Separar três medidas: **tempo reservado** pelo planejamento, **tempo estimado** pelo conteúdo e ritmo informado, e **tempo real** medido em ensaio. Não prometer que um texto será apresentado em exatamente 30 minutos porque seus blocos somam 30.

Para estimar, somar duração prevista de cada trecho falado/leitura uma única vez e pausas/transições explícitas. Quando houver apenas tópicos, a incerteza é maior; mostrar faixa e orientar ajuste por ensaio. O ritmo inicial pode ser configurável, sem apresentá-lo como padrão universal.

### Ajustar duração

- Encurtar: priorizar ideia central, retirar exemplos secundários, reduzir número de leituras e preservar contexto essencial. Se o conteúdo obrigatório não couber, declarar o conflito e oferecer alternativas.
- Ampliar: desenvolver contexto, explicações e aplicações sustentadas pelas fontes; não repetir a mesma ideia para preencher tempo.
- Travar blocos obrigatórios e redistribuir apenas o restante.
- Edição manual recalcula o tempo e sinaliza referências que precisam ser revistas.
- Cronômetro de ensaio e modo de orador são melhorias próprias; não dependem de streaming de IA.

### Aceite

As sete durações funcionam; blocos fecham o orçamento; leituras/transições contam; fonte correta por ponto; material editado não é apagado; adaptação de duração mantém coerência e indica inviabilidade quando necessário. Backlog: JW-038 a JW-041 e JW-049.

## 10. Preservação de funcionalidades

| Hoje | Compromisso de evolução |
|---|---|
| Chat e perguntas complementares | Mantidos com contexto melhor e isolamento de conversa |
| Regenerar | Mantido como nova versão/ramificação segura |
| Quatro atalhos | Mantidos, com configuração breve e contrato próprio |
| Leitor, imagens e fontes | Mantidos e vinculados a trechos; resolver URLs corretamente |
| Histórico local | Migrado sem descarte; rótulo legado quando não validado |
| Importar JSON/MD | Mantido com validação e versão |
| Markdown/JSON/DOCX/PDF | Mantidos, incluindo exportação só do material selecionado |
| PWA | Preservada como primeira experiência completa |
| Android/iOS | Código preservado; paridade é uma etapa explícita, não presumida |

## 11. Escopo inicial e decisões propostas

Primeiro lançamento integral em português na web/PWA. Manter FastAPI e migrar incrementalmente, sem exigir troca de framework. Não lançar novas funções públicas sobre as falhas de segurança atuais.

Usar modo sintetizado como opção inicial, com aprofundado facilmente acessível. Manter provedor/configuração avançada separada da finalidade de estudo. Preservar documentos e notas locais; recuperação de tarefas no servidor exige retenção e autorização explícitas.

Faixas etárias, alocação temporal e limites de pesquisa são propostas editáveis. A arquitetura não deve depender de o usuário aceitar exatamente esses números. Mobile nativo, sincronização de contas e índice semântico ficam no backlog posterior com critérios para investimento.

## 12. O que significa tornar o produto relevante

Medir tarefas concluídas: encontrou a fonte correta; compreendeu o ponto; preparou uma comparação útil; conseguiu conduzir uma consideração; montou e ensaiou um discurso adequado; reencontrou e reaproveitou o material. Somar a isso integridade de citações, cobertura, latência, custo e falhas.

Não usar tempo no app, quantidade de texto ou cliques em geração como único sucesso. Uma resposta curta que resolve bem a necessidade pode ser melhor que um estudo longo.

Esta visão é detalhada no backlog de 68 itens e nos documentos de arquitetura, auditoria e validação desta pasta.
