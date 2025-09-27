import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SprintLog, SprintContextType, LegacyTransitionMatrix, StateProjection, ProjectState } from '../types';
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
  const [transitionMatrix, setTransitionMatrix] = useState<LegacyTransitionMatrix | null>(null);
  const [projections, setProjections] = useState<StateProjection[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (currentProject && isMounted) {
        await loadProjectData();
      } else if (isMounted) {
        setSprintLogs([]);
        setTransitionMatrix(null);
        setProjections([]);
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [currentProject]);

  const loadProjectData = () => {
    if (!currentProject || !currentProject.id) {
      console.warn('Projeto inválido para carregamento de dados');
      return;
    }

    try {
      const logs = sprintLogsStorage.getByProject(currentProject.id);
      setSprintLogs(logs);

      const matrix = transitionMatricesStorage.getByProject(currentProject.id);
      setTransitionMatrix(matrix);

      // Recalcula matriz se necessário
      if (!matrix || logs.length > 0) {
        const updatedMatrix = calculateTransitionMatrix(logs);
        const newTransitionMatrix: LegacyTransitionMatrix = {
          projectId: currentProject.id,
          matrix: updatedMatrix,
          lastUpdated: new Date().toISOString()
        };
        
        transitionMatricesStorage.upsert(newTransitionMatrix);
        setTransitionMatrix(newTransitionMatrix);
        
        // Calcular projeções após atualizar matriz
        if (logs.length >= APP_CONFIG.MIN_SPRINTS_FOR_PREDICTION) {
          const currentState = logs[logs.length - 1].finalState;
          const newProjections = calculateProjections(
            currentState, 
            updatedMatrix, 
            APP_CONFIG.PROJECTION_SPRINTS
          );
          setProjections(newProjections);
        } else {
          setProjections([]);
        }
      } else {
        setProjections([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do projeto:', error);
      setSprintLogs([]);
      setTransitionMatrix(null);
      setProjections([]);
    }
  };

  const addSprintLog = async (log: Omit<SprintLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!currentProject) {
      console.error('Erro: Nenhum projeto selecionado para adicionar sprint');
      return;
    }

    // Validar dados de entrada
    if (!log.sprintName || !log.finalState || !log.endDate) {
      console.error('Erro: Dados obrigatórios não informados');
      return;
    }

    try {
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
      
      // Recalcular matriz imediatamente após atualização
      refreshMatrix();
    } catch (error) {
      console.error('Erro ao adicionar sprint log:', error);
    }
  };

  const updateSprintLog = async (logId: string, updates: Partial<SprintLog>): Promise<void> => {
    if (!currentProject) {
      console.error('Erro: Nenhum projeto selecionado para atualizar sprint');
      return;
    }

    try {
      sprintLogsStorage.update(logId, updates);
      
      // Atualizar estado local
      const updatedLogs = sprintLogs.map(log => 
        log.id === logId ? { ...log, ...updates, updatedAt: new Date().toISOString() } : log
      );
      setSprintLogs(updatedLogs);
      
      // Recalcular matriz imediatamente após atualização
      refreshMatrix();
    } catch (error) {
      console.error('Erro ao atualizar sprint log:', error);
    }
  };

  const deleteSprintLog = async (logId: string): Promise<void> => {
    if (!currentProject) {
      console.error('Erro: Nenhum projeto selecionado para deletar sprint');
      return;
    }

    try {
      sprintLogsStorage.remove(logId);
      
      // Atualizar estado local
      const updatedLogs = sprintLogs.filter(log => log.id !== logId);
      setSprintLogs(updatedLogs);
      
      // Recalcular matriz imediatamente após atualização
      refreshMatrix();
    } catch (error) {
      console.error('Erro ao deletar sprint log:', error);
    }
  };

  const refreshMatrix = () => {
    if (!currentProject) return;

    try {
      // Buscar logs atualizados do storage para garantir dados mais recentes
      const logs = sprintLogsStorage.getByProject(currentProject.id);
      
      if (logs.length < 1) {
        // Se não há logs suficientes, limpar matriz e projeções
        setTransitionMatrix(null);
        setProjections([]);
        return;
      }
      
      const matrix = calculateTransitionMatrix(logs);
      
      const newTransitionMatrix: LegacyTransitionMatrix = {
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
    } catch (error) {
      console.error('Erro ao atualizar matriz de transição:', error);
      // Em caso de erro, limpar estados para evitar dados inconsistentes
      setTransitionMatrix(null);
      setProjections([]);
    }
  };

  const calculateStateProjections = (currentState: ProjectState): StateProjection[] => {
    if (!transitionMatrix) {
      return [];
    }

    try {
      const newProjections = calculateProjections(
        currentState, 
        transitionMatrix.matrix, 
        APP_CONFIG.PROJECTION_SPRINTS
      );

      setProjections(newProjections);
      return newProjections;
    } catch (error) {
      console.error('Erro ao calcular projeções:', error);
      return [];
    }
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