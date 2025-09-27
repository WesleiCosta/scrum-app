import { User, Project, SprintLog, LegacyTransitionMatrix, LEGACY_STATE_MAP, ProjectState } from '../types';
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
export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage não está disponível. Dados não serão persistidos.');
    // Notificar usuário sobre problema de armazenamento
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('storage-unavailable', { 
        detail: { message: 'Dados não podem ser salvos. Verifique as configurações do navegador.' }
      }));
    }
    return false;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
    // Tentar notificar sobre erro de salvamento
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('storage-error', { 
        detail: { message: 'Erro ao salvar dados. Espaço em disco pode estar cheio.' }
      }));
    }
    return false;
  }
}

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage não está disponível. Retornando valor padrão.');
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    // Validação adicional do tipo de dados
    if (typeof parsed !== typeof defaultValue && defaultValue !== null) {
      console.warn(`Tipo de dados inconsistente no localStorage para key '${key}'. Usando valor padrão.`);
      return defaultValue;
    }
    return parsed;
  } catch (error) {
    console.error('Erro ao ler do localStorage:', error, 'key:', key);
    // Tentar limpar a entrada corrompida
    try {
      localStorage.removeItem(key);
    } catch (cleanupError) {
      console.error('Erro ao limpar entrada corrompida:', cleanupError);
    }
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
  add: (project: Project): boolean => {
    const projects = projectsStorage.get();
    projects.push(project);
    return projectsStorage.set(projects);
  },
  update: (projectId: string, updates: Partial<Project>): boolean => {
    if (!projectId || typeof projectId !== 'string') {
      console.error('ID do projeto inválido para atualização');
      return false;
    }
    
    const projects = projectsStorage.get();
    const index = projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
      return projectsStorage.set(projects);
    }
    console.warn('Projeto não encontrado para atualização:', projectId);
    return false;
  },
  remove: (projectId: string): boolean => {
    const projects = projectsStorage.get();
    const filtered = projects.filter(p => p.id !== projectId);
    return projectsStorage.set(filtered);
  },
  removeProjectWithSprints: (projectId: string) => {
    // Remover o projeto
    const projects = projectsStorage.get();
    const filtered = projects.filter(p => p.id !== projectId);
    projectsStorage.set(filtered);
    
    // Remover todos os sprints associados ao projeto
    const sprintLogs = sprintLogsStorage.get();
    const filteredSprints = sprintLogs.filter(log => log.projectId !== projectId);
    sprintLogsStorage.set(filteredSprints);
    
    // Remover matriz de transição associada ao projeto
    const matrices = transitionMatricesStorage.get();
    const filteredMatrices = matrices.filter(m => m.projectId !== projectId);
    transitionMatricesStorage.set(filteredMatrices);
    
    console.log(`Projeto ${projectId} e todos os dados associados foram removidos`);
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
  update: (logId: string, updates: Partial<SprintLog>): boolean => {
    if (!logId || typeof logId !== 'string') {
      console.error('ID do log inválido para atualização');
      return false;
    }
    
    const logs = sprintLogsStorage.get();
    const index = logs.findIndex(l => l.id === logId);
    if (index !== -1) {
      // Validar se as atualizações são válidas
      const validUpdates = Object.keys(updates).reduce((acc, key) => {
        const value = updates[key as keyof SprintLog];
        if (value !== undefined && value !== null) {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as Partial<SprintLog>);
      
      logs[index] = { ...logs[index], ...validUpdates, updatedAt: new Date().toISOString() };
      return sprintLogsStorage.set(logs);
    } else {
      console.warn('Log não encontrado para atualização:', logId);
      return false;
    }
  },
  remove: (logId: string) => {
    const logs = sprintLogsStorage.get();
    const filtered = logs.filter(l => l.id !== logId);
    sprintLogsStorage.set(filtered);
  }
};

export const transitionMatricesStorage = {
  get: (): LegacyTransitionMatrix[] => getStorageItem(STORAGE_KEYS.TRANSITION_MATRICES, []),
  set: (matrices: LegacyTransitionMatrix[]) => setStorageItem(STORAGE_KEYS.TRANSITION_MATRICES, matrices),
  getByProject: (projectId: string): LegacyTransitionMatrix | null => {
    const matrices = transitionMatricesStorage.get();
    return matrices.find(m => m.projectId === projectId) || null;
  },
  upsert: (matrix: LegacyTransitionMatrix) => {
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