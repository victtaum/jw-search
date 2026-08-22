@echo off
setlocal EnableDelayedExpansion
title JW Search - Portal de Pesquisa Teocratica
echo ===================================================
echo               JW Search - Portal de Pesquisa
echo ===================================================
echo.

:: 1. Verificar se o Python esta instalado
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] O Python nao foi encontrado no seu computador!
    echo Para executar este projeto, instale o Python 3.10 ou superior:
    echo 1. Baixe em: https://www.python.org/downloads/
    echo 2. IMPORTANTE: Durante a instalacao, marque a opcao "Add python.exe to PATH".
    echo.
    pause
    exit /b
)

:: 2. Carregar ou solicitar a chave da API do Gemini
if not defined GEMINI_API_KEY (
    if exist .env (
        for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
            if "%%A"=="GEMINI_API_KEY" set "GEMINI_API_KEY=%%B"
        )
    )
)

if not defined GEMINI_API_KEY (
    echo.
    echo ===================================================
    echo             CONFIGURACAO DA CHAVE DE IA
    echo ===================================================
    echo Para que a busca inteligente com IA funcione, e necessaria
    echo uma chave de API gratuita do Google Gemini.
    echo.
    echo Obtenha sua chave gratuita em: https://aistudio.google.com/
    echo.
    set /p "USER_KEY=Cole aqui sua GEMINI_API_KEY e aperte [Enter]: "
    if defined USER_KEY (
        echo GEMINI_API_KEY=!USER_KEY! > .env
        set "GEMINI_API_KEY=!USER_KEY!"
        echo Chave salva com sucesso no arquivo .env!
    ) else (
        echo [AVISO] Nenhuma chave fornecida. O modo IA pode nao responder buscas.
    )
    echo.
)

:: 3. Instalar/Verificar dependencias do Python
echo 1. Verificando dependencias do projeto...
python -m pip install -r backend/requirements.txt --quiet
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Ocorreu uma advertencia ao verificar dependencias. Tentando iniciar o servidor...
)

echo.
echo 2. Iniciando o servidor backend...
echo O portal web estara disponivel em: http://localhost:8000
echo.

:: 4. Abrir o navegador e iniciar o FastAPI
start "" http://localhost:8000
python backend/main.py

pause

