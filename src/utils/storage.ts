import { User, Project, SprintLog, TransitionMatrix, LEGACY_STATE_MAP, ProjectState } from '../types';
import { STORAGE_KEYS } from './constants';

// Função para verificar se localStorage está disponível
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Funções genéricas para localStorage
export function setStorageItem<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage não está disponível. Dados não serão persistidos.');
    return;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
}

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage não está disponível. Retornando valor padrão.');
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Erro ao ler do localStorage:', error);
    return defaultValue;
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Erro ao remover do localStorage:', error);
  }
}

// Funções específicas para dados da aplicação
export const userStorage = {
  get: (): User | null => getStorageItem(STORAGE_KEYS.USER, null),
  set: (user: User) => setStorageItem(STORAGE_KEYS.USER, user),
  remove: () => removeStorageItem(STORAGE_KEYS.USER)
};

export const projectsStorage = {
  get: (): Project[] => getStorageItem(STORAGE_KEYS.PROJECTS, []),
  set: (projects: Project[]) => setStorageItem(STORAGE_KEYS.PROJECTS, projects),
  add: (project: Project) => {
    const projects = projectsStorage.get();
    projects.push(project);
    projectsStorage.set(projects);
  },
  update: (projectId: string, updates: Partial<Project>) => {
    const projects = projectsStorage.get();
    const index = projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
      projectsStorage.set(projects);
    }
  },
  remove: (projectId: string) => {
    const projects = projectsStorage.get();
    const filtered = projects.filter(p => p.id !== projectId);
    projectsStorage.set(filtered);
  }
};

export const sprintLogsStorage = {
  get: (): SprintLog[] => getStorageItem(STORAGE_KEYS.SPRINT_LOGS, []),
  set: (logs: SprintLog[]) => setStorageItem(STORAGE_KEYS.SPRINT_LOGS, logs),
  getByProject: (projectId: string): SprintLog[] => {
    return sprintLogsStorage.get().filter(log => log.projectId === projectId);
  },
  add: (log: SprintLog) => {
    const logs = sprintLogsStorage.get();
    logs.push(log);
    sprintLogsStorage.set(logs);
  },
  update: (logId: string, updates: Partial<SprintLog>) => {
    const logs = sprintLogsStorage.get();
    const index = logs.findIndex(l => l.id === logId);
    if (index !== -1) {
      logs[index] = { ...logs[index], ...updates, updatedAt: new Date().toISOString() };
      sprintLogsStorage.set(logs);
    }
  },
  remove: (logId: string) => {
    const logs = sprintLogsStorage.get();
    const filtered = logs.filter(l => l.id !== logId);
    sprintLogsStorage.set(filtered);
  }
};

export const transitionMatricesStorage = {
  get: (): TransitionMatrix[] => getStorageItem(STORAGE_KEYS.TRANSITION_MATRICES, []),
  set: (matrices: TransitionMatrix[]) => setStorageItem(STORAGE_KEYS.TRANSITION_MATRICES, matrices),
  getByProject: (projectId: string): TransitionMatrix | null => {
    const matrices = transitionMatricesStorage.get();
    return matrices.find(m => m.projectId === projectId) || null;
  },
  upsert: (matrix: TransitionMatrix) => {
    const matrices = transitionMatricesStorage.get();
    const index = matrices.findIndex(m => m.projectId === matrix.projectId);
    
    if (index !== -1) {
      matrices[index] = matrix;
    } else {
      matrices.push(matrix);
    }
    
    transitionMatricesStorage.set(matrices);
  }
};

// Função para gerar IDs únicos
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para formatar data
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Função para formatar data e hora
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR');
}

// Função de migração para converter estados legados
export function migrateSprintLogs(): void {
  try {
    const sprintLogs = sprintLogsStorage.get();
    let needsMigration = false;
    
    const migratedLogs = sprintLogs.map(log => {
      const oldState = log.finalState as string;
      if (oldState.startsWith('P') && LEGACY_STATE_MAP[oldState as keyof typeof LEGACY_STATE_MAP]) {
        needsMigration = true;
        return {
          ...log,
          finalState: LEGACY_STATE_MAP[oldState as keyof typeof LEGACY_STATE_MAP] as ProjectState
        };
      }
      return log;
    });
    
    if (needsMigration) {
      console.log('Migrando estados de sprints para nova nomenclatura...');
      sprintLogsStorage.set(migratedLogs);
      // Limpar matrizes de transição para recálculo
      setStorageItem(STORAGE_KEYS.TRANSITION_MATRICES, []);
    }
  } catch (error) {
    console.error('Erro na migração de dados:', error);
  }
}