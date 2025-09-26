# Contributing to Scrum-Markov App

Obrigado por considerar contribuir com o Scrum-Markov App! 🎉

## 📋 Código de Conduta

Este projeto segue um código de conduta. Ao participar, você deve aderir a este código.

## 🚀 Como Contribuir

### Reportando Bugs
1. Use o template de bug report
2. Inclua screenshots quando possível
3. Descreva os passos para reproduzir
4. Mencione seu ambiente (OS, browser, etc.)

### Sugerindo Funcionalidades
1. Use o template de feature request
2. Explique o problema que resolve
3. Considere o impacto nos cálculos de Markov
4. Forneça mockups se possível

### Desenvolvimento

#### Pré-requisitos
- Node.js 18+ 
- npm 9+
- Git

#### Setup Local
```bash
# Clone o repositório
git clone https://github.com/WesleiCosta/scrum-app.git
cd scrum-app

# Instale dependências
npm install

# Execute em desenvolvimento
npm run dev

# Execute testes
npm run build && npx tsc --noEmit
```

#### Fluxo de Trabalho
1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Faça commits: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push para branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

#### Padrões de Código
- Use TypeScript
- Siga as configurações do ESLint
- Mantenha coverage de testes
- Documente funcionalidades complexas
- Use conventional commits

#### Estrutura do Projeto
```
src/
├── components/     # Componentes React reutilizáveis
├── contexts/       # Context API (Auth, Project, Sprint)
├── pages/          # Páginas da aplicação
├── types/          # Definições TypeScript
├── utils/          # Utilitários (storage, markov, constants)
└── hooks/          # Hooks customizados (futuro)
```

#### Cálculos de Markov
- Matriz 5x5 para estados do projeto
- Validação rigorosa de transições
- Performance otimizada
- Testes de consistência matemática

## 📊 Pull Request Guidelines

### Checklist
- [ ] Código segue os padrões estabelecidos
- [ ] Build passa sem erros
- [ ] TypeScript compila sem warnings
- [ ] Funcionalidade testada manualmente
- [ ] Documentação atualizada (se necessário)
- [ ] Commits seguem padrão conventional

### Tipos de Commit
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação, não afeta lógica
- `refactor:` Refatoração de código
- `test:` Adiciona/modifica testes
- `chore:` Manutenção

## 🏆 Reconhecimento

Contribuidores serão listados no README e releases.

## 💬 Dúvidas?

Abra uma issue com a label `question` ou entre em contato.

---

Obrigado por contribuir! 🚀