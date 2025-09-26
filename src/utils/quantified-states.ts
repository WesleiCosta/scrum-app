import { ProjectState } from '../types';
import { MetricDefinition, CriterionWithMetrics } from '../types/metrics';

// Função para calcular o score de uma métrica individual
export function calculateMetricScore(
  value: number, 
  metric: MetricDefinition
): number {
  const { minValue, maxValue, thresholds } = metric;
  
  // Normalizar valor para 0-100
  let normalizedValue = ((value - minValue) / (maxValue - minValue)) * 100;
  
  // Para métricas inversas (como débito técnico, tempo de resolução)
  if (metric.id.includes('debt') || metric.id.includes('time') || metric.id.includes('bug')) {
    normalizedValue = 100 - normalizedValue;
  }
  
  // Aplicar thresholds para score final
  if (normalizedValue >= thresholds.excellent) {
    return 100;
  } else if (normalizedValue >= thresholds.good) {
    return 85;
  } else if (normalizedValue >= thresholds.stable) {
    return 70;
  } else if (normalizedValue >= thresholds.risk) {
    return 50;
  } else {
    return 25; // Crítico
  }
}

// Função para calcular o score de um critério
export function calculateCriterionScore(
  criterion: CriterionWithMetrics,
  metricValues: { [metricId: string]: number }
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const metric of criterion.metrics) {
    const value = metricValues[metric.id];
    if (value !== undefined) {
      const metricScore = calculateMetricScore(value, metric);
      totalScore += metricScore * metric.weight;
      totalWeight += metric.weight;
    }
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// Função para calcular o score geral do sprint
export function calculateSprintScore(
  criteria: CriterionWithMetrics[],
  metricValues: { [metricId: string]: number }
): { overallScore: number; criteriaScores: { [criterionId: string]: { score: number } } } {
  let totalScore = 0;
  let totalWeight = 0;
  const criteriaScores: { [criterionId: string]: { score: number } } = {};

  for (const criterion of criteria) {
    const criterionScore = calculateCriterionScore(criterion, metricValues);
    criteriaScores[criterion.id] = { score: criterionScore };
    
    totalScore += criterionScore * criterion.weight;
    totalWeight += criterion.weight;
  }

  const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  
  return { overallScore, criteriaScores };
}

// Função para determinar o estado baseado no score
export function calculateStateFromScore(score: number): ProjectState {
  if (score >= 85) {
    return 'EXCELENTE';
  } else if (score >= 70) {
    return 'BOM';
  } else if (score >= 55) {
    return 'ESTÁVEL';
  } else if (score >= 35) {
    return 'RISCO';
  } else {
    return 'CRÍTICO';
  }
}

// Função principal para calcular o estado do sprint automaticamente
export function calculateAutomaticSprintState(
  criteria: CriterionWithMetrics[],
  metricValues: { [metricId: string]: number }
): {
  calculatedState: ProjectState;
  overallScore: number;
  criteriaScores: { [criterionId: string]: { score: number; metricValues: { [metricId: string]: number } } };
  confidence: number; // Confiança no cálculo (0-1)
} {
  const { overallScore, criteriaScores } = calculateSprintScore(criteria, metricValues);
  const calculatedState = calculateStateFromScore(overallScore);
  
  // Calcular confiança baseado na quantidade de métricas preenchidas
  const totalMetrics = criteria.reduce((sum, criterion) => sum + criterion.metrics.length, 0);
  const filledMetrics = Object.keys(metricValues).length;
  const confidence = filledMetrics / totalMetrics;
  
  // Adicionar valores das métricas aos critérios
  const enhancedCriteriaScores: { [criterionId: string]: { score: number; metricValues: { [metricId: string]: number } } } = {};
  
  for (const [criterionId, data] of Object.entries(criteriaScores)) {
    const criterion = criteria.find(c => c.id === criterionId);
    const criterionMetricValues: { [metricId: string]: number } = {};
    
    if (criterion) {
      for (const metric of criterion.metrics) {
        if (metricValues[metric.id] !== undefined) {
          criterionMetricValues[metric.id] = metricValues[metric.id];
        }
      }
    }
    
    enhancedCriteriaScores[criterionId] = {
      score: data.score,
      metricValues: criterionMetricValues
    };
  }

  return {
    calculatedState,
    overallScore,
    criteriaScores: enhancedCriteriaScores,
    confidence
  };
}

// Função para integrar dados automáticos (ex: de ferramentas como Jira, GitHub)
export function integrateAutomaticMetrics(
  sprintData: {
    plannedStoryPoints: number;
    completedStoryPoints: number;
    completedStories: number;
    totalStories: number;
    bugCount: number;
    codeCoverage?: number;
    technicalDebtScore?: number;
    avgImpedimentResolutionDays?: number;
  }
): { [metricId: string]: number } {
  const metrics: { [metricId: string]: number } = {};
  
  // Cálculos automáticos baseados nos dados
  if (sprintData.totalStories > 0) {
    metrics['story-completion'] = (sprintData.completedStories / sprintData.totalStories) * 100;
  }
  
  if (sprintData.plannedStoryPoints > 0) {
    metrics['velocity-consistency'] = Math.min(
      (sprintData.completedStoryPoints / sprintData.plannedStoryPoints) * 100,
      150
    );
  }
  
  if (sprintData.completedStoryPoints > 0) {
    metrics['bug-rate'] = sprintData.bugCount / sprintData.completedStoryPoints;
  }
  
  if (sprintData.codeCoverage !== undefined) {
    metrics['code-coverage'] = sprintData.codeCoverage;
  }
  
  if (sprintData.technicalDebtScore !== undefined) {
    metrics['technical-debt'] = sprintData.technicalDebtScore;
  }
  
  if (sprintData.avgImpedimentResolutionDays !== undefined) {
    metrics['impediment-resolution'] = sprintData.avgImpedimentResolutionDays;
  }

  return metrics;
}

// Função para sugerir ações baseadas nos scores baixos
export function generateActionableInsights(
  criteriaScores: { [criterionId: string]: { score: number } },
  criteria: CriterionWithMetrics[]
): Array<{
  priority: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  suggestion: string;
  impact: string;
}> {
  const insights: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    suggestion: string;
    impact: string;
  }> = [];

  for (const [criterionId, data] of Object.entries(criteriaScores)) {
    const criterion = criteria.find(c => c.id === criterionId);
    if (!criterion) continue;

    if (data.score < 35) {
      insights.push({
        priority: 'high',
        category: criterion.name,
        issue: `Score crítico em ${criterion.name} (${data.score.toFixed(1)}/100)`,
        suggestion: `Revisar imediatamente os processos relacionados a ${criterion.name.toLowerCase()}`,
        impact: 'Alto impacto na saúde geral do projeto'
      });
    } else if (data.score < 55) {
      insights.push({
        priority: 'medium',
        category: criterion.name,
        issue: `Score em risco em ${criterion.name} (${data.score.toFixed(1)}/100)`,
        suggestion: `Implementar melhorias em ${criterion.name.toLowerCase()}`,
        impact: 'Médio impacto na saúde do projeto'
      });
    } else if (data.score < 70) {
      insights.push({
        priority: 'low',
        category: criterion.name,
        issue: `Score estável mas pode melhorar em ${criterion.name} (${data.score.toFixed(1)}/100)`,
        suggestion: `Considerar otimizações em ${criterion.name.toLowerCase()}`,
        impact: 'Baixo impacto, oportunidade de melhoria'
      });
    }
  }

  return insights.sort((a, b) => {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}