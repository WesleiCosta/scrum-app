#!/bin/bash

echo "====================================================="
echo "    SCRUM-MARKOV APP - Servidor Local"
echo "====================================================="
echo ""
echo "Iniciando servidor local na porta 3000..."
echo ""
echo "Acesse no navegador: http://localhost:3000"
echo ""
echo "Para parar o servidor, pressione Ctrl+C"
echo ""
echo "====================================================="
echo ""

# Vai para o diretório do script
cd "$(dirname "$0")"

# Verifica se o diretório dist existe
if [ ! -d "dist" ]; then
    echo "[ERRO] Diretório 'dist' não encontrado!"
    echo "Execute primeiro: npm run build"
    read -p "Pressione Enter para continuar..."
    exit 1
fi

# Verifica se serve está instalado
if ! command -v serve &> /dev/null; then
    echo "[INFO] Instalando 'serve'..."
    npm install -g serve
    if [ $? -ne 0 ]; then
        echo "[ERRO] Falha ao instalar 'serve'"
        read -p "Pressione Enter para continuar..."
        exit 1
    fi
fi

echo "[INFO] Iniciando servidor..."
serve -s dist -l 3000

read -p "Pressione Enter para continuar..."