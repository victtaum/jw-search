# Roadmap, validação e operação

## 1. Sequência de entrega

| Marco | Resultado esperado | Porta de saída |
|---|---|---|
| M0 — Fundação segura | Build repetível, fronteiras protegidas e diagnóstico honesto | Falhas críticas de chave/URL/HTML fechadas; smoke tests offline |
| M1 — Pesquisa verificável | Consultas úteis, passagens/versículos corretos, síntese citada | Referência inventada bloqueada; nenhuma resposta sem fonte rotulada como verificada |
| M2 — Execução confiável | Dois modos, orçamento global, jobs, versões, reconexão | Timeout/reinício/cancelamento/isolamento ensaiados |
| M3 — Quatro ferramentas completas | Tabela, família, textos e discurso com seleção/configuração | Requisitos do usuário e sete durações atendidos sobre evidência comum |
| M4 — Qualidade e compatibilidade | Leitor, exports, legado, acessibilidade, PWA e benchmark | Jornadas completas aprovadas e nenhuma regressão crítica |
| M5 — Lançamento e operação | Homologação, rollback, beta e runbook | Gate de release aprovado e monitoramento operável |
| Futuro — Expansão comprovada | Mobile, sincronização, organização, idiomas/índice quando úteis | Investimento condicionado ao uso e aos resultados medidos |

O caminho principal é M0 → M1 → M2 → M3 → M4 → M5. Itens sem dependência direta podem avançar juntos numa equipe, mas não é necessário executar cada marco inteiro antes de começar qualquer tarefa do próximo. As dependências por item são a referência operacional.

O backlog usa pontos relativos 2/3/5/8 como indicação de complexidade, não horas. Itens de 8 devem ser refinados antes da execução. Não há base honesta para prometer uma data final sem conhecer disponibilidade da equipe, hospedagem e acesso ao deploy. Após M0, medir capacidade real e estimar os próximos marcos com ela. Evitar converter a soma dos pontos diretamente em dias.

## 2. Fatiamento para a primeira implementação

Primeiro lote: JW-001 a JW-010, priorizando destinos/segredos e sanitização antes de reativar configuração. Em seguida, uma fatia vertical M1: pergunta conhecida → consulta correta → documento real → passagem → resposta → clique no trecho. Usar os defeitos observados nas pesquisas sobre dívidas como regressão, não a redação antiga como gabarito.

Depois introduzir execução recuperável e migrar uma ferramenta por vez. A tabela é uma boa primeira ferramenta para validar seleção, IDs de passagem e exportação, pois exige rastreabilidade explícita de cada linha. Família e discurso aproveitam essa mesma fundação, com estruturas próprias.

## 3. Estratégia de testes

| Camada | O que provar | Exemplo de falha a detectar |
|---|---|---|
| Unitário | Normalização, referências, orçamento, schemas, URLs e distribuição de tempo | João 3:16,18 vira apenas 16; bloco soma além do tempo |
| Contrato | Adaptadores/API/erros/compatibilidade | DeepSeek recebe modelo de outro provedor; legado deixa de abrir |
| Integração isolada | Pipeline com fixtures e provedor simulado | Coleta vazia gera fonte falsa; 503 não faz fallback |
| Segurança | Fronteiras e posse dos recursos | SSRF, XSS, segredo em destino arbitrário, acesso ao estudo de outro usuário |
| Estado/falhas | Concorrência, cancelamento, restart, leases e idempotência | Resposta entra em outra conversa; trabalho duplicado após reconectar |
| Ponta a ponta | Jornada real nos navegadores suportados | Citação some no PDF; tabela se quebra no celular |
| Editorial | Fidelidade, contexto, inferências e utilidade | Aplicação própria apresentada como explicação explícita da publicação |
| Operação | Carga moderada, custo, recursos e retomada | Fila cresce sem limites; worker perde trabalhos após reinício |

CI padrão não utiliza credenciais nem faz requisições aos modelos/WOL. Fixtures não contêm segredos; testes de rede são opt-in, com amostra e orçamento conhecidos. Não fazer carga sobre serviços de terceiros para validar a capacidade do nosso backend: usar simuladores para carga e poucas chamadas reais para compatibilidade.

## 4. Matriz mínima por ferramenta

### Tabela

Seleção de 0, 1, 2 e vários textos; passagens sobrepostas; texto sem evidência; fontes conflitantes/contextos diferentes; pipe e Markdown em célula; edição/reordenação; comparação móvel; CSV/DOCX/PDF; seleção de um turno versus estudo inteiro.

### Família

Um adulto; duas faixas infantis; adolescente com adulto; grupo misto; casal; pessoa idosa com opções de leitura; duração curta/longa; atividade omitida; alternativas de participação; perguntas com fonte e reflexões sem resposta única; exportação de guia do facilitador versus roteiro dos participantes.

### Textos bíblicos

Livros com números; abreviações; acentos; versículos isolados, listas, intervalos e capítulos cruzados; inválidos e ambíguos; edição/idioma; retorno de erro; marcação no leitor; complementares que realmente acrescentam relação ao tema.

### Discurso

3/5/10/15/30/45/60 minutos; números inteiros em segundos; blocos travados; leituras longas; apenas referências citadas; edição manual; mudar 30 para 5 e detectar inviabilidade; ampliar sem repetir; soma exata de planejamento e faixa de estimativa; cronômetro; notas privadas; esboço-base do usuário com restrições; exportação de orador e do público.

## 5. Avaliação de pesquisa

Construir 20–30 casos iniciais revisados, cobrindo perguntas práticas, doutrina, contexto histórico, relato bíblico, comparação, referência rara, continuação, pedido de formato e ausência de evidência. Registrar o conjunto de subperguntas e fontes conferidas, não uma única redação esperada.

