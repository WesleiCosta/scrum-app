import React, { useState } from 'react';
import { useSprint } from '../contexts/SprintContext';
import { useProject } from '../contexts/ProjectContext';
import { ProjectState } from '../types';

// Tipos para implementação Scrum-Markov
type UnifiedState = 'Saudável' | 'Em Risco' | 'Crítico';
type TransitionMatrix = number[][];

const DashboardPage: React.FC = () => {
  const { sprintLogs } = useSprint();
  const { currentProject } = useProject();
  const [selectedDashboard, setSelectedDashboard] = useState<'executive' | 'statistical' | 'predictive'>('executive');

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

  // Algoritmo: Construir Matriz de Transição
  const construirMatrizTransicao = (historicoEstados: UnifiedState[]): TransitionMatrix => {
    const contagemTransicoes: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const contagemEstadosOrigem = [0, 0, 0];
    const mapaEstados: { [key in UnifiedState]: number } = {
      'Saudável': 0, 'Em Risco': 1, 'Crítico': 2
    };

    for (let t = 0; t < historicoEstados.length - 1; t++) {
      const estadoOrigem = historicoEstados[t];
      const estadoDestino = historicoEstados[t + 1];
      const indiceOrigem = mapaEstados[estadoOrigem];
      const indiceDestino = mapaEstados[estadoDestino];
      
      contagemTransicoes[indiceOrigem][indiceDestino] += 1;
      contagemEstadosOrigem[indiceOrigem] += 1;
    }

    const P: TransitionMatrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

    for (let i = 0; i < 3; i++) {
      if (contagemEstadosOrigem[i] > 0) {
        for (let j = 0; j < 3; j++) {
          P[i][j] = contagemTransicoes[i][j] / contagemEstadosOrigem[i];
        }
      } else {
        P[i] = [1/3, 1/3, 1/3];
      }
    }
    
    return P;
  };

  // Calcular dados principais
  const historicoEstadosUnificados: UnifiedState[] = sprintLogs.map(log => 
    converterParaEstadoUnificado(log.finalState)
  );
  
  const estadoAtual: UnifiedState = sprintLogs.length > 0 
    ? converterParaEstadoUnificado(sprintLogs[sprintLogs.length - 1].finalState) 
    : 'Em Risco';
    
  const matrizTransicao: TransitionMatrix = historicoEstadosUnificados.length >= 2 
    ? construirMatrizTransicao(historicoEstadosUnificados) 
    : [[1/3, 1/3, 1/3], [1/3, 1/3, 1/3], [1/3, 1/3, 1/3]];

  const formatarProbabilidade = (prob: number): string => `${Math.round(prob * 100)}%`;

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
                Sprint atual: {sprintLogs.length} | Baseado em {historicoEstadosUnificados.length} sprints
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
                    {Math.round((historicoEstadosUnificados.filter(e => e === 'Saudável').length / Math.max(historicoEstadosUnificados.length, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa Saudável</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {Math.round((historicoEstadosUnificados.filter(e => e === 'Em Risco').length / Math.max(historicoEstadosUnificados.length, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa Risco</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {Math.round((historicoEstadosUnificados.filter(e => e === 'Crítico').length / Math.max(historicoEstadosUnificados.length, 1)) * 100)}%
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
                {historicoEstadosUnificados.length > 1 ? 
                  historicoEstadosUnificados.slice(1).map((estado, index) => {
                    const estadoAnterior = historicoEstadosUnificados[index];
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
            
            {/* Nível de Confiança */}
            <div className="bg-white p-6 rounded-xl shadow-lg border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Nível de Confiança</h3>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Baseado em {sprintLogs.length} sprints de dados
                </p>
                <div className={`text-xl font-bold ${
                  sprintLogs.length < 6 ? 'text-red-600' :
                  sprintLogs.length < 12 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {sprintLogs.length < 6 ? 'Baixa' :
                   sprintLogs.length < 12 ? 'Média' : 'Alta'}
                </div>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                <div className={`h-3 rounded-full ${
                  sprintLogs.length < 6 ? 'bg-red-400' :
                  sprintLogs.length < 12 ? 'bg-yellow-400' : 'bg-green-400'
                }`} style={{ width: `${Math.min((sprintLogs.length / 12) * 100, 100)}%` }} />
              </div>
            </div>

            {/* Status */}
            <div className="bg-white p-6 rounded-xl shadow-lg border text-center">
              <div className="text-4xl mb-4">🔮</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard Preditivo</h3>
              <p className="text-gray-600">
                {sprintLogs.length < 2 
                  ? 'São necessárias pelo menos 2 sprints para análises preditivas'
                  : 'Funcionalidades preditivas avançadas serão implementadas em breve'
                }
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardPage;
