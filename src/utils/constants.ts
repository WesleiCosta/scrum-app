import { StateDefinition } from '../types';

// Definições padrão dos 5 estados do Scrum-Markov
export const DEFAULT_STATE_DEFINITIONS: StateDefinition[] = [
  {
    id: 'EXCELENTE',
    name: 'Excelente',
    description: 'Projeto superando expectativas, entrega excepcional',
    criteria: [
      'Entrega de valor alta e consistente',
      'Equipe altamente engajada e produtiva',
      'Conformidade total com processos e padrões',
      'Stakeholders muito satisfeitos',
      'Débito técnico mínimo ou inexistente'
    ],
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'BOM',
    name: 'Bom',
    description: 'Projeto em bom estado, acima da média esperada',
    criteria: [
      'Entrega funcional consistente e boa',
      'Equipe produtiva e motivada',
      'Processos funcionando adequadamente',
      'Stakeholders satisfeitos',
      'Débito técnico controlado'
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'ESTÁVEL',
    name: 'Estável',
    description: 'Projeto estável, progresso normal conforme planejado',
    criteria: [
      'Entrega dentro do esperado',
      'Progresso constante e previsível',
      'Equipe trabalhando adequadamente',
      'Processos padronizados funcionando',
      'Débito técnico sob controle'
    ],
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  {
    id: 'RISCO',
    name: 'Em Risco',
    description: 'Projeto em situação de risco, atenção necessária',
    criteria: [
      'Entrega de backlog parcial ou irregular',
      'Débito técnico começando a se acumular',
      'Falhas de qualidade emergindo',
      'Equipe com sinais de desgaste',
      'Processos sendo negligenciados'
    ],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: 'CRÍTICO',
    name: 'Crítico',
    description: 'Projeto em estado crítico, intervenção urgente necessária',
    criteria: [
      'Entrega significativamente comprometida',
      'Vulnerabilidades críticas ou bloqueios',
      'Débito técnico alto impactando produtividade',
      'Equipe sobrecarregada ou desmotivada',
      'Risco elevado de não cumprimento de prazos'
    ],
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