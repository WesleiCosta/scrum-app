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
    const newLog: SprintLog = {
      ...log,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sprintLogsStorage.add(newLog);
    setSprintLogs(prev => [...prev, newLog]);
    
    // Recalcula matriz automaticamente
    setTimeout(() => refreshMatrix(), 100);
  };

  const updateSprintLog = async (logId: string, updates: Partial<SprintLog>): Promise<void> => {
    sprintLogsStorage.update(logId, updates);
    setSprintLogs(prev => prev.map(log => 
      log.id === logId ? { ...log, ...updates, updatedAt: new Date().toISOString() } : log
    ));
    
    // Recalcula matriz automaticamente
    setTimeout(() => refreshMatrix(), 100);
  };

  const deleteSprintLog = async (logId: string): Promise<void> => {
    sprintLogsStorage.remove(logId);
    setSprintLogs(prev => prev.filter(log => log.id !== logId));
    
    // Recalcula matriz automaticamente
    setTimeout(() => refreshMatrix(), 100);
  };

  const refreshMatrix = () => {
    if (!currentProject) return;

    const logs = sprintLogsStorage.getByProject(currentProject.id);
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