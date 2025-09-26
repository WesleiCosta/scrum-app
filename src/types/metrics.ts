// Tipos para sistema de métricas quantitativas
import { ProjectState } from './index';

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  minValue: number;
  maxValue: number;
  weight: number; // Peso na composição do score final (0-1)
  calculationType: 'manual' | 'automatic' | 'formula';
  thresholds: {
    excellent: number;
    good: number;
    stable: number;
    risk: number;
    // critical é implícito (abaixo de risk)
  };
}

export interface CriterionWithMetrics {
  id: string;
  name: string;
  description: string;
  weight: number; // Peso do critério no estado final (0-1)
  metrics: MetricDefinition[];
}

export interface QuantifiedStateDefinition {
  id: ProjectState;
  name: string;
  description: string;
  criteria: CriterionWithMetrics[];
  color: string;
  bgColor: string;
  borderColor: string;
  // Thresholds gerais para o estado (soma ponderada dos critérios)
  scoreThresholds: {
    min: number; // Score mínimo para esse estado
    max: number; // Score máximo para esse estado
  };
}

export interface SprintMetrics {
  sprintId: string;
  criteriaScores: {
    [criterionId: string]: {
      score: number; // Score final do critério (0-100)
      metricValues: {
        [metricId: string]: number;
      };
    };
  };
  overallScore: number; // Score geral do sprint (0-100)
  calculatedState: ProjectState;
  manualOverride?: ProjectState; // Permite override manual se necessário
}

// Métricas padrão sugeridas
export const DEFAULT_QUANTIFIED_CRITERIA: CriterionWithMetrics[] = [
  {
    id: 'delivery-value',
    name: 'Entrega de Valor',
    description: 'Qualidade e quantidade da entrega funcional',
    weight: 0.25,
    metrics: [
      {
        id: 'story-completion',
        name: 'Taxa de Conclusão de Stories',
        description: 'Percentual de user stories concluídas vs planejadas',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        weight: 0.4,
        calculationType: 'automatic',
        thresholds: {
          excellent: 95,
          good: 85,
          stable: 70,
          risk: 50
        }
      },
      {
        id: 'velocity-consistency',
        name: 'Consistência da Velocidade',
        description: 'Aderência à velocidade planejada',
        unit: '%',
        minValue: 0,
        maxValue: 150,
        weight: 0.3,
        calculationType: 'automatic',
        thresholds: {
          excellent: 95,
          good: 85,
          stable: 75,
          risk: 60
        }
      },
      {
        id: 'business-value',
        name: 'Valor de Negócio Entregue',
        description: 'Pontuação de valor de negócio das features entregues',
        unit: 'pontos',
        minValue: 0,
        maxValue: 100,
        weight: 0.3,
        calculationType: 'manual',
        thresholds: {
          excellent: 90,
          good: 75,
          stable: 60,
          risk: 40
        }
      }
    ]
  },
  {
    id: 'team-performance',
    name: 'Performance da Equipe',
    description: 'Engajamento e produtividade da equipe',
    weight: 0.20,
    metrics: [
      {
        id: 'team-satisfaction',
        name: 'Satisfação da Equipe',
        description: 'Survey de satisfação da equipe (1-5)',
        unit: 'escala',
        minValue: 1,
        maxValue: 5,
        weight: 0.4,
        calculationType: 'manual',
        thresholds: {
          excellent: 4.5,
          good: 4.0,
          stable: 3.5,
          risk: 3.0
        }
      },
      {
        id: 'collaboration-score',
        name: 'Score de Colaboração',
        description: 'Avaliação da colaboração e comunicação',
        unit: 'pontos',
        minValue: 0,
        maxValue: 100,
        weight: 0.3,
        calculationType: 'manual',
        thresholds: {
          excellent: 85,
          good: 75,
          stable: 65,
          risk: 50
        }
      },
      {
        id: 'attendance-rate',
        name: 'Taxa de Participação',
        description: 'Participação em cerimônias e disponibilidade',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        weight: 0.3,
        calculationType: 'automatic',
        thresholds: {
          excellent: 95,
          good: 90,
          stable: 85,
          risk: 75
        }
      }
    ]
  },
  {
    id: 'process-quality',
    name: 'Qualidade dos Processos',
    description: 'Aderência e efetividade dos processos Scrum',
    weight: 0.20,
    metrics: [
      {
        id: 'ceremony-effectiveness',
        name: 'Efetividade das Cerimônias',
        description: 'Qualidade e produtividade das cerimônias',
        unit: 'pontos',
        minValue: 0,
        maxValue: 100,
        weight: 0.4,
        calculationType: 'manual',
        thresholds: {
          excellent: 90,
          good: 80,
          stable: 70,
          risk: 55
        }
      },
      {
        id: 'definition-of-done',
        name: 'Aderência ao DoD',
        description: 'Percentual de itens que atendem Definition of Done',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        weight: 0.3,
        calculationType: 'automatic',
        thresholds: {
          excellent: 95,
          good: 90,
          stable: 80,
          risk: 65
        }
      },
      {
        id: 'impediment-resolution',
        name: 'Resolução de Impedimentos',
        description: 'Tempo médio para resolução de impedimentos',
        unit: 'dias',
        minValue: 0,
        maxValue: 10,
        weight: 0.3,
        calculationType: 'automatic',
        thresholds: {
          excellent: 1,
          good: 2,
          stable: 3,
          risk: 5
        }
      }
    ]
  },
  {
    id: 'stakeholder-satisfaction',
    name: 'Satisfação dos Stakeholders',
    description: 'Nível de satisfação e feedback dos stakeholders',
    weight: 0.15,
    metrics: [
      {
        id: 'stakeholder-feedback',
        name: 'Feedback dos Stakeholders',
        description: 'Score médio do feedback (1-5)',
        unit: 'escala',
        minValue: 1,
        maxValue: 5,
        weight: 0.6,
        calculationType: 'manual',
        thresholds: {
          excellent: 4.5,
          good: 4.0,
          stable: 3.5,
          risk: 3.0
        }
      },
      {
        id: 'feature-acceptance',
        name: 'Taxa de Aceitação',
        description: 'Percentual de features aceitas sem retrabalho',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        weight: 0.4,
        calculationType: 'automatic',
        thresholds: {
          excellent: 95,
          good: 88,
          stable: 80,
          risk: 65
        }
      }
    ]
  },
  {
    id: 'technical-health',
    name: 'Saúde Técnica',
    description: 'Estado do código, débito técnico e qualidade',
    weight: 0.20,
    metrics: [
      {
        id: 'code-coverage',
        name: 'Cobertura de Testes',
        description: 'Percentual de cobertura de testes',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        weight: 0.3,
        calculationType: 'automatic',
        thresholds: {
          excellent: 90,
          good: 80,
          stable: 70,
          risk: 50
        }
      },
      {
        id: 'technical-debt',
        name: 'Débito Técnico',
        description: 'Score de débito técnico (inverso - menor é melhor)',
        unit: 'pontos',
        minValue: 0,
        maxValue: 100,
        weight: 0.4,
        calculationType: 'automatic',
        thresholds: {
          excellent: 10,
          good: 25,
          stable: 40,
          risk: 60
        }
      },
      {
        id: 'bug-rate',
        name: 'Taxa de Bugs',
        description: 'Bugs por story point entregue',
        unit: 'bugs/sp',
        minValue: 0,
        maxValue: 5,
        weight: 0.3,
        calculationType: 'automatic',
        thresholds: {
          excellent: 0.1,
          good: 0.3,
          stable: 0.5,
          risk: 1.0
        }
      }
    ]
  }
];