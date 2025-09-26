import { StateDefinition } from '../types';

// Definições padrão dos 5 estados do Scrum-Markov
export const DEFAULT_STATE_DEFINITIONS: StateDefinition[] = [
  {
    id: 0,
    projectId: '',
    name: 'Excelente',
    description: 'Projeto superando expectativas, entrega excepcional',
    criticalityOrder: 1,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 1,
    projectId: '',
    name: 'Bom',
    description: 'Projeto em bom estado, acima da média esperada',
    criticalityOrder: 1,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 2,
    projectId: '',
    name: 'Estável',
    description: 'Projeto estável, progresso normal conforme planejado',
    criticalityOrder: 2,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  {
    id: 3,
    projectId: '',
    name: 'Em Risco',
    description: 'Projeto em situação de risco, atenção necessária',
    criticalityOrder: 3,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 4,
    projectId: '',
    name: 'Crítico',
    description: 'Projeto em estado crítico, intervenção urgente necessária',
    criticalityOrder: 3,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
];

// Chaves para LocalStorage
export const STORAGE_KEYS = {
  USER: 'scrum-markov-user',
  PROJECTS: 'scrum-markov-projects',
  SPRINT_LOGS: 'scrum-markov-sprint-logs',
  TRANSITION_MATRICES: 'scrum-markov-transition-matrices'
} as const;

// Configurações da aplicação
export const APP_CONFIG = {
  APP_NAME: 'Scrum-Markov',
  VERSION: '1.0.0',
  PROJECTION_SPRINTS: 3, // Número de sprints para projeção
  MIN_SPRINTS_FOR_PREDICTION: 2 // Mínimo de sprints para calcular predições
} as const;