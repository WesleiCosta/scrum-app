/**
 * API Service Mock Simplificado - Sistema Scrum-Markov
 * Implementação básica dos endpoints principais da especificação
 */

import { 
  Project, 
  ProjectStatus, 
  TransitionMatrix, 
  UnifiedState,
  SprintLog
} from '../types';
import { ScrumMarkovEngine } from './scrum-markov-engine';

export interface SprintMetrics {
  sprint_number: number;
  metrics: Record<string, number>;
  end_date?: string;
}

export interface SprintProcessingResponse {
  status: 'processed' | 'error';
  classified_state_id: number;
  classified_state_name: UnifiedState;
}

class SimpleScrumMarkovAPI {
  private static instance: SimpleScrumMarkovAPI;
  private projects: Map<string, Project> = new Map();
  private sprintHistory: Map<string, SprintLog[]> = new Map();
  private initialMatrices: Map<string, TransitionMatrix> = new Map();

  private constructor() {}

  static getInstance(): SimpleScrumMarkovAPI {
    if (!SimpleScrumMarkovAPI.instance) {
      SimpleScrumMarkovAPI.instance = new SimpleScrumMarkovAPI();
    }
    return SimpleScrumMarkovAPI.instance;
  }

  async createProject(data: { name: string; n_value: number }): Promise<Project> {
    const projectId = `proj_${Date.now()}`;
    
    const project: Project = {
      id: projectId,
      name: data.name,
      description: '',
      adminId: 'mock_admin',
      memberIds: [],
      nValue: data.n_value,
      status: 'CALIBRATING' as ProjectStatus,
      stateDefinitions: [
        {
          id: 1,
          projectId: projectId,
          name: 'Saudável',
          description: 'Estado saudável',
          criticalityOrder: 1,
          color: '#10B981',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        },
        {
          id: 2,
          projectId: projectId,
          name: 'Em Risco',
          description: 'Estado de risco',
          criticalityOrder: 2,
          color: '#F59E0B',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        },
        {
          id: 3,
          projectId: projectId,
          name: 'Crítico',
          description: 'Estado crítico',
          criticalityOrder: 3,
          color: '#EF4444',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.set(projectId, project);
    this.sprintHistory.set(projectId, []);
    
    return project;
  }

  async setInitialMatrix(projectId: string, matrix: TransitionMatrix): Promise<{ status: string }> {
    if (!ScrumMarkovEngine.validateStochasticMatrix(matrix)) {
      throw new Error('Matriz não é estocástica');
    }

    this.initialMatrices.set(projectId, matrix);
    return { status: 'Matriz P_0 definida com sucesso' };
  }

  async processSprintData(projectId: string, sprintData: SprintMetrics): Promise<SprintProcessingResponse> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Projeto ${projectId} não encontrado`);
    }

    // Classificação simplificada baseada em métricas
    const classifiedState = this.classifySprintSimple(sprintData.metrics);

    const sprintLog: SprintLog = {
      id: `sprint_${Date.now()}`,
      projectId: projectId,
      sprintName: `Sprint ${sprintData.sprint_number}`,
      endDate: sprintData.end_date || new Date().toISOString(),
      finalState: this.mapUnifiedToProjectState(classifiedState),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const history = this.sprintHistory.get(projectId) || [];
    history.push(sprintLog);
    this.sprintHistory.set(projectId, history);

    // Atualizar status do projeto
    if (project.status === 'CALIBRATING' && history.length >= project.nValue) {
      project.status = 'ACTIVE';
      this.projects.set(projectId, project);
    }

    return {
      status: 'processed',
      classified_state_id: this.getStateId(classifiedState),
      classified_state_name: classifiedState
    };
  }

  async getPredictions(projectId: string, steps: number = 5): Promise<Array<{
    step: number;
    probabilities: number[];
  }>> {
    const history = this.sprintHistory.get(projectId) || [];
    if (history.length === 0) return [];

    const stateHistory = history.map(h => this.mapProjectToUnifiedState(h.finalState));
    const currentState = stateHistory[stateHistory.length - 1];
    
    const matrix = this.getCurrentMatrix(projectId, stateHistory);
    
    const predictions = ScrumMarkovEngine.generateFuturePredictions(
      currentState,
      matrix,
      steps
    );

    return predictions.map(p => ({
      step: p.step,
      probabilities: p.probabilities
    }));
  }

  private getCurrentMatrix(projectId: string, stateHistory: UnifiedState[]): TransitionMatrix {
    const project = this.projects.get(projectId);
    const windowSize = project?.nValue || 10;

    if (stateHistory.length >= 2) {
      return ScrumMarkovEngine.calculateDynamicTransitionMatrix(stateHistory, windowSize);
    }

    const initialMatrix = this.initialMatrices.get(projectId);
    return initialMatrix || [[1/3, 1/3, 1/3], [1/3, 1/3, 1/3], [1/3, 1/3, 1/3]];
  }

  private classifySprintSimple(metrics: Record<string, number>): UnifiedState {
    const storyPoints = metrics.story_points_completed_percent || 0;
    const vulnerabilities = metrics.critical_vulnerabilities || 0;

    if (storyPoints >= 90 && vulnerabilities === 0) {
      return 'Saudável';
    } else if (storyPoints >= 70 && vulnerabilities <= 2) {
      return 'Em Risco';
    } else {
      return 'Crítico';
    }
  }

  private mapUnifiedToProjectState(state: UnifiedState): any {
    switch (state) {
      case 'Saudável': return 'BOM';
      case 'Em Risco': return 'ESTÁVEL';
      case 'Crítico': return 'CRÍTICO';
    }
  }

  private mapProjectToUnifiedState(state: any): UnifiedState {
    switch (state) {
      case 'EXCELENTE':
      case 'BOM':
        return 'Saudável';
      case 'ESTÁVEL':
        return 'Em Risco';
      case 'RISCO':
      case 'CRÍTICO':
        return 'Crítico';
      default:
        return 'Em Risco';
    }
  }

  private getStateId(state: UnifiedState): number {
    switch (state) {
      case 'Saudável': return 1;
      case 'Em Risco': return 2;
      case 'Crítico': return 3;
    }
  }

  getProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  getSprintHistory(projectId: string): SprintLog[] {
    return this.sprintHistory.get(projectId) || [];
  }
}

export const scrumMarkovAPI = SimpleScrumMarkovAPI.getInstance();