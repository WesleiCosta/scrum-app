import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SprintLog, SprintContextType, TransitionMatrix, StateProjection, ProjectState } from '../types';
import { sprintLogsStorage, transitionMatricesStorage, generateId } from '../utils/storage';
import { calculateTransitionMatrix, calculateProjections } from '../utils/markov';
import { useProject } from './ProjectContext';
import { APP_CONFIG } from '../utils/constants';

const SprintContext = createContext<SprintContextType | undefined>(undefined);

interface SprintProviderProps {
  children: ReactNode;
}

export function SprintProvider({ children }: SprintProviderProps) {
  const { currentProject } = useProject();
  const [sprintLogs, setSprintLogs] = useState<SprintLog[]>([]);
  const [transitionMatrix, setTransitionMatrix] = useState<TransitionMatrix | null>(null);
  const [projections, setProjections] = useState<StateProjection[]>([]);

  useEffect(() => {
    if (currentProject) {
      loadProjectData();
    } else {
      setSprintLogs([]);
      setTransitionMatrix(null);
      setProjections([]);
    }
  }, [currentProject]);

  const loadProjectData = () => {
    if (!currentProject) return;

    const logs = sprintLogsStorage.getByProject(currentProject.id);
    setSprintLogs(logs);

    const matrix = transitionMatricesStorage.getByProject(currentProject.id);
    setTransitionMatrix(matrix);

    // Recalcula matriz se necessário
    if (!matrix || logs.length > 0) {
      refreshMatrix();
    }

    // Calcula projeções se houver dados suficientes
    if (logs.length >= APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION && matrix) {
      const currentState = logs[logs.length - 1].finalState;
      const newProjections = calculateProjections(
        currentState, 
        matrix.matrix, 
        APP_CONFIG.PROJECTION_SPRINTS
      );
      setProjections(newProjections);
    } else {
      setProjections([]);
    }
  };

  const addSprintLog = async (log: Omit<SprintLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!currentProject) {
      console.error('Erro: Nenhum projeto selecionado para adicionar sprint');
      return;
    }

    const newLog: SprintLog = {
      ...log,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sprintLogsStorage.add(newLog);
    
    // Atualizar estado local com o novo log
    const updatedLogs = [...sprintLogs, newLog];
    setSprintLogs(updatedLogs);
    
    // Agendar recalculo da matriz após o estado ser atualizado
    setTimeout(() => refreshMatrix(), 0);
  };

  const updateSprintLog = async (logId: string, updates: Partial<SprintLog>): Promise<void> => {
    if (!currentProject) {
      console.error('Erro: Nenhum projeto selecionado para atualizar sprint');
      return;
    }

    sprintLogsStorage.update(logId, updates);
    
    // Atualizar estado local
    const updatedLogs = sprintLogs.map(log => 
      log.id === logId ? { ...log, ...updates, updatedAt: new Date().toISOString() } : log
    );
    setSprintLogs(updatedLogs);
    
    // Agendar recalculo da matriz após o estado ser atualizado
    setTimeout(() => refreshMatrix(), 0);
  };

  const deleteSprintLog = async (logId: string): Promise<void> => {
    if (!currentProject) {
      console.error('Erro: Nenhum projeto selecionado para deletar sprint');
      return;
    }

    sprintLogsStorage.remove(logId);
    
    // Atualizar estado local
    const updatedLogs = sprintLogs.filter(log => log.id !== logId);
    setSprintLogs(updatedLogs);
    
    // Agendar recalculo da matriz após o estado ser atualizado
    setTimeout(() => refreshMatrix(), 0);
  };

  const refreshMatrix = () => {
    if (!currentProject) return;

    // Usar os logs do estado atual ao invés de buscar do storage novamente
    const logs = sprintLogs;
    const matrix = calculateTransitionMatrix(logs);
    
    const newTransitionMatrix: TransitionMatrix = {
      projectId: currentProject.id,
      matrix,
      lastUpdated: new Date().toISOString()
    };

    transitionMatricesStorage.upsert(newTransitionMatrix);
    setTransitionMatrix(newTransitionMatrix);

    // Calcula projeções após atualizar a matriz
    if (logs.length >= APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION) {
      const currentState = logs[logs.length - 1].finalState;
      const newProjections = calculateProjections(
        currentState, 
        matrix, 
        APP_CONFIG.PROJECTION_SPRINTS
      );
      setProjections(newProjections);
    } else {
      setProjections([]);
    }
  };

  const calculateStateProjections = (currentState: ProjectState): StateProjection[] => {
    if (!transitionMatrix) {
      return [];
    }

    const newProjections = calculateProjections(
      currentState, 
      transitionMatrix.matrix, 
      APP_CONFIG.PROJECTION_SPRINTS
    );

    setProjections(newProjections);
    return newProjections;
  };

  const value: SprintContextType = {
    sprintLogs,
    transitionMatrix,
    projections,
    addSprintLog,
    updateSprintLog,
    deleteSprintLog,
    calculateProjections: calculateStateProjections,
    refreshMatrix
  };

  return (
    <SprintContext.Provider value={value}>
      {children}
    </SprintContext.Provider>
  );
}

export function useSprint(): SprintContextType {
  const context = useContext(SprintContext);
  if (context === undefined) {
    throw new Error('useSprint deve ser usado dentro de um SprintProvider');
  }
  return context;
}