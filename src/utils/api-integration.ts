/**
 * Integração API-Contextos - Sistema Scrum-Markov
 * Conecta os serviços da API mock com os contextos React existentes
 */

import { scrumMarkovAPI } from './simple-scrum-api';
import { RubricService } from './rubric-service';
import { MatrixSnapshotService } from './matrix-snapshot-service';
import { Project, SprintLog, UnifiedState, ProjectStatus } from '../types';
import { ScrumMarkovEngine } from './scrum-markov-engine';
import { projectsStorage, sprintLogsStorage } from './storage';

export class APIContextIntegration {
  private static api = scrumMarkovAPI;

  /**
   * Inicializar projeto com configuração científica completa
   */
  static async initializeProject(
    name: string,
    description: string,
    nValue: number = 10
  ): Promise<Project> {
    try {
      // 1. Criar projeto via API mock
      const apiProject = await this.api.createProject({ 
        name, 
        n_value: nValue 
      });

      // 2. Converter para formato do contexto local
      const project: Project = {
        ...apiProject,
        description,
        nValue,
        status: 'CALIBRATING' as ProjectStatus,
        stateDefinitions: [], // Será populado pelas constantes padrão
      };

      // 3. Salvar no storage local
      projectsStorage.add(project);

      // 4. Criar rubrica padrão
      const defaultRubric = RubricService.createDefaultRubric(project.id);
      RubricService.activateRubric(project.id, defaultRubric.id);

      // 5. Atualizar projeto com rubrica ativa
      const updatedProject = { ...project, activeRubricId: defaultRubric.id };
      projectsStorage.update(project.id, { activeRubricId: defaultRubric.id });

      console.log('Projeto inicializado com configuração científica:', {
        projectId: project.id,
        nValue,
        rubricId: defaultRubric.id,
        status: 'CALIBRATING'
      });

      return updatedProject;
    } catch (error) {
      console.error('Erro na inicialização do projeto:', error);
      throw error;
    }
  }

  /**
   * Definir matriz inicial via API e criar snapshot
   */
  static async setInitialMatrix(
    projectId: string, 
    matrix: number[][]
  ): Promise<boolean> {
    try {
      // 1. Definir matriz via API
      const response = await this.api.setInitialMatrix(projectId, matrix);
      const success = response.status === 'Matriz P_0 definida com sucesso';
      
      if (success) {
        // 2. Criar snapshot da matriz inicial
        MatrixSnapshotService.createSnapshot(
          projectId,
          'initial_matrix',
          'INITIAL',
          matrix
        );

        // 3. Atualizar status do projeto para ACTIVE
        projectsStorage.update(projectId, { 
          status: 'ACTIVE' as ProjectStatus 
        });

        console.log('Matriz inicial definida e projeto ativado:', {
          projectId,
          matrixDimensions: `${matrix.length}x${matrix[0]?.length || 0}`
        });
      }

      return success;
    } catch (error) {
      console.error('Erro ao definir matriz inicial:', error);
      return false;
    }
  }

