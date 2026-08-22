# 📖 JW Search - Portal de Pesquisa Teocrática Inteligente

O **JW Search** é uma ferramenta de pesquisa teocrática pessoal com Inteligência Artificial (RAG com Google Search Grounding), buscando respostas estruturadas exclusivamente nas fontes oficiais (**jw.org** e **wol.jw.org**).

---

## 🍏 Como Instalar e Usar no iPhone / iPad (iOS) SEM LOJA

No iOS, a extensão de pacotes compilados é **.ipa**. Para instalar aplicativos no iPhone **sem precisar da App Store**, existem duas formas:

### 🌟 Método 1: Instalação Instantânea como Web App (PWA Nativo - Recomendado)
1. No seu iPhone ou iPad, abra o **Safari** e acesse o endereço do portal (ex: http://SEU_IP:8000 ou seu link de nuvem).
2. Toque no botão de **Compartilhar** do Safari (ícone de um quadrado com uma seta para cima na barra inferior).
3. Role para baixo e selecione **"Adicionar à Tela de Início"** (*Add to Home Screen*).
4. Toque em **"Adicionar"** no canto superior direito.
5. **Resultado:** O ícone do **JW Search** aparecerá na tela inicial do seu iPhone, abrindo em **tela cheia nativa** (sem barra de URL do navegador), com suporte a cache offline e funcionamento idêntico a um aplicativo instalado pela loja!

### 🛠️ Método 2: Aplicativo Nativo em Swift (.ipa) via Sideloading
- O código-fonte nativo em **SwiftUI / Swift** está na pasta ios/JWSearch/.
- Pode ser compilado no Xcode gerando o arquivo .ipa e instalado no iPhone via ferramentas de assinatura como **AltStore**, **Sideloadly** ou **Scarlet** sem precisar da App Store.

---

## 🤖 Como Usar no Celular (Android)

1. Pegue o arquivo **JW-Search.apk** que já está pronto na raiz deste projeto.
2. Envie para o seu celular (WhatsApp, Telegram, Drive ou cabo USB).
3. Toque no arquivo e confirme a instalação.
4. O app roda **100% autônomo** no seu celular: basta colar sua chave gratuita do Gemini na primeira abertura.

---

## ⚡ Como Executar no Computador (Web / Backend)

1. Dê um duplo clique no arquivo **start.bat**.
2. Na primeira vez, informe sua chave gratuita GEMINI_API_KEY (obtida no [Google AI Studio](https://aistudio.google.com/)).
3. O portal abrirá automaticamente no seu navegador em **http://localhost:8000**.

---

## 📂 Estrutura do Projeto
- **ackend/**: Servidor FastAPI em Python com busca RAG em IA e leitor WOL.
- **web/**: Frontend responsivo em HTML5, Tailwind CSS e Progressive Web App (PWA) compatível com iOS/Android.
- **ndroid/**: Código-fonte do app nativo Android em Kotlin e Jetpack Compose.
- **ios/**: Código-fonte do app nativo iOS em Swift e SwiftUI.
- **JW-Search.apk**: Aplicativo Android compilado pronto para instalar.
- **start.bat**: Inicializador automático para Windows.
