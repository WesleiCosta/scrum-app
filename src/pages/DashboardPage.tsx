import React, { useState, useMemo, useCallback } from 'react';
import { useSprint } from '../contexts/SprintContext';
import { useProject } from '../contexts/ProjectContext';
import { ProjectState, UnifiedState, TransitionMatrix, StatePrediction } from '../types';
import { ScrumMarkovEngine, ScenarioAnalysisUtils } from '../utils/scrum-markov-engine';
import { debounce, sanitizeUserInput } from '../utils/debounce';

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

  // Análise Inteligente Avançada
  const analisarSituacaoAtual = useMemo(() => {
    const historicoCompleto = sprintLogs.map(log => converterParaEstadoUnificado(log.finalState));
    const totalSprints = historicoCompleto.length;
    
    if (totalSprints === 0) {
      return {
        situacao: 'Projeto Novo',
        contexto: 'Projeto sem histórico de sprints ainda.',
        urgencia: 'baixa' as const,
        insights: ['Defina critérios de sucesso claros', 'Estabeleça métricas de acompanhamento'],
        acoes: ['Configure a rubrica de avaliação', 'Planeje as primeiras sprints com cuidado'],
        taxas: {
          geral: { saudavel: 0, risco: 0, critico: 0 },
          recente: null
        }
      };
    }
    
    const ultimas3 = historicoCompleto.slice(-3);
    
    const taxas = {
      geral: {
        saudavel: historicoCompleto.filter(e => e === 'Saudável').length / totalSprints,
        risco: historicoCompleto.filter(e => e === 'Em Risco').length / totalSprints,
        critico: historicoCompleto.filter(e => e === 'Crítico').length / totalSprints
      },
      recente: ultimas3.length > 0 ? {
        saudavel: ultimas3.filter(e => e === 'Saudável').length / ultimas3.length,
        risco: ultimas3.filter(e => e === 'Em Risco').length / ultimas3.length,
        critico: ultimas3.filter(e => e === 'Crítico').length / ultimas3.length
      } : null
    };
    
    // Detectar padrões e tendências
    const estadoAtual = historicoCompleto[historicoCompleto.length - 1];
    let situacao = '';
    let contexto = '';
    let urgencia: 'baixa' | 'media' | 'alta' = 'baixa';
    let insights: string[] = [];
    let acoes: string[] = [];
    
    // Análise do estado atual
    if (estadoAtual === 'Crítico') {
      urgencia = 'alta';
      if (taxas.recente && taxas.recente.critico >= 0.67) {
        situacao = 'Crise Persistente';
        contexto = 'Projeto em estado crítico há várias sprints consecutivas.';
        insights = [
          'Problemas estruturais podem estar afetando o projeto',
          'Necessária intervenção imediata da liderança',
          'Riscos de não-entrega estão elevados'
        ];
        acoes = [
          'Revisar completamente o escopo e cronograma',
          'Mobilizar recursos de emergência',
          'Implementar acompanhamento diário intensivo',
          'Considerar re-arquitetura da solução'
        ];
      } else {
        situacao = 'Problema Pontual';
        contexto = 'Estado crítico recente, mas não persistente.';
        insights = [
          'Pode ser um problema específico e resolvível',
          'Importante identificar a causa raiz rapidamente'
        ];
        acoes = [
          'Identificar impedimentos específicos',
          'Aumentar suporte técnico temporariamente',
          'Revisar prioridades da sprint atual'
        ];
      }
    } else if (estadoAtual === 'Em Risco') {
      urgencia = 'media';
      if (taxas.recente && taxas.recente.saudavel === 0) {
        situacao = 'Deterioração Gradual';
        contexto = 'Projeto perdendo performance nas últimas sprints.';
        insights = [
          'Tendência negativa precisa ser interrompida',
          'Fatores externos podem estar impactando a equipe'
        ];
        acoes = [
          'Conduzir retrospectiva focada em problemas',
          'Revisar capacidade e carga da equipe',
          'Melhorar comunicação com stakeholders'
        ];
      } else {
        situacao = 'Flutuação Normal';
        contexto = 'Estado de risco dentro da variabilidade esperada.';
        insights = [
          'Manter vigilância preventiva',
          'Aproveitar para fortalecer processos'
        ];
        acoes = [
          'Monitorar indicadores-chave de perto',
          'Implementar melhorias incrementais',
          'Preparar planos de contingência'
        ];
      }
    } else { // Saudável
      urgencia = 'baixa';
      if (taxas.geral.saudavel >= 0.8) {
        situacao = 'Excelência Consistente';
        contexto = 'Projeto mantém alta performance de forma consistente.';
        insights = [
          'Práticas atuais estão funcionando muito bem',
          'Equipe demonstra maturidade ágil elevada',
          'Modelo para outros projetos'
        ];
        acoes = [
          'Documentar práticas de sucesso',
          'Compartilhar conhecimento com outras equipes',
          'Buscar inovações para manter liderança',
          'Considerar desafios mais ambiciosos'
        ];
      } else {
        situacao = 'Recuperação Positiva';
        contexto = 'Projeto em bom momento após períodos instáveis.';
        insights = [
          'Importante consolidar as melhorias recentes',
          'Não baixar a guarda com processos'
        ];
        acoes = [
          'Reforçar práticas que levaram à melhoria',
          'Manter disciplina nas cerimônias ágeis',
          'Preparar equipe para próximos desafios'
        ];
      }
    }
    
    return { 
      situacao, 
      contexto, 
      urgencia, 
      insights, 
      acoes, 
      taxas: {
        geral: taxas.geral,
        recente: taxas.recente
      }
    };
  }, [sprintLogs.length, sprintLogs.slice(-5).map(log => log.finalState).join('')]);  // Otimização: apenas recomputa com mudanças relevantes

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
  }, [sprintLogs.length, currentProject?.nValue, sprintLogs.slice(-10)]);  // Otimização: dependencies específicas

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

  const editarMatrizWhatIfDebounced = useCallback(
    debounce((i: number, j: number, valor: string) => {
      // Validação robusta de entrada usando utilitários
      const valorLimpo = sanitizeUserInput(valor, 'percentage');
      if (!valorLimpo) return;
      
      const novoValor = parseFloat(valorLimpo) / 100; // Converter de % para decimal
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
    }, 300), // 300ms debounce
    [whatIfMatrix, matrizTransicao]
  );

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

  // Função para obter cores da matriz de transição baseadas no percentual e significado
  const getCoresMatrizTransicao = (fromState: UnifiedState, toState: UnifiedState, probability: number) => {
    const intensity = Math.min(probability * 1.2, 1); // Amplifica um pouco para melhor visibilidade
    
    // Determinar se a transição é positiva, neutra ou negativa
    const stateOrder = { 'Saudável': 0, 'Em Risco': 1, 'Crítico': 2 };
    const fromOrder = stateOrder[fromState];
    const toOrder = stateOrder[toState];
    
    let baseColor: string;
    let textColor = 'text-gray-900';
    
    if (fromOrder === toOrder) {
      // Transição para o mesmo estado (estabilidade)
      if (fromState === 'Saudável') {
        baseColor = `rgba(34, 197, 94, ${0.2 + intensity * 0.6})`; // Verde para estabilidade boa
      } else if (fromState === 'Em Risco') {
        baseColor = `rgba(251, 191, 36, ${0.2 + intensity * 0.6})`; // Amarelo para estabilidade média
      } else {
        baseColor = `rgba(239, 68, 68, ${0.2 + intensity * 0.6})`; // Vermelho para estabilidade ruim
      }
    } else if (toOrder < fromOrder) {
      // Transição positiva (melhoria)
      baseColor = `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`; // Verde para melhoria
      textColor = intensity > 0.5 ? 'text-white font-semibold' : 'text-green-900 font-medium';
    } else {
      // Transição negativa (degradação)
      baseColor = `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`; // Vermelho para degradação
      textColor = intensity > 0.5 ? 'text-white font-semibold' : 'text-red-900 font-medium';
    }
    
    return {
      backgroundColor: baseColor,
      textColor: textColor,
      borderColor: intensity > 0.4 ? 'border-gray-400' : 'border-gray-300'
    };
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Coluna Principal Esquerda */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Header do Status com Medidor e KPIs Integrados */}
              <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-6 rounded-2xl shadow-xl border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  
                  {/* Medidor Central */}
                  <div className="md:col-span-1 flex justify-center">
                    <div className="relative">
                      <div className={`w-40 h-40 rounded-full border-6 flex items-center justify-center ${getCoresEstado(estadoAtual).bg} ${getCoresEstado(estadoAtual).border} shadow-inner`}>
                        <div className="text-center">
                          <div className="text-4xl mb-2">{getCoresEstado(estadoAtual).icon}</div>
                          <div className={`text-lg font-bold ${getCoresEstado(estadoAtual).text}`}>{estadoAtual}</div>
                        </div>
                      </div>
                      <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                        Sprint {sprintLogs.length}
                      </div>
                    </div>
                  </div>

                  {/* KPIs Compactos */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div className="bg-white/70 p-4 rounded-xl border border-green-200 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round((historicoEstados.filter((e: UnifiedState) => e === 'Saudável').length / Math.max(historicoEstados.length, 1)) * 100)}%
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Taxa Saudável</div>
                        </div>
                        <div className="text-2xl">🟢</div>
                      </div>
                    </div>
                    
                    <div className="bg-white/70 p-4 rounded-xl border border-yellow-200 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">
                            {Math.round((historicoEstados.filter((e: UnifiedState) => e === 'Em Risco').length / Math.max(historicoEstados.length, 1)) * 100)}%
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Taxa Risco</div>
                        </div>
                        <div className="text-2xl">🟡</div>
                      </div>
                    </div>
                    
                    <div className="bg-white/70 p-4 rounded-xl border border-red-200 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {Math.round((historicoEstados.filter((e: UnifiedState) => e === 'Crítico').length / Math.max(historicoEstados.length, 1)) * 100)}%
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Taxa Crítica</div>
                        </div>
                        <div className="text-2xl">🔴</div>
                      </div>
                    </div>
                    
                    <div className="bg-white/70 p-4 rounded-xl border border-blue-200 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{historicoEstados.length}</div>
                          <div className="text-xs text-gray-600 font-medium">Total Sprints</div>
                        </div>
                        <div className="text-2xl">📊</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Análise Inteligente Compacta */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    🧠 Diagnóstico Inteligente
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    analisarSituacaoAtual.urgencia === 'alta' ? 'bg-red-100 text-red-800 border border-red-300' :
                    analisarSituacaoAtual.urgencia === 'media' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                    'bg-green-100 text-green-800 border border-green-300'
                  }`}>
                    PRIORIDADE {analisarSituacaoAtual.urgencia.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-500">
                      <div className="font-bold text-blue-900 mb-1">Situação Detectada</div>
                      <div className="text-blue-800 font-semibold">{analisarSituacaoAtual.situacao}</div>
                      <div className="text-sm text-blue-600 mt-2">{analisarSituacaoAtual.contexto}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-l-4 border-purple-500">
                      <div className="font-bold text-purple-900 mb-2">💡 Insights da IA</div>
                      <ul className="text-sm text-purple-700 space-y-1">
                        {analisarSituacaoAtual.insights.slice(0, 2).map((insight, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-purple-500 mr-2">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Lateral Direita */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Previsão da Próxima Sprint */}
              {previsoes.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-6 rounded-2xl shadow-xl text-white">
                  <h4 className="text-lg font-bold mb-4 flex items-center">
                    🔮 Previsão Próxima Sprint
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <span className="text-green-300 mr-2">●</span>
                          Saudável
                        </span>
                        <span className="font-bold text-xl">
                          {Math.round(previsoes[0].probabilities[0] * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <span className="text-yellow-300 mr-2">●</span>
                          Em Risco
                        </span>
                        <span className="font-bold text-xl">
                          {Math.round(previsoes[0].probabilities[1] * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <span className="text-red-300 mr-2">●</span>
                          Crítico
                        </span>
                        <span className="font-bold text-xl">
                          {Math.round(previsoes[0].probabilities[2] * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {previsoes[0].probabilities[2] > 0.4 && (
                    <div className="mt-4 p-3 bg-red-500/30 rounded-lg border border-red-300">
                      <p className="text-red-100 text-sm font-medium">
                        ⚠️ Alto risco detectado - Ações preventivas recomendadas
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Métricas de Acompanhamento */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border">
                <h5 className="font-bold text-gray-800 mb-4 flex items-center">
                  📈 Indicadores Críticos
                </h5>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">• Velocity da equipe</span>
                    <span className="text-blue-600 font-medium">Monitorar</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">• Burn-down da sprint</span>
                    <span className="text-green-600 font-medium">OK</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">• Impedimentos</span>
                    <span className="text-orange-600 font-medium">Atenção</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">• Qualidade entregas</span>
                    <span className="text-blue-600 font-medium">Avaliar</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Plano de Ação - Largura Total */}
            <div className="lg:col-span-12">
              <div className={`p-6 rounded-2xl shadow-xl border-2 ${
                analisarSituacaoAtual.urgencia === 'alta' ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100' :
                analisarSituacaoAtual.urgencia === 'media' ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-100' :
                'border-green-300 bg-gradient-to-br from-green-50 to-emerald-100'
              }`}>
                <h4 className={`text-xl font-bold mb-4 flex items-center ${
                  analisarSituacaoAtual.urgencia === 'alta' ? 'text-red-800' :
                  analisarSituacaoAtual.urgencia === 'media' ? 'text-yellow-800' :
                  'text-green-800'
                }`}>
                  🎯 Plano de Ação Estratégico
                  {analisarSituacaoAtual.urgencia === 'alta' && <span className="ml-2 animate-pulse">🚨</span>}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-4 rounded-xl border-2 ${
                    analisarSituacaoAtual.urgencia === 'alta' ? 'bg-red-100/50 border-red-200' :
                    analisarSituacaoAtual.urgencia === 'media' ? 'bg-yellow-100/50 border-yellow-200' :
                    'bg-green-100/50 border-green-200'
                  }`}>
                    <h5 className={`font-bold mb-3 flex items-center ${
                      analisarSituacaoAtual.urgencia === 'alta' ? 'text-red-800' :
                      analisarSituacaoAtual.urgencia === 'media' ? 'text-yellow-800' :
                      'text-green-800'
                    }`}>
                      {analisarSituacaoAtual.urgencia === 'alta' ? '🚨 AÇÕES IMEDIATAS' :
                       analisarSituacaoAtual.urgencia === 'media' ? '⚠️ AÇÕES PREVENTIVAS' :
                       '✅ AÇÕES DE OTIMIZAÇÃO'}
                    </h5>
                    <ul className={`space-y-2 ${
                      analisarSituacaoAtual.urgencia === 'alta' ? 'text-red-700' :
                      analisarSituacaoAtual.urgencia === 'media' ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {analisarSituacaoAtual.acoes.map((acao, index) => (
                        <li key={index} className="flex items-start">
                          <span className={`mr-3 mt-1 ${
                            analisarSituacaoAtual.urgencia === 'alta' ? 'text-red-500' :
                            analisarSituacaoAtual.urgencia === 'media' ? 'text-yellow-500' :
                            'text-green-500'
                          }`}>
                            {index < 3 ? '🔥' : '📋'}
                          </span>
                          <span className="text-sm font-medium">{acao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-white/70 p-4 rounded-xl border-2 border-gray-200 backdrop-blur-sm">
                    <h5 className="font-bold text-gray-800 mb-3 flex items-center">
                      🎯 Próximos Passos
                    </h5>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-blue-600 mr-3">1️⃣</span>
                        <span className="text-blue-800 font-medium">Implementar ações críticas</span>
                      </div>
                      <div className="flex items-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <span className="text-purple-600 mr-3">2️⃣</span>
                        <span className="text-purple-800 font-medium">Monitorar indicadores diários</span>
                      </div>
                      <div className="flex items-center p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                        <span className="text-indigo-600 mr-3">3️⃣</span>
                        <span className="text-indigo-800 font-medium">Avaliar eficácia em 2-3 dias</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Estatístico */}
        {selectedDashboard === 'statistical' && (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            
            {/* Header da Análise Estatística */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-6 mb-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-2">
                      � Análise Estatística Avançada
                    </h1>
                    <p className="text-slate-600 text-lg">
                      Matriz de Markov e probabilidades de transição entre estados
                    </p>
                  </div>
                  
                  {/* Métricas Resumo */}
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center min-w-[120px]">
                      <div className="text-2xl font-bold text-blue-700">{windowSize}</div>
                      <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Janela Análise</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center min-w-[120px]">
                      <div className="text-2xl font-bold text-purple-700">{historicoEstados.length}</div>
                      <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Sprints Total</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center min-w-[120px]">
                      <div className="text-2xl font-bold text-emerald-700">
                        {historicoEstados.length > 1 ? historicoEstados.length - 1 : 0}
                      </div>
                      <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Transições</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 space-y-8">
              
              {/* Layout Grid Principal */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                
                {/* Coluna Principal - Matriz de Transição */}
                <div className="xl:col-span-3">
                  <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-slate-200/50">
                    <div className="flex flex-col lg:flex-row justify-between items-start mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-3 flex items-center gap-3">
                          🔢 Matriz de Transição de Estados
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                          Probabilidades P<sub>ij</sub> calculadas com base nos últimos <strong>{windowSize}</strong> sprints
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                          Fórmula: P<sub>ij</sub> = n<sub>ij</sub> / Σ<sub>k</sub>(n<sub>ik</sub>)
                        </p>
                      </div>
                    </div>
                    
                    {/* Matriz de Transição Redesenhada */}
                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-2">
                          <thead>
                            <tr>
                              <th className="bg-slate-800 text-white p-4 rounded-tl-xl font-bold text-center">
                                <div className="flex flex-col items-center space-y-1">
                                  <span className="text-lg">Estado Origem</span>
                                  <span className="text-xs opacity-75">↓ De \ Para →</span>
                                </div>
                              </th>
                              {(['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).map((estado, index) => (
                                <th key={estado} className={`p-4 font-bold text-center rounded-t-xl ${
                                  index === 0 ? 'bg-emerald-600 text-white' :
                                  index === 1 ? 'bg-amber-500 text-white' :
                                  'bg-red-600 text-white'
                                }`}>
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="text-lg">{getCoresEstado(estado).icon}</span>
                                    <span className="text-sm font-semibold">{estado}</span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).map((fromState, i) => (
                              <tr key={fromState}>
                                <td className={`p-4 font-bold text-center rounded-l-xl ${
                                  i === 0 ? 'bg-emerald-600 text-white' :
                                  i === 1 ? 'bg-amber-500 text-white' :
                                  'bg-red-600 text-white'
                                }`}>
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="text-lg">{getCoresEstado(fromState).icon}</span>
                                    <span className="text-sm font-semibold">{fromState}</span>
                                  </div>
                                </td>
                                {matrizTransicao[i].map((value, j) => {
                                  const toState = (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[])[j];
                                  const cores = getCoresMatrizTransicao(fromState, toState, value);
                                  
                                  return (
                                    <td 
                                      key={j} 
                                      className={`text-center transition-all duration-300 hover:scale-110 hover:shadow-2xl cursor-help relative group rounded-xl border-2 ${cores.borderColor} ${
                                        j === 2 && i === (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).length - 1 ? 'rounded-br-xl' : ''
                                      }`}
                                      style={{ 
                                        backgroundColor: cores.backgroundColor,
                                        minHeight: '80px',
                                        minWidth: '120px'
                                      }}
                                      title={`Transição ${fromState} → ${toState}: ${formatarProbabilidade(value)} ${
                                        fromState === toState ? '(Estabilidade)' : 
                                        (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).indexOf(toState) < (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).indexOf(fromState) ? '(Melhoria)' : '(Degradação)'
                                      }`}
                                    >
                                      <div className="flex flex-col items-center justify-center p-4 h-full">
                                        <div className={`text-3xl font-black mb-1 ${cores.textColor}`}>
                                          {formatarProbabilidade(value)}
                                        </div>
                                        
                                        {/* Barra de Intensidade */}
                                        <div className="w-full bg-white/30 rounded-full h-2 mb-2">
                                          <div 
                                            className="bg-current h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(value * 100, 100)}%` }}
                                          />
                                        </div>
                                        
                                        {/* Classificação */}
                                        <div className={`text-xs font-bold uppercase tracking-wider ${cores.textColor} opacity-80`}>
                                          {value > 0.7 ? '🔥 Muito Alta' : 
                                           value > 0.4 ? '📈 Alta' : 
                                           value > 0.2 ? '📊 Média' : 
                                           value > 0.05 ? '📉 Baixa' : 
                                           value > 0 ? '🔍 Rara' : '❌ Nula'}
                                        </div>
                                      </div>
                                      
                                      {/* Tooltip Avançado */}
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-4 py-3 bg-slate-900 text-white text-sm rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 border border-slate-700">
                                        <div className="text-center">
                                          <div className="font-bold text-lg mb-1">{fromState} → {toState}</div>
                                          <div className="text-slate-300 mb-2">{formatarProbabilidade(value)} de probabilidade</div>
                                          <div className={`text-xs px-2 py-1 rounded-full ${
                                            fromState === toState ? 'bg-blue-600' : 
                                            (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).indexOf(toState) < (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).indexOf(fromState) ? 'bg-green-600' : 'bg-red-600'
                                          }`}>
                                            {fromState === toState ? 'Mantém Estado' : 
                                             (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).indexOf(toState) < (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).indexOf(fromState) ? 'Melhoria' : 'Degradação'}
                                          </div>
                                        </div>
                                        {/* Seta do tooltip */}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                          <div className="border-4 border-transparent border-t-slate-900"></div>
                                        </div>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Lateral - Legenda e Informações */}
                <div className="xl:col-span-1 space-y-6">
                  
                  {/* Legenda Aprimorada */}
                  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-slate-200/50">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      🎨 Legenda de Cores
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-green-500"></div>
                        <div>
                          <div className="font-semibold text-emerald-800 text-sm">Melhoria</div>
                          <div className="text-xs text-emerald-600">Transição para estado superior</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"></div>
                        <div>
                          <div className="font-semibold text-amber-800 text-sm">Estabilidade</div>
                          <div className="text-xs text-amber-600">Permanência no estado atual</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-400 to-rose-500"></div>
                        <div>
                          <div className="font-semibold text-red-800 text-sm">Degradação</div>
                          <div className="text-xs text-red-600">Transição para estado inferior</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Análise Estatística */}
                  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-slate-200/50">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      📈 Análise Rápida
                    </h3>
                    <div className="space-y-4">
                      {/* Estado mais provável de manter */}
                      {(() => {
                        const maiorEstabilidade = Math.max(matrizTransicao[0][0], matrizTransicao[1][1], matrizTransicao[2][2]);
                        const estadoMaisEstavel = maiorEstabilidade === matrizTransicao[0][0] ? 'Saudável' : 
                                                 maiorEstabilidade === matrizTransicao[1][1] ? 'Em Risco' : 'Crítico';
                        return (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-semibold text-blue-800">Estado mais estável:</div>
                            <div className="text-lg font-bold text-blue-900">{estadoMaisEstavel}</div>
                            <div className="text-xs text-blue-600">{formatarProbabilidade(maiorEstabilidade)} de permanência</div>
                          </div>
                        );
                      })()}

                      {/* Maior risco de degradação */}
                      {(() => {
                        let maiorRisco = 0;
                        let origemRisco = '';
                        let destinoRisco = '';
                        
                        for (let i = 0; i < 2; i++) {
                          for (let j = i + 1; j < 3; j++) {
                            if (matrizTransicao[i][j] > maiorRisco) {
                              maiorRisco = matrizTransicao[i][j];
                              origemRisco = (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[])[i];
                              destinoRisco = (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[])[j];
                            }
                          }
                        }
                        
                        return maiorRisco > 0.1 ? (
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-sm font-semibold text-orange-800">Maior risco:</div>
                            <div className="text-sm font-bold text-orange-900">{origemRisco} → {destinoRisco}</div>
                            <div className="text-xs text-orange-600">{formatarProbabilidade(maiorRisco)} de probabilidade</div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Histórico de Transições Redesenhado */}
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-slate-200/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    🔄 Linha do Tempo das Transições
                  </h3>
                  <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
                    {historicoEstados.length > 1 ? historicoEstados.length - 1 : 0} transições registradas
                  </div>
                </div>
                
                <div className="relative">
                  {historicoEstados.length > 1 ? (
                    <div className="space-y-4">
                      {/* Linha temporal */}
                      <div className="flex flex-wrap gap-2 justify-center mb-8">
                        {historicoEstados.slice(1).map((estado: UnifiedState, index: number) => {
                          const estadoAnterior = historicoEstados[index];
                          const isImprovement = (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).indexOf(estado) < (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).indexOf(estadoAnterior);
                          const isDegradation = (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).indexOf(estado) > (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).indexOf(estadoAnterior);
                          
                          return (
                            <div key={index} className="flex items-center">
                              {/* Card da Transição */}
                              <div className={`
                                p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer
                                ${isImprovement ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 hover:shadow-emerald-200' :
                                  isDegradation ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 hover:shadow-red-200' :
                                  'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 hover:shadow-blue-200'}
                                hover:shadow-xl
                              `}>
                                <div className="text-center">
                                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                    Sprint {index + 1} → {index + 2}
                                  </div>
                                  
                                  <div className="flex items-center justify-center space-x-3">
                                    <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${getCoresEstado(estadoAnterior).bg}`}>
                                      <span className="text-lg">{getCoresEstado(estadoAnterior).icon}</span>
                                      <span className="text-xs font-semibold">{estadoAnterior}</span>
                                    </div>
                                    
                                    <div className={`
                                      text-2xl transition-transform duration-300 hover:scale-125
                                      ${isImprovement ? 'text-emerald-600' :
                                        isDegradation ? 'text-red-600' : 'text-blue-600'}
                                    `}>
                                      {isImprovement ? '⬆️' : isDegradation ? '⬇️' : '↔️'}
                                    </div>
                                    
                                    <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${getCoresEstado(estado).bg}`}>
                                      <span className="text-lg">{getCoresEstado(estado).icon}</span>
                                      <span className="text-xs font-semibold">{estado}</span>
                                    </div>
                                  </div>
                                  
                                  <div className={`
                                    text-xs font-bold mt-2 px-2 py-1 rounded-full
                                    ${isImprovement ? 'text-emerald-800 bg-emerald-100' :
                                      isDegradation ? 'text-red-800 bg-red-100' :
                                      'text-blue-800 bg-blue-100'}
                                  `}>
                                    {isImprovement ? 'MELHORIA' : isDegradation ? 'DEGRADAÇÃO' : 'ESTÁVEL'}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Conectores */}
                              {index < historicoEstados.slice(1).length - 1 && (
                                <div className="mx-2 text-slate-400 text-xl">
                                  ▶️
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <h4 className="text-xl font-bold text-slate-600 mb-2">Aguardando Dados</h4>
                      <p className="text-slate-500">
                        Nenhuma transição registrada ainda. Complete mais sprints para ver as análises.
                      </p>
                    </div>
                  )}
                </div>
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
                    <div className="space-y-3">
                      {(['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[]).map((fromState, i) => (
                        <div key={fromState} className="flex items-center space-x-2">
                          <div className={`w-24 text-sm font-medium p-2 rounded ${getCoresEstado(fromState).bg} ${getCoresEstado(fromState).text}`}>
                            {fromState}
                          </div>
                          <span className="text-gray-400 text-lg">→</span>
                          {(whatIfMatrix || matrizTransicao)[i].map((value, j) => {
                            const toState = (['Saudável', 'Em Risco', 'Crítico'] as UnifiedState[])[j];
                            const cores = getCoresMatrizTransicao(fromState, toState, value);
                            
                            return (
                              <div key={j} className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={Math.round(value * 100)}
                                  onChange={(e) => editarMatrizWhatIfDebounced(i, j, e.target.value)}
                                  className={`w-18 p-2 border-2 ${cores.borderColor} rounded text-center text-sm font-semibold focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all`}
                                  style={{ backgroundColor: cores.backgroundColor, color: cores.textColor.includes('text-white') ? 'white' : 'inherit' }}
                                />
                                <div className="absolute -bottom-5 left-0 right-0 text-center">
                                  <span className="text-xs text-gray-400">{toState.slice(0, 3)}</span>
                                </div>
                              </div>
                            );
                          })}
                          <span className="text-xs text-gray-500 ml-2">%</span>
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
