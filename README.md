# JW Search

Pesquisa bíblica com leitura de fontes e preparação de materiais de estudo. Projeto independente, sem vínculo oficial com jw.org.

**Acompanhe:** [backlog](BACKLOG.md), [progresso](docs/planejamento/PROGRESSO.md), [requisitos](docs/planejamento/01-VISAO-E-REQUISITOS.md) e [arquitetura proposta](docs/planejamento/02-ARQUITETURA-E-DECISOES.md).

## Esta entrega — 2.24.1

- Dois pipelines editoriais independentes: o **sintetizado** recupera o estilo clássico do JW Search, com resposta direta, análise essencial, textos e publicações; o **amplo** aplica pesquisa teocrática profunda sem teto artificial de palavras, com consultas correlatas, publicações variadas e passagens bíblicas integrais.
- Pesquisa compartilhada entre Gemini, DeepSeek e Hy3/OpenRouter: busca no WOL, leitura de documentos, seleção de trechos e geração com IDs de fontes. Links são resolvidos pelo código a partir dos documentos coletados.
- Tabela comparativa, estudo em família, textos bíblicos e esboço estruturado com configuração própria. É possível informar referências; família permite selecionar perfis; discursos aceitam 3, 5, 10, 15, 30, 45 e 60 minutos.
- Leitor, histórico, importação e exportações Markdown, JSON, DOCX e impressão/PDF continuam disponíveis.
- Limites de tempo e entrada, sanitização de HTML, destinos de credenciais controlados e diagnóstico sem latências inventadas.

**Limites atuais:** identidade documental não equivale à validação semântica de cada afirmação. Os materiais exigem revisão antes do uso. A pesquisa ampla percorre uma camada de referências bíblicas; navegação recursiva entre publicações e planejamento semântico continuam no backlog. Materiais consultam fontes novamente; snapshots imutáveis e tarefas persistentes estão no backlog. O fluxo novo coleta apenas fontes oficiais; `include_external` retorna aviso explícito.

## Executar localmente

Requisitos: Python **3.11**. Node 22 é necessário apenas para testes do navegador.

```sh
python -m venv .venv
# Ative o ambiente virtual conforme seu sistema operacional.
python -m pip install -r backend/requirements.lock
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Abra `http://127.0.0.1:8000`. No Windows, `start.bat` cria o ambiente e inicia em loopback. Em caso de conflito de instalação com o OneDrive, use um ambiente virtual fora da pasta sincronizada.

Selecione um provedor e informe a chave nas configurações do navegador. As chaves ficam no armazenamento local e são enviadas por cabeçalhos ao backend; não entram na exportação do estudo. O armazenamento de credenciais apenas por sessão ainda está no backlog.

## Configuração do servidor

| Variável | Uso |
|---|---|
| `GEMINI_API_KEY` | Chave do servidor para Gemini |
| `DEEPSEEK_API_KEY` | Chave do servidor para DeepSeek |
| `HY3_API_KEY` | Chave do servidor para OpenRouter |
| `JW_ACCESS_TOKEN` | Código de acesso do beta; quando definido, exigido em chat/search/diagnostics |
| `JW_HY3_BASE_URL` | Endpoint autorizado pelo administrador; padrão `https://openrouter.ai/api/v1` |
| `JW_DEEPSEEK_BASE_URL` | Endpoint autorizado pelo administrador; padrão `https://api.deepseek.com` |
| `JW_DISABLE_DOTENV=1` | Desativa leitura do `.env` legado do Gemini; usado nos testes |

O `base_url` do cliente precisa corresponder ao registro do servidor. Uma chave OpenAI não é inferida como chave OpenRouter. Quando o Hy3 sofre falha recuperável e o servidor possui Gemini configurado, a pesquisa é refeita com Gemini e a troca é informada nos metadados e avisos. Credencial recusada, modelo inválido e erro de entrada não acionam fallback.

Configure `JW_ACCESS_TOKEN` e HTTPS antes de expor uma chave do servidor em uma instalação privada. O campo não aparece na interface pública; quando a variável está ativa, clientes autorizados devem enviar o cabeçalho correspondente. Ele **não substitui contas, cotas por usuário ou isolamento de estudos**. A concorrência atual é limitada a quatro pesquisas por processo.

`POST /api/config` não modifica credenciais globais nem escreve `.env`. `GET /api/config` informa configuração sem mostrar trechos de chaves. `GET /healthz` não chama provedores.

## Tempo e recuperação

Orçamento cooperativo: 75 segundos no sintetizado e 150 no amplo. A chamada ao modelo recebe até 55 segundos no sintetizado e 100 segundos no amplo, sempre limitada pelo tempo restante; novas coletas verificam o orçamento. O navegador mantém margem de transporte (85/165 segundos). Respostas amplas curtas ou interrompidas pelo limite de geração são marcadas como incompletas. DNS e operações em andamento não têm cancelamento rígido do processo. Reconexão, fila durável e cancelamento completo seguem no backlog.

## Testes e CI

```sh
python -m pip install -r requirements-dev.txt
python -m pytest
ruff check backend tests --select F821
npm ci
npx playwright install chromium
npm test
```

Os testes padrão usam fixtures e respostas simuladas: não gastam créditos nem acessam provedores. O navegador bloqueia recursos externos nos testes funcionais. A CI executa as duas suítes e verifica padrões de segredos nos arquivos versionados. Scripts exploratórios antigos `backend/test_*` foram substituídos pelas regressões isoladas em `tests/`.

O formulário de contato usa o backend para que destinatário e credenciais nunca sejam enviados ao navegador. Configure `RESEND_API_KEY`, `CONTACT_RECIPIENT` e, opcionalmente, `CONTACT_FROM` como segredos no ambiente de hospedagem.

OpenRouter/Hy3 é o provedor público padrão. A `GEMINI_API_KEY` do servidor funciona como último recurso quando o OpenRouter falha ou a primeira coleta não encontra evidências. O proprietário também pode selecioná-la diretamente com `JW_OWNER_TOKEN`; visitantes podem fornecer suas próprias chaves no dispositivo.

Consultas reais são verificações separadas e não comprovam qualidade para todos os assuntos. Veja os resultados e limites no [registro de progresso](docs/planejamento/PROGRESSO.md).

## Clientes e publicação

Web/PWA é o foco desta entrega. Android recebeu uma correção para não anexar a chave Gemini à leitura de artigos; não foi compilado nesta rodada. iOS permanece incompleto.

Docker e Render usam `backend/requirements.lock`. Atualize dependências deliberadamente, regenere o lock e execute os testes. `criar_pacote_zip.bat` exporta apenas o commit HEAD via `git archive`, sem copiar ambientes virtuais, `.env` ignorados ou arquivos não versionados.

Biblioteca vendorizada: [DOMPurify 3.3.1 e licença](web/vendor/DOMPurify-LICENSE.txt). A apresentação ainda usa Tailwind e fontes por CDN; empacotamento completo, CSP estrita e validação visual em vários dispositivos continuam pendentes.
