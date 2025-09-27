# Scrum-Markov App - Executor Local
# PowerShell Script para executar o app sem Visual Studio Code

param(
    [int]$Port = 3000,
    [switch]$Build,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
=======================================================
    SCRUM-MARKOV APP - Executor PowerShell
=======================================================

USO:
    .\executar-local.ps1 [opcoes]

OPCOES:
    -Port <numero>    Porta do servidor (padrao: 3000)
    -Build            Força rebuild antes de executar
    -Help             Exibe esta ajuda

EXEMPLOS:
    .\executar-local.ps1              # Executa na porta 3000
    .\executar-local.ps1 -Port 8080   # Executa na porta 8080  
    .\executar-local.ps1 -Build       # Rebuild e executa

=======================================================
"@ -ForegroundColor Cyan
    exit 0
}

# Título
Write-Host @"
=======================================================
    SCRUM-MARKOV APP - Servidor Local
=======================================================
"@ -ForegroundColor Green

# Vai para o diretório do script
Set-Location $PSScriptRoot

# Verifica Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "[✓] Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js não encontrado! Instale em: https://nodejs.org" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Build se solicitado ou se não existe
if ($Build -or !(Test-Path "dist")) {
    Write-Host "[INFO] Gerando build de produção..." -ForegroundColor Yellow
    
    if (!(Test-Path "node_modules")) {
        Write-Host "[INFO] Instalando dependências..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[✗] Erro ao instalar dependências" -ForegroundColor Red
            Read-Host "Pressione Enter para sair"
            exit 1
        }
    }
    
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✗] Erro no build" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    Write-Host "[✓] Build concluído com sucesso!" -ForegroundColor Green
}

# Verifica se dist existe
if (!(Test-Path "dist")) {
    Write-Host "[✗] Diretório 'dist' não encontrado!" -ForegroundColor Red
    Write-Host "Execute: .\executar-local.ps1 -Build" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verifica/instala serve
try {
    serve --version 2>$null | Out-Null
    Write-Host "[✓] Serve já instalado" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Instalando 'serve'..." -ForegroundColor Yellow
    npm install -g serve
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✗] Erro ao instalar 'serve'" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    Write-Host "[✓] Serve instalado com sucesso!" -ForegroundColor Green
}

# Informações do servidor
Write-Host @"

[INFO] Iniciando servidor na porta $Port...
[INFO] URL: http://localhost:$Port
[INFO] Para parar: Ctrl+C

=======================================================

"@ -ForegroundColor Cyan

# Abre navegador automaticamente
Start-Process "http://localhost:$Port"

# Inicia servidor
serve -s dist -l $Port