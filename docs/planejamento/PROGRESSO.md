# Registro de progresso

## Entrega 2.19.0 — fundação e primeira fatia funcional

- Base auditada: `94c4c2e`.
- 68 itens publicados em Markdown, CSV e JSON.
- Concluídos: JW-003 (credencial/destino), JW-006 (configuração global pública), JW-009 (configuração e diagnóstico) e JW-010 (erros HTTP).
- Avanço parcial em 38 itens. “Parcial” indica implementação relevante, mas ainda não cumpre todos os critérios de aceitação do item.
- Auditoria e inventário são registros históricos, não certificação do código posterior.

### O que entrou

- Pipeline único: consulta WOL → documento real → trechos → síntese com IDs → links resolvidos pelo servidor.
- Resultado sem evidências não chama o modelo nem é apresentado como pesquisa fundamentada.
- Modos sintetizado e amplo; orçamento cooperativo de 75 e 150 segundos, sem troca silenciosa de provedor/modelo.
- Configuração própria para tabela comparativa, estudo em família, textos bíblicos e esboço.
- Família: faixas infantis, adolescentes, adultos, casal e idosos. Esboços: 3, 5, 10, 15, 30, 45 e 60 minutos.
- Parser de referências com listas e intervalos entre capítulos; extração apenas por marcadores explícitos de versículo.
- Proteções para destinos de credenciais, URLs internas, HTML, importações, limites de entrada, beta restrito e segredos versionados.
- Dependências travadas, CI, 46 regressões de backend e 5 jornadas de navegador.

### Verificações desta entrega

| Verificação | Resultado |
|---|---|
| Testes de backend, sem rede/credenciais | 46 aprovados |
| Jornadas Chromium | 5 aprovadas |
| Ruff F821 | aprovado |
| Consulta real sintetizada sobre dívida | 1 documento, 1 citação, 11,39 s |
| Esboço real de 5 minutos | 3 fontes, 3 citações, 24,55 s; blocos somam 300 s |

Uma tentativa real do Gemini retornou 504 em cerca de 57 segundos. O fluxo agora preserva esse status como timeout e não tenta outro provedor automaticamente. Os tempos acima são amostras, não SLA.

### Limitações que continuam abertas

- Citação validada estruturalmente ainda não comprova, sozinha, que toda frase é semanticamente sustentada.
- O modo amplo ainda não decompõe a pergunta em várias consultas planejadas.
- Não há fila durável, retomada após reinício, cancelamento rígido, contas ou cotas por usuário.
- As ferramentas consultam novamente as fontes; snapshots/revisões imutáveis ainda serão implementados.
- Android recebeu somente a correção de vazamento de chave e não foi compilado; iOS continua incompleto.
- Fontes externas estão desativadas no novo pipeline até terem coleta e rotulagem verificáveis.
- Tailwind e fontes ainda vêm de CDN; a CSP atual é uma primeira proteção, não a política final.

## Ajuste de interface — profundidade da pesquisa

- O seletor suspenso foi substituído por um botão deslizante ao lado do seletor de fontes.
- Os estados agora são “Pesquisa sintetizada · Direta” e “Pesquisa ampla · Aprofundada”.
- A preferência permanece sincronizada com os controles da barra de acompanhamento.
- O campo “Código de acesso ao servidor” saiu da interface pública. `JW_ACCESS_TOKEN` continua disponível apenas como configuração administrativa opcional para instalações privadas.

## Entrega 2.20.0 — qualidade da pesquisa ampla

- Regressão reproduzida em produção com “moisés foi um cara legal?”: 118 segundos, cinco fontes duplicadas de Êxodo/Números e apenas 1.243 caracteres. Esse resultado não atende ao modo amplo.
- O parser agora usa os metadados do WOL para distinguir Bíblia, Estudo Perspicaz, revistas, livros e artigos antes de selecionar documentos.
- A coleta ampla pesquisa o tema e eixos correlatos, elimina duplicatas, limita concentração por publicação e reserva até 36 mil caracteres totais de evidência.
- Referências bíblicas encontradas nas publicações são seguidas por uma camada; o texto exato é recuperado da Tradução do Novo Mundo e entregue ao modelo como evidência própria.
- O prompt amplo exige resposta direta, contexto, qualidades ou princípios, episódios, contrapontos, aplicações, textos centrais completos e lacunas. Publicações devem aparecer com nome e identificação editorial.
- O provedor recebe até 75 segundos no modo amplo. Saída curta ou encerrada por limite de tokens recebe aviso de resposta incompleta, em vez de parecer uma pesquisa concluída.
- A reprodução local da coleta retornou o verbete “Moisés” do Estudo Perspicaz, artigos de A Sentinela e Despertai!, além de passagens bíblicas específicas. A validação integral com o Hy3 ocorrerá após o deploy, pois a chave do servidor não está disponível no ambiente local.

