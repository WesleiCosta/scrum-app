// Tipos fundamentais para sistema Scrum-Markov
export type ProjectState = 'CRÍTICO' | 'RISCO' | 'ESTÁVEL' | 'BOM' | 'EXCELENTE';
export type UnifiedState = 'Saudável' | 'Em Risco' | 'Crítico';
export type ProjectStatus = 'CALIBRATING' | 'ACTIVE';
export type MatrixType = 'INITIAL' | 'DYNAMIC';
export type ComparisonOperator = 'GTE' | 'LTE' | 'EQ' | 'GT' | 'LT';

// Mapeamento de estados legados para compatibilidade
export const LEGACY_STATE_MAP = {
  'P1': 'EXCELENTE',
  'P2': 'BOM', 
  'P3': 'ESTÁVEL',
  'P4': 'RISCO',
  'P5': 'CRÍTICO'
} as const;

export const STATE_INDEX_MAP = {
  'EXCELENTE': 0,
  'BOM': 1,
  'ESTÁVEL': 2,
  'RISCO': 3,
  'CRÍTICO': 4
} as const;

// Sistema de Estados Unificados Scrum-Markov
export const UNIFIED_STATE_MAP: { [key in UnifiedState]: number } = {
  'Saudável': 0,
  'Em Risco': 1, 
  'Crítico': 2
};

// Critério de Rubrica - Implementação da Especificação Seção 2.2
export interface RubricCriterion {
  id: string;
  stateId: number; // Referencia StateDefinition.id
  metricName: string; // Chave da métrica no payload da sprint
  operator: ComparisonOperator;
  thresholdValue: number;
  description?: string;
}

// Rubrica de Classificação - Seção 2.2
export interface Rubric {
  id: string;
  projectId: string;
  name: string;
  isActive: boolean;
  criteria: RubricCriterion[];
  createdAt: string;
  updatedAt: string;
}

// Definição de Estado - Implementação da Especificação Seção 1.2
export interface StateDefinition {
  id: number; // Identificador numérico conforme especificação
  projectId: string;
  name: string;
  description: string;
  criticalityOrder: number; // Para avaliação ordenada (3=Crítico, 2=Risco, 1=Saudável)
  color: string;
  bgColor: string;
  borderColor: string;
}

// Matriz de Transição - Implementação da Especificação Seção 1.2
export type TransitionMatrix = number[][];

export interface TransitionMatrixSnapshot {
  id: string;
  projectId: string;
  sprintId: string; // Sprint que gerou esta matriz
  matrixType: MatrixType;
  matrixPayload: TransitionMatrix; // Matriz NxN serializada
  createdAt: string;
  windowSize?: number; // Tamanho da janela N para matriz dinâmica
}

// Transição de Estados - Conceito lógico da Seção 1.2
export interface StateTransition {
  fromStateId: number;
  toStateId: number;
  fromSprintNumber: number;
  toSprintNumber: number;
  transitionDate: string;
}

// Previsão de Estado Futuro - Para algoritmo S_{t+k} = S_t × P^k
export interface StatePrediction {
  step: number; // k passos no futuro
  probabilities: number[]; // Vetor de probabilidades por estado
  confidence: 'Baixa' | 'Média' | 'Alta';
  calculatedAt: string;
}

// Usuário
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Projeto - Implementação da Especificação Seção 1.2
export interface Project {
  id: string;
  name: string;
  description: string;
  adminId: string;
  memberIds: string[];
  nValue: number; // Tamanho da janela deslizante N
  status: ProjectStatus;
  activeRubricId?: string;
  stateDefinitions: StateDefinition[];
  createdAt: string;
  updatedAt: string;
}

// Sprint Log
export interface SprintLog {
  id: string;
  projectId: string;
  sprintName: string;
  endDate: string;
  finalState: ProjectState;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

// Matriz de Transição Legada - Mantida para compatibilidade
export interface LegacyTransitionMatrix {
  projectId: string;
  matrix: number[][]; // 5x5 matrix
  lastUpdated: string;
}

// Projeção de Estados Futuros
export interface StateProjection {
  sprint: string;
  probabilities: {
    CRÍTICO: number;
    RISCO: number;
    ESTÁVEL: number;
    BOM: number;
    EXCELENTE: number;
  };
}

// Contexto de Autenticação
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

// Contexto de Projeto
export interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  setCurrentProject: (project: Project | null) => void;
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'adminId'>) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  inviteMember: (projectId: string, email: string) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
  updateStateDefinitions: (projectId: string, definitions: StateDefinition[]) => Promise<void>;
}

// Contexto de Sprint
export interface SprintContextType {
  sprintLogs: SprintLog[];
  transitionMatrix: LegacyTransitionMatrix | null;
  projections: StateProjection[];
  addSprintLog: (log: Omit<SprintLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSprintLog: (logId: string, updates: Partial<SprintLog>) => Promise<void>;
  deleteSprintLog: (logId: string) => Promise<void>;
  calculateProjections: (currentState: ProjectState) => StateProjection[];
  refreshMatrix: () => void;
}