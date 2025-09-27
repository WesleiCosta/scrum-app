/**
 * Motor de Processamento Cíclico - Implementação da Especificação Seção 3
 * Sistema Scrum-Markov para Análise Preditiva de Projetos Ágeis
 * 
 * Este módulo implementa os algoritmos centrais da metodologia Scrum-Markov:
 * - Classificação de Estado de Sprint (Seção 3.1)
 * - Cálculo da Matriz de Transição Dinâmica Pd (Seção 3.2) 
 * - Geração de Previsão de Estados Futuros (Seção 3.3)
 */

import { 
  UnifiedState, 
  TransitionMatrix, 
  StatePrediction, 
  RubricCriterion,
  UNIFIED_STATE_MAP 
} from '../types';

// Função de log condicional para desenvolvimento
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const devLog = {
  warn: (message: string, ...args: any[]) => isDev && console.warn(message, ...args),
  error: (message: string, ...args: any[]) => isDev && console.error(message, ...args)
};

export class ScrumMarkovEngine {
  /**
   * Algoritmo de Classificação de Estado de Sprint - Seção 3.1
   * Implementa a lógica de avaliação de rubrica com ordem de criticidade
   */
  static classifySprintState(
    sprintMetrics: Record<string, number>, 
    rubricCriteria: RubricCriterion[]
  ): UnifiedState {
    // Validação de entrada
    if (!sprintMetrics || typeof sprintMetrics !== 'object') {
      devLog.warn('Métricas de sprint inválidas ou ausentes. Usando fallback.');
      return 'Em Risco';
    }
    
    if (!rubricCriteria || rubricCriteria.length === 0) {
      devLog.warn('Critérios de rubrica ausentes. Usando fallback.');
      return 'Em Risco';
    }
    // Agrupar critérios por estado, ordenados por criticidade (3 -> 2 -> 1)
    const criteriaByState = rubricCriteria
      .sort((a, b) => b.stateId - a.stateId) // Ordem decrescente: Crítico -> Risco -> Saudável
      .reduce((acc, criterion) => {
        const stateIndex = criterion.stateId;
        if (!acc[stateIndex]) acc[stateIndex] = [];
        acc[stateIndex].push(criterion);
        return acc;
      }, {} as Record<number, RubricCriterion[]>);

    // Avaliar estados em ordem de criticidade (mais crítico primeiro)
    for (const stateId of [4, 3, 2, 1, 0]) { // Crítico, Em Risco, Estável, Bom, Excelente
      const criteria = criteriaByState[stateId];
      if (!criteria || criteria.length === 0) continue;

      // Lógica AND: todos os critérios devem ser satisfeitos
      const allCriteriaMet = criteria.every(criterion => 
        this.evaluateCriterion(sprintMetrics[criterion.metricName], criterion)
      );

      if (allCriteriaMet) {
        return this.getStateByIndex(stateId);
      }
    }

    // Fallback: se nenhuma regra correspondeu, usar estado conservador
    devLog.warn('Nenhum critério de rubrica correspondeu às métricas da sprint. Usando fallback para estado Em Risco.');
    return 'Em Risco';
  }

  /**
   * Avalia um critério individual da rubrica
   */
  private static evaluateCriterion(metricValue: number, criterion: RubricCriterion): boolean {
    if (metricValue === undefined || metricValue === null) return false;

    switch (criterion.operator) {
      case 'GTE': return metricValue >= criterion.thresholdValue;
      case 'LTE': return metricValue <= criterion.thresholdValue;
      case 'GT': return metricValue > criterion.thresholdValue;
      case 'LT': return metricValue < criterion.thresholdValue;
      case 'EQ': {
        const TOLERANCE = 0.001; // Tolerância padronizada em todo o sistema
        return Math.abs(metricValue - criterion.thresholdValue) < TOLERANCE;
      }
      default: return false;
    }
  }