### Verificações desta entrega

| Verificação | Resultado |
|---|---|
| Testes de backend, sem rede/credenciais | 49 aprovados |
| Consulta real ao WOL para “Moisés” | Perspicaz + A Sentinela + Despertai! + livros; sem capítulos bíblicos duplicados |
| Extração recursiva de textos | referências distintas recuperadas por marcadores oficiais de versículo |

### Próximos passos do backlog

- JW-021: substituir os eixos lexicais por um plano semântico de subtemas e reutilizar a mesma coleta nas ferramentas.
- JW-017/JW-018: validar semanticamente cada afirmação e medir cobertura por fonte, sem percentuais de confiança inventados.
- JW-022/JW-025: execução assíncrona, progresso por etapa, cancelamento e retomada para eliminar a dependência de uma única conexão longa.
- JW-050: transformar a conversa de referência e outros 20–30 casos em benchmark editorial humano.

### Ajuste 2.20.1 — orçamento após validação pública

- A primeira validação da 2.20.0 confirmou a nova coleta, mas Gemini e Hy3 encerraram a síntese com erro do provedor após cerca de 60–90 segundos.
- O contexto amplo foi reduzido de 36 mil para 28 mil caracteres, a saída de 4.600 para 3.200 tokens e o alvo editorial para 800–1.200 palavras. A cobertura continua exigindo fontes variadas e textos bíblicos por extenso.
- O tempo máximo da chamada ao modelo passou a 60 segundos; o ganho de latência será medido novamente no ambiente público.

### Ajuste 2.20.2 — conclusão e citações agrupadas

- O Gemini gerou 11.629 caracteres em 40,1 segundos com 11 fontes diversas, mas atingiu o limite de 3.200 tokens antes da conclusão.
- O perfil amplo agora impõe máximo editorial de 1.100 palavras, pede 4–6 textos centrais e reserva espaço para concluir; a margem técnica subiu para 4.000 tokens e o raciocínio interno foi reduzido.
- Citações agrupadas (`[S1, S2]`) agora são validadas e convertidas em links individuais, como já ocorria com citações simples.

### Ajuste 2.20.3 — orçamento de raciocínio do Hy3

- O Hy3 falhou tanto no modo amplo quanto no sintetizado, enquanto o Gemini concluiu a mesma pesquisa ampla em 38,2 segundos.
- O catálogo atual do OpenRouter informa que `tencent/hy3` usa raciocínio alto por padrão e aceita os níveis `high`, `low` e `none`.
- O JW Search agora solicita raciocínio `low` no modo amplo e `none` no sintetizado, preservando o modelo escolhido e evitando gastar toda a janela antes de iniciar a resposta visível.

### Ajuste 2.20.4 — Hy3 amplo sem raciocínio interno

- Em produção, Hy3 sintetizado com `none` concluiu em 15,5 segundos; Hy3 amplo com `low` continuou excedendo a janela.
- Como o servidor já decompõe consultas, seleciona fontes e recupera textos, ambos os modos do Hy3 passam a usar `none`. A amplitude continua definida pela coleta e pelo perfil editorial.

## Entrega 2.21.0 — pipelines sintetizado e amplo independentes

- Os dois anexos fornecidos para comparação eram idênticos (mesmo SHA-256, 9.059 bytes e 1.069 palavras); a análise do sintetizado foi complementada pelo histórico Git anterior à fundação verificável.
- O sintetizado recupera o perfil editorial clássico: resposta direta, análise bíblica essencial, textos principais e publicações, adaptando os títulos à pergunta. A implementação antiga não foi copiada literalmente porque aceitava links gerados pelo modelo, misturava fallback de provedores e podia usar conhecimento sem evidência recuperada.
- O amplo deixa de ter o teto artificial de 1.100 palavras. A extensão passa a ser determinada pelo assunto e pela evidência, com até 7.000 tokens de saída e 100 segundos para o provedor dentro do orçamento global.
- A coleta ampla comporta oito publicações e 48 mil caracteres de evidência, além de até oito passagens bíblicas exatas. A sintetizada usa até cinco publicações e 22 mil caracteres.
- Perguntas sobre personagens detectadas por verbete do Estudo Perspicaz recebem consultas específicas sobre humildade, fé, coragem, erros e exemplos. Outros assuntos recebem princípios, conselhos, riscos e aplicações.
- Livros bíblicos inteiros e páginas mensais deixam de ocupar vagas de fontes temáticas. Documentos antigos sem `h1` continuam utilizáveis por meio do título e ID fornecidos pelo próprio resultado do WOL.
- O prompt amplo proíbe abreviar textos bíblicos com reticências e pede raciocínio integrado, em vez do molde fixo que produziu o anexo atual.

