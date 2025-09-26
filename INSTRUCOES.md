# Instruções para Executar o Projeto Scrum-Markov

## ⚠️ IMPORTANTE - Instalação do Node.js

Antes de executar o projeto, você **PRECISA** instalar o Node.js. Siga os passos abaixo:

### 1. Baixar e Instalar o Node.js

**Opção A - Download Direto (Recomendado)**
1. Vá para https://nodejs.org/
2. Baixe a versão **LTS** (Long Term Support)  
3. Execute o instalador (.msi) e siga as instruções
4. **IMPORTANTE**: Marque a opção "Add to PATH" durante a instalação
5. Reinicie o computador após a instalação

**Opção B - Via Winget (Windows 10/11)**
```powershell
winget install OpenJS.NodeJS
```

### 2. Verificar a Instalação

Após instalar e reiniciar, abra um **NOVO** terminal PowerShell e digite:

```powershell
node --version
npm --version
```

Se aparecerem os números das versões, a instalação foi bem-sucedida.

### 3. Executar o Projeto

Agora você pode executar o projeto:

```powershell
# Navegar para o diretório do projeto
cd "c:\Users\Weslei\projetos\scrum-markov-app"

# Instalar as dependências
npm install

# Executar o servidor de desenvolvimento
npm run dev
```

### 4. Acessar a Aplicação

- Abra seu navegador
- Acesse: http://localhost:3000
- A aplicação Scrum-Markov será carregada

## 🚀 Primeiros Passos na Aplicação

1. **Registro/Login**: Crie uma conta ou faça login
2. **Criar Projeto**: Vá em "Projetos" > "Novo Projeto"
3. **Adicionar Sprints**: Em "Log de Sprints", adicione pelo menos 2 sprints
4. **Ver Predições**: No "Dashboard", selecione o estado atual e veja as projeções

## 🛠️ Resolução de Problemas

### "npm não é reconhecido"
- Certifique-se que o Node.js foi instalado corretamente
- Reinicie o terminal/VS Code
- Reinstale o Node.js se necessário

### Erro de porta ocupada
```powershell
npm run dev -- --port 3001
```

### Limpar cache (se necessário)
```powershell
npm install --force
```

## 📊 Funcionalidades Implementadas

✅ **Autenticação**: Sistema de login/registro  
✅ **Gerenciamento de Projetos**: Criar e selecionar projetos  
✅ **Log de Sprints**: Registrar histórico de sprints  
✅ **Matriz de Transição**: Cálculo automático das probabilidades  
✅ **Dashboard Preditivo**: Projeções para próximos 3 sprints  
✅ **Configuração de Estados**: Customizar os 5 estados  
✅ **Análise de Riscos**: Alertas automáticos de risco  
✅ **Interface Responsiva**: Design moderno e intuitivo  

## 🎯 Estados do Projeto

- **P1 (Saudável)**: Verde - Projeto funcionando perfeitamente
- **P2 (Alerta)**: Azul - Pequenos sinais de alerta
- **P3 (Em Risco)**: Amarelo - Requer atenção
- **P4 (Degradação)**: Laranja - Situação preocupante  
- **P5 (Crítico)**: Vermelho - Requer ação imediata

---

**Desenvolvido para transformar dados históricos em insights preditivos para equipes ágeis! 🔮**