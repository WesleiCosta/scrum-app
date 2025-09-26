@echo off
echo 🚀 Script para Configurar GitHub Repository
echo ==========================================
echo.

echo 📋 INSTRUÇÕES:
echo.
echo 1. Acesse: https://github.com/new
echo 2. Repository name: scrum-markov-app  
echo 3. Description: Aplicação web para análise preditiva de projetos Scrum usando Cadeias de Markov
echo 4. Marque como Public
echo 5. NÃO marque "Add a README file"
echo 6. NÃO marque "Add .gitignore" 
echo 7. Clique em "Create repository"
echo.

pause
echo.
echo 🔄 Fazendo push para o GitHub...
echo.

git push -u origin master

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCESSO! Repositório configurado com sucesso!
    echo.
    echo 🌐 Acesse seu repositório em:
    echo https://github.com/WesleiCosta/scrum-markov-app
    echo.
) else (
    echo.
    echo ❌ ERRO: Falha no push. Verifique se:
    echo - O repositório foi criado no GitHub
    echo - Você está conectado à internet
    echo - Suas credenciais estão corretas
    echo.
)

pause