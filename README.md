# Scrum Markov App

Uma aplicação web avançada para análise preditiva de projetos Scrum usando Cadeias de Markov com modelo inteligente de 5 estados.

## 🚀 Características

- **Análise Preditiva**: Usa cadeias de Markov para prever a saúde futura dos projetos
- **5 Estados de Saúde**: P1 (Saudável) a P5 (Crítico) com definições customizáveis
- **Dashboard Interativo**: Visualizações gráficas das projeções futuras
- **Gerenciamento de Projetos**: Suporte para múltiplos projetos e equipes
- **Log de Sprints**: Interface intuitiva para registro histórico
- **Sem Backend**: Aplicação totalmente client-side usando localStorage

## 📋 Pré-requisitos

Antes de executar o projeto, você precisa instalar o Node.js:

### Instalação do Node.js no Windows

1. **Opção 1 - Download Manual**:
   - Acesse https://nodejs.org/
   - Baixe a versão LTS (Long Term Support)
   - Execute o instalador e siga as instruções
   - Reinicie o terminal/VS Code após a instalação

2. **Opção 2 - Via Chocolatey** (Execute como Administrador):
   ```powershell
   # Instalar Chocolatey
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   
   # Instalar Node.js
   choco install nodejs
   ```

3. **Opção 3 - Via winget**:
   ```powershell
   winget install OpenJS.NodeJS
   ```

### Verificando a Instalação

Após instalar o Node.js, reinicie o terminal e verifique:

```powershell
node --version
npm --version
```

## 🛠️ Instalação e Execução

1. **Clone ou baixe o projeto**
2. **Navegue até o diretório do projeto**:
   ```powershell
   cd scrum-markov-app
   ```

3. **Instale as dependências**:
   ```powershell
   npm install
   ```

4. **Execute em modo de desenvolvimento**:
   ```powershell
   npm run dev
   ```

5. **Acesse a aplicação**:
   - Abra seu navegador e vá para `http://localhost:3000`

## 🏗️ Build para Produção

Para criar uma build otimizada para produção:

```powershell
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

## 📖 Como Usar

### 1. **Login/Registro**
- Primeira vez: Crie uma conta com email, senha e nome
- Logins subsequentes: Use email e senha

### 2. **Criar Projeto**
- Vá para "Projetos" > "Novo Projeto"
- Defina nome e descrição
- Customize os 5 estados se necessário

### 3. **Registrar Sprints**
- Selecione um projeto
- Vá para "Log de Sprints"
- Adicione o estado final de cada sprint concluído

### 4. **Visualizar Predições**
- Vá para "Dashboard"
- Selecione o estado atual do projeto
- Visualize as projeções para os próximos 3 sprints

### 5. **Configurar Estados**
- Vá para "Configurações"
- Edite as definições e critérios dos 5 estados
- Adapte à realidade da sua equipe

## 🎯 Estados do Projeto

- **P1 (Saudável)**: Entrega de valor alta, equipe engajada, conformidade total
- **P2 (Alerta)**: Entrega funcional boa, mas requisitos voláteis
- **P3 (Em Risco)**: Entrega parcial, débito técnico acumulando
- **P4 (Degradação)**: Entrega comprometida, equipe sobrecarregada
- **P5 (Crítico)**: Entrega paralisada, vulnerabilidades críticas

## 💾 Armazenamento de Dados

A aplicação utiliza o localStorage do navegador para armazenar:
- Dados de usuário e autenticação
- Projetos e configurações
- Logs de sprints
- Matrizes de transição calculadas

**Nota**: Os dados são locais ao navegador. Para usar em outros dispositivos, você precisará exportar/importar os dados (recurso a ser implementado).

## 🔧 Tecnologias Utilizadas

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **React Router** (navegação)
- **Tailwind CSS** (estilização)
- **Recharts** (gráficos)
- **Lucide React** (ícones)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Problemas Comuns

### "npm não é reconhecido"
- Certifique-se que o Node.js foi instalado corretamente
- Reinicie o terminal/VS Code
- Verifique se o Node.js está no PATH do sistema

### Erros de permissão no Windows
- Execute o terminal como Administrador
- Ou configure o npm para usar um diretório local:
  ```powershell
  npm config set prefix %APPDATA%\npm
  ```

### Porta 3000 ocupada
- Use uma porta diferente: `npm run dev -- --port 3001`
- Ou pare o processo que está usando a porta 3000

## 📊 Roadmap

- [ ] Exportar/importar dados
- [ ] Integração com APIs externas
- [ ] Notificações por email
- [ ] Relatórios em PDF
- [ ] Análises estatísticas avançadas
- [ ] Modo escuro
- [ ] Internacionalização (i18n)

---

**Desenvolvido com ❤️ para equipes ágeis que querem prever o futuro dos seus projetos!**