/**
 * Serviço de Gerenciamento de Rubricas - Implementação da Especificação Seção 2.2
 * Sistema Scrum-Markov para Análise Preditiva de Projetos Ágeis
 */

import { Rubric, RubricCriterion, ComparisonOperator } from '../types';
import { generateId } from './storage';

export class RubricService {
  private static STORAGE_KEY = 'scrum-markov-rubrics';

  /**
   * Obter todas as rubricas
   */
  static getRubrics(): Rubric[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar rubricas:', error);
      return [];
    }
  }

  /**
   * Obter rubricas por projeto
   */
  static getRubricsByProject(projectId: string): Rubric[] {
    return this.getRubrics().filter(rubric => rubric.projectId === projectId);
  }

  /**
   * Obter rubrica ativa de um projeto
   */
  static getActiveRubric(projectId: string): Rubric | null {
    const rubrics = this.getRubricsByProject(projectId);
    return rubrics.find(rubric => rubric.isActive) || null;
  }

  /**
   * Criar nova rubrica
   */
  static createRubric(
    projectId: string, 
    name: string, 
    criteria: RubricCriterion[]
  ): Rubric {
    const rubrics = this.getRubrics();
    
    const newRubric: Rubric = {
      id: generateId(),
      projectId,
      name,
      isActive: false,
      criteria,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    rubrics.push(newRubric);
    this.saveRubrics(rubrics);
    
    return newRubric;
  }

  /**
   * Atualizar rubrica existente
   */
  static updateRubric(rubricId: string, updates: Partial<Rubric>): boolean {
    const rubrics = this.getRubrics();
    const index = rubrics.findIndex(r => r.id === rubricId);
    
    if (index === -1) return false;

    rubrics[index] = {
      ...rubrics[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveRubrics(rubrics);
    return true;
  }

  /**
   * Ativar rubrica (desativa outras do mesmo projeto)
   */
  static activateRubric(projectId: string, rubricId: string): boolean {
    const rubrics = this.getRubrics();
    let updated = false;

    // Desativar todas as rubricas do projeto
    rubrics.forEach(rubric => {
      if (rubric.projectId === projectId) {
        if (rubric.isActive) {
          rubric.isActive = false;
          rubric.updatedAt = new Date().toISOString();
          updated = true;
        }
      }
    });

    // Ativar a rubrica especificada
    const targetRubric = rubrics.find(r => r.id === rubricId);
    if (targetRubric) {
      targetRubric.isActive = true;
      targetRubric.updatedAt = new Date().toISOString();
      updated = true;
    }

    if (updated) {
      this.saveRubrics(rubrics);
    }

    return !!targetRubric;
  }

  /**
   * Remover rubrica
   */
  static deleteRubric(rubricId: string): boolean {
    const rubrics = this.getRubrics();
    const filtered = rubrics.filter(r => r.id !== rubricId);
    
    if (filtered.length !== rubrics.length) {
      this.saveRubrics(filtered);
      return true;
    }
    
    return false;
  }

  /**
   * Criar rubrica padrão para projeto
   */
  static createDefaultRubric(projectId: string): Rubric {
    const defaultCriteria: RubricCriterion[] = [
      // Critérios para Estado Saudável (id 0-2)
      {
        id: generateId(),
        stateId: 0, // Excelente
        metricName: 'velocityPoints',
        operator: 'GTE' as ComparisonOperator,
        thresholdValue: 90,
        description: 'Velocidade >= 90 pontos indica excelência'
      },
      {
        id: generateId(),
        stateId: 1, // Bom
        metricName: 'velocityPoints',
        operator: 'GTE' as ComparisonOperator,
        thresholdValue: 70,
        description: 'Velocidade >= 70 pontos indica bom desempenho'
      },
      {
        id: generateId(),
        stateId: 2, // Estável
        metricName: 'velocityPoints',
        operator: 'GTE' as ComparisonOperator,
        thresholdValue: 50,
        description: 'Velocidade >= 50 pontos indica estabilidade'
      },
      // Critérios para Estado Em Risco
      {
        id: generateId(),
        stateId: 3, // Em Risco
        metricName: 'velocityPoints',
        operator: 'LT' as ComparisonOperator,
        thresholdValue: 50,
        description: 'Velocidade < 50 pontos indica risco'
      },
      // Critérios para Estado Crítico
      {
        id: generateId(),
        stateId: 4, // Crítico
        metricName: 'velocityPoints',
        operator: 'LTE' as ComparisonOperator,
        thresholdValue: 30,
        description: 'Velocidade <= 30 pontos indica situação crítica'
      }
    ];

    return this.createRubric(projectId, 'Rubrica Padrão', defaultCriteria);
  }

  /**
   * Validar critério de rubrica
   */
  static validateCriterion(
    value: number,
    operator: ComparisonOperator,
    threshold: number
  ): boolean {
    switch (operator) {
      case 'GTE': return value >= threshold;
      case 'LTE': return value <= threshold;
      case 'EQ': return value === threshold;
      case 'GT': return value > threshold;
      case 'LT': return value < threshold;
      default: return false;
    }
  }

  /**
   * Salvar rubricas no localStorage
   */
  private static saveRubrics(rubrics: Rubric[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rubrics));
    } catch (error) {
      console.error('Erro ao salvar rubricas:', error);
    }
  }
}