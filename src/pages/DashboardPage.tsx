import React from 'react';
import { useSprint } from '../contexts/SprintContext';
import { useProject } from '../contexts/ProjectContext';
import { APP_CONFIG } from '../utils/constants';

const DashboardPage: React.FC = () => {
  const { sprintLogs, projections } = useSprint();
  const { currentProject } = useProject();

  // Função auxiliar para obter o estado mais provável
  const getMostLikelyStateFromProbs = (probabilities: any) => {
    if (!probabilities || typeof probabilities !== 'object') return 'ESTÁVEL';
    
    // Usar estados válidos do projeto atual
    const validStates = currentProject?.stateDefinitions.map(def => def.id) || ['CRÍTICO', 'RISCO', 'ESTÁVEL', 'BOM', 'EXCELENTE'];
    let maxProb = -1;
    let mostLikely = 'ESTÁVEL';
    
    Object.entries(probabilities).forEach(([state, prob]) => {
      if (validStates.includes(state as any) && typeof prob === 'number' && !isNaN(prob) && prob >= 0 && prob <= 1 && prob > maxProb) {
        maxProb = prob;
        mostLikely = state as any;
      }
    });
    
    return mostLikely;
  };

  // Estado atual do projeto
  const currentState = sprintLogs.length > 0 ? sprintLogs[sprintLogs.length - 1].finalState : 'ESTÁVEL';
  
  const hasInsufficientData = sprintLogs.length < APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION;

  const currentStateEmoji = {
    'EXCELENTE': '🌟',
    'BOM': '✅', 
    'ESTÁVEL': '⚖️',
    'RISCO': '⚠️',
    'CRÍTICO': '🚨'
  };

  // Se não há projeto, mostrar mensagem
  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard
        </h2>
        <p className="text-gray-600">
          Selecione um projeto para visualizar o dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard</h1>
          <p className="text-gray-600 mt-2">Análise preditiva com Cadeias de Markov para {currentProject.name}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Conteúdo Principal */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Estado Atual */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Estado Atual do Projeto</h2>
              {sprintLogs.length > 0 ? (
                <div className="text-center">
                  <div className={`inline-flex items-center px-6 py-4 rounded-2xl text-2xl font-bold mb-4 ${
                    currentState === 'CRÍTICO' ? 'bg-red-100 text-red-800' :
                    currentState === 'RISCO' ? 'bg-orange-100 text-orange-800' :
                    currentState === 'ESTÁVEL' ? 'bg-yellow-100 text-yellow-800' :
                    currentState === 'BOM' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {currentStateEmoji[currentState as keyof typeof currentStateEmoji]} {currentState}
                  </div>
                  <p className="text-gray-600">
                    Baseado no último sprint: {sprintLogs[sprintLogs.length - 1].sprintName}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📈</div>
                  <p className="text-gray-600">Nenhum sprint registrado ainda.</p>
                  <p className="text-sm text-gray-500">Adicione sprints para ver análises preditivas.</p>
                </div>
              )}
            </div>

            {/* Dados Insuficientes */}
            {hasInsufficientData && sprintLogs.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                <h3 className="font-bold text-blue-900 mb-2">🔮 Previsões Indisponíveis</h3>
                <p className="text-blue-800">
                  São necessários pelo menos {APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION} sprints para gerar previsões precisas. 
                  Você tem {sprintLogs.length} sprint{sprintLogs.length !== 1 ? 's' : ''}.
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Continue registrando sprints para desbloquear análises preditivas com Cadeias de Markov.
                </p>
              </div>
            )}

            {/* Projeções Futuras */}
            {projections.length > 0 && (
              <section className="bg-white p-6 rounded-xl shadow-lg border">
                <h2 className="text-xl font-bold text-gray-900 mb-6">🔮 Projeções Futuras</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {projections.map((projection, index) => {
                    const mostLikely = getMostLikelyStateFromProbs(projection.probabilities);
                    const confidence = Math.max(...Object.values(projection.probabilities));
                    
                    return (
                      <div key={projection.sprint} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="text-center mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">{projection.sprint}</h4>
                          <p className="text-sm text-gray-500">
                            {index === 0 ? 'Próxima Sprint' : `Em ${index + 1} sprints`}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className={`inline-flex items-center px-3 py-2 rounded-lg font-medium mb-3 ${
                            mostLikely === 'CRÍTICO' ? 'bg-red-100 text-red-800' :
                            mostLikely === 'RISCO' ? 'bg-orange-100 text-orange-800' :
                            mostLikely === 'ESTÁVEL' ? 'bg-yellow-100 text-yellow-800' :
                            mostLikely === 'BOM' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {currentStateEmoji[mostLikely as keyof typeof currentStateEmoji]} {mostLikely}
                          </div>
                          <p className="text-sm text-gray-600">
                            Confiança: {Math.round(confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Ações Rápidas */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
              <h3 className="font-bold text-gray-900 mb-4">⚡ Ações Rápidas</h3>
              <div className="space-y-3">
                <a
                  href="/sprints"
                  className="block w-full p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center font-medium"
                >
                  📝 Novo Sprint
                </a>
                <a
                  href="/projects"
                  className="block w-full p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-center font-medium"
                >
                  ⚙️ Configurações
                </a>
                <button
                  onClick={() => window.print()}
                  className="block w-full p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-center font-medium"
                >
                  🖨️ Relatório
                </button>
              </div>
            </div>

            {/* Estatísticas */}
            {sprintLogs.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-lg border">
                <h3 className="font-bold text-gray-900 mb-4">📊 Estatísticas</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Sprints</span>
                    <span className="font-semibold text-gray-900">{sprintLogs.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxa de Sucesso</span>
                    <span className="font-semibold text-green-600">
                      {Math.round((sprintLogs.filter(log => ['EXCELENTE', 'BOM'].includes(log.finalState)).length / sprintLogs.length) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Precisa Atenção</span>
                    <span className="font-semibold text-orange-600">
                      {Math.round((sprintLogs.filter(log => ['RISCO', 'CRÍTICO'].includes(log.finalState)).length / sprintLogs.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status dos Dados */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
              <h3 className="font-bold text-gray-900 mb-4">🔍 Status dos Dados</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sprints Registrados</span>
                  <span className="font-medium text-gray-900">{sprintLogs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Min. para Previsão</span>
                  <span className="font-medium text-gray-900">{APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Previsões Ativas</span>
                  <span className={`font-medium ${projections.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    {projections.length > 0 ? '✅ Sim' : '❌ Não'}
                  </span>
                </div>
                {hasInsufficientData && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      Adicione mais {APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION - sprintLogs.length} sprints para ativar previsões
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;