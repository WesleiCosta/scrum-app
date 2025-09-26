import React, { useEffect, useState } from 'react';
import { useSprint } from '../contexts/SprintContext';
import { useProject } from '../contexts/ProjectContext';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { APP_CONFIG } from '../utils/constants';

interface TimelineData {
  sprint: string;
  state: number;
  date: string;
  stateName: string;
}

const DashboardPage: React.FC = () => {
  const { sprintLogs, projections, calculateProjections } = useSprint();
  const { currentProject } = useProject();
  
  const [timelineData, setTimelineData] = useState<TimelineData[] | null>(null);

  // Mapear estados para números
  const stateToNumber = {
    'CRÍTICO': 1,
    'RISCO': 2,
    'ESTÁVEL': 3,
    'BOM': 4,
    'EXCELENTE': 5
  };

  const numberToState = {
    1: 'CRÍTICO',
    2: 'RISCO', 
    3: 'ESTÁVEL',
    4: 'BOM',
    5: 'EXCELENTE'
  };

  // Função auxiliar para obter o estado mais provável
  const getMostLikelyStateFromProbs = (probabilities: any) => {
    if (!probabilities || typeof probabilities !== 'object') return 'ESTÁVEL';
    
    const states = Object.keys(probabilities);
    let maxProb = -1;
    let mostLikely = 'ESTÁVEL';
    
    states.forEach(state => {
      const prob = probabilities[state];
      if (typeof prob === 'number' && !isNaN(prob) && prob > maxProb) {
        maxProb = prob;
        mostLikely = state;
      }
    });
    
    return mostLikely;
  };

  // Estado atual do projeto
  const currentState = sprintLogs.length > 0 ? sprintLogs[sprintLogs.length - 1].finalState : 'ESTÁVEL';

  useEffect(() => {
    if (sprintLogs.length > 0) {
      // Criar dados para timeline
      const timeline = sprintLogs.map((log: any) => ({
        sprint: log.sprintName,
        state: stateToNumber[log.finalState as keyof typeof stateToNumber] || 3,
        date: log.endDate,
        stateName: log.finalState
      }));
      setTimelineData(timeline);

      // Calcular projeções se houver dados suficientes
      if (sprintLogs.length >= APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION && calculateProjections) {
        const currentState = sprintLogs[sprintLogs.length - 1].finalState;
        calculateProjections(currentState as any);
      }
    } else {
      setTimelineData(null);
    }
  }, [sprintLogs, calculateProjections]);



  const hasInsufficientData = sprintLogs.length < APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION;
  const currentStateEmoji = {
    'CRÍTICO': '🔴',
    'RISCO': '🟠', 
    'ESTÁVEL': '🟡',
    'BOM': '🔵',
    'EXCELENTE': '🟢'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard - Análise Markov
              </h1>
              <p className="text-gray-600">
                {currentProject ? `Projeto: ${currentProject.name}` : 'Nenhum projeto selecionado'} • 
                {sprintLogs.length} sprints registrados
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <div className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${
                currentState === 'CRÍTICO' ? 'bg-red-100 text-red-800' :
                currentState === 'RISCO' ? 'bg-orange-100 text-orange-800' :
                currentState === 'ESTÁVEL' ? 'bg-yellow-100 text-yellow-800' :
                currentState === 'BOM' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {currentStateEmoji[currentState as keyof typeof currentStateEmoji]} Estado Atual: {currentState}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Coluna Principal - Timeline e Previsões */}
          <div className="xl:col-span-3 space-y-8">
            
            {/* Saúde do Projeto */}
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                <h2 className="ml-3 text-xl font-bold text-gray-900">Saúde do Projeto</h2>
              </div>

              {sprintLogs.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Estado Atual */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-900 mb-4">📊 Estado Atual</h3>
                    <div className="text-center">
                      <div className={`inline-flex items-center px-4 py-2 rounded-lg font-medium text-lg mb-3 ${
                        currentState === 'CRÍTICO' ? 'bg-red-100 text-red-800' :
                        currentState === 'RISCO' ? 'bg-orange-100 text-orange-800' :
                        currentState === 'ESTÁVEL' ? 'bg-yellow-100 text-yellow-800' :
                        currentState === 'BOM' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {currentStateEmoji[currentState as keyof typeof currentStateEmoji]} {currentState}
                      </div>
                      <p className="text-sm text-gray-600">
                        Sprint: {sprintLogs[sprintLogs.length - 1]?.sprintName}
                      </p>
                    </div>
                  </div>

                  {/* Análise Histórica */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-900 mb-4">📈 Histórico & Tendências</h3>
                    {timelineData && timelineData.length >= 2 && (
                      <div className="space-y-3">
                        {(() => {
                          const first = timelineData[0].state;
                          const last = timelineData[timelineData.length - 1].state;
                          const trend = last - first;
                          const successRate = Math.round((sprintLogs.filter(log => ['EXCELENTE', 'BOM'].includes(log.finalState)).length / sprintLogs.length) * 100);
                          
                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Tendência Geral</span>
                                <span className={`font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {trend > 0 ? '📈 Melhorando' : trend < 0 ? '📉 Degradando' : '➡️ Estável'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Taxa de Sucesso</span>
                                <span className="font-medium text-green-600">{successRate}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total de Sprints</span>
                                <span className="font-medium text-gray-900">{sprintLogs.length}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Insights de Previsão */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="font-semibold text-gray-900 mb-4">🔮 Insights da Previsão</h3>

                        {hasInsufficientData ? (
                          <div className="space-y-3">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <span className="text-yellow-600">⚠️</span>
                                <span className="text-sm font-medium text-yellow-800">Dados Insuficientes</span>
                              </div>
                              <p className="text-sm text-yellow-700 mt-2">
                                Adicione pelo menos {APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION} sprints para gerar previsões baseadas em Cadeia de Markov.
                              </p>
                              <p className="text-xs text-yellow-600 mt-1">
                                Sprints atuais: {sprintLogs.length} / {APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION} necessários
                              </p>
                            </div>
                          </div>
                        ) : projections.length > 0 ? (
                          <div className="space-y-3">
                          {(() => {
                            const nextSprint = projections[0];
                            const mostLikely = getMostLikelyStateFromProbs(nextSprint?.probabilities);
                            const confidence = nextSprint?.probabilities ? Math.max(...Object.values(nextSprint.probabilities).filter(v => typeof v === 'number')) : 0;                          
                            return (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Próximo Estado</span>
                                <span className={`font-medium ${
                                  mostLikely === 'CRÍTICO' ? 'text-red-600' :
                                  mostLikely === 'RISCO' ? 'text-orange-600' :
                                  mostLikely === 'ESTÁVEL' ? 'text-yellow-600' :
                                  mostLikely === 'BOM' ? 'text-blue-600' :
                                  'text-green-600'
                                }`}>
                                  {mostLikely}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Confiança</span>
                                <span className="font-medium text-gray-900">{Math.round(confidence * 100)}%</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                {confidence > 0.7 ? '✅ Alta confiança' : confidence > 0.5 ? '⚠️ Confiança moderada' : '❓ Baixa confiança'}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">🔄</span>
                          <span className="text-sm font-medium text-blue-800">Calculando Previsões...</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-2">
                          As projeções estão sendo processadas com base nos dados históricos.
                        </p>
                      </div>
                    )}
                  </div>
                  
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Nenhum sprint registrado ainda</p>
                  <a href="/sprints" className="btn btn-primary">Adicionar Primeiro Sprint</a>
                </div>
              )}
            </section>

            {/* Timeline de Evolução */}
            {timelineData && timelineData.length > 0 && (
              <section className="bg-white p-6 rounded-xl shadow-lg border">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                  <h2 className="ml-3 text-xl font-bold text-gray-900">Timeline de Evolução</h2>
                  <span className="ml-auto text-sm text-gray-500">Últimos {timelineData.length} sprints</span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="stateGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="sprint" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                      />
                      <YAxis 
                        domain={[1, 5]}
                        tickFormatter={(value) => numberToState[value as keyof typeof numberToState] || ''}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value: number) => [
                          `${currentStateEmoji[numberToState[value as keyof typeof numberToState] as keyof typeof currentStateEmoji]} ${numberToState[value as keyof typeof numberToState]}`, 
                          'Estado'
                        ]}
                        labelFormatter={(label) => `Sprint: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="state" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fill="url(#stateGradient)"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#1d4ed8', strokeWidth: 2, stroke: '#ffffff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Seção 3 - Insights da Previsão */}
            <section className="bg-white p-6 rounded-xl shadow-lg border">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                <h2 className="ml-3 text-xl font-bold text-gray-900">Insights da Previsão</h2>
                <span className="ml-auto text-sm text-gray-500">Análise Probabilística Markov</span>
              </div>

              {hasInsufficientData ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Dados Insuficientes</h3>
                  <p className="text-gray-600 mb-4">
                    Adicione pelo menos <strong>{APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION} sprints</strong> para gerar insights baseados em Cadeia de Markov
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 inline-block">
                    <p className="text-sm text-yellow-800">
                      📊 Sprints atuais: <strong>{sprintLogs.length}</strong> / {APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION} necessários
                    </p>
                  </div>
                  <div className="mt-6">
                    <a
                      href="/sprints"
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      📝 Adicionar Sprints
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  
                  {/* Análise de Probabilidades Detalhada */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Matriz de Transição Visual */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                        🧮 Análise de Transições
                      </h3>
                      {(() => {
                        // Calcular estatísticas das transições
                        const stateTransitions: Record<string, number> = {};
                        for (let i = 0; i < sprintLogs.length - 1; i++) {
                          const from = sprintLogs[i].finalState;
                          const to = sprintLogs[i + 1].finalState;
                          const key = `${from}->${to}`;
                          stateTransitions[key] = (stateTransitions[key] || 0) + 1;
                        }
                        
                        const totalTransitions = Object.values(stateTransitions).reduce((a: number, b: number) => a + b, 0);
                        const topTransitions = Object.entries(stateTransitions)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .slice(0, 3);
                        
                        return (
                          <div className="space-y-3">
                            <div className="text-sm text-blue-700">
                              <strong>Total de transições analisadas:</strong> {totalTransitions}
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-blue-800">Padrões mais frequentes:</h4>
                              {topTransitions.map(([transition, count], index) => {
                                const [from, to] = transition.split('->');
                                const percentage = Math.round((count / totalTransitions) * 100);
                                return (
                                  <div key={transition} className="flex justify-between items-center bg-white p-2 rounded">
                                    <span className="text-sm text-gray-700">
                                      {index + 1}. {from} → {to}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">{count}x</span>
                                      <span className="text-sm font-medium text-blue-600">{percentage}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()
                      }
                    </div>

                    {/* Previsão Detalhada */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                      <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                        🔮 Previsão Próximo Sprint
                      </h3>
                      {projections.length > 0 && projections[0] ? (
                        <div className="space-y-4">
                          {(() => {
                            const nextProjection = projections[0];
                            const probabilities = nextProjection.probabilities || {};
                            const stateOrder = ['CRÍTICO', 'RISCO', 'ESTÁVEL', 'BOM', 'EXCELENTE'];
                            const mostLikely = getMostLikelyStateFromProbs(probabilities);
                            const probValues = Object.values(probabilities).filter(v => typeof v === 'number' && !isNaN(v as number));
                            const maxProb = probValues.length > 0 ? Math.max(...(probValues as number[])) : 0;
                            
                            return (
                              <>
                                <div className="bg-white p-4 rounded-lg">
                                  <div className="text-center mb-3">
                                    <div className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-lg ${
                                      mostLikely === 'CRÍTICO' ? 'bg-red-100 text-red-800' :
                                      mostLikely === 'RISCO' ? 'bg-orange-100 text-orange-800' :
                                      mostLikely === 'ESTÁVEL' ? 'bg-yellow-100 text-yellow-800' :
                                      mostLikely === 'BOM' ? 'bg-blue-100 text-blue-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {currentStateEmoji[mostLikely as keyof typeof currentStateEmoji]} {mostLikely}
                                    </div>
                                  </div>
                                  <p className="text-center text-sm text-gray-600 mb-3">
                                    Confiança: <strong>{Math.round(maxProb * 100)}%</strong>
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-green-800">Distribuição de Probabilidades:</h4>
                                  {stateOrder.map(state => {
                                    const prob = (probabilities as any)[state];
                                    const numericProb = typeof prob === 'number' && !isNaN(prob) ? prob : 0;
                                    const percentage = Math.max(0, Math.min(100, Math.round(numericProb * 100)));
                                    return (
                                      <div key={state} className="flex items-center space-x-3">
                                        <span className="text-xs w-16 text-gray-600">{state}</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full ${
                                              state === 'CRÍTICO' ? 'bg-red-500' :
                                              state === 'RISCO' ? 'bg-orange-500' :
                                              state === 'ESTÁVEL' ? 'bg-yellow-500' :
                                              state === 'BOM' ? 'bg-blue-500' :
                                              'bg-green-500'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-xs font-medium w-10 text-right">{percentage}%</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()
                          }
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <span className="text-2xl mb-2 block">�</span>
                          {sprintLogs.length < 2 ? 
                            'Adicione mais sprints para gerar previsões' : 
                            'Processando dados...'
                          }
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Insights Estratégicos */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                      💡 Insights Estratégicos
                    </h3>
                    {(() => {
                      if (projections.length === 0) return null;
                      
                      const nextProjection = projections[0];
                      const probabilities = nextProjection.probabilities || {};
                      const mostLikely = getMostLikelyStateFromProbs(probabilities);
                      const currentStateValue = stateToNumber[currentState] || 3;
                      const predictedStateValue = (stateToNumber as any)[mostLikely] || 3;
                      const trend = predictedStateValue - currentStateValue;
                      
                      // Calcular risco e oportunidades
                      const riskStates = ['CRÍTICO', 'RISCO'];
                      const opportunityStates = ['BOM', 'EXCELENTE'];
                      const riskProbability = riskStates.reduce((sum, state) => sum + ((probabilities as any)[state] || 0), 0);
                      const opportunityProbability = opportunityStates.reduce((sum, state) => sum + ((probabilities as any)[state] || 0), 0);
                      
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          
                          {/* Tendência */}
                          <div className="bg-white p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">
                                {trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️'}
                              </span>
                              <h4 className="font-medium text-gray-800">Tendência</h4>
                            </div>
                            <p className={`text-sm ${
                              trend > 0 ? 'text-green-600' : 
                              trend < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {trend > 0 ? 'Melhoria esperada' : 
                               trend < 0 ? 'Deterioração possível' : 
                               'Manutenção do estado'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Variação: {trend > 0 ? '+' : ''}{trend} níveis
                            </p>
                          </div>

                          {/* Análise de Risco */}
                          <div className="bg-white p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">⚠️</span>
                              <h4 className="font-medium text-gray-800">Análise de Risco</h4>
                            </div>
                            <p className={`text-sm font-medium ${
                              riskProbability > 0.5 ? 'text-red-600' :
                              riskProbability > 0.3 ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {Math.round(riskProbability * 100)}% de risco
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {riskProbability > 0.5 ? 'Alto risco - ação necessária' :
                               riskProbability > 0.3 ? 'Risco moderado - monitorar' :
                               'Baixo risco - situação controlada'}
                            </p>
                          </div>

                          {/* Oportunidades */}
                          <div className="bg-white p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">🎯</span>
                              <h4 className="font-medium text-gray-800">Oportunidades</h4>
                            </div>
                            <p className={`text-sm font-medium ${
                              opportunityProbability > 0.5 ? 'text-green-600' :
                              opportunityProbability > 0.3 ? 'text-blue-600' :
                              'text-gray-600'
                            }`}>
                              {Math.round(opportunityProbability * 100)}% de melhoria
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {opportunityProbability > 0.5 ? 'Alta chance de sucesso' :
                               opportunityProbability > 0.3 ? 'Oportunidade moderada' :
                               'Foco na estabilização'}
                            </p>
                          </div>
                          
                        </div>
                      );
                    })()
                    }
                  </div>

                </div>
              )}
            </section>

            {/* Previsões */}
            {!hasInsufficientData && projections.length > 0 && (
              <section className="bg-white p-6 rounded-xl shadow-lg border">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                  <h2 className="ml-3 text-xl font-bold text-gray-900">Previsões de Estados Futuras</h2>
                  <span className="ml-auto text-sm text-gray-500">Próximas 3 sprints</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {projections.map((projection, index) => {
                    const mostLikely = getMostLikelyStateFromProbs(projection.probabilities);
                    const confidence = Math.max(...Object.values(projection.probabilities).filter((v: unknown) => typeof v === 'number') as number[]);
                    
                    return (
                      <div key={index} className="bg-gray-50 p-6 rounded-lg">
                        <div className="text-center mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">Sprint {projection.sprint}</h4>
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