Rubrica humana de 1 a 5 para cobertura, contexto, clareza e utilidade. Suporte documental e integridade de referência também recebem checagens binárias por afirmação. Um bom estilo não compensa uma referência fabricada. Considerar como condição inicial de liberação: nenhum erro crítico de atribuição e notas de pelo menos 4 nas dimensões acordadas nos casos de aceite. São critérios propostos para o conjunto de teste, não garantia estatística de todas as respostas futuras.

Comparar sintetizado e aprofundado nas mesmas perguntas. O aprofundado deve cobrir lacunas relevantes, não apenas multiplicar palavras/fontes. A síntese deve manter os pontos essenciais e as referências corretas. Comparar custo/tempo com a qualidade e repetir apenas casos instáveis ou modificados.

Não usar a conversa “Metodologia de pesquisa bíblica” como verdade integral: seu estilo e amplitude são referência de produto; cada afirmação precisa de suporte atual.

## 6. Critérios gerais de conclusão

Um item está concluído quando entrega o resultado descrito, passa suas verificações, tem decisão de comportamento em falha, preserva compatibilidade aplicável e não abre risco conhecido. Documentação/telemetria devem acompanhar mudanças relevantes.

O lançamento exige: nenhum P0 aberto; quatro ferramentas preservadas; casos de fonte falsa bloqueados; segurança/posse dos recursos testada; migração de estudos e quatro formatos funcionando; sete durações validadas; cancelamento/retomada demonstrados; limitações reais comunicadas; rollback ensaiado.

Não se exige migração de todos os clientes nativos para lançar a PWA melhorada, mas a documentação deve declarar a diferença. A falha de envio de chave no código Android é corrigida no início, independentemente de paridade posterior.

## 7. Métricas e eventos

- Sucesso/parcial/falha/cancelamento por modo e ferramenta.
- Tempo em fila, planejamento, coleta, geração, validação e total; p50/p95 com tamanho e período da amostra.
- Documentos encontrados/lidos/usados e taxa de reaproveitamento, sem tratar contagem como medida isolada de qualidade.
- Referências rejeitadas, títulos divergentes, passagens ausentes e falhas de parser.
- Tentativas, modelo efetivo, tokens/custo informado e limites atingidos.
- Fluxo concluído: conferiu fonte, gerou material, editou, exportou/reutilizou; dados agregados com mínima coleta.
- Recursos: workers ocupados, fila, memória, cache, erro de armazenamento e disponibilidade dos componentes próprios.

Logs usam IDs e códigos, não chaves nem corpo integral das conversas. Tempo desconhecido aparece como desconhecido. Não publicar selos de confiança percentuais sem calibração.

## 8. Riscos e mitigação

| Risco | Impacto | Mitigação / dono funcional |
|---|---|---|
| Bloqueio/mudança de HTML da fonte | Perda de recuperação | Fixtures, erro distinto, conectores versionados e falha parcial / Backend |
| Modelo retirado ou cota | Lentidão/falha/gasto | Registry, política limitada e monitoramento / Backend/Operação |
| Resposta convincente sem suporte | Perda de confiança | IDs de evidência e validação; revisão humana / IA/Editorial |
| Fila/estado efêmero | Perda de pesquisa | Armazenamento durável e testes de restart / DevOps |
| Vazamento de segredo/histórico | Abuso e exposição | Destino autorizado, sanitização, posse e retenção / Engenharia |
| Mais profundidade vira só prolixidade | Produto menos útil | Benchmark de cobertura e ações de resumo / Produto |
| Família recebe roteiro inadequado | Material pouco utilizável | Perfis opcionais, edição e beta diverso / Produto/Editorial |
| Discurso excede tempo real | Prejuízo na apresentação | Planejamento separado de estimativa/ensaio / Produto |
| Refatoração quebra recursos atuais | Regressão | Fixtures, migração incremental e flags / QA/Engenharia |
| Manter três motores independentes | Divergência contínua | Contrato comum e paridade nativa posterior / Arquitetura |

## 9. Release e manutenção

Homologação separada da produção, implantação de commit identificável e feature flags para modo aprofundado/geradores. Ensaiar migração, backup e restauração antes do beta. Desligar uma funcionalidade problemática sem descartar pesquisas concluídas.

Runbook deve cobrir: provedor fora, quota, fonte bloqueada, referência incorreta reportada, fila parada, vazamento de segredo, erro de migração e custo inesperado. Definir responsável funcional por incidentes e revisão editorial; os nomes das pessoas ficam a cargo do projeto.

Revisar dependências/modelos e as fixtures quando houver atualização ou incidente, com validação antes de publicar. Não criei automação recorrente nem tarefas externas nesta análise.

## 10. Decisões em aberto com proposta inicial

| Decisão | Proposta inicial | Quando fechar |
|---|---|---|
| Uso público ou restrito | Beta restrito; política de cotas antes de público | M0 |
| Provedores e orçamento | Um principal e alternativa permitida; medir por modo | M0/M2 |
| Hospedagem e persistência | Serviço que suporte estado durável de jobs | Antes de M2 em produção |
| Retenção no servidor | Mínima necessária; histórico privado com exclusão | M2 |
| Ritmo de fala | Editável e calibrado em ensaio | M3 |
| Faixas familiares | Propostas de interface, flexíveis e sem dados pessoais obrigatórios | M3/beta |
| Login/sincronização | Não obrigar conta para utilidade local; isolar sessão dos jobs | M0/M2; sync no futuro |
| Mobile nativo | Preservar código e corrigir segredo; paridade após PWA | Pós-M5 |

Essas decisões não impedem começar a correção segura do código. Evitam comprometer o projeto com custo, cronograma ou comportamento que ainda não foi escolhido.