  /**
   * Converte índice numérico para estado unificado
   */
  private static getStateByIndex(index: number): UnifiedState {
    // Mapear 5 estados para 3 estados unificados
    // 0=Excelente, 1=Bom -> Saudável
    // 2=Estável -> Em Risco
    // 3=Em Risco, 4=Crítico -> Crítico
    if (index <= 1) return 'Saudável';  // Excelente ou Bom
    if (index === 2) return 'Em Risco';  // Estável 
    if (index >= 3) return 'Crítico';   // Em Risco ou Crítico
    return 'Em Risco'; // Fallback
  }

  /**
   * Algoritmo de Cálculo da Matriz de Transição Dinâmica Pd - Seção 3.2
   * Implementa a fórmula: Pij = nij / Σk(nik)
   */
  static calculateDynamicTransitionMatrix(
    stateHistory: UnifiedState[], 
    windowSize: number
  ): TransitionMatrix {
    if (stateHistory.length < 2) {
      // Retornar matriz uniforme se não houver dados suficientes
      return [[1/3, 1/3, 1/3], [1/3, 1/3, 1/3], [1/3, 1/3, 1/3]];
    }

    // Usar apenas os últimos N+1 estados para N transições
    const effectiveHistory = stateHistory.slice(-Math.min(windowSize + 1, stateHistory.length));
    
    if (effectiveHistory.length < 2) {
      return [[1/3, 1/3, 1/3], [1/3, 1/3, 1/3], [1/3, 1/3, 1/3]];
    }

    // Inicializar contadores de transição T[i][j] e contadores de origem C[i]
    const transitionCounts: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const originCounts: number[] = [0, 0, 0];

    // Contar transições na janela deslizante
    for (let t = 0; t < effectiveHistory.length - 1; t++) {
      const fromState = effectiveHistory[t];
      const toState = effectiveHistory[t + 1];
      const fromIndex = UNIFIED_STATE_MAP[fromState];
      const toIndex = UNIFIED_STATE_MAP[toState];

      transitionCounts[fromIndex][toIndex] += 1;
      originCounts[fromIndex] += 1;
    }

    // Calcular matriz Pd por normalização
    const matrix: TransitionMatrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

    for (let i = 0; i < 3; i++) {
      if (originCounts[i] > 0) {
        // Caso normal: estado i foi observado como origem
        for (let j = 0; j < 3; j++) {
          matrix[i][j] = transitionCounts[i][j] / originCounts[i];
        }
      } else {
        // Caso de borda: aplicar estratégia de auto-transição
        console.warn(`Estado ${this.getStateByIndex(i)} não foi observado como origem na janela atual. Aplicando auto-transição.`);
        matrix[i] = [0, 0, 0];
        matrix[i][i] = 1.0; // 100% probabilidade de permanecer no mesmo estado
      }
    }

    return matrix;
  }

  /**
   * Algoritmo de Geração de Previsão de Estados Futuros - Seção 3.3
   * Implementa a fórmula: S_{t+k} = S_t × P^k
   */
  static generateFuturePredictions(
    currentState: UnifiedState,
    transitionMatrix: TransitionMatrix,
    steps: number
  ): StatePrediction[] {
    const predictions: StatePrediction[] = [];
    
    // Converter estado atual para vetor one-hot
    const currentStateVector = this.createOneHotVector(currentState);
    let previousVector = [...currentStateVector];

    // Calcular previsões iterativamente
    for (let k = 1; k <= steps; k++) {
      const nextVector = this.multiplyVectorMatrix(previousVector, transitionMatrix);
      
      predictions.push({
        step: k,
        probabilities: [...nextVector],
        confidence: this.calculateConfidence(k),
        calculatedAt: new Date().toISOString()
      });

      previousVector = [...nextVector];
    }

    return predictions;
  }

