import React, { useState, useEffect } from 'react';
import { useSprint } from '../contexts/SprintContext';
import { useProject } from '../contexts/ProjectContext';
import { 
  calculateTransitionMatrixDetailed, 
  calculateProjectionData, 
  getStateNames, 
  getHighRiskStates,
  formatProbability,
  MatrixInfo,
  ProjectionData
} from '../utils/markov';
import { ProjectState } from '../types';

const DashboardPage: React.FC = () => {
  const { sprintLogs } = useSprint();
  const { currentProject } = useProject();
  const [selectedState, setSelectedState] = useState<ProjectState>('ESTÁVEL');
  const [matrixInfo, setMatrixInfo] = useState<MatrixInfo | null>(null);
  const [projectionData, setProjectionData] = useState<ProjectionData | null>(null);

  // RF-04: Recalcular matriz automaticamente quando sprints mudarem
  useEffect(() => {
    if (sprintLogs.length >= 2) {
      const newMatrixInfo = calculateTransitionMatrixDetailed(sprintLogs);
      setMatrixInfo(newMatrixInfo);
    } else {
      setMatrixInfo(null);
    }
  }, [sprintLogs]);

  // RF-05: Recalcular projeções quando matriz ou estado selecionado mudarem
  useEffect(() => {
    if (matrixInfo && matrixInfo.matrix) {
      const newProjectionData = calculateProjectionData(selectedState, matrixInfo.matrix);
      setProjectionData(newProjectionData);
    } else {
      setProjectionData(null);
    }
  }, [matrixInfo, selectedState]);

  // Inicializar estado selecionado com último sprint
  useEffect(() => {
    if (sprintLogs.length > 0) {
      setSelectedState(sprintLogs[sprintLogs.length - 1].finalState);
    }
  }, [sprintLogs]);

  const states = getStateNames();
  const highRiskStates = getHighRiskStates();
  const hasInsufficientData = sprintLogs.length < 2;

  const getStateColor = (state: string, isHighRisk = false) => {
    if (isHighRisk) return 'bg-red-100 text-red-800 border-red-200';
    
    const colors: { [key: string]: string } = {
      'EXCELENTE': 'bg-green-100 text-green-800 border-green-200',
      'BOM': 'bg-blue-100 text-blue-800 border-blue-200',
      'ESTÁVEL': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'RISCO': 'bg-orange-100 text-orange-800 border-orange-200',
      'CRÍTICO': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[state] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Selecione um projeto para visualizar o dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard Preditivo</h1>
          <p className="text-gray-600 mt-2">Análise Markoviana para {currentProject.name}</p>
        </div>

        {hasInsufficientData ? (
          <div className="bg-white p-8 rounded-xl shadow-lg border text-center">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Dados Insuficientes</h2>
            <p className="text-gray-600 mb-4">
              São necessários pelo menos 2 sprints para calcular a matriz de transição.
            </p>
            <p className="text-sm text-gray-500">
              Sprints registrados: {sprintLogs.length}/2 mínimos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* RF-05: Seletor de Estado Atual */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Estado Atual do Projeto</h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Selecione o estado atual para análise preditiva:
                </label>
                <select 
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value as ProjectState)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <div className="text-center mt-4">
                  <span className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold ${getStateColor(selectedState)}`}>
                    {selectedState}
                  </span>
                </div>
              </div>
            </div>

            {/* RF-05: Matriz de Transição 5x5 */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🔢 Matriz de Transição 5x5</h2>
              {matrixInfo && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2 font-semibold">De \ Para</th>
                        {states.map(state => (
                          <th key={state} className={`text-center p-2 text-xs font-semibold ${getStateColor(state, highRiskStates.includes(state))}`}>
                            {state.slice(0, 3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {states.map((fromState, i) => (
                        <tr key={fromState} className="border-t">
                          <td className={`p-2 font-semibold text-xs ${getStateColor(fromState, highRiskStates.includes(fromState))}`}>
                            {fromState.slice(0, 3)}
                          </td>
                          {states.map((toState, j) => {
                            const value = matrixInfo.matrix[i][j];
                            const isHighRisk = highRiskStates.includes(toState);
                            return (
                              <td key={toState} className={`text-center p-2 text-xs ${isHighRisk && value > 0.3 ? 'bg-red-50 font-bold text-red-700' : ''}`}>
                                {formatProbability(value)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RF-05: Projeções para 3 Sprints */}
            <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-lg border">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🔮 Projeções para Próximos 3 Sprints</h2>
              {projectionData && (
                <div className="space-y-6">
                  {/* Tabela de Probabilidades */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-3 font-semibold">Sprint</th>
                          {states.map(state => (
                            <th key={state} className={`text-center p-3 ${getStateColor(state, highRiskStates.includes(state))}`}>
                              {state}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t bg-blue-50">
                          <td className="p-3 font-semibold">Atual</td>
                          {states.map(state => (
                            <td key={state} className="text-center p-3 font-medium">
                              {formatProbability(projectionData.current[state])}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 font-semibold">Sprint +1</td>
                          {states.map(state => {
                            const value = projectionData.sprint1[state];
                            const isHighRisk = highRiskStates.includes(state) && value > 0.3;
                            return (
                              <td key={state} className={`text-center p-3 ${isHighRisk ? 'bg-red-100 font-bold text-red-700' : 'font-medium'}`}>
                                {formatProbability(value)}
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 font-semibold">Sprint +2</td>
                          {states.map(state => {
                            const value = projectionData.sprint2[state];
                            const isHighRisk = highRiskStates.includes(state) && value > 0.3;
                            return (
                              <td key={state} className={`text-center p-3 ${isHighRisk ? 'bg-red-100 font-bold text-red-700' : 'font-medium'}`}>
                                {formatProbability(value)}
                              </td>
                            );
                          })}
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 font-semibold">Sprint +3</td>
                          {states.map(state => {
                            const value = projectionData.sprint3[state];
                            const isHighRisk = highRiskStates.includes(state) && value > 0.3;
                            return (
                              <td key={state} className={`text-center p-3 ${isHighRisk ? 'bg-red-100 font-bold text-red-700' : 'font-medium'}`}>
                                {formatProbability(value)}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* RF-06: Gráfico de Evolução das Probabilidades */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Evolução das Probabilidades</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {states.map(state => {
                        const data = [
                          projectionData.current[state],
                          projectionData.sprint1[state], 
                          projectionData.sprint2[state],
                          projectionData.sprint3[state]
                        ];
                        const maxValue = Math.max(...data);
                        const isHighRisk = highRiskStates.includes(state);
                        
                        return (
                          <div key={state} className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`font-medium ${isHighRisk ? 'text-red-600' : 'text-gray-700'}`}>
                                {state}
                              </span>
                              <span className="text-sm text-gray-500">
                                Máx: {formatProbability(maxValue)}
                              </span>
                            </div>
                            <div className="flex items-end space-x-2 h-16">
                              {data.map((value, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                  <div 
                                    className={`w-full ${isHighRisk && value > 0.3 ? 'bg-red-400' : state === 'EXCELENTE' ? 'bg-green-400' : state === 'BOM' ? 'bg-blue-400' : state === 'ESTÁVEL' ? 'bg-yellow-400' : 'bg-gray-400'} rounded-t transition-all duration-500`}
                                    style={{ 
                                      height: `${Math.max(value * 60, 2)}px`,
                                      opacity: value === 0 ? 0.3 : 0.8 
                                    }}
                                    title={`${['Atual', 'S+1', 'S+2', 'S+3'][index]}: ${formatProbability(value)}`}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">
                                    {['Atual', 'S+1', 'S+2', 'S+3'][index]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informações da Matriz */}
        {matrixInfo && (
          <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Informações da Matriz</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{matrixInfo.totalTransitions}</div>
                <div className="text-gray-600">Transições Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{sprintLogs.length}</div>
                <div className="text-gray-600">Sprints Analisados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {((matrixInfo.totalTransitions / Math.max(sprintLogs.length - 1, 1)) * 100).toFixed(0)}%
                </div>
                <div className="text-gray-600">Cobertura de Dados</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;