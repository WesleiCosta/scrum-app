@echo off
echo =====================================================
echo    SCRUM-MARKOV APP - Servidor Local
echo =====================================================
echo.
echo Iniciando servidor local na porta 3000...
echo.
echo Acesse no navegador: http://localhost:3000
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.
echo =====================================================
echo.

cd /d "%~dp0"

REM Verifica se o diretorio dist existe
if not exist "dist" (
    echo [ERRO] Diretorio 'dist' nao encontrado!
    echo Execute primeiro: npm run build
    pause
    exit /b 1
)

REM Verifica se serve esta instalado
where serve >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Instalando 'serve'...
    npm install -g serve
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao instalar 'serve'
        pause
        exit /b 1
    )
)

echo [INFO] Iniciando servidor...
serve -s dist -l 3000

pause