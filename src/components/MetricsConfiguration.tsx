import React, { useState } from 'react';
import { CriterionWithMetrics } from '../types/metrics';
import { DEFAULT_QUANTIFIED_CRITERIA } from '../types/metrics';
import { calculateAutomaticSprintState, integrateAutomaticMetrics } from '../utils/quantified-states';

interface MetricsConfigurationProps {
  onSave?: (criteria: CriterionWithMetrics[]) => void;
  onCalculateState?: (metricValues: { [metricId: string]: number }) => void;
}

const MetricsConfiguration: React.FC<MetricsConfigurationProps> = ({ onSave, onCalculateState }) => {
  const [criteria] = useState<CriterionWithMetrics[]>(DEFAULT_QUANTIFIED_CRITERIA);
  const [metricValues, setMetricValues] = useState<{ [metricId: string]: number }>({});
  const [activeTab, setActiveTab] = useState<string>(criteria[0]?.id || '');
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const handleMetricValueChange = (metricId: string, value: number) => {
    const newValues = { ...metricValues, [metricId]: value };
    setMetricValues(newValues);
    
    // Recalcular automaticamente
    const result = calculateAutomaticSprintState(criteria, newValues);
    setCalculationResult(result);
    
    if (onCalculateState) {
      onCalculateState(newValues);
    }
  };

  const handleAutoFillExample = () => {
    // Dados de exemplo para demonstração
    const exampleData = integrateAutomaticMetrics({
      plannedStoryPoints: 20,
      completedStoryPoints: 18,
      completedStories: 8,
      totalStories: 10,
      bugCount: 2,
      codeCoverage: 85,
      technicalDebtScore: 30,
      avgImpedimentResolutionDays: 1.5
    });

    // Adicionar métricas manuais de exemplo
    const fullExampleData = {
      ...exampleData,
      'business-value': 75,
      'team-satisfaction': 4.2,
      'collaboration-score': 80,
      'attendance-rate': 95,
      'ceremony-effectiveness': 85,
      'definition-of-done': 90,
      'stakeholder-feedback': 4.0,
      'feature-acceptance': 88
    };

    setMetricValues(fullExampleData);
    
    const result = calculateAutomaticSprintState(criteria, fullExampleData);
    setCalculationResult(result);
  };

  const getStateColor = (state: string) => {
    const colors: { [key: string]: string } = {
      'EXCELENTE': 'text-green-600 bg-green-50 border-green-200',
      'BOM': 'text-blue-600 bg-blue-50 border-blue-200',
      'ESTÁVEL': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'RISCO': 'text-orange-600 bg-orange-50 border-orange-200',
      'CRÍTICO': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[state] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    if (score >= 35) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">⚖️ Configuração de Métricas Quantificadas</h2>
            <p className="text-gray-600 mt-2">
              Configure métricas mensuráveis para cálculo automático do estado do projeto
            </p>
          </div>
          <button
            onClick={handleAutoFillExample}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📊 Preencher Exemplo
          </button>
        </div>

        {/* Resultado do Cálculo */}
        {calculationResult && (
          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-indigo-900">Resultado do Cálculo</h3>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStateColor(calculationResult.calculatedState)}`}>
                    {calculationResult.calculatedState}
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(calculationResult.overallScore)}`}>
                    {calculationResult.overallScore.toFixed(1)}/100
                  </span>
                  <span className="text-sm text-gray-600">
                    Confiança: {(calculationResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs dos Critérios */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {criteria.map((criterion) => (
              <button
                key={criterion.id}
                onClick={() => setActiveTab(criterion.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === criterion.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {criterion.name}
                {calculationResult && calculationResult.criteriaScores[criterion.id] && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    getScoreColor(calculationResult.criteriaScores[criterion.id].score)
                  } bg-opacity-10`}>
                    {calculationResult.criteriaScores[criterion.id].score.toFixed(0)}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo do Tab Ativo */}
        <div className="p-6">
          {criteria
            .filter((criterion) => criterion.id === activeTab)
            .map((criterion) => (
              <div key={criterion.id} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{criterion.name}</h3>
                  <p className="text-gray-600 mt-1">{criterion.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Peso no cálculo final: {(criterion.weight * 100).toFixed(0)}%
                  </p>
                </div>

                {/* Métricas do Critério */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {criterion.metrics.map((metric) => (
                    <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{metric.name}</h4>
                          <p className="text-sm text-gray-600">{metric.description}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          metric.calculationType === 'automatic' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {metric.calculationType === 'automatic' ? '🤖 Auto' : '👤 Manual'}
                        </span>
                      </div>

                      {/* Input da Métrica */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min={metric.minValue}
                            max={metric.maxValue}
                            step={metric.unit === 'escala' ? 0.1 : 1}
                            value={metricValues[metric.id] || ''}
                            onChange={(e) => handleMetricValueChange(metric.id, parseFloat(e.target.value) || 0)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`${metric.minValue} - ${metric.maxValue}`}
                          />
                          <span className="text-sm text-gray-500 min-w-0 w-12">
                            {metric.unit}
                          </span>
                        </div>

                        {/* Thresholds */}
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex justify-between">
                            <span>🟢 Excelente:</span> <span>≥ {metric.thresholds.excellent}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>🔵 Bom:</span> <span>≥ {metric.thresholds.good}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>🟡 Estável:</span> <span>≥ {metric.thresholds.stable}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>🟠 Risco:</span> <span>≥ {metric.thresholds.risk}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => onSave && onSave(criteria)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          💾 Salvar Configuração
        </button>
      </div>
    </div>
  );
};

export default MetricsConfiguration;