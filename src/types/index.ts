// Tipos para os estados do projeto Scrum-Markov
export type ProjectState = 'CRÍTICO' | 'RISCO' | 'ESTÁVEL' | 'BOM' | 'EXCELENTE';

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

// Definições dos estados padrão
export interface StateDefinition {
  id: ProjectState;
  name: string;
  description: string;
  criteria: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

// Usuário
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Projeto/Time
export interface Project {
  id: string;
  name: string;
  description: string;
  adminId: string;
  memberIds: string[];
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

// Matriz de Transição
export interface TransitionMatrix {
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
  transitionMatrix: TransitionMatrix | null;
  projections: StateProjection[];
  addSprintLog: (log: Omit<SprintLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSprintLog: (logId: string, updates: Partial<SprintLog>) => Promise<void>;
  deleteSprintLog: (logId: string) => Promise<void>;
  calculateProjections: (currentState: ProjectState) => StateProjection[];
  refreshMatrix: () => void;
}