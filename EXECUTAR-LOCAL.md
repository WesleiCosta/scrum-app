# 🚀 SCRUM-MARKOV APP - Execução Local

Este projeto pode ser executado localmente sem precisar do Visual Studio Code instalado.

## 📋 Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **Navegador web moderno** (Chrome, Firefox, Safari, Edge)

## 🔧 Instalação e Execução

### Opção 1: Execução Automática (Recomendado)

#### Windows:
1. Abra o terminal/prompt de comando na pasta do projeto
2. Execute: `executar-local.bat`
3. Ou clique duas vezes no arquivo `executar-local.bat`

#### Linux/Mac:
1. Abra o terminal na pasta do projeto
2. Torne o script executável: `chmod +x executar-local.sh`
3. Execute: `./executar-local.sh`

### Opção 2: Execução Manual

1. **Gerar build de produção:**
   ```bash
   npm install
   npm run build
   ```

2. **Instalar servidor HTTP:**
   ```bash
   npm install -g serve
   ```

3. **Servir a aplicação:**
   ```bash
   serve -s dist -l 3000
   ```

4. **Acessar no navegador:**
   - Abra: `http://localhost:3000`

## 🌐 Acesso

Após executar qualquer uma das opções acima:
- **URL Local:** http://localhost:3000
- **Interface:** Dashboard Scrum-Markov completo
- **Funcionalidades:** Todas as features disponíveis

## 📊 Funcionalidades Disponíveis

✅ **Visualização Executiva**
- Medidor de saúde do projeto
- KPIs em tempo real
- Diagnóstico inteligente
- Plano de ação estratégico

✅ **Análise Estatística**
- Matriz de transição de Markov
- Probabilidades calculadas
- Histórico de estados
- Visualização em heatmap

✅ **Insights Preditivos**
- Previsões futuras
- Análise What-If
- Sistema de alertas
- Recomendações automáticas

## 🛠️ Estrutura de Arquivos

```
scrum-markov-app/
├── dist/                    # Build de produção
│   ├── index.html          # Página principal
│   └── assets/             # JS e CSS otimizados
├── executar-local.bat      # Script Windows
├── executar-local.sh       # Script Linux/Mac
└── EXECUTAR-LOCAL.md       # Este arquivo
```

## 🔧 Solução de Problemas

### Porta já em uso:
```bash
serve -s dist -l 3001  # Use porta diferente
```

### Erro de permissão (Linux/Mac):
```bash
sudo npm install -g serve
```

### Cache do navegador:
- Pressione `Ctrl+F5` ou `Cmd+Shift+R` para recarregar

## 📱 Compatibilidade

- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Ubuntu 18.04+
- ✅ Chrome 90+
- ✅ Firefox 90+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎯 Performance

- **Tamanho total:** ~307 KB (gzipped)
- **Carregamento inicial:** < 2 segundos
- **Interface responsiva:** Desktop e mobile
- **Offline:** Funciona após primeiro carregamento

## 📞 Suporte

Se encontrar problemas:
1. Verifique se Node.js está instalado: `node --version`
2. Verifique conexão com internet para instalar dependências
3. Tente limpar cache: delete pasta `node_modules` e execute `npm install`

---

**Desenvolvido com ❤️ usando React + TypeScript + Vite**