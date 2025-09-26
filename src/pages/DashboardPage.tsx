import React, { useState, useMemo } from 'react';
import { useSprint } from '../contexts/SprintContext';
import { useProject } from '../contexts/ProjectContext';
import { ProjectState, UnifiedState, TransitionMatrix, StatePrediction } from '../types';
import { ScrumMarkovEngine, ScenarioAnalysisUtils } from '../utils/scrum-markov-engine';

const DashboardPage: React.FC = () => {
  const { sprintLogs } = useSprint();
  const { currentProject } = useProject();
  const [selectedDashboard, setSelectedDashboard] = useState<'executive' | 'statistical' | 'predictive'>('executive');

  // Estado para módulo What-If
  const [whatIfMatrix, setWhatIfMatrix] = useState<TransitionMatrix | null>(null);
  const [showWhatIfAnalysis, setShowWhatIfAnalysis] = useState(false);

  // Converter estados do sistema para estados unificados
  const converterParaEstadoUnificado = (state: ProjectState): UnifiedState => {
    switch (state) {
      case 'EXCELENTE':
      case 'BOM':
        return 'Saudável';
      case 'ESTÁVEL':
        return 'Em Risco';
      case 'RISCO':
      case 'CRÍTICO':
        return 'Crítico';
      default:
        return 'Em Risco';
    }
  };

  // Dados computados usando o motor Scrum-Markov
  const dadosComputados = useMemo(() => {
    const historicoEstados: UnifiedState[] = sprintLogs.map(log => 
      converterParaEstadoUnificado(log.finalState)
    );
    
    const estadoAtual: UnifiedState = sprintLogs.length > 0 
      ? converterParaEstadoUnificado(sprintLogs[sprintLogs.length - 1].finalState) 
      : 'Em Risco';
    
    // Usar parâmetro N do projeto ou default 10
    const windowSize = currentProject?.nValue || 10;
    
    const matrizTransicao: TransitionMatrix = historicoEstados.length >= 2 
      ? ScrumMarkovEngine.calculateDynamicTransitionMatrix(historicoEstados, windowSize)
      : [[1/3, 1/3, 1/3], [1/3, 1/3, 1/3], [1/3, 1/3, 1/3]];

    // Gerar previsões para as próximas 8 sprints
    const previsoes: StatePrediction[] = historicoEstados.length >= 1
      ? ScrumMarkovEngine.generateFuturePredictions(estadoAtual, matrizTransicao, 8)
      : [];

    return {
      historicoEstados,
      estadoAtual,
      matrizTransicao,
      previsoes,
      windowSize
    };
  }, [sprintLogs, currentProject]);

  const { historicoEstados, estadoAtual, matrizTransicao, previsoes, windowSize } = dadosComputados;

  const formatarProbabilidade = (prob: number): string => `${Math.round(prob * 100)}%`;

  // Análise What-If
  const analiseComparativa = useMemo(() => {
    if (!whatIfMatrix || !showWhatIfAnalysis) return null;
    
    return ScenarioAnalysisUtils.generateComparativePredictions(
      estadoAtual,
      matrizTransicao,
      whatIfMatrix,
      5
    );
  }, [estadoAtual, matrizTransicao, whatIfMatrix, showWhatIfAnalysis]);

  const editarMatrizWhatIf = (i: number, j: number, valor: string) => {
    const novoValor = parseFloat(valor) / 100; // Converter de % para decimal
    if (isNaN(novoValor) || novoValor < 0 || novoValor > 1) return;

    const novaMatriz = whatIfMatrix ? 
      whatIfMatrix.map(row => [...row]) : 
      matrizTransicao.map(row => [...row]);
    
    novaMatriz[i][j] = novoValor;
    
    // Normalizar a linha para manter propriedade estocástica
    const somaLinha = novaMatriz[i].reduce((sum, val) => sum + val, 0);
    if (somaLinha > 0) {
      novaMatriz[i] = novaMatriz[i].map(val => val / somaLinha);
    }
    
    setWhatIfMatrix(novaMatriz);
  };

  const getCoresEstado = (estado: UnifiedState) => {
    switch (estado) {
      case 'Saudável':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '✅' };
      case 'Em Risco':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '⚠️' };
      case 'Crítico':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🚨' };
    }
  };

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Scrum-Markov</h2>
        <p className="text-gray-600">Selecione um projeto para visualizar os dashboards preditivos.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">📊 Dashboard Scrum-Markov</h1>
          <p className="text-gray-600 mb-6">Metodologia preditiva para {currentProject.name}</p>
          
          {/* Seletor de Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { id: 'executive', title: '👔 Visualização Executiva', desc: 'Visão geral do estado de saúde' },
              { id: 'statistical', title: '📈 Análise Estatística', desc: 'Matriz de transição detalhada' },
              { id: 'predictive', title: '🔮 Insights Preditivos', desc: 'Previsões e recomendações' }
            ].map(dash => (
              <button
                key={dash.id}
                onClick={() => setSelectedDashboard(dash.id as any)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedDashboard === dash.id
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">{dash.title}</div>
                <div className="text-sm opacity-80">{dash.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Executivo */}
        {selectedDashboard === 'executive' && (
          <div className="space-y-8">
            
            {/* Medidor de Saúde */}
            <div className="bg-white p-8 rounded-xl shadow-lg border">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">🎯 Estado de Saúde Unificado</h2>
              
              <div className="flex justify-center mb-6">
                <div className={`w-56 h-56 rounded-full border-8 flex items-center justify-center ${getCoresEstado(estadoAtual).bg} ${getCoresEstado(estadoAtual).border}`}>
                  <div className="text-center">
                    <div className="text-5xl mb-3">{getCoresEstado(estadoAtual).icon}</div>
                    <div className={`text-2xl font-bold ${getCoresEstado(estadoAtual).text}`}>{estadoAtual}</div>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-gray-600">
                Sprint atual: {sprintLogs.length} | Baseado em {historicoEstados.length} sprints
              </p>
            </div>

            {/* KPIs */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
              <h3 className="text-xl font-bold text-gray-900 mb-6">📊 Indicadores-Chave</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{sprintLogs.length}</div>
                  <div className="text-sm text-gray-600">Sprints Total</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((historicoEstados.filter((e: UnifiedState) => e === 'Saudável').length / Math.max(historicoEstados.length, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa Saudável</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {Math.round((historicoEstados.filter((e: UnifiedState) => e === 'Em Risco').length / Math.max(historicoEstados.length, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa Risco</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {Math.round((historicoEstados.filter((e: UnifiedState) => e === 'Crítico').length / Math.max(historicoEstados.length, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa Crítica</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Estatístico */}
        {selectedDashboard === 'statistical' && (
          <div className="space-y-8">
            
            {/* Matriz de Transição */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
              <h2 className="text-xl font-bold text-gray-900 mb-6">🔢 Matriz de Transição</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-3 bg-gray-100">De ↓ / Para →</th>
                      {(['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).map(estado => (
                        <th key={estado} className={`border border-gray-300 p-3 ${getCoresEstado(estado).bg}`}>
                          {estado}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).map((fromState, i) => (
                      <tr key={fromState}>
                        <td className={`border border-gray-300 p-3 font-semibold ${getCoresEstado(fromState).bg}`}>
                          {fromState}
                        </td>
                        {matrizTransicao[i].map((value, j) => (
                          <td key={j} className="border border-gray-300 p-3 text-center"
                              style={{ backgroundColor: `rgba(59, 130, 246, ${value * 0.7})` }}>
                            {formatarProbabilidade(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Histórico de Transições */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
              <h3 className="text-xl font-bold text-gray-900 mb-6">🔄 Histórico de Transições</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {historicoEstados.length > 1 ? 
                  historicoEstados.slice(1).map((estado: UnifiedState, index: number) => {
                    const estadoAnterior = historicoEstados[index];
                    return (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">
                          Sprint {index + 1} → {index + 2}:
                        </span>
                        <span className={`px-3 py-1 rounded text-sm font-medium ${getCoresEstado(estadoAnterior).bg} ${getCoresEstado(estadoAnterior).text}`}>
                          {estadoAnterior}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className={`px-3 py-1 rounded text-sm font-medium ${getCoresEstado(estado).bg} ${getCoresEstado(estado).text}`}>
                          {estado}
                        </span>
                      </div>
                    );
                  })
                : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma transição registrada ainda
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Preditivo */}
        {selectedDashboard === 'predictive' && (
          <div className="space-y-8">
            
            {/* Controles do Dashboard Preditivo */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">� Dashboard Preditivo Avançado</h2>
                <button
                  onClick={() => setShowWhatIfAnalysis(!showWhatIfAnalysis)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    showWhatIfAnalysis 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {showWhatIfAnalysis ? '📊 Voltar Análise Padrão' : '🧪 Análise What-If'}
                </button>
              </div>
              
              {/* Informações do Modelo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{sprintLogs.length}</div>
                  <div className="text-sm text-gray-600">Sprints Histórico</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{windowSize}</div>
                  <div className="text-sm text-gray-600">Janela Deslizante (N)</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{previsoes.length}</div>
                  <div className="text-sm text-gray-600">Previsões Geradas</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${
                  sprintLogs.length < 6 ? 'bg-red-50' :
                  sprintLogs.length < 12 ? 'bg-yellow-50' : 'bg-green-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    sprintLogs.length < 6 ? 'text-red-600' :
                    sprintLogs.length < 12 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {sprintLogs.length < 6 ? 'Baixa' :
                     sprintLogs.length < 12 ? 'Média' : 'Alta'}
                  </div>
                  <div className="text-sm text-gray-600">Confiança Modelo</div>
                </div>
              </div>
            </div>

            {/* Previsões de Estados Futuros */}
            {previsoes.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-lg border">
                <h3 className="text-lg font-bold text-gray-900 mb-6">📈 Previsões Multi-Passo (S<sub>t+k</sub> = S<sub>t</sub> × P<sup>k</sup>)</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 p-3 bg-gray-100">Sprint Futura</th>
                        <th className="border border-gray-300 p-3 bg-green-50">P(Saudável)</th>
                        <th className="border border-gray-300 p-3 bg-yellow-50">P(Em Risco)</th>
                        <th className="border border-gray-300 p-3 bg-red-50">P(Crítico)</th>
                        <th className="border border-gray-300 p-3 bg-gray-100">Confiança</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previsoes.slice(0, 5).map((predicao) => {
                        const sprintNumber = sprintLogs.length + predicao.step;
                        return (
                          <tr key={predicao.step}>
                            <td className="border border-gray-300 p-3 font-semibold text-center">
                              Sprint {sprintNumber}
                            </td>
                            <td className="border border-gray-300 p-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div 
                                  className="w-16 h-4 bg-green-200 rounded"
                                  style={{ width: `${predicao.probabilities[0] * 64}px` }}
                                />
                                <span className="font-medium">{formatarProbabilidade(predicao.probabilities[0])}</span>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div 
                                  className="w-16 h-4 bg-yellow-200 rounded"
                                  style={{ width: `${predicao.probabilities[1] * 64}px` }}
                                />
                                <span className="font-medium">{formatarProbabilidade(predicao.probabilities[1])}</span>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div 
                                  className="w-16 h-4 bg-red-200 rounded"
                                  style={{ width: `${predicao.probabilities[2] * 64}px` }}
                                />
                                <span className="font-medium">{formatarProbabilidade(predicao.probabilities[2])}</span>
                              </div>
                            </td>
                            <td className={`border border-gray-300 p-3 text-center font-medium ${
                              predicao.confidence === 'Alta' ? 'text-green-600' :
                              predicao.confidence === 'Média' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {predicao.confidence}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Módulo What-If Analysis */}
            {showWhatIfAnalysis && (
              <div className="bg-white p-6 rounded-xl shadow-lg border">
                <h3 className="text-lg font-bold text-gray-900 mb-6">🧪 Análise de Cenários "What-If"</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Editor de Matriz */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Editar Matriz de Transição Hipotética</h4>
                    <div className="space-y-2">
                      {(['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).map((fromState, i) => (
                        <div key={fromState} className="flex items-center space-x-2">
                          <div className={`w-20 text-sm font-medium p-2 rounded ${getCoresEstado(fromState).bg}`}>
                            {fromState}
                          </div>
                          <span className="text-gray-400">→</span>
                          {(whatIfMatrix || matrizTransicao)[i].map((value, j) => (
                            <input
                              key={j}
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={Math.round(value * 100)}
                              onChange={(e) => editarMatrizWhatIf(i, j, e.target.value)}
                              className="w-16 p-1 border rounded text-center text-sm"
                            />
                          ))}
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => setWhatIfMatrix(matrizTransicao.map(row => [...row]))}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                      >
                        Resetar
                      </button>
                      <button
                        onClick={() => {
                          if (whatIfMatrix) {
                            const normalized = ScrumMarkovEngine.normalizeMatrix(whatIfMatrix);
                            setWhatIfMatrix(normalized);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Normalizar
                      </button>
                    </div>
                  </div>

                  {/* Comparação de Resultados */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Impacto do Cenário</h4>
                    {analiseComparativa && (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-3">
                          Comparando previsões: <strong>Cenário Base</strong> vs <strong>Cenário Hipotético</strong>
                        </div>
                        
                        {analiseComparativa.scenario.slice(0, 3).map((cenario, index) => {
                          const base = analiseComparativa.base[index];
                          const sprintNum = sprintLogs.length + cenario.step;
                          
                          return (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="font-medium mb-2">Sprint {sprintNum}</div>
                              
                              {(['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).map((estado, stateIndex) => {
                                const probBase = base.probabilities[stateIndex];
                                const probCenario = cenario.probabilities[stateIndex];
                                const diferenca = probCenario - probBase;
                                
                                return (
                                  <div key={estado} className="flex justify-between items-center text-sm">
                                    <span>{estado}:</span>
                                    <div className="flex items-center space-x-2">
                                      <span>{formatarProbabilidade(probBase)}</span>
                                      <span className="text-gray-400">→</span>
                                      <span>{formatarProbabilidade(probCenario)}</span>
                                      <span className={`font-medium ${
                                        Math.abs(diferenca) < 0.01 ? 'text-gray-500' :
                                        diferenca > 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        ({diferenca > 0 ? '+' : ''}{formatarProbabilidade(diferenca)})
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Alertas e Recomendações */}
            {sprintLogs.length >= 2 && (
              <div className="bg-white p-6 rounded-xl shadow-lg border">
                <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Alertas Automáticos e Recomendações</h3>
                
                <div className="space-y-3">
                  {/* Alerta baseado no estado atual */}
                  {estadoAtual === 'Crítico' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-red-600">🚨</span>
                        <span className="font-semibold text-red-800">Alerta Crítico</span>
                      </div>
                      <p className="text-red-700 mt-2">
                        Projeto em estado crítico. Recomenda-se intervenção imediata para mitigar riscos.
                      </p>
                    </div>
                  )}
                  
                  {/* Alerta baseado em tendência */}
                  {previsoes.length > 0 && previsoes[0].probabilities[2] > 0.5 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-600">📈</span>
                        <span className="font-semibold text-orange-800">Tendência de Risco</span>
                      </div>
                      <p className="text-orange-700 mt-2">
                        Alta probabilidade ({formatarProbabilidade(previsoes[0].probabilities[2])}) 
                        de transição para estado Crítico na próxima sprint.
                      </p>
                    </div>
                  )}
                  
                  {/* Recomendação baseada em dados insuficientes */}
                  {sprintLogs.length < windowSize && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">📊</span>
                        <span className="font-semibold text-blue-800">Calibração do Modelo</span>
                      </div>
                      <p className="text-blue-700 mt-2">
                        {windowSize - sprintLogs.length} sprints adicionais necessários para 
                        atingir confiança total do modelo preditivo.
                      </p>
                    </div>
                  )}
                  
                  {sprintLogs.length === 0 && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <div className="text-4xl mb-2">🎯</div>
                      <h4 className="font-semibold text-gray-800 mb-2">Iniciar Análise Preditiva</h4>
                      <p className="text-gray-600">
                        Registre a primeira sprint para começar a construir o modelo preditivo Scrum-Markov.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardPage;