  /**
   * Processar sprint com classificação científica
   */
  static async processSprint(
    projectId: string,
    sprintData: {
      sprintName: string;
      endDate: string;
      metrics: Record<string, number>;
      observations?: string;
    }
  ): Promise<SprintLog | null> {
    try {
      // 1. Obter rubrica ativa do projeto
      const activeRubric = RubricService.getActiveRubric(projectId);
      if (!activeRubric) {
        console.error('Nenhuma rubrica ativa encontrada para o projeto');
        return null;
      }

      // 2. Classificar estado via engine científico
      const classifiedState = ScrumMarkovEngine.classifySprintState(
        sprintData.metrics,
        activeRubric.criteria
      );

      // 3. Mapear UnifiedState para ProjectState para compatibilidade
      const projectStateMap: Record<UnifiedState, string> = {
        'Saudável': 'BOM',      // Corrigido: Saudável -> BOM ao invés de ESTÁVEL
        'Em Risco': 'RISCO', 
        'Crítico': 'CRÍTICO'
      };
      
      const finalState = projectStateMap[classifiedState] as any;

      // 4. Processar via API mock
      const apiResponse = await this.api.processSprintData(projectId, {
        sprint_number: sprintLogsStorage.getByProject(projectId).length + 1,
        metrics: sprintData.metrics,
        end_date: sprintData.endDate
      });

      if (apiResponse.status !== 'processed') {
        console.error('Erro no processamento da sprint via API');
        return null;
      }

      // 5. Criar SprintLog para o contexto local
      const sprintLog: SprintLog = {
        id: `sprint_${Date.now()}`,
        projectId,
        sprintName: sprintData.sprintName,
        endDate: sprintData.endDate,
        finalState,
        observations: sprintData.observations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 6. Salvar no storage local
      sprintLogsStorage.add(sprintLog);

      // 7. Obter matriz dinâmica atualizada e criar snapshot
      const currentSprints = sprintLogsStorage.getByProject(projectId);
      if (currentSprints.length >= 2) {
        const project = projectsStorage.get().find(p => p.id === projectId);
        if (project) {
          const stateHistory = currentSprints.map(s => 
            this.mapProjectStateToUnified(s.finalState)
          );
          
          const dynamicMatrix = ScrumMarkovEngine.calculateDynamicTransitionMatrix(
            stateHistory,
            project.nValue
          );

          // Criar snapshot da matriz dinâmica
          MatrixSnapshotService.createSnapshot(
            projectId,
            sprintLog.id,
            'DYNAMIC',
            dynamicMatrix
          );
        }
      }

      console.log('Sprint processada com sucesso:', {
        sprintId: sprintLog.id,
        classifiedState,
        finalState,
        projectId
      });

      return sprintLog;
    } catch (error) {
      console.error('Erro ao processar sprint:', error);
      return null;
    }
  }

  /**
   * Obter previsões futuras integradas
   */
  static async getFuturePredictions(
    projectId: string, 
    steps: number = 5
  ): Promise<Array<{
    step: number;
    probabilities: Record<string, number>;
    confidence: 'Baixa' | 'Média' | 'Alta';
  }>> {
    try {
      // 1. Obter previsões via API
      const apiPredictions = await this.api.getPredictions(projectId, steps);

      // 2. Obter histórico local para melhorar precisão
      const sprintHistory = sprintLogsStorage.getByProject(projectId);
      
      if (sprintHistory.length === 0) {
        return [];
      }

      // 3. Usar engine científico para previsões mais precisas
      const project = projectsStorage.get().find(p => p.id === projectId);
      if (!project) {
        // Converter format da API para formato esperado
        return apiPredictions.map(pred => ({
          step: pred.step,
          probabilities: {
            'Saudável': pred.probabilities[0] || 0,
            'Em Risco': pred.probabilities[1] || 0,
            'Crítico': pred.probabilities[2] || 0
          },
          confidence: 'Baixa' as const // Fallback quando não há dados suficientes
        }));
      }

      const unifiedHistory = sprintHistory.map(sprint => 
        this.mapProjectStateToUnified(sprint.finalState)
      );

      // 4. Calcular matriz dinâmica atual
      const currentMatrix = ScrumMarkovEngine.calculateDynamicTransitionMatrix(
        unifiedHistory,
        project.nValue
      );

      // 5. Gerar previsões científicas
      const currentState = this.mapProjectStateToUnified(
        sprintHistory[sprintHistory.length - 1].finalState
      );
      
      const scientificPredictions = ScrumMarkovEngine.generateFuturePredictions(
        currentState,
        currentMatrix,
        steps
      );

      // 6. Converter para formato compatível
      return scientificPredictions.map(pred => ({
        step: pred.step,
        probabilities: {
          'Saudável': pred.probabilities[0] || 0,
          'Em Risco': pred.probabilities[1] || 0,
          'Crítico': pred.probabilities[2] || 0
        },
        confidence: pred.confidence
      }));

    } catch (error) {
      console.error('Erro ao obter previsões:', error);
      return [];
    }
  }

  /**
   * Sincronizar dados entre API e contextos
   */
  static async syncProjectData(projectId: string): Promise<boolean> {
    try {
      // 1. Obter dados da API
      const apiProject = await this.api.getProject(projectId);
      if (!apiProject) return false;

      // 2. Sincronizar com storage local
      const localProjects = projectsStorage.get();
      const localProject = localProjects.find(p => p.id === projectId);
      
      if (localProject) {
        projectsStorage.update(projectId, {
          nValue: apiProject.nValue,
          status: apiProject.status,
          updatedAt: new Date().toISOString()
        });
      }

      // 3. Limpar snapshots antigos (manter últimos 50)
      MatrixSnapshotService.cleanupOldSnapshots(projectId, 50);

      console.log('Dados sincronizados com sucesso:', { projectId });
      return true;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return false;
    }
  }

  /**
   * Mapear ProjectState para UnifiedState
   */
  private static mapProjectStateToUnified(projectState: string): UnifiedState {
    const stateMap: Record<string, UnifiedState> = {
      'EXCELENTE': 'Saudável',
      'BOM': 'Saudável',
      'ESTÁVEL': 'Saudável',
      'RISCO': 'Em Risco',
      'CRÍTICO': 'Crítico'
    };
    
    return stateMap[projectState] || 'Em Risco';
  }

  /**
   * Obter estatísticas completas do projeto
   */
  static async getProjectAnalytics(projectId: string): Promise<{
    sprintCount: number;
    matrixSnapshots: number;
    activeRubric?: string;
    currentStatus: ProjectStatus;
    predictions: number;
    lastUpdate: string;
  }> {
    const sprintHistory = sprintLogsStorage.getByProject(projectId);
    const matrixStats = MatrixSnapshotService.getProjectStats(projectId);
    const activeRubric = RubricService.getActiveRubric(projectId);
    const project = projectsStorage.get().find(p => p.id === projectId);

    return {
      sprintCount: sprintHistory.length,
      matrixSnapshots: matrixStats.totalSnapshots,
      activeRubric: activeRubric?.name,
      currentStatus: project?.status || 'CALIBRATING',
      predictions: sprintHistory.length >= 2 ? 5 : 0,
      lastUpdate: project?.updatedAt || new Date().toISOString()
    };
  }
}