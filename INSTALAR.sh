#!/bin/bash

echo "====================================================="
echo "    SCRUM-MARKOV APP - Instalação Automática"
echo "====================================================="
echo ""
echo "Este script irá:"
echo "1. Verificar Node.js"
echo "2. Instalar dependências"
echo "3. Gerar build de produção"
echo "4. Configurar servidor local"
echo ""
echo "====================================================="
echo ""

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não encontrado!"
    echo ""
    echo "Por favor, instale Node.js em: https://nodejs.org"
    echo "Versão recomendada: 18.x LTS ou superior"
    echo ""
    read -p "Pressione Enter para sair..."
    exit 1
fi

echo "[OK] Node.js detectado: $(node --version)"

echo ""
echo "[INFO] Instalando dependências..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao instalar dependências"
    read -p "Pressione Enter para sair..."
    exit 1
fi

echo ""
echo "[INFO] Gerando build de produção..."
npm run build
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha no build"
    read -p "Pressione Enter para sair..."
    exit 1
fi

echo ""
echo "[INFO] Instalando servidor HTTP..."
npm install -g serve 2>/dev/null || {
    echo "[AVISO] Falha ao instalar 'serve' globalmente"
    echo "Tentando instalação local..."
    npm install serve
}

echo ""
echo "====================================================="
echo "    INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "====================================================="
echo ""
echo "Para executar o app:"
echo "  - Execute: ./executar-local.sh"
echo "  - Ou execute: npm run start:local"
echo ""
echo "URL de acesso: http://localhost:3000"
echo ""
echo "====================================================="
echo ""

read -p "Pressione Enter para continuar..."