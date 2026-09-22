@echo off
setlocal
cd /d "%~dp0"
git archive --format=zip --output=JW-Search-Completo.zip HEAD
if errorlevel 1 (
  echo [ERRO] Nao foi possivel exportar o commit atual.
  exit /b 1
)
echo Pacote criado somente com os arquivos versionados do commit HEAD.
echo Mudancas nao commitadas e arquivos .env ignorados nao sao incluidos.
pause