### Próximas validações

- Comparar publicamente sintetizado, amplo e conversa de referência com a mesma pergunta e a mesma rubrica.
- Medir se todos os versículos citados foram transcritos integralmente e se a publicação aparece com identificação editorial suficiente.
- Implementar navegação recursiva entre publicações; a entrega atual aprofunda consultas e segue referências bíblicas por uma camada.

### Ajuste 2.21.1 — referências centrais e compatibilidade do Hy3

- Validação pública da 2.21.0: sintetizado Hy3 concluiu com cinco fontes, 839 palavras e nenhum aviso; amplo Gemini concluiu com 16 fontes, 1.109 palavras e nenhum aviso.
- Referências bíblicas recorrentes em várias publicações agora recebem prioridade sobre menções isoladas, reduzindo passagens periféricas.
- Documentos antigos sem título visível passam a exibir a identificação editorial do WOL, em vez de usar como título um trecho longo e truncado do resultado.
- Hy3 amplo mantém 5.000 tokens de capacidade, limite técnico já validado nesse provedor; Gemini amplo conserva 7.000. Não há teto editorial de palavras em nenhum dos dois.

### Ajuste 2.21.2 — contexto amplo compatível com Hy3

- O Hy3 retornou 503 ao receber o contexto ampliado da 2.21.1; o Gemini concluiu o mesmo fluxo.
- Para Hy3 amplo, o contexto entregue ao modelo é distribuído em até 32 mil caracteres e a saída técnica usa 4.000 tokens, combinação anteriormente validada em produção.
- As oito fontes continuam navegáveis na interface. Textos bíblicos nunca são truncados pelo orçamento; somente trechos editoriais longos são condensados. O Gemini conserva o contexto amplo integral e 7.000 tokens.

## Entrega 2.22.0 — recuperação transparente de provedor

- A consulta pública “como sair das dívidas?” foi reproduzida: WOL saudável, Gemini amplo concluído em 40,9 segundos com 16 fontes e 9.028 caracteres, enquanto Hy3 retornou 503.
- Falhas recuperáveis do Hy3 acionam Gemini quando ele está configurado no servidor e ainda existe orçamento. O resultado identifica `provider: gemini`, `provider_requested: hy3`, `fallback_from: hy3` e inclui aviso explícito.
- Erros de credencial, modelo inválido, entrada inválida e autorização continuam sendo devolvidos sem troca de provedor.
- Se ambos os provedores falharem, o erro permanece tipado; a recuperação não mascara a indisponibilidade total.
## Entrega 2.22.1 — reserva de tempo para recuperação

- O Hy3 passa a ter um limite próprio de 70 segundos no modo amplo e 35 segundos no sintetizado quando o Gemini está configurado.
- O limite global permanece em 150/75 segundos, deixando tempo real para a tentativa automática com Gemini.
- A consulta pública `como sair das dívidas?` revelou que o Hy3 demorava cerca de 110 segundos para falhar, inviabilizando a recuperação anterior.

## Entrega 2.23.0 — versão visível e contato privado

- O rodapé mostra a versão informada pelo backend, evitando divergência entre interface e implantação.
- O formulário de bug, sugestão e contato envia por `/api/contact`; destinatário e chave de e-mail permanecem somente nos segredos do Render.
- A entrada tem limites de tamanho, validação do e-mail de retorno, honeypot e limite de três mensagens por origem a cada 15 minutos.
- O envio usa a API HTTPS do Resend porque instâncias gratuitas do Render bloqueiam as portas SMTP usuais.

## Entrega 2.24.0 — OpenRouter público e Gemini privado

- OpenRouter/Hy3 passa a ser o padrão para instalações novas e existentes; uma migração local remove o antigo padrão Gemini uma única vez.
- A chave Gemini do servidor deixa de participar de pesquisas ou recuperações públicas, mesmo quando continua cadastrada no Render.
- O Gemini reservado só pode ser usado com um token administrativo separado; esse controle não aparece na interface pública.
- Se o visitante cadastrar sua própria chave Gemini, ela pode ser selecionada diretamente e pode recuperar uma falha do OpenRouter daquele visitante.
- As abas da janela de chaves agora também selecionam de fato o provedor; antes elas apenas alternavam o formulário visível.
