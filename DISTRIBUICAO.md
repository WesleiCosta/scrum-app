# 📦 DISTRIBUIÇÃO - SCRUM-MARKOV APP

## 🎯 Versão para Execução Local (Sem Visual Studio Code)

Esta versão permite executar o **Scrum-Markov App** em qualquer computador sem necessidade do Visual Studio Code instalado.

---

## 📋 **ARQUIVOS INCLUÍDOS**

### Scripts de Instalação:
- `INSTALAR.bat` - Instalador automático (Windows)
- `INSTALAR.sh` - Instalador automático (Linux/Mac)

### Scripts de Execução:
- `executar-local.bat` - Executor simples (Windows)
- `executar-local.ps1` - Executor avançado (PowerShell)  
- `executar-local.sh` - Executor (Linux/Mac)

### Arquivos do Projeto:
- `dist/` - Build de produção otimizado
- `package.json` - Configurações e dependências
- `src/` - Código fonte (TypeScript/React)
- `EXECUTAR-LOCAL.md` - Documentação detalhada

---

## 🚀 **INSTALAÇÃO RÁPIDA**

### Pré-requisito ÚNICO:
- **Node.js 16+** (baixar em: https://nodejs.org)

### Instalação Automática:

#### Windows:
1. Clique duas vezes em `INSTALAR.bat`
2. Aguarde conclusão
3. Clique duas vezes em `executar-local.bat`

#### Linux/Mac:
```bash
chmod +x INSTALAR.sh executar-local.sh
./INSTALAR.sh
./executar-local.sh
```

### Instalação Manual:
```bash
npm install          # Instalar dependências
npm run build        # Gerar build
npm install -g serve # Instalar servidor
npm run start:local  # Executar app
```

---

## 🌐 **ACESSO**

Após execução:
- **URL:** http://localhost:3000
- **Interface:** Dashboard completo do Scrum-Markov
- **Funcionalidades:** Todas disponíveis

---

## 📊 **CARACTERÍSTICAS TÉCNICAS**

### Performance:
- **Tamanho total:** ~307 KB (compactado)
- **Carregamento:** < 2 segundos
- **Memória RAM:** ~50 MB
- **CPU:** Baixo uso

### Compatibilidade:
- ✅ Windows 10/11
- ✅ macOS 10.15+  
- ✅ Ubuntu 18.04+
- ✅ Chrome, Firefox, Safari, Edge

### Funcionalidades Completas:
- ✅ **Dashboard Executivo** - Visão geral de saúde
- ✅ **Análise Estatística** - Matriz de Markov
- ✅ **Insights Preditivos** - Previsões futuras
- ✅ **Gestão de Projetos** - CRUD completo
- ✅ **Log de Sprints** - Histórico detalhado
- ✅ **Autenticação** - Login seguro
- ✅ **Análise What-If** - Simulações
- ✅ **Alertas Inteligentes** - Notificações

---

## 🔧 **SOLUÇÃO DE PROBLEMAS**

### Node.js não encontrado:
```
Baixe e instale: https://nodejs.org
Versão recomendada: 18.x LTS
```

### Porta 3000 ocupada:
```bash
# Use porta alternativa
serve -s dist -l 8080
```

### Erro de permissão:
```bash
# Linux/Mac
sudo npm install -g serve

# Windows
Execute como Administrador
```

### Cache do navegador:
```
Pressione Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)
```

### Reinstalação completa:
```bash
rm -rf node_modules package-lock.json  # Linux/Mac
rmdir /s node_modules & del package-lock.json  # Windows
npm install
```

---

## 📱 **RECURSOS MÓVEIS**

- ✅ Interface responsiva
- ✅ Touch-friendly
- ✅ Funciona em tablets
- ✅ PWA ready (futuro)

---

## 🛡️ **SEGURANÇA**

- ✅ Dados armazenados localmente
- ✅ Sem conexão externa necessária
- ✅ HTTPS não obrigatório (localhost)
- ✅ Sem telemetria ou tracking

---

## 📞 **SUPORTE**

1. **Leia:** `EXECUTAR-LOCAL.md`
2. **Verifique:** Node.js instalado (`node --version`)
3. **Teste:** Scripts de instalação automática
4. **Contato:** Desenvolvedor do projeto

---

## 🎉 **PRONTO PARA USO!**

O **Scrum-Markov App** está configurado para **execução independente** sem necessidade de ferramentas de desenvolvimento. Basta seguir os passos de instalação e começar a usar!

**Desenvolvido com ❤️ para equipes Scrum**