@echo off
REM =====================================================
REM   SCRUM-MARKOV APP - Instalador Automático
REM =====================================================

echo =====================================================
echo    SCRUM-MARKOV APP - Instalacao Automatica
echo =====================================================
echo.
echo Este script ira:
echo 1. Verificar Node.js
echo 2. Instalar dependencias
echo 3. Gerar build de producao
echo 4. Configurar servidor local
echo.
echo =====================================================
echo.

REM Verifica Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale Node.js em: https://nodejs.org
    echo Versao recomendada: 18.x LTS ou superior
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detectado: 
node --version

echo.
echo [INFO] Instalando dependencias...
npm install
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)

echo.
echo [INFO] Gerando build de producao...
npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha no build
    pause
    exit /b 1
)

echo.
echo [INFO] Instalando servidor HTTP...
npm install -g serve
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Falha ao instalar 'serve' globalmente
    echo Tentando instalacao local...
    npm install serve
)

echo.
echo =====================================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo =====================================================
echo.
echo Para executar o app:
echo   - Duplo clique em: executar-local.bat
echo   - Ou execute: npm run start:local
echo.
echo URL de acesso: http://localhost:3000
echo.
echo =====================================================
echo.

pause