  /**
   * Cria vetor one-hot para o estado atual
   */
  private static createOneHotVector(state: UnifiedState): number[] {
    const vector = [0, 0, 0];
    vector[UNIFIED_STATE_MAP[state]] = 1;
    return vector;
  }

  /**
   * Multiplicação vetor × matriz: S_{t+1} = S_t × P
   */
  private static multiplyVectorMatrix(vector: number[], matrix: TransitionMatrix): number[] {
    const result = [0, 0, 0];
    
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        result[j] += vector[i] * matrix[i][j];
      }
    }
    
    return result;
  }

  /**
   * Calcula nível de confiança baseado no número de passos
   */
  private static calculateConfidence(currentStep: number): 'Baixa' | 'Média' | 'Alta' {
    if (currentStep <= 2) return 'Alta';
    if (currentStep <= 5) return 'Média';
    return 'Baixa';
  }

  /**
   * Exponenciação de Matriz - Otimização para previsões de longo prazo
   * Calcula P^k usando exponenciação por quadratura (O(log k))
   */
  static matrixPower(matrix: TransitionMatrix, power: number): TransitionMatrix {
    if (power === 0) {
      // Matriz identidade
      return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    }
    
    if (power === 1) {
      return matrix.map(row => [...row]);
    }

    // Exponenciação por quadratura
    if (power % 2 === 0) {
      const halfPower = this.matrixPower(matrix, power / 2);
      return this.multiplyMatrices(halfPower, halfPower);
    } else {
      return this.multiplyMatrices(matrix, this.matrixPower(matrix, power - 1));
    }
  }

  /**
   * Multiplicação de duas matrizes 3x3
   */
  private static multiplyMatrices(a: TransitionMatrix, b: TransitionMatrix): TransitionMatrix {
    const result: TransitionMatrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    
    return result;
  }

  /**
   * Validação de Matriz Estocástica - Seção 2.3
   * Verifica se cada linha soma 1.0 com tolerância para ponto flutuante
   */
  static validateStochasticMatrix(matrix: TransitionMatrix): boolean {
    const tolerance = 0.001; // Tolerância padronizada em todo o sistema
    
    return matrix.every(row => {
      const sum = row.reduce((acc, val) => acc + val, 0);
      return Math.abs(sum - 1.0) <= tolerance;
    });
  }

  /**
   * Normalizar Matriz - Garante propriedade estocástica
   */
  static normalizeMatrix(matrix: TransitionMatrix): TransitionMatrix {
    return matrix.map(row => {
      const sum = row.reduce((acc, val) => acc + val, 0);
      return sum > 0 ? row.map(val => val / sum) : [1/3, 1/3, 1/3];
    });
  }
}

/**
 * Utilitários para Análise de Cenários "What-If" - Seção 5.3
 */
export class ScenarioAnalysisUtils {
  /**
   * Compara duas matrizes de transição para análise de impacto
   */
  static compareMatrices(
    baseMatrix: TransitionMatrix, 
    scenarioMatrix: TransitionMatrix
  ): { maxDifference: number; significantChanges: boolean } {
    let maxDiff = 0;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const diff = Math.abs(baseMatrix[i][j] - scenarioMatrix[i][j]);
        maxDiff = Math.max(maxDiff, diff);
      }
    }
    
    return {
      maxDifference: maxDiff,
      significantChanges: maxDiff > 0.1 // Mudança > 10%
    };
  }

  /**
   * Gera previsões comparativas para análise "What-If"
   */
  static generateComparativePredictions(
    currentState: UnifiedState,
    baseMatrix: TransitionMatrix,
    scenarioMatrix: TransitionMatrix,
    steps: number
  ): { base: StatePrediction[]; scenario: StatePrediction[] } {
    return {
      base: ScrumMarkovEngine.generateFuturePredictions(currentState, baseMatrix, steps),
      scenario: ScrumMarkovEngine.generateFuturePredictions(currentState, scenarioMatrix, steps)
    };
  }
}