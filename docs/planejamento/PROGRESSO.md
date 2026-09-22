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
