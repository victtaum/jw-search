# Plano de evolução do JW Search

Projeto proposto do início ao fim, preservando pesquisa, leitor, navegação, fontes e as quatro ferramentas. Este documento descreve o plano inicial. Consulte PROGRESSO.md para o estado da implementação.

[Abrir visão interativa: backlog, ferramentas e tempos de discurso](<index.html>)

**68 itens · 6 marcos de entrega + futuro · 4 ferramentas · 7 durações.** O backlog soma 292 pontos relativos; não converter essa soma diretamente em prazo.

## Documentos

- [Visão, jornada e requisitos detalhados](<01-VISAO-E-REQUISITOS.md>)
- [Arquitetura, dados, API e decisões](<02-ARQUITETURA-E-DECISOES.md>)
- [Auditoria, mapa do código e 45 achados](<03-AUDITORIA-E-RASTREABILIDADE.md>)
- [Roadmap, testes, riscos e operação](<04-ROADMAP-VALIDACAO-E-OPERACAO.md>)
- [Backlog completo com aceite e dependências](<05-BACKLOG.md>)
- [Backlog CSV para Excel e importação](<backlog.csv>)
- [Backlog JSON estruturado](<backlog.json>)
- [Inventário de arquivos, linhas e hashes](<inventario-arquivos.csv>)
- [Evidências adicionais reproduzidas localmente](<evidencias-adicionais.json>)

## Leitura recomendada

Comece pela visão interativa e pelo documento de requisitos. Use a auditoria para conferir a origem dos problemas, a arquitetura para orientar a implementação e o backlog para organizar entregas. O roadmap define as portas de saída de cada marco.

## Estado e limites

Todos os itens estão planejados. A análise anterior executou testes e duas pesquisas reais; esta rodada acrescentou sondas locais de exportação, referências, títulos, papéis e atalhos. Não houve nova geração em provedores, alteração da aplicação, criação de issues, PR ou deploy. Mobile não foi compilado; binários foram inventariados, não auditados.

Inventário: 76 arquivos rastreados, 59 textuais e 7977 linhas textuais. A cobertura por bloco está explicitada na auditoria; inventário não é certificação de cada linha.

## Primeiro lote recomendado

JW-001 a JW-010: baseline, build/testes, proteção de destinos/segredos/HTML, configuração segura, limites e diagnóstico. Depois entregar uma fatia de pesquisa com evidências verificáveis antes de ampliar as ferramentas.
