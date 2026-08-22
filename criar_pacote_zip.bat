@echo off
title Criando pacote ZIP para compartilhamento...
echo ===================================================
echo     Criando pacote leve e limpo para envio
echo ===================================================
echo.
powershell -Command "Compress-Archive -Path 'backend', 'web', 'android', 'ios', 'JW-Search.apk', 'start.bat', 'README.md' -DestinationPath 'JW-Search-Completo.zip' -Force"
if %ERRORLEVEL% equ 0 (
    echo [SUCESSO] O arquivo 'JW-Search-Completo.zip' foi gerado na raiz!
    echo Esse arquivo contem tudo o que e necessario (Backend, Web, Android e iOS) e esta pronto para ser enviado.
) else (
    echo [ERRO] Ocorreu uma falha ao compactar os arquivos.
)
echo.
pause
