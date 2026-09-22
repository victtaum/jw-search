@echo off
setlocal
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe python -m venv .venv
if errorlevel 1 exit /b 1
.venv\Scripts\python.exe -m pip install -r backend/requirements.lock
if errorlevel 1 exit /b 1
echo Abra http://127.0.0.1:8000 e configure a chave nas configuracoes.
.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
