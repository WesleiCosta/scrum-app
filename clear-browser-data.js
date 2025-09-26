// Script para limpar dados do localStorage da aplicação
// Execute no console do navegador: F12 > Console > Cole e execute

console.log('🧹 Limpando dados da aplicação Scrum-Markov...');

// Lista de chaves do localStorage da aplicação
const keys = [
  'scrum-markov-user',
  'scrum-markov-projects', 
  'scrum-markov-sprint-logs',
  'scrum-markov-transition-matrices'
];

// Limpar cada chave
let removedCount = 0;
keys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    removedCount++;
    console.log(`✅ Removido: ${key}`);
  }
});

// Limpar qualquer outra chave relacionada
for (let i = localStorage.length - 1; i >= 0; i--) {
  const key = localStorage.key(i);
  if (key && key.includes('scrum-markov')) {
    localStorage.removeItem(key);
    removedCount++;
    console.log(`✅ Removido (extra): ${key}`);
  }
}

console.log(`🎉 Limpeza concluída! ${removedCount} itens removidos.`);
console.log('🔄 Recarregue a página (F5) para reiniciar com dados limpos.');

// Recarregar automaticamente a página
setTimeout(() => {
  window.location.reload();
}, 2000);